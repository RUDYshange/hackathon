package za.co.royalsquare.crm.reminder.rules;

import org.springframework.stereotype.Component;
import za.co.royalsquare.crm.client.Client;
import za.co.royalsquare.crm.reminder.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Birthdays and anniversaries. The only rule in the set that exists for the
 * relationship rather than for compliance, and the brief marks it automated.
 */
@Component
public class BirthdayRule implements ReminderRule {

    @Override public String key() { return "birthday"; }
    @Override public String name() { return "Birthdays and anniversaries"; }
    @Override public String frequency() { return "Annually"; }
    @Override public Recipient recipient() { return Recipient.US; }
    @Override public Channel channel() { return Channel.AUTOMATED_MESSAGE; }
    @Override public int noticeDays() { return 0; }

    @Override
    public String rationale() {
        return "Automated. Keeps the relationship warm.";
    }

    @Override
    public List<ReminderItem> generate(Client client) {
        List<ReminderItem> items = new ArrayList<>();

        if (client.getDateOfBirth() != null) {
            LocalDate due = nextOccurrence(client.getDateOfBirth());
            int turning = due.getYear() - client.getDateOfBirth().getYear();
            items.add(new ReminderItem(
                    ReminderItem.buildKey(client, key(), due, "birthday"),
                    client, name(), "Birthday - turns " + turning, due, recipient(), channel()));
        }

        if (client.getWeddingAnniversary() != null) {
            LocalDate due = nextOccurrence(client.getWeddingAnniversary());
            int years = due.getYear() - client.getWeddingAnniversary().getYear();
            items.add(new ReminderItem(
                    ReminderItem.buildKey(client, key(), due, "anniversary"),
                    client, name(), "Wedding anniversary - " + years + " years",
                    due, recipient(), channel()));
        }

        return items;
    }

    /** The next time this day of the year comes around. */
    private LocalDate nextOccurrence(LocalDate original) {
        LocalDate today = LocalDate.now();
        LocalDate thisYear = original.withYear(today.getYear());
        return thisYear.isBefore(today) ? thisYear.plusYears(1) : thisYear;
    }
}
