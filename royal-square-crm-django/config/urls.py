from django.contrib import admin
from django.urls import path, re_path, include
from django.http import JsonResponse, HttpResponse, HttpResponseNotFound
from django.conf import settings


def health_check(request):
    engine = settings.DATABASES['default']['ENGINE']
    if 'postgresql' in engine:
        db_label = 'Neon PostgreSQL'
    elif 'sqlite' in engine:
        db_label = 'SQLite'
    else:
        db_label = engine
    return JsonResponse({
        "status": "ok",
        "service": "Royal Square CRM Django API (Secure by Design)",
        "database": db_label
    })


def spa_index(request):
    """Serve the built React SPA entry point (index.html).

    Handles the root and any non-API, non-admin, non-static path so the
    single-page app owns client-side routing. Returns a clear message if the
    frontend hasn't been built yet (run `make serve` or the frontend build).
    """
    try:
        with open(settings.FRONTEND_INDEX, 'rb') as f:
            return HttpResponse(f.read(), content_type='text/html')
    except FileNotFoundError:
        return HttpResponseNotFound(
            "Frontend build not found. Build the React app first "
            "(e.g. `make serve`, or `npm run build` in royal-square-crm-react)."
        )


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health', health_check),
    path('api/health/', health_check),
    path('api/', include('crm.urls')),
    # SPA fallback: everything that isn't an API, admin, or static asset request
    # returns index.html so the React app can handle the route client-side.
    re_path(r'^(?!api/|admin/|static/).*$', spa_index),
]
