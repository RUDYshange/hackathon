package za.co.royalsquare.crm.client;

/**
 * The bands come straight off the firm's Investor Risk Profile questionnaire.
 * Keeping the thresholds in the enum means the rule lives in one place instead
 * of being re-implemented in every service that needs it.
 */
public enum RiskProfile {

    NOT_ASSESSED("Not assessed"),
    CAUTIOUS("Cautious"),
    MODERATE("Moderate"),
    ASSERTIVE("Assertive");

    private final String label;

    RiskProfile(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static RiskProfile fromScore(int score) {
        if (score <= 0)  return NOT_ASSESSED;
        if (score <= 45) return CAUTIOUS;
        if (score <= 65) return MODERATE;
        return ASSERTIVE;
    }
}
