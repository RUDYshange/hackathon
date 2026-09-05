/**
 * Royal Square CRM — Intelligent Voice Form Field Extractor
 * 
 * Maps natural conversational spoken speech to structured form data schemas
 * for both Client Onboarding and Insurance Claims Logging.
 */

import { GeminiLiveService } from './geminiLiveService';

export interface ExtractedClientData {
  title?: 'Mr' | 'Mrs' | 'Ms' | 'Dr' | 'Adv' | 'Prof';
  firstName?: string;
  secondName?: string;
  surname?: string;
  idNumber?: string;
  dateOfBirth?: string;
  emailAddress?: string;
  mobileNumber?: string;
  occupation?: string;
  employer?: string;
  annualIncome?: number;
  riskProfile?: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  primaryAddress?: string;
  confidence?: Record<string, number>;
}

export interface ExtractedClaimData {
  clientId?: string;
  clientName?: string;
  insurer?: string;
  policyNumber?: string;
  claimType?: string;
  incidentDate?: string;
  description?: string;
  claimsHandler?: string;
}

export class FormFieldExtractor {
  /**
   * Fast, client-side heuristic parser for Client Onboarding
   */
  public static extractFromTranscript(text: string): ExtractedClientData {
    const result: ExtractedClientData = {};
    if (!text || text.trim() === '') return result;

    const normalized = text
      .replace(/\s+/g, ' ')
      .trim();

    // 1. Title Extraction
    const titleMatch = normalized.match(/\b(doctor|dr\.?|advocate|adv\.?|professor|prof\.?|mr\.?|mrs\.?|ms\.?)\b/i);
    if (titleMatch) {
      const rawTitle = titleMatch[1].toLowerCase().replace('.', '');
      if (rawTitle === 'doctor' || rawTitle === 'dr') result.title = 'Dr';
      else if (rawTitle === 'advocate' || rawTitle === 'adv') result.title = 'Adv';
      else if (rawTitle === 'professor' || rawTitle === 'prof') result.title = 'Prof';
      else if (rawTitle === 'mrs') result.title = 'Mrs';
      else if (rawTitle === 'ms') result.title = 'Ms';
      else result.title = 'Mr';
    }

    // 2. Email Address Extraction
    let emailNormalized = normalized
      .replace(/\s+at\s+/gi, '@')
      .replace(/\s+dot\s+/gi, '.');
    
    const emailMatch = emailNormalized.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      result.emailAddress = emailMatch[1].toLowerCase();
    }

    // 3. South African 13-digit ID Number Extraction
    const digitsOnly = normalized.replace(/\D/g, '');
    const idMatch = normalized.match(/\b\d{6}[\s-]?\d{4}[\s-]?\d{3}\b/) || (digitsOnly.length >= 13 ? [digitsOnly.slice(0, 13)] : null);
    if (idMatch) {
      const cleanId = idMatch[0].replace(/\D/g, '');
      if (cleanId.length === 13) {
        result.idNumber = cleanId;
        const yy = parseInt(cleanId.substring(0, 2), 10);
        const mm = cleanId.substring(2, 4);
        const dd = cleanId.substring(4, 6);
        const currentYear2Digits = new Date().getFullYear() % 100;
        const fullYear = yy > currentYear2Digits ? 1900 + yy : 2000 + yy;
        
        const monthNum = parseInt(mm, 10);
        const dayNum = parseInt(dd, 10);
        if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
          result.dateOfBirth = `${fullYear}-${mm}-${dd}`;
        }
      }
    }

    // 4. Mobile Number Extraction
    const phoneMatch = normalized.match(/(?:\+27|0)[6-8][0-9](?:[\s-]?[0-9]{3})(?:[\s-]?[0-9]{4})/);
    if (phoneMatch) {
      result.mobileNumber = phoneMatch[0].replace(/\s+/g, ' ').trim();
    }

    // 5. Risk Profile Extraction
    if (/\b(aggressive|high risk|growth)\b/i.test(normalized)) {
      result.riskProfile = 'AGGRESSIVE';
    } else if (/\b(conservative|low risk|preservation|capital preservation)\b/i.test(normalized)) {
      result.riskProfile = 'CONSERVATIVE';
    } else if (/\b(moderate|balanced|medium risk)\b/i.test(normalized)) {
      result.riskProfile = 'MODERATE';
    }

    // 6. Annual Income Extraction
    const millionMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:million|mil|m)\b/i);
    const thousandMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:thousand|k)\b/i);
    const randMatch = normalized.match(/(?:income|earning|salary|earns|earning of)\s*(?:is|of)?\s*(?:r|zar)?\s*([\d\s,]+)/i);

    if (millionMatch) {
      result.annualIncome = Math.round(parseFloat(millionMatch[1]) * 1000000);
    } else if (thousandMatch) {
      result.annualIncome = Math.round(parseFloat(thousandMatch[1]) * 1000);
    } else if (randMatch) {
      const num = parseInt(randMatch[1].replace(/[\s,]/g, ''), 10);
      if (!isNaN(num) && num > 10000) {
        result.annualIncome = num;
      }
    }

    // 7. Occupation & Employer Extraction
    const occupationMatch = normalized.match(/(?:occupation|job|works as|working as|role|title is)\s*(?:is|a|an)?\s*([a-zA-Z\s]{3,35})(?:\s+at|\s+for|\s+earning|\s+with|\.|\,|$)/i);
    if (occupationMatch) {
      const occ = occupationMatch[1].trim();
      if (!['is', 'at', 'for', 'the'].includes(occ.toLowerCase())) {
        result.occupation = this.capitalizeWords(occ);
      }
    }

    const employerMatch = normalized.match(/(?:employer|company|works at|working at|employed by|employed at)\s*(?:is)?\s*([a-zA-Z0-9\s&]{2,30})(?:\s+as|\s+earning|\s+living|\.|\,|$)/i);
    if (employerMatch) {
      const emp = employerMatch[1].trim();
      if (!['at', 'for', 'is'].includes(emp.toLowerCase())) {
        result.employer = this.capitalizeWords(emp);
      }
    }

    // 8. Name Extraction
    const explicitName = normalized.match(/(?:first name|first name is)\s+([a-zA-Z]+)(?:\s+(?:second name|middle name)\s+([a-zA-Z]+))?(?:\s+(?:surname|last name)\s+([a-zA-Z]+))?/i);
    if (explicitName) {
      if (explicitName[1]) result.firstName = this.capitalizeWords(explicitName[1]);
      if (explicitName[2]) result.secondName = this.capitalizeWords(explicitName[2]);
      if (explicitName[3]) result.surname = this.capitalizeWords(explicitName[3]);
    } else {
      const conversationalName = normalized.match(/(?:my name is|client(?:'s)? name is|name is|called)\s+([A-Z][a-z]+)\s+([A-Z][a-z]+)/i);
      if (conversationalName) {
        result.firstName = this.capitalizeWords(conversationalName[1]);
        result.surname = this.capitalizeWords(conversationalName[2]);
      }
    }

    // 9. Address Extraction
    const addressMatch = normalized.match(/(?:address|living at|residing at|resides at|located at)\s*(?:is)?\s*([^,\.]+?(?:street|st|road|rd|avenue|ave|crescent|cres|drive|dr|lane|ln|way|estate|boulevard|blvd|sandton|johannesburg|cape town|durban|pretoria)[^,\.]*)/i);
    if (addressMatch) {
      result.primaryAddress = this.capitalizeWords(addressMatch[1].trim());
    }

    return result;
  }

  /**
   * Fast, real-time heuristic parser for Insurance Claims
   */
  public static extractClaimFromTranscript(
    text: string,
    clients: Array<{ id: string; fullName: string }> = []
  ): ExtractedClaimData {
    const result: ExtractedClaimData = {};
    if (!text || text.trim() === '') return result;

    const normalized = text.replace(/\s+/g, ' ').trim();
    const lower = normalized.toLowerCase();

    // 1. Client Matching from loaded client list
    for (const c of clients) {
      const cFull = c.fullName.toLowerCase();
      const parts = cFull.split(' ');
      const firstName = parts[0];
      const lastName = parts[parts.length - 1];

      if (lower.includes(cFull) || (lower.includes(firstName) && lower.includes(lastName))) {
        result.clientId = c.id;
        result.clientName = c.fullName;
        break;
      }
    }
    // If no full match, test individual first/last name
    if (!result.clientId && clients.length > 0) {
      for (const c of clients) {
        const parts = c.fullName.toLowerCase().split(' ');
        if (parts.length >= 2) {
          if (lower.includes(parts[0]) || lower.includes(parts[parts.length - 1])) {
            result.clientId = c.id;
            result.clientName = c.fullName;
            break;
          }
        }
      }
    }

    // 2. Insurer Extraction
    const insurers = [
      { key: 'Discovery Life', pattern: /\b(discovery life|discovery insure|discovery)\b/i },
      { key: 'Old Mutual', pattern: /\b(old mutual)\b/i },
      { key: 'Sanlam', pattern: /\b(sanlam)\b/i },
      { key: 'Momentum', pattern: /\b(momentum)\b/i },
      { key: 'Santam', pattern: /\b(santam)\b/i },
      { key: 'Hollard', pattern: /\b(hollard)\b/i },
      { key: 'Liberty', pattern: /\b(liberty life|liberty)\b/i },
      { key: 'OUTsurance', pattern: /\b(outsurance)\b/i },
      { key: 'MiWay', pattern: /\b(miway)\b/i }
    ];

    for (const ins of insurers) {
      if (ins.pattern.test(normalized)) {
        result.insurer = ins.key;
        break;
      }
    }

    // 3. Claim Type Extraction
    if (/\b(motor|car|vehicle|collision|accident|crash|bumper|rear-ended)\b/i.test(normalized)) {
      result.claimType = 'MOTOR_COLLISION';
    } else if (/\b(critical illness|dread disease|cancer|stroke|cardiac|heart attack|illness)\b/i.test(normalized)) {
      result.claimType = 'CRITICAL_ILLNESS';
    } else if (/\b(disability|disabled|incapacity)\b/i.test(normalized)) {
      result.claimType = 'DISABILITY';
    } else if (/\b(life|death|deceased|funeral)\b/i.test(normalized)) {
      result.claimType = 'LIFE_ASSURANCE';
    } else if (/\b(retrenchment|retrenched|severance|job loss)\b/i.test(normalized)) {
      result.claimType = 'RETRENCHMENT';
    } else if (/\b(property|building|house|burst geyser|geyser|flood|water damage|fire)\b/i.test(normalized)) {
      result.claimType = 'PROPERTY_LOSS';
    } else if (/\b(theft|stolen|hijacked|hijacking|burglary|break-in)\b/i.test(normalized)) {
      result.claimType = 'THEFT';
    }

    // 4. Policy Number Extraction
    const polMatch = normalized.match(/\b(?:policy|pol|policy number|pol no)\s*(?:is|#|:)?\s*([a-zA-Z0-9\-]{4,20})\b/i);
    if (polMatch) {
      result.policyNumber = polMatch[1].toUpperCase();
    }

    // 5. Incident Date Extraction
    if (/\byesterday\b/i.test(normalized)) {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      result.incidentDate = d.toISOString().split('T')[0];
    } else if (/\btoday\b/i.test(normalized)) {
      result.incidentDate = new Date().toISOString().split('T')[0];
    } else {
      // Look for YYYY-MM-DD or spoken date like 15 August 2026
      const isoMatch = normalized.match(/\b(\d{4}-\d{2}-\d{2})\b/);
      if (isoMatch) {
        result.incidentDate = isoMatch[1];
      } else {
        const spokenDateMatch = normalized.match(/\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{4}))?\b/i);
        if (spokenDateMatch) {
          const day = spokenDateMatch[1].padStart(2, '0');
          const months: Record<string, string> = {
            january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
            july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
          };
          const month = months[spokenDateMatch[2].toLowerCase()];
          const year = spokenDateMatch[3] || String(new Date().getFullYear());
          result.incidentDate = `${year}-${month}-${day}`;
        }
      }
    }

    // Default incidentDate to today if missing
    if (!result.incidentDate) {
      result.incidentDate = new Date().toISOString().split('T')[0];
    }

    // 6. Description Extraction
    // Look for phrases describing the incident
    const descMatch = normalized.match(/(?:because|due to|occurred when|incident was|details:|description:|story:)\s*([^\.\;]+)/i);
    if (descMatch) {
      result.description = descMatch[1].trim();
    } else {
      // Use the spoken text if long enough
      if (normalized.length > 20) {
        result.description = normalized;
      }
    }

    return result;
  }

  /**
   * Semantic extraction using Gemini API for Client Onboarding
   */
  public static async extractWithGemini(text: string): Promise<ExtractedClientData> {
    const heuristic = this.extractFromTranscript(text);
    const apiKey = GeminiLiveService.getApiKey();

    if (!apiKey || !text || text.length < 15) {
      return heuristic;
    }

    try {
      const prompt = `You are an AI assistant for a South African wealth management CRM. Extract client information from the following spoken transcript and return ONLY valid JSON matching this schema:
{
  "title": "Mr" | "Mrs" | "Ms" | "Dr" | "Adv" | "Prof",
  "firstName": string,
  "secondName": string | null,
  "surname": string,
  "idNumber": string (13 digits),
  "dateOfBirth": "YYYY-MM-DD",
  "emailAddress": string,
  "mobileNumber": string,
  "occupation": string,
  "employer": string,
  "annualIncome": number,
  "riskProfile": "CONSERVATIVE" | "MODERATE" | "AGGRESSIVE",
  "primaryAddress": string
}

Only return the JSON object.
Spoken transcript: "${text.replace(/"/g, '\\"')}"`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) return heuristic;

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        return {
          ...heuristic,
          ...Object.fromEntries(
            Object.entries(parsed).filter(([_, v]) => v !== null && v !== undefined && v !== '')
          )
        };
      }
    } catch (e) {
      console.warn('[FormFieldExtractor] Gemini semantic extraction failed:', e);
    }

    return heuristic;
  }

  /**
   * Semantic extraction using Gemini API for Claims
   */
  public static async extractClaimWithGemini(
    text: string,
    clients: Array<{ id: string; fullName: string }>
  ): Promise<ExtractedClaimData> {
    const heuristic = this.extractClaimFromTranscript(text, clients);
    const apiKey = GeminiLiveService.getApiKey();

    if (!apiKey || !text || text.length < 15) {
      return heuristic;
    }

    try {
      const clientListDesc = clients.map((c) => `"${c.fullName}" (ID: ${c.id})`).join(', ');
      const prompt = `You are an AI assistant for an insurance claims management CRM. Extract claim details from the following transcript. Available clients in system: [${clientListDesc}].
Return ONLY valid JSON matching this schema:
{
  "clientId": string (must match one of the available client IDs if mentioned, else null),
  "clientName": string,
  "insurer": "Discovery Life" | "Old Mutual" | "Sanlam" | "Momentum" | "Santam" | "Hollard" | "Liberty" | "OUTsurance" | string,
  "policyNumber": string,
  "claimType": "MOTOR_COLLISION" | "CRITICAL_ILLNESS" | "DISABILITY" | "LIFE_ASSURANCE" | "RETRENCHMENT" | "PROPERTY_LOSS" | "THEFT",
  "incidentDate": "YYYY-MM-DD",
  "description": string
}

Only return the JSON object.
Spoken transcript: "${text.replace(/"/g, '\\"')}"`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) return heuristic;

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        return {
          ...heuristic,
          ...Object.fromEntries(
            Object.entries(parsed).filter(([_, v]) => v !== null && v !== undefined && v !== '')
          )
        };
      }
    } catch (e) {
      console.warn('[FormFieldExtractor] Claim semantic extraction failed:', e);
    }

    return heuristic;
  }

  private static capitalizeWords(str: string): string {
    return str.replace(/\b\w+/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
  }
}
