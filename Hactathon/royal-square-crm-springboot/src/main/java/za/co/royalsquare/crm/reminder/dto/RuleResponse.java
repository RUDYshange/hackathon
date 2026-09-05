package za.co.royalsquare.crm.reminder.dto;

public record RuleResponse(
        String key,
        String name,
        String frequency,
        String recipient,
        String channel,
        int noticeDays,
        String rationale,
        long openItemCount
) {}
