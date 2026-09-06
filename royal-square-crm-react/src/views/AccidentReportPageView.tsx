import React, { useState, useEffect, useRef } from 'react';
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
  UserCheck,
  Plus,
  History,
  PenTool,
  RotateCcw,
  Building,
  Check
} from 'lucide-react';
import { liveTranscribeService } from '../services/geminiLiveService';
import { SmartTranscribeService, SmartTranscribeResult } from '../services/smartTranscribe';
import { AccidentLocationMap, PinnedLocation } from '../components/maps/AccidentLocationMap';
import { CalendarReminderService } from '../services/reminderService';
import { secureFetch } from '../services/api';
import { MockProviderApiService } from '../services/mockProviderApi';
import { CURRENT_CLIENT_MOCK } from '../client/mockClientData';

export type PhotoCategory =
  | 'ALL_VEHICLES'
  | 'VEHICLE_DAMAGE'
  | 'ROAD_SURFACE'
  | 'REGISTRATION_DISCS'
  | 'DRIVERS_LICENCE'
  | 'ACCIDENT_SKETCH';

interface UploadedPhoto {
  id: string;
  name: string;
  size: string;
  category: PhotoCategory;
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
  policeCaseNumber: string;
  statementTaken: boolean;
  driverStatement: string;
}

interface StationaryPropertyDetails {
  involved: boolean;
  propertyType: string;
  ownerName: string;
  ownerPhone: string;
  damageDescription: string;
  propertyInsurer: string;
  propertyPolicyNumber: string;
}

interface AccidentReportPageViewProps {
  onBackToDashboard: () => void;
  onViewClaimsHistory?: () => void;
}

export const AccidentReportPageView: React.FC<AccidentReportPageViewProps> = ({ onBackToDashboard, onViewClaimsHistory }) => {
  const client = CURRENT_CLIENT_MOCK;

  // Step state (6 clean steps):
  // 1: Incident & Driver Particulars
  // 2: Scene Location
  // 3: Other Party & Property Details
  // 4: Witness Details (Neutral Evidence)
  // 5: Evidence Uploads & Collision Sketch
  // 6: Police Docket & Review
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Incident Date, Time, Who was Driving, Vehicle Usage & Narrative
  const [incidentDate, setIncidentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [incidentTime, setIncidentTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [whoWasDriving, setWhoWasDriving] = useState<'PRIMARY_INSURED' | 'SPOUSE' | 'OTHER_DRIVER'>('PRIMARY_INSURED');
  const [otherDriverName, setOtherDriverName] = useState<string>('');
  const [otherDriverIdOrLicence, setOtherDriverIdOrLicence] = useState<string>('');
  const [otherDriverPhone, setOtherDriverPhone] = useState<string>('');
  const [otherDriverRelationship, setOtherDriverRelationship] = useState<string>('Family Member');
  const [vehicleUsage, setVehicleUsage] = useState<'PERSONAL' | 'BUSINESS'>('PERSONAL');

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

  // Step 3: Other Party & Property Details
  const [involvedEntity, setInvolvedEntity] = useState<'THIRD_PARTY_VEHICLE' | 'STATIONARY_PROPERTY' | 'BOTH' | 'NONE_SINGLE_VEHICLE'>('THIRD_PARTY_VEHICLE');
  const [otherParty, setOtherParty] = useState<OtherPartyDetails>({
    involved: true,
    driverName: 'Sipho Khumalo',
    driverPhone: '+27 83 291 8841',
    driverLicenceNumber: 'KHUMAS8401829',
    vehicleRegistration: 'CA 749-812',
    vehicleMakeModel: 'Toyota Hilux 2.8 GD-6',
    insurer: 'Discovery Insure',
    policyNumber: 'DISC-POL-849201',
    policeCaseNumber: 'CAS 492/09/2026',
    statementTaken: true,
    driverStatement: 'Driver indicated he was braking on wet surface and slipped into our rear bumper.'
  });

  const [propertyDetails, setPropertyDetails] = useState<StationaryPropertyDetails>({
    involved: false,
    propertyType: 'Boundary Wall & Gate',
    ownerName: 'Rivonia Place Body Corporate',
    ownerPhone: '+27 11 883 4900',
    damageDescription: 'Precast perimeter wall panel buckled and automated gate track bent.',
    propertyInsurer: 'Santam Commercial Property',
    propertyPolicyNumber: 'SAN-PROP-9821'
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

  // Step 5: Photo Evidence & Interactive Canvas Sketchpad
  const [photos, setPhotos] = useState<UploadedPhoto[]>([
    {
      id: 'doc-init-1',
      name: 'Damaged Front Bumper & Headlamp.jpg',
      size: '2.4 MB',
      category: 'VEHICLE_DAMAGE',
      previewUrl: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=300&q=80'
    },
    {
      id: 'doc-init-2',
      name: 'Accident Scene Overview.jpg',
      size: '3.1 MB',
      category: 'ALL_VEHICLES',
      previewUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=300&q=80'
    }
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [penColor, setPenColor] = useState<string>('#0f172a');
  const [penSize, setPenSize] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasSketchContent, setHasSketchContent] = useState<boolean>(false);

  // Step 6: SAPS Case Number & Statutory Notification
  const [policeNotified, setPoliceNotified] = useState<boolean>(true);
  const [policeCaseNumber, setPoliceCaseNumber] = useState<string>('CAS 382/09/2026');
  const [policeStation, setPoliceStation] = useState<string>('Sandton SAPS');
  const [policeReportDate, setPoliceReportDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [officerName, setOfficerName] = useState<string>('Constable Dlamini');
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

  const handleSimulateUpload = (category: PhotoCategory) => {
    const labels: Record<PhotoCategory, string> = {
      ALL_VEHICLES: 'All Vehicles at Scene Overview',
      VEHICLE_DAMAGE: 'Vehicle Damage (Front & Side)',
      ROAD_SURFACE: 'Road Surface & Skid Marks',
      REGISTRATION_DISCS: 'Windscreen Licence Disc',
      DRIVERS_LICENCE: "Driver's Licence Card (Front & Back)",
      ACCIDENT_SKETCH: 'Accident Scene Collision Sketch'
    };
    const sampleImages: Record<PhotoCategory, string> = {
      ALL_VEHICLES: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=300&q=80',
      VEHICLE_DAMAGE: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=300&q=80',
      ROAD_SURFACE: 'https://images.unsplash.com/photo-1519074069444-1ba4ea16e6f4?w=300&q=80',
      REGISTRATION_DISCS: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=300&q=80',
      DRIVERS_LICENCE: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300&q=80',
      ACCIDENT_SKETCH: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=300&q=80'
    };
    const newDoc: UploadedPhoto = {
      id: `doc-${Date.now()}`,
      name: `${labels[category]}.jpg`,
      size: `${(1.2 + Math.random() * 2.1).toFixed(1)} MB`,
      category,
      previewUrl: sampleImages[category]
    };
    setPhotos((prev) => [...prev, newDoc]);
  };

  const handleRealFileUpload = (e: React.ChangeEvent<HTMLInputElement>, cat: PhotoCategory) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const newDoc: UploadedPhoto = {
        id: `upload-${Date.now()}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        category: cat,
        previewUrl: (event.target?.result as string) || URL.createObjectURL(file)
      };
      setPhotos((prev) => [...prev, newDoc]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Canvas drawing handlers
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    setHasSketchContent(true);
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSketch = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSketchContent(false);
  };

  const handleSaveSketchToEvidence = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const newDoc: UploadedPhoto = {
      id: `sketch-${Date.now()}`,
      name: `Accident_Collision_Diagram_${new Date().toISOString().slice(0, 10)}.png`,
      size: '340 KB',
      category: 'ACCIDENT_SKETCH',
      previewUrl: dataUrl
    };
    setPhotos((prev) => [...prev, newDoc]);
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
  const hasCaseNumber = Boolean(policeCaseNumber.trim() && policeNotified);

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
        incidentDate: incidentDate || new Date().toISOString().split('T')[0],
        incidentTime,
        whoWasDriving,
        otherDriverDetails:
          whoWasDriving === 'OTHER_DRIVER'
            ? {
                fullName: otherDriverName,
                idOrLicence: otherDriverIdOrLicence,
                phone: otherDriverPhone,
                relationship: otherDriverRelationship
              }
            : undefined,
        vehicleUsage,
        description: narrative,
        policeNotified,
        policeCaseNumber: (policeNotified && policeCaseNumber.trim()) ? policeCaseNumber.trim() : undefined,
        policeStation: (policeNotified && policeCaseNumber.trim()) ? policeStation : undefined,
        policeReportDate: policeNotified ? policeReportDate : undefined,
        officerName: policeNotified ? officerName : undefined,
        location: location || {
          address: 'Sandton City, Johannesburg',
          lat: -26.1076,
          lng: 28.0567
        },
        involvedEntity,
        otherParty: (involvedEntity === 'THIRD_PARTY_VEHICLE' || involvedEntity === 'BOTH') ? otherParty : undefined,
        propertyDetails: (involvedEntity === 'STATIONARY_PROPERTY' || involvedEntity === 'BOTH') ? propertyDetails : undefined,
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
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onViewClaimsHistory && (
                <button
                  type="button"
                  onClick={onViewClaimsHistory}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-5 py-3 rounded-xl text-sm border border-indigo-200 transition cursor-pointer"
                >
                  <History size={16} />
                  <span>View in Claims History</span>
                </button>
              )}
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
            {onViewClaimsHistory && (
              <button
                type="button"
                onClick={onViewClaimsHistory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-200 transition cursor-pointer"
                title="View previous and active claims"
              >
                <History size={13} />
                <span>Claims History</span>
              </button>
            )}
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
              { num: 1, label: '1. Incident & Driver' },
              { num: 2, label: '2. Location' },
              { num: 3, label: '3. Third Party & Property' },
              { num: 4, label: '4. Witnesses' },
              { num: 5, label: '5. Evidence & Sketch' },
              { num: 6, label: '6. Police & Review' }
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

        {/* STEP 1: WHAT HAPPENED & DRIVER CIRCUMSTANCES */}
        {currentStep === 1 && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">1</span>
                <h2 className="text-lg font-bold text-slate-900">Incident Details &amp; Driver Circumstances</h2>
              </div>
              <p className="text-xs text-slate-500">
                Specify when the incident occurred, who was at the wheel, whether the vehicle was on personal or business use, and describe the sequence of events.
              </p>
            </div>

            {/* Incident Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="space-y-1">
                <label htmlFor="incident-date" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Clock size={13} className="text-indigo-600" />
                  Date of Incident:
                </label>
                <input
                  id="incident-date"
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="incident-time" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Clock size={13} className="text-indigo-600" />
                  Time of Incident:
                </label>
                <input
                  id="incident-time"
                  type="time"
                  value={incidentTime}
                  onChange={(e) => setIncidentTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-medium"
                />
              </div>
            </div>

            {/* Who was driving */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-700 block">
                Who was driving the insured vehicle?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { key: 'PRIMARY_INSURED', label: client.fullName, sub: 'Primary Insured' },
                  { key: 'SPOUSE', label: 'Nomvula Mokoena', sub: 'Spouse / Named Driver' },
                  { key: 'OTHER_DRIVER', label: 'Other Authorized Driver', sub: 'Employee / Family' }
                ].map((drv) => (
                  <button
                    key={drv.key}
                    type="button"
                    onClick={() => setWhoWasDriving(drv.key as any)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      whoWasDriving === drv.key
                        ? 'border-indigo-600 bg-indigo-50/80 shadow-sm'
                        : 'border-slate-200 bg-white hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-xs text-slate-900 block">{drv.label}</strong>
                      {whoWasDriving === drv.key && <Check size={14} className="text-indigo-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500">{drv.sub}</span>
                  </button>
                ))}
              </div>

              {/* If Other Driver Selected */}
              {whoWasDriving === 'OTHER_DRIVER' && (
                <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Driver's Full Name:</label>
                    <input
                      value={otherDriverName}
                      onChange={(e) => setOtherDriverName(e.target.value)}
                      placeholder="e.g. Sipho Ndlovu"
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">SA ID or Licence Number:</label>
                    <input
                      value={otherDriverIdOrLicence}
                      onChange={(e) => setOtherDriverIdOrLicence(e.target.value)}
                      placeholder="e.g. 8402195028084 / Code 08"
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Driver Phone Number:</label>
                    <input
                      value={otherDriverPhone}
                      onChange={(e) => setOtherDriverPhone(e.target.value)}
                      placeholder="e.g. +27 82 000 0000"
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Relationship to Policyholder:</label>
                    <select
                      value={otherDriverRelationship}
                      onChange={(e) => setOtherDriverRelationship(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                    >
                      <option value="Family Member">Family Member</option>
                      <option value="Company Employee">Company Employee</option>
                      <option value="Valet / Chauffeur">Valet / Chauffeur</option>
                      <option value="Friend / Authorized Borrower">Friend / Authorized Borrower</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Usage at time of incident */}
            <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-700 block">
                Vehicle Usage at the time of the incident:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVehicleUsage('PERSONAL')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    vehicleUsage === 'PERSONAL'
                      ? 'border-indigo-600 bg-indigo-50/80 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-xs text-slate-900 block">Personal &amp; Commuting Use</strong>
                    {vehicleUsage === 'PERSONAL' && <Check size={14} className="text-indigo-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Private, social, domestic, and travelling to/from principal place of work.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setVehicleUsage('BUSINESS')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    vehicleUsage === 'BUSINESS'
                      ? 'border-indigo-600 bg-indigo-50/80 shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-xs text-slate-900 block">Business &amp; Professional Travel</strong>
                    {vehicleUsage === 'BUSINESS' && <Check size={14} className="text-indigo-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Visiting clients, commercial errands, or on-duty travel covered under business endorsement.
                  </p>
                </button>
              </div>
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
                  Incident Statement &amp; Essential Details:
                </label>
                <span className="text-[11px] text-slate-400">Include collision point &amp; speed if known</span>
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

        {/* STEP 3: OTHER PARTY & PROPERTY DETAILS */}
        {currentStep === 3 && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">3</span>
                <h2 className="text-lg font-bold text-slate-900">Other Vehicles &amp; Property Involved</h2>
              </div>
              <p className="text-xs text-slate-500">
                Record details of any third-party vehicles, other drivers, and damaged property (walls, gates, street fixtures) involved in the collision.
              </p>
            </div>

            {/* Selector: What was involved? */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Select other parties or property involved:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'THIRD_PARTY_VEHICLE', label: 'Other Vehicle Only' },
                  { key: 'STATIONARY_PROPERTY', label: 'Property / Wall Only' },
                  { key: 'BOTH', label: 'Vehicle & Property' },
                  { key: 'NONE_SINGLE_VEHICLE', label: 'Single Vehicle Only' }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setInvolvedEntity(item.key as any);
                      const hasVeh = item.key === 'THIRD_PARTY_VEHICLE' || item.key === 'BOTH';
                      const hasProp = item.key === 'STATIONARY_PROPERTY' || item.key === 'BOTH';
                      setOtherParty((prev) => ({ ...prev, involved: hasVeh }));
                      setPropertyDetails((prev) => ({ ...prev, involved: hasProp }));
                    }}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer text-xs font-semibold ${
                      involvedEntity === item.key
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Third-Party Vehicle Section */}
            {(involvedEntity === 'THIRD_PARTY_VEHICLE' || involvedEntity === 'BOTH') && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Car size={16} className="text-indigo-600" />
                    Third-Party Driver &amp; Vehicle Particulars
                  </h3>
                  <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-medium">
                    Interested Party Account
                  </span>
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
                      placeholder="e.g. +27 83 291 8841"
                      className="w-full p-3 rounded-xl border border-slate-300 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Driver's Licence Number / Code:</label>
                    <input
                      value={otherParty.driverLicenceNumber}
                      onChange={(e) => setOtherParty({ ...otherParty, driverLicenceNumber: e.target.value })}
                      placeholder="e.g. KHUMAS8401829 / Code 08"
                      className="w-full p-3 rounded-xl border border-slate-300 font-mono text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Vehicle Registration Plate:</label>
                    <input
                      value={otherParty.vehicleRegistration}
                      onChange={(e) => setOtherParty({ ...otherParty, vehicleRegistration: e.target.value.toUpperCase() })}
                      placeholder="e.g. CA 749-812"
                      className="w-full p-3 rounded-xl border border-slate-300 font-mono uppercase text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Vehicle Make &amp; Model:</label>
                    <input
                      value={otherParty.vehicleMakeModel}
                      onChange={(e) => setOtherParty({ ...otherParty, vehicleMakeModel: e.target.value })}
                      placeholder="e.g. Toyota Hilux 2.8 GD-6"
                      className="w-full p-3 rounded-xl border border-slate-300 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Third-Party Insurer:</label>
                    <input
                      value={otherParty.insurer}
                      onChange={(e) => setOtherParty({ ...otherParty, insurer: e.target.value })}
                      placeholder="e.g. Discovery Insure / Santam / OUTsurance"
                      className="w-full p-3 rounded-xl border border-slate-300 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Third-Party Policy Number:</label>
                    <input
                      value={otherParty.policyNumber}
                      onChange={(e) => setOtherParty({ ...otherParty, policyNumber: e.target.value })}
                      placeholder="e.g. DISC-POL-849201"
                      className="w-full p-3 rounded-xl border border-slate-300 font-mono text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Third-Party Police Docket / Case #:</label>
                    <input
                      value={otherParty.policeCaseNumber}
                      onChange={(e) => setOtherParty({ ...otherParty, policeCaseNumber: e.target.value })}
                      placeholder="e.g. CAS 492/09/2026 or Pending"
                      className="w-full p-3 rounded-xl border border-slate-300 font-mono text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-slate-700">Other Driver's Statement / Explanation:</label>
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={otherParty.statementTaken}
                          onChange={(e) => setOtherParty({ ...otherParty, statementTaken: e.target.checked })}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Statement taken at scene</span>
                      </label>
                    </div>
                    <textarea
                      rows={3}
                      value={otherParty.driverStatement}
                      onChange={(e) => setOtherParty({ ...otherParty, driverStatement: e.target.value })}
                      placeholder="e.g. Driver stated his brakes locked on the wet road surface and slipped into our rear..."
                      className="w-full p-3 rounded-xl border border-slate-300 text-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Stationary Property Section */}
            {(involvedEntity === 'STATIONARY_PROPERTY' || involvedEntity === 'BOTH') && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building size={16} className="text-indigo-600" />
                    Damaged Stationary Property Details
                  </h3>
                  <span className="text-[11px] text-slate-500">Wall, Fence, Gate, Municipal Pole</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Property Type:</label>
                    <select
                      value={propertyDetails.propertyType}
                      onChange={(e) => setPropertyDetails({ ...propertyDetails, propertyType: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900"
                    >
                      <option value="Boundary Wall & Gate">Boundary Wall &amp; Gate</option>
                      <option value="Precast Concrete Fence">Precast Concrete Fence</option>
                      <option value="Traffic Light / Streetlamp">Traffic Light / Streetlamp</option>
                      <option value="Guardrail / Municipal Barrier">Guardrail / Municipal Barrier</option>
                      <option value="Commercial Shopfront / Building">Commercial Shopfront / Building</option>
                      <option value="Other Static Property">Other Static Property</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Property Owner Name / Body Corporate:</label>
                    <input
                      value={propertyDetails.ownerName}
                      onChange={(e) => setPropertyDetails({ ...propertyDetails, ownerName: e.target.value })}
                      placeholder="e.g. Rivonia Place Body Corporate"
                      className="w-full p-3 rounded-xl border border-slate-300 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Owner Contact Phone:</label>
                    <input
                      value={propertyDetails.ownerPhone}
                      onChange={(e) => setPropertyDetails({ ...propertyDetails, ownerPhone: e.target.value })}
                      placeholder="e.g. +27 11 883 4900"
                      className="w-full p-3 rounded-xl border border-slate-300 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Property Insurer (if known):</label>
                    <input
                      value={propertyDetails.propertyInsurer}
                      onChange={(e) => setPropertyDetails({ ...propertyDetails, propertyInsurer: e.target.value })}
                      placeholder="e.g. Santam Commercial Property"
                      className="w-full p-3 rounded-xl border border-slate-300 text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-semibold text-slate-700">Description of Property Damage:</label>
                    <textarea
                      rows={2}
                      value={propertyDetails.damageDescription}
                      onChange={(e) => setPropertyDetails({ ...propertyDetails, damageDescription: e.target.value })}
                      placeholder="e.g. Two precast concrete wall panels cracked and electric fence wire severed..."
                      className="w-full p-3 rounded-xl border border-slate-300 text-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {involvedEntity === 'NONE_SINGLE_VEHICLE' && (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                <Car size={32} className="mx-auto text-slate-400" />
                <h4 className="font-bold text-slate-800 text-sm">Single Vehicle Incident</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No other driver, vehicle, or static property was involved. Your claim will proceed under own-damage comprehensive cover.
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

        {/* STEP 5: PHOTOS, EVIDENCE & ACCIDENT SKETCH */}
        {currentStep === 5 && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">5</span>
                <h2 className="text-lg font-bold text-slate-900">Photos, Scene Evidence &amp; Accident Sketch</h2>
              </div>
              <p className="text-xs text-slate-500">
                Upload clear scene photos, vehicle damage, road surface, registration discs, driver's licences, and sketch the collision trajectory.
              </p>
            </div>

            {/* Upload Action Category Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { cat: 'ALL_VEHICLES' as const, label: 'All Vehicles', sub: 'Scene positions', icon: Car, color: 'text-indigo-600' },
                { cat: 'VEHICLE_DAMAGE' as const, label: 'Damage', sub: 'Impact panels', icon: Camera, color: 'text-rose-600' },
                { cat: 'ROAD_SURFACE' as const, label: 'Road Surface', sub: 'Skid marks & signs', icon: MapPin, color: 'text-amber-600' },
                { cat: 'REGISTRATION_DISCS' as const, label: 'Licence Discs', sub: 'Windscreens', icon: FileCheck, color: 'text-blue-600' },
                { cat: 'DRIVERS_LICENCE' as const, label: "Driver's Licence", sub: 'Front & back', icon: ShieldCheck, color: 'text-emerald-600' }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.cat} className="p-3 bg-slate-50 hover:bg-indigo-50/40 rounded-xl border border-slate-200 transition flex flex-col justify-between gap-2">
                    <div className="flex items-center justify-between">
                      <Icon size={20} className={item.color} />
                      <label className="text-[10px] text-indigo-700 font-bold hover:underline cursor-pointer">
                        File
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleRealFileUpload(e, item.cat)}
                        />
                      </label>
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block leading-tight">{item.label}</strong>
                      <span className="text-[10px] text-slate-500">{item.sub}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSimulateUpload(item.cat)}
                      className="w-full py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 transition cursor-pointer"
                    >
                      + Quick Attach
                    </button>
                  </div>
                );
              })}
            </div>

            {/* INTERACTIVE COLLISION SKETCHPAD */}
            <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <PenTool size={16} className="text-indigo-600" />
                    Accident Scene Sketch &amp; Collision Trajectory
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sketch the intersection, positions of Car A (Red) and Car B (Blue), and collision direction.
                  </p>
                </div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-100 transition cursor-pointer self-start sm:self-auto">
                  <UploadCloud size={14} className="text-indigo-600" />
                  <span>Upload Sketch Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleRealFileUpload(e, 'ACCIDENT_SKETCH')}
                  />
                </label>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-600 text-[11px]">Pen Color:</span>
                  {[
                    { color: '#0f172a', label: 'Road / Black' },
                    { color: '#dc2626', label: 'Car A (Insured)' },
                    { color: '#2563eb', label: 'Car B (Other)' },
                    { color: '#d97706', label: 'Direction Arrow' }
                  ].map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => setPenColor(p.color)}
                      className={`w-6 h-6 rounded-full border-2 transition cursor-pointer ${
                        penColor === p.color ? 'ring-2 ring-indigo-500 scale-110' : 'border-white'
                      }`}
                      style={{ backgroundColor: p.color }}
                      title={p.label}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-600 text-[11px]">Stroke:</span>
                  {[2, 4, 7].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPenSize(s)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                        penSize === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {s}px
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearSketch}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Clear</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSketchToEvidence}
                    disabled={!hasSketchContent}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-sm"
                  >
                    <Check size={13} />
                    <span>Attach Sketch to Evidence</span>
                  </button>
                </div>
              </div>

              {/* Drawing Canvas */}
              <div className="w-full bg-white rounded-xl border border-slate-300 overflow-hidden shadow-inner flex justify-center">
                <canvas
                  ref={canvasRef}
                  width={720}
                  height={260}
                  className="w-full max-w-full touch-none cursor-crosshair bg-white"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
            </div>

            {/* Attached Photos List */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Attached Claim Evidence &amp; Diagrams ({photos.length})
              </span>

              {photos.length === 0 ? (
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>Please attach at least 1 photo or sketch above before proceeding.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {photos.map((p) => (
                    <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img src={p.previewUrl} alt={p.name} className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-white" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{p.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-slate-200 text-slate-700 rounded">
                              {p.category.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-slate-500">{p.size}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Remove evidence"
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
                <span>Next: SAPS &amp; Review</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: POLICE DOCKET & FINAL REVIEW */}
        {currentStep === 6 && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">6</span>
                <h2 className="text-lg font-bold text-slate-900">Police Docket &amp; Statutory Review</h2>
              </div>
              <p className="text-xs text-slate-500">
                Record whether the South African Police Service (SAPS) was notified, enter the CAS / Docket reference, or schedule a statutory 48-hour reminder.
              </p>
            </div>

            {/* Question: Were police notified? */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Were the Police (SAPS) notified of this collision?</h3>
                  <p className="text-xs text-slate-500">
                    Section 61 of the National Road Traffic Act requires accidents involving damage or injury to be reported within 24–48 hours.
                  </p>
                </div>
                <div className="inline-flex rounded-xl border border-slate-300 p-1 bg-white shrink-0">
                  <button
                    type="button"
                    onClick={() => setPoliceNotified(true)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      policeNotified ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Yes, Reported
                  </button>
                  <button
                    type="button"
                    onClick={() => setPoliceNotified(false)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      !policeNotified ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Not Yet Reported
                  </button>
                </div>
              </div>

              {policeNotified ? (
                <div className="space-y-4 pt-3 border-t border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="space-y-1">
                      <label htmlFor="case-number" className="font-semibold text-slate-700 block">
                        SAPS Case / CAS Number:
                      </label>
                      <input
                        id="case-number"
                        value={policeCaseNumber}
                        onChange={(e) => setPoliceCaseNumber(e.target.value)}
                        placeholder="e.g. CAS 382/09/2026"
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs uppercase text-slate-900 bg-white"
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
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">
                        Date Reported:
                      </label>
                      <input
                        type="date"
                        value={policeReportDate}
                        onChange={(e) => setPoliceReportDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 block">
                        Attending Officer / Badge:
                      </label>
                      <input
                        value={officerName}
                        onChange={(e) => setOfficerName(e.target.value)}
                        placeholder="e.g. Constable Dlamini"
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>
                      Police docket recorded: <strong>{policeCaseNumber}</strong> at <strong>{policeStation}</strong>. Statutory compliance verified.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Clock size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <strong className="text-xs text-slate-900">48-Hour Police Docket Follow-Up Active</strong>
                      <p className="text-[11px] text-slate-600">
                        Please visit your nearest SAPS station within 48 hours to log the accident and receive a CAS docket number. We will send you an automated reminder:
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
              <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2 flex items-center justify-between">
                <span>Claim Intake Summary Overview</span>
                <span className="text-[11px] font-normal text-slate-500">Ready for statutory submission</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <span className="font-semibold text-slate-500 uppercase block text-[10px]">Client &amp; Insured Vehicle</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{client.fullName}</p>
                  <p className="text-slate-600">{client.insuredVehicle.year} {client.insuredVehicle.make} {client.insuredVehicle.model}</p>
                  <p className="font-mono text-slate-800 font-semibold">{client.insuredVehicle.registration}</p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase block text-[10px]">Incident Date, Time &amp; Driver</span>
                  <p className="font-bold text-slate-900 mt-0.5">{incidentDate} at {incidentTime}</p>
                  <p className="text-slate-700">
                    Driver: <strong>{whoWasDriving === 'PRIMARY_INSURED' ? client.fullName : whoWasDriving === 'SPOUSE' ? 'Nomvula Mokoena' : otherDriverName || 'Other Driver'}</strong>
                  </p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-semibold">
                    {vehicleUsage === 'PERSONAL' ? 'Personal & Commuting' : 'Business Travel'}
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase block text-[10px]">Underwriting Insurer</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{client.insuredVehicle.insurer}</p>
                  <p className="font-mono text-slate-600">Policy #{client.insuredVehicle.policyNumber}</p>
                  <p className="text-slate-500 text-[11px]">Standard Excess R {client.insuredVehicle.excessAmount}</p>
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <span className="font-semibold text-slate-500 uppercase block text-[10px]">Incident Sequence / Description</span>
                  <p className="text-slate-800 mt-1 bg-white p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                    {narrative || 'No detailed statement provided.'}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase block text-[10px]">Other Party / Vehicle</span>
                  <p className="text-slate-800 font-medium mt-0.5">
                    {otherParty.involved ? `${otherParty.driverName} (${otherParty.vehicleRegistration}) • ${otherParty.insurer}` : 'None (Single Vehicle)'}
                  </p>
                  {otherParty.involved && otherParty.policeCaseNumber && (
                    <p className="text-[11px] text-slate-500">Third-Party Docket: {otherParty.policeCaseNumber}</p>
                  )}
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase block text-[10px]">Stationary Property</span>
                  <p className="text-slate-800 font-medium mt-0.5">
                    {propertyDetails.involved ? `${propertyDetails.propertyType} (${propertyDetails.ownerName})` : 'No static property damage'}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase block text-[10px]">Evidence &amp; Diagram</span>
                  <p className="text-slate-800 font-medium mt-0.5">
                    {photos.length} photo(s) &amp; diagrams attached
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {hasWitness ? `${witnesses.length} Neutral witness(es)` : 'No witnesses'}
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
                <span>Back to Evidence</span>
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
                    <span>Submitting to Insurer...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Confirm &amp; Submit Accident Claim</span>
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
