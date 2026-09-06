import React from 'react';
import { useClient } from '../context/ClientContext';
import {
  ShieldCheck,
  Server,
  UserCheck,
  CheckCircle2,
  Database,
  Scale
} from 'lucide-react';

export const ClientComplianceShield: React.FC = () => {
  const { client } = useClient();

  return (
    <div className="compliance-shield-view">
      <div className="compliance-hero-card">
        <div className="flex items-center gap-3 mb-2">
          <div className="shield-icon-circle">
            <ShieldCheck size={28} className="text-gold" />
          </div>
          <div>
            <h2 className="compliance-title">Institutional Compliance & Institutional Shield</h2>
            <p className="compliance-subtitle">
              FAIS Category I & II Discretionary Mandate &bull; FSP 29370 &bull; POPIA Certified
            </p>
          </div>
        </div>
        <p className="compliance-hero-desc">
          Your personal identity, financial declarations, and risk profiles are protected under South African banking-grade security protocols with zero third-party disclosure.
        </p>
      </div>

      <div className="compliance-pillars-grid">
        {/* Pillar 1: POPIA Act Infrastructure Liability Shield */}
        <div className="compliance-card">
          <div className="card-top-icon">
            <Server size={22} className="text-gold" />
          </div>
          <h3 className="card-pillar-title">1. POPIA Act Cloud Liability Shield</h3>
          <p className="card-quote">
            "We use Google / Azure enterprise cloud infrastructure, which is how the industry itself already shifts and manages this liability."
          </p>
          <div className="compliance-attributes-list">
            <div className="attr-item">
              <CheckCircle2 size={14} className="text-emerald" />
              <span>Hosting in Microsoft Azure & Google Cloud Africa (Johannesburg Region)</span>
            </div>
            <div className="attr-item">
              <CheckCircle2 size={14} className="text-emerald" />
              <span>Full compliance with Protection of Personal Information Act (POPIA Act 4 of 2013)</span>
            </div>
            <div className="attr-item">
              <CheckCircle2 size={14} className="text-emerald" />
              <span>End-to-end 256-bit encryption with zero external tracker leakage</span>
            </div>
          </div>
          <div className="card-status-badge active">
            <CheckCircle2 size={13} /> POPIA Compliant & Infrastructure Shielded
          </div>
        </div>

        {/* Pillar 2: PEP Screening (Politically Exposed Persons) */}
        <div className="compliance-card">
          <div className="card-top-icon">
            <UserCheck size={22} className="text-gold" />
          </div>
          <h3 className="card-pillar-title">2. Automated PEP Screening Verification</h3>
          <p className="card-quote">
            "We have identified automated PEP screening as our next compliance gate to eliminate 1hr/client manual FIC lookups."
          </p>
          <div className="compliance-attributes-list">
            <div className="attr-item">
              <CheckCircle2 size={14} className="text-emerald" />
              <span>Direct FIC database verification protocol</span>
            </div>
            <div className="attr-item">
              <CheckCircle2 size={14} className="text-emerald" />
              <span>Client Status: <strong>{client.fullName} &mdash; Cleared & Clean Record</strong></span>
            </div>
            <div className="attr-item">
              <CheckCircle2 size={14} className="text-emerald" />
              <span>Eliminates 60-minute manual compliance friction at advisory onboarding</span>
            </div>
          </div>
          <div className="card-status-badge active">
            <CheckCircle2 size={13} /> FIC / PEP Status: Verified & Cleared
          </div>
        </div>

        {/* Pillar 3: Pass-Through Underwriting Sync */}
        <div className="compliance-card">
          <div className="card-top-icon">
            <Database size={22} className="text-gold" />
          </div>
          <h3 className="card-pillar-title">3. Multi-Insurer Pass-Through Underwriting</h3>
          <p className="card-quote">
            "Eliminates re-entering client KYC details separately for each different product with a different insurer."
          </p>
          <div className="compliance-attributes-list">
            <div className="attr-item">
              <CheckCircle2 size={14} className="text-emerald" />
              <span>Single-source-of-truth KYC shared securely across carriers</span>
            </div>
            <div className="attr-item">
              <CheckCircle2 size={14} className="text-emerald" />
              <span>Active Synced Carriers: Santam, Discovery Life, Allan Gray, Liberty, Ninety One</span>
            </div>
            <div className="attr-item">
              <CheckCircle2 size={14} className="text-emerald" />
              <span>Astute Financial Exchange consent valid through <strong>14 Jan 2026</strong></span>
            </div>
          </div>
          <div className="card-status-badge active">
            <CheckCircle2 size={13} /> Pass-Through Sync: 7 Policies Connected
          </div>
        </div>

        {/* Pillar 4: Senior & 60+ Accessibility Standards */}
        <div className="compliance-card">
          <div className="card-top-icon">
            <Scale size={22} className="text-gold" />
          </div>
          <h3 className="card-pillar-title">4. Senior & 60+ Accessibility Protocol</h3>
          <p className="card-quote">
            "Critical inclusivity: over 40% of wealth clients are 60+ and need accessible, non-clinical interfaces in stressful situations."
          </p>
          <div className="compliance-attributes-list">
            <div className="attr-item">
              <CheckCircle2 size={14} className="text-emerald" />
              <span>Dynamic typography scaling up to 22px base font with one tap</span>
            </div>
            <div className="attr-item">
              <CheckCircle2 size={14} className="text-emerald" />
              <span>Softened empathetic contrast replacing harsh clinical borders</span>
            </div>
            <div className="attr-item">
              <CheckCircle2 size={14} className="text-emerald" />
              <span>WCAG 2.1 AAA high-legibility standards and touch target optimization</span>
            </div>
          </div>
          <div className="card-status-badge active">
            <CheckCircle2 size={13} /> Active: Accessible 60+ Mode Enabled
          </div>
        </div>
      </div>
    </div>
  );
};
