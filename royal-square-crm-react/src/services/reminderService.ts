/**
 * Reminder & Calendar Scheduling Service — Royal Square CRM
 */
import { secureFetch } from './api';

export interface CalendarReminderInput {
  title: string;
  clientName?: string;
  clientId?: string;
  dueOn: string; // YYYY-MM-DD or ISO string
  dueTime?: string; // HH:mm
  channel: 'CALENDAR' | 'SMS' | 'EMAIL';
  ruleName?: string;
  notes?: string;
}

export class CalendarReminderService {
  private static readonly STORAGE_KEY = 'royal_square_adviser_reminders';

  /**
   * Schedule a new calendar / compliance reminder.
   */
  public static async scheduleReminder(input: CalendarReminderInput): Promise<any> {
    const reminderRecord = {
      key: `manual-${crypto.randomUUID()}`,
      clientId: input.clientId || 'short-term-claims',
      clientName: input.clientName || 'Short-Term Motor Claim',
      ruleName: input.ruleName || 'Accident Claim Follow-Up',
      title: input.title,
      dueOn: input.dueOn,
      dueTime: input.dueTime || '09:00',
      daysUntilDue: this.computeDaysUntilDue(input.dueOn),
      bucket: this.computeBucket(input.dueOn),
      recipient: 'Client & Claims Officer',
      channel: input.channel,
      notes: input.notes,
      createdAt: new Date().toISOString()
    };

    // 1. Persist to localStorage for immediate reactive UI
    try {
      const existingStr = localStorage.getItem(this.STORAGE_KEY);
      const existing = existingStr ? JSON.parse(existingStr) : [];
      existing.unshift(reminderRecord);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing));
    } catch (err) {
      console.warn('[CalendarReminderService] LocalStorage error:', err);
    }

    // 2. Dispatch event for active views
    window.dispatchEvent(
      new CustomEvent('crm:reminder_created', { detail: reminderRecord })
    );

    // 3. Post to backend if API route is available
    try {
      await secureFetch('/reminders', {
        method: 'POST',
        body: JSON.stringify(reminderRecord)
      });
    } catch {
      // Graceful fallback to client-side persistence
    }

    return reminderRecord;
  }

  private static computeDaysUntilDue(dueOn: string): number {
    const dueDate = new Date(`${dueOn.slice(0, 10)}T12:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((dueDate.getTime() - today.getTime()) / 86400000);
  }

  private static computeBucket(dueOn: string): 'OVERDUE' | 'DUE_SOON' | 'UPCOMING' {
    const days = this.computeDaysUntilDue(dueOn);
    if (days < 0) return 'OVERDUE';
    if (days <= 7) return 'DUE_SOON';
    return 'UPCOMING';
  }
}
