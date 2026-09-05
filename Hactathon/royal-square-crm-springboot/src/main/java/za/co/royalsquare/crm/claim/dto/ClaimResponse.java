package za.co.royalsquare.crm.claim.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ClaimResponse(
        UUID id,
        String reference,
        UUID clientId,
        String clientName,
        String insurer,
        String policyNumber,
        String insurerClaimNumber,
        String claimsHandler,
        String claimType,
        LocalDate incidentDate,
        LocalDate lodgedDate,
        String description,
        String stage,
        int stepNumber,
        int totalSteps,
        boolean closed,
        List<SceneItemResponse> sceneChecklist,
        List<ClaimLogResponse> log
) {}
