from datetime import date, timedelta
from typing import Optional, Dict, Any
from crm.rules.base import ReminderRule
from crm.models import Client

class ValuationCertificateRule(ReminderRule):
    key = "VALUATION_CERTIFICATE"
    name = "Valuation Certificate (2-Yearly)"
    frequency = "BIENNIALLY"
    recipient = "CLIENT"
    channel = "EMAIL"
    notice_days = 60
    rationale = "Short-term insurance policies require updated valuation certificates every 2 years for specified high-value assets and jewelry to avoid average condition clauses at claim time."

    def evaluate(self, client: Client, today: date) -> Optional[Dict[str, Any]]:
        # Check if client has short-term policies or assets
        st_policies = client.policies.filter(product_type__icontains="short") | client.policies.filter(provider__icontains="santam")
        if not st_policies.exists() and not client.policies.exists():
            return None

        # Base reference date is client_since or earliest policy renewal
        ref_date = client.client_since or date(today.year - 2, 1, 15)
        # Compute 2-year anniversary due date
        years_diff = today.year - ref_date.year
        cycle_year = ref_date.year + (years_diff if years_diff % 2 == 0 else years_diff + 1)
        try:
            due_date = ref_date.replace(year=cycle_year)
        except ValueError:
            due_date = ref_date.replace(year=cycle_year, day=28)

        # If due_date is in the past by more than 60 days, advance to next 2-year cycle
        if (today - due_date).days > 60:
            due_date = due_date.replace(year=due_date.year + 2)

        days_left = (due_date - today).days
        if days_left <= self.notice_days:
            bucket = "OVERDUE" if days_left < 0 else ("DUE_SOON" if days_left <= 14 else "UPCOMING")
            return {
                "key": f"{self.key}:{client.id}:{due_date.isoformat()}",
                "clientId": str(client.id),
                "clientName": client.full_name,
                "ruleName": self.name,
                "title": f"2-yearly valuation certificate renewal for {client.full_name}",
                "dueOn": due_date.isoformat(),
                "daysUntilDue": days_left,
                "bucket": bucket,
                "recipient": self.recipient,
                "channel": self.channel,
                "recipientEmail": client.email_address,
                "recipientPhone": client.mobile_number,
                "noticeText": f"Dear {client.first_name}, your 2-yearly asset valuation certificate for your Santam short-term policy is due for renewal on {due_date.strftime('%d %B %Y')}."
            }
        return None
