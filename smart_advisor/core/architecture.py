from abc import ABC, abstractmethod

class CurriculumCycleError(Exception):
    pass

# ==========================================
# 1. THE MASTER ORGANIZER (Isolates AI vs Prolog)
# ==========================================
class MasterAdvisorStrategy(ABC):
    """Both Person 3 (Prolog) and Person 4 (AI) must implement this exact method."""
    @abstractmethod
    def generate_plan(self, student, all_courses) -> list[str]:
        """Must return a Python list of Course names (Strings)."""
        pass

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

# ==========================================
# 3. PERSON 3's DOMAIN (The Prolog/Functional Setup)
# ==========================================
class LogicEngineInterface(ABC):
    @abstractmethod
    def __enter__(self): pass 
    @abstractmethod
    def __exit__(self, exc_type, exc_val, exc_tb): pass 
    @abstractmethod
    def load_course_and_validate(self, all_courses): pass
    @abstractmethod
    def get_bestfit_course(self, student) -> list: pass

class PrologAdapter(LogicEngineInterface):
    def __enter__(self):
        # TODO Person 3: Open thread
        return self
    def __exit__(self, exc_type, exc_val, exc_tb):
        # TODO Person 3: Kill thread
        pass
    def load_course_and_validate(self, all_courses):
        # TODO Person 3: Assert courses/prereqs, run topo_sort
        pass
    def get_bestfit_course(self, student):
        # TODO Person 3: Assert user facts, loop recommend/1, return Course objects
        return []

class RankingStrategy(ABC):
    @abstractmethod
    def apply(self, courses: list, student) -> list: pass

class FunctionalRanking(RankingStrategy):
    def apply(self, courses, student):
        # TODO Person 3: Map/Filter the raw list
        return courses

# This Facade wraps Person 3's work to match the Master Organizer
class HybridPrologEngine(MasterAdvisorStrategy):
    def __init__(self, logic_engine: LogicEngineInterface, strategies: list[RankingStrategy]):
        self.logic_engine = logic_engine
        self.strategies = strategies

    def generate_plan(self, student, all_courses):
        # 1. Validate
        self.logic_engine.load_course_and_validate(all_courses)
        # 2. Logic Paradigm
        eligible = self.logic_engine.get_bestfit_course(student)
        # 3. Functional Paradigm
        for strategy in self.strategies:
            eligible = strategy.apply(eligible, student)
        # 4. Format for the Master Organizer rule (return strings)
        return [course.name for course in eligible]