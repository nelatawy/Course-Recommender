from core.student_advisor_strategy.master_advisor_strategy import MasterAdvisorStrategy

import json
from google import genai
from django.conf import settings


class AIEngineAdapter(MasterAdvisorStrategy):

    def generate_plan(self, student, all_courses):
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        # Build context strings from Django model data
        completed_names = [c.name for c in student.completed_courses.all()]

        available_courses = [
            {
                "name": c.name,
                "level": c.level,
                "difficulty": c.difficulty,
                "prerequisites": [p.name for p in c.prerequisites.all()]
            }
            for c in all_courses
            if c.name not in completed_names 
        ]

        from core.models import Course
        preferred_ids = student.preferred_subjects or []
        preferred_course_names = list(
            Course.objects.filter(id__in=preferred_ids).values_list('name', flat=True)
        )
        preferred_difficulty = student.preferred_difficulty

        # Write the prompt
        prompt = f"""
You are a university course advisor. Based on the student's profile and the available courses, 
recommend which courses this student should take next.

Student Profile:
- Name: {student.name}
- Current Level: {student.current_level}
- Completed Courses: {completed_names}
- Preferred Subjects: {preferred_course_names}
- Preferred Difficulty: {preferred_difficulty}

Available Courses :
{json.dumps(available_courses, indent=2)}

Rules:
- Only recommend courses whose prerequisites are all in the student's completed courses list.
- Prefer courses that match the student's current level.
- Try to recommend courses that match the student's preferred subjects.
- Try to recommend courses whose difficulty matches or is lower than the student's preferred difficulty.
- Do NOT recommend courses already completed.

Respond ONLY with a valid JSON array of course name strings. No explanation, no markdown, no extra text.
Example: ["Data Structures", "Algorithms", "AI"]
"""

        # Calling Gemini and parse the response
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        raw_text = response.text.strip()

        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
            raw_text = raw_text.strip()

        recommended_names = json.loads(raw_text)

        # only return names that actually exist in DB
        all_course_names = {c.name for c in all_courses}
        return [name for name in recommended_names if name in all_course_names]

    def _build_context(self, student, all_courses):
        """Build shared context for both plan and next-course prompts."""
        completed_names = [c.name for c in student.completed_courses.all()]

        available_courses = [
            {
                "name": c.name,
                "level": c.level,
                "difficulty": c.difficulty,
                "prerequisites": [p.name for p in c.prerequisites.all()]
            }
            for c in all_courses
            if c.name not in completed_names
        ]

        from core.models import Course
        preferred_ids = student.preferred_subjects or []
        preferred_course_names = list(
            Course.objects.filter(id__in=preferred_ids).values_list('name', flat=True)
        )

        return {
            "completed_names": completed_names,
            "available_courses": available_courses,
            "preferred_course_names": preferred_course_names,
            "preferred_difficulty": student.preferred_difficulty,
        }

    def generate_next_course(self, student, all_courses):
        """Return the single best next course with a brief reason.

        Returns a dict: {"course": "<name>", "reason": "<why>"}
        or None if no courses are available.
        """
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        ctx = self._build_context(student, all_courses)

        if not ctx["available_courses"]:
            return None

        prompt = f"""
You are a university course advisor. Pick the single best NEXT course for this student.

Student Profile:
- Name: {student.name}
- Current Level: {student.current_level}
- Completed Courses: {ctx["completed_names"]}
- Preferred Subjects: {ctx["preferred_course_names"]}
- Preferred Difficulty: {ctx["preferred_difficulty"]}

Available Courses:
{json.dumps(ctx["available_courses"], indent=2)}

Rules:
- Only pick a course whose prerequisites are ALL in the completed courses list.
- Prefer courses matching the student's current level and preferred difficulty.
- Prefer courses the student has starred as preferred.
- Do NOT pick a course already completed.

Respond ONLY with a valid JSON object (no markdown, no extra text):
{{"course": "<exact course name>", "reason": "<one sentence why>"}}
"""

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        raw_text = response.text.strip()

        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
            raw_text = raw_text.strip()

        result = json.loads(raw_text)

        # Validate the course exists
        all_course_names = {c.name for c in all_courses}
        if result.get("course") not in all_course_names:
            return None

        return result