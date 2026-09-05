package za.co.royalsquare.crm.position.dto;

import java.math.BigDecimal;
import java.util.List;

/** One category block in the ledger, with its own subtotal. */
public record LedgerGroupResponse(
        String category,
        BigDecimal subtotal,
        List<LedgerLineResponse> lines
) {}
