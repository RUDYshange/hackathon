package za.co.royalsquare.crm.claim;

import jakarta.persistence.*;
import za.co.royalsquare.crm.client.Client;
import za.co.royalsquare.crm.common.Auditable;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "claim")
public class Claim extends Auditable {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id")
    private Client client;

    @Column(nullable = false, unique = true, length = 30)
    private String reference;

    @Column(nullable = false, length = 80)
    private String insurer;

    @Column(length = 40)
    private String policyNumber;

    /** Issued by the insurer, so null until they come back to us. */
    @Column(length = 40)
    private String insurerClaimNumber;

    @Column(length = 120)
    private String claimsHandler;

    @Column(nullable = false, length = 60)
    private String claimType;

    @Column(nullable = false)
    private LocalDate incidentDate;

    @Column(nullable = false)
    private LocalDate lodgedDate;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ClaimStage stage = ClaimStage.REGISTERED;

    /**
     * EnumSet in memory, a join table on disk. Storing which items are gathered
     * rather than a boolean per column means adding a checklist item later does
     * not need a schema change.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "claim_scene_item", joinColumns = @JoinColumn(name = "claim_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "item", length = 40)
    private Set<SceneItem> gatheredItems = EnumSet.noneOf(SceneItem.class);

    @OneToMany(mappedBy = "claim", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ClaimLogEntry> log = new ArrayList<>();

    protected Claim() { }

    public Claim(Client client, String reference, String insurer, String claimType,
                 LocalDate incidentDate) {
        this.client = client;
        this.reference = reference;
        this.insurer = insurer;
        this.claimType = claimType;
        this.incidentDate = incidentDate;
        this.lodgedDate = LocalDate.now();
        addLogEntry("Claim registered with " + insurer + " and scene checklist sent to the client");
    }

    /**
     * Advancing writes the log entry itself, so a stage can never move without
     * leaving a record. That audit trail is what an insurer asks for when a
     * settlement is disputed.
     */
    public void advance() {
        if (stage.isFinal()) {
            throw new IllegalStateException("Claim " + reference + " is already closed");
        }
        addLogEntry(stage.getDescription());
        this.stage = stage.next();
        if (stage.isFinal()) addLogEntry("Transaction closed");
    }

    public void gather(SceneItem item) { gatheredItems.add(item); }

    public void ungather(SceneItem item) { gatheredItems.remove(item); }

    public boolean hasGathered(SceneItem item) { return gatheredItems.contains(item); }

    public void addLogEntry(String text) {
        log.add(new ClaimLogEntry(this, text));
    }

    public UUID getId() { return id; }
    public Client getClient() { return client; }
    public String getReference() { return reference; }
    public String getInsurer() { return insurer; }
    public String getPolicyNumber() { return policyNumber; }
    public String getInsurerClaimNumber() { return insurerClaimNumber; }
    public String getClaimsHandler() { return claimsHandler; }
    public String getClaimType() { return claimType; }
    public LocalDate getIncidentDate() { return incidentDate; }
    public LocalDate getLodgedDate() { return lodgedDate; }
    public String getDescription() { return description; }
    public ClaimStage getStage() { return stage; }
    public Set<SceneItem> getGatheredItems() { return gatheredItems; }
    public List<ClaimLogEntry> getLog() { return log; }

    public void setPolicyNumber(String s) { this.policyNumber = s; }
    public void setInsurerClaimNumber(String s) { this.insurerClaimNumber = s; }
    public void setClaimsHandler(String s) { this.claimsHandler = s; }
    public void setDescription(String s) { this.description = s; }
}
