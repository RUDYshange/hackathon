package za.co.royalsquare.crm.position;

import org.springframework.stereotype.Service;
import za.co.royalsquare.crm.client.Client;
import za.co.royalsquare.crm.position.dto.BalanceSheetResponse;
import za.co.royalsquare.crm.position.dto.LedgerGroupResponse;
import za.co.royalsquare.crm.position.dto.LedgerLineResponse;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class BalanceSheetService {

    private static final int SCALE = 2;

    public BigDecimal netWorth(Client client) {
        return total(client, LedgerSection.ASSET).subtract(total(client, LedgerSection.LIABILITY));
    }

    public BalanceSheetResponse build(Client client) {
        BigDecimal assets = total(client, LedgerSection.ASSET);
        BigDecimal liabilities = total(client, LedgerSection.LIABILITY);
        BigDecimal income = total(client, LedgerSection.INCOME);
        BigDecimal expenses = total(client, LedgerSection.EXPENSE);
        BigDecimal liquid = client.getLedgerEntries().stream()
                .filter(e -> e.getCategory() == LedgerCategory.LIQUID_SAVINGS)
                .map(LedgerEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new BalanceSheetResponse(
                group(client, LedgerSection.ASSET),
                group(client, LedgerSection.LIABILITY),
                group(client, LedgerSection.INCOME),
                group(client, LedgerSection.EXPENSE),
                assets, liabilities, assets.subtract(liabilities),
                income, expenses, income.subtract(expenses),
                percent(liabilities, assets),
                divide(liquid, expenses)
        );
    }

    private BigDecimal total(Client client, LedgerSection section) {
        return client.getLedgerEntries().stream()
                .filter(e -> e.section() == section)
                .map(LedgerEntry::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(SCALE, RoundingMode.HALF_UP);
    }

    /**
     * LinkedHashMap keeps the categories in enum order, so the ledger always
     * reads Property, Vehicles, Household rather than in whatever order the
     * rows came back from the database.
     */
    private List<LedgerGroupResponse> group(Client client, LedgerSection section) {
        Map<LedgerCategory, List<LedgerEntry>> byCategory = client.getLedgerEntries().stream()
                .filter(e -> e.section() == section)
                .collect(Collectors.groupingBy(LedgerEntry::getCategory,
                        LinkedHashMap::new, Collectors.toList()));

        return byCategory.entrySet().stream()
                .map(entry -> new LedgerGroupResponse(
                        entry.getKey().getLabel(),
                        entry.getValue().stream()
                                .map(LedgerEntry::getAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add),
                        entry.getValue().stream()
                                .map(e -> new LedgerLineResponse(
                                        e.getLabel(), e.getAmount(),
                                        e.getCreditor(), e.getInterestRate()))
                                .toList()))
                .toList();
    }

    private BigDecimal percent(BigDecimal part, BigDecimal whole) {
        if (whole.signum() == 0) return BigDecimal.ZERO;
        return part.multiply(BigDecimal.valueOf(100))
                   .divide(whole, 1, RoundingMode.HALF_UP);
    }

    private BigDecimal divide(BigDecimal a, BigDecimal b) {
        if (b.signum() == 0) return BigDecimal.ZERO;
        return a.divide(b, 1, RoundingMode.HALF_UP);
    }
}
