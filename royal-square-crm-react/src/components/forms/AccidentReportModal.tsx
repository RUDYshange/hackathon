import React, { useState, useEffect } from 'react';
import { liveTranscribeService } from '../../services/geminiLiveService';
import { SmartTranscribeService, SmartTranscribeResult } from '../../services/smartTranscribe';
import { FormFieldExtractor } from '../../services/formFieldExtractor';
import { AccidentLocationMap, PinnedLocation } from '../maps/AccidentLocationMap';
import { CalendarReminderService } from '../../services/reminderService';
import { secureFetch } from '../../services/api';
import {
  Car,
  MapPin,
  Calendar as CalendarIcon,
  Mic,
  MicOff,
  Sparkles,
  UploadCloud,
  X,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  FileText,
  ShieldCheck,
  BellRing,
  Clock,
  Trash2
} from 'lucide-react';

interface ClientOption {
  id: string;
  fullName: string;
  reference: string;
  mobileNumber?: string;
}

interface UploadedDocument {
  id: string;
  name: string;
  size: string;
  category: 'SCENE_PHOTO' | 'DRIVERS_LICENCE' | 'POLICE_REPORT' | 'OTHER';
  url: string;
}

interface AccidentReportModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onClaimCreated?: () => void;
  initialClientId?: string;
}

export const AccidentReportModal: React.FC<AccidentReportModalProps> = ({
  isOpen = true,
  onClose,
  onClaimCreated = () => {},
  initialClientId = ''
}) => {
  // Steps: 1 = Incident & Voice, 2 = Map Pin Location, 3 = Documents & Evidence, 4 = Calendar Reminder & Review
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Clients & Insured Data
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientId, setClientId] = useState<string>(initialClientId);
  const [insurer, setInsurer] = useState<string>('Santam');
  const [policyNumber, setPolicyNumber] = useState<string>('POL-99210-ZA');
  const [incidentDate, setIncidentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [incidentTime, setIncidentTime] = useState<string>('14:30');
  const [vehicleUsage, setVehicleUsage] = useState<'PERSONAL' | 'BUSINESS'>('PERSONAL');
  const [driverName, setDriverName] = useState<string>('');

  // Voice & Smart Transcribe State
  const [description, setDescription] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [rawTranscript, setRawTranscript] = useState<string>('');
  const [smartResult, setSmartResult] = useState<SmartTranscribeResult | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const [isPolishing, setIsPolishing] = useState<boolean>(false);

  // Map & Location State
  const [pinnedLocation, setPinnedLocation] = useState<PinnedLocation | null>(null);
  const [roadCondition, setRoadCondition] = useState<string>('Dry & Clear');
  const [weatherCondition, setWeatherCondition] = useState<string>('Daylight / Fine');

  // Evidence & Mandatory Documents
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [policeCaseNumber, setPoliceCaseNumber] = useState<string>('');
  const [policeStation, setPoliceStation] = useState<string>('');
  const [thirdPartyReg, setThirdPartyReg] = useState<string>('');
  const [thirdPartyInsurer, setThirdPartyInsurer] = useState<string>('');

  // Calendar Reminder State
  const [reminderTitle, setReminderTitle] = useState<string>('Report to SAPS Police Station within 48h');
  const [reminderDate, setReminderDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2); // 48h deadline by default
    return d.toISOString().split('T')[0];
  });
  const [reminderTime, setReminderTime] = useState<string>('10:00');
  const [reminderChannel, setReminderChannel] = useState<'CALENDAR' | 'SMS' | 'EMAIL'>('SMS');

  // Submission & Completion Notification State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedReminderNotice, setSubmittedReminderNotice] = useState<{
    claimRef: string;
    reminderTitle: string;
    reminderDate: string;
    reminderTime: string;
    channel: string;
  } | null>(null);

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
      setClients(
        res.data.map((c) => ({
          id: c.id,
          fullName: c.fullName,
          reference: c.reference,
          mobileNumber: c.mobileNumber
        }))
      );
      if (!clientId && res.data.length > 0) {
        setClientId(res.data[0].id);
        setDriverName(res.data[0].fullName);
      }
    }
  };

  // Handle live speech from Gemini Transcribe Live
  const handleLiveSpeech = (spoken: string) => {
    setRawTranscript(spoken);
    const cleaned = SmartTranscribeService.clean(spoken);
    setSmartResult(cleaned);
    setDescription(cleaned.cleanedText);

    // Also auto-extract any spoken entities
    const extracted = FormFieldExtractor.extractClaimFromTranscript(spoken, clients);
    if (extracted.insurer) setInsurer(extracted.insurer);
    if (extracted.policyNumber) setPolicyNumber(extracted.policyNumber);
    if (extracted.incidentDate) setIncidentDate(extracted.incidentDate);
    if (extracted.clientId) setClientId(extracted.clientId);
  };

  const toggleVoiceRecording = async () => {
    if (isListening) {
      const finalSpoken = await liveTranscribeService.stop();
      setIsListening(false);
      setVolume(0);

      if (finalSpoken) {
        const cleaned = SmartTranscribeService.clean(finalSpoken);
        setSmartResult(cleaned);
        setDescription(cleaned.cleanedText);
      }
      return;
    }

    setErrorMessage(null);
    setIsListening(true);
    setRawTranscript('');

    try {
      await liveTranscribeService.start({
        onStatusChange: (s) => {
          if (s === 'idle' || s === 'stopped') setIsListening(false);
        },
        onTranscript: (full) => {
          handleLiveSpeech(full);
        },
        onVolumeChange: (vol) => {
          setVolume(vol);
        },
        onError: (err) => {
          console.warn('[AccidentVoice] Error:', err);
        }
      });
    } catch (err: any) {
      console.error('[AccidentVoice] Failed:', err);
      setIsListening(false);
    }
  };

  // Deep polish with Gemini AI
  const handlePolishWithGemini = async () => {
    if (!description.trim()) return;
    setIsPolishing(true);
    try {
      const polished = await SmartTranscribeService.refineWithGemini(description);
      setDescription(polished);
    } catch (err) {
      console.warn('[AccidentReport] Refinement error:', err);
    } finally {
      setIsPolishing(false);
    }
  };

  // Document Upload Simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, category: UploadedDocument['category']) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newDocs: UploadedDocument[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      category,
      url: URL.createObjectURL(file)
    }));

    setDocuments((prev) => [...prev, ...newDocs]);
    e.target.value = '';
  };

  const handleRemoveDoc = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // Validation Rules
  const hasDescription = description.trim().length >= 10;
  const hasDocuments = documents.length >= 1;
  const hasLocation = !!pinnedLocation?.lat;

  // Validation check before proceeding
  const canProceedToReview = hasDescription && hasDocuments;

  const handleNextStep = () => {
    setErrorMessage(null);
    if (currentStep === 1) {
      if (!description.trim()) {
        setErrorMessage('Accident description is required. You can dictate using Gemini Smart Transcribe or type it.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!hasDocuments) {
        setErrorMessage('Cannot proceed: At least one required document (Accident scene photo, Driver licence, or Police report) must be uploaded.');
        return;
      }
      if (!hasDescription) {
        setErrorMessage('Cannot proceed: An accident incident description is required.');
        return;
      }
      setCurrentStep(4);
    }
  };

  // Submit Claim & Schedule Reminder
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // STRICT VALIDATION: The report does not go through with missing document or description!
    if (!description.trim()) {
      setErrorMessage('Validation Failed: The accident report cannot go through without an incident description.');
      setCurrentStep(1);
      return;
    }
    if (documents.length === 0) {
      setErrorMessage('Validation Failed: The report does not go through with missing documents. Please attach accident photos or driver licence.');
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Build Comprehensive Short-Term Claim Payload
      const selectedClient = clients.find((c) => c.id === clientId);
      const fullLocationString = pinnedLocation
        ? `${pinnedLocation.address} (GPS: ${pinnedLocation.lat.toFixed(5)}, ${pinnedLocation.lng.toFixed(5)})`
        : 'Location unpinned';

      const enrichedDescription = [
        description.trim(),
        `--- ACCIDENT SCENE METADATA ---`,
        `Location: ${fullLocationString}`,
        `Driver: ${driverName || selectedClient?.fullName || 'Insured'} (${vehicleUsage} use)`,
        `Road/Weather: ${roadCondition}, ${weatherCondition}`,
        policeCaseNumber ? `Police CAS/Case: ${policeCaseNumber} (${policeStation})` : null,
        thirdPartyReg ? `Third-Party Vehicle: ${thirdPartyReg} (Insurer: ${thirdPartyInsurer || 'Unspecified'})` : null,
        `Documents Attached: ${documents.map((d) => `${d.name} [${d.category}]`).join(', ')}`
      ]
        .filter(Boolean)
        .join('\n');

      const claimPayload = {
        clientId,
        insurer: insurer.trim(),
        claimType: 'MOTOR_COLLISION',
        incidentDate,
        lodgedDate: new Date().toISOString().split('T')[0],
        description: enrichedDescription,
        policyNumber: policyNumber.trim() || null
      };

      const res = await secureFetch<any>('/claims', {
        method: 'POST',
        body: JSON.stringify(claimPayload)
      });

      if (res.error) {
        throw new Error(res.error);
      }

      const createdClaimRef = res.data?.reference || `CLM-${Math.floor(1000 + Math.random() * 9000)}`;

      // 2. Register & Schedule Calendar Reminder
      await CalendarReminderService.scheduleReminder({
        title: `${reminderTitle} [Ref: ${createdClaimRef}]`,
        clientName: selectedClient?.fullName || 'Insured Client',
        clientId,
        dueOn: reminderDate,
        dueTime: reminderTime,
        channel: reminderChannel,
        ruleName: 'Short-Term Motor Claim Protocol',
        notes: `Follow-up on ${createdClaimRef} for ${insurer}. Police case: ${policeCaseNumber || 'Pending'}.`
      });

      // 3. Show prominent notification screen that they will be reminded
      setSubmittedReminderNotice({
        claimRef: createdClaimRef,
        reminderTitle,
        reminderDate,
        reminderTime,
        channel: reminderChannel
      });

      onClaimCreated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit accident report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishNotice = () => {
    setSubmittedReminderNotice(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="claim-modal-backdrop" onClick={onClose}>
      <div className="accident-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Header */}
        <div className="accident-modal-header">
          <div className="flex items-center gap-2.5">
            <div className="accident-icon-badge">
              <Car size={22} className="text-royal" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="modal-title">Short-Term Motor Accident Report</h2>
                <span className="badge-shortterm">Santam &bull; FSP 29370</span>
              </div>
              <p className="modal-subtitle">
                Official insurance accident intake, live GPS scene pinning & smart transcribe
              </p>
            </div>
          </div>
          <button type="button" className="btn-icon-subtle" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* 4-Step Interactive Status Progress Bar */}
        <div className="accident-status-bar">
          <div className="status-steps-track">
            {/* Step 1 */}
            <button
              type="button"
              className={`status-step-node ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}
              onClick={() => setCurrentStep(1)}
            >
              <div className="step-circle">
                {currentStep > 1 ? <CheckCircle2 size={14} /> : '1'}
              </div>
              <div className="step-info">
                <span className="step-label">Incident & Voice</span>
                <span className="step-status">
                  {hasDescription ? 'Description ready' : 'Required *'}
                </span>
              </div>
            </button>

            <div className={`status-connector ${currentStep > 1 ? 'filled' : ''}`} />

            {/* Step 2 */}
            <button
              type="button"
              className={`status-step-node ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}
              onClick={() => setCurrentStep(2)}
            >
              <div className="step-circle">
                {currentStep > 2 ? <CheckCircle2 size={14} /> : '2'}
              </div>
              <div className="step-info">
                <span className="step-label">Map & Location</span>
                <span className="step-status">
                  {hasLocation ? 'Location pinned' : 'Google Maps'}
                </span>
              </div>
            </button>

            <div className={`status-connector ${currentStep > 2 ? 'filled' : ''}`} />

            {/* Step 3 */}
            <button
              type="button"
              className={`status-step-node ${currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : ''}`}
              onClick={() => setCurrentStep(3)}
            >
              <div className="step-circle">
                {currentStep > 3 ? <CheckCircle2 size={14} /> : '3'}
              </div>
              <div className="step-info">
                <span className="step-label">Evidence & Docs</span>
                <span className="step-status">
                  {hasDocuments ? `${documents.length} uploaded` : 'Mandatory *'}
                </span>
              </div>
            </button>

            <div className={`status-connector ${currentStep > 3 ? 'filled' : ''}`} />

            {/* Step 4 */}
            <button
              type="button"
              className={`status-step-node ${currentStep === 4 ? 'active' : ''}`}
              onClick={() => {
                if (canProceedToReview) setCurrentStep(4);
              }}
            >
              <div className="step-circle">4</div>
              <div className="step-info">
                <span className="step-label">Calendar & Submit</span>
                <span className="step-status">Set Reminder</span>
              </div>
            </button>
          </div>

          {/* Validation Banner Indicator */}
          <div className="status-validation-strip">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-medium">Compliance Gates:</span>
              <span className={`compliance-pill ${hasDescription ? 'valid' : 'invalid'}`}>
                {hasDescription ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                Incident Description {hasDescription ? 'Provided' : 'Missing (Required)'}
              </span>
              <span className={`compliance-pill ${hasDocuments ? 'valid' : 'invalid'}`}>
                {hasDocuments ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                Evidence / Documents {hasDocuments ? `${documents.length} Attached` : 'Missing (Required)'}
              </span>
              <span className={`compliance-pill ${hasLocation ? 'valid' : 'neutral'}`}>
                <MapPin size={11} />
                {hasLocation ? 'GPS Pinned' : 'Map Pin Recommended'}
              </span>
            </div>
            <span className="step-pct-tag">Step {currentStep} of 4 &bull; {currentStep * 25}%</span>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="alert-banner alert-error mx-6 mt-3 mb-0">
            <AlertTriangle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* POST-SUBMISSION NOTIFICATION SCREEN (User Notified of Reminder)           */}
        {/* ========================================================================= */}
        {submittedReminderNotice ? (
          <div className="accident-success-view">
            <div className="success-hero-card">
              <div className="success-icon-pulse">
                <CheckCircle2 size={48} className="text-success" />
              </div>
              <h3 className="success-title">Accident Report Lodged Successfully!</h3>
              <p className="success-ref">
                Claim Reference: <strong>{submittedReminderNotice.claimRef}</strong>
              </p>
              <p className="success-subtext">
                Your claim has entered the 10-stage adjudication pipeline with {insurer}.
              </p>

              {/* Connected Reminder Notification Highlight */}
              <div className="reminder-notification-box">
                <div className="flex items-start gap-3">
                  <div className="reminder-bell-ring">
                    <BellRing size={22} className="text-gold" />
                  </div>
                  <div>
                    <span className="reminder-notification-tag">
                      <Clock size={12} /> Scheduled Reminder Connected
                    </span>
                    <h4 className="reminder-notification-title">
                      {submittedReminderNotice.reminderTitle}
                    </h4>
                    <p className="reminder-notification-detail">
                      Scheduled for <strong>{submittedReminderNotice.reminderDate}</strong> at{' '}
                      <strong>{submittedReminderNotice.reminderTime}</strong>
                    </p>
                    <div className="reminder-channel-pill">
                      Channel: <strong>{submittedReminderNotice.channel}</strong> &bull; Notification will be dispatched automatically
                    </div>
                  </div>
                </div>
              </div>

              <div className="success-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={handleFinishNotice}
                >
                  <ShieldCheck size={18} /> Done & Return to Claims Pipeline
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* MAIN 4-STEP FORM BODY                                                     */
          /* ========================================================================= */
          <form onSubmit={handleSubmitReport} className="accident-modal-body">
            {/* STEP 1: Incident & Smart Transcribe Voice */}
            {currentStep === 1 && (
              <div className="step-content">
                <div className="step-intro-banner">
                  <div>
                    <h3 className="step-title">Step 1: Incident Details & Smart Voice Intake</h3>
                    <p className="step-desc">
                      Select insured details and speak or type the incident circumstances. Smart Transcribe automatically eliminates hesitation words ("umm", "uh").
                    </p>
                  </div>
                </div>

                <div className="form-grid grid-cols-3 mb-4">
                  {/* Client */}
                  <div className="form-group">
                    <label className="field-label">Insured Client *</label>
                    <select
                      className="form-input"
                      value={clientId}
                      onChange={(e) => {
                        setClientId(e.target.value);
                        const c = clients.find((x) => x.id === e.target.value);
                        if (c) setDriverName(c.fullName);
                      }}
                      required
                    >
                      <option value="" disabled>Select client...</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.reference})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Underwriting Insurer */}
                  <div className="form-group">
                    <label className="field-label">Short-Term Insurer *</label>
                    <input
                      className="form-input"
                      value={insurer}
                      onChange={(e) => setInsurer(e.target.value)}
                      placeholder="e.g. Santam, Discovery, Old Mutual, Hollard"
                      required
                    />
                  </div>

                  {/* Policy Number */}
                  <div className="form-group">
                    <label className="field-label">Policy Number</label>
                    <input
                      className="form-input font-mono"
                      value={policyNumber}
                      onChange={(e) => setPolicyNumber(e.target.value)}
                      placeholder="POL-99210-ZA"
                    />
                  </div>

                  {/* Incident Date */}
                  <div className="form-group">
                    <label className="field-label">Accident Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={incidentDate}
                      onChange={(e) => setIncidentDate(e.target.value)}
                      required
                    />
                  </div>

                  {/* Incident Time */}
                  <div className="form-group">
                    <label className="field-label">Approximate Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={incidentTime}
                      onChange={(e) => setIncidentTime(e.target.value)}
                    />
                  </div>

                  {/* Vehicle Usage */}
                  <div className="form-group">
                    <label className="field-label">Vehicle Usage *</label>
                    <select
                      className="form-input"
                      value={vehicleUsage}
                      onChange={(e) => setVehicleUsage(e.target.value as any)}
                    >
                      <option value="PERSONAL">Personal & Commuting Use</option>
                      <option value="BUSINESS">Business & Commercial Use</option>
                    </select>
                  </div>
                </div>

                {/* Driver Name */}
                <div className="form-group mb-4">
                  <label className="field-label">Driver at Time of Accident</label>
                  <input
                    className="form-input"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Full name of the person driving the vehicle"
                  />
                </div>

                {/* Gemini Smart Transcribe Hub */}
                <div className={`smart-transcribe-hub ${isListening ? 'listening' : ''}`}>
                  <div className="transcribe-header-row">
                    <div className="flex items-center gap-2">
                      <span className="smart-badge">
                        <Sparkles size={13} className="text-gold" />
                        Gemini Smart Transcribe Live
                      </span>
                      <span className="text-xs text-muted">
                        Active Speech Filter (Automated 'umm', 'uh', 'er' removal)
                      </span>
                    </div>

                    {smartResult && smartResult.removedCount > 0 && (
                      <span className="filter-stat-pill">
                        Filtered {smartResult.removedCount} filler {smartResult.removedCount === 1 ? 'word' : 'words'} ({smartResult.removedWords.slice(0, 3).map((w) => `'${w}'`).join(', ')})
                      </span>
                    )}
                  </div>

                  <div className="transcribe-controls">
                    <button
                      type="button"
                      className={`btn-voice-record ${isListening ? 'recording' : ''}`}
                      onClick={toggleVoiceRecording}
                    >
                      {isListening ? (
                        <>
                          <MicOff size={16} />
                          <span>Stop Recording</span>
                        </>
                      ) : (
                        <>
                          <Mic size={16} />
                          <span>Start Voice Accident Statement</span>
                        </>
                      )}
                    </button>

                    {/* Equalizer Visualizer */}
                    <div className="audio-visualizer-strip">
                      {[0.5, 0.9, 1.2, 0.7, 1.1, 1.4, 0.8, 0.6, 1.0, 0.7].map((mult, idx) => (
                        <span
                          key={idx}
                          className="visualizer-bar"
                          style={{
                            height: `${isListening ? Math.max(4, Math.min(26, volume * mult * 34)) : 4}px`
                          }}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm flex items-center gap-1.5"
                      onClick={handlePolishWithGemini}
                      disabled={isPolishing || !description.trim()}
                      title="Rewrites transcript into professional legal insurance claim language"
                    >
                      {isPolishing ? <Loader2 size={13} className="spin-icon" /> : <Sparkles size={13} className="text-gold" />}
                      <span>{isPolishing ? 'Polishing...' : 'Polish with Gemini'}</span>
                    </button>
                  </div>

                  {/* Spoken feedback stream */}
                  {isListening && (
                    <div className="live-speech-ticker">
                      <span className="pulse-dot" />
                      <span className="text-xs text-muted">Hearing live speech: </span>
                      <span className="text-xs font-mono text-royal">"{rawTranscript || 'Listening...'}"</span>
                    </div>
                  )}

                  {/* Incident Description Textarea */}
                  <div className="form-group mt-3">
                    <div className="field-label-row">
                      <label className="field-label">
                        Accident Description & Circumstances *{' '}
                        <span className="text-danger">(Strictly Required)</span>
                      </label>
                      <span className="text-xs text-muted">
                        {description.length} characters
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      className={`form-input ${!hasDescription ? 'border-warning' : ''}`}
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        setSmartResult(SmartTranscribeService.clean(e.target.value));
                      }}
                      placeholder="Describe what occurred, impact direction, damage details, lane position, other vehicles involved... Or use the voice button above."
                      required
                    />
                    {!hasDescription && (
                      <p className="text-xs text-danger mt-1 flex items-center gap-1">
                        <AlertTriangle size={12} /> The report cannot be submitted without an accident description.
                      </p>
                    )}
                  </div>

                  {/* Quick sample buttons for prompt testing */}
                  <div className="sample-accident-prompts">
                    <span className="text-xs text-muted">Try sample accident voice narrative:</span>
                    <button
                      type="button"
                      className="btn-sample-prompt"
                      onClick={() => {
                        const sample = "Umm, I was driving down Sandton Drive towards Rivonia Road, and uh, the robot was green for me. Suddenly umm, a white Toyota Fortuner skipped the red robot and uh collided with my right front bumper and headlight.";
                        setRawTranscript(sample);
                        const cleaned = SmartTranscribeService.clean(sample);
                        setSmartResult(cleaned);
                        setDescription(cleaned.cleanedText);
                      }}
                    >
                      "Rivonia Rd Intersection T-Bone (with 'umm' & 'uh')"
                    </button>
                    <button
                      type="button"
                      className="btn-sample-prompt"
                      onClick={() => {
                        const sample = "Err, I was stationary at a red traffic light on William Nicol Drive when uh, a delivery bakkie failed to brake in time and umm rear-ended my vehicle, smashing the rear bumper and boot.";
                        setRawTranscript(sample);
                        const cleaned = SmartTranscribeService.clean(sample);
                        setSmartResult(cleaned);
                        setDescription(cleaned.cleanedText);
                      }}
                    >
                      "William Nicol Rear-End Collision"
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Google Maps Location Pinning */}
            {currentStep === 2 && (
              <div className="step-content">
                <div className="step-intro-banner">
                  <div>
                    <h3 className="step-title">Step 2: Pin Exact Accident Scene Location</h3>
                    <p className="step-desc">
                      Use Google Maps to drop a pin at the collision scene, search cross streets, or pinpoint your current GPS position.
                    </p>
                  </div>
                </div>

                {/* Google Maps Interactive Component */}
                <AccidentLocationMap
                  value={pinnedLocation}
                  onChange={(loc) => setPinnedLocation(loc)}
                />

                <div className="form-grid grid-cols-2 mt-4">
                  <div className="form-group">
                    <label className="field-label">Road Surface Condition</label>
                    <select
                      className="form-input"
                      value={roadCondition}
                      onChange={(e) => setRoadCondition(e.target.value)}
                    >
                      <option value="Dry & Tarred">Dry & Tarred</option>
                      <option value="Wet / Rainy">Wet / Rainy</option>
                      <option value="Gravel / Potholes">Gravel / Potholes</option>
                      <option value="Oil Slick / Debris">Oil Slick / Debris</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="field-label">Weather & Visibility</label>
                    <select
                      className="form-input"
                      value={weatherCondition}
                      onChange={(e) => setWeatherCondition(e.target.value)}
                    >
                      <option value="Daylight / Fine">Daylight / Clear</option>
                      <option value="Night / Streetlights Lit">Night / Streetlights Lit</option>
                      <option value="Night / Dark">Night / Dark (Unlit)</option>
                      <option value="Heavy Rain / Mist">Heavy Rain / Mist</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Mandatory Evidence & Documents */}
            {currentStep === 3 && (
              <div className="step-content">
                <div className="step-intro-banner">
                  <div>
                    <h3 className="step-title">Step 3: Evidence, Police Report & Mandatory Documents</h3>
                    <p className="step-desc">
                      Upload photos of the accident scene, vehicle damage, and driver's licence. The claim strictly requires at least one document to proceed.
                    </p>
                  </div>
                </div>

                {/* Strict validation alert if documents missing */}
                {!hasDocuments && (
                  <div className="alert-banner alert-warning mb-4">
                    <AlertTriangle size={18} />
                    <span>
                      <strong>Mandatory Requirement:</strong> You must attach at least one document or photo (Scene photo, licence, or police report).
                    </span>
                  </div>
                )}

                {/* Document Upload Dropzones */}
                <div className="evidence-upload-grid">
                  {/* Card 1: Accident Scene Photos */}
                  <div className="evidence-card">
                    <div className="evidence-card-header">
                      <div className="flex items-center gap-2">
                        <UploadCloud size={18} className="text-gold" />
                        <h4>Scene & Damage Photos</h4>
                      </div>
                      <span className="badge-required">Required</span>
                    </div>
                    <p className="evidence-card-hint">
                      Photos of vehicle damage, road position, licence disc, and third-party cars.
                    </p>
                    <label className="btn-file-upload">
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, 'SCENE_PHOTO')}
                      />
                      <span>+ Upload Scene Photos</span>
                    </label>
                  </div>

                  {/* Card 2: Driver's Licence */}
                  <div className="evidence-card">
                    <div className="evidence-card-header">
                      <div className="flex items-center gap-2">
                        <FileText size={18} className="text-royal" />
                        <h4>Driver's Licence (Card / PDF)</h4>
                      </div>
                      <span className="badge-required">Required</span>
                    </div>
                    <p className="evidence-card-hint">
                      Front and back copy of the authorized driver's valid South African driving licence.
                    </p>
                    <label className="btn-file-upload">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, 'DRIVERS_LICENCE')}
                      />
                      <span>+ Upload Driver's Licence</span>
                    </label>
                  </div>

                  {/* Card 3: Police Report / Station */}
                  <div className="evidence-card">
                    <div className="evidence-card-header">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-success" />
                        <h4>Police Case Report / OAR</h4>
                      </div>
                      <span className="badge-optional">Within 48h</span>
                    </div>
                    <p className="evidence-card-hint">
                      SAPS accident report form (OAR) or case docket slip from the police station.
                    </p>
                    <label className="btn-file-upload">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, 'POLICE_REPORT')}
                      />
                      <span>+ Upload Police Report</span>
                    </label>
                  </div>
                </div>

                {/* Attached Documents List */}
                <div className="uploaded-docs-container mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Attached Documents ({documents.length})
                    </h4>
                    {documents.length === 0 && (
                      <span className="text-xs text-danger font-medium">
                        * Please upload at least one file to satisfy compliance
                      </span>
                    )}
                  </div>

                  {documents.length === 0 ? (
                    <div className="empty-docs-box">
                      <UploadCloud size={24} className="text-muted mb-1" />
                      <p className="text-xs text-muted">
                        No documents attached yet. Click an upload card above or drag and drop files.
                      </p>
                    </div>
                  ) : (
                    <div className="docs-pills-list">
                      {documents.map((doc) => (
                        <div key={doc.id} className="doc-pill-item">
                          <FileText size={14} className="text-gold" />
                          <div className="doc-pill-meta">
                            <span className="doc-name">{doc.name}</span>
                            <span className="doc-sub">
                              {doc.category.replace('_', ' ')} &bull; {doc.size}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="btn-remove-doc"
                            onClick={() => handleRemoveDoc(doc.id)}
                            title="Remove document"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Police & Third Party Details */}
                <div className="form-grid grid-cols-2 mt-4">
                  <div className="form-group">
                    <label className="field-label">Police Station Reported To</label>
                    <input
                      className="form-input"
                      value={policeStation}
                      onChange={(e) => setPoliceStation(e.target.value)}
                      placeholder="e.g. Sandton SAPS, Randburg Police Station"
                    />
                  </div>

                  <div className="form-group">
                    <label className="field-label">Police CAS / Case Docket Number</label>
                    <input
                      className="form-input font-mono"
                      value={policeCaseNumber}
                      onChange={(e) => setPoliceCaseNumber(e.target.value)}
                      placeholder="e.g. CAS 421/09/2026"
                    />
                  </div>

                  <div className="form-group">
                    <label className="field-label">Third-Party Vehicle Registration</label>
                    <input
                      className="form-input font-mono"
                      value={thirdPartyReg}
                      onChange={(e) => setThirdPartyReg(e.target.value)}
                      placeholder="e.g. CA 882-991 or GP plates"
                    />
                  </div>

                  <div className="form-group">
                    <label className="field-label">Third-Party Insurer (If Known)</label>
                    <input
                      className="form-input"
                      value={thirdPartyInsurer}
                      onChange={(e) => setThirdPartyInsurer(e.target.value)}
                      placeholder="e.g. Discovery, OUTsurance, Hollard"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Connected Calendar Reminder & Review */}
            {currentStep === 4 && (
              <div className="step-content">
                <div className="step-intro-banner">
                  <div>
                    <h3 className="step-title">Step 4: Connect Calendar Reminder & Submit</h3>
                    <p className="step-desc">
                      Schedule an automatic calendar reminder for critical next steps (e.g. SAPS police reporting or vehicle assessor inspection). At submission, you will be notified of the reminder.
                    </p>
                  </div>
                </div>

                {/* Connected Calendar Reminder Scheduler Card */}
                <div className="calendar-reminder-card">
                  <div className="card-top-header">
                    <div className="flex items-center gap-2">
                      <div className="calendar-icon-badge">
                        <CalendarIcon size={18} className="text-gold" />
                      </div>
                      <div>
                        <h4 className="card-title">Schedule Follow-up Reminder</h4>
                        <p className="card-desc">
                          Automatically synchronizes to your advisory calendar and dispatches notifications.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="form-grid grid-cols-2 mt-3">
                    <div className="form-group span-full">
                      <label className="field-label">Reminder Objective / Task *</label>
                      <select
                        className="form-input"
                        value={reminderTitle}
                        onChange={(e) => setReminderTitle(e.target.value)}
                      >
                        <option value="Report to SAPS Police Station within 48h">
                          Report to SAPS Police Station within 48h (Mandatory Legal Requirement)
                        </option>
                        <option value="Vehicle Assessment Appointment at Approved Center">
                          Vehicle Assessment Appointment at Approved Center
                        </option>
                        <option value="Confirm Courtesy Car Delivery from Europcar/Avis">
                          Confirm Courtesy Car Delivery from Europcar/Avis
                        </option>
                        <option value="Follow up on Insurer Assessment Authorisation">
                          Follow up on Insurer Assessment Authorisation
                        </option>
                        <option value="Custom Reminder">Custom Task...</option>
                      </select>
                    </div>

                    {reminderTitle === 'Custom Reminder' && (
                      <div className="form-group span-full">
                        <label className="field-label">Custom Reminder Note</label>
                        <input
                          className="form-input"
                          onChange={(e) => setReminderTitle(e.target.value)}
                          placeholder="Enter reminder details..."
                        />
                      </div>
                    )}

                    <div className="form-group">
                      <label className="field-label">Reminder Date *</label>
                      <input
                        type="date"
                        className="form-input"
                        value={reminderDate}
                        onChange={(e) => setReminderDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="field-label">Reminder Time</label>
                      <input
                        type="time"
                        className="form-input"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group span-full">
                      <label className="field-label">Notification Dispatch Channel</label>
                      <div className="channel-select-pills">
                        {(['SMS', 'EMAIL', 'CALENDAR'] as const).map((ch) => (
                          <button
                            key={ch}
                            type="button"
                            className={`channel-pill ${reminderChannel === ch ? 'active' : ''}`}
                            onClick={() => setReminderChannel(ch)}
                          >
                            {ch === 'SMS' && '📱 SMS Message'}
                            {ch === 'EMAIL' && '✉️ Email Alert'}
                            {ch === 'CALENDAR' && '📅 Calendar Notification'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final Review Summary Card */}
                <div className="claim-review-card mt-4">
                  <h4 className="review-heading">Accident Claim Pre-Submission Summary</h4>

                  <div className="review-details-grid">
                    <div className="review-col">
                      <span className="review-label">Insured Client</span>
                      <p className="review-val">
                        {clients.find((c) => c.id === clientId)?.fullName || 'Selected Client'}
                      </p>
                    </div>
                    <div className="review-col">
                      <span className="review-label">Underwriter</span>
                      <p className="review-val">{insurer} ({policyNumber})</p>
                    </div>
                    <div className="review-col">
                      <span className="review-label">Accident Date/Time</span>
                      <p className="review-val">{incidentDate} at {incidentTime}</p>
                    </div>
                    <div className="review-col">
                      <span className="review-label">Scene Location</span>
                      <p className="review-val">
                        {pinnedLocation?.address || 'Pinned via GPS'}
                      </p>
                    </div>
                    <div className="review-col span-full">
                      <span className="review-label">Verified Smart Transcript</span>
                      <p className="review-val-desc">"{description}"</p>
                    </div>
                    <div className="review-col span-full">
                      <span className="review-label">Attached Documents ({documents.length})</span>
                      <div className="flex gap-2 flex-wrap mt-1">
                        {documents.map((d) => (
                          <span key={d.id} className="badge-doc-chip">
                            <CheckCircle2 size={11} className="text-success" />
                            {d.name} ({d.category.replace('_', ' ')})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Bottom Footer Navigation */}
            <div className="accident-modal-footer">
              <div className="footer-left">
                {currentStep > 1 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                    disabled={isSubmitting}
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                )}
              </div>

              <div className="footer-right flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                {currentStep < 4 ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleNextStep}
                  >
                    <span>Next: {currentStep === 1 ? 'Location Map' : currentStep === 2 ? 'Upload Documents' : 'Calendar & Review'}</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn btn-primary btn-submit-claim"
                    disabled={isSubmitting || !canProceedToReview}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="spin-icon" /> Submitting & Scheduling...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} /> Submit Accident Report & Set Reminder
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
