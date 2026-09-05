package za.co.royalsquare.crm.reminder;

import za.co.royalsquare.crm.client.Client;

import java.time.LocalDate;

/**
 * A generated reminder. Not an entity — these are derived from client data
 * every time they are asked for, so there is no table of them to fall out of
 * date. Only dismissals are persisted.
 */
public record ReminderItem(
        String key,
        Client client,
        String ruleName,
        String title,
        LocalDate dueOn,
        Recipient recipient,
        Channel channel
) {

    /**
     * A stable identifier built from the client, the rule and the date. The
     * same reminder generated tomorrow produces the same key, which is how a
     * dismissal sticks.
     */
    public static String buildKey(Client client, String ruleKey, LocalDate due, String tag) {
        return client.getReference() + ":" + ruleKey + ":" + due + (tag == null ? "" : ":" + tag);
    }
}
