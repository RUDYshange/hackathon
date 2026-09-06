from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from crm.services.client_service import ClientService
from crm.services.scope import client_scope, owning_business
from crm.serializers.client_serializers import (
    CreateClientSerializer,
    UpdateClientSerializer,
    ClientSummarySerializer,
    ClientDetailSerializer,
)

class ClientListCreateView(APIView):
    def get(self, request):
        query = request.query_params.get('q', None)
        # Only ever return clients the signed-in user may access (their practice).
        clients = ClientService.list_clients(search=query, scope=client_scope(request.user))
        serializer = ClientSummarySerializer(clients, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CreateClientSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # A business that onboards a client owns that record.
        detail = ClientService.create_client(serializer.validated_data, owner=owning_business(request.user))
        out_serializer = ClientDetailSerializer(detail)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)

class ClientDetailView(APIView):
    def get(self, request, client_id):
        detail = ClientService.get_client_detail(client_id, scope=client_scope(request.user))
        if not detail:
            return Response({"detail": "Client not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ClientDetailSerializer(detail)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, client_id):
        serializer = UpdateClientSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        detail = ClientService.update_client(client_id, serializer.validated_data, scope=client_scope(request.user))
        if not detail:
            return Response({"detail": "Client not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(ClientDetailSerializer(detail).data, status=status.HTTP_200_OK)

    # Full replace uses the same partial-tolerant handler.
    def put(self, request, client_id):
        return self.patch(request, client_id)

    def delete(self, request, client_id):
        deleted = ClientService.delete_client(client_id, scope=client_scope(request.user))
        if not deleted:
            return Response({"detail": "Client not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
