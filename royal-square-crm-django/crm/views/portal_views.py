from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from crm.services.portal_service import PortalService


class PortalOverviewView(APIView):
    """Client-portal dashboard read model, derived entirely from the database.

    GET /api/portal/overview[?client=<reference or id>]
    Returns the signed-in client's net worth, asset split, goals and upcoming
    actions. When no client is specified it falls back to the configured demo
    portal client (settings.PORTAL_DEFAULT_CLIENT_REFERENCE).
    """

    def get(self, request):
        client_ref = request.query_params.get('client')
        overview = PortalService.get_overview(client_ref)
        if not overview:
            return Response(
                {"detail": "No client records found. Seed the database first (make seed)."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(overview, status=status.HTTP_200_OK)
