from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from crm.services.portal_service import PortalService


class PortalOverviewView(APIView):
    """Client-portal dashboard read model for the signed-in user.

    GET /api/portal/overview
    Resolves the caller's linked Client (Account.client) and returns their net
    worth, asset split, goals and upcoming actions — all derived from the
    database. A brand-new customer sees a fresh/empty portfolio; an existing
    customer sees their persisted data. Requires authentication.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        account = getattr(request.user, "account", None)
        if account is None or account.client_id is None:
            return Response(
                {"detail": "No client portfolio is linked to this account yet."},
                status=status.HTTP_404_NOT_FOUND,
            )
        overview = PortalService.get_overview(str(account.client_id))
        if not overview:
            return Response({"detail": "Portfolio not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(overview, status=status.HTTP_200_OK)
