package za.co.royalsquare.crm.goal;

import org.springframework.stereotype.Component;
import za.co.royalsquare.crm.goal.dto.GoalResponse;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class GoalMapper {

    public GoalResponse toResponse(Goal g) {
        double years = ChronoUnit.DAYS.between(LocalDate.now(), g.getTargetDate()) / 365.25;
        return new GoalResponse(
                g.getId(), g.getName(), g.getKind().getLabel(), g.getVehicle(),
                g.getTargetAmount(), g.getCurrentAmount(), g.getMonthlyContribution(),
                g.percentFunded(), g.percentExpected(),
                g.pace().name(), g.pace().getLabel(),
                g.getTargetDate(), Math.round(years * 10) / 10.0);
    }

    public List<GoalResponse> toResponses(List<Goal> goals) {
        return goals.stream().map(this::toResponse).toList();
    }
}
