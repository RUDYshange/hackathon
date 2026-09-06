import React, { useState } from 'react';
import {
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Camera,
  UploadCloud,
  FileCheck,
  Trash2,
  Plus,
  Loader2,
  ShieldCheck,
  PhoneCall,
  Printer,
  Package,
  Home,
  Watch,
  Laptop,
  Anchor
} from 'lucide-react';
import { CURRENT_CLIENT_MOCK } from '../client/mockClientData';
import { secureFetch } from '../services/api';
import { MockProviderApiService } from '../services/mockProviderApi';

interface LostItem {
  id: string;
  description: string;
  estimatedValue: number;
  serialNumber: string;
  proofAvailable: boolean;
}

interface UploadedDocument {
  id: string;
  name: string;
  size: string;
  category: 'DAMAGE_SCENE' | 'RECEIPT_INVOICE' | 'VALUATION_CERT' | 'POLICE_DOCKET';
  previewUrl: string;
}

interface ReportLossPageViewProps {
  onBackToDashboard: () => void;
}

export const ReportLossPageView: React.FC<ReportLossPageViewProps> = ({ onBackToDashboard }) => {
  const client = CURRENT_CLIENT_MOCK;

  // Step state:
  // 1: Category & Incident Details
  // 2: Items Lost / Damaged
  // 3: Proof & Evidence Upload
  // 4: Review & Submit
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Loss Type & Policy
  const [assetCategory, setAssetCategory] = useState<string>('HOME_CONTENTS');
  const [lossType, setLossType] = useState<string>('BURGLARY');
  const [incidentDate, setIncidentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [incidentTime, setIncidentTime] = useState<string>('03:30');
  const [incidentDescription, setIncidentDescription] = useState<string>(
    'Forced entry through rear patio sliding door while away. Master bedroom security gate breached and jewelry safe forced open.'
  );
  const [policeCaseNumber, setPoliceCaseNumber] = useState<string>('CAS 419/09/2026');
  const [policeStation, setPoliceStation] = useState<string>('Sandton SAPS');

  // Step 2: Items Lost or Damaged
  const [items, setItems] = useState<LostItem[]>([
    {
      id: 'item-1',
      description: 'Rolex Submariner Date 41mm (Ref: 126610LN)',
      estimatedValue: 245000,
      serialNumber: '9284H102',
      proofAvailable: true
    },
    {
      id: 'item-2',
      description: 'Apple MacBook Pro 16" M3 Max 64GB',
      estimatedValue: 78000,
      serialNumber: 'C02GK990MD6R',
      proofAvailable: true
    },
    {
      id: 'item-3',
      description: 'Platinum & Diamond Eternity Ring',
      estimatedValue: 95000,
      serialNumber: 'VAL-CERT-7718',
      proofAvailable: true
    }
  ]);

  // Step 3: Documentation & Invoices
  const [documents, setDocuments] = useState<UploadedDocument[]>([
    {
      id: 'doc-1',
      name: 'Rolex Official Valuation Certificate (2024).pdf',
      size: '1.8 MB',
      category: 'VALUATION_CERT',
      previewUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80'
    },
    {
      id: 'doc-2',
      name: 'Patio Security Gate Forced Lock Photo.jpg',
      size: '2.1 MB',
      category: 'DAMAGE_SCENE',
      previewUrl: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=300&q=80'
    },
    {
      id: 'doc-3',
      name: 'SAPS Police Incident Docket Notice.pdf',
      size: '890 KB',
      category: 'POLICE_DOCKET',
      previewUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300&q=80'
    }
  ]);

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedClaim, setSubmittedClaim] = useState<{
    reference: string;
    submittedAt: string;
    totalAmount: number;
    itemCount: number;
  } | null>(null);

  const totalClaimAmount = items.reduce((acc, item) => acc + (Number(item.estimatedValue) || 0), 0);

  const handleAddItem = () => {
    const newItem: LostItem = {
      id: `item-${Date.now()}`,
      description: '',
      estimatedValue: 0,
      serialNumber: '',
      proofAvailable: false
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleUpdateItem = (id: string, updates: Partial<LostItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSimulateDocUpload = (category: UploadedDocument['category']) => {
    const labels = {
      DAMAGE_SCENE: 'Point of Entry / Damage Photo',
      RECEIPT_INVOICE: 'Purchase Invoice / Receipt',
      VALUATION_CERT: 'Official Valuation Certificate',
      POLICE_DOCKET: 'SAPS CAS Docket Acknowledgment'
    };
    const newDoc: UploadedDocument = {
      id: `doc-${Date.now()}`,
      name: `${labels[category]}.pdf`,
      size: `${(0.8 + Math.random() * 1.5).toFixed(1)} MB`,
      category,
      previewUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300&q=80'
    };
    setDocuments((prev) => [...prev, newDoc]);
  };

  const handleRemoveDoc = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSubmitClaim = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const generatedRef = `CLM-L-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      const payload = {
        reference: generatedRef,
        clientId: client.id,
        clientName: client.fullName,
        policyNumber: 'ST-39201984',
        insurer: 'Santam Insurance',
        claimType: 'PROPERTY_ASSET_LOSS',
        assetCategory,
        lossType,
        incidentDate,
        incidentTime,
        description: incidentDescription,
        policeCaseNumber: policeCaseNumber.trim() || undefined,
        policeStation: policeStation.trim() || undefined,
        items,
        totalClaimAmount,
        documents: documents.map((d) => ({ name: d.name, category: d.category, size: d.size })),
        source: 'CLIENT_SELF_SERVICE'
      };

      await secureFetch('/claims', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Transmit to mock provider integration log in real-time
      try {
        await MockProviderApiService.submitClaimToProvider(undefined, 'Santam', {
          claim_id: generatedRef,
          client_name: client.fullName,
          client_reference: client.id,
          policy_number: 'ST-39201984'
        });
      } catch (err) {
        console.warn('Provider dispatch error', err);
      }

      setSubmittedClaim({
        reference: generatedRef,
        submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        totalAmount: totalClaimAmount,
        itemCount: items.length
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
              Loss & Theft Claim Logged
            </h1>
            <p className="text-slate-600 max-w-md mx-auto text-sm">
              Your property and asset claim has been registered with <strong>Santam Insurance</strong> under Policy <strong>#ST-39201984</strong>.
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
              Submitted at {submittedClaim.submittedAt} SAST &bull; Total Claim Valuation: <strong>R {submittedClaim.totalAmount.toLocaleString()}</strong> ({submittedClaim.itemCount} items)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">Dedicated Advisor</span>
              <p className="font-bold text-slate-900">{client.advisor.name}</p>
              <p className="text-xs text-slate-600">Tel: {client.advisor.phone} &bull; {client.advisor.email}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">SAPS Police Docket</span>
              <p className="font-bold text-emerald-700">{policeCaseNumber} ({policeStation})</p>
              <p className="text-xs text-slate-600">Burglary dossier registered with Sandton SAPS</p>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-4">
            <PhoneCall size={26} className="text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-slate-900">Need Emergency Boarding / Locksmith Assistance?</h4>
              <p className="text-xs text-slate-600">
                Call Santam Emergency Home Assist at <a href="tel:0800111222" className="font-bold text-slate-900 underline">0800 111 222</a> for urgent security guard or glazier dispatch.
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

        {/* Top Header & Navigation */}
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
                Report Property Loss or Theft
              </h1>
              <span className="text-xs text-slate-500">
                Independent claims channel for home contents, jewelry, and all-risks
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:0800111222"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold rounded-xl hover:bg-amber-100 transition"
              title="Santam Emergency Property Assist"
            >
              <PhoneCall size={13} />
              <span>Santam Assist 0800 111 222</span>
            </a>
          </div>
        </div>

        {/* Pre-loaded Policy Strip */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
              <ShieldAlert size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-slate-900 text-sm">Executive Domestic & All-Risks Policy</strong>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded-full text-[11px]">Sum Assured R 8,500,000</span>
              </div>
              <p className="text-slate-600">
                Primary Residence: 1401 The Franklin, Newtown, Johannesburg &bull; Santam Insurance &bull; Policy #ST-39201984
              </p>
            </div>
          </div>
          <span className="text-amber-800 font-medium flex items-center gap-1">
            <ShieldCheck size={14} className="text-amber-700" /> Pre-loaded under FAIS CAT I & II mandate
          </span>
        </div>

        {/* Step Wizard Progress Bar (4 steps) */}
        <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {[
              { num: 1, label: '1. Incident Details' },
              { num: 2, label: '2. Items Lost / Damaged' },
              { num: 3, label: '3. Evidence & Invoices' },
              { num: 4, label: '4. Review & Submit' }
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

        {/* STEP 1: CATEGORY & INCIDENT DETAILS */}
        {currentStep === 1 && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">1</span>
                <h2 className="text-lg font-bold text-slate-900">What type of loss occurred?</h2>
              </div>
              <p className="text-xs text-slate-500">
                Select the affected property category, peril, date, and police docket details.
              </p>
            </div>

            {/* Category Selector Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { key: 'HOME_CONTENTS', label: 'Home Contents', icon: Home },
                { key: 'JEWELRY', label: 'Jewelry & Watches', icon: Watch },
                { key: 'ALL_RISKS', label: 'Electronics / Portable', icon: Laptop },
                { key: 'CRAFT_MARINE', label: 'Pleasure Craft & Marine', icon: Anchor }
              ].map((c) => {
                const IconComponent = c.icon;
                const isSelected = assetCategory === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setAssetCategory(c.key)}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-2 transition cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-800'
                    }`}
                  >
                    <IconComponent size={22} className={isSelected ? 'text-amber-400' : 'text-slate-600'} />
                    <strong className="text-xs block">{c.label}</strong>
                  </button>
                );
              })}
            </div>

            {/* Peril & Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Peril / Cause of Loss:</label>
                <select
                  value={lossType}
                  onChange={(e) => setLossType(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900"
                >
                  <option value="BURGLARY">Burglary & Forced Entry</option>
                  <option value="THEFT">Robbery / External Theft</option>
                  <option value="WATER_DAMAGE">Water Pipe Burst / Leak</option>
                  <option value="ACCIDENTAL">Accidental Breakage / Drop</option>
                  <option value="POWER_SURGE">Power Surge / Lightning</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Date Discovered:</label>
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900"
                >
                </input>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Approximate Time:</label>
                <input
                  type="time"
                  value={incidentTime}
                  onChange={(e) => setIncidentTime(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-white text-slate-900"
                />
              </div>
            </div>

            {/* Police Docket Section (Mandatory for theft) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <strong className="text-slate-900 text-sm">SAPS Police Docket Information</strong>
                <span className="text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded-full text-[11px]">
                  Required for Burglary / Theft
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Under South African insurance practice, all theft and forced-entry claims require a registered SAPS Case Number before payment.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Police Case / CAS Number:</label>
                  <input
                    value={policeCaseNumber}
                    onChange={(e) => setPoliceCaseNumber(e.target.value)}
                    placeholder="e.g. CAS 419/09/2026"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono uppercase bg-white text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Police Station:</label>
                  <input
                    value={policeStation}
                    onChange={(e) => setPoliceStation(e.target.value)}
                    placeholder="e.g. Sandton SAPS"
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-700">Description of What Happened:</label>
              <textarea
                rows={3}
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                placeholder="Describe how the loss occurred, points of forced entry, alarms triggered, or discovery..."
                className="w-full p-3.5 rounded-xl border border-slate-300 text-slate-900"
              />
            </div>

            {/* Step 1 Footer */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition cursor-pointer"
              >
                <span>Next: Items Lost / Damaged</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ITEMS LOST OR DAMAGED */}
        {currentStep === 2 && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">2</span>
                <h2 className="text-lg font-bold text-slate-900">List of Stolen or Damaged Items</h2>
              </div>
              <p className="text-xs text-slate-500">
                Itemize each article claimed, estimated replacement cost, and serial number.
              </p>
            </div>

            {/* Itemized List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Items Claimed ({items.length}) &bull; Total Value: R {totalClaimAmount.toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Another Item</span>
                </button>
              </div>

              {items.map((item, idx) => (
                <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Package size={16} className="text-amber-600" /> Item #{idx + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-semibold text-slate-700">Item Description & Brand / Model:</label>
                      <input
                        value={item.description}
                        onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                        placeholder="e.g. Rolex Submariner Date 41mm"
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Estimated Replacement Cost (Rand):</label>
                      <input
                        type="number"
                        value={item.estimatedValue || ''}
                        onChange={(e) => handleUpdateItem(item.id, { estimatedValue: Number(e.target.value) })}
                        placeholder="e.g. 245000"
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono font-bold bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-semibold text-slate-700">Serial Number / IMEI / Certificate Number:</label>
                      <input
                        value={item.serialNumber}
                        onChange={(e) => handleUpdateItem(item.id, { serialNumber: e.target.value })}
                        placeholder="e.g. 9284H102 or Serial"
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-mono bg-white text-slate-900"
                      />
                    </div>

                    <div className="space-y-1 flex flex-col justify-end">
                      <label className="inline-flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.proofAvailable}
                          onChange={(e) => handleUpdateItem(item.id, { proofAvailable: e.target.checked })}
                          className="rounded border-slate-300 text-slate-900"
                        />
                        <span className="text-[11px] font-medium text-slate-700">Proof / Valuation on file</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Valuation Summary Banner */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Total Claim Valuation</span>
                <span className="text-2xl font-extrabold text-amber-400 font-mono">
                  R {totalClaimAmount.toLocaleString()}
                </span>
              </div>
              <span className="text-xs text-slate-300 text-right">
                Standard Excess applies per policy terms
              </span>
            </div>

            {/* Step 2 Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>Back to Incident Details</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition cursor-pointer"
              >
                <span>Next: Evidence & Proof</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: EVIDENCE & INVOICES */}
        {currentStep === 3 && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">3</span>
                <h2 className="text-lg font-bold text-slate-900">Proof of Ownership & Photos</h2>
              </div>
              <p className="text-xs text-slate-500">
                Attach valuation certificates, receipts, or scene photos (e.g. forced locks, broken windows).
              </p>
            </div>

            {/* Upload Action Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleSimulateDocUpload('VALUATION_CERT')}
                className="p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition flex flex-col justify-between gap-2 cursor-pointer"
              >
                <FileCheck size={24} className="text-amber-600" />
                <div>
                  <strong className="text-xs font-bold text-slate-900 block">Valuation Certificate</strong>
                  <span className="text-[11px] text-slate-500">+ Attach jeweler or expert valuation</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateDocUpload('DAMAGE_SCENE')}
                className="p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition flex flex-col justify-between gap-2 cursor-pointer"
              >
                <Camera size={24} className="text-indigo-600" />
                <div>
                  <strong className="text-xs font-bold text-slate-900 block">Point of Forced Entry</strong>
                  <span className="text-[11px] text-slate-500">+ Attach damage photo</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateDocUpload('RECEIPT_INVOICE')}
                className="p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition flex flex-col justify-between gap-2 cursor-pointer"
              >
                <UploadCloud size={24} className="text-emerald-600" />
                <div>
                  <strong className="text-xs font-bold text-slate-900 block">Purchase Receipt / Invoice</strong>
                  <span className="text-[11px] text-slate-500">+ Attach store receipt</span>
                </div>
              </button>
            </div>

            {/* Uploaded Documents List */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Attached Files ({documents.length})
              </span>

              {documents.length === 0 ? (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>Tip: Attaching proof of purchase or valuations expedites assessor settlement.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {documents.map((d) => (
                    <div key={d.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img src={d.previewUrl} alt={d.name} className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 truncate max-w-[180px]">{d.name}</p>
                          <span className="text-[11px] text-slate-500">{d.size}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(d.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 3 Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>Back to Items</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-xl text-sm transition cursor-pointer"
              >
                <span>Next: Review & Submit</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & SUBMISSION */}
        {currentStep === 4 && (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">4</span>
                <h2 className="text-lg font-bold text-slate-900">Review & Confirm Claim</h2>
              </div>
              <p className="text-xs text-slate-500">
                Please verify all loss details before transmitting to Santam claims department.
              </p>
            </div>

            {/* Review Summary Card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 text-xs">
              <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                Property Loss Claim Summary
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-slate-500 uppercase block">Client & Residence</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{client.fullName}</p>
                  <p className="text-slate-600">{client.primaryAddress}</p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase block">Underwriting Policy</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">Santam Insurance Ltd</p>
                  <p className="font-mono text-slate-600">Policy #ST-39201984 &bull; Home Contents & Craft</p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase block">Incident Discovery</span>
                  <p className="text-slate-800 font-medium mt-0.5">{incidentDate} at {incidentTime} ({lossType})</p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase block">SAPS Case Reference</span>
                  <p className="text-slate-800 font-medium mt-0.5">{policeCaseNumber} &bull; {policeStation}</p>
                </div>

                <div className="sm:col-span-2">
                  <span className="font-semibold text-slate-500 uppercase block">Loss Description</span>
                  <p className="text-slate-800 mt-1 bg-white p-3 rounded-xl border border-slate-200/80">
                    {incidentDescription}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <span className="font-semibold text-slate-500 uppercase block mb-1">
                    Claimed Items ({items.length}):
                  </span>
                  <div className="space-y-1">
                    {items.map((it) => (
                      <div key={it.id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <strong className="text-slate-900">{it.description}</strong>
                          {it.serialNumber && <span className="text-slate-500 block font-mono text-[11px]">SN: {it.serialNumber}</span>}
                        </div>
                        <span className="font-mono font-bold text-slate-900">R {it.estimatedValue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2 p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                  <span className="font-bold">Total Claim Value:</span>
                  <span className="font-mono text-lg font-extrabold text-amber-400">R {totalClaimAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {submitError && (
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{submitError}</span>
              </div>
            )}

            {/* Step 4 Footer / Final Submit */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft size={15} />
                <span>Back to Evidence</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitClaim}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-3.5 rounded-xl text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Submitting Claim...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} className="text-amber-400" />
                    <span>Confirm & Submit Loss Claim</span>
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
