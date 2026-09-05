import React, { useState, useEffect } from 'react';
import { liveTranscribeService, GeminiLiveService } from '../../services/geminiLiveService';
import { FormFieldExtractor, ExtractedClientData } from '../../services/formFieldExtractor';
import {
  Mic,
  MicOff,
  Sparkles,
  Check,
  RotateCcw,
  Radio,
  Key,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface VoiceFormAssistantProps {
  onApplyData: (data: ExtractedClientData) => void;
  formType?: string;
}

export const VoiceFormAssistant: React.FC<VoiceFormAssistantProps> = ({
  onApplyData,
  formType = 'Client Onboarding'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [volume, setVolume] = useState(0);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'processing' | 'error'>('idle');
  const [extractedData, setExtractedData] = useState<ExtractedClientData>({});
  const [appliedCount, setAppliedCount] = useState<number | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [customKey, setCustomKey] = useState(() => GeminiLiveService.getApiKey());

  useEffect(() => {
    return () => {
      if (isListening) {
        liveTranscribeService.stop();
      }
    };
  }, [isListening]);

  // Extract fields progressively as transcript changes
  useEffect(() => {
    if (transcript.trim()) {
      const extracted = FormFieldExtractor.extractFromTranscript(transcript);
      setExtractedData(extracted);
    }
  }, [transcript]);

  const handleToggleListening = async () => {
    if (isListening) {
      setStatus('processing');
      const finalTranscript = await liveTranscribeService.stop();
      setIsListening(false);
      setStatus('idle');
      setVolume(0);

      // Trigger refined extraction with Gemini semantic parser if key is available
      if (finalTranscript) {
        const enriched = await FormFieldExtractor.extractWithGemini(finalTranscript);
        setExtractedData(enriched);
      }
      return;
    }

    setTranscript('');
    setInterimText('');
    setExtractedData({});
    setAppliedCount(null);
    setIsListening(true);
    setStatus('connecting');

    try {
      await liveTranscribeService.start({
        onStatusChange: (s) => {
          if (s === 'listening') setStatus('listening');
          else if (s === 'idle' || s === 'stopped') {
            setStatus('idle');
            setIsListening(false);
          } else if (s === 'error') {
            setStatus('error');
            setIsListening(false);
          }
        },
        onTranscript: (full) => {
          setTranscript(full);
        },
        onDelta: (delta) => {
          setInterimText(delta);
        },
        onVolumeChange: (vol) => {
          setVolume(vol);
        },
        onError: (err) => {
          console.warn('[VoiceFormAssistant] Notice:', err);
        }
      });
    } catch (err) {
      console.error('[VoiceFormAssistant] Error:', err);
      setIsListening(false);
      setStatus('error');
    }
  };

  const handleApply = () => {
    const keys = Object.keys(extractedData).filter(
      (k) => k !== 'confidence' && (extractedData as any)[k] !== undefined && (extractedData as any)[k] !== ''
    );
    onApplyData(extractedData);
    setAppliedCount(keys.length);
    setTimeout(() => setAppliedCount(null), 4000);
  };

  const handleReset = () => {
    setTranscript('');
    setInterimText('');
    setExtractedData({});
    setAppliedCount(null);
  };

  const handleUseSample = (sample: string) => {
    setTranscript(sample);
    const parsed = FormFieldExtractor.extractFromTranscript(sample);
    setExtractedData(parsed);
  };

  const saveApiKey = () => {
    GeminiLiveService.setApiKey(customKey);
    setShowKeyModal(false);
  };

  const extractedKeysCount = Object.keys(extractedData).filter(
    (k) => k !== 'confidence' && (extractedData as any)[k] !== undefined && (extractedData as any)[k] !== ''
  ).length;

  return (
    <div className={`voice-assistant-card ${isListening ? 'listening-glow' : ''}`}>
      {/* Header bar */}
      <div className="voice-assistant-header">
        <div className="voice-header-left">
          <div className="voice-model-pill">
            <Radio size={13} className={isListening ? 'animate-pulse text-gold' : 'text-muted'} />
            <span>gemini-3.5-transcribe-live</span>
            <span className="voice-tag-badge">WebSockets Live API</span>
          </div>
          <span className="voice-subtitle">Voice Form Filler &bull; {formType}</span>
        </div>

        <div className="voice-header-actions">
          <button
            type="button"
            className="btn-icon-subtle"
            onClick={() => setShowKeyModal(true)}
            title="Configure Gemini API Key"
          >
            <Key size={13} />
          </button>
          <button
            type="button"
            className="btn-icon-subtle"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="voice-assistant-body">
          {/* Main Action Strip */}
          <div className="voice-action-strip">
            <button
              type="button"
              className={`btn-voice-record ${isListening ? 'recording' : ''}`}
              onClick={handleToggleListening}
            >
              {isListening ? (
                <>
                  <MicOff size={16} />
                  <span>Stop Dictating</span>
                </>
              ) : (
                <>
                  <Mic size={16} />
                  <span>Start Voice Dictation</span>
                </>
              )}
            </button>

            {/* Audio Wave Visualizer Bars */}
            <div className="audio-visualizer-strip" aria-hidden="true">
              {[0.4, 0.7, 1.0, 0.6, 0.9, 1.2, 0.8, 0.5, 1.1, 0.7].map((mult, idx) => {
                const height = isListening
                  ? Math.max(4, Math.min(26, volume * mult * 32))
                  : 4;
                return (
                  <span
                    key={idx}
                    className="visualizer-bar"
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>

            <div className="voice-status-text">
              {status === 'connecting' && <span className="text-warning">Connecting to Gemini WebSocket...</span>}
              {status === 'listening' && (
                <span className="text-success flex items-center gap-1">
                  <span className="pulse-dot" /> Listening live... Speak naturally
                </span>
              )}
              {status === 'processing' && <span className="text-gold">Extracting form entities...</span>}
              {status === 'idle' && !transcript && (
                <span className="text-muted">Click the mic or test with a sample utterance below</span>
              )}
              {status === 'idle' && transcript && (
                <span className="text-gold">{extractedKeysCount} fields recognized</span>
              )}
            </div>

            {/* Apply & Reset Buttons */}
            <div className="voice-strip-controls">
              {extractedKeysCount > 0 && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleApply}
                >
                  <Sparkles size={13} /> Apply {extractedKeysCount} Fields
                </button>
              )}
              {transcript && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleReset}
                  title="Clear transcript"
                >
                  <RotateCcw size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Success Banner after applying */}
          {appliedCount !== null && (
            <div className="voice-applied-toast">
              <Check size={14} className="text-success" />
              <span>Applied {appliedCount} fields directly into the form!</span>
            </div>
          )}

          {/* Real-time Streaming Transcript Box */}
          <div className="voice-transcript-box">
            <div className="transcript-label">
              <span>Live Transcript</span>
              {isListening && <span className="transcript-streaming-tag">Streaming PCM 16kHz</span>}
            </div>
            <div className="transcript-content">
              {transcript ? (
                <p className="transcript-text">
                  {transcript}
                  {interimText && <span className="transcript-interim"> {interimText}</span>}
                </p>
              ) : (
                <p className="transcript-placeholder">
                  "Dictate a client's profile in your natural voice. For example: First name Sipho, surname Dlamini, ID 8501015800084, email sipho@naspers.com, cell 082 555 1234, CTO at Naspers earning 1.5 million, aggressive risk..."
                </p>
              )}
            </div>
          </div>

          {/* Extracted Field Cards Preview */}
          {extractedKeysCount > 0 && (
            <div className="voice-extracted-section">
              <div className="extracted-header">
                <span className="extracted-title">
                  <Sparkles size={13} className="text-gold" /> Auto-Detected Form Fields
                </span>
                <span className="extracted-counter">{extractedKeysCount} mapped</span>
              </div>

              <div className="extracted-chips-grid">
                {extractedData.title && (
                  <div className="extracted-chip">
                    <span className="chip-label">Title</span>
                    <span className="chip-val">{extractedData.title}</span>
                  </div>
                )}
                {extractedData.firstName && (
                  <div className="extracted-chip">
                    <span className="chip-label">First Name</span>
                    <span className="chip-val">{extractedData.firstName}</span>
                  </div>
                )}
                {extractedData.secondName && (
                  <div className="extracted-chip">
                    <span className="chip-label">Second Name</span>
                    <span className="chip-val">{extractedData.secondName}</span>
                  </div>
                )}
                {extractedData.surname && (
                  <div className="extracted-chip">
                    <span className="chip-label">Surname</span>
                    <span className="chip-val">{extractedData.surname}</span>
                  </div>
                )}
                {extractedData.idNumber && (
                  <div className="extracted-chip highlight">
                    <span className="chip-label">RSA ID</span>
                    <span className="chip-val">{extractedData.idNumber}</span>
                  </div>
                )}
                {extractedData.dateOfBirth && (
                  <div className="extracted-chip">
                    <span className="chip-label">DOB (Derived)</span>
                    <span className="chip-val">{extractedData.dateOfBirth}</span>
                  </div>
                )}
                {extractedData.emailAddress && (
                  <div className="extracted-chip">
                    <span className="chip-label">Email</span>
                    <span className="chip-val">{extractedData.emailAddress}</span>
                  </div>
                )}
                {extractedData.mobileNumber && (
                  <div className="extracted-chip">
                    <span className="chip-label">Mobile</span>
                    <span className="chip-val">{extractedData.mobileNumber}</span>
                  </div>
                )}
                {extractedData.occupation && (
                  <div className="extracted-chip">
                    <span className="chip-label">Occupation</span>
                    <span className="chip-val">{extractedData.occupation}</span>
                  </div>
                )}
                {extractedData.employer && (
                  <div className="extracted-chip">
                    <span className="chip-label">Employer</span>
                    <span className="chip-val">{extractedData.employer}</span>
                  </div>
                )}
                {extractedData.annualIncome !== undefined && (
                  <div className="extracted-chip">
                    <span className="chip-label">Income</span>
                    <span className="chip-val">R {extractedData.annualIncome.toLocaleString()}</span>
                  </div>
                )}
                {extractedData.riskProfile && (
                  <div className="extracted-chip">
                    <span className="chip-label">Risk Mandate</span>
                    <span className="chip-val">{extractedData.riskProfile}</span>
                  </div>
                )}
                {extractedData.primaryAddress && (
                  <div className="extracted-chip span-full">
                    <span className="chip-label">Address</span>
                    <span className="chip-val">{extractedData.primaryAddress}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick-try Prompt Suggestions */}
          <div className="voice-sample-strip">
            <span className="sample-strip-label">Or test with one-click voice samples:</span>
            <button
              type="button"
              className="btn-sample-prompt"
              onClick={() =>
                handleUseSample(
                  'My name is Sipho Dlamini, ID 8501015800084, email sipho.dlamini@naspers.com, cell 082 555 1234, I work as Chief Technology Officer at Naspers, annual income 1.5 million, risk profile aggressive, address 14 Katherine Street Sandton'
                )
              }
            >
              "Sipho Dlamini (CTO, Aggressive)"
            </button>
            <button
              type="button"
              className="btn-sample-prompt"
              onClick={() =>
                handleUseSample(
                  'Client is Dr Nandi Khumalo, ID number 9205120123089, email nandi.khumalo@discovery.co.za, mobile 071 888 4321, Specialist Physician at Mediclinic earning 2.4 million per year, conservative risk mandate, address 88 Rivonia Road Sandton'
                )
              }
            >
              "Dr Nandi Khumalo (Mediclinic, Conservative)"
            </button>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="voice-modal-backdrop" onClick={() => setShowKeyModal(false)}>
          <div className="voice-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="voice-modal-header">
              <Key size={18} className="text-gold" />
              <h3>Gemini 3.5 Transcribe Live Configuration</h3>
            </div>
            <p className="voice-modal-desc">
              Connected model: <strong>models/gemini-3.5-transcribe-live</strong> over the Google Generative Language Live WebSocket API.
            </p>
            <div className="form-group">
              <label className="field-label">API Key</label>
              <input
                type="password"
                className="form-input"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="AQ... or AIza..."
              />
            </div>
            <div className="voice-modal-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowKeyModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={saveApiKey}
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
