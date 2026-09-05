package za.co.royalsquare.crm.reminder;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import za.co.royalsquare.crm.client.Client;
import za.co.royalsquare.crm.compliance.ComplianceDocument;
import za.co.royalsquare.crm.compliance.DocumentType;
import za.co.royalsquare.crm.reminder.rules.ClientConsentRule;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * A rule is a plain class with no Spring context and no database, so it can be
 * tested directly. That is the practical payoff of the strategy pattern: this
 * test runs in milliseconds and never touches Postgres.
 */
class ClientConsentRuleTest {

    private final ClientConsentRule rule = new ClientConsentRule();

    @Test
    @DisplayName("consent signed today falls due in twelve months")
    void raisesReminderTwelveMonthsAfterSignature() {
        Client client = new Client("C-9001", "Ms", "Test", "Client");
        LocalDate signed = LocalDate.now();
        client.getDocuments().add(
                new ComplianceDocument(client, DocumentType.CLIENT_CONSENT, signed));

        List<ReminderItem> items = rule.generate(client);

        assertThat(items).hasSize(1);
        assertThat(items.get(0).dueOn()).isEqualTo(signed.plusMonths(12));
        assertThat(items.get(0).recipient()).isEqualTo(Recipient.BOTH);
    }

    @Test
    @DisplayName("no consent on file raises an immediate reminder, not silence")
    void raisesReminderWhenNoConsentExists() {
        Client client = new Client("C-9002", "Mr", "Test", "Client");

        List<ReminderItem> items = rule.generate(client);

        assertThat(items).hasSize(1);
        assertThat(items.get(0).title()).contains("No signed client consent");
        assertThat(items.get(0).dueOn()).isBeforeOrEqualTo(LocalDate.now().plusDays(3));
    }

    @Test
    @DisplayName("the most recent signature wins when consent has been renewed")
    void usesLatestSignature() {
        Client client = new Client("C-9003", "Dr", "Test", "Client");
        client.getDocuments().add(new ComplianceDocument(client,
                DocumentType.CLIENT_CONSENT, LocalDate.now().minusYears(2)));
        client.getDocuments().add(new ComplianceDocument(client,
                DocumentType.CLIENT_CONSENT, LocalDate.now().minusMonths(1)));

        List<ReminderItem> items = rule.generate(client);

        assertThat(items.get(0).dueOn()).isEqualTo(LocalDate.now().minusMonths(1).plusMonths(12));
    }
}
