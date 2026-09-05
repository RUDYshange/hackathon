package za.co.royalsquare.crm.client;

import jakarta.persistence.*;
import za.co.royalsquare.crm.common.Auditable;
import za.co.royalsquare.crm.compliance.ComplianceDocument;
import za.co.royalsquare.crm.goal.Goal;
import za.co.royalsquare.crm.policy.Policy;
import za.co.royalsquare.crm.position.LedgerEntry;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * The client file. This is the entity — it maps to a table and is never sent
 * to the browser directly. See the dto package for what leaves the server.
 */
@Entity
@Table(name = "client")
public class Client extends Auditable {

    @Id
    @GeneratedValue
    private UUID id;

    /** The human-facing reference, e.g. C-1042. Unique, shown in the UI. */
    @Column(nullable = false, unique = true, length = 12)
    private String reference;

    @Column(nullable = false, length = 10)
    private String title;

    @Column(nullable = false, length = 60)
    private String firstName;

    @Column(length = 60)
    private String secondName;

    @Column(nullable = false, length = 60)
    private String surname;

    /**
     * Personal information under POPIA. Encrypted at rest and never included in
     * a list response — only in a detail response, masked, for an adviser who
     * holds a mandate over this client.
     */
    @Column(name = "id_number", length = 13)
    private String idNumber;

    private LocalDate dateOfBirth;
    private LocalDate licenceExpiry;
    private LocalDate weddingAnniversary;
    private LocalDate nextReviewDate;
    private LocalDate valuationCertificateIssued;
    private LocalDate clientSince;

    @Column(length = 80)
    private String occupation;

    @Column(length = 80)
    private String employer;

    /**
     * Money is BigDecimal, never double. A double cannot represent 0.1 exactly,
     * so summing a ledger of rand amounts drifts. Scale 2, HALF_UP rounding.
     */
    @Column(precision = 15, scale = 2)
    private BigDecimal annualIncome;

    @Column(length = 20)
    private String mobileNumber;

    @Column(length = 120)
    private String emailAddress;

    @Column(length = 200)
    private String primaryAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RiskProfile riskProfile = RiskProfile.NOT_ASSESSED;

    private Integer riskScore;

    /**
     * cascade = ALL with orphanRemoval means deleting a client removes their
     * ledger. FetchType.LAZY means these are not loaded unless asked for —
     * important, because the client list page needs none of them.
     */
    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    private List<LedgerEntry> ledgerEntries = new ArrayList<>();

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Goal> goals = new ArrayList<>();

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Policy> policies = new ArrayList<>();

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ComplianceDocument> documents = new ArrayList<>();

    protected Client() { }  // JPA needs a no-arg constructor

    public Client(String reference, String title, String firstName, String surname) {
        this.reference = reference;
        this.title = title;
        this.firstName = firstName;
        this.surname = surname;
        this.clientSince = LocalDate.now();
    }

    public String fullName() {
        return firstName + " " + surname;
    }

    /** Both sides of the relationship are kept in step by the owning entity. */
    public void addLedgerEntry(LedgerEntry entry) {
        ledgerEntries.add(entry);
        entry.setClient(this);
    }

    public void addGoal(Goal goal) {
        goals.add(goal);
        goal.setClient(this);
    }

    public UUID getId() { return id; }
    public String getReference() { return reference; }
    public String getTitle() { return title; }
    public String getFirstName() { return firstName; }
    public String getSecondName() { return secondName; }
    public String getSurname() { return surname; }
    public String getIdNumber() { return idNumber; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public LocalDate getLicenceExpiry() { return licenceExpiry; }
    public LocalDate getWeddingAnniversary() { return weddingAnniversary; }
    public LocalDate getNextReviewDate() { return nextReviewDate; }
    public LocalDate getValuationCertificateIssued() { return valuationCertificateIssued; }
    public LocalDate getClientSince() { return clientSince; }
    public String getOccupation() { return occupation; }
    public String getEmployer() { return employer; }
    public BigDecimal getAnnualIncome() { return annualIncome; }
    public String getMobileNumber() { return mobileNumber; }
    public String getEmailAddress() { return emailAddress; }
    public String getPrimaryAddress() { return primaryAddress; }
    public RiskProfile getRiskProfile() { return riskProfile; }
    public Integer getRiskScore() { return riskScore; }
    public List<LedgerEntry> getLedgerEntries() { return ledgerEntries; }
    public List<Goal> getGoals() { return goals; }
    public List<Policy> getPolicies() { return policies; }
    public List<ComplianceDocument> getDocuments() { return documents; }

    public void setIdNumber(String idNumber) { this.idNumber = idNumber; }
    public void setDateOfBirth(LocalDate d) { this.dateOfBirth = d; }
    public void setLicenceExpiry(LocalDate d) { this.licenceExpiry = d; }
    public void setNextReviewDate(LocalDate d) { this.nextReviewDate = d; }
    public void setValuationCertificateIssued(LocalDate d) { this.valuationCertificateIssued = d; }
    public void setOccupation(String s) { this.occupation = s; }
    public void setEmployer(String s) { this.employer = s; }
    public void setAnnualIncome(BigDecimal v) { this.annualIncome = v; }
    public void setMobileNumber(String s) { this.mobileNumber = s; }
    public void setEmailAddress(String s) { this.emailAddress = s; }
    public void setPrimaryAddress(String s) { this.primaryAddress = s; }

    public void assessRisk(int score) {
        this.riskScore = score;
        this.riskProfile = RiskProfile.fromScore(score);
    }
}
