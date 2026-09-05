package za.co.royalsquare.crm.reminder;

import za.co.royalsquare.crm.client.Client;

import java.util.List;

/**
 * One reminder rule.
 *
 * This is the Strategy pattern. Every rule is a separate class implementing the
 * same interface, and Spring injects all of them into the engine as a List. To
 * add "notify us 60 days before a fixed deposit matures", you write one class
 * and change nothing else — no switch statement to extend, no engine to edit,
 * and the new rule can be tested on its own.
 *
 * The brief said "assume the list keeps growing". This is what that sentence
 * means for the design.
 */
public interface ReminderRule {

    /** Stable identifier used in reminder keys. Never change it once shipped. */
    String key();

    /** Shown in the rules table in the interface. */
    String name();

    String frequency();

    Recipient recipient();

    Channel channel();

    /** Days of notice before the due date. */
    int noticeDays();

    /** Why the rule exists. Shown to advisers so the queue is not a black box. */
    String rationale();

    /**
     * Produce the reminders this rule raises for one client. Returning a list
     * rather than a single item lets one rule cover several policies.
     */
    List<ReminderItem> generate(Client client);
}
