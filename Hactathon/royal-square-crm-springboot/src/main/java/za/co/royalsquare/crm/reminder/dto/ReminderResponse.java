package za.co.royalsquare.crm.reminder.dto;

import java.time.LocalDate;
import java.util.UUID;

public record ReminderResponse(
        String key,
        UUID clientId,
        String clientName,
        String ruleName,
        String title,
        LocalDate dueOn,
        long daysUntilDue,
        String bucket,
        String recipient,
        String channel
) {}
