from rest_framework import serializers
from crm.models import STAGES

class RegisterClaimSerializer(serializers.Serializer):
    clientId = serializers.CharField()
    insurer = serializers.CharField(max_length=80)
    claimType = serializers.CharField(max_length=60)
    incidentDate = serializers.DateField()
    lodgedDate = serializers.DateField(required=False, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    policyNumber = serializers.CharField(max_length=40, required=False, allow_blank=True, allow_null=True)

class UpdateClaimSerializer(serializers.Serializer):
    """Partial update — every field is optional; only supplied fields change."""
    insurer = serializers.CharField(max_length=80, required=False)
    policyNumber = serializers.CharField(max_length=40, required=False, allow_blank=True, allow_null=True)
    insurerClaimNumber = serializers.CharField(max_length=40, required=False, allow_blank=True, allow_null=True)
    claimsHandler = serializers.CharField(max_length=120, required=False, allow_blank=True, allow_null=True)
    claimType = serializers.CharField(max_length=60, required=False)
    incidentDate = serializers.DateField(required=False)
    lodgedDate = serializers.DateField(required=False, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    stage = serializers.ChoiceField(choices=STAGES, required=False)

class ClaimResponseSerializer(serializers.Serializer):
    id = serializers.CharField()
    reference = serializers.CharField()
    clientId = serializers.CharField()
    clientName = serializers.CharField()
    insurer = serializers.CharField()
    policyNumber = serializers.CharField(allow_null=True)
    insurerClaimNumber = serializers.CharField(allow_null=True)
    claimsHandler = serializers.CharField(allow_null=True)
    claimType = serializers.CharField()
    incidentDate = serializers.DateField()
    lodgedDate = serializers.DateField()
    description = serializers.CharField(allow_null=True)
    stage = serializers.CharField()
    stepNumber = serializers.IntegerField()
    totalSteps = serializers.IntegerField()
    closed = serializers.BooleanField()
    sceneChecklist = serializers.ListField()
    log = serializers.ListField()
