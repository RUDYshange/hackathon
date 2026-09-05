import React, { useState, useEffect } from 'react';
import { useClient } from '../context/ClientContext';
import { liveTranscribeService } from '../../services/geminiLiveService';
import { SmartTranscribeService, SmartTranscribeResult } from '../../services/smartTranscribe';
import { AccidentLocationMap, PinnedLocation } from '../../components/maps/AccidentLocationMap';
import { CalendarReminderService } from '../../services/reminderService';
import { secureFetch } from '../../services/api';
import {
  Mic,
  MicOff,
  Sparkles,
  MapPin,
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  PhoneCall,
  Loader2,
  Trash2,
  FileCheck
} from 'lucide-react';

interface UploadedPhoto {
  id: string;
  name: string;
  size: string;
  category: 'VEHICLE_DAMAGE' | 'THIRD_PARTY_SCENE' | 'DRIVERS_LICENCE';
  previewUrl: string;
}

export const SimplifiedClaimFlow: React.FC = () => {
  const { client } = useClient();

  // Voice & Narrative State
  const [narrative, setNarrative] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [rawTranscript, setRawTranscript] = useState<string>('');
  const [smartResult, setSmartResult] = useState<SmartTranscribeResult | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const [isPolishing, setIsPolishing] = useState<boolean>(false);

  // Location State
  const [location, setLocation] = useState<PinnedLocation | null>(null);

  // Photos & Evidence State (Document Gated)
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [thirdPartyReg, setThirdPartyReg] = useState<string>('');

  // SAPS Reminder State
  const [reminderDate, setReminderDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2); // 48h South African legal window
    return d.toISOString().split('T')[0];
  });
  const [reminderChannel, setReminderChannel] = useState<'SMS' | 'CALENDAR'>('SMS');

  // Submission & Post-submit state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedClaim, setSubmittedClaim] = useState<{
    reference: string;
    submittedAt: string;
    reminderDate: string;
    channel: string;
  } | null>(null);

  // Cleanup voice stream on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        liveTranscribeService.stop();
      }
    };
  }, [isListening]);

  // Voice Recording Toggle
  const toggleVoiceRecording = async () => {
    if (isListening) {
      liveTranscribeService.stop();
      setIsListening(false);
      setVolume(0);
      return;
    }

    try {
      setIsListening(true);
      await liveTranscribeService.start({
        onTranscript: (text) => {
          setRawTranscript(text);
          const cleaned = SmartTranscribeService.clean(text);
          setSmartResult(cleaned);
          setNarrative(cleaned.cleanedText);
        },
        onError: (err) => {
          console.warn('[Voice Transcribe Error]:', err);
          setIsListening(false);
        },
        onVolumeChange: (vol: number) => {
          setVolume(vol);
        }
      });
    } catch (err) {
      console.error('Failed to access microphone', err);
      setIsListening(false);
    }
  };

  // AI Polish
  const handlePolishWithGemini = async () => {
    if (!narrative.trim()) return;
    setIsPolishing(true);
    try {
      const res = await secureFetch<{ polishedText: string }>('/claims/polish-transcript', {
        method: 'POST',
        body: JSON.stringify({
          rawText: narrative,
          context: {
            vehicle: `${client.insuredVehicle.year} ${client.insuredVehicle.make} ${client.insuredVehicle.model}`,
            insured: client.fullName
          }
        })
      });

      if (res.data?.polishedText) {
        setNarrative(res.data.polishedText);
      } else {
        // Fallback client-side formatter if backend API is not responding
        const cleaned = SmartTranscribeService.clean(narrative).cleanedText;
        const formatted = `On ${new Date().toLocaleDateString('en-ZA')}, insured vehicle ${client.insuredVehicle.registration} was involved in an accident. ${cleaned}`;
        setNarrative(formatted);
      }
    } catch {
      const cleaned = SmartTranscribeService.clean(narrative).cleanedText;
      setNarrative(cleaned);
    } finally {
      setIsPolishing(false);
    }
  };

  // Quick incident chip applicator
  const applyQuickScenario = (scenarioText: string) => {
    if (!narrative.trim()) {
      setNarrative(scenarioText);
    } else {
      setNarrative((prev) => `${prev.trim()} ${scenarioText}`);
    }
  };

  // Photo simulation & upload handler
  const handleSimulateUpload = (category: UploadedPhoto['category']) => {
    const labels = {
      VEHICLE_DAMAGE: 'Damaged Front Bumper & Headlamp',
      THIRD_PARTY_SCENE: 'Intersection Scene & Skid Marks',
      DRIVERS_LICENCE: 'Driver Licence Card (Front)'
    };
    const newDoc: UploadedPhoto = {
      id: `doc-${Date.now()}`,
      name: `${labels[category]}.jpg`,
      size: `${(1.2 + Math.random() * 2.1).toFixed(1)} MB`,
      category,
      previewUrl: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=300&q=80'
    };
    setPhotos((prev) => [...prev, newDoc]);
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Form Validation Flags (Scope reduced to narrative & photos)
  const hasNarrative = narrative.trim().length >= 10;
  const hasLocation = Boolean(location && location.address);
  const hasPhotos = photos.length > 0;
  const canSubmit = hasNarrative && hasPhotos;

  // Final Claim Submission
  const handleSubmitClaim = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const generatedRef = `CLM-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      // 1. Post claim to backend API
      const claimPayload = {
        reference: generatedRef,
        clientId: client.id,
        clientName: client.fullName,
        policyNumber: client.insuredVehicle.policyNumber,
        insurer: client.insuredVehicle.insurer,
        vehicleReg: client.insuredVehicle.registration,
        incidentDate: new Date().toISOString().split('T')[0],
        description: narrative,
        location: location || {
          address: 'Sandton City, Johannesburg',
          lat: -26.1076,
          lng: 28.0567
        },
        thirdPartyReg: thirdPartyReg.trim() || undefined,
        documents: photos.map((p) => ({
          name: p.name,
          category: p.category,
          size: p.size
        })),
        source: 'CLIENT_SELF_SERVICE'
      };

      await secureFetch('/claims', {
        method: 'POST',
        body: JSON.stringify(claimPayload)
      });

      // 2. Automatically register the 48h SAPS follow-up reminder
      await CalendarReminderService.scheduleReminder({
        title: `Report to SAPS Police Station [Ref: ${generatedRef}]`,
        clientId: client.id,
        clientName: client.fullName,
        dueOn: reminderDate,
        dueTime: '10:00',
        channel: reminderChannel,
        ruleName: 'Short-Term Motor Claim Protocol',
        notes: `Client self-service claim for ${client.insuredVehicle.registration} with ${client.insuredVehicle.insurer}. Police case number needed within 48h.`
      });

      setSubmittedClaim({
        reference: generatedRef,
        submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reminderDate,
        channel: reminderChannel
      });
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit claim. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetFlow = () => {
    setNarrative('');
    setLocation(null);
    setPhotos([]);
    setThirdPartyReg('');
    setSubmittedClaim(null);
    setSubmitError(null);
  };

  // POST-SUBMIT SUCCESS VIEW
  if (submittedClaim) {
    return (
      <div className="client-success-screen">
        <div className="success-badge-halo">
          <CheckCircle2 size={48} className="text-emerald" />
        </div>
        <h2 className="success-headline">Your Claim Has Been Logged</h2>
        <p className="success-sub">
          We've notified your Santam claims officer and registered your claim reference.
        </p>

        {/* Claim summary card */}
        <div className="success-details-card">
          <div className="claim-ref-hero">
            <span className="ref-label">Official Claim Reference</span>
            <span className="ref-number">{submittedClaim.reference}</span>
          </div>

          <div className="success-info-grid">
            <div className="info-cell">
              <span className="cell-label">Insured Vehicle</span>
              <span className="cell-val">
                {client.insuredVehicle.year} {client.insuredVehicle.make} {client.insuredVehicle.model}
              </span>
              <span className="cell-sub">{client.insuredVehicle.registration}</span>
            </div>
            <div className="info-cell">
              <span className="cell-label">Assigned Advisor</span>
              <span className="cell-val">{client.advisor.name}</span>
              <span className="cell-sub">{client.advisor.email}</span>
            </div>
            <div className="info-cell">
              <span className="cell-label">Insurer Underwriter</span>
              <span className="cell-val">{client.insuredVehicle.insurer}</span>
              <span className="cell-sub">Policy: {client.insuredVehicle.policyNumber}</span>
            </div>
            <div className="info-cell">
              <span className="cell-label">SAPS 48h Reminder</span>
              <span className="cell-val text-emerald">
                Scheduled for {submittedClaim.reminderDate}
              </span>
              <span className="cell-sub">via {submittedClaim.channel} Notification</span>
            </div>
          </div>

          {/* Emergency / Tow assistance banner */}
          <div className="emergency-callout-banner">
            <div className="flex items-center gap-2">
              <PhoneCall size={20} className="text-gold" />
              <div>
                <strong>Need Immediate Roadside Towing?</strong>
                <p>Call Santam 24/7 Emergency Dispatch at <strong>0800 111 222</strong> (Toll-free)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="success-actions-row">
          <button type="button" className="btn btn-primary" onClick={handleResetFlow}>
            Report Another Incident
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.print()}
          >
            Print / Save Receipt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="simplified-client-flow">
      {/* 1. Pre-loaded Assumed Account Banner */}
      <div className="assumed-account-card">
        <div className="card-left-identity">
          <div className="insured-avatar">
            <ShieldCheck size={26} className="text-gold" />
          </div>
          <div className="insured-meta">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="insured-name">Welcome back, {client.fullName}</span>
              <span className="badge-verified-pill">
                <CheckCircle2 size={12} /> Account & Cover Active
              </span>
            </div>
            <p className="insured-summary-line">
              <strong>{client.insuredVehicle.year} {client.insuredVehicle.make} {client.insuredVehicle.model}</strong> &bull; Plate:{' '}
              <span className="font-mono text-gold">{client.insuredVehicle.registration}</span> &bull;{' '}
              {client.insuredVehicle.insurer} ({client.insuredVehicle.policyNumber})
            </p>
          </div>
        </div>
        <div className="card-right-note">
          <span className="note-pill">
            <ShieldCheck size={14} className="text-emerald" />
            No policy forms to re-fill. Just tell us what happened below.
          </span>
        </div>
      </div>

      {/* 2. Primary Incident Description (Voice & Text) */}
      <section className="client-step-section" aria-labelledby="heading-narrative">
        <div className="section-header">
          <div className="step-number-circle">1</div>
          <div>
            <h2 id="heading-narrative" className="section-heading">
              What happened?
            </h2>
            <p className="section-subheading">
              Tap the microphone to speak your statement or type below. Our voice assistant automatically cleans up pauses and stutters.
            </p>
          </div>
        </div>

        {/* Gemini Smart Voice Transcribe Block */}
        <div className={`client-voice-box ${isListening ? 'active-listening' : ''}`}>
          <div className="voice-box-top">
            <button
              type="button"
              className={`btn-client-mic ${isListening ? 'recording' : ''}`}
              onClick={toggleVoiceRecording}
              aria-pressed={isListening}
            >
              {isListening ? <MicOff size={22} /> : <Mic size={22} />}
              <span>{isListening ? 'Stop Recording' : 'Tap to Speak What Happened'}</span>
            </button>

            {/* Audio wave animation */}
            <div className="voice-audio-bars" aria-hidden="true">
              {[0.4, 0.9, 1.3, 0.7, 1.2, 1.5, 0.8, 0.5, 1.1, 0.6].map((m, i) => (
                <span
                  key={i}
                  className="bar"
                  style={{
                    height: `${isListening ? Math.max(5, Math.min(32, volume * m * 38)) : 5}px`
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              className="btn-polish-gemini"
              onClick={handlePolishWithGemini}
              disabled={isPolishing || !narrative.trim()}
              title="Enhance natural voice description into insurance-grade wording"
            >
              {isPolishing ? (
                <Loader2 size={15} className="spin-icon" />
              ) : (
                <Sparkles size={15} className="text-gold" />
              )}
              <span>{isPolishing ? 'Polishing statement...' : 'Polish with AI'}</span>
            </button>
          </div>

          {/* Real-time speech stream */}
          {isListening && (
            <div className="live-speech-box">
              <span className="pulse-indicator" />
              <span className="live-caption">Listening: "{rawTranscript || 'Speak now...'}"</span>
            </div>
          )}

          {smartResult && smartResult.removedCount > 0 && (
            <div className="filter-chip-notice">
              <Sparkles size={12} className="text-gold" />
              <span>
                Filtered {smartResult.removedCount} filler {smartResult.removedCount === 1 ? 'word' : 'words'} ('um' / 'uh' / stutter) automatically.
              </span>
            </div>
          )}

          {/* Textarea */}
          <div className="narrative-textarea-wrapper">
            <label htmlFor="incident-narrative" className="sr-only">
              Accident Description
            </label>
            <textarea
              id="incident-narrative"
              rows={4}
              className={`client-narrative-input ${!hasNarrative && narrative.length > 0 ? 'border-warning' : ''}`}
              value={narrative}
              onChange={(e) => {
                setNarrative(e.target.value);
                setSmartResult(SmartTranscribeService.clean(e.target.value));
              }}
              placeholder="e.g. I was waiting at the traffic light on Sandton Drive when a silver bakkie bumped into my rear bumper. The driver stopped and we exchanged contact details..."
            />
          </div>

          {/* Quick Scenario Chips */}
          <div className="quick-scenarios-row">
            <span className="scenarios-label">Quick suggestions:</span>
            <button
              type="button"
              className="scenario-chip"
              onClick={() => applyQuickScenario('Rear-end collision while stopped at a red traffic light.')}
            >
              Rear-ended at red light
            </button>
            <button
              type="button"
              className="scenario-chip"
              onClick={() => applyQuickScenario('Sideswiped in a shopping mall parking bay while parked.')}
            >
              Sideswiped while parked
            </button>
            <button
              type="button"
              className="scenario-chip"
              onClick={() => applyQuickScenario('Windscreen cracked by gravel flicked from a truck on highway.')}
            >
              Windscreen stone chip
            </button>
            <button
              type="button"
              className="scenario-chip"
              onClick={() => applyQuickScenario('Severe pothole impact caused tire puncture and alloy rim buckle.')}
            >
              Pothole / Rim damage
            </button>
          </div>
        </div>
      </section>

      {/* 3. Location (Google Maps & One-Tap Pin) */}
      <section className="client-step-section" aria-labelledby="heading-location">
        <div className="section-header">
          <div className="step-number-circle">2</div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="heading-location" className="section-heading">
                Where did it happen?
              </h2>
              {hasLocation && (
                <span className="badge-done">
                  <CheckCircle2 size={12} /> Location Pinned
                </span>
              )}
            </div>
            <p className="section-subheading">
              Confirm the scene location on Google Maps or use your device's GPS.
            </p>
          </div>
        </div>

        <div className="client-map-card">
          <div className="map-embed-wrapper">
            <AccidentLocationMap
              value={location}
              onChange={(loc) => setLocation(loc)}
            />
          </div>
          {location && (
            <div className="selected-location-pill">
              <MapPin size={16} className="text-gold shrink-0" />
              <div className="location-text">
                <strong>Pinned Address:</strong> {location.address}
                <span className="coords-sub">
                  ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Photos & Evidence (Document Gated) */}
      <section className="client-step-section" aria-labelledby="heading-photos">
        <div className="section-header">
          <div className="step-number-circle">3</div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="heading-photos" className="section-heading">
                Photos & Evidence
              </h2>
              <span className="badge-mandatory">
                * At least 1 photo required
              </span>
            </div>
            <p className="section-subheading">
              Snap damage photos of your vehicle and the scene. Fast-tracks assessor approval.
            </p>
          </div>
        </div>

        {/* Upload Trigger Buttons */}
        <div className="photo-upload-cards-grid">
          <button
            type="button"
            className="photo-action-card"
            onClick={() => handleSimulateUpload('VEHICLE_DAMAGE')}
          >
            <Camera size={26} className="text-gold mb-1" />
            <strong>Vehicle Damage Photo</strong>
            <span className="text-xs text-muted">Tap to upload damage photo</span>
          </button>

          <button
            type="button"
            className="photo-action-card"
            onClick={() => handleSimulateUpload('THIRD_PARTY_SCENE')}
          >
            <UploadCloud size={26} className="text-royal mb-1" />
            <strong>Scene / Third-Party Photo</strong>
            <span className="text-xs text-muted">Tap to add scene or other car</span>
          </button>

          <button
            type="button"
            className="photo-action-card"
            onClick={() => handleSimulateUpload('DRIVERS_LICENCE')}
          >
            <FileCheck size={26} className="text-emerald mb-1" />
            <strong>Driver's Licence Card</strong>
            <span className="text-xs text-muted">Tap to verify driving licence</span>
          </button>
        </div>

        {/* Attached Photos List */}
        {photos.length > 0 ? (
          <div className="attached-photos-strip">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              Attached Evidence ({photos.length})
            </h4>
            <div className="photos-grid">
              {photos.map((p) => (
                <div key={p.id} className="photo-preview-item">
                  <img src={p.previewUrl} alt={p.name} className="photo-thumb" />
                  <div className="photo-meta">
                    <span className="photo-title">{p.name}</span>
                    <span className="photo-size">{p.size}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-remove-photo"
                    onClick={() => handleRemovePhoto(p.id)}
                    title="Remove this photo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="photo-required-warning">
            <AlertCircle size={16} className="text-warning" />
            <span>Please attach at least one photo above before submitting.</span>
          </div>
        )}

        {/* Optional Third-Party Quick Reg */}
        <div className="optional-thirdparty-box mt-3">
          <label htmlFor="tp-reg" className="field-label-small">
            Third-party registration plate (if available, optional):
          </label>
          <input
            id="tp-reg"
            className="client-compact-input font-mono"
            placeholder="e.g. CA 882-991 or GP plates"
            value={thirdPartyReg}
            onChange={(e) => setThirdPartyReg(e.target.value.toUpperCase())}
          />
        </div>
      </section>

      {/* 5. 48h SAPS Police Reminder & Submit */}
      <section className="client-step-section" aria-labelledby="heading-submit">
        <div className="section-header">
          <div className="step-number-circle">4</div>
          <div>
            <h2 id="heading-submit" className="section-heading">
              Submit & 48h SAPS Follow-up
            </h2>
            <p className="section-subheading">
              South African law requires motor accidents to be reported to SAPS within 24–48 hours. We schedule an automatic reminder for you.
            </p>
          </div>
        </div>

        <div className="saps-reminder-preview-card">
          <div className="flex items-center gap-3">
            <Clock size={24} className="text-gold shrink-0" />
            <div className="reminder-info-grow">
              <strong>Automatic 48-Hour Police Docket Reminder</strong>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="date"
                  className="client-compact-input"
                  style={{ width: 'auto', padding: '3px 8px', fontSize: '12px' }}
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  title="Adjust scheduled police report reminder date"
                />
                <span className="text-xs text-muted">
                  via <span className="text-gold font-semibold">{reminderChannel}</span>
                </span>
              </div>
            </div>
            <div className="channel-select-group">
              <button
                type="button"
                className={`channel-btn ${reminderChannel === 'SMS' ? 'active' : ''}`}
                onClick={() => setReminderChannel('SMS')}
              >
                SMS
              </button>
              <button
                type="button"
                className={`channel-btn ${reminderChannel === 'CALENDAR' ? 'active' : ''}`}
                onClick={() => setReminderChannel('CALENDAR')}
              >
                Calendar
              </button>
            </div>
          </div>
        </div>

        {submitError && (
          <div className="client-error-banner">
            <AlertCircle size={18} />
            <span>{submitError}</span>
          </div>
        )}

        {/* Big accessible submit bar */}
        <div className="client-submit-bar">
          <div className="validation-summary">
            {!hasNarrative ? (
              <span className="text-warning text-xs">
                &bull; Please describe what happened (Step 1)
              </span>
            ) : !hasPhotos ? (
              <span className="text-warning text-xs">
                &bull; Please attach at least 1 photo (Step 3)
              </span>
            ) : (
              <span className="text-emerald text-xs flex items-center gap-1 font-medium">
                <CheckCircle2 size={13} /> Ready for submission
              </span>
            )}
          </div>

          <button
            type="button"
            className="btn-client-submit-primary"
            disabled={!canSubmit || isSubmitting}
            onClick={handleSubmitClaim}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="spin-icon" />
                <span>Submitting to Santam...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={20} />
                <span>Submit Accident Claim</span>
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
};
