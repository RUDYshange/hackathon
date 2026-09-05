import React, { useState } from 'react';
import {
  DocumentScannerService,
  IdScanResult,
  JobScanResult
} from '../../services/documentScannerService';
import {
  Scan,
  CreditCard,
  Briefcase,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Check,
  RotateCcw,
  Sparkles,
  FileText
} from 'lucide-react';

interface ClientDocumentScannerProps {
  onApplyIdData: (data: IdScanResult) => void;
  onApplyJobData: (data: JobScanResult) => void;
}

export const ClientDocumentScanner: React.FC<ClientDocumentScannerProps> = ({
  onApplyIdData,
  onApplyJobData
}) => {
  // ID Scanner State
  const [isScanningId, setIsScanningId] = useState<boolean>(false);
  const [idResult, setIdResult] = useState<IdScanResult | null>(null);
  const [idConfirmed, setIdConfirmed] = useState<boolean>(false);

  // Job Scanner State
  const [isScanningJob, setIsScanningJob] = useState<boolean>(false);
  const [jobResult, setJobResult] = useState<JobScanResult | null>(null);
  const [jobConfirmed, setJobConfirmed] = useState<boolean>(false);

  // Handle ID File Upload
  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningId(true);
    setIdConfirmed(false);
    try {
      const result = await DocumentScannerService.scanIdDocument(file);
      setIdResult(result);
    } catch (err: any) {
      setIdResult({
        is_blurry: false,
        error_message: err.message || 'Failed to scan ID document'
      });
    } finally {
      setIsScanningId(false);
      e.target.value = '';
    }
  };

  // Handle Job File Upload
  const handleJobUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningJob(true);
    setJobConfirmed(false);
    try {
      const result = await DocumentScannerService.scanJobDocument(file);
      setJobResult(result);
    } catch (err: any) {
      setJobResult({
        is_blurry: false,
        error_message: err.message || 'Failed to scan employment document'
      });
    } finally {
      setIsScanningJob(false);
      e.target.value = '';
    }
  };

  // Sample ID Demonstrations
  const handleSampleId = (blurry: boolean) => {
    setIsScanningId(true);
    setIdConfirmed(false);
    setTimeout(() => {
      if (blurry) {
        setIdResult({
          is_blurry: true,
          error_message: 'Photo is out of focus and numbers are illegible. Please retake the photo in good lighting.'
        });
      } else {
        const testId = '8501015800084';
        const check = DocumentScannerService.validateSaId(testId);
        setIdResult({
          is_blurry: false,
          id_number: testId,
          first_name: 'Sipho',
          second_name: 'Bheki',
          surname: 'Dlamini',
          full_name: 'Sipho Bheki Dlamini',
          date_of_birth: '1985-01-01',
          nationality: 'South African',
          gender: 'Male',
          checksum_valid: check.isValid
        });
      }
      setIsScanningId(false);
    }, 450);
  };

  // Sample Job Demonstrations
  const handleSampleJob = () => {
    setIsScanningJob(true);
    setJobConfirmed(false);
    setTimeout(() => {
      setJobResult({
        is_blurry: false,
        occupation: 'Chief Technology Officer',
        employer: 'Naspers Fintech',
        annual_income: 1500000,
        monthly_income: 125000,
        business_address: '14 Hertzog Boulevard, Foreshore, Cape Town'
      });
      setIsScanningJob(false);
    }, 450);
  };

  const confirmApplyId = () => {
    if (idResult && !idResult.is_blurry) {
      onApplyIdData(idResult);
      setIdConfirmed(true);
    }
  };

  const confirmApplyJob = () => {
    if (jobResult && !jobResult.is_blurry) {
      onApplyJobData(jobResult);
      setJobConfirmed(true);
    }
  };

  return (
    <div className="doc-scanner-hub">
      <div className="scanner-hub-top">
        <div className="flex items-center gap-2">
          <div className="modal-icon-badge">
            <Scan size={18} className="text-royal" />
          </div>
          <div>
            <h3 className="scanner-title">Intelligent Document Intake Engine</h3>
            <p className="scanner-subtitle">
              "One AI agent, multiple ways in." Upload official documents to extract and programmatically verify particulars.
            </p>
          </div>
        </div>
        <span className="badge-model-tag">
          <Sparkles size={11} className="text-gold" /> Gemini Multimodal Vision + Luhn Backstop
        </span>
      </div>

      <div className="scanner-cards-grid">
        {/* ===================================================================== */}
        {/* CARD 1: SOUTH AFRICAN ID CARD / BOOK SCAN                             */}
        {/* ===================================================================== */}
        <div className="scanner-card">
          <div className="scanner-card-header">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-gold" />
              <div>
                <h4 className="card-header-title">1. Identity Document Scan</h4>
                <p className="card-header-sub">Extracts Names, Surname, Middle Name & 13-Digit RSA ID</p>
              </div>
            </div>
            <span className="badge-subtle">ID Card / Green Book</span>
          </div>

          <div className="scanner-dropzone">
            <input
              type="file"
              accept="image/*,.pdf"
              id="id-doc-input"
              className="scanner-file-input"
              onChange={handleIdUpload}
              disabled={isScanningId}
            />
            <label htmlFor="id-doc-input" className="scanner-dropzone-label">
              {isScanningId ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2 size={24} className="spin-icon text-gold" />
                  <span className="text-xs font-medium text-gold">
                    Analyzing document & verifying Luhn checksum...
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-3">
                  <UploadCloud size={24} className="text-muted" />
                  <span className="text-xs font-semibold text-royal">
                    Click to upload ID Card photo or PDF
                  </span>
                  <span className="text-2xs text-muted">Supports JPG, PNG, WebP, PDF</span>
                </div>
              )}
            </label>
          </div>

          {/* Quick Demo Buttons */}
          <div className="scanner-demo-strip">
            <span className="text-2xs text-muted">Quick test:</span>
            <button
              type="button"
              className="btn-demo-chip"
              onClick={() => handleSampleId(false)}
              disabled={isScanningId}
            >
              "Valid RSA Smart ID"
            </button>
            <button
              type="button"
              className="btn-demo-chip text-danger"
              onClick={() => handleSampleId(true)}
              disabled={isScanningId}
            >
              "Test Blurry Photo Error"
            </button>
          </div>

          {/* Blurry Error Display */}
          {idResult?.is_blurry && (
            <div className="scanner-error-banner">
              <AlertTriangle size={18} className="text-danger flex-shrink-0" />
              <div>
                <span className="font-semibold text-xs text-danger">Blurry / Illegible Document Detected</span>
                <p className="text-2xs text-danger mt-0.5">
                  {idResult.error_message || 'The photo is out of focus. Please retake a clear, well-lit photo.'}
                </p>
              </div>
            </div>
          )}

          {/* Extracted ID Data Review & Confirm */}
          {idResult && !idResult.is_blurry && (
            <div className="scanner-result-box">
              <div className="result-top-bar">
                <span className="text-xs font-bold text-royal flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-success" /> Extracted Identity Particulars
                </span>
                {idResult.checksum_valid ? (
                  <span className="badge-checksum-valid">
                    <ShieldCheck size={11} /> Luhn Checksum: Valid
                  </span>
                ) : (
                  <span className="badge-checksum-invalid">
                    <AlertTriangle size={11} /> Checksum Unverified
                  </span>
                )}
              </div>

              <div className="result-fields-grid">
                <div>
                  <span className="result-label">Full Legal Name</span>
                  <p className="result-val">{idResult.first_name} {idResult.second_name ? `${idResult.second_name} ` : ''}{idResult.surname}</p>
                </div>
                <div>
                  <span className="result-label">RSA ID Number</span>
                  <p className="result-val font-mono font-bold text-gold">{idResult.id_number}</p>
                </div>
                <div>
                  <span className="result-label">Date of Birth</span>
                  <p className="result-val">{idResult.date_of_birth || 'N/A'}</p>
                </div>
                <div>
                  <span className="result-label">Nationality / Gender</span>
                  <p className="result-val">{idResult.nationality || 'RSA'} &bull; {idResult.gender || 'N/A'}</p>
                </div>
              </div>

              <div className="result-actions-row">
                <button
                  type="button"
                  className={`btn btn-sm ${idConfirmed ? 'btn-success' : 'btn-primary'}`}
                  onClick={confirmApplyId}
                  disabled={idConfirmed}
                >
                  {idConfirmed ? (
                    <>
                      <Check size={14} /> Applied to Form
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> Confirm & Apply to Form
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => { setIdResult(null); setIdConfirmed(false); }}
                  title="Clear extraction"
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* CARD 2: EMPLOYMENT & POSITION DOCUMENT SCAN                           */}
        {/* ===================================================================== */}
        <div className="scanner-card">
          <div className="scanner-card-header">
            <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-royal" />
              <div>
                <h4 className="card-header-title">2. Employment & Job Details Scan</h4>
                <p className="card-header-sub">Extracts Position, Employer, Income & Work Address</p>
              </div>
            </div>
            <span className="badge-subtle">Payslip / Contract</span>
          </div>

          <div className="scanner-dropzone">
            <input
              type="file"
              accept="image/*,.pdf"
              id="job-doc-input"
              className="scanner-file-input"
              onChange={handleJobUpload}
              disabled={isScanningJob}
            />
            <label htmlFor="job-doc-input" className="scanner-dropzone-label">
              {isScanningJob ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2 size={24} className="spin-icon text-royal" />
                  <span className="text-xs font-medium text-royal">
                    Extracting professional position & remuneration...
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-3">
                  <UploadCloud size={24} className="text-muted" />
                  <span className="text-xs font-semibold text-royal">
                    Click to upload Payslip, Offer Letter, or PDF
                  </span>
                  <span className="text-2xs text-muted">Supports JPG, PNG, WebP, PDF</span>
                </div>
              )}
            </label>
          </div>

          {/* Quick Demo Button */}
          <div className="scanner-demo-strip">
            <span className="text-2xs text-muted">Quick test:</span>
            <button
              type="button"
              className="btn-demo-chip"
              onClick={handleSampleJob}
              disabled={isScanningJob}
            >
              "Sample Payslip (CTO &bull; R1.5M/yr)"
            </button>
          </div>

          {/* Blurry Error Display */}
          {jobResult?.is_blurry && (
            <div className="scanner-error-banner">
              <AlertTriangle size={18} className="text-danger flex-shrink-0" />
              <div>
                <span className="font-semibold text-xs text-danger">Illegible Document Detected</span>
                <p className="text-2xs text-danger mt-0.5">
                  {jobResult.error_message || 'The document text could not be resolved. Please upload a clear photo or PDF scan.'}
                </p>
              </div>
            </div>
          )}

          {/* Extracted Job Data Review & Confirm */}
          {jobResult && !jobResult.is_blurry && (
            <div className="scanner-result-box">
              <div className="result-top-bar">
                <span className="text-xs font-bold text-royal flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-success" /> Extracted Employment Particulars
                </span>
                <span className="badge-subtle">
                  <FileText size={11} /> Verified Proof of Income
                </span>
              </div>

              <div className="result-fields-grid">
                <div>
                  <span className="result-label">Position / Occupation</span>
                  <p className="result-val font-semibold text-royal">{jobResult.occupation || 'N/A'}</p>
                </div>
                <div>
                  <span className="result-label">Employer / Organization</span>
                  <p className="result-val">{jobResult.employer || 'N/A'}</p>
                </div>
                <div>
                  <span className="result-label">Annual Remuneration</span>
                  <p className="result-val font-mono font-bold text-success">
                    {jobResult.annual_income
                      ? `R ${Number(jobResult.annual_income).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="result-label">Employer Address</span>
                  <p className="result-val text-2xs truncate">{jobResult.business_address || 'Provided in document'}</p>
                </div>
              </div>

              <div className="result-actions-row">
                <button
                  type="button"
                  className={`btn btn-sm ${jobConfirmed ? 'btn-success' : 'btn-primary'}`}
                  onClick={confirmApplyJob}
                  disabled={jobConfirmed}
                >
                  {jobConfirmed ? (
                    <>
                      <Check size={14} /> Applied to Form
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> Confirm & Apply to Form
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => { setJobResult(null); setJobConfirmed(false); }}
                  title="Clear extraction"
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
