package za.co.royalsquare.crm.claim;

/**
 * The checklist the app sends the client the moment they report an accident.
 * Getting this right at the scene is what makes the claim go smoothly later.
 */
public enum SceneItem {

    ROAD_SURFACE("Photos of the road surface and direction of travel"),
    LOCATION("The address or nearest cross streets"),
    VEHICLES("Photos of all vehicles and people involved"),
    PLATES("Licence plates and registration discs"),
    IDENTITY("ID documents of everyone involved"),
    WITNESSES("Witness names and contact details, plus a voice note if possible"),
    THIRD_PARTY_INSURANCE("Insurance details of the other parties"),
    POLICE_REPORT("Report to the police within 48 hours");

    private final String description;

    SceneItem(String description) { this.description = description; }

    public String getDescription() { return description; }
}
