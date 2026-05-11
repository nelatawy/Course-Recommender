from django.urls import path
from . import views

urlpatterns = [
    path('api/recommend/prolog/<int:student_id>/', views.get_prolog_recommendations),
    path('api/recommend/ai/<int:student_id>/', views.get_ai_recommendations),
]