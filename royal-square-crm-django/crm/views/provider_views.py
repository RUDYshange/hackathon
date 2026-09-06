import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from crm.services.mock_provider_service import (
    sync_client_with_provider, 
    submit_claim_to_provider,
    get_integration_log
)

class ProviderSyncClientView(APIView):
    """
    POST /api/providers/sync-client
    Simulates sending client details to an external insurance provider (e.g. Sanlam, Santam, Discovery).
    Normalizes messy client data into the insurer canonical schema and updates the local database.
    """
    def post(self, request):
        client_id = request.data.get("client_id")
        provider = request.data.get("provider", "Sanlam")
        updated_fields = request.data.get("updated_fields")

        if not client_id:
            return Response(
                {"error": "client_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            result = sync_client_with_provider(
                client_id=client_id,
                provider=provider,
                updated_fields=updated_fields
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProviderSubmitClaimView(APIView):
    """
    POST /api/providers/submit-claim
    Simulates lodging a claim to an external insurance provider API (e.g. Santam, Discovery, Old Mutual).
    Updates the claim in the database with provider reference number, audit log, and appends to integration log.
    """
    def post(self, request):
        claim_id = request.data.get("claim_id")
        provider = request.data.get("provider", "Santam")
        claim_payload = request.data.get("claim_payload")

        try:
            result = submit_claim_to_provider(
                claim_id=claim_id,
                provider=provider,
                claim_payload=claim_payload
            )
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProviderIntegrationLogView(APIView):
    """
    GET /api/providers/integration-log
    Returns the real-time transmission log of claims sent to insurance providers.
    """
    def get(self, request):
        return Response(
            {"integration_log": get_integration_log()},
            status=status.HTTP_200_OK
        )

