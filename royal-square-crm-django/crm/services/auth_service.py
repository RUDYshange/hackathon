"""Authentication service.

Real, database-backed auth on top of Django's user model + DRF tokens.

- register(): creates a User and, for customers, a *fresh* Client record seeded
  only with the details they supplied (name/email). Their dashboard then reflects
  their own empty portfolio rather than any demo data.
- login(): verifies credentials and returns the user's token + linked account.
- me(): resolves the account for an already-authenticated request.
"""
from datetime import date, timedelta
from typing import Any, Dict, Tuple

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework.authtoken.models import Token

from crm.models import Account
from crm.repositories.client_repository import ClientRepository

User = get_user_model()


class AuthError(Exception):
    """Raised for expected auth failures (bad input / credentials)."""


def _split_name(name: str) -> Tuple[str, str]:
    parts = [p for p in (name or "").strip().split() if p]
    if not parts:
        return ("New", "Client")
    if len(parts) == 1:
        return (parts[0], parts[0])
    return (parts[0], " ".join(parts[1:]))


def account_payload(account: Account, token_key: str) -> Dict[str, Any]:
    user = account.user
    return {
        "token": token_key,
        "role": account.role,
        "name": account.display_name or user.get_full_name() or user.email or user.username,
        "email": user.email or user.username,
        "clientId": str(account.client_id) if account.client_id else None,
        "clientReference": account.client.reference if account.client else None,
    }


@transaction.atomic
def register(role: str, name: str, email: str, password: str) -> Dict[str, Any]:
    email = (email or "").strip().lower()
    if not email or not password:
        raise AuthError("Email and password are required.")
    if len(password) < 8:
        raise AuthError("Your password must be at least 8 characters.")
    if role not in ("customer", "business"):
        raise AuthError("Invalid account type.")
    if User.objects.filter(email__iexact=email).exists() or User.objects.filter(username=email).exists():
        raise AuthError("An account with that email already exists.")

    first, last = _split_name(name)
    user = User.objects.create_user(
        username=email, email=email, password=password, first_name=first, last_name=last
    )

    client = None
    if role == "customer":
        # A fresh client record — populated only with what the user gave us.
        # No ledger/goals/policies yet, so the dashboard starts empty.
        client = ClientRepository.create({
            "title": "",
            "first_name": first,
            "surname": last,
            "email_address": email,
            "client_since": date.today(),
            "next_review_date": date.today() + timedelta(days=365),
            "risk_profile": "MODERATE",
            "risk_score": 50,
        })

    account = Account.objects.create(
        user=user, role=role, display_name=(name.strip() or None), client=client
    )
    token, _ = Token.objects.get_or_create(user=user)
    return account_payload(account, token.key)


def login(email: str, password: str) -> Dict[str, Any]:
    email = (email or "").strip().lower()
    user = User.objects.filter(email__iexact=email).first() or User.objects.filter(username=email).first()
    if not user or not user.check_password(password):
        raise AuthError("Incorrect email or password.")
    if not user.is_active:
        raise AuthError("This account is disabled.")
    account, _ = Account.objects.get_or_create(user=user, defaults={"role": "customer"})
    token, _ = Token.objects.get_or_create(user=user)
    return account_payload(account, token.key)


def me(user) -> Dict[str, Any]:
    account, _ = Account.objects.get_or_create(user=user, defaults={"role": "customer"})
    token, _ = Token.objects.get_or_create(user=user)
    return account_payload(account, token.key)
