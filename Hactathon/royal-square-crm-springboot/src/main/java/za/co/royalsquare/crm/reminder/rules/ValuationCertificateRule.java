package za.co.royalsquare.crm.reminder.rules;

import org.springframework.stereotype.Component;
import za.co.royalsquare.crm.client.Client;
import za.co.royalsquare.crm.reminder.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Insurance valuation certificate, every two years, to us and to the client.
 * An out-of-date sum insured is how a client discovers at claim stage that
 * their cover settles short.
 */
@Component
public class ValuationCertificateRule implements ReminderRule {

    @Override public String key() { return "valuation"; }
    @Override public String name() { return "Insurance valuation certificate"; }
    @Override public String frequency() { return "Every 2 years"; }
    @Override public Recipient recipient() { return Recipient.BOTH; }
    @Override public Channel channel() { return Channel.EMAIL_AND_SMS; }
    @Override public int noticeDays() { return 30; }

    @Override
    public String rationale() {
        return "Sum insured must be re-certified or claims settle short.";
    }

    @Override
    public List<ReminderItem> generate(Client client) {
        LocalDate issued = client.getValuationCertificateIssued();

        if (issued == null) {
            boolean hasShortTermCover = client.getPolicies().stream()
                    .anyMatch(p -> p.getProductType().requiresValuation());
            if (!hasShortTermCover) return List.of();

            LocalDate due = LocalDate.now().plusDays(7);
            return List.of(new ReminderItem(
                    ReminderItem.buildKey(client, key(), due, "never"),
                    client, name(),
                    "No valuation certificate has ever been issued", due, recipient(), channel()));
        }

        LocalDate due = issued.plusYears(2);
        return List.of(new ReminderItem(
                ReminderItem.buildKey(client, key(), due, null),
                client, name(),
                "Insurance valuation certificate is due", due, recipient(), channel()));
    }
}
