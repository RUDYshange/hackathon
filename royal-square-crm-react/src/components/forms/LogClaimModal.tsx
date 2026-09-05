import React, { useState, useEffect } from 'react';
import { liveTranscribeService } from '../../services/geminiLiveService';
import { FormFieldExtractor, ExtractedClaimData } from '../../services/formFieldExtractor';
import { VoiceMicButton } from './VoiceMicButton';
import { secureFetch } from '../../services/api';
import {
  Mic,
  MicOff,
  ShieldCheck,
  X,
  Radio,
  FileCheck2,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';

interface ClientOption {
  id: string;
  fullName: string;
  reference: string;
}

interface LogClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimCreated: () => void;
  initialClientId?: string;
}

export const LogClaimModal: React.FC<LogClaimModalProps> = ({
  isOpen,
  onClose,
  onClaimCreated,
  initialClientId = ''
}) => {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientId, setClientId] = useState<string>(initialClientId);
  const [insurer, setInsurer] = useState<string>('Discovery Life');
  const [claimType, setClaimType] = useState<string>('MOTOR_COLLISION');
  const [policyNumber, setPolicyNumber] = useState<string>('');
  const [incidentDate, setIncidentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [claimsHandler, setClaimsHandler] = useState<string>('Eileen Botha');

  // Voice State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [volume, setVolume] = useState<number>(0);
  const [autoFillLive, setAutoFillLive] = useState<boolean>(true);
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing'>('idle');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchClients();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (isListening) {
        liveTranscribeService.stop();
      }
    };
  }, [isListening]);

  const fetchClients = async () => {
    const res = await secureFetch<any[]>('/clients');
    if (res.data) {
      setClients(res.data.map((c) => ({
        id: c.id,
        fullName: c.fullName,
        reference: c.reference
      })));
      if (!clientId && res.data.length > 0) {
        setClientId(res.data[0].id);
      }
    }
  };

  const applyExtractedClaim = (extracted: ExtractedClaimData) => {
    if (extracted.clientId) setClientId(extracted.clientId);
    if (extracted.insurer) setInsurer(extracted.insurer);
    if (extracted.claimType) setClaimType(extracted.claimType);
    if (extracted.policyNumber) setPolicyNumber(extracted.policyNumber);
    if (extracted.incidentDate) setIncidentDate(extracted.incidentDate);
    if (extracted.description) setDescription(extracted.description);
    if (extracted.claimsHandler) setClaimsHandler(extracted.claimsHandler);
  };

  // Real-time live speech update
  const handleLiveSpeech = (spoken: string) => {
    setTranscript(spoken);
    if (autoFillLive && spoken.trim()) {
      const extracted = FormFieldExtractor.extractClaimFromTranscript(spoken, clients);
      applyExtractedClaim(extracted);
    }
  };

  const toggleVoiceRecording = async () => {
    if (isListening) {
      setStatus('processing');
      const finalTranscript = await liveTranscribeService.stop();
      setIsListening(false);
      setStatus('idle');
      setVolume(0);

      if (finalTranscript) {
        // Run refined Gemini semantic extraction
        const enriched = await FormFieldExtractor.extractClaimWithGemini(finalTranscript, clients);
        applyExtractedClaim(enriched);
      }
      return;
    }

    setTranscript('');
    setInterimText('');
    setErrorMessage(null);
    setIsListening(true);
    setStatus('listening');

    try {
      await liveTranscribeService.start({
        onStatusChange: (s) => {
          if (s === 'listening') setStatus('listening');
          else if (s === 'idle' || s === 'stopped') {
            setStatus('idle');
            setIsListening(false);
          }
        },
        onTranscript: (full) => {
          handleLiveSpeech(full);
        },
        onDelta: (delta) => {
          setInterimText(delta);
        },
        onVolumeChange: (vol) => {
          setVolume(vol);
        },
        onError: (err) => {
          console.warn('[LogClaimVoice] Error:', err);
        }
      });
    } catch (err: any) {
      console.error('[LogClaimVoice] Start failed:', err);
      setIsListening(false);
      setStatus('idle');
    }
  };

  const handleUseSample = (sample: string) => {
    setTranscript(sample);
    const extracted = FormFieldExtractor.extractClaimFromTranscript(sample, clients);
    applyExtractedClaim(extracted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!clientId) {
      setErrorMessage('Please select or name a client.');
      return;
    }
    if (!insurer.trim()) {
      setErrorMessage('Please provide an insurer name.');
      return;
    }
    if (!incidentDate) {
      setErrorMessage('Please specify an incident date.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        clientId,
        insurer: insurer.trim(),
        claimType,
        incidentDate,
        lodgedDate: new Date().toISOString().split('T')[0],
        description: description.trim() || 'Claim registered via voice advisory workflow.',
        policyNumber: policyNumber.trim() || null
      };

      const res = await secureFetch('/claims', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage(`Claim lodged successfully with reference ${res.data?.reference || 'pending'}!`);
        setTimeout(() => {
          onClaimCreated();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to lodge claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="claim-modal-backdrop" onClick={onClose}>
      <div className="claim-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="claim-modal-header">
          <div className="flex items-center gap-2">
            <div className="modal-icon-badge">
              <FileCheck2 size={20} className="text-royal" />
            </div>
            <div>
              <h2 className="modal-title">Log New Insurance Claim</h2>
              <p className="modal-subtitle">Register and initialize 10-stage adjudication pipeline</p>
            </div>
          </div>
          <button type="button" className="btn-icon-subtle" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Voice Dictation Hub */}
        <div className={`claim-voice-hub ${isListening ? 'active-listening' : ''}`}>
          <div className="voice-hub-top">
            <div className="flex items-center gap-2">
              <span className="voice-protocol-pill">
                <Radio size={12} className={isListening ? 'animate-pulse text-gold' : ''} />
                Gemini 3.5 Transcribe Live
              </span>
              <span className="text-xs text-muted">Speech-to-Claim Assistant</span>
            </div>

            <label className="auto-fill-toggle">
              <input
                type="checkbox"
                checked={autoFillLive}
                onChange={(e) => setAutoFillLive(e.target.checked)}
              />
              <span>Live Form Auto-Update</span>
            </label>
          </div>

          <div className="voice-hub-actions">
            <button
              type="button"
              className={`btn-voice-record ${isListening ? 'recording' : ''}`}
              onClick={toggleVoiceRecording}
            >
              {isListening ? (
                <>
                  <MicOff size={16} />
                  <span>Stop Listening</span>
                </>
              ) : (
                <>
                  <Mic size={16} />
                  <span>Start Spoken Dictation</span>
                </>
              )}
            </button>

            {/* Equalizer Visualizer */}
            <div className="audio-visualizer-strip">
              {[0.4, 0.7, 1.1, 0.6, 1.0, 1.3, 0.8, 0.5, 0.9, 0.7].map((mult, idx) => {
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
              {isListening ? (
                <span className="text-success font-medium flex items-center gap-1.5">
                  <span className="pulse-dot" /> Hearing your voice live... Speak naturally
                </span>
              ) : status === 'processing' ? (
                <span className="text-gold">Polishing claim fields with Gemini...</span>
              ) : (
                <span className="text-muted">Click the mic or test with a sample utterance below</span>
              )}
            </div>

            {transcript && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setTranscript('')}
                title="Clear transcript"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>

          {/* Real-time What You're Saying Live Box */}
          <div className="voice-live-text-card">
            <div className="live-text-header">
              <span>What You Are Saying (Live Transcription)</span>
              {isListening && <span className="live-badge">Streaming Live 16kHz</span>}
            </div>
            <div className="live-text-body">
              {transcript ? (
                <p className="spoken-text">
                  "{transcript}"
                  {interimText && <span className="interim-tail"> {interimText}</span>}
                </p>
              ) : (
                <p className="spoken-placeholder">
                  "Say for example: 'Log a motor collision claim for Sipho Dlamini with Discovery Life, policy number POL-99210, occurred on 15 August 2026, client was rear-ended at a traffic light on Sandton Drive'..."
                </p>
              )}
            </div>
          </div>

          {/* Quick-try Prompt Chips */}
          <div className="claim-samples-row">
            <span className="text-xs text-muted">Test samples:</span>
            <button
              type="button"
              className="btn-sample-prompt"
              onClick={() =>
                handleUseSample(
                  'Log a motor collision claim for Sipho Dlamini with Discovery Life, policy POL-88210, happened yesterday, rear-ended at traffic lights on Sandton Drive, bumper damaged'
                )
              }
            >
              "Sipho Dlamini &bull; Discovery Life (Motor)"
            </button>
            <button
              type="button"
              className="btn-sample-prompt"
              onClick={() =>
                handleUseSample(
                  'Claim for Nyakallo Masiu, insurer Old Mutual, critical illness, policy POL-4491, diagnosed with acute medical condition requiring immediate treatment'
                )
              }
            >
              "Nyakallo Masiu &bull; Old Mutual (Critical Illness)"
            </button>
            <button
              type="button"
              className="btn-sample-prompt"
              onClick={() =>
                handleUseSample(
                  'Lodge claim for Ansie Van Der Merwe, Santam, property loss, burst geyser flooded ground floor living room, policy POL-12093'
                )
              }
            >
              "Ansie Van Der Merwe &bull; Santam (Property Loss)"
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="alert-banner alert-error mb-4">
            <AlertTriangle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="alert-banner alert-success mb-4">
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Claim Form Fields */}
        <form onSubmit={handleSubmit} className="claim-entry-form">
          <div className="form-grid grid-cols-2">
            {/* Client Selection */}
            <div className="form-group">
              <div className="field-label-row">
                <label className="field-label">Select Client *</label>
                <VoiceMicButton
                  fieldLabel="Client Name"
                  onTranscribe={(text) => {
                    const match = clients.find((c) =>
                      c.fullName.toLowerCase().includes(text.toLowerCase().trim())
                    );
                    if (match) setClientId(match.id);
                  }}
                />
              </div>
              <select
                className="form-input"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              >
                <option value="" disabled>Select a client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.reference})
                  </option>
                ))}
              </select>
            </div>

            {/* Insurer */}
            <div className="form-group">
              <div className="field-label-row">
                <label className="field-label">Underwriting Insurer *</label>
                <VoiceMicButton
                  fieldLabel="Insurer"
                  currentValue={insurer}
                  onTranscribe={(text) => setInsurer(text)}
                />
              </div>
              <input
                className="form-input"
                value={insurer}
                onChange={(e) => setInsurer(e.target.value)}
                placeholder="e.g. Discovery Life, Old Mutual, Sanlam, Santam"
                required
              />
            </div>

            {/* Policy Number */}
            <div className="form-group">
              <div className="field-label-row">
                <label className="field-label">Policy Number</label>
                <VoiceMicButton
                  fieldLabel="Policy Number"
                  currentValue={policyNumber}
                  onTranscribe={(text) => setPolicyNumber(text.replace(/\s+/g, '').toUpperCase())}
                />
              </div>
              <input
                className="form-input font-mono"
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                placeholder="e.g. POL-88210-ZA"
              />
            </div>

            {/* Claim Type */}
            <div className="form-group">
              <div className="field-label-row">
                <label className="field-label">Claim Classification *</label>
                <VoiceMicButton
                  fieldLabel="Claim Type"
                  onTranscribe={(text) => {
                    const extracted = FormFieldExtractor.extractClaimFromTranscript(text);
                    if (extracted.claimType) setClaimType(extracted.claimType);
                  }}
                />
              </div>
              <select
                className="form-input"
                value={claimType}
                onChange={(e) => setClaimType(e.target.value)}
                required
              >
                <option value="MOTOR_COLLISION">Motor Collision / Accident</option>
                <option value="CRITICAL_ILLNESS">Critical Illness / Dread Disease</option>
                <option value="DISABILITY">Disability & Incapacity</option>
                <option value="LIFE_ASSURANCE">Life Assurance & Death Benefit</option>
                <option value="RETRENCHMENT">Retrenchment & Severance Cover</option>
                <option value="PROPERTY_LOSS">Property Loss / Geyser / Fire</option>
                <option value="THEFT">Theft / Burglary / Hijacking</option>
              </select>
            </div>

            {/* Incident Date */}
            <div className="form-group">
              <div className="field-label-row">
                <label className="field-label">Date of Incident *</label>
                <VoiceMicButton
                  fieldLabel="Incident Date"
                  onTranscribe={(text) => {
                    const extracted = FormFieldExtractor.extractClaimFromTranscript(text);
                    if (extracted.incidentDate) setIncidentDate(extracted.incidentDate);
                  }}
                />
              </div>
              <input
                type="date"
                className="form-input"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                required
              />
            </div>

            {/* Claims Handler */}
            <div className="form-group">
              <label className="field-label">Assigned Claims Handler</label>
              <input
                className="form-input"
                value={claimsHandler}
                onChange={(e) => setClaimsHandler(e.target.value)}
                placeholder="e.g. Eileen Botha"
              />
            </div>

            {/* Incident Description */}
            <div className="form-group span-full">
              <div className="field-label-row">
                <label className="field-label">Incident Description & Circumstances</label>
                <VoiceMicButton
                  fieldLabel="Description"
                  currentValue={description}
                  appendMode={true}
                  onTranscribe={(text) => setDescription((prev) => (prev ? `${prev} ${text}` : text))}
                />
              </div>
              <textarea
                rows={3}
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed description of incident, damages, scene location, and any third parties involved..."
              />
            </div>
          </div>

          <div className="claim-modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin-icon" /> Registering Claim...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} /> Confirm & Lodge Claim
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
