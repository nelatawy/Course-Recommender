from smart_advisor.core.student_advisor_strategy.master_advisor_strategy import MasterAdvisorStrategy

import json
import google.generativeai as genai
from django.conf import settings


class AIEngineAdapter(MasterAdvisorStrategy):

    def generate_plan(self, student, all_courses):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")

        # Build context strings from Django model data
        completed_names = [c.name for c in student.completed_courses.all()]

        available_courses = [
            {
                "name": c.name,
                "level": c.level,
                "credits": c.credits,
                "department": c.course_department,
                "prerequisites": [p.name for p in c.prerequisites.all()]
            }
            for c in all_courses
            if c.name not in completed_names 
        ]

        # Write the prompt
        prompt = f"""
You are a university course advisor. Based on the student's profile and the available courses, 
recommend which courses this student should take next.

Student Profile:
- Name: {student.name}
- Current Level: {student.current_level}
- GPA: {student.gpa}
- Completed Courses: {completed_names}

Available Courses :
{json.dumps(available_courses, indent=2)}

Rules:
- Only recommend courses whose prerequisites are all in the student's completed courses list.
- Prefer courses that match the student's current level.
- If GPA is below 2.0, recommend easier (lower-level) courses first.
- Do NOT recommend courses already completed.

Respond ONLY with a valid JSON array of course name strings. No explanation, no markdown, no extra text.
Example: ["Data Structures", "Algorithms", "AI"]
"""

        # Calling Gemini and parse the response
        response = model.generate_content(prompt)
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