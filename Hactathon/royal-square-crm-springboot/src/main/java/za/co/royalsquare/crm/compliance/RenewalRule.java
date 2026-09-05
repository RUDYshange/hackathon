package za.co.royalsquare.crm.compliance;

/** How often a document has to be re-signed. */
public enum RenewalRule {

    TWELVE_MONTHS("12 months", 12),
    TWENTY_FOUR_MONTHS("24 months", 24),
    INDEFINITE("Indefinite", null),
    ON_MATERIAL_CHANGE("On material change", null),
    ON_APPLICATION("On application", null),
    ON_CHANGE("On change", null);

    private final String label;
    private final Integer months;

    RenewalRule(String label, Integer months) {
        this.label = label;
        this.months = months;
    }

    public String getLabel() { return label; }
    public boolean expires() { return months != null; }
    public Integer getMonths() { return months; }
}
