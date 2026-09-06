import React from 'react';
import { ARCHITECTURE_ROADMAP } from '../constants/roadmap';
import {
  Sparkles,
  X,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface RoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoadmapModal: React.FC<RoadmapModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="roadmap-modal-backdrop" onClick={onClose}>
      <div className="roadmap-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="roadmap-modal-header">
          <div className="flex items-center gap-2">
            <div className="roadmap-icon-badge">
              <Sparkles size={20} className="text-gold" />
            </div>
            <div>
              <h2 className="modal-title">Reviewer Feedback & Pitch Architecture</h2>
              <p className="modal-subtitle">
                Tonight's strategic scope focus vs. roadmap talking points for the judges.
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon-subtle" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="roadmap-modal-body">
          {/* Highlight Banner: Scope Focus */}
          <div className="reviewer-directive-card">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-emerald">
                  Reviewer Core Correction Implemented
                </h3>
                <p className="text-xs text-secondary mt-1">
                  <strong>"Client side needs to be simpler — assume account already has their details, client only describes what happened."</strong>{' '}
                  This is a scope reduction: cuts 8+ redundant input fields, focuses 100% on the incident story via Voice/Text, GPS location pinning, and photo evidence gating.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Pitch Talking Points Grid */}
          <div className="pitch-talking-points-grid">
            <div className="pitch-point-card">
              <h4 className="pitch-title">1. Senior / 60+ Accessibility</h4>
              <p className="pitch-text">
                UI softened with 1-tap font scaling up to 22px base font and calming contrast for clients under stress.
              </p>
            </div>
            <div className="pitch-point-card">
              <h4 className="pitch-title">2. POPIA Act Compliance</h4>
              <p className="pitch-text">
                "We use Google / Azure enterprise cloud infrastructure, which is how the industry itself already shifts and manages this liability."
              </p>
            </div>
            <div className="pitch-point-card">
              <h4 className="pitch-title">3. PEP Screening (Next Milestone)</h4>
              <p className="pitch-text">
                "We have identified automated PEP screening as our next compliance gate to eliminate 1hr/client manual FIC lookups."
              </p>
            </div>
            <div className="pitch-point-card">
              <h4 className="pitch-title">4. Pass-Through Underwriting</h4>
              <p className="pitch-text">
                "Eliminates re-entering client KYC details separately for each different product with a different insurer."
              </p>
            </div>
          </div>

          {/* Detailed Roadmap Matrix */}
          <h3 className="section-subtitle mt-4 mb-2">Roadmap Matrix</h3>
          <div className="roadmap-items-list">
            {ARCHITECTURE_ROADMAP.map((item) => (
              <div key={item.id} className="roadmap-item-row">
                <div className="roadmap-item-status">
                  {item.status === 'COMPLETED' ? (
                    <span className="badge-status completed">
                      <CheckCircle2 size={12} /> Built Tonight
                    </span>
                  ) : (
                    <span className="badge-status roadmap">
                      <Clock size={12} /> Pitch Roadmap
                    </span>
                  )}
                </div>
                <div className="roadmap-item-details">
                  <h4 className="item-title">{item.title}</h4>
                  <p className="item-desc">{item.description}</p>
                  <p className="item-pitch-cue">
                    <strong>Pitch Cue:</strong> {item.talkingPoint}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="roadmap-modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close & Continue Client Flow
          </button>
        </div>
      </div>
    </div>
  );
};
