import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClientProfile, FontSizeSetting, ThemeToneSetting, AccessibilityPreferences } from '../types/client';
import { CURRENT_CLIENT_MOCK } from '../mockClientData';
import { secureFetch } from '../../services/api';

interface ClientContextValue {
  client: ClientProfile;
  accessibility: AccessibilityPreferences;
  setFontSize: (size: FontSizeSetting) => void;
  setThemeTone: (tone: ThemeToneSetting) => void;
  toggleSimplifiedView: () => void;
  toggleVoiceAssistance: () => void;
  refreshClientData: () => Promise<void>;
  updateAssumedClient: (updated: Partial<ClientProfile>) => void;
}

const ClientContext = createContext<ClientContextValue | undefined>(undefined);

export const ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [client, setClient] = useState<ClientProfile>(() => {
    try {
      const saved = localStorage.getItem('rs_client_profile_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.wealth && Array.isArray(parsed.holdings) && parsed.insuredVehicle) {
          return { ...CURRENT_CLIENT_MOCK, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Failed to parse client profile from storage, using mock default', e);
    }
    return CURRENT_CLIENT_MOCK;
  });

  const [accessibility, setAccessibility] = useState<AccessibilityPreferences>(() => {
    const saved = localStorage.getItem('rs_client_accessibility');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      fontSize: 'large', // Default to large for comfortable reading & 60+ ease of use
      tone: 'soft',       // Soft, reassuring tone by default
      simplifiedView: true,
      voiceAssistanceEnabled: true
    };
  });

  // Keep body or root element synced with font size and theme tone
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', accessibility.fontSize);
    document.documentElement.setAttribute('data-client-theme', accessibility.tone);
    localStorage.setItem('rs_client_accessibility', JSON.stringify(accessibility));
  }, [accessibility]);

  useEffect(() => {
    localStorage.setItem('rs_client_profile_v2', JSON.stringify(client));
    localStorage.removeItem('rs_client_profile');
  }, [client]);

  const setFontSize = (fontSize: FontSizeSetting) => {
    setAccessibility((prev) => ({ ...prev, fontSize }));
  };

  const setThemeTone = (tone: ThemeToneSetting) => {
    setAccessibility((prev) => ({ ...prev, tone }));
  };

  const toggleSimplifiedView = () => {
    setAccessibility((prev) => ({ ...prev, simplifiedView: !prev.simplifiedView }));
  };

  const toggleVoiceAssistance = () => {
    setAccessibility((prev) => ({ ...prev, voiceAssistanceEnabled: !prev.voiceAssistanceEnabled }));
  };

  const updateAssumedClient = (updated: Partial<ClientProfile>) => {
    setClient((prev) => ({ ...prev, ...updated }));
  };

  const refreshClientData = async () => {
    try {
      const res = await secureFetch<any>('/clients');
      if (res.data && res.data.length > 0) {
        const first = res.data[0];
        setClient((prev) => ({
          ...prev,
          id: first.id || prev.id,
          fullName: first.fullName || prev.fullName,
          mobileNumber: first.mobileNumber || prev.mobileNumber,
          reference: first.reference || prev.reference
        }));
      }
    } catch {
      // Keep mock default if API is offline
    }
  };

  return (
    <ClientContext.Provider
      value={{
        client,
        accessibility,
        setFontSize,
        setThemeTone,
        toggleSimplifiedView,
        toggleVoiceAssistance,
        refreshClientData,
        updateAssumedClient
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = (): ClientContextValue => {
  const ctx = useContext(ClientContext);
  if (!ctx) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return ctx;
};
