package za.co.royalsquare.crm.claim;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "claim_log_entry")
public class ClaimLogEntry {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "claim_id")
    private Claim claim;

    @Column(nullable = false, length = 500)
    private String text;

    @Column(nullable = false)
    private Instant recordedAt;

    protected ClaimLogEntry() { }

    ClaimLogEntry(Claim claim, String text) {
        this.claim = claim;
        this.text = text;
        this.recordedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getText() { return text; }
    public Instant getRecordedAt() { return recordedAt; }
}
