from django.contrib import admin
from django import forms
from .models import Course, Student, StudyPlan


# ── Course admin ──────────────────────────────────────────────────────────────

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("name", "level", "difficulty", "course_department")
    list_filter = ("level", "difficulty", "course_department")
    search_fields = ("name",)
    filter_horizontal = ("prerequisites",)
    ordering = ("level", "name")


# ── Student admin ─────────────────────────────────────────────────────────────

class StudentAdminForm(forms.ModelForm):
    """
    Replaces the raw JSONField widget for preferred_subjects with a
    clean comma-separated text input (e.g.  AI, Networks, Security).
    Values must match the group names used in in_group/2 Prolog facts.
    """

    preferred_subjects_input = forms.CharField(
        required=False,
        label="Preferred subjects",
        help_text=(
            "Comma-separated subject/topic names, e.g.  AI, Networks, Security.  "
            "Must match the group names tagged on courses in Prolog."
        ),
        widget=forms.TextInput(attrs={"size": 60}),
    )

    class Meta:
        model = Student
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.fields["preferred_subjects_input"].initial = ", ".join(
                self.instance.preferred_subjects or []
            )

    def clean_preferred_subjects_input(self):
        raw = self.cleaned_data.get("preferred_subjects_input", "")
        # Preserve original casing — Prolog facts are case-sensitive.
        return [s.strip() for s in raw.split(",") if s.strip()]

    def save(self, commit=True):
        instance = super().save(commit=False)
        instance.preferred_subjects = self.cleaned_data["preferred_subjects_input"]
        if commit:
            instance.save()
            self.save_m2m()
        return instance


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    form = StudentAdminForm
    list_display = ("name", "student_id", "current_level", "gpa", "subject_prefs")
    list_filter = ("current_level",)
    search_fields = ("name", "student_id")
    ordering = ("current_level", "name")

    filter_horizontal = ("completed_courses",)

    fieldsets = (
        ("Identity", {"fields": ("name", "student_id")}),
        ("Academic status", {"fields": ("current_level", "gpa")}),
        (
            "Preferences",
            {
                "fields": ("preferred_subjects_input",),
                "description": (
                    "Course IDs the student has starred as interesting.  "
                    "Managed by the student via the mobile app."
                ),
            },
        ),
        (
            "Completed courses",
            {
                "fields": ("completed_courses",),
                "description": (
                    "Auto-populated when the student is created or their level is raised.  "
                    "Uncheck any course here to mark it as an exception "
                    "(failed or not yet taken) — unchecked courses stay unchecked on future saves."
                ),
            },
        ),
    )

    def subject_prefs(self, obj):
        return ", ".join(obj.preferred_subjects) if obj.preferred_subjects else "—"
    subject_prefs.short_description = "Preferred subjects"


# ── StudyPlan admin ───────────────────────────────────────────────────────────

@admin.register(StudyPlan)
class StudyPlanAdmin(admin.ModelAdmin):
    list_display = ("student", "generated_by", "created_at")
    list_filter = ("generated_by",)
    filter_horizontal = ("recommended_courses",)
    ordering = ("-created_at",)