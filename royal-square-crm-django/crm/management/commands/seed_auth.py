from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

from crm.models import Account, Client

User = get_user_model()

# Shareable demo logins. The customer is linked to an existing populated client
# (CLI-1026) so "existing user" shows real data; the business is an adviser.
DEMO_ACCOUNTS = [
    {
        "role": "business",
        "name": "Qiniso Ntuli",
        "email": "advisor@royalsquare.co.za",
        "password": "Advisor@2026",
        "client_ref": None,
    },
    {
        "role": "customer",
        "name": "Kagiso Mokoena",
        "email": "client@royalsquare.co.za",
        "password": "Client@2026",
        "client_ref": "CLI-1026",
    },
]


class Command(BaseCommand):
    help = "Create or refresh the demo auth accounts (idempotent)."

    def handle(self, *args, **options):
        for d in DEMO_ACCOUNTS:
            email = d["email"].lower()
            user = (
                User.objects.filter(username=email).first()
                or User.objects.filter(email__iexact=email).first()
            )
            if not user:
                user = User.objects.create_user(username=email, email=email, password=d["password"])
            else:
                user.set_password(d["password"])
                user.email = email
                user.save()

            client = Client.objects.filter(reference=d["client_ref"]).first() if d["client_ref"] else None

            account, _ = Account.objects.get_or_create(user=user, defaults={"role": d["role"]})
            account.role = d["role"]
            account.display_name = d["name"]
            account.client = client
            account.save()

            Token.objects.get_or_create(user=user)
            self.stdout.write(self.style.SUCCESS(
                f"Ready: {email} ({d['role']}"
                + (f" -> {d['client_ref']}" if d["client_ref"] else "") + ")"
            ))

        # Assign the seeded practice register to the demo business so the
        # existing advisor account shows its data (new businesses start empty).
        advisor = User.objects.filter(username="advisor@royalsquare.co.za").first()
        if advisor:
            seeded_refs = ["CLI-1024", "CLI-1025", "CLI-1026", "CLI-1027", "CLI-1028"]
            assigned = Client.objects.filter(reference__in=seeded_refs).update(owner=advisor)
            self.stdout.write(self.style.SUCCESS(f"Assigned {assigned} seeded client(s) to the demo advisor."))

        self.stdout.write(self.style.SUCCESS("Demo auth accounts are ready."))
