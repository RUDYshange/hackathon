package za.co.royalsquare.crm.claim;

/**
 * The ten stages after submission, in the order the brief sets out. The ordinal
 * drives the progress bar, so the declaration order is the business process --
 * do not reorder these without a migration.
 */
public enum ClaimStage {

    REGISTERED("Insurer returns claim number and claims handler"),
    ASSESSMENT_BOOKED("Client takes the vehicle for assessment"),
    ASSESSMENT_SUBMITTED("Assessment goes to the insurer and to us"),
    QUOTES_SUBMITTED("Repair quotes go to the insurer"),
    REPAIRS_AUTHORISED("Insurer authorises repairs"),
    BOOKING_CONFIRMED("Client picks a date for the vehicle to go in"),
    HIRE_ARRANGED("We arrange car hire and delivery to the repairer"),
    REPAIRS_UNDERWAY("Weekly repair updates pushed to us"),
    HIRE_RETURNED("We arrange collection and return of the hire car"),
    CLOSED("Client writes a short review and closes the transaction");

    private final String description;

    ClaimStage(String description) { this.description = description; }

    public String getDescription() { return description; }

    public int stepNumber() { return ordinal() + 1; }

    public boolean isFinal() { return this == CLOSED; }

    public ClaimStage next() {
        return isFinal() ? this : values()[ordinal() + 1];
    }
}
