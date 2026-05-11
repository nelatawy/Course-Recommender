from abc import ABC, abstractmethod

from pyswip import Prolog


class CurriculumCycleError(Exception):
    pass

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

    """Initialize a new prolog thread using pyswip"""
    def __enter__(self):
        self.prolog_thread = Prolog()
        self.prolog_thread._init_prolog_thread()
        return self

    """terminate a prolog thread after finishing"""
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.prolog_thread=None
        return False

    """
    load the courses and courses prerequisites from django and send it to prolog and then apply topo sort to
    validate that it is a DAG
    """
    def load_course_and_validate(self, all_courses):
        names:list[str]=[]
        for course in all_courses:
            names.append(f"'{course.name}'")
            for prerequisite in course.prerequisites.all():
                self.prolog_thread.assertz(f"prereq('{prerequisite.name}', '{course.name}')")
        self.prolog_thread.assertz(f"courses([{', '.join(names)}])")

        results=list(self.prolog_thread.query("topo_sort(X)"))
        if len(results)==0: raise CurriculumCycleError()
        
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


