import json

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from crm.services.assistant_service import handle_turn, AssistantConfigError


class AssistantVoiceView(APIView):
    """Multilingual voice assistant turn.

    Accepts either an uploaded audio clip (multipart field 'audio') or a plain
    'text' message. Optionally accepts prior 'history' for conversation context.
    Returns the transcript, detected language, the assistant reply, and a list
    of any CRM actions taken.
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        audio_file = request.FILES.get("audio")
        text = request.data.get("text")

        history = self._parse_history(request.data.get("history"))

        if not audio_file and not (text and str(text).strip()):
            return Response(
                {"detail": "Provide an 'audio' file or a 'text' message."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            if audio_file:
                filename = getattr(audio_file, "name", "audio.webm") or "audio.webm"
                result = handle_turn(
                    audio_bytes=audio_file.read(), filename=filename, history=history
                )
            else:
                result = handle_turn(text=str(text), history=history)
        except AssistantConfigError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as exc:  # upstream/model failure
            return Response(
                {"detail": f"Assistant error: {exc}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(result, status=status.HTTP_200_OK)

    @staticmethod
    def _parse_history(raw):
        if not raw:
            return None
        if isinstance(raw, list):
            return raw
        if isinstance(raw, str):
            try:
                parsed = json.loads(raw)
                return parsed if isinstance(parsed, list) else None
            except json.JSONDecodeError:
                return None
        return None
