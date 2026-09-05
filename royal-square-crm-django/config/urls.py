from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
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

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health', health_check),
    path('api/health/', health_check),
    path('api/', include('crm.urls')),
]
