from django.contrib import admin
from .models import Course, Student, StudyPlan

admin.site.register(Course)
admin.site.register(Student)
admin.site.register(StudyPlan)