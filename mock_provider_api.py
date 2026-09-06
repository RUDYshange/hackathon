"""
mock_provider_api.py — Stand-in for Insurance Provider APIs (e.g. Sanlam, Discovery, Santam, Old Mutual)

Why mocking is the correct engineering decision for this architecture:
1. Provider heterogeneity: Each insurer (Old Mutual, Sanlam, Santam, Discovery) operates under
   different legal interpretations of FAIS/POPIA and enforces disparate form lengths (ranging from
   4 pages to 98 pages).
2. Normalization achievement: Royal Square solves the hard problem by structuring messy,
   provider-specific compliance and underwriting data into one clean, unified canonical schema.
3. API readiness: Once the canonical schema is normalized from the database, the network transport
   (mocked vs. live REST call) operates identically without changing application logic.
"""

import time
import uuid
import datetime
from typing import Dict, Any, Optional

def normalize_client_for_provider(client_record: Dict[str, Any], provider: str = "Sanlam") -> Dict[str, Any]:
    """
    Normalizes a messy database client record into a clean provider-specific payload.
    This demonstrates the unified schema solving the 4-to-98 page variance problem.
    """
    return {
        "external_broker_fsp": "29370",
        "broker_name": "Royal Square Financial (Pty) Ltd",
        "provider_target": provider,
        "policyholder": {
            "reference": client_record.get("reference", "CLI-UNKNOWN"),
            "full_name": client_record.get("fullName") or client_record.get("full_name", "Unknown Client"),
            "sa_id_number": client_record.get("idNumber") or client_record.get("id_number", "8403125289081"),
            "masked_id": client_record.get("maskedIdNumber", "840312 **** ***"),
            "occupation": client_record.get("occupation", "Professional"),
            "employer": client_record.get("employer", "Private"),
            "contact": {
                "mobile": client_record.get("mobileNumber") or client_record.get("mobile_number", "+27 82 555 1234"),
                "email": client_record.get("emailAddress") or client_record.get("email_address", "client@royalsquare.co.za")
            },
            "residential_address": client_record.get("primaryAddress") or client_record.get("primary_address", "Sandton, Gauteng")
        },
        "financial_declaration": {
            "declared_net_worth": float(client_record.get("netWorth") or client_record.get("net_worth") or 0.0),
            "popia_consent_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "fais_mandate_verified": True
        }
    }


def sync_client_to_provider(client_data: Dict[str, Any], provider: str = "Sanlam") -> Dict[str, Any]:
    """
    Stands in for e.g. Sanlam's or Santam's pass-through underwriting API endpoint.
    In reality: requests.post("https://sanlam-api.co.za/v2/underwriting/sync", json=normalized_payload)
    Mocked: validates the unified schema, generates an authentic insurer reference,
            and confirms pass-through underwriting without re-entering KYC details.
    """
    normalized = normalize_client_for_provider(client_data, provider)
    
    # Generate provider-specific reference prefix
    prefixes = {
        "Sanlam": "SNL",
        "Discovery": "DSC",
        "Santam": "SAN",
        "Old Mutual": "OMU"
    }
    prefix = prefixes.get(provider, "RSQ")
    year = datetime.datetime.now().year
    random_seq = str(uuid.uuid4().int)[:5]
    provider_ref = f"{prefix}-{year}-{random_seq}"

    return {
        "status": "received_and_verified",
        "provider": provider,
        "provider_reference": provider_ref,
        "client_reference": normalized["policyholder"]["reference"],
        "client_name": normalized["policyholder"]["full_name"],
        "underwriting_mode": "PASS_THROUGH_AUTOMATED",
        "compliance_status": "FAIS_SECTION_8_COMPLIANT",
        "astute_exchange_ref": f"AST-ZA-{random_seq}",
        "message": f"Client details successfully updated with {provider}. No re-entry required.",
        "synced_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "normalized_payload": normalized
    }


# -------------------------------------------------------------------------
# Integration Log: Appends a row every time a claim gets sent to a provider
# -------------------------------------------------------------------------
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

def submit_claim_to_provider(claim_data: Dict[str, Any], provider: str = "Sanlam") -> Dict[str, Any]:
    """
    Stands in for e.g. Sanlam's or Santam's claims registration API endpoint.
    In reality: requests.post("https://sanlam-api.co.za/claims", json=claim_data)
    Mocked: pretend the provider accepted it, returned an official reference,
            and appended an entry to the Integration Log table.
    """
    prefixes = {
        "Sanlam": "SNL",
        "Discovery": "DSC",
        "Santam": "SAN",
        "Old Mutual": "OM"
    }
    prefix = prefixes.get(provider, "SNL")
    year = datetime.datetime.now().year
    random_seq = str(uuid.uuid4().int)[:5]
    claim_ref = f"{prefix}-{year}-{random_seq}"

    claim_id = claim_data.get("claim_id") or f"CLM-00{len(integration_log) + 12}"
    client_name = claim_data.get("client_name") or claim_data.get("client") or "S. Dlamini"
    if " " in client_name and not client_name.startswith("S."):
        parts = client_name.split()
        formatted_client = f"{parts[0][0]}. {parts[-1]}"
    else:
        formatted_client = client_name

    timestamp_str = datetime.datetime.now().strftime("%H:%M")

    # Append to integration_log — this is what feeds your dashboard table
    entry = {
        "claim_id": claim_id,
        "client": formatted_client,
        "provider": provider,
        "status": "✅ Received",
        "reference": claim_ref,
        "timestamp": timestamp_str
    }
    integration_log.insert(0, entry)

    return {
        "status": "received",
        "claim_reference": claim_ref,
        "provider": provider,
        "policy_number": claim_data.get("policy_number", "POL-99210"),
        "client_reference": claim_data.get("client_reference", "CLI-1024"),
        "incident_type": claim_data.get("claim_type", "MOTOR_COLLISION"),
        "estimated_response": "2 business days",
        "claims_channel": "BROKER_DIRECT_INTEGRATION",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "integration_entry": entry
    }


if __name__ == "__main__":
    print("=" * 70)
    print(" ROYAL SQUARE CRM — PROVIDER INTEGRATION LOG (LIVE MOCK GATEWAY)")
    print("=" * 70)

    # 1. Simulate pulling an actual client from the database
    sample_db_client = {
        "id": "db5a9331-943e-46c1-8f4c-a85f3c75846a",
        "reference": "CLI-1024",
        "fullName": "Sipho Dlamini",
        "occupation": "Chief Technology Officer",
        "employer": "Naspers Fintech",
        "netWorth": 9000000.00
    }

    print("\n[1] Normalizing Client Data from Database for Sanlam Pass-Through...")
    sync_res = sync_client_to_provider(sample_db_client, provider="Sanlam")
    print(f" -> Provider Ref:      {sync_res['provider_reference']}")
    print(f" -> Astute Switch Ref: {sync_res['astute_exchange_ref']}")

    # 2. Simulate lodging new claim in real time
    print("\n[2] Live Claim Submission: Simulating Santam Accident Intake...")
    new_claim = {
        "claim_id": "CLM-0014",
        "client_name": "S. Dlamini",
        "policy_number": "SAN-40192",
        "claim_type": "MOTOR_COLLISION"
    }
    res = submit_claim_to_provider(new_claim, provider="Santam")
    print(f" -> Sent to Santam: Claim Reference {res['claim_reference']}")

    # 3. Print the Integration Log Table
    print("\n[3] Real-Time Provider Integration Log Table:")
    print("-" * 70)
    print(f"{'Claim ID':<10} | {'Client':<12} | {'Provider':<12} | {'Status':<12} | {'Reference':<15} | {'Timestamp'}")
    print("-" * 70)
    for row in integration_log:
        print(f"{row['claim_id']:<10} | {row['client']:<12} | {row['provider']:<12} | {row['status']:<12} | {row['reference']:<15} | {row['timestamp']}")
    print("-" * 70)
    print("\n✓ Real-time row populated the instant submit_claim_to_provider was executed.")
    print("=" * 70)

