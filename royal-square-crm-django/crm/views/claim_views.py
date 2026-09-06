from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from crm.services.claim_service import ClaimService
from crm.services.scope import client_scope
from crm.serializers.claim_serializers import (
    RegisterClaimSerializer,
    UpdateClaimSerializer,
    ClaimResponseSerializer,
)

class ClaimListCreateView(APIView):
    def get(self, request):
        # Scope claims to the signed-in practice's own clients.
        cscope = client_scope(request.user)
        claim_scope = {f'client__{k}': v for k, v in cscope.items()}
        claims = ClaimService.list_claims(scope=claim_scope)
        serializer = ClaimResponseSerializer(claims, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = RegisterClaimSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        claim = ClaimService.create_claim(serializer.validated_data)
        out_serializer = ClaimResponseSerializer(claim)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)

class ClaimDetailView(APIView):
    def get(self, request, claim_id):
        claim = ClaimService.get_claim(claim_id)
        if not claim:
            return Response({"detail": "Claim not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ClaimResponseSerializer(claim)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, claim_id):
        serializer = UpdateClaimSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        claim = ClaimService.update_claim(claim_id, serializer.validated_data)
        if not claim:
            return Response({"detail": "Claim not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(ClaimResponseSerializer(claim).data, status=status.HTTP_200_OK)

    def put(self, request, claim_id):
        return self.patch(request, claim_id)

    def delete(self, request, claim_id):
        deleted = ClaimService.delete_claim(claim_id)
        if not deleted:
            return Response({"detail": "Claim not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

class ClaimAdvanceView(APIView):
    def post(self, request, claim_id):
        claim = ClaimService.advance_stage(claim_id)
        if not claim:
            return Response({"detail": "Claim not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ClaimResponseSerializer(claim)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ClaimToggleChecklistView(APIView):
    def post(self, request, claim_id, item):
        claim = ClaimService.toggle_scene_item(claim_id, item)
        if not claim:
            return Response({"detail": "Claim not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ClaimResponseSerializer(claim)
        return Response(serializer.data, status=status.HTTP_200_OK)
