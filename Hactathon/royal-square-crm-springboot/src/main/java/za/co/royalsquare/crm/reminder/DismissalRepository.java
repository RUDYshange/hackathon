package za.co.royalsquare.crm.reminder;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DismissalRepository extends JpaRepository<ReminderDismissal, UUID> {

    boolean existsByReminderKey(String reminderKey);

    void deleteByReminderKey(String reminderKey);
}
