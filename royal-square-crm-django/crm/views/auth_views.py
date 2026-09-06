from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser
from rest_framework.authtoken.models import Token

from crm.services import auth_service
from crm.services.auth_service import AuthError


class RegisterView(APIView):
    """POST /api/auth/register — create a user (+ fresh Client for customers)."""
    parser_classes = [JSONParser]

    def post(self, request):
        d = request.data
        try:
            payload = auth_service.register(
                role=(d.get("role") or "customer"),
                name=(d.get("name") or ""),
                email=(d.get("email") or ""),
                password=(d.get("password") or ""),
            )
        except AuthError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(payload, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """POST /api/auth/login — verify credentials, return token + account."""
    parser_classes = [JSONParser]

    def post(self, request):
        d = request.data
        try:
            payload = auth_service.login(
                email=(d.get("email") or ""),
                password=(d.get("password") or ""),
            )
        except AuthError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(payload, status=status.HTTP_200_OK)


class MeView(APIView):
    """GET /api/auth/me — resolve the current (token-authenticated) account."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(auth_service.me(request.user), status=status.HTTP_200_OK)


class LogoutView(APIView):
    """POST /api/auth/logout — invalidate the caller's token."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
