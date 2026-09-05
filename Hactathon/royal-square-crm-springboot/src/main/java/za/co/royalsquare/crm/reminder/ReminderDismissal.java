package za.co.royalsquare.crm.reminder;

import jakarta.persistence.*;
import za.co.royalsquare.crm.common.Auditable;

import java.util.UUID;

/**
 * The only part of the reminder system that is stored. Reminders themselves are
 * derived; a dismissal is a decision a person made and has to survive a restart.
 */
@Entity
@Table(name = "reminder_dismissal")
public class ReminderDismissal extends Auditable {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true, length = 200)
    private String reminderKey;

    protected ReminderDismissal() { }

    public ReminderDismissal(String reminderKey) {
        this.reminderKey = reminderKey;
    }

    public String getReminderKey() { return reminderKey; }
}
