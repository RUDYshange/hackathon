package za.co.royalsquare.crm.goal;

public enum GoalPace {

    AHEAD("Ahead of pace"),
    ON_PACE("On pace"),
    BEHIND("Behind pace");

    private final String label;

    GoalPace(String label) { this.label = label; }

    public String getLabel() { return label; }
}
