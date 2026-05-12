from django.urls import path
from . import views
from . import api_views

urlpatterns = [
    # Existing recommendation endpoints
    path('api/recommend/prolog/<int:student_id>/', views.get_prolog_recommendations),
    path('api/recommend/ai/<int:student_id>/', views.get_ai_recommendations),

    # Auth endpoints
    path('api/auth/signup/', api_views.auth_signup),
    path('api/auth/signin/', api_views.auth_signin),
    path('api/auth/admin/', api_views.auth_admin),

    # Course endpoints
    path('api/courses/', api_views.course_list),
    path('api/courses/<int:course_id>/', api_views.course_detail),

    # Prerequisite endpoints
    path('api/prerequisites/', api_views.prerequisite_list),
    path('api/prerequisites/add/', api_views.prerequisite_add),
    path('api/prerequisites/remove/', api_views.prerequisite_remove),

    # Student endpoints
    path('api/students/<int:student_pk>/profile/', api_views.update_student_profile),
    path('api/students/<int:student_pk>/completed_courses/', api_views.toggle_completed_course),
    path('api/students/<int:student_pk>/preferred_difficulty/', api_views.update_student_difficulty),
    path('api/students/<int:student_pk>/preferred_courses/', api_views.toggle_preferred_subject),
]