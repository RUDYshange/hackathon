import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  CreditCard,
  MapPin,
  User,
  Briefcase,
  Sparkles,
  Send,
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import {
  DocumentScannerService,
  BankScanResult,
  AddressScanResult,
  IdScanResult,
  JobScanResult
} from '../../services/documentScannerService';
import { CURRENT_CLIENT_MOCK } from '../../client/mockClientData';

export type ChangeCategory = 'BANKING' | 'ADDRESS' | 'IDENTITY' | 'EMPLOYMENT';

export interface ClientChangeRequest {
  id: string;
  reference: string;
  clientName: string;
  clientRef: string;
  category: ChangeCategory;
  submittedAt: string;
  status: 'PENDING_ADVISOR_REVIEW' | 'SENT_TO_PROVIDERS' | 'COMPLETED';
  documentName: string;
  documentCategory: string;
  extractedFields: Record<string, string | number | boolean | undefined>;
  targetProviders: string[];
  clientNotes?: string;
}

interface ClientChangeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const ClientChangeDetailsModal: React.FC<ClientChangeDetailsModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const client = CURRENT_CLIENT_MOCK;
  const [category, setCategory] = useState<ChangeCategory>('BANKING');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedSuccess, setExtractedSuccess] = useState<boolean>(false);

  // Form Fields State
  // Banking
  const [bankName, setBankName] = useState('Standard Bank of South Africa');
  const [accountHolder, setAccountHolder] = useState(client.fullName);
  const [accountNumber, setAccountNumber] = useState('10194820194');
  const [branchCode, setBranchCode] = useState('051001');
  const [accountType, setAccountType] = useState('Private Wealth Cheque Account');

  // Address
  const [streetAddress, setStreetAddress] = useState('1401 The Franklin, 4 Pritchard Street');
  const [suburb, setSuburb] = useState('Newtown');
  const [city, setCity] = useState('Johannesburg');
  const [postalCode, setPostalCode] = useState('2001');

  // Identity
  const [fullName, setFullName] = useState(client.fullName);
  const [idNumber, setIdNumber] = useState(client.primaryIdNumber);
  const [dob, setDob] = useState('1982-06-14');
  const [gender, setGender] = useState('Male');

  // Employment
  const [employer, setEmployer] = useState('Nexura Tech Solutions (Pty) Ltd');
  const [occupation, setOccupation] = useState('Managing Director');
  const [monthlyIncome, setMonthlyIncome] = useState<number | string>(135000);

  // Providers to notify
  const [targetProviders, setTargetProviders] = useState<string[]>([
    'Santam Insurance',
    'Allan Gray',
    'Discovery Invest & Insure'
  ]);

  const [clientNotes, setClientNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleProvider = (name: string) => {
    setTargetProviders((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsScanning(true);
    setScanError(null);
    setExtractedSuccess(false);

    try {
      if (category === 'BANKING') {
        const res: BankScanResult = await DocumentScannerService.scanBankDocument(file);
        if (res.is_blurry) {
          setScanError(res.error_message || 'Document is out of focus. Please upload a clear photo.');
        } else {
          if (res.bank_name) setBankName(res.bank_name);
          if (res.account_holder) setAccountHolder(res.account_holder);
          if (res.account_number) setAccountNumber(res.account_number);
          if (res.branch_code) setBranchCode(res.branch_code);
          if (res.account_type) setAccountType(res.account_type);
          setExtractedSuccess(true);
        }
      } else if (category === 'ADDRESS') {
        const res: AddressScanResult = await DocumentScannerService.scanAddressDocument(file);
        if (res.is_blurry) {
          setScanError(res.error_message || 'Document is blurry or illegible.');
        } else {
          if (res.street_address) setStreetAddress(res.street_address);
          if (res.suburb) setSuburb(res.suburb);
          if (res.city) setCity(res.city);
          if (res.postal_code) setPostalCode(res.postal_code);
          setExtractedSuccess(true);
        }
      } else if (category === 'IDENTITY') {
        const res: IdScanResult = await DocumentScannerService.scanIdDocument(file);
        if (res.is_blurry) {
          setScanError(res.error_message || 'ID photo is blurry.');
        } else {
          if (res.full_name) setFullName(res.full_name);
          if (res.id_number) setIdNumber(res.id_number);
          if (res.date_of_birth) setDob(res.date_of_birth);
          if (res.gender) setGender(res.gender);
          setExtractedSuccess(true);
        }
      } else if (category === 'EMPLOYMENT') {
        const res: JobScanResult = await DocumentScannerService.scanJobDocument(file);
        if (res.is_blurry) {
          setScanError(res.error_message || 'Employment document is illegible.');
        } else {
          if (res.employer) setEmployer(res.employer);
          if (res.occupation) setOccupation(res.occupation);
          if (res.monthly_income) setMonthlyIncome(res.monthly_income);
          setExtractedSuccess(true);
        }
      }
    } catch (err: any) {
      setScanError(err.message || 'Failed to scan document');
    } finally {
      setIsScanning(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const ref = `CR-${Math.floor(10000 + Math.random() * 90000)}`;
    const newRequest: ClientChangeRequest = {
      id: `cr-${Date.now()}`,
      reference: ref,
      clientName: client.fullName,
      clientRef: 'CLI-1026',
      category,
      submittedAt: new Date().toLocaleString('en-ZA'),
      status: 'PENDING_ADVISOR_REVIEW',
      documentName: uploadedFile?.name || `${category.toLowerCase()}_proof_document.pdf`,
      documentCategory: category,
      extractedFields:
        category === 'BANKING'
          ? { bankName, accountHolder, accountNumber, branchCode, accountType }
          : category === 'ADDRESS'
          ? { streetAddress, suburb, city, postalCode }
          : category === 'IDENTITY'
          ? { fullName, idNumber, dob, gender }
          : { employer, occupation, monthlyIncome },
      targetProviders,
      clientNotes: clientNotes.trim() || undefined
    };

    // Store in localStorage so it automatically shows in the Advisor Console
    try {
      const existingStr = localStorage.getItem('rs_client_change_requests');
      const existing: ClientChangeRequest[] = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem('rs_client_change_requests', JSON.stringify([newRequest, ...existing]));
    } catch {
      // ignore
    }

    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess(`Change Request ${ref} submitted! Your advisor has received the extracted data to review and dispatch to your nominated providers.`);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-full border border-indigo-100 mb-1">
              <ShieldCheck size={12} />
              FICA & Mandate Amendment Engine
            </div>
            <h2 className="text-xl font-bold text-slate-900">Change Details & Document Verification</h2>
            <p className="text-xs text-slate-500">
              Upload official supporting proof. Particulars are automatically extracted via AI vision and dispatched to your advisor.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 text-xs">
          {/* Category Tabs */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Select Type of Information to Update:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'BANKING', label: 'Banking Details', icon: CreditCard },
                { key: 'ADDRESS', label: 'Residential Address', icon: MapPin },
                { key: 'IDENTITY', label: 'Identity / Name', icon: User },
                { key: 'EMPLOYMENT', label: 'Job & Income', icon: Briefcase }
              ].map((c) => {
                const IconComponent = c.icon;
                const isSelected = category === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => {
                      setCategory(c.key as ChangeCategory);
                      setScanError(null);
                      setExtractedSuccess(false);
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm font-bold'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <IconComponent size={18} className={isSelected ? 'text-amber-400' : 'text-slate-500'} />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Document Upload & Extraction Zone */}
          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <UploadCloud size={16} className="text-indigo-600" />
                Upload Official Proof Document
              </span>
              <span className="text-[11px] text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full font-semibold">
                Gemini Vision Extraction
              </span>
            </div>
            <p className="text-slate-600 text-[11px]">
              {category === 'BANKING' && 'Upload a Bank Confirmation Letter, Recent Bank Statement, or Cancelled Cheque (not older than 3 months).'}
              {category === 'ADDRESS' && 'Upload a Municipal Rates Account, Water & Lights Bill, or Fiber Internet Invoice showing your address.'}
              {category === 'IDENTITY' && 'Upload your Smart ID Card (Front & Back), Green ID Book, or Valid Passport.'}
              {category === 'EMPLOYMENT' && 'Upload your latest Salary Payslip, IRP5 Tax Certificate, or Employment Confirmation Letter.'}
            </p>

            <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-2xl bg-white cursor-pointer transition text-center space-y-1">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                disabled={isScanning}
                className="sr-only"
              />
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1">
                {isScanning ? <Loader2 size={20} className="animate-spin" /> : <FileCheck size={20} />}
              </div>
              <strong className="text-slate-900 text-xs">
                {isScanning ? 'Extracting particulars with AI Vision...' : 'Click to Upload Document'}
              </strong>
              <span className="text-[11px] text-slate-400">PDF, JPG, PNG up to 10MB</span>
            </label>

            {scanError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-xs">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{scanError}</span>
              </div>
            )}

            {extractedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs">
                <Sparkles size={15} className="text-emerald-600 shrink-0" />
                <span>Document successfully scanned! Extracted particulars have been populated below for your review.</span>
              </div>
            )}
          </div>

          {/* Form Fields populated by extractor */}
          <div className="space-y-3">
            <span className="font-bold text-slate-900 block text-sm">
              Particulars to Update &bull; Review Extracted Information
            </span>

            {category === 'BANKING' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Bank Name:</label>
                  <input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Account Holder Name:</label>
                  <input
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Account Number:</label>
                  <input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono bg-white text-slate-900 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Universal Branch Code:</label>
                  <input
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono bg-white text-slate-900 text-xs"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-700">Account Type:</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                  >
                    <option value="Private Wealth Cheque Account">Private Wealth Cheque / Current Account</option>
                    <option value="Savings Account">Savings Account</option>
                    <option value="Transmission Account">Transmission Account</option>
                  </select>
                </div>
              </div>
            )}

            {category === 'ADDRESS' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-700">Physical Street Address:</label>
                  <input
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Suburb:</label>
                  <input
                    value={suburb}
                    onChange={(e) => setSuburb(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">City / Town:</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Postal Code:</label>
                  <input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono bg-white text-slate-900 text-xs"
                  />
                </div>
              </div>
            )}

            {category === 'IDENTITY' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Full Legal Name:</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">RSA ID / Passport Number:</label>
                  <input
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono bg-white text-slate-900 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Date of Birth:</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Gender:</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            )}

            {category === 'EMPLOYMENT' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Current Employer / Business:</label>
                  <input
                    value={employer}
                    onChange={(e) => setEmployer(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Job Title / Occupation:</label>
                  <input
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-semibold text-slate-700">Gross Monthly Income (ZAR):</label>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono bg-white text-slate-900 text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Target Providers to Notify */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="font-bold text-slate-900 block text-sm">
              Nominated Product Providers to Notify:
            </span>
            <p className="text-slate-500 text-[11px]">
              Your advisor will dispatch verified FICA documentation and instructions to the selected providers on your behalf.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                'Santam Insurance',
                'Allan Gray',
                'Discovery Invest & Insure',
                'Old Mutual Wealth',
                'Sanlam & Glacier',
                'Liberty Corporate'
              ].map((prov) => {
                const isChecked = targetProviders.includes(prov);
                return (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => toggleProvider(prov)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition cursor-pointer ${
                      isChecked
                        ? 'border-indigo-300 bg-indigo-50/70 text-indigo-900 font-semibold'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="text-[11px] truncate">{prov}</span>
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                        isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <CheckCircle2 size={12} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes for Advisor */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Optional Instructions for Advisor:</label>
            <textarea
              rows={2}
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="e.g. Please also update debit orders starting from next month's billing cycle..."
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || targetProviders.length === 0}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition cursor-pointer"
            >
              {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              <span>{isSubmitting ? 'Submitting to Advisor...' : 'Submit to Advisor for Provider Dispatch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
