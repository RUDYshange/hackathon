package za.co.royalsquare.crm.position.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Every total is computed on the server. If the browser adds up the lines
 * itself, two screens can disagree about a client's net worth — and in a
 * financial services product that is not a rounding bug, it is a credibility
 * problem.
 */
public record BalanceSheetResponse(
        List<LedgerGroupResponse> assets,
        List<LedgerGroupResponse> liabilities,
        List<LedgerGroupResponse> income,
        List<LedgerGroupResponse> expenses,
        BigDecimal totalAssets,
        BigDecimal totalLiabilities,
        BigDecimal netWorth,
        BigDecimal monthlyIncome,
        BigDecimal monthlyExpenses,
        BigDecimal monthlySurplus,
        BigDecimal debtToAssetsPercent,
        BigDecimal monthsOfExpensesCovered
) {}
