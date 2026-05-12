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

    name = models.CharField(max_length=150, unique=True)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default="medium")
    level = models.IntegerField(choices=LEVEL_CHOICES)
    course_department = models.CharField(max_length=10, default="CSE")
    prerequisites = models.ManyToManyField("self", symmetrical=False, blank=True)

    def __str__(self):
        return f"{self.name} (Level {self.level}, {self.get_difficulty_display()})"

    def meets_prerequisites(self, student):
        required_prereqs = set(self.prerequisites.all())
        completed = set(student.completed_courses.all())
        return required_prereqs.issubset(completed)


class Student(UniversalTimeObserver):
    name = models.CharField(max_length=100)
    student_id = models.CharField(max_length=20, unique=True)
    current_level = models.IntegerField(choices=Course.LEVEL_CHOICES, default=1)
    preferred_difficulty = models.CharField(max_length=10, choices=Course.DIFFICULTY_CHOICES, default="medium")
    gpa = models.FloatField(default=0.0)
    completed_courses = models.ManyToManyField(Course, related_name="completed_by", blank=True)

    # List of subject/topic names the student prefers, e.g. ["AI", "Networks", "Security"].
    # These must match the group names used in in_group/2 Prolog facts.
    # Admin or student sets this; Prolog reads each entry as preferred(Subject).
    preferred_subjects = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.name} (Level {self.current_level})"


class StudyPlan(UniversalTimeObserver):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="study_plans")
    recommended_courses = models.ManyToManyField(Course)
    generated_by = models.CharField(max_length=50)

    def __str__(self):
        return f"Plan for {self.student.name} via {self.generated_by}"