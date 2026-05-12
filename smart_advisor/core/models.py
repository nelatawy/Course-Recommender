from django.db import models


class UniversalTimeObserver(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Course(UniversalTimeObserver):
    LEVEL_CHOICES = [(1, "Level 1"), (2, "Level 2"), (3, "Level 3"), (4, "Level 4")]

    DIFFICULTY_CHOICES = [
        ("easy", "Easy"),
        ("medium", "Medium"),
        ("hard", "Hard"),
        ("very_hard", "Very Hard"),
    ]

    DIFFICULTY_TO_PROLOG = {
        "easy": 0,
        "medium": 1,
        "hard": 2,
        "very_hard": 3,
    }

    name = models.CharField(max_length=150, unique=True)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default="medium")
    level = models.IntegerField(choices=LEVEL_CHOICES)
    course_department = models.CharField(max_length=10, default="CSE")
    prerequisites = models.ManyToManyField("self", symmetrical=False, blank=True,related_name="required_by")

    def __str__(self):
        return f"{self.name} (Level {self.level}, {self.get_difficulty_display()})"

    def meets_prerequisites(self, student):
        required_prereqs = set(self.prerequisites.all())
        completed = set(student.completed_courses.all())
        return required_prereqs.issubset(completed)


class Student(UniversalTimeObserver):
    DIFFICULTY_CEILING_CHOICES = [
        ("easy",      "Easy"),
        ("medium",    "Medium"),
        ("hard",      "Hard"),
        ("very_hard", "Very Hard"),
    ]

    DIFFICULTY_TO_PROLOG = {
        "easy":      0,
        "medium":    1,
        "hard":      2,
        "very_hard": 3,
    }

    name = models.CharField(max_length=100)
    student_id = models.CharField(max_length=20, unique=True)
    current_level = models.IntegerField(choices=Course.LEVEL_CHOICES, default=1)
    gpa = models.FloatField(default=0.0)
    completed_courses = models.ManyToManyField(Course, related_name="completed_by", blank=True)
    preferred_subjects = models.JSONField(default=list, blank=True)
    preferred_difficulty = models.CharField(
        max_length=10,
        choices=DIFFICULTY_CEILING_CHOICES,
        default="hard",
    )

    def clean(self):
        from django.core.exceptions import ValidationError
        if not isinstance(self.preferred_subjects, list) or not all(
            isinstance(s, str) for s in self.preferred_subjects
        ):
            raise ValidationError("preferred_subjects must be a list of strings.")

    def __str__(self):
        return f"{self.name} (Level {self.current_level})"

class StudyPlan(UniversalTimeObserver):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="study_plans")
    recommended_courses = models.ManyToManyField(Course,blank=True)
    generated_by = models.CharField(max_length=50)

    def __str__(self):
        return f"Plan for {self.student.name} via {self.generated_by}"