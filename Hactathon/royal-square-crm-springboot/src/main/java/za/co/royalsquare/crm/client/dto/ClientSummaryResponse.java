package za.co.royalsquare.crm.client.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * What the client list page receives, one per row.
 *
 * Note what is NOT here: no ID number, no address, no medical answers, no
 * ledger detail. A list endpoint is the easiest place to leak personal
 * information by accident, because it returns every client at once. Under POPIA
 * you send the minimum the screen needs, and this screen needs a name, a
 * figure, a risk band and a review date.
 *
 * netWorth and complianceGapCount are computed in the service, not stored.
 */
public record ClientSummaryResponse(
        UUID id,
        String reference,
        String fullName,
        String initials,
        String occupation,
        String employer,
        String mobileNumber,
        BigDecimal netWorth,
        String riskProfile,
        Integer riskScore,
        int complianceGapCount,
        LocalDate nextReviewDate,
        long daysUntilReview
) {}
