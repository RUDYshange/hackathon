package za.co.royalsquare.crm.position;

import jakarta.persistence.*;
import za.co.royalsquare.crm.client.Client;
import za.co.royalsquare.crm.common.Auditable;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * One line of the client's financial position. A single table holds assets,
 * liabilities, income and expenses because they share a shape — a label, an
 * amount and a category — and separating them into four near-identical tables
 * buys nothing.
 */
@Entity
@Table(name = "ledger_entry")
public class LedgerEntry extends Auditable {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id")
    private Client client;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LedgerCategory category;

    @Column(nullable = false, length = 120)
    private String label;

    /** Assets and liabilities hold a balance; income and expenses hold a monthly figure. */
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(length = 80)
    private String creditor;

    @Column(precision = 5, scale = 2)
    private BigDecimal interestRate;

    protected LedgerEntry() { }

    public LedgerEntry(LedgerCategory category, String label, BigDecimal amount) {
        this.category = category;
        this.label = label;
        this.amount = amount;
    }

    public LedgerSection section() {
        return category.getSection();
    }

    public UUID getId() { return id; }
    public Client getClient() { return client; }
    public LedgerCategory getCategory() { return category; }
    public String getLabel() { return label; }
    public BigDecimal getAmount() { return amount; }
    public String getCreditor() { return creditor; }
    public BigDecimal getInterestRate() { return interestRate; }

    void setClient(Client client) { this.client = client; }
    public void setCreditor(String creditor) { this.creditor = creditor; }
    public void setInterestRate(BigDecimal rate) { this.interestRate = rate; }
}
