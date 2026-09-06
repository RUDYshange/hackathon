"""Voice assistant orchestration.

Pipeline for one turn:
  1. Audio  -> Groq Whisper -> transcript (+ detected language)
  2. Transcript + tool definitions -> Groq tool-calling agent
  3. The model either answers directly or calls one/more CRM tools
  4. Tool results are fed back until the model produces a final reply,
     written in the same language the user spoke.

Only the transcript ever leaves the machine; the Groq key stays server-side.
"""
import json
import time
from typing import Any, Dict, List, Optional, Tuple

from django.conf import settings

from crm.services import assistant_tools

# Bound worst-case latency so the endpoint always responds promptly instead of
# hanging (a hung request is what surfaces in the browser as a "network error").
MAX_TOOL_ROUNDS = 4          # max reasoning/tool rounds per turn
MAX_WALL_SECONDS = 45        # overall time budget for the agent loop
GROQ_TIMEOUT_SECONDS = 30.0  # per HTTP call to Groq
GROQ_MAX_RETRIES = 1
MAX_HISTORY_MESSAGES = 12

SYSTEM_PROMPT = """You are the voice assistant for Royal Square Financial, a South African \
wealth-management and advisory CRM (FSP 29370).

Language:
- The user may speak in any South African language (English, isiZulu, isiXhosa, \
Afrikaans, Sesotho, Setswana, and others).
- ALWAYS reply in the SAME language the user used. If a detected language is \
provided, prefer it. Keep a warm, professional advisory tone.

Behaviour:
- Use the provided tools to read and change CRM data (clients, claims, reminders). \
Never invent client names, figures, references or dates — rely only on tool results.
- Amounts are South African Rand (ZAR). Dates are ISO format (YYYY-MM-DD).
- When a request is ambiguous (for example several clients match a name), ask a \
short clarifying question instead of guessing.
- Before performing a write action (creating a client, registering or advancing a \
claim, dismissing a reminder), make sure you have the details you need. If the user \
has clearly asked for the action and the details are present, proceed.
- Be efficient with tools. Prefer the list_* summaries, which already include key \
figures. Do NOT call get_client_detail or get_claim for every record — only fetch \
one record's detail when the user asks about that specific client or claim. Answer \
in as few tool calls as possible.
- Keep replies concise and speakable — this is a voice interface, so avoid long \
lists, tables or markdown. Summarise naturally in a sentence or two."""


class AssistantConfigError(RuntimeError):
    """Raised when the assistant is not configured (missing API key)."""


def _client():
    api_key = getattr(settings, "GROQ_API_KEY", "")
    if not api_key:
        raise AssistantConfigError(
            "GROQ_API_KEY is not set. Add it to royal-square-crm-django/.env to enable the voice assistant."
        )
    from groq import Groq
    return Groq(api_key=api_key, timeout=GROQ_TIMEOUT_SECONDS, max_retries=GROQ_MAX_RETRIES)


# Public alias so other services (e.g. i18n translation) can reuse one client factory.
def get_groq_client():
    return _client()


def transcribe(audio_bytes: bytes, filename: str = "audio.webm") -> Tuple[str, Optional[str]]:
    """Transcribe audio via Groq Whisper. Returns (text, detected_language)."""
    client = _client()
    result = client.audio.transcriptions.create(
        file=(filename, audio_bytes),
        model=getattr(settings, "GROQ_WHISPER_MODEL", "whisper-large-v3"),
        response_format="verbose_json",
    )
    text = (getattr(result, "text", "") or "").strip()
    language = getattr(result, "language", None)
    return text, language


def _serialise(value: Any) -> str:
    return json.dumps(value, default=str)


def run_conversation(
    user_text: str,
    language: Optional[str] = None,
    history: Optional[List[Dict[str, str]]] = None,
) -> Dict[str, Any]:
    """Run one agent turn with tool-calling. Returns reply text + actions taken."""
    client = _client()
    enable_write = getattr(settings, "ASSISTANT_ENABLE_WRITE_ACTIONS", True)
    model = getattr(settings, "GROQ_AGENT_MODEL", "openai/gpt-oss-120b")
    tool_specs = assistant_tools.get_tool_specs(enable_write)
    deadline = time.monotonic() + MAX_WALL_SECONDS

    system = SYSTEM_PROMPT
    if language:
        system += f"\n\nThe user's detected language is: {language}. Reply in this language."

    messages: List[Dict[str, Any]] = [{"role": "system", "content": system}]
    if history:
        for turn in history[-MAX_HISTORY_MESSAGES:]:
            role = turn.get("role")
            content = turn.get("content")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": user_text})

    actions: List[Dict[str, Any]] = []

    for _ in range(MAX_TOOL_ROUNDS):
        # Stop opening new tool rounds once the time budget is spent.
        if time.monotonic() >= deadline:
            break
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            tools=tool_specs,
            tool_choice="auto",
            temperature=0.2,
        )
        message = response.choices[0].message
        tool_calls = message.tool_calls or []

        if not tool_calls:
            return {"reply": (message.content or "").strip(), "actions": actions}

        messages.append({
            "role": "assistant",
            "content": message.content or "",
            "tool_calls": [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                }
                for tc in tool_calls
            ],
        })

        for tc in tool_calls:
            name = tc.function.name
            try:
                args = json.loads(tc.function.arguments or "{}")
            except json.JSONDecodeError:
                args = {}
            result = assistant_tools.execute_tool(name, args, enable_write)
            actions.append({"tool": name, "arguments": args, "ok": bool(result.get("ok", False))})
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "name": name,
                "content": _serialise(result),
            })

    # Ran out of tool rounds — ask the model for a final summary without tools.
    response = client.chat.completions.create(
        model=model,
        messages=messages + [{
            "role": "user",
            "content": "Summarise the outcome for me now in my language, without calling any more tools.",
        }],
        temperature=0.2,
    )
    return {"reply": (response.choices[0].message.content or "").strip(), "actions": actions}


def handle_turn(
    audio_bytes: Optional[bytes] = None,
    filename: str = "audio.webm",
    text: Optional[str] = None,
    history: Optional[List[Dict[str, str]]] = None,
) -> Dict[str, Any]:
    """Entry point for a full turn from either audio or text input."""
    language: Optional[str] = None
    if audio_bytes:
        transcript, language = transcribe(audio_bytes, filename)
    else:
        transcript = (text or "").strip()

    if not transcript:
        return {"transcript": "", "language": language, "reply": "", "actions": [],
                "error": "No speech detected. Please try again."}

    result = run_conversation(transcript, language=language, history=history)
    return {
        "transcript": transcript,
        "language": language,
        "reply": result["reply"],
        "actions": result["actions"],
    }
