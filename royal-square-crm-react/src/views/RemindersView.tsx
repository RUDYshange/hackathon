import React, { useEffect, useMemo, useState } from 'react';
import { secureFetch } from '../services/api';
import { BellRing, Check, ShieldCheck, Clock, Mail, MessageSquare, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface Reminder {
  key: string;
  clientId: string;
  clientName: string;
  ruleName: string;
  title: string;
  dueOn?: string;
  daysUntilDue: number;
  bucket: 'OVERDUE' | 'DUE_SOON' | 'UPCOMING';
  recipient: string;
  channel: string;
}

export const RemindersView: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchReminders = async () => {
    setIsLoading(true);
    const res = await secureFetch<Reminder[]>('/reminders');
    if (res.data) {
      setReminders(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleDismiss = async (key: string) => {
    await secureFetch('/reminders/dismiss', {
      method: 'POST',
      body: JSON.stringify({ key })
    });
    setReminders((prev) => prev.filter((r) => r.key !== key));
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'EMAIL':
        return <Mail size={14} />;
      case 'SMS':
        return <MessageSquare size={14} />;
      case 'CALENDAR':
      default:
        return <Calendar size={14} />;
    }
  };

  const remindersByDate = useMemo(() => reminders.reduce<Record<string, Reminder[]>>((groups, reminder) => {
    const date = reminderDate(reminder);
    (groups[date] ||= []).push(reminder);
    return groups;
  }, {}), [reminders]);
  const visibleReminders = selectedDate ? remindersByDate[selectedDate] || [] : reminders;
  const monthLabel = calendarMonth.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
  const calendarDays = getCalendarDays(calendarMonth);

  const moveMonth = (amount: number) => {
    setSelectedDate(null);
    setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + amount, 1));
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Compliance & Advisory Reminders</h1>
          <p className="view-subtitle">Derived dynamically from rules engine — zero stale reminders</p>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <Clock className="spin-icon text-gold" size={24} />
          <p>Evaluating active rules against client registers...</p>
        </div>
      ) : reminders.length === 0 ? (
        <div className="empty-state">
          <ShieldCheck size={40} className="text-gold" />
          <h3>All Clear!</h3>
          <p>No compliance renewals or review milestones require attention.</p>
        </div>
      ) : (<>
        <section className="reminder-calendar" aria-label="Reminder calendar">
          <div className="calendar-toolbar"><div><h2>{monthLabel}</h2><p>Choose a date to focus the reminder queue.</p></div><div className="calendar-controls"><button className="icon-button calendar-nav" aria-label="Previous month" onClick={() => moveMonth(-1)}><ChevronLeft size={17} /></button><button className="calendar-today" onClick={() => { setCalendarMonth(startOfMonth(new Date())); setSelectedDate(null); }}>Today</button><button className="icon-button calendar-nav" aria-label="Next month" onClick={() => moveMonth(1)}><ChevronRight size={17} /></button></div></div>
          <div className="calendar-weekdays">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid">{calendarDays.map((day) => {
            const dateKey = dateToKey(day); const events = remindersByDate[dateKey] || []; const isCurrentMonth = day.getMonth() === calendarMonth.getMonth(); const isToday = dateKey === dateToKey(new Date()); const isSelected = dateKey === selectedDate;
            return <button key={dateKey} className={`calendar-day ${isCurrentMonth ? '' : 'outside-month'} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedDate(isSelected ? null : dateKey)} aria-pressed={isSelected}><span>{day.getDate()}</span>{events.slice(0, 2).map((event) => <small key={event.key} className={`calendar-event bucket-${event.bucket.toLowerCase()}`}>{event.title}</small>)}{events.length > 2 && <small className="calendar-more">+{events.length - 2} more</small>}</button>;
          })}</div>
        </section>
        <div className="reminder-list-header"><h2>{selectedDate ? `Reminders for ${formatDate(selectedDate)}` : 'All active reminders'}</h2>{selectedDate && <button className="plain-action" onClick={() => setSelectedDate(null)}>Show all</button>}</div>
        {visibleReminders.length === 0 ? <div className="calendar-empty">No reminders are due on this date.</div> : <div className="reminders-list">
          {visibleReminders.map((rem) => (
            <div key={rem.key} className={`reminder-card bucket-${rem.bucket.toLowerCase()}`}>
              <div className="reminder-left">
                <div className="reminder-icon-box">
                  <BellRing size={18} />
                </div>
                <div>
                  <div className="reminder-title-row">
                    <h3 className="reminder-title">{rem.title}</h3>
                    <span className={`pill-badge bucket-${rem.bucket.toLowerCase()}`}>
                      {rem.bucket.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="reminder-desc">
                    Rule: <strong>{rem.ruleName}</strong> | Client: <strong>{rem.clientName}</strong>
                  </p>
                  <div className="reminder-meta-row">
                    <span className="channel-tag">
                      {getChannelIcon(rem.channel)} {rem.channel} to {rem.recipient}
                    </span>
                    <span className="due-tag">
                      {rem.daysUntilDue < 0
                        ? `Overdue by ${Math.abs(rem.daysUntilDue)} days`
                        : rem.daysUntilDue === 0
                        ? 'Due Today'
                        : `Due in ${rem.daysUntilDue} days`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="reminder-right">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDismiss(rem.key)}
                  title="Dismiss this notification"
                >
                  <Check size={14} /> Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>}
      </>)}
    </div>
  );
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const dateToKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const reminderDate = (reminder: Reminder) => reminder.dueOn && /^\d{4}-\d{2}-\d{2}/.test(reminder.dueOn) ? reminder.dueOn.slice(0, 10) : dateToKey(new Date(Date.now() + reminder.daysUntilDue * 86400000));
const formatDate = (key: string) => new Date(`${key}T12:00:00`).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' });
const getCalendarDays = (month: Date) => {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
};
