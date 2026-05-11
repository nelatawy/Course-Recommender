from abc import abstractmethod, ABC


# ==========================================
# 1. THE MASTER ORGANIZER (Isolates AI vs Prolog)
# ==========================================
class MasterAdvisorStrategy(ABC):
    """Both Person 3 (Prolog) and Person 4 (AI) must implement this exact method."""
    @abstractmethod
    def generate_plan(self, student, all_courses) -> list[str]:
        """Must return a Python list of Course names (Strings)."""
        pass