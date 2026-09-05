package za.co.royalsquare.crm.client;

import org.springframework.stereotype.Component;
import za.co.royalsquare.crm.client.dto.ClientDetailResponse;
import za.co.royalsquare.crm.client.dto.ClientSummaryResponse;
import za.co.royalsquare.crm.client.dto.CreateClientRequest;
import za.co.royalsquare.crm.compliance.ComplianceService;
import za.co.royalsquare.crm.goal.GoalMapper;
import za.co.royalsquare.crm.policy.PolicyMapper;
import za.co.royalsquare.crm.position.BalanceSheetService;

import java.time.LocalDate;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Entity to DTO conversion lives here rather than in the entity or the
 * controller. The entity should not know about the web layer, and a controller
 * full of mapping code becomes unreadable.
 */
@Component
public class ClientMapper {

    private final BalanceSheetService balanceSheets;
    private final ComplianceService compliance;
    private final GoalMapper goalMapper;
    private final PolicyMapper policyMapper;

    public ClientMapper(BalanceSheetService balanceSheets,
                        ComplianceService compliance,
                        GoalMapper goalMapper,
                        PolicyMapper policyMapper) {
        this.balanceSheets = balanceSheets;
        this.compliance = compliance;
        this.goalMapper = goalMapper;
        this.policyMapper = policyMapper;
    }

    public ClientSummaryResponse toSummary(Client c) {
        return new ClientSummaryResponse(
                c.getId(),
                c.getReference(),
                c.fullName(),
                initials(c),
                c.getOccupation(),
                c.getEmployer(),
                c.getMobileNumber(),
                balanceSheets.netWorth(c),
                c.getRiskProfile().getLabel(),
                c.getRiskScore(),
                compliance.gapCount(c),
                c.getNextReviewDate(),
                daysUntil(c.getNextReviewDate())
        );
    }

    public ClientDetailResponse toDetail(Client c) {
        return new ClientDetailResponse(
                c.getId(),
                c.getReference(),
                c.getTitle(),
                c.fullName(),
                maskIdNumber(c.getIdNumber()),
                c.getDateOfBirth(),
                age(c.getDateOfBirth()),
                c.getOccupation(),
                c.getEmployer(),
                c.getAnnualIncome(),
                c.getMobileNumber(),
                c.getEmailAddress(),
                c.getPrimaryAddress(),
                c.getLicenceExpiry(),
                c.getClientSince(),
                c.getNextReviewDate(),
                c.getRiskProfile().getLabel(),
                c.getRiskScore(),
                balanceSheets.netWorth(c),
                balanceSheets.build(c),
                goalMapper.toResponses(c.getGoals()),
                policyMapper.toResponses(c.getPolicies()),
                compliance.documentsFor(c)
        );
    }

    public Client fromRequest(CreateClientRequest r, String reference) {
        Client c = new Client(reference, r.title(), r.firstName(), r.surname());
        c.setIdNumber(r.idNumber());
        c.setDateOfBirth(r.dateOfBirth());
        c.setOccupation(r.occupation());
        c.setEmployer(r.employer());
        c.setAnnualIncome(r.annualIncome());
        c.setMobileNumber(r.mobileNumber());
        c.setEmailAddress(r.emailAddress());
        c.setPrimaryAddress(r.primaryAddress());
        // A new file gets a review date two weeks out so the FAIS pack is chased.
        c.setNextReviewDate(LocalDate.now().plusWeeks(2));
        return c;
    }

    public List<ClientSummaryResponse> toSummaries(List<Client> clients) {
        return clients.stream().map(this::toSummary).toList();
    }

    /** 8503140142083 becomes 850314******3. */
    private String maskIdNumber(String id) {
        if (id == null || id.length() != 13) return null;
        return id.substring(0, 6) + "******" + id.charAt(12);
    }

    private String initials(Client c) {
        return ("" + c.getFirstName().charAt(0) + c.getSurname().charAt(0)).toUpperCase();
    }

    private int age(LocalDate dob) {
        return dob == null ? 0 : Period.between(dob, LocalDate.now()).getYears();
    }

    private long daysUntil(LocalDate date) {
        return date == null ? 0 : ChronoUnit.DAYS.between(LocalDate.now(), date);
    }
}
