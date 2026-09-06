"""Access scoping for multi-tenant client data.

Advisory dashboards must only ever show the signed-in business's own clients.
This module turns a request user into a Client-queryset filter:

- business  -> clients they own (owner=user)
- customer  -> only their own linked client record
- anonymous -> nothing

Returned as filter kwargs so repositories can apply `Client.objects.filter(**scope)`.
"""
from typing import Any, Dict


def client_scope(user) -> Dict[str, Any]:
    if not getattr(user, "is_authenticated", False):
        return {"id__in": []}
    account = getattr(user, "account", None)
    if account is not None and account.role == "business":
        return {"owner": user}
    if account is not None and account.client_id:
        return {"id": account.client_id}
    return {"id__in": []}


def owning_business(user):
    """The user when they're a business (used as Client.owner on create), else None."""
    account = getattr(user, "account", None)
    if getattr(user, "is_authenticated", False) and account is not None and account.role == "business":
        return user
    return None
