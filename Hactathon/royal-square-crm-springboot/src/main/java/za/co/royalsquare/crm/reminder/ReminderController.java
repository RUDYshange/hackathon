package za.co.royalsquare.crm.reminder;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.royalsquare.crm.reminder.dto.ReminderResponse;
import za.co.royalsquare.crm.reminder.dto.RuleResponse;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@RestController
@RequestMapping("/api/reminders")
public class ReminderController {

    private final ReminderEngine engine;

    public ReminderController(ReminderEngine engine) {
        this.engine = engine;
    }

    @GetMapping
    public List<ReminderResponse> queue(@RequestParam(required = false) String rule) {
        return engine.generateAll().stream()
                .filter(item -> rule == null || item.key().contains(":" + rule + ":"))
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/rules")
    public List<RuleResponse> rules() {
        List<ReminderItem> open = engine.generateAll();
        return engine.allRules().stream()
                .map(r -> new RuleResponse(r.key(), r.name(), r.frequency(),
                        r.recipient().name(), r.channel().name(), r.noticeDays(), r.rationale(),
                        open.stream().filter(i -> i.key().contains(":" + r.key() + ":")).count()))
                .toList();
    }

    @PostMapping("/{key}/dismiss")
    public ResponseEntity<Void> dismiss(@PathVariable String key) {
        engine.dismiss(key);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{key}/dismiss")
    public ResponseEntity<Void> reinstate(@PathVariable String key) {
        engine.reinstate(key);
        return ResponseEntity.noContent().build();
    }

    private ReminderResponse toResponse(ReminderItem item) {
        long days = ChronoUnit.DAYS.between(LocalDate.now(), item.dueOn());
        return new ReminderResponse(
                item.key(),
                item.client().getId(),
                item.client().fullName(),
                item.ruleName(),
                item.title(),
                item.dueOn(),
                days,
                bucket(days),
                item.recipient().name(),
                item.channel().name());
    }

    private String bucket(long days) {
        if (days < 0)  return "OVERDUE";
        if (days == 0) return "TODAY";
        if (days <= 7) return "WEEK";
        if (days <= 31) return "MONTH";
        return "LATER";
    }
}
