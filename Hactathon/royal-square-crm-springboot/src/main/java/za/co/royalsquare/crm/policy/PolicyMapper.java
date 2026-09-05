package za.co.royalsquare.crm.policy;

import org.springframework.stereotype.Component;
import za.co.royalsquare.crm.policy.dto.PolicyResponse;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class PolicyMapper {

    public PolicyResponse toResponse(Policy p) {
        Long days = p.getRenewalDate() == null ? null
                : ChronoUnit.DAYS.between(LocalDate.now(), p.getRenewalDate());
        return new PolicyResponse(
                p.getId(), p.getProvider(), p.getProductType().name(),
                p.getProductType().getLabel(), p.getPolicyNumber(),
                p.getSumAssured(), p.getMonthlyPremium(), p.getRenewalDate(), days);
    }

    public List<PolicyResponse> toResponses(List<Policy> policies) {
        return policies.stream().map(this::toResponse).toList();
    }
}
