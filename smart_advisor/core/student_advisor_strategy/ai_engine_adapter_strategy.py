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

        preferred_lower = [p.lower() for p in preferred_course_names]
        available_courses = [
            {
                "name": c.name,
                "level": c.level,
                "difficulty": c.difficulty,
                "prerequisites": [p.name for p in c.prerequisites.all()],
                "is_preferred": c.name.lower() in preferred_lower,
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
You are a university course advisor. Follow these steps EXACTLY in order.

---
STUDENT:
- Level: {ctx["current_level"]}
- Completed: {ctx["completed_names"]}
- Preferred Subjects: {ctx["preferred_course_names"]}
- Preferred Difficulty: {ctx["preferred_difficulty"]}

---
STEP 1 — FILTER ELIGIBLE COURSES:
Keep only courses where BOTH conditions are true:
  A) course level <= {ctx["current_level"]}
  B) every course in the prerequisites list is inside the student's completed list.
Discard any course that fails either condition.

STEP 2 — READ THE FLAGS:
Each eligible course has two precomputed boolean flags:
  - "is_preferred": already tells you if this course is a preferred subject. DO NOT re-evaluate this.
  - "difficulty_matches": already tells you if the difficulty matches. DO NOT re-evaluate this.

STEP 3 — ASSIGN TIER:
Use ONLY the flags from Step 2:
  - PLATINUM : is_preferred=true  AND difficulty_matches=true
  - GOLD     : is_preferred=true  AND difficulty_matches=false
  - SILVER   : is_preferred=false AND difficulty_matches=true
  - BRONZE   : is_preferred=false AND difficulty_matches=false

---
AVAILABLE COURSES:
{json.dumps(ctx["available_courses"], indent=2)}

---
Respond ONLY with a valid JSON array of course name strings. No markdown, no explanation.
Example: ["Course A", "Course B", "Course C"]
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

        eligible_names = json.loads(raw_text)

        # Validate against actual DB courses
        all_course_names = {c.name for c in all_courses}
        eligible_names = [n for n in eligible_names if n in all_course_names]

        # Python handles the deterministic tier sorting
        course_flags = {c["name"]: c for c in ctx["available_courses"]}

        print("Eligible from Gemini:", eligible_names)
        print("Course flags:", json.dumps(course_flags, indent=2))

        def tier(name):
            c = course_flags.get(name, {})
            is_preferred = c.get("is_preferred", False)
            diff_matches = c.get("difficulty_matches", False)
            if is_preferred and diff_matches:     return 0  # PLATINUM
            if is_preferred and not diff_matches: return 1  # GOLD
            if not is_preferred and diff_matches: return 2  # SILVER
            return 3                                        # BRONZE

        return sorted(eligible_names, key=tier)