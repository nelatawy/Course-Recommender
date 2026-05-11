from smart_advisor.core.student_advisor_strategy.master_advisor_strategy import MasterAdvisorStrategy


# ==========================================
# 2. PERSON 4's DOMAIN (The AI Adapter)
# ==========================================
class AIEngineAdapter(MasterAdvisorStrategy):
    def generate_plan(self, student, all_courses):
        # TODO Person 4:
        # 1. Setup your Gemini API Key here.
        # 2. Write a prompt passing in student.completed_courses and all_courses.
        # 3. Parse the LLM response.
        # 4. Return a Python list of exact course names (e.g., ["Data Structures", "AI"]).
        return []
