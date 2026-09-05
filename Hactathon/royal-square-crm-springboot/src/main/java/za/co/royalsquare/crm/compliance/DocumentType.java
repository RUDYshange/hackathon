package za.co.royalsquare.crm.compliance;

/**
 * The firm's FAIS and FIC Act document set. Each type carries its own renewal
 * rule, so adding a document means adding one enum constant rather than editing
 * a switch statement in three services.
 */
public enum DocumentType {

    FAIS_DISCLOSURE("FAIS disclosure record", "FAIS", RenewalRule.ON_MATERIAL_CHANGE),
    CLIENT_CONSENT("Client consent to obtain information", "Consent", RenewalRule.TWELVE_MONTHS),
    BROKER_APPOINTMENT("Notice of appointment as advisor", "Appoint", RenewalRule.INDEFINITE),
    SERVICE_AGREEMENT("Service level agreement", "SLA", RenewalRule.INDEFINITE),
    CONFIDENTIALITY("Confidentiality agreement", "Confid", RenewalRule.INDEFINITE),
    NEEDS_ANALYSIS("Financial needs analysis", "FNA", RenewalRule.TWENTY_FOUR_MONTHS),
    RISK_PROFILE("Investor risk profile", "Risk", RenewalRule.TWENTY_FOUR_MONTHS),
    MEDICAL_UNDERWRITING("Medical underwriting questions", "Medical", RenewalRule.ON_APPLICATION),
    FICA_IDENTITY("FICA - identity document", "ID", RenewalRule.INDEFINITE),
    FICA_ADDRESS("FICA - proof of address", "Address", RenewalRule.TWELVE_MONTHS),
    FICA_BANK("FICA - proof of bank account", "Bank", RenewalRule.ON_CHANGE);

    private final String label;
    private final String shortLabel;
    private final RenewalRule renewal;

    DocumentType(String label, String shortLabel, RenewalRule renewal) {
        this.label = label;
        this.shortLabel = shortLabel;
        this.renewal = renewal;
    }

    public String getLabel() { return label; }
    public String getShortLabel() { return shortLabel; }
    public RenewalRule getRenewal() { return renewal; }
}
