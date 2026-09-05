package za.co.royalsquare.crm.goal.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record GoalResponse(
        UUID id,
        String name,
        String kind,
        String vehicle,
        BigDecimal targetAmount,
        BigDecimal currentAmount,
        BigDecimal monthlyContribution,
        BigDecimal percentFunded,
        BigDecimal percentExpected,
        String pace,
        String paceLabel,
        LocalDate targetDate,
        double yearsRemaining
) {}
