package za.co.royalsquare.crm.policy.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PolicyResponse(
        UUID id,
        String provider,
        String productType,
        String productLabel,
        String policyNumber,
        BigDecimal sumAssured,
        BigDecimal monthlyPremium,
        LocalDate renewalDate,
        Long daysUntilRenewal
) {}
