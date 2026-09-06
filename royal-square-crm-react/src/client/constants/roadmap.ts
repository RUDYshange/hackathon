/**
 * Roadmap & Architecture Talking Points
 * 
 * Sourced directly from human reviewer feedback & regulatory review:
 * - Tonight's Priority: Simplified Client Flow (assume account info, describe only what happened) + Accessibility (60+ font scaling & tone).
 * - Roadmap Lines: Named integration points for the judges / pitch.
 */

export interface RoadmapItem {
  id: string;
  title: string;
  category: 'REGULATORY' | 'INTEGRATION' | 'ENHANCEMENT';
  status: 'ROADMAP_PITCH' | 'CURRENT_SPRINT' | 'COMPLETED';
  description: string;
  talkingPoint: string;
}

export const ARCHITECTURE_ROADMAP: RoadmapItem[] = [
  {
    id: 'simplified-client-intake',
    title: 'Client-First Streamlined Incident Intake',
    category: 'ENHANCEMENT',
    status: 'COMPLETED',
    description: 'Account and vehicle details are pre-loaded and assumed. The user only describes what happened via Voice or text.',
    talkingPoint: 'Scope reduction: cuts form fatigue in emergency situations, boosting submission completion rates.'
  },
  {
    id: 'accessibility-senior-view',
    title: 'Senior & 60+ Accessibility Mode (Large Font & Calming Tone)',
    category: 'ENHANCEMENT',
    status: 'COMPLETED',
    description: 'Dynamic typography sizing up to 22px base font, high legibility contrast, and softened empathetic tone.',
    talkingPoint: 'Critical inclusivity: over 40% of wealth clients are 60+ and need accessible, non-clinical interfaces in stressful situations.'
  },
  {
    id: 'pep-screening-gate',
    title: 'Automated Politically Exposed Person (PEP) Screening Gate',
    category: 'REGULATORY',
    status: 'ROADMAP_PITCH',
    description: 'Direct API integration with national FIC / LexisNexis PEP compliance databases to eliminate 1 hour manual advisor checks.',
    talkingPoint: 'Identified as our next automatable compliance gate for advisor efficiency.'
  },
  {
    id: 'pass-through-underwriting',
    title: 'Multi-Insurer Pass-Through Underwriting Sync',
    category: 'INTEGRATION',
    status: 'ROADMAP_PITCH',
    description: 'Eliminates re-entering the same client KYC details separately for each different insurer product.',
    talkingPoint: 'Single-source-of-truth KYC reducing cross-carrier administrative overhead by 70%.'
  },
  {
    id: 'popia-sovereignty',
    title: 'POPI Act Cloud Infrastructure Liability Shield',
    category: 'REGULATORY',
    status: 'ROADMAP_PITCH',
    description: 'Enterprise cloud hosting (Google Cloud / Microsoft Azure Africa regions) shifting infrastructure security liability.',
    talkingPoint: 'POPIA compliance strictly adhering to South African Data Protection guidelines with zero third-party data leakage.'
  },
  {
    id: 'third-party-notification',
    title: 'Automated Third-Party Incident Notification',
    category: 'INTEGRATION',
    status: 'ROADMAP_PITCH',
    description: 'SMS/Email dispatch to third-party drivers involved to streamline cross-insurer recovery and knock-for-knock arbitration.',
    talkingPoint: 'Speeds up inter-company claim settlement cycles.'
  },
  {
    id: 'bulk-file-export',
    title: 'Bulk Claim Evidence Zip Bundle Export',
    category: 'ENHANCEMENT',
    status: 'ROADMAP_PITCH',
    description: 'One-click compressed zip download of all scene photos, driver licences, and SAPS dockets for external assessors.',
    talkingPoint: 'Advisor-side bulk processing convenience scheduled for next release cycle.'
  },
  {
    id: 'non-vehicle-property',
    title: 'Non-Vehicle & General Property Claims Vertical',
    category: 'INTEGRATION',
    status: 'ROADMAP_PITCH',
    description: 'Dedicated intake pipelines for household contents, personal all-risks (e.g. laptops, jewelry), and building insurance.',
    talkingPoint: 'Expansion into secondary short-term lines following motor stabilization.'
  }
];
