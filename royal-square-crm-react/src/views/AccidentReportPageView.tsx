import React, { useState, useEffect } from 'react';
import {
  Car,
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
  FileCheck,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Printer,
  Users,
  ShieldAlert,
  UserCheck,
  Plus
} from 'lucide-react';
import { liveTranscribeService } from '../services/geminiLiveService';
import { SmartTranscribeService, SmartTranscribeResult } from '../services/smartTranscribe';
import { AccidentLocationMap, PinnedLocation } from '../components/maps/AccidentLocationMap';
import { CalendarReminderService } from '../services/reminderService';
import { secureFetch } from '../services/api';
import { MockProviderApiService } from '../services/mockProviderApi';
import { CURRENT_CLIENT_MOCK } from '../client/mockClientData';

interface UploadedPhoto {
  id: string;
  name: string;
  size: string;
  category: 'VEHICLE_DAMAGE' | 'THIRD_PARTY_SCENE' | 'DRIVERS_LICENCE';
  previewUrl: string;
}

interface WitnessEntry {
  id: string;
  fullName: string;
  phone: string;
  statementTaken: boolean;
  statementNotes: string;
}

interface OtherPartyDetails {
  involved: boolean;
  driverName: string;
  driverPhone: string;
  driverLicenceNumber: string;
  vehicleRegistration: string;
  vehicleMakeModel: string;
  insurer: string;
  policyNumber: string;
  driverStatement: string;
}

interface AccidentReportPageViewProps {
  onBackToDashboard: () => void;
}

export const AccidentReportPageView: React.FC<AccidentReportPageViewProps> = ({ onBackToDashboard }) => {
  const client = CURRENT_CLIENT_MOCK;

  // Step state (6 clean steps):
  // 1: What Happened
  // 2: Scene Location
  // 3: Other Party Details (Interested Party)
  // 4: Witness Details (Neutral Evidence)
  // 5: Photo Evidence
  // 6: SAPS & Review
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Voice & Narrative
  const [narrative, setNarrative] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [rawTranscript, setRawTranscript] = useState<string>('');
  const [smartResult, setSmartResult] = useState<SmartTranscribeResult | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const [isPolishing, setIsPolishing] = useState<boolean>(false);

  // Step 2: Location
  const [location, setLocation] = useState<PinnedLocation | null>({
    address: 'Sandton City, Cnr Rivonia Rd & 5th St, Sandton, 2196',
    street: 'Rivonia Rd',
    suburb: 'Sandhurst',
    city: 'Johannesburg',
    lat: -26.1076,
    lng: 28.0567
  });

  // Step 3: Other Involved Party (Interested Party Account)
  const [otherParty, setOtherParty] = useState<OtherPartyDetails>({
    involved: true,
    driverName: 'Sipho Khumalo',
    driverPhone: '+27 83 291 8841',
    driverLicenceNumber: 'KHUMAS8401829',
    vehicleRegistration: 'CA 749-812',
    vehicleMakeModel: 'Toyota Hilux 2.8 GD-6',
    insurer: 'Discovery Insure',
    policyNumber: 'DISC-POL-849201',
    driverStatement: 'Driver indicated he was braking on wet surface and slipped into our rear bumper.'
  });

  // Step 4: Witness Details (Neutral Evidence)
  const [hasWitness, setHasWitness] = useState<boolean>(true);
  const [witnesses, setWitnesses] = useState<WitnessEntry[]>([
    {
      id: 'wit-1',
      fullName: 'Brian Van Der Merwe',
      phone: '+27 82 491 0029',
      statementTaken: true,
      statementNotes: 'Witness saw the Toyota bakkie fail to brake in time while the BMW was stationary at the red traffic light.'
    }
  ]);

  // Step 5: Photo Evidence
  const [photos, setPhotos] = useState<UploadedPhoto[]>([
    {
      id: 'doc-init-1',
      name: 'Damaged Front Bumper & Headlamp.jpg',
      size: '2.4 MB',
      category: 'VEHICLE_DAMAGE',
      previewUrl: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=300&q=80'
    }
  ]);

  // Step 6: SAPS Case Number (If added, removes 48h reminder!)
  const [policeCaseNumber, setPoliceCaseNumber] = useState<string>('');
  const [policeStation, setPoliceStation] = useState<string>('Sandton SAPS');
  const [reminderDate, setReminderDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2); // 48-hour statutory window
    return d.toISOString().split('T')[0];
  });
  const [reminderChannel, setReminderChannel] = useState<'SMS' | 'CALENDAR'>('SMS');

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedClaim, setSubmittedClaim] = useState<{
    reference: string;
    submittedAt: string;
    hasPoliceCase: boolean;
    policeCaseNumber?: string;
    reminderDate?: string;
    channel?: string;
  } | null>(null);

  // Stop microphone if user unmounts while recording
  useEffect(() => {
    return () => {
      if (isListening) {
        liveTranscribeService.stop();
      }
    };
  }, [isListening]);

  // Voice recording toggle
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

  // AI Polish with Gemini
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

  const applyQuickScenario = (text: string) => {
    if (!narrative.trim()) {
      setNarrative(text);
    } else {
      setNarrative((prev) => `${prev.trim()} ${text}`);
    }
  };

  const handleSimulateUpload = (category: UploadedPhoto['category']) => {
    const labels = {
      VEHICLE_DAMAGE: 'Vehicle Damage Photo',
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

  const handleAddWitness = () => {
    const newWitness: WitnessEntry = {
      id: `wit-${Date.now()}`,
      fullName: '',
      phone: '',
      statementTaken: false,
      statementNotes: ''
    };
    setWitnesses((prev) => [...prev, newWitness]);
  };

  const handleUpdateWitness = (id: string, updates: Partial<WitnessEntry>) => {
    setWitnesses((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  };

  const handleRemoveWitness = (id: string) => {
    setWitnesses((prev) => prev.filter((w) => w.id !== id));
  };

  // Validation
  const hasNarrative = narrative.trim().length >= 8;
  const hasPhotos = photos.length > 0;
  const hasCaseNumber = Boolean(policeCaseNumber.trim());

  // Final Claim Submission
  const handleSubmitClaim = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const generatedRef = `CLM-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      const claimPayload = {
        reference: generatedRef,
        clientId: client.id,
        clientName: client.fullName,
        policyNumber: client.insuredVehicle.policyNumber,
        insurer: client.insuredVehicle.insurer,
        vehicleReg: client.insuredVehicle.registration,
        incidentDate: new Date().toISOString().split('T')[0],
        description: narrative,
        policeCaseNumber: policeCaseNumber.trim() || undefined,
        policeStation: policeCaseNumber.trim() ? policeStation : undefined,
        location: location || {
          address: 'Sandton City, Johannesburg',
          lat: -26.1076,
          lng: 28.0567
        },
        otherParty: otherParty.involved ? otherParty : undefined,
        witnesses: hasWitness ? witnesses.filter((w) => w.fullName.trim()) : [],
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

      // Transmit to mock provider integration log in real-time
      try {
        const pName = (client.insuredVehicle.insurer.includes('Old Mutual') ? 'Old Mutual' : client.insuredVehicle.insurer.includes('Discovery') ? 'Discovery' : client.insuredVehicle.insurer.includes('Sanlam') ? 'Sanlam' : 'Santam') as any;
        await MockProviderApiService.submitClaimToProvider(undefined, pName, {
          claim_id: generatedRef,
          client_name: client.fullName,
          client_reference: client.id,
          policy_number: client.insuredVehicle.policyNumber
        });
      } catch (err) {
        console.warn('Provider dispatch error', err);
      }

      // ONLY schedule 48h reminder if police case number is NOT already provided!
      if (!hasCaseNumber) {
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
      }

      setSubmittedClaim({
        reference: generatedRef,
        submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasPoliceCase: hasCaseNumber,
        policeCaseNumber: policeCaseNumber.trim(),
        reminderDate: !hasCaseNumber ? reminderDate : undefined,
        channel: !hasCaseNumber ? reminderChannel : undefined
      });
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit claim. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // POST-SUBMIT SUCCESS SCREEN
  if (submittedClaim) {
    return (
      <div className="min-h-screen bg-slate-50/70 text-slate-800 p-4 md:p-8 font-sans">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-10 space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mb-2">
              <CheckCircle2 size={44} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Accident Claim Successfully Logged
            </h1>
            <p className="text-slate-600 max-w-md mx-auto text-sm">
              Your claim has been registered with <strong>{client.insuredVehicle.insurer}</strong> and assigned to your dedicated advisor <strong>{client.advisor.name}</strong>.
            </p>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 text-center space-y-1">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Official Claim Reference Number
            </span>
            <div className="text-3xl font-extrabold tracking-tight text-amber-400 font-mono">
              {submittedClaim.reference}
            </div>
            <p className="text-xs text-slate-300">
              Submitted at {submittedClaim.submittedAt} SAST &bull; Quote this reference in all correspondence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">Insured Vehicle</span>
              <p className="font-bold text-slate-900">{client.insuredVehicle.year} {client.insuredVehicle.make} {client.insuredVehicle.model}</p>
              <p className="font-mono text-xs text-slate-600">Plate: {client.insuredVehicle.registration}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">SAPS Reporting Status</span>
              {submittedClaim.hasPoliceCase ? (
                <div>
                  <p className="font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 size={15} /> Police Case Recorded: {submittedClaim.policeCaseNumber}
                  </p>
                  <p className="text-xs text-slate-500">No further 48h police reporting reminder required.</p>
                </div>
              ) : (
                <div>
                  <p className="font-bold text-amber-700">Scheduled for {submittedClaim.reminderDate}</p>
                  <p className="text-xs text-slate-600">Reminder via {submittedClaim.channel} &bull; 48h SA legal window</p>
                </div>
              )}
            </div>
          </div>

          {/* Emergency Dispatch Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
            <PhoneCall size={26} className="text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-slate-900">Need Immediate Roadside Towing?</h4>
              <p className="text-xs text-slate-600">
                Call Santam 24/7 Emergency Dispatch at <a href="tel:0800111222" className="font-bold text-slate-900 underline">0800 111 222</a> (Toll-free across South Africa).
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Return to Portfolio Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold px-5 py-3 rounded-xl text-sm border border-slate-200 transition cursor-pointer"
            >
              <Printer size={16} />
              <span>Print Claim Receipt</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 p-4 md:p-8 font-sans antialiased">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Header & Back Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
              title="Return to the client portfolio overview"
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>
            <div>
              <h1 className="text-base md:text-lg font-bold text-slate-900 leading-tight">
                Report Motor Accident
              </h1>
              <span className="text-xs text-slate-500">
                Step-by-step guided incident intake &bull; Pre-loaded policy
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:0800111222"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl hover:bg-rose-100 transition"
              title="24/7 Santam Emergency Towing"
            >
              <PhoneCall size={13} />
              <span>Emergency 0800 111 222</span>
            </a>
          </div>
        </div>

        {/* Pre-loaded Assumed Vehicle Info Strip */}
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Car size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-slate-900 text-sm">{client.insuredVehicle.year} {client.insuredVehicle.make} {client.insuredVehicle.model}</strong>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded-full text-[11px]">Cover Active</span>
              </div>
              <p className="text-slate-600">
                Plate: <strong className="font-mono text-slate-800">{client.insuredVehicle.registration}</strong> &bull; {client.insuredVehicle.insurer} &bull; Policy #{client.insuredVehicle.policyNumber}
              </p>
            </div>
          </div>
          <span className="text-indigo-700 font-medium flex items-center gap-1">
            <ShieldCheck size={14} className="text-indigo-600" /> Account details pre-loaded. No redundant forms.
          </span>
        </div>

        {/* Step Wizard Progress Bar (6 steps) */}
        <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
            {[
              { num: 1, label: '1. Narrative' },
              { num: 2, label: '2. Location' },
              { num: 3, label: '3. Other Party' },
              { num: 4, label: '4. Witnesses' },
              { num: 5, label: '5. Photos' },
              { num: 6, label: '6. SAPS & Submit' }
            ].map((s) => {
              const isCurrent = currentStep === s.num;
              const isPast = currentStep > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setCurrentStep(s.num)}
                  className={`p-2 rounded-xl transition flex flex-col items-center gap-0.5 cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-900 text-white font-bold shadow-sm'
                      : isPast
                      ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                      : 'bg-slate-50 text-slate-400 font-medium'
                  }`}
                >
                  <span className="truncate max-w-full">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 1: WHAT HAPPENED (VOICE & TEXT) */}
        {currentStep === 1 && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">1</span>
                <h2 className="text-lg font-bold text-slate-900">What happened?</h2>
              </div>
              <p className="text-xs text-slate-500">
                Speak naturally or type. Describe the point of impact, road conditions, speed, and immediate consequences.
              </p>
            </div>

            {/* Voice Control Bar */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition cursor-pointer ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse shadow-md'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  <span>{isListening ? 'Stop Recording' : 'Tap to Speak What Happened'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePolishWithGemini}
                  disabled={isPolishing || !narrative.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold border border-indigo-200 disabled:opacity-50 transition cursor-pointer"
                  title="Polish voice transcript into insurance-grade wording"
                >
                  {isPolishing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-indigo-600" />}
                  <span>{isPolishing ? 'Polishing statement...' : 'Polish with AI'}</span>
                </button>
              </div>

              {/* Speech volume wave */}
              {isListening && (
                <div className="flex items-center gap-3 pt-2 text-xs text-rose-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                  <span>Listening live: "{rawTranscript || 'Speak now...'}"</span>
                  <div className="flex items-center gap-1 ml-auto" aria-hidden="true">
                    {[0.5, 1.2, 0.8, 1.5, 0.9, 1.3, 0.6].map((multiplier, i) => (
                      <span
                        key={i}
                        className="w-1 bg-rose-500 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(4, Math.min(24, (volume || 0.4) * multiplier * 20))}px` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {smartResult && smartResult.removedCount > 0 && (
                <div className="text-[11px] text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                  <Sparkles size={12} />
                  <span>Filtered {smartResult.removedCount} filler words ('um' / 'uh') automatically.</span>
                </div>
              )}
            </div>

            {/* Description Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="narrative" className="text-xs font-semibold text-slate-700">
                  Incident Statement & Essential Details:
                </label>
                <span className="text-[11px] text-slate-400">Include collision point & speed if known</span>
              </div>
              <textarea
                id="narrative"
                rows={5}
                value={narrative}
                onChange={(e) => {
                  setNarrative(e.target.value);
                  setSmartResult(SmartTranscribeService.clean(e.target.value));
                }}
                placeholder="e.g. While stopped at the red traffic light on Rivonia Road heading North, our BMW X5 was impacted from the rear by a silver bakkie. Road was damp from rain. Both drivers pulled over safely..."
                className="w-full p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-500">Quick accident templates (tap to insert):</span>
              <div className="flex flex-wrap gap-2">
                {[
                  'Rear-ended at red traffic light.',
                  'Sideswiped in parking bay while parked.',
                  'Windscreen cracked by highway stone chip.',
                  'Severe pothole caused tire puncture and rim buckle.'
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => applyQuickScenario(chip)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 1 Footer */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={!hasNarrative}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl text-sm transition cursor-pointer"
              >
                <span>Next: Scene Location</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SCENE LOCATION */}
        {currentStep === 2 && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">2</span>
                <h2 className="text-lg font-bold text-slate-900">Where did it happen?</h2>
              </div>
              <p className="text-xs text-slate-500">
                Pin the collision point on Google Maps or verify the closest intersection.
              </p>
            </div>

            {/* Map Container */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
              <AccidentLocationMap
                value={location}
                onChange={(loc) => setLocation(loc)}
              />
            </div>

            {/* Selected Address Pill */}
            {location && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3 text-xs">
                <MapPin size={18} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="text-slate-900 text-sm block">{location.address}</strong>
                  <span className="text-slate-500 font-mono">
                    GPS Coordinates: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                  </span>
                </div>
              </div>
            )}

            {/* Step 2 Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>Back to Narrative</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition cursor-pointer"
              >
                <span>Next: Other Party Details</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: OTHER PARTY DETAILS (INTERESTED PARTY ACCOUNT) */}
        {currentStep === 3 && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">3</span>
                <h2 className="text-lg font-bold text-slate-900">Other Involved Driver & Vehicle</h2>
              </div>
              <p className="text-xs text-slate-500">
                Record the third-party vehicle details, their insurer, and their driver's version of the incident.
              </p>
            </div>

            {/* Question: Was another vehicle involved? */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
              <div>
                <strong className="text-sm text-slate-900 block">Was another vehicle or third party involved?</strong>
                <span className="text-xs text-slate-500">e.g. Another car, delivery motorcycle, or pedestrian.</span>
              </div>
              <div className="inline-flex rounded-xl border border-slate-300 p-1 bg-white">
                <button
                  type="button"
                  onClick={() => setOtherParty((prev) => ({ ...prev, involved: true }))}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    otherParty.involved ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setOtherParty((prev) => ({ ...prev, involved: false }))}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    !otherParty.involved ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  No (Single Vehicle)
                </button>
              </div>
            </div>

            {otherParty.involved ? (
              <div className="space-y-5">
                {/* Regulatory Notice Banner for Interested Party */}
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                  <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <strong>Interested Party Account Notice:</strong>
                    <p className="text-[11px] text-amber-800">
                      The other driver is an interested party. Their details and statement are recorded for inter-insurer knock-for-knock arbitration and third-party recovery, and are <strong>not treated as neutral evidence</strong>.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Other Driver's Full Name:</label>
                    <input
                      value={otherParty.driverName}
                      onChange={(e) => setOtherParty({ ...otherParty, driverName: e.target.value })}
                      placeholder="e.g. Sipho Khumalo"
                      className="w-full p-3 rounded-xl border border-slate-300 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Other Driver's Phone Number:</label>
                    <input
                      value={otherParty.driverPhone}
                      onChange={(e) => setOtherParty({ ...otherParty, driverPhone: e.target.value })}
                      placeholder="e.g. +27 83 000 0000"
                      className="w-full p-3 rounded-xl border border-slate-300 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Other Driver's Licence Code / ID:</label>
                    <input
                      value={otherParty.driverLicenceNumber}
                      onChange={(e) => setOtherParty({ ...otherParty, driverLicenceNumber: e.target.value })}
                      placeholder="e.g. Code 08 / ID number"
                      className="w-full p-3 rounded-xl border border-slate-300 font-mono text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Other Vehicle Registration Plate:</label>
                    <input
                      value={otherParty.vehicleRegistration}
                      onChange={(e) => setOtherParty({ ...otherParty, vehicleRegistration: e.target.value.toUpperCase() })}
                      placeholder="e.g. CA 882-991 or GP plates"
                      className="w-full p-3 rounded-xl border border-slate-300 font-mono uppercase text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Other Vehicle Make & Model:</label>
                    <input
                      value={otherParty.vehicleMakeModel}
                      onChange={(e) => setOtherParty({ ...otherParty, vehicleMakeModel: e.target.value })}
                      placeholder="e.g. Toyota Hilux / VW Polo"
                      className="w-full p-3 rounded-xl border border-slate-300 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Other Party's Insurer:</label>
                    <input
                      value={otherParty.insurer}
                      onChange={(e) => setOtherParty({ ...otherParty, insurer: e.target.value })}
                      placeholder="e.g. Discovery Insure / OUTsurance / Santam / Uninsured"
                      className="w-full p-3 rounded-xl border border-slate-300 text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-semibold text-slate-700">Other Party's Policy Number (if provided):</label>
                    <input
                      value={otherParty.policyNumber}
                      onChange={(e) => setOtherParty({ ...otherParty, policyNumber: e.target.value })}
                      placeholder="e.g. POL-994821 or Unknown"
                      className="w-full p-3 rounded-xl border border-slate-300 font-mono text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-slate-700">Other Driver's Account / Version:</label>
                      <span className="text-[11px] text-amber-700 font-medium">Interested Party Account</span>
                    </div>
                    <textarea
                      rows={3}
                      value={otherParty.driverStatement}
                      onChange={(e) => setOtherParty({ ...otherParty, driverStatement: e.target.value })}
                      placeholder="e.g. Driver claimed his brakes locked on the wet road surface..."
                      className="w-full p-3 rounded-xl border border-slate-300 text-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                <Car size={32} className="mx-auto text-slate-400" />
                <h4 className="font-bold text-slate-800 text-sm">Single Vehicle Incident</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No other driver or third-party vehicle involved. Your claim will be processed under comprehensive own-damage cover.
                </p>
              </div>
            )}

            {/* Step 3 Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>Back to Location</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition cursor-pointer"
              >
                <span>Next: Witness Details</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: WITNESSES (NEUTRAL EVIDENCE) */}
        {currentStep === 4 && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">4</span>
                <h2 className="text-lg font-bold text-slate-900">Independent Witnesses</h2>
              </div>
              <p className="text-xs text-slate-500">
                Independent, neutral witnesses strengthen your claim and eliminate liability disputes.
              </p>
            </div>

            {/* Primary Question: Was there a witness? */}
            <div className="p-5 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Was there an independent witness?</h3>
                  <p className="text-xs text-slate-600">e.g. Bystander, security guard, or another motorist who saw the collision.</p>
                </div>
              </div>

              <div className="inline-flex rounded-xl border border-indigo-200 p-1 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setHasWitness(true);
                    if (witnesses.length === 0) handleAddWitness();
                  }}
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    hasWitness ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Yes, there was a witness
                </button>
                <button
                  type="button"
                  onClick={() => setHasWitness(false)}
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                    !hasWitness ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  No witnesses
                </button>
              </div>
            </div>

            {hasWitness ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Witness List ({witnesses.length}) &bull; Neutral Third-Party Evidence
                  </span>
                  <button
                    type="button"
                    onClick={handleAddWitness}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Another Witness</span>
                  </button>
                </div>

                {witnesses.map((w, idx) => (
                  <div key={w.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <UserCheck size={16} className="text-indigo-600" /> Witness #{idx + 1}
                      </span>
                      {witnesses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveWitness(w.id)}
                          className="text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Witness Full Name:</label>
                        <input
                          value={w.fullName}
                          onChange={(e) => handleUpdateWitness(w.id, { fullName: e.target.value })}
                          placeholder="e.g. Brian Van Der Merwe"
                          className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-slate-700">Witness Contact Number:</label>
                        <input
                          value={w.phone}
                          onChange={(e) => handleUpdateWitness(w.id, { phone: e.target.value })}
                          placeholder="e.g. +27 82 000 0000"
                          className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white"
                        />
                      </div>

                      {/* Question: Was a statement taken? */}
                      <div className="sm:col-span-2 space-y-1">
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                          <div>
                            <strong className="text-slate-900 block">Was a written or recorded statement taken?</strong>
                            <span className="text-[11px] text-slate-500">Did the witness provide a statement at the scene or to SAPS?</span>
                          </div>
                          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-50">
                            <button
                              type="button"
                              onClick={() => handleUpdateWitness(w.id, { statementTaken: true })}
                              className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                                w.statementTaken ? 'bg-emerald-600 text-white shadow' : 'text-slate-600'
                              }`}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateWitness(w.id, { statementTaken: false })}
                              className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                                !w.statementTaken ? 'bg-slate-700 text-white shadow' : 'text-slate-600'
                              }`}
                            >
                              No
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="font-semibold text-slate-700">Witness Observation / Statement Notes:</label>
                        <textarea
                          rows={2}
                          value={w.statementNotes}
                          onChange={(e) => handleUpdateWitness(w.id, { statementNotes: e.target.value })}
                          placeholder="e.g. Witness confirmed BMW was stopped at red light when Toyota bakkie slid into rear..."
                          className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                <UserCheck size={32} className="mx-auto text-slate-400" />
                <h4 className="font-bold text-slate-800 text-sm">No Neutral Witnesses</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No independent third-party witnesses recorded. The assessment will rely on physical damage evidence, telematics, and police reports.
                </p>
              </div>
            )}

            {/* Step 4 Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>Back to Other Party</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition cursor-pointer"
              >
                <span>Next: Photo Evidence</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: PHOTOS & EVIDENCE */}
        {currentStep === 5 && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">5</span>
                <h2 className="text-lg font-bold text-slate-900">Photos & Scene Evidence</h2>
              </div>
              <p className="text-xs text-slate-500">
                Snap damage photos of your vehicle, the third-party vehicle, and the scene. Mandatory for fast-tracked assessor sign-off.
              </p>
            </div>

            {/* Upload Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleSimulateUpload('VEHICLE_DAMAGE')}
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition flex flex-col justify-between gap-2 cursor-pointer"
              >
                <Camera size={24} className="text-indigo-600" />
                <div>
                  <strong className="text-xs font-bold text-slate-900 block">Vehicle Damage Photo</strong>
                  <span className="text-[11px] text-slate-500">+ Tap to attach photo</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateUpload('THIRD_PARTY_SCENE')}
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition flex flex-col justify-between gap-2 cursor-pointer"
              >
                <UploadCloud size={24} className="text-amber-600" />
                <div>
                  <strong className="text-xs font-bold text-slate-900 block">Scene / Other Car</strong>
                  <span className="text-[11px] text-slate-500">+ Tap to attach scene</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateUpload('DRIVERS_LICENCE')}
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition flex flex-col justify-between gap-2 cursor-pointer"
              >
                <FileCheck size={24} className="text-emerald-600" />
                <div>
                  <strong className="text-xs font-bold text-slate-900 block">Driver's Licence Card</strong>
                  <span className="text-[11px] text-slate-500">+ Tap to attach card</span>
                </div>
              </button>
            </div>

            {/* Attached Photos List */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Attached Evidence ({photos.length})
              </span>

              {photos.length === 0 ? (
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>Please attach at least 1 photo above before proceeding.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {photos.map((p) => (
                    <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img src={p.previewUrl} alt={p.name} className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 truncate max-w-[180px]">{p.name}</p>
                          <span className="text-[11px] text-slate-500">{p.size}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 5 Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>Back to Witnesses</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(6)}
                disabled={!hasPhotos}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-semibold px-6 py-3 rounded-xl text-sm transition cursor-pointer"
              >
                <span>Next: SAPS & Review</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: POLICE DOCKET (CASE NUMBER) & FINAL SUBMIT */}
        {currentStep === 6 && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">6</span>
                <h2 className="text-lg font-bold text-slate-900">Police Docket & Review</h2>
              </div>
              <p className="text-xs text-slate-500">
                Add your SAPS Case / Docket Number if already reported, or schedule an automatic 48-hour reminder.
              </p>
            </div>

            {/* SAPS Case Docket Input Section */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">SAPS Police Case / CAS Number</h3>
                  <p className="text-xs text-slate-500">
                    If you already reported this accident to SAPS, enter the docket reference below.
                  </p>
                </div>
                {hasCaseNumber && (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1">
                    <CheckCircle2 size={13} /> 48h Requirement Satisfied
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label htmlFor="case-number" className="font-semibold text-slate-700 block">
                    Police Case / CAS Number (Optional):
                  </label>
                  <input
                    id="case-number"
                    value={policeCaseNumber}
                    onChange={(e) => setPoliceCaseNumber(e.target.value)}
                    placeholder="e.g. CAS 382/09/2026"
                    className="w-full p-3 rounded-xl border border-slate-300 font-mono text-sm uppercase text-slate-900 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="police-station" className="font-semibold text-slate-700 block">
                    Police Station:
                  </label>
                  <input
                    id="police-station"
                    value={policeStation}
                    onChange={(e) => setPoliceStation(e.target.value)}
                    placeholder="e.g. Sandton SAPS"
                    className="w-full p-3 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* Conditional Reminder logic: If case number is provided, remove reminder! */}
              {hasCaseNumber ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Police Case Docket Logged:</strong>
                    <p className="text-[11px] text-emerald-700">
                      Since your SAPS Case Number ({policeCaseNumber}) has been recorded, the 48-hour reminder has been automatically removed. Your reporting legal requirement is completed.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Clock size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <strong className="text-xs text-slate-900">48-Hour Police Docket Reminder Active</strong>
                      <p className="text-[11px] text-slate-600">
                        South African law requires motor accidents to be reported to SAPS within 24–48 hours. Since no case number was entered yet, we will send you a prompt:
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                    <div className="space-y-1">
                      <span className="font-semibold text-slate-700 block">Reminder Date:</span>
                      <input
                        type="date"
                        value={reminderDate}
                        onChange={(e) => setReminderDate(e.target.value)}
                        className="p-2 rounded-xl border border-amber-300 bg-white text-xs font-medium text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="font-semibold text-slate-700 block">Delivery Channel:</span>
                      <div className="inline-flex rounded-xl border border-amber-300 p-0.5 bg-white">
                        <button
                          type="button"
                          onClick={() => setReminderChannel('SMS')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            reminderChannel === 'SMS' ? 'bg-amber-600 text-white shadow' : 'text-slate-600'
                          }`}
                        >
                          SMS Alert
                        </button>
                        <button
                          type="button"
                          onClick={() => setReminderChannel('CALENDAR')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            reminderChannel === 'CALENDAR' ? 'bg-amber-600 text-white shadow' : 'text-slate-600'
                          }`}
                        >
                          Calendar Event
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Comprehensive Review Card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 text-xs">
              <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                Claim Overview Summary
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-slate-500 uppercase block">Client & Vehicle</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{client.fullName}</p>
                  <p className="text-slate-600">{client.insuredVehicle.year} {client.insuredVehicle.make} {client.insuredVehicle.model} ({client.insuredVehicle.registration})</p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase block">Underwriting Policy</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{client.insuredVehicle.insurer}</p>
                  <p className="font-mono text-slate-600">Policy #{client.insuredVehicle.policyNumber} &bull; Standard Excess R {client.insuredVehicle.excessAmount}</p>
                </div>

                <div className="sm:col-span-2">
                  <span className="font-semibold text-slate-500 uppercase block">Incident Description</span>
                  <p className="text-slate-800 mt-1 bg-white p-3 rounded-xl border border-slate-200/80">
                    {narrative || 'Collision reported by client.'}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase block">Other Party Involved</span>
                  <p className="text-slate-800 font-medium mt-0.5">
                    {otherParty.involved ? `${otherParty.driverName} (${otherParty.vehicleRegistration}) • ${otherParty.insurer}` : 'None (Single Vehicle)'}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase block">Neutral Witnesses</span>
                  <p className="text-slate-800 font-medium mt-0.5">
                    {hasWitness && witnesses.length > 0 ? `${witnesses.length} Witness(es) recorded` : 'No independent witnesses'}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase block">Evidence Attached</span>
                  <p className="text-slate-800 font-medium mt-0.5">{photos.length} photo(s) attached</p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase block">SAPS Case Status</span>
                  <p className="text-slate-800 font-medium mt-0.5">
                    {hasCaseNumber ? `CAS ${policeCaseNumber} (${policeStation})` : `Pending 48h follow-up (${reminderDate})`}
                  </p>
                </div>
              </div>
            </div>

            {submitError && (
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{submitError}</span>
              </div>
            )}

            {/* Step 6 Footer / Final Submit */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>Back to Photos</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitClaim}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-3.5 rounded-xl text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Submitting to Santam...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Confirm & Submit Accident Claim</span>
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
