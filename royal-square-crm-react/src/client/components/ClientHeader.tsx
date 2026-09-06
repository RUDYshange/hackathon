import React from 'react';
import { useClient } from '../context/ClientContext';
import {
  Shield,
  Type,
  SunMedium,
  CheckCircle2,
  Lock,
  PhoneCall
} from 'lucide-react';
import { FontSizeSetting, ThemeToneSetting } from '../types/client';

export const ClientHeader: React.FC = () => {
  const { client, accessibility, setFontSize, setThemeTone } = useClient();

  return (
    <header className="client-portal-header">
      <div className="client-header-container">
        {/* Left: Private Client Brand & Verified Identity */}
        <div className="client-brand-block">
          <div className="client-brand-mark" aria-hidden="true">
            <Shield size={22} className="text-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="client-brand-title">Royal Square Wealth Advisory</h1>
              <span className="client-badge-verified">
                <CheckCircle2 size={12} /> {client.tier}
              </span>
            </div>
            <p className="client-brand-sub">
              {client.fullName} &bull; FSP 29370 &bull; Astute Exchange Connected
            </p>
          </div>
        </div>

        {/* Center: 1-Tap Accessibility Controls (Senior / 60+ Ease of Use) */}
        <div className="client-accessibility-bar" aria-label="Accessibility and visual tone controls">
          <div className="font-size-switcher" title="Adjust text size for easier reading (up to 22px for 60+ accessibility)">
            <span className="switcher-label">
              <Type size={14} /> Text size:
            </span>
            <div className="font-size-buttons">
              {(['normal', 'large', 'xlarge'] as FontSizeSetting[]).map((size) => {
                const labelMap = { normal: 'A', large: 'A+', xlarge: 'A++ (60+)' };
                const descMap = { normal: '15px standard', large: '18px large', xlarge: '22px accessible' };
                const isActive = accessibility.fontSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    className={`btn-font-size ${isActive ? 'active' : ''}`}
                    onClick={() => setFontSize(size)}
                    aria-pressed={isActive}
                    title={`Set reading text size to ${descMap[size]}`}
                  >
                    {labelMap[size]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="tone-switcher" title="Adjust visual contrast and palette softening">
            <span className="switcher-label">
              <SunMedium size={14} /> Tone:
            </span>
            <div className="tone-buttons">
              {(['soft', 'contrast', 'executive'] as ThemeToneSetting[]).map((tone) => {
                const toneLabels = {
                  soft: 'Calming Soft',
                  contrast: 'High Contrast',
                  executive: 'Executive'
                };
                const isActive = accessibility.tone === tone;
                return (
                  <button
                    key={tone}
                    type="button"
                    className={`btn-tone ${isActive ? 'active' : ''}`}
                    onClick={() => setThemeTone(tone)}
                    aria-pressed={isActive}
                  >
                    {toneLabels[tone]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Security & 24/7 Helpline */}
        <div className="client-actions-block">
          <div className="security-badge-header">
            <Lock size={13} className="text-emerald" />
            <span>POPIA Encrypted Vault</span>
          </div>

          <a
            href="tel:0800111222"
            className="btn-header-emergency"
            title="Santam 24/7 Emergency Dispatch & Towing"
          >
            <PhoneCall size={14} />
            <span>Emergency 0800 111 222</span>
          </a>
        </div>
      </div>
    </header>
  );
};
