package za.co.royalsquare.crm.policy;

/**
 * requiresValuation drives the valuation certificate reminder rule. Putting the
 * flag on the enum keeps that rule from having to pattern-match product names.
 */
public enum ProductType {

    LIFE_COVER("Life cover", false),
    DISABILITY_COVER("Disability cover", false),
    CRITICAL_ILLNESS("Critical illness", false),
    INCOME_PROTECTOR("Income protector", false),
    FUNERAL_COVER("Funeral cover", false),
    KEY_PERSON("Key person cover", false),
    MOTOR_AND_HOUSEHOLD("Motor and household", true),
    COMMERCIAL("Commercial insurance", true),
    PROFESSIONAL_INDEMNITY("Professional indemnity", false),
    UNIT_TRUST("Unit trust", false),
    RETIREMENT_ANNUITY("Retirement annuity", false),
    LIVING_ANNUITY("Living annuity", false),
    PROVIDENT_FUND("Provident fund", false),
    ENDOWMENT("Endowment", false);

    private final String label;
    private final boolean requiresValuation;

    ProductType(String label, boolean requiresValuation) {
        this.label = label;
        this.requiresValuation = requiresValuation;
    }

    public String getLabel() { return label; }
    public boolean requiresValuation() { return requiresValuation; }

    public boolean isRetirementProduct() {
        return this == RETIREMENT_ANNUITY || this == LIVING_ANNUITY || this == PROVIDENT_FUND;
    }
}
