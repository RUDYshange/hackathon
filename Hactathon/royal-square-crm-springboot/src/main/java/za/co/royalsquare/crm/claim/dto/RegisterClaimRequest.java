package za.co.royalsquare.crm.claim.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record RegisterClaimRequest(

        @NotNull(message = "A client is required")
        UUID clientId,

        @NotBlank(message = "An insurer is required")
        String insurer,

        @NotBlank(message = "A claim type is required")
        String claimType,

        @NotNull(message = "The date of the incident is required")
        @PastOrPresent(message = "An incident cannot be in the future")
        LocalDate incidentDate,

        @Size(max = 2000)
        String description
) {}
