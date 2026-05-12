"""
Signals for smart auto-completion of courses when a student is created or promoted.

Rules
-----
* On CREATE  → auto-complete ALL courses whose level < student.current_level.
* On UPDATE (level increased) → auto-complete courses whose level falls in the
  newly-crossed range [old_level .. new_level - 1].  This is additive only, so
  courses an admin manually un-ticked earlier (exceptions) are NOT re-added.
* On UPDATE (level unchanged or decreased) → nothing automatic happens.

Admin flow
----------
After creating a student the admin can open the student record and manually
remove any "exception" courses from completed_courses.  Those removals survive
future saves as long as the level doesn't advance past that course's level again.
"""

from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

from .models import Course, Student


@receiver(pre_save, sender=Student)
def _capture_old_level(sender, instance, **kwargs):
    """Store the pre-save level so post_save knows what changed."""
    if instance.pk:
        try:
            instance._old_level = Student.objects.get(pk=instance.pk).current_level
        except Student.DoesNotExist:
            instance._old_level = None
    else:
        instance._old_level = None  # brand-new student


@receiver(post_save, sender=Student)
def _auto_complete_courses(sender, instance, created, **kwargs):
    old_level = instance._old_level

    if created:
        # New student: auto-complete everything strictly below their starting level.
        courses = Course.objects.filter(level__lt=instance.current_level)
        if courses.exists():
            instance.completed_courses.add(*courses)

    elif old_level is not None and instance.current_level > old_level:
        # Level promotion: auto-complete the levels that were just passed.
        # e.g. promoted from 2→4 → add level-2 and level-3 courses.
        courses = Course.objects.filter(
            level__gte=old_level, level__lt=instance.current_level
        )
        if courses.exists():
            instance.completed_courses.add(*courses)