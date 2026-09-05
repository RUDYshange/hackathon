"""Tool registry for the voice assistant.

Each tool maps a natural-language intent (decided by the Groq Llama agent) onto
an existing CRM service call. The agent never touches the database directly — it
goes through the same service layer the REST API uses, so all business rules and
validation are preserved.

Read tools are always available. Write tools are only exposed when
settings.ASSISTANT_ENABLE_WRITE_ACTIONS is True.
"""
import uuid
from typing import Any, Dict, List, Optional, Tuple

from crm.models import Claim, SCENE_ITEMS
from crm.repositories.client_repository import ClientRepository
from crm.services.client_service import ClientService
from crm.services.claim_service import ClaimService
from crm.services.reminder_service import ReminderService


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _is_uuid(value: Any) -> bool:
    try:
        uuid.UUID(str(value))
        return True
    except (ValueError, TypeError, AttributeError):
        return False


def _resolve_client(query: str) -> Tuple[Optional[str], List[Dict[str, str]]]:
    """Resolve a free-text client reference to a single client id.

    Returns (client_id, matches). client_id is set only when exactly one
    client matches. matches is a lightweight list to help the agent
    disambiguate when there are several.
    """
    query = (query or "").strip()
    if not query:
        return None, []

    if _is_uuid(query):
        client = ClientRepository.get_by_id(query)
        if client:
            return str(client.id), [{"id": str(client.id), "reference": client.reference, "name": client.full_name}]

    matches = list(ClientRepository.get_all(search=query))
    slim = [{"id": str(c.id), "reference": c.reference, "name": c.full_name} for c in matches]
    if len(matches) == 1:
        return str(matches[0].id), slim
    return None, slim


def _resolve_claim(query: str) -> Optional[Claim]:
    query = (query or "").strip()
    if not query:
        return None
    if _is_uuid(query):
        from crm.repositories.claim_repository import ClaimRepository
        return ClaimRepository.get_by_id(query)
    return (
        Claim.objects.select_related("client").filter(reference__iexact=query).first()
        or Claim.objects.select_related("client").filter(reference__icontains=query).first()
    )


def _err(message: str, **extra: Any) -> Dict[str, Any]:
    out = {"ok": False, "error": message}
    out.update(extra)
    return out


def _ok(**data: Any) -> Dict[str, Any]:
    out = {"ok": True}
    out.update(data)
    return out


# ---------------------------------------------------------------------------
# Read tool handlers
# ---------------------------------------------------------------------------
def _list_clients(search: Optional[str] = None, **_: Any) -> Dict[str, Any]:
    clients = ClientService.list_clients(search=search)
    return _ok(count=len(clients), clients=clients)


def _get_client_detail(client: str, **_: Any) -> Dict[str, Any]:
    client_id, matches = _resolve_client(client)
    if not client_id:
        if len(matches) > 1:
            return _err("Multiple clients match. Ask the user which one.", matches=matches)
        return _err(f"No client found matching '{client}'.")
    return _ok(client=ClientService.get_client_detail(client_id))


def _list_claims(**_: Any) -> Dict[str, Any]:
    claims = ClaimService.list_claims()
    # Trim the verbose per-claim log to keep the payload small for the LLM.
    slim = [{k: v for k, v in c.items() if k != "log"} for c in claims]
    return _ok(count=len(slim), claims=slim)


def _get_claim(claim: str, **_: Any) -> Dict[str, Any]:
    found = _resolve_claim(claim)
    if not found:
        return _err(f"No claim found matching '{claim}'.")
    return _ok(claim=ClaimService.get_claim(str(found.id)))


def _list_reminders(**_: Any) -> Dict[str, Any]:
    reminders = ReminderService.get_open_reminders()
    return _ok(count=len(reminders), reminders=reminders)


# ---------------------------------------------------------------------------
# Write tool handlers
# ---------------------------------------------------------------------------
def _create_client(**data: Any) -> Dict[str, Any]:
    required = ["title", "firstName", "surname"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return _err(f"Missing required fields: {', '.join(missing)}.")
    created = ClientService.create_client(data)
    return _ok(client=created, message=f"Client {created.get('fullName')} created with reference {created.get('reference')}.")


def _create_claim(client: str, insurer: str, claimType: str, incidentDate: str,
                  policyNumber: Optional[str] = None, lodgedDate: Optional[str] = None,
                  description: Optional[str] = None, **_: Any) -> Dict[str, Any]:
    client_id, matches = _resolve_client(client)
    if not client_id:
        if len(matches) > 1:
            return _err("Multiple clients match. Ask the user which one.", matches=matches)
        return _err(f"No client found matching '{client}'.")
    payload = {
        "clientId": client_id,
        "insurer": insurer,
        "claimType": claimType,
        "incidentDate": incidentDate,
        "lodgedDate": lodgedDate,
        "policyNumber": policyNumber,
        "description": description,
    }
    created = ClaimService.create_claim({k: v for k, v in payload.items() if v is not None})
    return _ok(claim=created, message=f"Claim {created.get('reference')} registered for {created.get('clientName')}.")


def _advance_claim(claim: str, **_: Any) -> Dict[str, Any]:
    found = _resolve_claim(claim)
    if not found:
        return _err(f"No claim found matching '{claim}'.")
    updated = ClaimService.advance_stage(str(found.id))
    return _ok(claim=updated, message=f"Claim {updated.get('reference')} advanced to {updated.get('stage')}.")


def _toggle_claim_checklist(claim: str, item: str, **_: Any) -> Dict[str, Any]:
    found = _resolve_claim(claim)
    if not found:
        return _err(f"No claim found matching '{claim}'.")
    item = (item or "").strip().upper().replace(" ", "_")
    if item not in SCENE_ITEMS:
        return _err(f"Invalid checklist item '{item}'. Valid items: {', '.join(SCENE_ITEMS)}.")
    updated = ClaimService.toggle_scene_item(str(found.id), item)
    return _ok(claim=updated, message=f"Checklist item {item} toggled on claim {updated.get('reference')}.")


def _dismiss_reminder(key: str, **_: Any) -> Dict[str, Any]:
    if not key:
        return _err("A reminder key is required.")
    ReminderService.dismiss_reminder(key)
    return _ok(message=f"Reminder {key} dismissed.")


# ---------------------------------------------------------------------------
# Tool specifications (JSON schema shared with the Groq chat completion API)
# ---------------------------------------------------------------------------
_READ_TOOLS: Dict[str, Dict[str, Any]] = {
    "list_clients": {
        "handler": _list_clients,
        "spec": {
            "type": "function",
            "function": {
                "name": "list_clients",
                "description": "List CRM clients, optionally filtered by a search term matching name, reference, ID number or email.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "search": {"type": "string", "description": "Optional search term (name, reference, email)."}
                    },
                },
            },
        },
    },
    "get_client_detail": {
        "handler": _get_client_detail,
        "spec": {
            "type": "function",
            "function": {
                "name": "get_client_detail",
                "description": "Get the full profile of one client, including balance sheet, goals, policies and compliance documents.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "client": {"type": "string", "description": "Client reference (e.g. CLI-1234), full name, or id."}
                    },
                    "required": ["client"],
                },
            },
        },
    },
    "list_claims": {
        "handler": _list_claims,
        "spec": {
            "type": "function",
            "function": {
                "name": "list_claims",
                "description": "List all insurance claims with their current pipeline stage.",
                "parameters": {"type": "object", "properties": {}},
            },
        },
    },
    "get_claim": {
        "handler": _get_claim,
        "spec": {
            "type": "function",
            "function": {
                "name": "get_claim",
                "description": "Get the full detail of one claim including the scene checklist and activity log.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "claim": {"type": "string", "description": "Claim reference (e.g. CLM-1234) or id."}
                    },
                    "required": ["claim"],
                },
            },
        },
    },
    "list_reminders": {
        "handler": _list_reminders,
        "spec": {
            "type": "function",
            "function": {
                "name": "list_reminders",
                "description": "List open compliance and review reminders (consent, licence expiry, annual review).",
                "parameters": {"type": "object", "properties": {}},
            },
        },
    },
}

_WRITE_TOOLS: Dict[str, Dict[str, Any]] = {
    "create_client": {
        "handler": _create_client,
        "spec": {
            "type": "function",
            "function": {
                "name": "create_client",
                "description": "Onboard a new client. Confirm the details with the user before calling this.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "description": "Mr, Mrs, Ms, Dr or Prof."},
                        "firstName": {"type": "string"},
                        "secondName": {"type": "string"},
                        "surname": {"type": "string"},
                        "idNumber": {"type": "string", "description": "13-digit RSA ID number (optional)."},
                        "dateOfBirth": {"type": "string", "description": "ISO date YYYY-MM-DD (optional)."},
                        "occupation": {"type": "string"},
                        "employer": {"type": "string"},
                        "annualIncome": {"type": "number"},
                        "mobileNumber": {"type": "string"},
                        "emailAddress": {"type": "string"},
                        "primaryAddress": {"type": "string"},
                        "riskProfile": {"type": "string", "enum": ["CONSERVATIVE", "MODERATE", "AGGRESSIVE"]},
                    },
                    "required": ["title", "firstName", "surname"],
                },
            },
        },
    },
    "create_claim": {
        "handler": _create_claim,
        "spec": {
            "type": "function",
            "function": {
                "name": "create_claim",
                "description": "Register a new insurance claim for an existing client. Confirm details before calling.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "client": {"type": "string", "description": "Client reference, full name, or id."},
                        "insurer": {"type": "string", "description": "e.g. Santam, Discovery Insure, Hollard, OUTsurance, Old Mutual Insure."},
                        "claimType": {"type": "string", "description": "e.g. MOTOR_ACCIDENT, STORM_DAMAGE, THEFT, ALL_RISKS."},
                        "incidentDate": {"type": "string", "description": "ISO date YYYY-MM-DD."},
                        "policyNumber": {"type": "string"},
                        "lodgedDate": {"type": "string", "description": "ISO date YYYY-MM-DD (defaults to incident date)."},
                        "description": {"type": "string"},
                    },
                    "required": ["client", "insurer", "claimType", "incidentDate"],
                },
            },
        },
    },
    "advance_claim": {
        "handler": _advance_claim,
        "spec": {
            "type": "function",
            "function": {
                "name": "advance_claim",
                "description": "Advance a claim to the next stage in the pipeline.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "claim": {"type": "string", "description": "Claim reference (e.g. CLM-1234) or id."}
                    },
                    "required": ["claim"],
                },
            },
        },
    },
    "toggle_claim_checklist": {
        "handler": _toggle_claim_checklist,
        "spec": {
            "type": "function",
            "function": {
                "name": "toggle_claim_checklist",
                "description": "Toggle a scene-evidence checklist item on a claim (marks it gathered or not gathered).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "claim": {"type": "string", "description": "Claim reference or id."},
                        "item": {"type": "string", "description": "One of PHOTOS, POLICE_REPORT, WITNESS_DETAILS, DAMAGE_ESTIMATE, INVOICES."},
                    },
                    "required": ["claim", "item"],
                },
            },
        },
    },
    "dismiss_reminder": {
        "handler": _dismiss_reminder,
        "spec": {
            "type": "function",
            "function": {
                "name": "dismiss_reminder",
                "description": "Dismiss an open reminder by its key (obtain the key from list_reminders first).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "key": {"type": "string", "description": "The reminder key returned by list_reminders."}
                    },
                    "required": ["key"],
                },
            },
        },
    },
}


def get_registry(enable_write: bool) -> Dict[str, Dict[str, Any]]:
    registry = dict(_READ_TOOLS)
    if enable_write:
        registry.update(_WRITE_TOOLS)
    return registry


def get_tool_specs(enable_write: bool) -> List[Dict[str, Any]]:
    return [entry["spec"] for entry in get_registry(enable_write).values()]


def execute_tool(name: str, arguments: Dict[str, Any], enable_write: bool) -> Dict[str, Any]:
    registry = get_registry(enable_write)
    entry = registry.get(name)
    if not entry:
        return _err(f"Unknown or disabled tool '{name}'.")
    try:
        return entry["handler"](**(arguments or {}))
    except Exception as exc:  # surface the error to the agent so it can recover
        return _err(f"Tool '{name}' failed: {exc}")
