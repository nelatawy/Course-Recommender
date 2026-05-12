import { API_BASE_URL } from "../constants/theme";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(response.status, data.message || "API request failed");
  }
  return data;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function signUp(name: string, studentId: string, level: number) {
  return fetchApi("/auth/signup/", {
    method: "POST",
    body: JSON.stringify({ name, student_id: studentId, level }),
  });
}

export async function signIn(studentId: string) {
  return fetchApi("/auth/signin/", {
    method: "POST",
    body: JSON.stringify({ student_id: studentId }),
  });
}

export async function adminLogin(secretKey: string) {
  return fetchApi("/auth/admin/", {
    method: "POST",
    body: JSON.stringify({ secret_key: secretKey }),
  });
}

// ---------------------------------------------------------------------------
// Courses
// ---------------------------------------------------------------------------

export async function getCourses() {
  return fetchApi("/courses/");
}

export async function createCourse(courseData: { name: string; level: number; difficulty?: string; course_department?: string }, adminKey: string) {
  return fetchApi("/courses/", {
    method: "POST",
    headers: { "X-Admin-Key": adminKey },
    body: JSON.stringify(courseData),
  });
}

export async function updateCourse(id: string | number, courseData: any, adminKey: string) {
  return fetchApi(`/courses/${id}/`, {
    method: "PUT",
    headers: { "X-Admin-Key": adminKey },
    body: JSON.stringify(courseData),
  });
}

export async function deleteCourse(id: string | number, adminKey: string) {
  return fetchApi(`/courses/${id}/`, {
    method: "DELETE",
    headers: { "X-Admin-Key": adminKey },
  });
}

// ---------------------------------------------------------------------------
// Prerequisites
// ---------------------------------------------------------------------------

export async function getPrerequisites() {
  return fetchApi("/prerequisites/");
}

export async function addPrerequisite(fromId: string | number, toId: string | number, adminKey: string) {
  return fetchApi("/prerequisites/add/", {
    method: "POST",
    headers: { "X-Admin-Key": adminKey },
    body: JSON.stringify({ from: fromId, to: toId }),
  });
}

export async function removePrerequisite(fromId: string | number, toId: string | number, adminKey: string) {
  return fetchApi("/prerequisites/remove/", {
    method: "POST",
    headers: { "X-Admin-Key": adminKey },
    body: JSON.stringify({ from: fromId, to: toId }),
  });
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

export async function toggleCompletedCourse(studentId: string | number, courseId: string | number) {
  return fetchApi(`/students/${studentId}/completed_courses/`, {
    method: "POST",
    body: JSON.stringify({ course_id: courseId }),
  });
}

export async function togglePreferredCourse(studentId: string | number, courseId: string | number) {
  return fetchApi(`/students/${studentId}/preferred_courses/`, {
    method: "POST",
    body: JSON.stringify({ course_id: courseId }),
  });
}

export async function updateStudentPreferences(studentId: string | number, data: { current_level?: number, preferred_difficulty?: string }) {
  return fetchApi(`/students/${studentId}/profile/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

export async function getAIRecommendations(studentId: string | number) {
  return fetchApi(`/recommend/ai/${studentId}/`, {
    method: "GET",
  });
}
