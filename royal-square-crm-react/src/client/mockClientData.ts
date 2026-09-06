import { ClientProfile } from './types/client';

export const CURRENT_CLIENT_MOCK: ClientProfile = {
  id: 'cli-mokoena-8840',
  reference: 'RSQ-9482',
  fullName: 'Kagiso & Lerato Mokoena',
  primaryClient: 'Kagiso Mokoena',
  spouseClient: 'Lerato Mokoena',
  tier: 'HNW TIER 1',
  retainerPlan: 'Active Retainer Client (R500/mo Debit Order Active)',
  primaryIdNumber: '840812 5291 088',
  spouseIdNumber: '881024 0184 082',
  taxNumber: '9482103449',
  mandateSignedDate: '14 Jan 2025',
  mobileNumber: '+27 (0)82 555 4910',
  emailAddress: 'kagiso.mokoena@mokoenatrust.co.za',
  primaryAddress: '1401 The Franklin, Newtown, Johannesburg, 2001',
  compliance: {
    ficaStatus: 'Tier 3 Full KYC Verified',
    astuteConsentExpiry: '14 Jan 2026',
    fspMandate: 'CAT I & II Discretionary Mandate',
    pepCheckStatus: 'CLEARED',
    pepNote: 'We have identified automated PEP screening as our next compliance gate to eliminate 1hr/client manual FIC lookups.',
    popiaLiabilityShield: 'We use Google / Azure enterprise cloud infrastructure, which is how the industry itself already shifts and manages this liability.',
    passThroughSyncStatus: 'Eliminates re-entering client KYC details separately for each different product with a different insurer.'
  },
  wealth: {
    totalNetWorth: 18450000,
    yoyGrowth: 8.4,
    investmentsAndRA: 11200000,
    realEstateAndAssets: 8500000,
    liabilitiesAndBonds: 1250000,
    ltvRatio: 6.77,
    composition: {
      equitiesPct: 61,
      fixedPropertyPct: 32,
      liquidityCashPct: 7
    },
    totalGainAmount: 1428550,
    totalGainPercentage: 12.8
  },
  holdings: [
    {
      id: 'h-01',
      name: 'Ninety One Global Franchise Feeder',
      provider: 'Ninety One',
      category: 'GLOBAL_EQUITY',
      investedAmount: 4165750,
      currentValue: 4750000,
      pnlAmount: 584250,
      pnlPercentage: 14.02,
      outcome: 'WIN',
      marketDriver: 'Strong rally in global enterprise tech, Microsoft, and quality consumer franchise compounding.',
      riskRating: 'HIGH'
    },
    {
      id: 'h-02',
      name: 'Allan Gray Balanced Portfolio (RA Feeder)',
      provider: 'Allan Gray',
      category: 'LOCAL_BALANCED',
      investedAmount: 4000000,
      currentValue: 4392000,
      pnlAmount: 392000,
      pnlPercentage: 9.8,
      outcome: 'WIN',
      marketDriver: 'Prudent local bond yield capture, high SA cash dividend reinvestment, and resilient financial stocks.',
      riskRating: 'MODERATE'
    },
    {
      id: 'h-03',
      name: 'Direct JSE Blue-Chip Equities (Naspers, FirstRand, Shoprite)',
      provider: 'Direct JSE Equities',
      category: 'LOCAL_BALANCED',
      investedAmount: 1689000,
      currentValue: 2058000,
      pnlAmount: 369000,
      pnlPercentage: 11.5,
      outcome: 'WIN',
      marketDriver: 'Recovery in retail volume, banking net interest margins, and tech holding discount narrowing.',
      riskRating: 'HIGH'
    },
    {
      id: 'h-04',
      name: 'Liberty High-Yield Offshore Liquidity Feeder',
      provider: 'Liberty',
      category: 'OFFSHORE_FEEDER',
      investedAmount: 1200000,
      currentValue: 1348000,
      pnlAmount: 148000,
      pnlPercentage: 6.4,
      outcome: 'WIN',
      marketDriver: 'USD interest yield protection and Rand exchange-rate hedging over the 12-month horizon.',
      riskRating: 'CONSERVATIVE'
    },
    {
      id: 'h-05',
      name: 'Coronation Resource & Mining Cycle Feeder',
      provider: 'Coronation',
      category: 'RESOURCES',
      investedAmount: 750000,
      currentValue: 703800,
      pnlAmount: -46200,
      pnlPercentage: -3.8,
      outcome: 'LOSS',
      marketDriver: 'Cyclical pullback in global platinum group metals and iron ore prices impacting export miners.',
      riskRating: 'HIGH'
    },
    {
      id: 'h-06',
      name: 'JSE Listed Property & Real Estate REIT ETF',
      provider: 'Allan Gray',
      category: 'PROPERTY_REIT',
      investedAmount: 500000,
      currentValue: 481500,
      pnlAmount: -18500,
      pnlPercentage: -1.9,
      outcome: 'LOSS',
      marketDriver: 'Commercial office vacancy friction and prolonged higher domestic interest rate environment.',
      riskRating: 'MODERATE'
    }
  ],
  policies: [
    {
      id: 'pol-01',
      title: 'Executive Life & Disability',
      provider: 'Santam Life Ltd',
      policyNumber: 'SL-88401928',
      sumAssured: 'R 12,500,000',
      monthlyPremium: 6420,
      status: 'In Force',
      nextReview: '14 Jan 2028',
      passThroughSynced: true,
      category: 'PERSONAL'
    },
    {
      id: 'pol-02',
      title: 'Severe Illness & Income Shield',
      provider: 'Discovery Life',
      policyNumber: 'DL-10948501',
      sumAssured: 'R 4,800,000',
      monthlyPremium: 3980,
      status: 'In Force',
      nextReview: '14 Jan 2026',
      passThroughSynced: true,
      category: 'PERSONAL'
    },
    {
      id: 'pol-03',
      title: 'Retirement Annuity Portfolio',
      provider: 'Allan Gray Investment',
      policyNumber: 'AG-RA-49018',
      sumAssured: 'R 6,450,000',
      monthlyPremium: 12500,
      status: 'Active Debit',
      nextReview: '30 Jun 2025',
      passThroughSynced: true,
      category: 'INVESTMENT'
    },
    {
      id: 'pol-04',
      title: 'Offshore Global Franchise Feeder',
      provider: 'Ninety One Asset Mgt',
      policyNumber: '91-GL-89281',
      sumAssured: 'R 4,750,000',
      monthlyPremium: 0,
      status: 'Active',
      nextReview: '14 Jan 2026',
      passThroughSynced: true,
      category: 'INVESTMENT'
    },
    {
      id: 'pol-05',
      title: 'Executive Domestic & Craft (BMW X5, C200, Craft)',
      provider: 'Santam Insurance',
      policyNumber: 'ST-39201984',
      sumAssured: 'R 8,500,000',
      monthlyPremium: 8750,
      status: 'In Force',
      nextReview: '01 Oct 2025',
      passThroughSynced: true,
      category: 'MOTOR_PROPERTY'
    },
    {
      id: 'pol-06',
      title: 'Executive Plan + Gap Top-up',
      provider: 'Discovery Health',
      policyNumber: 'DH-9910472',
      sumAssured: 'Full Executive',
      monthlyPremium: 11200,
      status: 'In Force',
      nextReview: '31 Dec 2025',
      passThroughSynced: true,
      category: 'PERSONAL'
    },
    {
      id: 'pol-07',
      title: 'Corporate Keyperson & Buy/Sell',
      provider: 'Liberty Corporate',
      policyNumber: 'LIB-KP-991',
      sumAssured: 'R 15,000,000',
      monthlyPremium: 8200,
      status: 'In Force',
      nextReview: '14 Jan 2028',
      passThroughSynced: true,
      category: 'BUSINESS'
    }
  ],
  insuredVehicle: {
    make: 'BMW',
    model: 'X5 xDrive30d M-Sport (G05)',
    year: 2023,
    registration: 'ND 849-210',
    vin: 'WBAJU820409821894',
    color: 'Carbon Black Metallic',
    insurer: 'Santam Insurance',
    policyNumber: 'ST-39201984',
    excessAmount: 4500,
    coverLevel: 'Executive Multi-Peril + Comprehensive Motor'
  },
  advisor: {
    name: 'Qiniso Ntuli',
    title: 'Practice Director & Key Individual',
    fspNumber: 'FSP 29370 (FAIS CAT I & II)',
    phone: '+27 11 883 4000',
    email: 'qntuli@royalsquare.co.za',
    annualReview: 'Q1 2026'
  }
};
