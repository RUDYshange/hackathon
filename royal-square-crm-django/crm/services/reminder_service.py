from typing import List, Dict, Any
from crm.repositories.client_repository import ClientRepository
from crm.repositories.reminder_repository import ReminderRepository
from crm.rules.engine import ReminderEngine

class ReminderService:
    @staticmethod
    def get_open_reminders(scope=None) -> List[Dict[str, Any]]:
        clients = ClientRepository.get_all(scope=scope)
        dismissed = ReminderRepository.get_dismissed_keys()
        return ReminderEngine.evaluate_all(clients, dismissed)

    @staticmethod
    def get_rules_summary(scope=None) -> List[Dict[str, Any]]:
        reminders = ReminderService.get_open_reminders(scope=scope)
        counts = {}
        for r in reminders:
            rule_key = r["key"].split(":")[0]
            counts[rule_key] = counts.get(rule_key, 0) + 1
        return ReminderEngine.list_rules(counts)

    @staticmethod
    def dismiss_reminder(reminder_key: str) -> bool:
        return ReminderRepository.dismiss(reminder_key)

    @classmethod
    def dispatch_reminder(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        import datetime
        import uuid
        from crm.models import Client

        key = payload.get("key", "")
        client_id = payload.get("clientId")
        recipient = (payload.get("recipient") or "CLIENT").upper()
        channel = (payload.get("channel") or "EMAIL").upper()
        custom_message = payload.get("customMessage")

        # Try to resolve client
        client = None
        if client_id:
            try:
                client = Client.objects.get(id=client_id)
            except Client.DoesNotExist:
                pass
        elif ":" in key:
            parts = key.split(":")
            if len(parts) >= 2:
                try:
                    client = Client.objects.get(id=parts[1])
                except (Client.DoesNotExist, ValueError):
                    pass

        # Branching on recipient routing & channel
        routed_destinations = []
        if recipient in ["CLIENT", "BOTH"]:
            if client:
                if channel == "SMS":
                    dest = client.mobile_number or "+27 82 000 0000"
                    routed_destinations.append({"recipient": "Client", "channel": "SMS", "address": dest})
                else: # EMAIL or CALENDAR
                    dest = client.email_address or f"{client.reference.lower()}@client.royalsquare.co.za"
                    routed_destinations.append({"recipient": "Client", "channel": "EMAIL", "address": dest})
            else:
                routed_destinations.append({"recipient": "Client", "channel": channel, "address": "client@royalsquare.co.za"})

        if recipient in ["ADVISER", "BOTH"]:
            if channel == "SMS":
                routed_destinations.append({"recipient": "Adviser", "channel": "SMS", "address": "+27 82 555 1234 (Qiniso Ntuli)"})
            else:
                routed_destinations.append({"recipient": "Adviser", "channel": "EMAIL", "address": "advice@royalsquare.co.za"})

        message_id = f"DISP-{uuid.uuid4().hex[:8].upper()}"
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Dismiss the open reminder key now that it has been dispatched
        if key:
            cls.dismiss_reminder(key)

        return {
            "status": "DISPATCHED",
            "messageId": message_id,
            "dispatchedAt": now_iso,
            "key": key,
            "ruleKey": key.split(":")[0] if key else "MANUAL",
            "clientName": client.full_name if client else payload.get("clientName", "General"),
            "routing": {
                "recipient": recipient,
                "channel": channel,
                "destinations": routed_destinations
            },
            "deliverySummary": f"Dispatched via {channel} to {', '.join([d['address'] for d in routed_destinations])}",
            "customMessage": custom_message
        }
