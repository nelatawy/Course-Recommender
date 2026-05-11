from smart_advisor.core.architecture import LogicEngineInterface, RankingStrategy
from smart_advisor.core.student_advisor_strategy.master_advisor_strategy import MasterAdvisorStrategy

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