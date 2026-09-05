package za.co.royalsquare.crm.goal;

/** The brief asks for goals to be individual or shared. */
public enum GoalKind {

    INDIVIDUAL("Individual"),
    SHARED("Shared with spouse");

    private final String label;

    GoalKind(String label) { this.label = label; }

    public String getLabel() { return label; }
}
