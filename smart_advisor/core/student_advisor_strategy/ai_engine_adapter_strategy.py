from core.student_advisor_strategy.master_advisor_strategy import MasterAdvisorStrategy
import json
from google import genai
from django.conf import settings


class AIEngineAdapter(MasterAdvisorStrategy):

    def _build_context(self, student, all_courses):
        completed_names = [c.name for c in student.completed_courses.all()]
        preferred_course_names = student.preferred_subjects or []
        preferred_difficulty = student.preferred_difficulty

        full_curriculum = [
            {
                "name": c.name,
                "level": c.level,
                "difficulty": c.difficulty,
                "prerequisites": [p.name for p in c.prerequisites.all()]
            }
            for c in all_courses
        ]

        # Pre-compute flags so Gemini doesn't have to guess
        available_courses = [
            {
                "name": c.name,
                "level": c.level,
                "difficulty": c.difficulty,
                "prerequisites": [p.name for p in c.prerequisites.all()],
                "is_preferred": c.name in preferred_course_names,
                "difficulty_matches": c.difficulty == preferred_difficulty
            }
            for c in all_courses
            if c.name not in completed_names
        ]

        return {
            "completed_names": completed_names,
            "full_curriculum": full_curriculum,
            "available_courses": available_courses,
            "preferred_course_names": preferred_course_names,
            "preferred_difficulty": preferred_difficulty,
            "current_level": student.current_level,
            "student_name": student.name
        }

    def generate_plan(self, student, all_courses):
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        ctx = self._build_context(student, all_courses)

        prompt = f"""
You are a university course advisor. Recommend courses the student can take immediately.

STUDENT PROFILE:
- Name: {ctx["student_name"]}
- Current Level: {ctx["current_level"]}
- Completed Courses: {ctx["completed_names"]}
- Preferred Subjects: {ctx["preferred_course_names"]}
- Preferred Difficulty: {ctx["preferred_difficulty"]}

TASK:
1. From the available courses, keep only those where:
   - level <= {ctx["current_level"]}
   - ALL prerequisites are in the completed courses list.
2. Each course already has two precomputed flags:
   - "is_preferred": true if the course is in the student's preferred subjects.
   - "difficulty_matches": true if the course difficulty matches the student's preferred difficulty.
3. Assign a tier based on these flags:
   - PLATINUM: is_preferred=true  AND difficulty_matches=true
   - GOLD:     is_preferred=true  AND difficulty_matches=false
   - SILVER:   is_preferred=false AND difficulty_matches=true
   - BRONZE:   is_preferred=false AND difficulty_matches=false
4. Sort output: PLATINUM first, then GOLD, SILVER, BRONZE.
   Within the same tier, order does not matter.

IMPORTANT: Use ONLY the "is_preferred" and "difficulty_matches" flags for tiering.
Do NOT re-evaluate or override them based on course names.

AVAILABLE COURSES:
{json.dumps(ctx["available_courses"], indent=2)}

RESPONSE FORMAT (respond ONLY with valid JSON, no markdown, no extra text):
{{
  "recommendations": [
    {{"name": "Course Name", "tier": "GOLD"}},
    {{"name": "Next Course", "tier": "SILVER"}}
  ]
}}
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

        data = json.loads(raw_text)
        recommended_items = data.get("recommendations", [])
        recommended_names = [item["name"] for item in recommended_items if isinstance(item, dict)]

        all_course_names = {c.name for c in all_courses}
        return [name for name in recommended_names if name in all_course_names]