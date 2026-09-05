package za.co.royalsquare.crm.position.dto;

import java.math.BigDecimal;

public record LedgerLineResponse(
        String label,
        BigDecimal amount,
        String creditor,
        BigDecimal interestRate
) {}
