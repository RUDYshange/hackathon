package za.co.royalsquare.crm.reminder.rules;

import org.springframework.stereotype.Component;
import za.co.royalsquare.crm.client.Client;
import za.co.royalsquare.crm.compliance.ComplianceDocument;
import za.co.royalsquare.crm.compliance.DocumentType;
import za.co.royalsquare.crm.reminder.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * The client consent form grants Astute access for 12 months from signature.
 * When it lapses, product provider lookups stop working and nobody notices
 * until an adviser needs a policy schedule during a review.
 */
@Component
public class ClientConsentRule implements ReminderRule {

    @Override public String key() { return "consent"; }
    @Override public String name() { return "Client consent renewal"; }
    @Override public String frequency() { return "Every 12 months"; }
    @Override public Recipient recipient() { return Recipient.BOTH; }
    @Override public Channel channel() { return Channel.EMAIL; }
    @Override public int noticeDays() { return 30; }

    @Override
    public String rationale() {
        return "Astute access lapses 12 months after signature.";
    }

    @Override
    public List<ReminderItem> generate(Client client) {
        Optional<ComplianceDocument> consent = client.getDocuments().stream()
                .filter(d -> d.getType() == DocumentType.CLIENT_CONSENT)
                .max((a, b) -> a.getSignedOn().compareTo(b.getSignedOn()));

        if (consent.isEmpty()) {
            LocalDate due = LocalDate.now().plusDays(3);
            return List.of(new ReminderItem(
                    ReminderItem.buildKey(client, key(), due, "missing"),
                    client, name(),
                    "No signed client consent is on file", due, recipient(), channel()));
        }

        LocalDate due = consent.get().expiresOn();
        return List.of(new ReminderItem(
                ReminderItem.buildKey(client, key(), due, null),
                client, name(),
                "Client consent for Astute access lapses", due, recipient(), channel()));
    }
}
