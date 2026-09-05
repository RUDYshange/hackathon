package za.co.royalsquare.crm.reminder;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.royalsquare.crm.client.Client;
import za.co.royalsquare.crm.client.ClientRepository;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Runs every rule against every client.
 *
 * Spring injects every bean implementing ReminderRule into the constructor, so
 * the engine never names a single rule. Adding a rule class to the rules
 * package is the whole of adding a rule.
 */
@Service
public class ReminderEngine {

    private final List<ReminderRule> rules;
    private final ClientRepository clients;
    private final DismissalRepository dismissals;

    public ReminderEngine(List<ReminderRule> rules,
                          ClientRepository clients,
                          DismissalRepository dismissals) {
        this.rules = rules;
        this.clients = clients;
        this.dismissals = dismissals;
    }

    @Transactional(readOnly = true)
    public List<ReminderItem> generateAll() {
        Set<String> dismissed = dismissals.findAll().stream()
                .map(ReminderDismissal::getReminderKey)
                .collect(Collectors.toSet());

        return clients.findAll().stream()
                .flatMap(client -> rules.stream().flatMap(rule -> rule.generate(client).stream()))
                .filter(item -> item.dueOn() != null)
                .filter(item -> !dismissed.contains(item.key()))
                .sorted(Comparator.comparing(ReminderItem::dueOn))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReminderItem> generateFor(Client client) {
        return rules.stream()
                .flatMap(rule -> rule.generate(client).stream())
                .filter(item -> item.dueOn() != null)
                .sorted(Comparator.comparing(ReminderItem::dueOn))
                .toList();
    }

    /** Items whose notice window has opened — what actually gets sent tonight. */
    @Transactional(readOnly = true)
    public List<ReminderItem> dueForSending() {
        LocalDate today = LocalDate.now();
        return generateAll().stream()
                .filter(item -> {
                    ReminderRule rule = ruleFor(item);
                    return !item.dueOn().minusDays(rule.noticeDays()).isAfter(today);
                })
                .toList();
    }

    @Transactional
    public void dismiss(String reminderKey) {
        if (!dismissals.existsByReminderKey(reminderKey)) {
            dismissals.save(new ReminderDismissal(reminderKey));
        }
    }

    @Transactional
    public void reinstate(String reminderKey) {
        dismissals.deleteByReminderKey(reminderKey);
    }

    public List<ReminderRule> allRules() {
        return rules;
    }

    private ReminderRule ruleFor(ReminderItem item) {
        return rules.stream()
                .filter(r -> item.key().contains(":" + r.key() + ":"))
                .findFirst()
                .orElseThrow();
    }
}
