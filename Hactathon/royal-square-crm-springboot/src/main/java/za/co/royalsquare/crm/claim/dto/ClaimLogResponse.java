package za.co.royalsquare.crm.claim.dto;

import java.time.Instant;

public record ClaimLogResponse(String text, Instant recordedAt) {}
