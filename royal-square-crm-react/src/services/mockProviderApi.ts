/**
 * mockProviderApi.ts
 * Frontend service for communicating with the Mock Provider API (Sanlam, Santam, Discovery, Old Mutual).
 * Normalizes database client records, mocks external insurer REST communication,
 * and confirms updates on both the provider and advisor ends.
 */

import { secureFetch } from './api';

export interface ProviderSyncResult {
  status: string;
  provider: string;
  provider_reference: string;
  client_reference: string;
  client_name: string;
  client_id?: string;
  underwriting_status: string;
  compliance_gate: string;
  astute_switch_ref: string;
  simulated_endpoint: string;
  message: string;
  advisor_notification: string;
  synced_at: string;
  updated_client?: {
    fullName: string;
    occupation?: string;
    employer?: string;
    primaryAddress?: string;
    mobileNumber?: string;
    emailAddress?: string;
    reference: string;
  };
}

export interface IntegrationLogEntry {
  claim_id: string;
  client: string;
  provider: string;
  status: string;
  reference: string;
  timestamp: string;
}

export interface ProviderClaimResult {
  status: string;
  provider: string;
  claim_reference: string;
  client_reference: string;
  client_name: string;
  policy_number: string;
  estimated_response: string;
  claims_channel: string;
  simulated_endpoint: string;
  timestamp: string;
  integration_entry?: IntegrationLogEntry;
}

// Fallback in-memory integration log
let localIntegrationLog: IntegrationLogEntry[] = [
  {
    claim_id: 'CLM-0012',
    client: 'S. Dlamini',
    provider: 'Sanlam',
    status: '✅ Received',
    reference: 'SNL-2026-00417',
    timestamp: '21:42'
  },
  {
    claim_id: 'CLM-0013',
    client: 'S. Dlamini',
    provider: 'Old Mutual',
    status: '✅ Received',
    reference: 'OM-2026-08821',
    timestamp: '21:44'
  }
];

export class MockProviderApiService {
  /**
   * Fetches the real-time Integration Log table rows.
   */
  static async getIntegrationLog(): Promise<IntegrationLogEntry[]> {
    try {
      const res = await secureFetch<{ integration_log: IntegrationLogEntry[] }>('/providers/integration-log');
      if (res.data && Array.isArray(res.data.integration_log)) {
        localIntegrationLog = res.data.integration_log;
        return localIntegrationLog;
      }
    } catch {
      // Return local cache if offline
    }
    return [...localIntegrationLog];
  }

  /**
   * Syncs client data for pass-through underwriting to an insurer API (e.g. Sanlam, Discovery).
   * Normalizes client data, updates local database, and returns verified insurer confirmation.
   */
  static async syncClientToProvider(
    clientId: string,
    provider: 'Sanlam' | 'Discovery' | 'Santam' | 'Old Mutual' = 'Sanlam',
    updatedFields?: Record<string, any>
  ): Promise<ProviderSyncResult> {
    try {
      const res = await secureFetch<ProviderSyncResult>('/providers/sync-client', {
        method: 'POST',
        body: JSON.stringify({
          client_id: clientId,
          provider,
          updated_fields: updatedFields
        })
      });

      if (res.data) {
        return res.data;
      }
    } catch (e) {
      console.warn('Backend provider endpoint unreachable, using client-side mock fallback', e);
    }

    // Client-side fallback if backend is offline
    const randomSeq = Math.floor(10000 + Math.random() * 90000);
    const prefixes: Record<string, string> = {
      Sanlam: 'SNL',
      Discovery: 'DSC',
      Santam: 'SAN',
      'Old Mutual': 'OM'
    };
    const prefix = prefixes[provider] || 'SNL';
    const providerRef = `${prefix}-2026-${randomSeq}`;

    return {
      status: 'received_and_verified',
      provider,
      provider_reference: providerRef,
      client_reference: 'CLI-1024',
      client_name: updatedFields?.fullName || 'Sipho Dlamini',
      client_id: clientId,
      underwriting_status: 'PASS_THROUGH_ACTIVE',
      compliance_gate: 'PASSED_FAIS_SECTION_8',
      astute_switch_ref: `AST-ZA-${randomSeq}`,
      simulated_endpoint: `https://api.${provider.toLowerCase().replace(/\s+/g, '')}.co.za/v2/underwriting/sync`,
      message: `Client data successfully updated on ${provider} exchange and advisor CRM.`,
      advisor_notification: `Advisory desk updated: Sipho Dlamini (CLI-1024) synced with ${provider} (${providerRef})`,
      synced_at: new Date().toISOString(),
      updated_client: {
        fullName: updatedFields?.fullName || 'Sipho Dlamini',
        occupation: updatedFields?.occupation || 'Chief Technology Officer',
        employer: updatedFields?.employer || 'Naspers Fintech',
        reference: 'CLI-1024'
      }
    };
  }

  /**
   * Submits a claim to the provider API (e.g. Santam or Sanlam),
   * appends an entry to the Integration Log in real time, and notifies active tables.
   */
  static async submitClaimToProvider(
    claimId?: string,
    provider: 'Sanlam' | 'Discovery' | 'Santam' | 'Old Mutual' = 'Santam',
    claimPayload?: Record<string, any>
  ): Promise<ProviderClaimResult> {
    let result: ProviderClaimResult | null = null;

    try {
      const res = await secureFetch<ProviderClaimResult>('/providers/submit-claim', {
        method: 'POST',
        body: JSON.stringify({
          claim_id: claimId,
          provider,
          claim_payload: claimPayload
        })
      });

      if (res.data) {
        result = res.data;
      }
    } catch (e) {
      console.warn('Backend claim endpoint unreachable, using client-side fallback', e);
    }

    if (!result) {
      const randomSeq = Math.floor(10000 + Math.random() * 90000);
      const prefixes: Record<string, string> = {
        Sanlam: 'SNL',
        Discovery: 'DSC',
        Santam: 'SAN',
        'Old Mutual': 'OM'
      };
      const prefix = prefixes[provider] || 'SAN';
      const claimRef = `${prefix}-2026-${randomSeq}`;
      const cName = claimPayload?.client_name || 'S. Dlamini';

      const entry: IntegrationLogEntry = {
        claim_id: claimId || `CLM-00${localIntegrationLog.length + 12}`,
        client: cName.includes(' ') && !cName.startsWith('S.') ? `${cName.split(' ')[0][0]}. ${cName.split(' ').slice(-1)[0]}` : cName,
        provider,
        status: '✅ Received',
        reference: claimRef,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      result = {
        status: 'received',
        provider,
        claim_reference: claimRef,
        client_reference: claimPayload?.client_reference || 'CLI-1024',
        client_name: cName,
        policy_number: claimPayload?.policy_number || 'SAN-40192',
        estimated_response: '2 business days',
        claims_channel: 'BROKER_DIRECT_API',
        simulated_endpoint: `https://api.${provider.toLowerCase().replace(/\s+/g, '')}.co.za/claims/v1/intake`,
        timestamp: new Date().toISOString(),
        integration_entry: entry
      };
    }

    // If an entry was returned or generated, prepend it to local cache and dispatch event
    if (result.integration_entry) {
      localIntegrationLog = [result.integration_entry, ...localIntegrationLog.filter(e => e.reference !== result!.claim_reference)];
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rsq-integration-log-updated', { detail: result.integration_entry }));
      }
    }

    return result;
  }
}

