package za.co.royalsquare.crm.goal;

import jakarta.persistence.*;
import za.co.royalsquare.crm.client.Client;
import za.co.royalsquare.crm.common.Auditable;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Entity
@Table(name = "goal")
public class Goal extends Auditable {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id")
    private Client client;

    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GoalKind kind;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal targetAmount;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal currentAmount;

    @Column(precision = 15, scale = 2)
    private BigDecimal monthlyContribution;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate targetDate;

    @Column(length = 120)
    private String vehicle;

    protected Goal() { }

    public Goal(String name, GoalKind kind, BigDecimal target, LocalDate start, LocalDate targetDate) {
        this.name = name;
        this.kind = kind;
        this.targetAmount = target;
        this.currentAmount = BigDecimal.ZERO;
        this.startDate = start;
        this.targetDate = targetDate;
    }

    /** How much of the target is funded, capped at 100. */
    public BigDecimal percentFunded() {
        if (targetAmount.signum() == 0) return BigDecimal.ZERO;
        BigDecimal pct = currentAmount.multiply(BigDecimal.valueOf(100))
                .divide(targetAmount, 1, RoundingMode.HALF_UP);
        return pct.min(BigDecimal.valueOf(100));
    }

    /**
     * Where the client should be today if contributions were even across the
     * term. This is the pace line on the progress bar — without it, a
     * percentage tells an adviser nothing about whether the goal is on track.
     */
    public BigDecimal percentExpected() {
        long total = ChronoUnit.DAYS.between(startDate, targetDate);
        if (total <= 0) return BigDecimal.valueOf(100);
        long elapsed = ChronoUnit.DAYS.between(startDate, LocalDate.now());
        if (elapsed <= 0) return BigDecimal.ZERO;
        return BigDecimal.valueOf(Math.min(100.0, elapsed * 100.0 / total))
                .setScale(1, RoundingMode.HALF_UP);
    }

    public GoalPace pace() {
        BigDecimal actual = percentFunded();
        BigDecimal expected = percentExpected();
        if (actual.compareTo(expected.add(BigDecimal.valueOf(5))) >= 0) return GoalPace.AHEAD;
        if (actual.compareTo(expected.subtract(BigDecimal.valueOf(5))) < 0) return GoalPace.BEHIND;
        return GoalPace.ON_PACE;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public GoalKind getKind() { return kind; }
    public BigDecimal getTargetAmount() { return targetAmount; }
    public BigDecimal getCurrentAmount() { return currentAmount; }
    public BigDecimal getMonthlyContribution() { return monthlyContribution; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getTargetDate() { return targetDate; }
    public String getVehicle() { return vehicle; }

    public void setClient(Client client) { this.client = client; }
    public void setCurrentAmount(BigDecimal v) { this.currentAmount = v; }
    public void setMonthlyContribution(BigDecimal v) { this.monthlyContribution = v; }
    public void setVehicle(String v) { this.vehicle = v; }
}
