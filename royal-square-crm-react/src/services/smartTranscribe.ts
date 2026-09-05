/**
 * Smart Transcribe Engine — Royal Square CRM
 * Filters filler words ('umm', 'uh', 'er', stuttered repetitions)
 * and formats natural speech into clean, professional insurance claim records.
 */

export interface SmartTranscribeResult {
  cleanedText: string;
  originalText: string;
  removedCount: number;
  removedWords: string[];
}

export class SmartTranscribeService {
  // Regex pattern for South African & general English speech hesitation markers
  private static readonly FILLER_REGEX =
    /\b(umm+|um+|uhh+|uh+|err+|er+|ah+|ahh+|like|you\s+know|so\s+yeah|basically|i\s+mean|sort\s+of|kind\s+of)\b/gi;

  /**
   * Cleans transcript in real time, removing hesitation markers,
   * duplicate stutter words, and fixing punctuation/casing.
   */
  public static clean(raw: string): SmartTranscribeResult {
    if (!raw || !raw.trim()) {
      return {
        cleanedText: '',
        originalText: raw || '',
        removedCount: 0,
        removedWords: []
      };
    }

    const removedWords: string[] = [];
    const matches = raw.match(this.FILLER_REGEX);
    if (matches) {
      matches.forEach((m) => removedWords.push(m.toLowerCase().trim()));
    }

    // 1. Remove filler words
    let text = raw.replace(this.FILLER_REGEX, '');

    // 2. Remove duplicate consecutive words (stutters like "we we", "I I", "at at")
    text = text.replace(/\b(\w+)\s+\1\b/gi, '$1');

    // 3. Clean up punctuation around stripped words
    text = text.replace(/\s+([,.:;!?])/g, '$1');
    text = text.replace(/([,;])\s*[,;]+/g, '$1');
    text = text.replace(/\band\s*,/gi, 'and');
    text = text.replace(/([.!?])\s*[,;:]/g, '$1');
    text = text.replace(/^\s*[,;:.-]+\s*/, '');
    text = text.replace(/\s{2,}/g, ' ').trim();

    // 4. Normalize capitalization: Capitalize first word of sentences
    text = text.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, prefix, char) => prefix + char.toUpperCase());

    // 5. Capitalize standalone "i"
    text = text.replace(/\bi\b/g, 'I');

    return {
      cleanedText: text,
      originalText: raw,
      removedCount: removedWords.length,
      removedWords
    };
  }

  /**
   * Real-time one-liner cleaner suitable for live delta transcription streaming.
   */
  public static cleanLive(raw: string): string {
    return this.clean(raw).cleanedText;
  }

  /**
   * Refines a cleaned transcript into a formal South African insurance accident statement
   * using Gemini 2.5 Flash / Pro REST API if a key is available.
   */
  public static async refineWithGemini(
    statement: string,
    apiKey?: string
  ): Promise<string> {
    const key = apiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (!key || !statement.trim()) {
      return this.clean(statement).cleanedText;
    }

    const prompt = `You are an expert South African short-term insurance claims adjudicator.
Take the following raw accident description, strip any remaining conversational fillers or colloquialisms,
and rewrite it into a clear, chronological, professional incident description suitable for an official claim form.
Do not invent facts. Maintain exact details (vehicle models, street names, weather, damages, third parties).

Raw Description:
"${statement}"

Return ONLY the refined paragraph without markdown headers or explanations.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 500
            }
          })
        }
      );

      if (!response.ok) {
        return this.clean(statement).cleanedText;
      }

      const data = await response.json();
      const refined = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return refined ? refined.trim() : this.clean(statement).cleanedText;
    } catch {
      return this.clean(statement).cleanedText;
    }
  }
}
