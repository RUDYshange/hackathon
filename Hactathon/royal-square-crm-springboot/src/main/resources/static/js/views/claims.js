/**
 * Claim list. api.claims.list().
 *
 * Follow the shape of clients.js: loading() first, then fetch, then render,
 * with errorState() offering a retry.
 */

import { loading, render, errorState } from '../ui.js';

export async function claimsView() {
  loading();
  render('<div class="panel"><div class="empty"><b>Not ported yet</b>'
    + 'This view still lives in the prototype file.</div></div>');
}
