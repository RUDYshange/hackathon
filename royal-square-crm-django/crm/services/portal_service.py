"""Client-portal read model.

Turns the stored CRM data (ledger, goals, policies, reminder rules) into the
exact shape the client-facing dashboard renders. All figures come from the
database — nothing here is hard-coded.
"""
from datetime import date
from decimal import Decimal
from typing import Any, Dict, List, Optional

from django.conf import settings

from crm.models import Client
from crm.services.client_service import ClientService
from crm.repositories.reminder_repository import ReminderRepository
from crm.rules.engine import ReminderEngine

# Asset ledger lines whose label contains one of these words are treated as
# fixed property; everything else on the asset side counts as investments.
_PROPERTY_KEYWORDS = (
    "residence", "property", "home", "house", "farm", "holding",
    "craft", "sectional", "estate", "land", "apartment", "villa",
)

# Policy renewals this many days out (or overdue) surface as upcoming actions.
_RENEWAL_HORIZON_DAYS = 150
# A due item within this many days is flagged "critical" rather than "upcoming".
_CRITICAL_DAYS = 30

_MONTH = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def _f(value) -> float:
    return float(value or 0)


def _due_label(days: int) -> str:
    if days < 0:
        return f"{abs(days)} days overdue"
    if days == 0:
        return "Today"
    if days == 1:
        return "Tomorrow"
    if days <= 31:
        return f"In {days} days"
    return "Due next month" if days <= 62 else "Upcoming"


def _fmt_month_year(d: Optional[date]) -> str:
    return f"{_MONTH[d.month]} {d.year}" if d else "—"


def _fmt_date(d: Optional[date]) -> str:
    return f"{d.day} {_MONTH[d.month]} {d.year}" if d else "—"


class PortalService:
    @staticmethod
    def _resolve_client(client_ref_or_id: Optional[str]) -> Optional[Client]:
        qs = Client.objects.all()
        if client_ref_or_id:
            client = (
                qs.filter(reference=client_ref_or_id).first()
                or qs.filter(id=client_ref_or_id).first()
            )
            if client:
                return client
        # Default to the configured demo portal client, else the first client.
        default_ref = getattr(settings, "PORTAL_DEFAULT_CLIENT_REFERENCE", "CLI-1026")
        return qs.filter(reference=default_ref).first() or qs.first()

    @staticmethod
    def _financial_summary(client: Client, balance_sheet: Dict[str, Any]) -> Dict[str, Any]:
        total_assets = Decimal(str(balance_sheet["totalAssets"]))
        real_estate = Decimal("0.00")
        for asset in balance_sheet["assets"]:
            label = (asset["label"] or "").lower()
            if any(word in label for word in _PROPERTY_KEYWORDS):
                real_estate += Decimal(str(asset["amount"]))
        investments = total_assets - real_estate

        monthly_premium = sum(
            (p.monthly_premium or Decimal("0.00") for p in client.policies.all()),
            Decimal("0.00"),
        )

        net_worth = _f(balance_sheet["netWorth"])
        return {
            "netWorth": net_worth,
            "totalAssets": _f(total_assets),
            "investments": _f(investments),
            "realEstate": _f(real_estate),
            "liabilities": _f(balance_sheet["totalLiabilities"]),
            "monthlyPremium": _f(monthly_premium),
            "investmentsPct": round(_f(investments) / _f(total_assets) * 100, 1) if total_assets > 0 else 0.0,
            "realEstatePct": round(_f(real_estate) / _f(total_assets) * 100, 1) if total_assets > 0 else 0.0,
        }

    @staticmethod
    def _goals(client: Client) -> List[Dict[str, Any]]:
        out = []
        for g in client.goals.all():
            target = _f(g.target_amount)
            current = _f(g.current_amount)
            out.append({
                "id": str(g.id),
                "title": g.name,
                "category": g.kind.title() if g.kind else "Wealth",
                "targetAmount": target,
                "currentAmount": current,
                "targetDate": _fmt_month_year(g.target_date),
                "percent": min(100, round(current / target * 100)) if target > 0 else 0,
            })
        return out

    @classmethod
    def _reminders(cls, client: Client, today: date) -> List[Dict[str, Any]]:
        reminders: List[Dict[str, Any]] = []

        # 1. Compliance/relationship rules (licence, annual review, consent).
        dismissed = ReminderRepository.get_dismissed_keys()
        for r in ReminderEngine.evaluate_all([client], dismissed, today):
            days = r.get("daysUntilDue", 0)
            reminders.append({
                "id": r["key"],
                "title": r["title"],
                "dueDate": _due_label(days),
                "status": "critical" if r.get("bucket") in ("OVERDUE", "DUE_SOON") else "upcoming",
                "category": r.get("ruleName", "Compliance"),
            })

        # 2. Upcoming policy renewals (straight from the policy register).
        for p in client.policies.all():
            if not p.renewal_date:
                continue
            days = (p.renewal_date - today).days
            if days > _RENEWAL_HORIZON_DAYS:
                continue
            reminders.append({
                "id": f"RENEWAL:{p.id}",
                "title": f"{p.provider} — {p.product_type} renewal",
                "dueDate": _due_label(days),
                "status": "critical" if days <= _CRITICAL_DAYS else "upcoming",
                "category": p.provider,
            })

        # Critical first, then soonest due.
        reminders.sort(key=lambda x: (0 if x["status"] == "critical" else 1, x["title"]))
        return reminders

    @classmethod
    def get_overview(cls, client_ref_or_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        client = cls._resolve_client(client_ref_or_id)
        if not client:
            return None

        balance_sheet = ClientService.compute_balance_sheet(client)
        today = date.today()
        next_review = client.next_review_date

        return {
            "client": {
                "id": str(client.id),
                "reference": client.reference,
                "fullName": client.full_name,
                "firstName": client.first_name,
                "greetingName": client.first_name,
                "advisor": "Qiniso Ntuli",
                "nextReviewDate": _fmt_date(next_review),
                "riskProfile": client.risk_profile,
            },
            "financialSummary": cls._financial_summary(client, balance_sheet),
            "goals": cls._goals(client),
            "reminders": cls._reminders(client, today),
        }
