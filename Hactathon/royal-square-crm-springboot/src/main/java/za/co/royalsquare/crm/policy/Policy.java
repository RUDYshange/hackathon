package za.co.royalsquare.crm.policy;

import jakarta.persistence.*;
import za.co.royalsquare.crm.client.Client;
import za.co.royalsquare.crm.common.Auditable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "policy")
public class Policy extends Auditable {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id")
    private Client client;

    /** Sanlam, Old Mutual, Liberty, Momentum, Discovery, Allan Gray, Santam. */
    @Column(nullable = false, length = 80)
    private String provider;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ProductType productType;

    @Column(nullable = false, length = 40)
    private String policyNumber;

    @Column(precision = 15, scale = 2)
    private BigDecimal sumAssured;

    @Column(precision = 15, scale = 2)
    private BigDecimal monthlyPremium;

    private LocalDate renewalDate;

    protected Policy() { }

    public Policy(String provider, ProductType type, String policyNumber) {
        this.provider = provider;
        this.productType = type;
        this.policyNumber = policyNumber;
    }

    public UUID getId() { return id; }
    public String getProvider() { return provider; }
    public ProductType getProductType() { return productType; }
    public String getPolicyNumber() { return policyNumber; }
    public BigDecimal getSumAssured() { return sumAssured; }
    public BigDecimal getMonthlyPremium() { return monthlyPremium; }
    public LocalDate getRenewalDate() { return renewalDate; }

    void setClient(Client client) { this.client = client; }
    public void setSumAssured(BigDecimal v) { this.sumAssured = v; }
    public void setMonthlyPremium(BigDecimal v) { this.monthlyPremium = v; }
    public void setRenewalDate(LocalDate d) { this.renewalDate = d; }
}
