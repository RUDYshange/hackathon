/**
 * The obligations queue. Port from the prototype, replacing the in-memory
 * buildReminders() call with api.reminders.queue().
 *
 * Follow the shape of clients.js: loading() first, then fetch, then render,
 * with errorState() offering a retry.
 */

import { loading, render, errorState } from '../ui.js';

export async function deskView() {
  loading();
  render('<div class="panel"><div class="empty"><b>Not ported yet</b>'
    + 'This view still lives in the prototype file.</div></div>');
}
