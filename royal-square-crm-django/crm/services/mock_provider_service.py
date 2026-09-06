"""
Mock Provider Integration Service for Django CRM.
Normalizes database client records, simulates communication with external provider APIs
(Sanlam, Santam, Discovery, Old Mutual), and persists updates on both the provider and advisor ends.
"""

import uuid
import datetime
from typing import Dict, Any, Optional
from crm.models import Client, Claim, ClaimLogEntry

def normalize_client_payload(client: Client, provider: str = "Sanlam") -> Dict[str, Any]:
    """
    Normalizes a Client model instance into an insurer-compliant canonical JSON payload.
    """
    return {
        "broker": {
            "fsp_number": "29370",
            "name": "Royal Square Financial (Pty) Ltd",
            "key_individual": "Qiniso Ntuli",
            "mandate_type": "DISCRETIONARY_AND_INTERMEDIARY"
        },
        "insurer_destination": provider,
        "policyholder": {
            "client_reference": client.reference,
            "title": client.title,
            "full_name": client.full_name,
            "id_number": client.id_number,
            "masked_id": f"{client.id_number[:6]} **** ***" if client.id_number and len(client.id_number) == 13 else "840312 **** ***",
            "date_of_birth": client.date_of_birth.isoformat() if client.date_of_birth else None,
            "occupation": client.occupation or "Not Specified",
            "employer": client.employer or "Private",
            "annual_income": float(client.annual_income) if client.annual_income else 0.0,
            "contact": {
                "mobile": client.mobile_number,
                "email": client.email_address
            },
            "residential_address": client.primary_address,
            "risk_profile": client.risk_profile
        },
        "astute_fais_compliance": {
            "popia_consent": True,
            "consent_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "fais_disclosure_acknowledged": True
        }
    }


def sync_client_with_provider(
    client_id: str,
    provider: str = "Sanlam",
    updated_fields: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Simulates sending the client's information to an external insurance provider's underwriting API,
    and updates the client's information in the local database so the advisor sees it immediately.
    """
    try:
        client = Client.objects.get(id=client_id)
    except (Client.DoesNotExist, ValueError):
        # Fallback to first client if invalid ID provided
        client = Client.objects.first()

    if not client:
        raise ValueError("No client found in database to sync.")

    # 1. Update client in the database with any updated fields (e.g. from document scanner or user input)
    if updated_fields:
        if "occupation" in updated_fields and updated_fields["occupation"]:
            client.occupation = str(updated_fields["occupation"])
        if "employer" in updated_fields and updated_fields["employer"]:
            client.employer = str(updated_fields["employer"])
        if "primary_address" in updated_fields and updated_fields["primary_address"]:
            client.primary_address = str(updated_fields["primary_address"])
        if "annual_income" in updated_fields and updated_fields["annual_income"]:
            client.annual_income = updated_fields["annual_income"]
        if "mobile_number" in updated_fields and updated_fields["mobile_number"]:
            client.mobile_number = str(updated_fields["mobile_number"])
        if "email_address" in updated_fields and updated_fields["email_address"]:
            client.email_address = str(updated_fields["email_address"])
        if "first_name" in updated_fields and updated_fields["first_name"]:
            client.first_name = str(updated_fields["first_name"])
        if "surname" in updated_fields and updated_fields["surname"]:
            client.surname = str(updated_fields["surname"])
        client.save()

    # 2. Build the normalized provider payload
    normalized = normalize_client_payload(client, provider)

    # 3. Simulate provider API response
    prefixes = {
        "Sanlam": "SNL",
        "Discovery": "DSC",
        "Santam": "SAN",
        "Old Mutual": "OMU"
    }
    prefix = prefixes.get(provider, "SNL")
    year = datetime.datetime.now().year
    random_seq = str(uuid.uuid4().int)[:5]
    provider_ref = f"{prefix}-{year}-{random_seq}"
    astute_ref = f"AST-ZA-{random_seq}"

    return {
        "status": "received_and_verified",
        "provider": provider,
        "provider_reference": provider_ref,
        "client_reference": client.reference,
        "client_name": client.full_name,
        "client_id": str(client.id),
        "underwriting_status": "PASS_THROUGH_ACTIVE",
        "compliance_gate": "PASSED_FAIS_SECTION_8",
        "astute_switch_ref": astute_ref,
        "simulated_endpoint": f"https://api.{provider.lower().replace(' ', '')}.co.za/v2/underwriting/sync",
        "message": f"Client data successfully updated on {provider} exchange and advisor CRM.",
        "advisor_notification": f"Advisory desk updated: {client.full_name} ({client.reference}) synced with {provider} ({provider_ref})",
        "synced_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "updated_client": {
            "fullName": client.full_name,
            "occupation": client.occupation,
            "employer": client.employer,
            "primaryAddress": client.primary_address,
            "mobileNumber": client.mobile_number,
            "emailAddress": client.email_address,
            "reference": client.reference
        }
    }


# Module-level integration log table matching user specification
integration_log = [
    {
        "claim_id": "CLM-0012",
        "client": "S. Dlamini",
        "provider": "Sanlam",
        "status": "✅ Received",
        "reference": "SNL-2026-00417",
        "timestamp": "21:42"
    },
    {
        "claim_id": "CLM-0013",
        "client": "S. Dlamini",
        "provider": "Old Mutual",
        "status": "✅ Received",
        "reference": "OM-2026-08821",
        "timestamp": "21:44"
    }
]

def get_integration_log() -> list:
    return list(integration_log)


def submit_claim_to_provider(
    claim_id: Optional[str] = None,
    provider: str = "Santam",
    claim_payload: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Simulates submitting an accident or loss claim to the provider API.
    Updates the claim in the database with the provider claim reference, logs an entry,
    and appends a real-time row to the Integration Log table.
    """
    claim = None
    if claim_id:
        try:
            claim = Claim.objects.get(id=claim_id)
        except (Claim.DoesNotExist, ValueError):
            pass

    prefixes = {
        "Sanlam": "SNL",
        "Discovery": "DSC",
        "Santam": "SAN",
        "Old Mutual": "OM"
    }
    prefix = prefixes.get(provider, "SNL")
    year = datetime.datetime.now().year
    random_seq = str(uuid.uuid4().int)[:5]
    insurer_claim_ref = f"{prefix}-{year}-{random_seq}"

    if claim:
        claim.insurer = provider
        claim.insurer_claim_number = insurer_claim_ref
        claim.save(update_fields=['insurer', 'insurer_claim_number', 'updated_at'])
        claim.logs.create(text=f"Mock Provider API: Transmitted to {provider} claims gateway. Provider Reference: {insurer_claim_ref}")
        client_ref = claim.client.reference
        client_name = claim.client.full_name
        policy_no = claim.policy_number or "POL-AUTO-SYNC"
        display_claim_id = claim.reference
    else:
        client_ref = claim_payload.get("client_reference", "CLI-1024") if claim_payload else "CLI-1024"
        client_name = claim_payload.get("client_name", "Sipho Dlamini") if claim_payload else "Sipho Dlamini"
        policy_no = claim_payload.get("policy_number", "POL-AUTO-SYNC") if claim_payload else "POL-AUTO-SYNC"
        display_claim_id = claim_payload.get("claim_id") or f"CLM-00{len(integration_log) + 12}" if claim_payload else f"CLM-00{len(integration_log) + 12}"

    # Format client display e.g. "S. Dlamini"
    parts = client_name.strip().split()
    if len(parts) >= 2:
        formatted_client = f"{parts[0][0]}. {parts[-1]}"
    else:
        formatted_client = client_name or "S. Dlamini"

    # Append to Integration Log
    current_time_str = datetime.datetime.now().strftime("%H:%M")
    log_entry = {
        "claim_id": display_claim_id,
        "client": formatted_client,
        "provider": provider,
        "status": "✅ Received",
        "reference": insurer_claim_ref,
        "timestamp": current_time_str
    }
    integration_log.insert(0, log_entry)

    return {
        "status": "received",
        "provider": provider,
        "claim_reference": insurer_claim_ref,
        "client_reference": client_ref,
        "client_name": client_name,
        "policy_number": policy_no,
        "estimated_response": "2 business days",
        "claims_channel": "BROKER_DIRECT_API",
        "simulated_endpoint": f"https://api.{provider.lower().replace(' ', '')}.co.za/claims/v1/intake",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "integration_entry": log_entry
    }
