"""
CORS middleware for development.
Allows the React Native / Expo dev client to communicate with the Django API
without being blocked by browser same-origin policy.
"""


class CorsMiddleware:
    """Injects permissive CORS headers on every response."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Handle preflight OPTIONS requests.
        if request.method == 'OPTIONS':
            from django.http import HttpResponse
            response = HttpResponse()
            response.status_code = 204
        else:
            response = self.get_response(request)

        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, X-Admin-Key'
        response['Access-Control-Max-Age'] = '86400'
        return response
