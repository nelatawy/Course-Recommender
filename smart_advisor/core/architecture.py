from abc import ABC, abstractmethod
from pathlib import Path

from core.models import Course

try:
    from pyswip import Prolog
except Exception as e:
    Prolog = None
    print(f"Warning: Failed to import pyswip ({e}). Prolog recommendations will fail.")


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
    _instance = None
    """Initialize a new prolog thread using pyswip"""

    def __enter__(self):
        if Prolog is None:
            raise RuntimeError("Prolog is not installed. Cannot use PrologAdapter.")
        if PrologAdapter._instance is None:
            PrologAdapter._instance = Prolog()
            PrologAdapter._instance.consult(str(Path(__file__).parent.parent.parent / "recommendation-engine.pl"))
        self.prolog_thread = PrologAdapter._instance
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
        self._retract()
        names:list[str]=[]
        for course in all_courses:
            names.append(f"'{course.name.lower()}'")
            self.prolog_thread.assertz(f"difficulty('{course.name.lower()}',{course.DIFFICULTY_TO_PROLOG[course.difficulty.lower()]})")
            self.prolog_thread.assertz(f"level('{course.name.lower()}',{course.level})")
            for prerequisite in course.prerequisites.all():
                self.prolog_thread.assertz(f"prereq('{prerequisite.name.lower()}', '{course.name.lower()}')")
        self.prolog_thread.assertz(f"courses([{', '.join(names)}])")

        results=list(self.prolog_thread.query("topo_sort(X)"))
        if len(results)==0: raise CurriculumCycleError()
        
    def get_bestfit_course(self, student):
        self.prolog_thread.assertz(f"student_level({student.current_level})")
        self.prolog_thread.assertz(f"student_pref_diff({student.DIFFICULTY_TO_PROLOG[student.preferred_difficulty.lower()]})")
        for course in student.completed_courses.all():
            self.prolog_thread.assertz(f"taken('{course.name.lower()}')")
            #print(f"asserting taken: {course.name.lower()}")
        for preference in student.preferred_subjects:
            self.prolog_thread.assertz(f"preferred('{preference.lower()}')")
        results=list(self.prolog_thread.query("recommend(Course, Level)"))
        #print(results)
        course_names=[]
        for result in results:
            course_names.append(result["Course"])
        recommended_courses = [Course.objects.get(name__iexact=name) for name in course_names]
        return sorted(recommended_courses, key=lambda course: course_names.index(course.name.lower()))

    def _retract(self):
        self.prolog_thread.retractall("courses(_)")
        self.prolog_thread.retractall("prereq(_, _)")
        self.prolog_thread.retractall("taken(_)")
        self.prolog_thread.retractall("difficulty(_, _)")
        self.prolog_thread.retractall("level(_, _)")
        self.prolog_thread.retractall("student_level(_)")
        self.prolog_thread.retractall("student_pref_diff(_)")
        self.prolog_thread.retractall("preferred(_)")


class RankingStrategy(ABC):
    @abstractmethod
    def apply(self, courses: list, student) -> list: pass

class FunctionalRanking(RankingStrategy):
    def apply(self, courses, student):
        seen = set()
        unique_courses:list[str]=[]
        for course in courses:
            if course.name not in seen:
                unique_courses.append(course)
                seen.add(course.name)
        return unique_courses

