package za.co.royalsquare.crm.client.dto;

import za.co.royalsquare.crm.compliance.dto.ComplianceDocumentResponse;
import za.co.royalsquare.crm.goal.dto.GoalResponse;
import za.co.royalsquare.crm.policy.dto.PolicyResponse;
import za.co.royalsquare.crm.position.dto.BalanceSheetResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * The full client file, for the detail screen.
 *
 * maskedIdNumber shows 850314******3 rather than the whole number. An adviser
 * confirming they have the right person needs the first six digits; nobody
 * needs the rest on screen, and a screenshot or a shoulder-surfer gets less.
 *
 * Nesting the other responses keeps the front end to one request per screen
 * instead of five.
 */
public record ClientDetailResponse(
        UUID id,
        String reference,
        String title,
        String fullName,
        String maskedIdNumber,
        LocalDate dateOfBirth,
        int age,
        String occupation,
        String employer,
        BigDecimal annualIncome,
        String mobileNumber,
        String emailAddress,
        String primaryAddress,
        LocalDate licenceExpiry,
        LocalDate clientSince,
        LocalDate nextReviewDate,
        String riskProfile,
        Integer riskScore,
        BigDecimal netWorth,
        BalanceSheetResponse balanceSheet,
        List<GoalResponse> goals,
        List<PolicyResponse> policies,
        List<ComplianceDocumentResponse> documents
) {}
