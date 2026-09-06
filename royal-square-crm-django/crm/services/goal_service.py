import uuid
from decimal import Decimal
from datetime import date
from typing import Dict, Any, List, Optional
from crm.models import Goal, Client

class GoalService:
    @staticmethod
    def serialize_goal(g: Goal, current_client_id: Optional[str] = None) -> Dict[str, Any]:
        target = float(g.target_amount) if g.target_amount else 0.0
        current = float(g.current_amount) if g.current_amount else 0.0
        pct = round((current / target * 100), 1) if target > 0 else 0.0

        is_primary = True
        if current_client_id:
            is_primary = str(g.client_id) == str(current_client_id)

        return {
            "id": str(g.id),
            "name": g.name,
            "kind": g.kind,
            "targetAmount": float(g.target_amount),
            "currentAmount": float(g.current_amount),
            "monthlyContribution": float(g.monthly_contribution) if g.monthly_contribution else None,
            "startDate": g.start_date.isoformat() if hasattr(g.start_date, 'isoformat') else (str(g.start_date) if g.start_date else None),
            "targetDate": g.target_date.isoformat() if hasattr(g.target_date, 'isoformat') else (str(g.target_date) if g.target_date else None),
            "vehicle": g.vehicle,
            "progressPercent": pct,
            "isShared": g.shared_with is not None,
            "isPrimaryOwner": is_primary,
            "primaryClientId": str(g.client.id),
            "primaryClientName": g.client.full_name,
            "sharedWithId": str(g.shared_with.id) if g.shared_with else None,
            "sharedWithName": g.shared_with.full_name if g.shared_with else None,
        }

    @staticmethod
    def _resolve_client(identifier: str) -> Client:
        if not identifier:
            raise Client.DoesNotExist("Empty client identifier")
        try:
            uuid.UUID(str(identifier))
            return Client.objects.get(id=identifier)
        except (ValueError, AttributeError):
            return Client.objects.get(reference=str(identifier).strip())

    @classmethod
    def get_goals_for_client(cls, client_id: str) -> List[Dict[str, Any]]:
        client = cls._resolve_client(client_id)
        # Combine primary goals and goals shared with this client
        goals = (Goal.objects.filter(client=client) | Goal.objects.filter(shared_with=client)).distinct().order_by("target_date")
        return [cls.serialize_goal(g, str(client.id)) for g in goals]

    @classmethod
    def create_goal(cls, client_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        client = cls._resolve_client(client_id)

        shared_with = None
        shared_with_id = data.get("shared_with_id") or data.get("sharedWithId")
        if shared_with_id:
            try:
                shared_with = cls._resolve_client(shared_with_id)
            except Client.DoesNotExist:
                shared_with = None

        goal = Goal.objects.create(
            client=client,
            shared_with=shared_with,
            name=data.get("name", "New Financial Goal"),
            kind=data.get("kind", "WEALTH").upper(),
            target_amount=Decimal(str(data.get("target_amount") or data.get("targetAmount", "0"))),
            current_amount=Decimal(str(data.get("current_amount") or data.get("currentAmount", "0"))),
            monthly_contribution=Decimal(str(data.get("monthly_contribution") or data.get("monthlyContribution", "0"))) if (data.get("monthly_contribution") or data.get("monthlyContribution")) else None,
            start_date=data.get("start_date") or data.get("startDate") or date.today().isoformat(),
            target_date=data.get("target_date") or data.get("targetDate") or date(date.today().year + 5, 12, 31).isoformat(),
            vehicle=data.get("vehicle", "")
        )
        return cls.serialize_goal(goal, str(client.id))

    @classmethod
    def update_goal(cls, goal_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        goal = Goal.objects.get(id=goal_id)

        if "name" in data:
            goal.name = data["name"]
        if "kind" in data:
            goal.kind = data["kind"].upper()
        if "target_amount" in data or "targetAmount" in data:
            val = data.get("target_amount") if "target_amount" in data else data.get("targetAmount")
            goal.target_amount = Decimal(str(val))
        if "current_amount" in data or "currentAmount" in data:
            val = data.get("current_amount") if "current_amount" in data else data.get("currentAmount")
            goal.current_amount = Decimal(str(val))
        if "monthly_contribution" in data or "monthlyContribution" in data:
            val = data.get("monthly_contribution") if "monthly_contribution" in data else data.get("monthlyContribution")
            goal.monthly_contribution = Decimal(str(val)) if val is not None else None
        if "start_date" in data or "startDate" in data:
            goal.start_date = data.get("start_date") or data.get("startDate")
        if "target_date" in data or "targetDate" in data:
            goal.target_date = data.get("target_date") or data.get("targetDate")
        if "vehicle" in data:
            goal.vehicle = data["vehicle"]

        if "shared_with_id" in data or "sharedWithId" in data:
            shared_with_id = data.get("shared_with_id") or data.get("sharedWithId")
            if shared_with_id:
                try:
                    goal.shared_with = Client.objects.get(id=shared_with_id)
                except Client.DoesNotExist:
                    goal.shared_with = None
            else:
                goal.shared_with = None

        goal.save()
        return cls.serialize_goal(goal)

    @classmethod
    def delete_goal(cls, goal_id: str) -> bool:
        try:
            goal = Goal.objects.get(id=goal_id)
            goal.delete()
            return True
        except Goal.DoesNotExist:
            return False
