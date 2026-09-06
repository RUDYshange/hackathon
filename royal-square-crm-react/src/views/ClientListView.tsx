import React, { useEffect, useState } from 'react';
import { secureFetch } from '../services/api';
import { Search, UserPlus, ShieldAlert, ArrowUpRight, ChevronRight, Mail, Tag } from 'lucide-react';

interface ClientSummary {
  id: string;
  reference: string;
  fullName: string;
  initials: string;
  occupation?: string;
  employer?: string;
  mobileNumber?: string;
  netWorth: number | string;
  riskProfile: string;
  riskScore?: number;
  complianceGapCount: number;
  nextReviewDate?: string;
  daysUntilReview?: number;
}

interface ClientListViewProps {
  initialSearch?: string;
  onNewClientClick: () => void;
  onSelectClient?: (clientId: string) => void;
}

export const ClientListView: React.FC<ClientListViewProps> = ({
  initialSearch = '',
  onNewClientClick,
  onSelectClient
}) => {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [search, setSearch] = useState<string>(initialSearch);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async (query = '') => {
    setIsLoading(true);
    setError(null);
    const endpoint = query ? `/clients?q=${encodeURIComponent(query)}` : '/clients';
    const res = await secureFetch<ClientSummary[]>(endpoint);
    if (res.error) {
      setError(res.error);
    } else {
      setClients(res.data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    setSearch(initialSearch);
    setSelectedIds([]);
    fetchClients(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => clients.some((client) => client.id === id)));
  }, [clients]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClients(search);
  };

  const formatZar = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0
    }).format(num || 0);
  };

  const allSelected = clients.length > 0 && selectedIds.length === clients.length;
  const toggleSelected = (clientId: string) => {
    setSelectedIds((current) => current.includes(clientId)
      ? current.filter((id) => id !== clientId)
      : [...current, clientId]);
  };
  const toggleAll = () => setSelectedIds(allSelected ? [] : clients.map((client) => client.id));
  const formatReviewDate = (value?: string) => value
    ? new Date(value).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Not scheduled';

  return (
    <div className="view-container">
      {/* Header bar */}
      <div className="view-header">
        <div>
          <h1 className="view-title">Wealth Mandate Portfolio</h1>
          <p className="view-subtitle">FAIS & POPIA compliant client advisory register</p>
        </div>
        <button className="btn btn-primary" onClick={onNewClientClick}>
          <UserPlus size={16} /> Onboard New Client
        </button>
      </div>

      {/* Search & filters */}
      <form className="search-bar-form" onSubmit={handleSearchSubmit}>
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by client name, reference (CLI-xxxx), ID number, or employer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-secondary">
          Filter
        </button>
      </form>

      {/* Content list */}
      {isLoading ? (
        <div className="loading-container">
          <div className="skeleton-row" />
          <div className="skeleton-row" />
          <div className="skeleton-row" />
        </div>
      ) : error ? (
        <div className="alert-banner alert-error">
          <ShieldAlert size={20} />
          <span>{error}</span>
        </div>
      ) : clients.length === 0 ? (
        <div className="empty-state">
          <p>No clients found matching your criteria.</p>
        </div>
      ) : (
        <section className="client-register-panel">
          <div className="bulk-action-bar">
            <span><b>{selectedIds.length}</b> selected</span>
            <button className="btn btn-secondary btn-sm" disabled={!selectedIds.length} title="Set status">
              <Tag size={14} /> Set Status <ChevronRight size={13} />
            </button>
            <button className="btn btn-primary btn-sm" disabled={!selectedIds.length} title="Send follow-up">
              <Mail size={14} /> Send Follow-up
            </button>
          </div>
          <div className="client-table-wrap">
            <table className="client-table">
              <thead>
                <tr>
                  <th className="client-check-cell"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all clients" /></th>
                  <th>Client</th><th>Contact</th><th>Portfolio</th><th>Compliance</th><th>Renewal</th><th>Status</th><th aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => {
                  const selected = selectedIds.includes(client.id);
                  const overdue = (client.daysUntilReview ?? 999) <= 30;
                  const status = client.complianceGapCount === 0 ? 'Active' : 'Pending';
                  return (
                    <tr key={client.id} className={selected ? 'selected-row' : ''}>
                      <td className="client-check-cell">
                        <input type="checkbox" checked={selected} onChange={() => toggleSelected(client.id)} aria-label={`Select ${client.fullName}`} />
                      </td>
                      <td><button className="client-table-name" onClick={() => onSelectClient?.(client.id)}>{client.fullName}</button><span className="client-table-id">{client.reference}</span></td>
                      <td><span>{client.mobileNumber || 'No phone captured'}</span><small>{client.occupation || client.employer || 'Private wealth client'}</small></td>
                      <td><b>{formatZar(client.netWorth)}</b><small>{client.riskProfile} mandate</small></td>
                      <td><span>{Math.max(0, 3 - client.complianceGapCount)}/3</span><small>{client.complianceGapCount ? `${client.complianceGapCount} gap${client.complianceGapCount > 1 ? 's' : ''}` : 'Complete'}</small></td>
                      <td className={overdue ? 'renewal-urgent' : ''}>{formatReviewDate(client.nextReviewDate)}<small>{client.daysUntilReview !== undefined && client.daysUntilReview !== null ? client.daysUntilReview < 0 ? `${Math.abs(client.daysUntilReview)}d overdue` : `in ${client.daysUntilReview}d` : 'No date'}</small></td>
                      <td><span className={`status-chip ${status === 'Active' ? 'ok' : 'pending'}`}><span className="dot" /> {status}</span></td>
                      <td><button className="client-open-button" onClick={() => onSelectClient?.(client.id)} aria-label={`Open ${client.fullName}`}><ArrowUpRight size={16} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
