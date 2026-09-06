import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { secureFetch } from '../services/api';
import { BellRing, Check, ShieldCheck, Clock, Mail, MessageSquare, Calendar, ChevronLeft, ChevronRight, Plus, X, Send, Loader2 } from 'lucide-react';

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
  const [isAdding, setIsAdding] = useState(false);
  const [newReminder, setNewReminder] = useState({ title: '', clientName: '', dueOn: dateToKey(new Date()), channel: 'CALENDAR' });
  const [dispatchingKey, setDispatchingKey] = useState<string | null>(null);
  const [dispatchedMap, setDispatchedMap] = useState<Record<string, string>>({});

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

  const handleDispatch = async (rem: Reminder) => {
    setDispatchingKey(rem.key);
    try {
      const res = await secureFetch<{ status: string; deliverySummary: string }>('/reminders/dispatch', {
        method: 'POST',
        body: JSON.stringify({
          key: rem.key,
          clientId: rem.clientId,
          recipient: rem.recipient,
          channel: rem.channel,
          clientName: rem.clientName
        })
      });
      if (res.data?.deliverySummary) {
        setDispatchedMap((prev) => ({ ...prev, [rem.key]: res.data?.deliverySummary || 'Dispatched' }));
        setTimeout(() => {
          setReminders((prev) => prev.filter((r) => r.key !== rem.key));
        }, 2500);
      } else {
        setReminders((prev) => prev.filter((r) => r.key !== rem.key));
      }
    } catch {
      handleDismiss(rem.key);
    } finally {
      setDispatchingKey(null);
    }
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

  const openAddForm = () => {
    const dueOn = selectedDate || dateToKey(new Date());
    setNewReminder((current) => ({ ...current, dueOn }));
    setIsAdding(true);
  };
  const handleAddReminder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newReminder.title.trim()) return;
    const dueDate = new Date(`${newReminder.dueOn}T12:00:00`);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / 86400000);
    const bucket: Reminder['bucket'] = daysUntilDue < 0 ? 'OVERDUE' : daysUntilDue <= 7 ? 'DUE_SOON' : 'UPCOMING';
    setReminders((current) => [{
      key: `manual-${crypto.randomUUID()}`, clientId: 'manual', clientName: newReminder.clientName.trim() || 'General', ruleName: 'Adviser-created reminder',
      title: newReminder.title.trim(), dueOn: newReminder.dueOn, daysUntilDue, bucket, recipient: 'Adviser', channel: newReminder.channel
    }, ...current]);
    setCalendarMonth(startOfMonth(dueDate)); setSelectedDate(newReminder.dueOn); setNewReminder({ title: '', clientName: '', dueOn: dateToKey(new Date()), channel: 'CALENDAR' }); setIsAdding(false);
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-title">Compliance & Advisory Reminders</h1>
          <p className="view-subtitle">Derived dynamically from rules engine — zero stale reminders</p>
        </div>
        <button className="btn btn-primary" onClick={openAddForm}><Plus size={15} /> Add reminder</button>
      </div>

      {isAdding && <form className="add-reminder-form" onSubmit={handleAddReminder}>
        <div className="add-reminder-form-heading"><div><h2>Add calendar reminder</h2><p>This reminder will be added to the current calendar session.</p></div><button type="button" className="icon-button" onClick={() => setIsAdding(false)} aria-label="Close add reminder form"><X size={17} /></button></div>
        <label><span>Reminder</span><input autoFocus required value={newReminder.title} onChange={(event) => setNewReminder((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. Confirm annual review" /></label>
        <label><span>Client (optional)</span><input value={newReminder.clientName} onChange={(event) => setNewReminder((current) => ({ ...current, clientName: event.target.value }))} placeholder="Client name" /></label>
        <label><span>Due date</span><input required type="date" value={newReminder.dueOn} onChange={(event) => setNewReminder((current) => ({ ...current, dueOn: event.target.value }))} /></label>
        <label><span>Channel</span><select value={newReminder.channel} onChange={(event) => setNewReminder((current) => ({ ...current, channel: event.target.value }))}><option value="CALENDAR">Calendar</option><option value="EMAIL">Email</option><option value="SMS">SMS</option></select></label>
        <div className="add-reminder-actions"><button type="button" className="btn btn-secondary" onClick={() => setIsAdding(false)}>Cancel</button><button className="btn btn-primary" type="submit"><Plus size={15} /> Add to calendar</button></div>
      </form>}

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

              <div className="reminder-right" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {dispatchedMap[rem.key] ? (
                  <span className="pill-badge" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '12px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Check size={13} /> {dispatchedMap[rem.key]}
                  </span>
                ) : (
                  <>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleDispatch(rem)}
                      disabled={dispatchingKey === rem.key}
                      title={`Dispatch ${rem.channel} notice to ${rem.recipient}`}
                      style={{ background: '#1e3a8a', color: '#fff', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      {dispatchingKey === rem.key ? (
                        <Loader2 size={13} className="spin-icon" />
                      ) : rem.channel === 'SMS' ? (
                        <MessageSquare size={13} />
                      ) : rem.channel === 'EMAIL' ? (
                        <Mail size={13} />
                      ) : (
                        <Send size={13} />
                      )}
                      <span>Dispatch {rem.channel === 'EMAIL' ? 'Email' : rem.channel === 'SMS' ? 'SMS' : 'Notice'}</span>
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDismiss(rem.key)}
                      title="Dismiss this notification"
                    >
                      <Check size={14} /> Dismiss
                    </button>
                  </>
                )}
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
