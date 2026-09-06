from datetime import date
from typing import Optional, Dict, Any
from crm.rules.base import ReminderRule
from crm.models import Client

class BirthdayAnniversaryRule(ReminderRule):
    key = "BIRTHDAY_ANNIVERSARY"
    name = "Birthdays & Wedding Anniversaries"
    frequency = "ANNUALLY"
    recipient = "ADVISER"
    channel = "SMS"
    notice_days = 21
    rationale = "High-touch wealth management mandate — personal relationship milestones (birthdays and wedding anniversaries) for clients and spouses."

    def evaluate(self, client: Client, today: date) -> Optional[Dict[str, Any]]:
        milestones = []
        if client.date_of_birth:
            try:
                bday_this_year = client.date_of_birth.replace(year=today.year)
            except ValueError:
                bday_this_year = client.date_of_birth.replace(year=today.year, day=28)
            # If already passed this year, check next year
            if (today - bday_this_year).days > 7:
                bday_this_year = bday_this_year.replace(year=today.year + 1)
            days = (bday_this_year - today).days
            if days <= self.notice_days:
                age = today.year - client.date_of_birth.year
                milestones.append(("Birthday", bday_this_year, days, f"{client.full_name}'s {age}th Birthday"))

        if client.wedding_anniversary:
            try:
                anni_this_year = client.wedding_anniversary.replace(year=today.year)
            except ValueError:
                anni_this_year = client.wedding_anniversary.replace(year=today.year, day=28)
            if (today - anni_this_year).days > 7:
                anni_this_year = anni_this_year.replace(year=today.year + 1)
            days = (anni_this_year - today).days
            if days <= self.notice_days:
                years = today.year - client.wedding_anniversary.year
                milestones.append(("Anniversary", anni_this_year, days, f"{client.full_name}'s {years}th Wedding Anniversary"))

        if not milestones:
            return None

        # Pick earliest
        milestones.sort(key=lambda m: m[2])
        m_type, m_date, days_left, m_label = milestones[0]

        bucket = "OVERDUE" if days_left < 0 else ("DUE_SOON" if days_left <= 7 else "UPCOMING")
        return {
            "key": f"{self.key}:{client.id}:{m_type.upper()}:{m_date.isoformat()}",
            "clientId": str(client.id),
            "clientName": client.full_name,
            "ruleName": self.name,
            "title": m_label,
            "dueOn": m_date.isoformat(),
            "daysUntilDue": days_left,
            "bucket": bucket,
            "recipient": self.recipient,
            "channel": self.channel,
            "recipientEmail": "advice@royalsquare.co.za",
            "recipientPhone": client.mobile_number,
            "noticeText": f"Adviser milestone notification: {m_label} on {m_date.strftime('%d %B %Y')}. Send congratulatory note."
        }
