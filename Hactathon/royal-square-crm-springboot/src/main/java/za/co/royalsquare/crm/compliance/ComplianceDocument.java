package za.co.royalsquare.crm.compliance;

import jakarta.persistence.*;
import za.co.royalsquare.crm.client.Client;
import za.co.royalsquare.crm.common.Auditable;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "compliance_document",
       uniqueConstraints = @UniqueConstraint(columnNames = {"client_id", "type"}))
public class ComplianceDocument extends Auditable {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id")
    private Client client;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private DocumentType type;

    @Column(nullable = false)
    private LocalDate signedOn;

    /** Where the signed PDF lives. Object storage, not the database. */
    @Column(length = 300)
    private String storageKey;

    protected ComplianceDocument() { }

    public ComplianceDocument(Client client, DocumentType type, LocalDate signedOn) {
        this.client = client;
        this.type = type;
        this.signedOn = signedOn;
    }

    /**
     * Expiry is derived from the signature date rather than stored, so it can
     * never drift out of step with the renewal rule.
     */
    public LocalDate expiresOn() {
        RenewalRule rule = type.getRenewal();
        return rule.expires() ? signedOn.plusMonths(rule.getMonths()) : null;
    }

    public DocumentStatus status(LocalDate asAt) {
        LocalDate expiry = expiresOn();
        if (expiry == null) return DocumentStatus.CURRENT;
        if (expiry.isBefore(asAt)) return DocumentStatus.LAPSED;
        if (expiry.isBefore(asAt.plusDays(45))) return DocumentStatus.DUE;
        return DocumentStatus.CURRENT;
    }

    public UUID getId() { return id; }
    public Client getClient() { return client; }
    public DocumentType getType() { return type; }
    public LocalDate getSignedOn() { return signedOn; }
    public String getStorageKey() { return storageKey; }
    public void setStorageKey(String key) { this.storageKey = key; }
}
