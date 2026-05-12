"""
REST-style API views for the Course Recommender mobile application.

All endpoints return JSON responses. Write operations on course data
require an ``X-Admin-Key`` header whose value matches the
``ADMIN_SECRET_KEY`` defined in project settings.
"""

import json

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

from .models import Course, Student, StudyPlan


# ---------------------------------------------------------------------------
#  Helpers
# ---------------------------------------------------------------------------

def _parse_json_body(request):
    """Parse the request body as JSON and return the resulting dict."""
    try:
        return json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return None


def _require_admin(request):
    """Return an error response if the request lacks a valid admin key.

    Returns ``None`` when the caller is authorised.
    """
    key = request.headers.get('X-Admin-Key', '')
    if key != settings.ADMIN_SECRET_KEY:
        return JsonResponse(
            {'status': 'error', 'message': 'Invalid or missing admin key.'},
            status=403,
        )
    return None


def _course_to_dict(course):
    """Serialise a ``Course`` instance to a plain dictionary."""
    return {
        'id': course.id,
        'name': course.name,
        'credits': course.credits,
        'level': course.level,
        'course_department': course.course_department,
        'prerequisites': list(
            course.prerequisites.values_list('id', flat=True)
        ),
        'created_at': course.created_at.isoformat(),
        'updated_at': course.updated_at.isoformat(),
    }


def _student_to_dict(student):
    """Serialise a ``Student`` instance to a plain dictionary."""
    return {
        'id': student.id,
        'name': student.name,
        'student_id': student.student_id,
        'current_level': student.current_level,
        'gpa': student.gpa,
        'completed_courses': list(
            student.completed_courses.values_list('id', flat=True)
        ),
        'created_at': student.created_at.isoformat(),
        'updated_at': student.updated_at.isoformat(),
    }


# ---------------------------------------------------------------------------
#  Auth endpoints
# ---------------------------------------------------------------------------

@require_http_methods(['POST'])
def auth_signup(request):
    """Create a new student account.

    Expects JSON body: ``{"name": "...", "student_id": "..."}``
    """
    data = _parse_json_body(request)
    if not data:
        return JsonResponse(
            {'status': 'error', 'message': 'Invalid JSON body.'},
            status=400,
        )

    name = data.get('name', '').strip()
    student_id = data.get('student_id', '').strip()

    if not name or not student_id:
        return JsonResponse(
            {'status': 'error', 'message': 'Both name and student_id are required.'},
            status=400,
        )

    if Student.objects.filter(student_id=student_id).exists():
        return JsonResponse(
            {'status': 'error', 'message': 'A student with this ID already exists.'},
            status=409,
        )

    student = Student.objects.create(name=name, student_id=student_id)
    return JsonResponse(
        {'status': 'success', 'student': _student_to_dict(student)},
        status=201,
    )


@require_http_methods(['POST'])
def auth_signin(request):
    """Sign in an existing student by student_id.

    Expects JSON body: ``{"student_id": "..."}``
    """
    data = _parse_json_body(request)
    if not data:
        return JsonResponse(
            {'status': 'error', 'message': 'Invalid JSON body.'},
            status=400,
        )

    student_id = data.get('student_id', '').strip()
    if not student_id:
        return JsonResponse(
            {'status': 'error', 'message': 'student_id is required.'},
            status=400,
        )

    try:
        student = Student.objects.get(student_id=student_id)
    except Student.DoesNotExist:
        return JsonResponse(
            {'status': 'error', 'message': 'Student not found.'},
            status=404,
        )

    return JsonResponse({'status': 'success', 'student': _student_to_dict(student)})


@require_http_methods(['POST'])
def auth_admin(request):
    """Validate an admin secret key.

    Expects JSON body: ``{"secret_key": "..."}``
    """
    data = _parse_json_body(request)
    if not data:
        return JsonResponse(
            {'status': 'error', 'message': 'Invalid JSON body.'},
            status=400,
        )

    secret = data.get('secret_key', '')
    if secret != settings.ADMIN_SECRET_KEY:
        return JsonResponse(
            {'status': 'error', 'message': 'Invalid admin key.'},
            status=403,
        )

    return JsonResponse({'status': 'success', 'message': 'Admin authenticated.'})


# ---------------------------------------------------------------------------
#  Course endpoints
# ---------------------------------------------------------------------------

@require_http_methods(['GET', 'POST'])
def course_list(request):
    """List all courses (GET) or create a new course (POST, admin-only)."""
    if request.method == 'GET':
        courses = Course.objects.all().order_by('level', 'name')
        return JsonResponse({
            'status': 'success',
            'courses': [_course_to_dict(c) for c in courses],
        })

    # POST -- admin only
    err = _require_admin(request)
    if err:
        return err

    data = _parse_json_body(request)
    if not data:
        return JsonResponse(
            {'status': 'error', 'message': 'Invalid JSON body.'},
            status=400,
        )

    name = data.get('name', '').strip()
    level = data.get('level')
    credits = data.get('credits', 3)
    department = data.get('course_department', 'CSE')

    if not name or level is None:
        return JsonResponse(
            {'status': 'error', 'message': 'name and level are required.'},
            status=400,
        )

    try:
        course = Course.objects.create(
            name=name,
            level=int(level),
            credits=int(credits),
            course_department=department,
        )
    except Exception as e:
        return JsonResponse(
            {'status': 'error', 'message': str(e)},
            status=400,
        )

    return JsonResponse(
        {'status': 'success', 'course': _course_to_dict(course)},
        status=201,
    )


@require_http_methods(['GET', 'PUT', 'DELETE'])
def course_detail(request, course_id):
    """Retrieve (GET), update (PUT, admin), or delete (DELETE, admin) a course."""
    try:
        course = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        return JsonResponse(
            {'status': 'error', 'message': 'Course not found.'},
            status=404,
        )

    if request.method == 'GET':
        return JsonResponse({'status': 'success', 'course': _course_to_dict(course)})

    # Write operations are admin-only.
    err = _require_admin(request)
    if err:
        return err

    if request.method == 'DELETE':
        course.delete()
        return JsonResponse({'status': 'success', 'message': 'Course deleted.'})

    # PUT -- update
    data = _parse_json_body(request)
    if not data:
        return JsonResponse(
            {'status': 'error', 'message': 'Invalid JSON body.'},
            status=400,
        )

    if 'name' in data:
        course.name = data['name'].strip()
    if 'level' in data:
        course.level = int(data['level'])
    if 'credits' in data:
        course.credits = int(data['credits'])
    if 'course_department' in data:
        course.course_department = data['course_department']

    try:
        course.save()
    except Exception as e:
        return JsonResponse(
            {'status': 'error', 'message': str(e)},
            status=400,
        )

    return JsonResponse({'status': 'success', 'course': _course_to_dict(course)})


# ---------------------------------------------------------------------------
#  Prerequisite endpoints (operates on Course.prerequisites M2M)
# ---------------------------------------------------------------------------

@require_http_methods(['GET'])
def prerequisite_list(request):
    """Return all prerequisite edges across all courses.

    Response format: ``[{"from": <prereq_id>, "to": <course_id>}, ...]``
    """
    edges = []
    for course in Course.objects.prefetch_related('prerequisites').all():
        for prereq in course.prerequisites.all():
            edges.append({'from': prereq.id, 'to': course.id})

    return JsonResponse({'status': 'success', 'edges': edges})


@require_http_methods(['POST'])
def prerequisite_add(request):
    """Add a prerequisite edge (admin-only).

    Expects JSON body: ``{"from": <prereq_course_id>, "to": <course_id>}``
    """
    err = _require_admin(request)
    if err:
        return err

    data = _parse_json_body(request)
    if not data:
        return JsonResponse(
            {'status': 'error', 'message': 'Invalid JSON body.'},
            status=400,
        )

    from_id = data.get('from')
    to_id = data.get('to')

    if from_id is None or to_id is None:
        return JsonResponse(
            {'status': 'error', 'message': '"from" and "to" course IDs are required.'},
            status=400,
        )

    if from_id == to_id:
        return JsonResponse(
            {'status': 'error', 'message': 'A course cannot be its own prerequisite.'},
            status=400,
        )

    try:
        prereq_course = Course.objects.get(id=from_id)
        target_course = Course.objects.get(id=to_id)
    except Course.DoesNotExist:
        return JsonResponse(
            {'status': 'error', 'message': 'One or both courses not found.'},
            status=404,
        )

    target_course.prerequisites.add(prereq_course)
    return JsonResponse({
        'status': 'success',
        'edge': {'from': prereq_course.id, 'to': target_course.id},
    })


@require_http_methods(['POST'])
def prerequisite_remove(request):
    """Remove a prerequisite edge (admin-only).

    Expects JSON body: ``{"from": <prereq_course_id>, "to": <course_id>}``
    """
    err = _require_admin(request)
    if err:
        return err

    data = _parse_json_body(request)
    if not data:
        return JsonResponse(
            {'status': 'error', 'message': 'Invalid JSON body.'},
            status=400,
        )

    from_id = data.get('from')
    to_id = data.get('to')

    try:
        prereq_course = Course.objects.get(id=from_id)
        target_course = Course.objects.get(id=to_id)
    except Course.DoesNotExist:
        return JsonResponse(
            {'status': 'error', 'message': 'One or both courses not found.'},
            status=404,
        )

    target_course.prerequisites.remove(prereq_course)
    return JsonResponse({'status': 'success', 'message': 'Prerequisite removed.'})


# ---------------------------------------------------------------------------
#  Student -- completed courses
# ---------------------------------------------------------------------------

@require_http_methods(['POST'])
def toggle_completed_course(request, student_pk):
    """Toggle a course in the student's completed_courses list.

    Expects JSON body: ``{"course_id": <int>}``
    """
    try:
        student = Student.objects.get(id=student_pk)
    except Student.DoesNotExist:
        return JsonResponse(
            {'status': 'error', 'message': 'Student not found.'},
            status=404,
        )

    data = _parse_json_body(request)
    if not data:
        return JsonResponse(
            {'status': 'error', 'message': 'Invalid JSON body.'},
            status=400,
        )

    course_id = data.get('course_id')
    try:
        course = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        return JsonResponse(
            {'status': 'error', 'message': 'Course not found.'},
            status=404,
        )

    if student.completed_courses.filter(id=course.id).exists():
        student.completed_courses.remove(course)
        taken = False
    else:
        student.completed_courses.add(course)
        taken = True

    return JsonResponse({
        'status': 'success',
        'course_id': course.id,
        'taken': taken,
        'completed_courses': list(
            student.completed_courses.values_list('id', flat=True)
        ),
    })
