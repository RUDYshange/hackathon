from django.urls import path, re_path
from crm.views.client_views import ClientListCreateView, ClientDetailView
from crm.views.claim_views import (
    ClaimListCreateView,
    ClaimDetailView,
    ClaimAdvanceView,
    ClaimToggleChecklistView
)
from crm.views.reminder_views import ReminderListView, RuleListView, ReminderDismissView
from crm.views.ui_views import ClientFormSchemaView, ClaimFormSchemaView
from crm.views.assistant_views import AssistantVoiceView
from crm.views.i18n_views import TranslateView
from crm.views.portal_views import PortalOverviewView
from crm.views.auth_views import RegisterView, LoginView, MeView, LogoutView

urlpatterns = [
    # Authentication
    path('auth/register', RegisterView.as_view()),
    path('auth/register/', RegisterView.as_view()),
    path('auth/login', LoginView.as_view()),
    path('auth/login/', LoginView.as_view()),
    path('auth/me', MeView.as_view()),
    path('auth/me/', MeView.as_view()),
    path('auth/logout', LogoutView.as_view()),
    path('auth/logout/', LogoutView.as_view()),

    # Clients
    path('clients', ClientListCreateView.as_view()),
    path('clients/', ClientListCreateView.as_view()),
    path('clients/<str:client_id>', ClientDetailView.as_view()),
    path('clients/<str:client_id>/', ClientDetailView.as_view()),

    # Claims
    path('claims', ClaimListCreateView.as_view()),
    path('claims/', ClaimListCreateView.as_view()),
    path('claims/<str:claim_id>', ClaimDetailView.as_view()),
    path('claims/<str:claim_id>/', ClaimDetailView.as_view()),
    path('claims/<str:claim_id>/advance', ClaimAdvanceView.as_view()),
    path('claims/<str:claim_id>/advance/', ClaimAdvanceView.as_view()),
    path('claims/<str:claim_id>/checklist/<str:item>/toggle', ClaimToggleChecklistView.as_view()),
    path('claims/<str:claim_id>/checklist/<str:item>/toggle/', ClaimToggleChecklistView.as_view()),

    # Reminders
    path('reminders', ReminderListView.as_view()),
    path('reminders/', ReminderListView.as_view()),
    path('reminders/rules', RuleListView.as_view()),
    path('reminders/rules/', RuleListView.as_view()),
    path('reminders/dismiss', ReminderDismissView.as_view()),
    path('reminders/dismiss/', ReminderDismissView.as_view()),

    # Voice Assistant (Groq Whisper + Llama tool-calling)
    path('assistant/voice', AssistantVoiceView.as_view()),
    path('assistant/voice/', AssistantVoiceView.as_view()),

    # UI translation (whole-app language switching)
    path('i18n/translate', TranslateView.as_view()),
    path('i18n/translate/', TranslateView.as_view()),

    # Client portal dashboard (DB-backed read model)
    path('portal/overview', PortalOverviewView.as_view()),
    path('portal/overview/', PortalOverviewView.as_view()),

    # Server-Driven UI Schemas
    path('ui/schemas/client-form', ClientFormSchemaView.as_view()),
    path('ui/schemas/client-form/', ClientFormSchemaView.as_view()),
    path('ui/schemas/claim-form', ClaimFormSchemaView.as_view()),
    path('ui/schemas/claim-form/', ClaimFormSchemaView.as_view()),
]
