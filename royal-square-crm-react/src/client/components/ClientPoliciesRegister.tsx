import React from 'react';
import { useClient } from '../context/ClientContext';
import {
  Car,
  HeartPulse,
  Landmark,
  Briefcase,
  ShieldCheck
} from 'lucide-react';
import { UnderwritingPolicy } from '../types/client';

export const ClientPoliciesRegister: React.FC = () => {
  const { client } = useClient();

  const totalMonthlyPremium = client.policies.reduce((acc, p) => acc + p.monthlyPremium, 0);

  const getPolicyIcon = (category: UnderwritingPolicy['category']) => {
    switch (category) {
      case 'MOTOR_PROPERTY':
        return <Car size={16} className="text-gold" />;
      case 'PERSONAL':
        return <HeartPulse size={16} className="text-blue" />;
      case 'INVESTMENT':
        return <Landmark size={16} className="text-emerald" />;
      case 'BUSINESS':
        return <Briefcase size={16} className="text-royal" />;
      default:
        return <ShieldCheck size={16} className="text-gold" />;
    }
  };

  const getStatusBadge = (status: UnderwritingPolicy['status']) => {
    switch (status) {
      case 'In Force':
        return <span className="policy-status-pill in-force">In Force</span>;
      case 'Active Debit':
        return <span className="policy-status-pill debit">Active Debit</span>;
      case 'Full Executive':
        return <span className="policy-status-pill executive">Full Executive</span>;
      default:
        return <span className="policy-status-pill active">Active</span>;
    }
  };

  return (
    <div className="policies-register-view">
      {/* SLA Mandate Banner */}
      <div className="mandate-summary-banner">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-sla">8/8 PERSONAL ENROLLED &bull; 2/2 COMMERCIAL ENROLLED</span>
              <span className="badge-astute">Astute Exchange Synced</span>
            </div>
            <h2 className="mandate-title mt-1">Comprehensive Financial Services Scope (SLA Mandate)</h2>
            <p className="mandate-desc">
              Royal Square Financial Institutional Scope Matrix under FAIS CAT I & II Regulation.
            </p>
          </div>
          <div className="mandate-right-card">
            <span className="mr-label">Monthly Combined Premium</span>
            <span className="mr-amount font-mono">R {totalMonthlyPremium.toLocaleString()}.00 pm</span>
            <span className="mr-sub">Consolidated Debit Order via Astute Exchange</span>
          </div>
        </div>
      </div>

      {/* Policies Table Card */}
      <div className="policies-table-card">
        <div className="table-header-block">
          <div>
            <h3 className="text-base font-bold text-white">Integrated Active Policies & Underwriting Register</h3>
            <p className="text-xs text-muted">
              Live synchronization via Astute Exchange &bull; Pass-through underwriting active
            </p>
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="policies-data-table">
            <thead>
              <tr>
                <th>Policy / Asset Type</th>
                <th>Product Provider</th>
                <th>Policy No.</th>
                <th>Sum Assured / Value</th>
                <th>Premium (pm)</th>
                <th>Status</th>
                <th>Next Review</th>
              </tr>
            </thead>
            <tbody>
              {client.policies.map((p) => (
                <tr key={p.id}>
                  <td className="cell-policy-title">
                    <div className="flex items-center gap-2">
                      {getPolicyIcon(p.category)}
                      <span className="font-semibold text-white">{p.title}</span>
                    </div>
                  </td>
                  <td className="cell-provider">
                    <span className="provider-name">{p.provider}</span>
                  </td>
                  <td className="cell-policy-no">
                    <span className="font-mono text-gold">{p.policyNumber}</span>
                  </td>
                  <td className="cell-sum-assured">
                    <span className="font-mono font-medium">{typeof p.sumAssured === 'number' ? `R ${p.sumAssured.toLocaleString()}` : p.sumAssured}</span>
                  </td>
                  <td className="cell-premium">
                    <span className="font-mono font-semibold">
                      {p.monthlyPremium > 0 ? `R ${p.monthlyPremium.toLocaleString()}.00` : 'Ad-hoc Lump'}
                    </span>
                  </td>
                  <td className="cell-status">
                    {getStatusBadge(p.status)}
                  </td>
                  <td className="cell-review">
                    <span className="text-xs text-muted">{p.nextReview}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
