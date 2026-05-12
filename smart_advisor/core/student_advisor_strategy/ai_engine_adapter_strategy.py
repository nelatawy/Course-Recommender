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