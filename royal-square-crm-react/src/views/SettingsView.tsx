import React from 'react';
import { Languages, Check, Globe, Loader2, Info } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

export const SettingsView: React.FC = () => {
  const { code, languages, setLanguage, translating } = useI18n();

  return (
    <div className="settings-view">
      <header className="settings-head">
        <div className="settings-head-icon"><Languages size={20} /></div>
        <div>
          <h2>Settings</h2>
          <p>Manage how the practice workspace looks and reads.</p>
        </div>
        {translating && (
          <span className="settings-translating"><Loader2 size={14} className="va-spin" /> Translating…</span>
        )}
      </header>

      <section className="settings-card">
        <div className="settings-card-head">
          <Globe size={16} />
          <div>
            <h3>Application language</h3>
            <p>Switch the entire interface into your client's preferred language. Your choice is remembered on this device.</p>
          </div>
        </div>

        <div className="lang-grid">
          {languages.map((lang) => {
            const active = lang.code === code;
            return (
              <button
                key={lang.code}
                className={`lang-tile ${active ? 'active' : ''}`}
                onClick={() => setLanguage(lang.code)}
                aria-pressed={active}
              >
                <span className="lang-native" data-no-translate>{lang.native}</span>
                <span className="lang-name" data-no-translate>{lang.name}</span>
                {active && <span className="lang-check"><Check size={14} /></span>}
              </button>
            );
          })}
        </div>

        <div className="settings-note">
          <Info size={13} />
          <span>
            Translations are generated automatically and cached for speed. Client names, reference codes and
            monetary figures are always kept as-is. English is the source language.
          </span>
        </div>
      </section>
    </div>
  );
};

export default SettingsView;
