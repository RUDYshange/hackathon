import React from 'react';
import { useClient } from '../context/ClientContext';
import {
  Car,
  PhoneCall,
  Mail,
  CheckCircle2
} from 'lucide-react';

export const ClientPolicyOverview: React.FC = () => {
  const { client } = useClient();

  return (
    <div className="client-policy-view">
      <div className="policy-hero-card">
        <div className="hero-badge-row">
          <span className="badge-active-policy">
            <CheckCircle2 size={13} /> ACTIVE POLICY
          </span>
          <span className="badge-insurer">{client.insuredVehicle.insurer}</span>
        </div>
        <h2 className="policy-headline">{client.insuredVehicle.coverLevel}</h2>
        <p className="policy-number font-mono">Policy Ref: {client.insuredVehicle.policyNumber}</p>

        <div className="policy-stats-grid">
          <div className="stat-box">
            <span className="stat-label">Standard Excess</span>
            <span className="stat-val">R {client.insuredVehicle.excessAmount.toLocaleString()}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Cover Level</span>
            <span className="stat-val">{client.insuredVehicle.coverLevel}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Car Hire Included</span>
            <span className="stat-val text-emerald">Yes (Executive Group / 30 Days)</span>
          </div>
        </div>
      </div>

      {/* Insured Vehicle Card */}
      <div className="vehicle-details-card">
        <div className="flex items-center gap-2 mb-3">
          <Car size={20} className="text-gold" />
          <h3 className="text-base font-bold">Insured Motor Vehicle</h3>
        </div>
        <div className="vehicle-specs-grid">
          <div className="spec-row">
            <span className="spec-name">Make & Model</span>
            <span className="spec-val">
              {client.insuredVehicle.year} {client.insuredVehicle.make} {client.insuredVehicle.model}
            </span>
          </div>
          <div className="spec-row">
            <span className="spec-name">Registration Plate</span>
            <span className="spec-val font-mono text-gold">{client.insuredVehicle.registration}</span>
          </div>
          <div className="spec-row">
            <span className="spec-name">VIN / Chassis Number</span>
            <span className="spec-val font-mono">{client.insuredVehicle.vin}</span>
          </div>
          <div className="spec-row">
            <span className="spec-name">Vehicle Color</span>
            <span className="spec-val">{client.insuredVehicle.color}</span>
          </div>
        </div>
      </div>

      {/* Advisor & Emergency Hotline */}
      <div className="policy-support-grid">
        <div className="support-card advisor-card">
          <h4 className="support-title">Your Assigned Financial Advisor</h4>
          <p className="advisor-name">{client.advisor.name}</p>
          <p className="advisor-fsp">{client.advisor.fspNumber}</p>
          <div className="advisor-contact-lines">
            <a href={`tel:${client.advisor.phone}`} className="contact-link">
              <PhoneCall size={14} /> {client.advisor.phone}
            </a>
            <a href={`mailto:${client.advisor.email}`} className="contact-link">
              <Mail size={14} /> {client.advisor.email}
            </a>
          </div>
        </div>

        <div className="support-card emergency-card">
          <h4 className="support-title text-gold">24/7 Santam Roadside & Towing</h4>
          <p className="emergency-desc">
            Authorized emergency towing and accident dispatch across South Africa.
          </p>
          <a href="tel:0800111222" className="btn-call-emergency">
            <PhoneCall size={16} /> Call 0800 111 222
          </a>
          <span className="emergency-sub">Toll-free 24/7 &bull; Quote policy #{client.insuredVehicle.policyNumber}</span>
        </div>
      </div>
    </div>
  );
};
