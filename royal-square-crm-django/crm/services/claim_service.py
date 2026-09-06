from typing import List, Optional, Dict, Any
from crm.models import Claim, SCENE_ITEMS
from crm.repositories.claim_repository import ClaimRepository

class ClaimService:
    @staticmethod
    def to_response(claim: Claim) -> Dict[str, Any]:
        return {
            "id": str(claim.id),
            "reference": claim.reference,
            "clientId": str(claim.client_id),
            "clientName": claim.client.full_name if claim.client else "Unknown",
            "insurer": claim.insurer,
            "policyNumber": claim.policy_number,
            "insurerClaimNumber": claim.insurer_claim_number,
            "claimsHandler": claim.claims_handler,
            "claimType": claim.claim_type,
            "incidentDate": claim.incident_date,
            "lodgedDate": claim.lodged_date,
            "description": claim.description,
            "stage": claim.stage,
            "stepNumber": claim.step_number(),
            "totalSteps": claim.total_steps(),
            "closed": claim.is_closed(),
            "sceneChecklist": [
                {
                    "item": item,
                    "label": item.replace("_", " ").title(),
                    "done": claim.has_gathered(item)
                }
                for item in SCENE_ITEMS
            ],
            "log": [
                {
                    "text": log.text,
                    "recordedAt": log.recorded_at.isoformat()
                }
                for log in claim.logs.all()
            ]
        }

    @staticmethod
    def list_claims(scope: Optional[dict] = None) -> List[Dict[str, Any]]:
        claims = ClaimRepository.get_all(scope=scope)
        return [ClaimService.to_response(c) for c in claims]

    @staticmethod
    def get_claim(claim_id: str) -> Optional[Dict[str, Any]]:
        claim = ClaimRepository.get_by_id(claim_id)
        if not claim:
            return None
        return ClaimService.to_response(claim)

    @staticmethod
    def create_claim(data: dict) -> Dict[str, Any]:
        mapped = {
            "client_id": data["clientId"],
            "insurer": data["insurer"],
            "claim_type": data["claimType"],
            "incident_date": data["incidentDate"],
            "lodged_date": data.get("lodgedDate") or data["incidentDate"],
            "description": data.get("description"),
            "policy_number": data.get("policyNumber"),
            "stage": "REGISTERED"
        }
        claim = ClaimRepository.create(mapped)
        return ClaimService.to_response(claim)

    # camelCase API field -> Django model field (editable claim attributes).
    FIELD_MAP = {
        "insurer": "insurer",
        "policyNumber": "policy_number",
        "insurerClaimNumber": "insurer_claim_number",
        "claimsHandler": "claims_handler",
        "claimType": "claim_type",
        "incidentDate": "incident_date",
        "lodgedDate": "lodged_date",
        "description": "description",
        "stage": "stage",
    }

    @classmethod
    def update_claim(cls, claim_id: str, data: dict) -> Optional[Dict[str, Any]]:
        claim = ClaimRepository.get_by_id(claim_id)
        if not claim:
            return None
        mapped = {cls.FIELD_MAP[k]: v for k, v in data.items() if k in cls.FIELD_MAP}
        ClaimRepository.update(claim, mapped)
        return ClaimService.to_response(claim)

    @staticmethod
    def delete_claim(claim_id: str) -> bool:
        claim = ClaimRepository.get_by_id(claim_id)
        if not claim:
            return False
        ClaimRepository.delete(claim)
        return True

    @staticmethod
    def advance_stage(claim_id: str) -> Optional[Dict[str, Any]]:
        claim = ClaimRepository.get_by_id(claim_id)
        if not claim:
            return None
        ClaimRepository.advance_stage(claim)
        return ClaimService.to_response(claim)

    @staticmethod
    def toggle_scene_item(claim_id: str, item: str) -> Optional[Dict[str, Any]]:
        claim = ClaimRepository.get_by_id(claim_id)
        if not claim:
            return None
        ClaimRepository.toggle_scene_item(claim, item)
        return ClaimService.to_response(claim)
