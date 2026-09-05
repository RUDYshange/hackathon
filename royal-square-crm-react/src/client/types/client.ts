export interface InvestmentHolding {
  id: string;
  name: string;
  provider: 'Allan Gray' | 'Ninety One' | 'Coronation' | 'Liberty' | 'Direct JSE Equities';
  category: 'GLOBAL_EQUITY' | 'LOCAL_BALANCED' | 'OFFSHORE_FEEDER' | 'RESOURCES' | 'PROPERTY_REIT';
  investedAmount: number;
  currentValue: number;
  pnlAmount: number;
  pnlPercentage: number;
  outcome: 'WIN' | 'LOSS';
  marketDriver: string;
  riskRating: 'HIGH' | 'MODERATE' | 'CONSERVATIVE';
}

export interface UnderwritingPolicy {
  id: string;
  title: string;
  provider: 'Santam Life Ltd' | 'Discovery Life' | 'Allan Gray Investment' | 'Ninety One Asset Mgt' | 'Santam Insurance' | 'Discovery Health' | 'Liberty Corporate';
  policyNumber: string;
  sumAssured: number | string;
  monthlyPremium: number;
  status: 'In Force' | 'Active' | 'Active Debit' | 'Full Executive';
  nextReview: string;
  passThroughSynced: boolean;
  category: 'PERSONAL' | 'BUSINESS' | 'INVESTMENT' | 'MOTOR_PROPERTY';
}

export interface ClientProfile {
  id: string;
  reference: string;
  primaryClient: string;
  spouseClient?: string;
  fullName: string;
  tier: 'HNW TIER 1' | 'EXECUTIVE' | 'AFFLUENT';
  retainerPlan: string;
  primaryIdNumber: string;
  spouseIdNumber?: string;
  taxNumber: string;
  mandateSignedDate: string;
  mobileNumber: string;
  emailAddress: string;
  primaryAddress: string;
  compliance: {
    ficaStatus: string;
    astuteConsentExpiry: string;
    fspMandate: string;
    pepCheckStatus: 'CLEARED' | 'PENDING' | 'FLAGGED';
    pepNote: string;
    popiaLiabilityShield: string;
    passThroughSyncStatus: string;
  };
  wealth: {
    totalNetWorth: number;
    yoyGrowth: number;
    investmentsAndRA: number;
    realEstateAndAssets: number;
    liabilitiesAndBonds: number;
    ltvRatio: number;
    composition: {
      equitiesPct: number;
      fixedPropertyPct: number;
      liquidityCashPct: number;
    };
    totalGainAmount: number;
    totalGainPercentage: number;
  };
  holdings: InvestmentHolding[];
  policies: UnderwritingPolicy[];
  insuredVehicle: {
    make: string;
    model: string;
    year: number;
    registration: string;
    vin: string;
    color: string;
    insurer: string;
    policyNumber: string;
    excessAmount: number;
    coverLevel: string;
  };
  advisor: {
    name: string;
    title: string;
    fspNumber: string;
    phone: string;
    email: string;
    annualReview: string;
  };
}

export type FontSizeSetting = 'normal' | 'large' | 'xlarge';
export type ThemeToneSetting = 'soft' | 'contrast' | 'executive';

export interface AccessibilityPreferences {
  fontSize: FontSizeSetting;
  tone: ThemeToneSetting;
  simplifiedView: boolean;
  voiceAssistanceEnabled: boolean;
}
