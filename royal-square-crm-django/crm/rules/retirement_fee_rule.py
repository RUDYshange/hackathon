from datetime import date
from typing import Optional, Dict, Any
from crm.rules.base import ReminderRule
from crm.models import Client

class RetirementFeeRenewalRule(ReminderRule):
    key = "RETIREMENT_FEE_RENEWAL"
    name = "Retirement Fee & Ongoing Advice Renewal"
    frequency = "ANNUALLY"
    recipient = "CLIENT"
    channel = "EMAIL"
    notice_days = 45
    rationale = "FSCA & FAIS regulations mandate annual fee disclosures and explicit client consent renewal for ongoing advice fees on retirement annuity portfolios."

    def evaluate(self, client: Client, today: date) -> Optional[Dict[str, Any]]:
        # Check if client has retirement goals or policies
        has_ra = (
            client.goals.filter(kind__icontains="RETIREMENT").exists() or
            client.policies.filter(product_type__icontains="Retirement").exists() or
            client.policies.filter(provider__icontains="Allan Gray").exists() or
            client.policies.filter(provider__icontains="Old Mutual").exists()
        )
        if not has_ra:
            return None

        # Annual fee review scheduled 1 month before next review date or client_since anniversary
        if client.next_review_date:
            due_date = client.next_review_date
        elif client.client_since:
            try:
                due_date = client.client_since.replace(year=today.year)
            except ValueError:
                due_date = client.client_since.replace(year=today.year, day=28)
            if (today - due_date).days > 60:
                due_date = due_date.replace(year=today.year + 1)
        else:
            due_date = date(today.year, 11, 30)

        days_left = (due_date - today).days
        if days_left <= self.notice_days:
            bucket = "OVERDUE" if days_left < 0 else ("DUE_SOON" if days_left <= 14 else "UPCOMING")
            return {
                "key": f"{self.key}:{client.id}:{due_date.isoformat()}",
                "clientId": str(client.id),
                "clientName": client.full_name,
                "ruleName": self.name,
                "title": f"Annual retirement fee consent renewal for {client.full_name}",
                "dueOn": due_date.isoformat(),
                "daysUntilDue": days_left,
                "bucket": bucket,
                "recipient": self.recipient,
                "channel": self.channel,
                "recipientEmail": client.email_address,
                "recipientPhone": client.mobile_number,
                "noticeText": f"Dear {client.first_name}, your annual retirement annuity ongoing advice fee disclosure and consent renewal is due on {due_date.strftime('%d %B %Y')}."
            }
        return None
