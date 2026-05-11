from django.http import JsonResponse
from .models import Student, Course, StudyPlan
from .architecture import (
    AIEngineAdapter, 
    PrologAdapter, 
    FunctionalRanking, 
    HybridPrologEngine, 
    CurriculumCycleError
)

def _execute_plan(student, all_courses, engine: 'MasterAdvisorStrategy', engine_name: str):
    """Helper function to execute either engine and save the receipt."""
    # Run the chosen engine
    course_names = engine.generate_plan(student, all_courses)
    
    # Save the receipt to the database
    recommended_courses = Course.objects.filter(name__in=course_names)
    plan = StudyPlan.objects.create(student=student, generated_by=engine_name)
    if recommended_courses:
        plan.recommended_courses.set(recommended_courses)
        
    return course_names

def get_prolog_recommendations(request, student_id):
    try:
        student = Student.objects.get(id=student_id)
        all_courses = Course.objects.all()
        
        with PrologAdapter() as prolog_base:
            prolog_engine = HybridPrologEngine(prolog_base, [FunctionalRanking()])
            course_names = _execute_plan(student, all_courses, prolog_engine, 'Prolog_Engine')
            
        return JsonResponse({"status": "success", "recommendations": course_names})
        
    except CurriculumCycleError:
        return JsonResponse({"status": "error", "message": "Cycle detected."}, status=400)
    except Student.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Student not found"}, status=404)

def get_ai_recommendations(request, student_id):
    try:
        student = Student.objects.get(id=student_id)
        all_courses = Course.objects.all()
        
        ai_engine = AIEngineAdapter()
        course_names = _execute_plan(student, all_courses, ai_engine, 'AI_Model')
        
        return JsonResponse({"status": "success", "recommendations": course_names})
        
    except Student.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Student not found"}, status=404)