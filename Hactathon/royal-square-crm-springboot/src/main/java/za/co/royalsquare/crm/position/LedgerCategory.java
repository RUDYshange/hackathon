package za.co.royalsquare.crm.position;

/**
 * Categories taken from the firm's FNA Info Collect sheet. Tying each category
 * to its section stops an asset being filed as an expense.
 */
public enum LedgerCategory {

    PROPERTY("Property", LedgerSection.ASSET),
    VEHICLES("Vehicles", LedgerSection.ASSET),
    HOUSEHOLD("Household", LedgerSection.ASSET),
    BUSINESS("Business", LedgerSection.ASSET),
    LIQUID_SAVINGS("Liquid savings", LedgerSection.ASSET),
    INVESTMENTS("Investments", LedgerSection.ASSET),
    RETIREMENT("Retirement", LedgerSection.ASSET),

    MORTGAGE("Mortgage", LedgerSection.LIABILITY),
    VEHICLE_FINANCE("Vehicle finance", LedgerSection.LIABILITY),
    SHORT_TERM_DEBT("Short-term debt", LedgerSection.LIABILITY),
    PERSONAL_LOANS("Personal loans", LedgerSection.LIABILITY),

    SALARY("Salary", LedgerSection.INCOME),
    RENTAL("Rental income", LedgerSection.INCOME),
    INVESTMENT_INCOME("Investment income", LedgerSection.INCOME),
    OTHER_INCOME("Other income", LedgerSection.INCOME),

    HOUSING("Housing", LedgerSection.EXPENSE),
    INSURANCE("Insurance", LedgerSection.EXPENSE),
    LIVING("Living", LedgerSection.EXPENSE),
    EDUCATION("Education", LedgerSection.EXPENSE),
    CONTRIBUTIONS("Contributions", LedgerSection.EXPENSE);

    private final String label;
    private final LedgerSection section;

    LedgerCategory(String label, LedgerSection section) {
        this.label = label;
        this.section = section;
    }

    public String getLabel() { return label; }
    public LedgerSection getSection() { return section; }
}
