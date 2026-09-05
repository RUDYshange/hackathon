/**
 * Wires the routes to the views. Each view is loaded as a module, so the
 * browser only parses what a screen needs.
 */

import { route, start, navigate } from './router.js';
import { clientsView } from './views/clients.js';

route('/', () => import('./views/desk.js').then((m) => m.deskView()));
route('/clients', () => clientsView());
route('/clients/:id', ({ id }) => import('./views/client-detail.js').then((m) => m.clientDetailView(id)));
route('/clients/:id/:tab', ({ id, tab }) => import('./views/client-detail.js').then((m) => m.clientDetailView(id, tab)));
route('/reminders', () => import('./views/reminders.js').then((m) => m.remindersView()));
route('/claims', () => import('./views/claims.js').then((m) => m.claimsView()));
route('/claims/:id', ({ id }) => import('./views/claim-detail.js').then((m) => m.claimDetailView(id)));
route('/compliance', () => import('./views/compliance.js').then((m) => m.complianceView()));

document.getElementById('q').addEventListener('input', (e) => {
  if (!location.hash.startsWith('#/clients')) navigate('/clients');
  clientsView(e.target.value);
});

document.getElementById('btnClient').onclick = () => navigate('/clients');
document.getElementById('btnClaim').onclick  = () => navigate('/claims');

start(() => navigate('/'));
