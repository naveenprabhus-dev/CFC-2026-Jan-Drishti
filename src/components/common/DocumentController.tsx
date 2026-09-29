import React, { useState } from 'react';
import { Project, GovernanceDocument, GovernanceDocType, GovernanceDocStatus } from '../../types/domain';
import { apiClient } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Download,
  Upload,
  CheckCircle,
  Clock,
  Printer,
  FileSignature,
  Building2,
  QrCode,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Landmark,
  UserCheck,
  FileCheck,
  Check,
  ArrowRight,
  Info
} from 'lucide-react';

interface DocumentControllerProps {
  project: Project;
  onDocumentActionSuccess?: (updatedProject: Project) => void;
  readOnly?: boolean;
}

export const DocumentController: React.FC<DocumentControllerProps> = ({
  project,
  onDocumentActionSuccess,
  readOnly = false,
}) => {
  const { currentUser } = useAuth();
  const [activeStage, setActiveStage] = useState<'OFFICIAL' | 'SANCTIONER' | 'POLICYMAKER'>('OFFICIAL');
  
  // States for document operations
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [approvedAmount, setApprovedAmount] = useState<number>(project.recommendedAmount || project.funding.sanctioned || 4500000);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Helper to locate active documents for each stage
  const getDocForStage = (stage: 'OFFICIAL' | 'SANCTIONER' | 'POLICYMAKER') => {
    let type: GovernanceDocType = 'CONTRACTOR_RECOMMENDATION';
    if (stage === 'SANCTIONER') type = 'FINANCIAL_SANCTION_ORDER';
    if (stage === 'POLICYMAKER') type = 'FUNDING_AUTHORIZATION_ORDER';

    return (project.governanceDocuments || [])
      .filter(d => d.docType === type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  };

  const officialDoc = getDocForStage('OFFICIAL');
  const sanctionDoc = getDocForStage('SANCTIONER');
  const policymakerDoc = getDocForStage('POLICYMAKER');

  // Check stage eligibility
  const isStageActive = (stage: 'OFFICIAL' | 'SANCTIONER' | 'POLICYMAKER') => {
    if (stage === 'OFFICIAL') return true;
    if (stage === 'SANCTIONER') {
      // Sanction can only happen after Contractor Recommendation is SIGNED_DOCUMENT_UPLOADED
      return officialDoc && officialDoc.status === 'SIGNED_DOCUMENT_UPLOADED';
    }
    if (stage === 'POLICYMAKER') {
      // Policymaker can only happen after Financial Sanction is SIGNED_DOCUMENT_UPLOADED
      return sanctionDoc && sanctionDoc.status === 'SIGNED_DOCUMENT_UPLOADED';
    }
    return false;
  };

  const handleGenerate = async (stage: 'OFFICIAL' | 'SANCTIONER' | 'POLICYMAKER') => {
    setIsGenerating(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      let type: GovernanceDocType = 'CONTRACTOR_RECOMMENDATION';
      let payload: any = { notes };
      
      if (stage === 'SANCTIONER') {
        type = 'FINANCIAL_SANCTION_ORDER';
        payload.approvedAmount = Number(approvedAmount) || project.recommendedAmount || project.funding.sanctioned || 0;
      } else if (stage === 'POLICYMAKER') {
        type = 'FUNDING_AUTHORIZATION_ORDER';
      }

      payload.docType = type;

      const updatedProj = await apiClient.generateGovernanceDocument(project.id, payload);
      setNotes('');
      setSuccessMsg(`Official document generated successfully for ${getStageTitle(stage)}!`);
      if (onDocumentActionSuccess) {
        onDocumentActionSuccess(updatedProj);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate governance document.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSimulateDownload = async (doc: GovernanceDocument) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      // Trigger native download
      const jsonStr = JSON.stringify(doc, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `JanDrishti_${doc.refNumber}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Call server side to update status to SIGNATURE_PENDING or SIGNED_UPLOAD_PENDING
      // By simulating this update in the UI/Store, we advance workflow status to 'SIGNATURE_PENDING' or 'SIGNED_UPLOAD_PENDING'
      // Many government systems automatically flag a document as download pending signature
      setSuccessMsg('Document file downloaded. System moved status to SIGNATURE_PENDING.');
    } catch (err: any) {
      setErrorMsg('Failed to process document download simulation.');
    }
  };

  const handleUploadSigned = async (e: React.FormEvent, doc: GovernanceDocument) => {
    e.preventDefault();
    if (!doc) return;
    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const url = uploadUrl.trim() || `https://jandrishti.gov.in/vault/signed_${doc.id.toLowerCase()}.pdf`;
      const updatedProj = await apiClient.uploadSignedDocument(project.id, doc.id, { fileUrl: url });
      setUploadUrl('');
      setSuccessMsg('Signed and sealed governance document uploaded and active in the public ledger!');
      if (onDocumentActionSuccess) {
        onDocumentActionSuccess(updatedProj);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload signed document.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getStageTitle = (stage: 'OFFICIAL' | 'SANCTIONER' | 'POLICYMAKER') => {
    switch (stage) {
      case 'OFFICIAL': return 'Government Official Stage';
      case 'SANCTIONER': return 'Sanctioning Authority Stage';
      case 'POLICYMAKER': return 'Policymaker / Treasury Stage';
    }
  };

  const getDocName = (stage: 'OFFICIAL' | 'SANCTIONER' | 'POLICYMAKER') => {
    switch (stage) {
      case 'OFFICIAL': return 'Contractor Recommendation Report';
      case 'SANCTIONER': return 'Financial Sanction Order';
      case 'POLICYMAKER': return 'Funding & Treasury Authorization Order';
    }
  };

  const getRequiredRoleName = (stage: 'OFFICIAL' | 'SANCTIONER' | 'POLICYMAKER') => {
    switch (stage) {
      case 'OFFICIAL': return 'Government Official (OFFICIAL)';
      case 'SANCTIONER': return 'Sanctioning Authority (SANCTIONING_AUTHORITY)';
      case 'POLICYMAKER': return 'Cabinet / Treasury Officer (POLICYMAKER)';
    }
  };

  const getStageStatusLabel = (doc?: GovernanceDocument) => {
    if (!doc) return { text: 'Not Yet Initiated', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    switch (doc.status) {
      case 'GENERATED':
        return { text: 'Generated (Draft)', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'DOWNLOADED':
        return { text: 'Downloaded', bg: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'SIGNATURE_PENDING':
      case 'SIGNED_UPLOAD_PENDING':
        return { text: 'Signature/Scan Pending', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'SIGNED_DOCUMENT_UPLOADED':
      case 'VERIFIED':
        return { text: 'Signed & Certified', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { text: doc.status, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const currentDoc = getDocForStage(activeStage);
  const currentStageEligible = isStageActive(activeStage);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-5xl w-full mx-auto flex flex-col">
      {/* Top Header section */}
      <div className="bg-slate-900 px-6 py-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-widest uppercase font-mono px-2 py-0.5 rounded-md border border-emerald-500/30">
              Three-Stage Governance
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Governance Document Controller</h2>
          <p className="text-xs text-slate-400">
            Audit-safe, document-driven digital handoffs connecting procurement, technical verification, and treasury.
          </p>
        </div>
        
        {/* Project reference mini card */}
        <div className="bg-slate-800/80 rounded-xl px-4 py-2 border border-slate-700/50 text-[11px] font-mono space-y-0.5">
          <div><span className="text-slate-500 font-bold uppercase">Token:</span> <span className="text-slate-200 font-bold">{project.workTokenId}</span></div>
          <div><span className="text-slate-500 font-bold uppercase">Project:</span> <span className="text-slate-200 font-bold">{project.id}</span></div>
        </div>
      </div>

      {/* Visual Pipeline Stepper */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stage 1: Official */}
        <button
          onClick={() => setActiveStage('OFFICIAL')}
          className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition ${
            activeStage === 'OFFICIAL'
              ? 'bg-white border-slate-300 shadow-xs ring-2 ring-emerald-500/10'
              : 'hover:bg-slate-100 border-transparent'
          }`}
        >
          <div className={`p-2 rounded-xl shrink-0 ${
            officialDoc?.status === 'SIGNED_DOCUMENT_UPLOADED'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-200 text-slate-600'
          }`}>
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase font-mono block">Stage 1: Official</span>
            <span className="text-xs font-bold text-slate-800 block truncate">Contractor Recommendation</span>
            <div className="mt-1 flex items-center gap-1.5">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${getStageStatusLabel(officialDoc).bg}`}>
                {getStageStatusLabel(officialDoc).text}
              </span>
            </div>
          </div>
        </button>

        {/* Stage 2: Sanctioner */}
        <button
          onClick={() => setActiveStage('SANCTIONER')}
          disabled={!isStageActive('SANCTIONER')}
          className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition ${
            !isStageActive('SANCTIONER')
              ? 'opacity-50 cursor-not-allowed bg-slate-100/50'
              : activeStage === 'SANCTIONER'
              ? 'bg-white border-slate-300 shadow-xs ring-2 ring-emerald-500/10'
              : 'hover:bg-slate-100 border-transparent'
          }`}
        >
          <div className={`p-2 rounded-xl shrink-0 ${
            sanctionDoc?.status === 'SIGNED_DOCUMENT_UPLOADED'
              ? 'bg-emerald-100 text-emerald-700'
              : isStageActive('SANCTIONER')
              ? 'bg-slate-200 text-slate-600'
              : 'bg-slate-100 text-slate-400'
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase font-mono block">Stage 2: Sanctioner</span>
            <span className="text-xs font-bold text-slate-800 block truncate">Financial Sanction Order</span>
            <div className="mt-1 flex items-center gap-1.5">
              {!isStageActive('SANCTIONER') ? (
                <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md">
                  Waiting for Stage 1
                </span>
              ) : (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${getStageStatusLabel(sanctionDoc).bg}`}>
                  {getStageStatusLabel(sanctionDoc).text}
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Stage 3: Policymaker */}
        <button
          onClick={() => setActiveStage('POLICYMAKER')}
          disabled={!isStageActive('POLICYMAKER')}
          className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition ${
            !isStageActive('POLICYMAKER')
              ? 'opacity-50 cursor-not-allowed bg-slate-100/50'
              : activeStage === 'POLICYMAKER'
              ? 'bg-white border-slate-300 shadow-xs ring-2 ring-emerald-500/10'
              : 'hover:bg-slate-100 border-transparent'
          }`}
        >
          <div className={`p-2 rounded-xl shrink-0 ${
            policymakerDoc?.status === 'SIGNED_DOCUMENT_UPLOADED'
              ? 'bg-emerald-100 text-emerald-700'
              : isStageActive('POLICYMAKER')
              ? 'bg-slate-200 text-slate-600'
              : 'bg-slate-100 text-slate-400'
          }`}>
            <Landmark className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase font-mono block">Stage 3: Policymaker</span>
            <span className="text-xs font-bold text-slate-800 block truncate">Funding Authorization</span>
            <div className="mt-1 flex items-center gap-1.5">
              {!isStageActive('POLICYMAKER') ? (
                <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md">
                  Waiting for Stage 2
                </span>
              ) : (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${getStageStatusLabel(policymakerDoc).bg}`}>
                  {getStageStatusLabel(policymakerDoc).text}
                </span>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Main Workspace Layout split into Control Area and Document View */}
      <div className="flex flex-col lg:flex-row min-h-[500px]">
        
        {/* Left Side: Controller Operations */}
        <div className="w-full lg:w-96 bg-slate-50 p-6 border-r border-slate-200 flex flex-col justify-between gap-6 shrink-0">
          
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">Operations Hub</span>
              <h3 className="font-extrabold text-base text-slate-900 mt-0.5">{getStageTitle(activeStage)}</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Authorize, generate, download, physically sign/seal and scan-upload to secure legal records.
              </p>
            </div>

            {/* Error and Success Banners */}
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-800 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-800 flex gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Active stage details panel */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase font-mono block">Status Indicator</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg border inline-block ${getStageStatusLabel(currentDoc).bg}`}>
                  {getStageStatusLabel(currentDoc).text}
                </span>
              </div>

              {/* Required Signatory info */}
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-[11px] space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Required Signatory</span>
                </div>
                <div className="text-slate-600 text-[10px] leading-relaxed">
                  Only {getRequiredRoleName(activeStage)} accounts are legally authorized to generate and seal this specific workflow milestone.
                </div>
              </div>

              {currentDoc && (
                <div className="space-y-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500 font-medium">
                  <div>
                    <strong className="text-slate-700 block">Doc Reference No:</strong>
                    <span className="font-mono text-[10px] text-slate-600 block mt-0.5">{currentDoc.refNumber}</span>
                  </div>
                  <div>
                    <strong className="text-slate-700 block">Originator Profile:</strong>
                    <span className="block text-slate-600 mt-0.5">{currentDoc.createdBy} ({currentDoc.createdByRole})</span>
                  </div>
                  <div>
                    <strong className="text-slate-700 block">System Timestamp:</strong>
                    <span className="block text-slate-600 mt-0.5">{new Date(currentDoc.createdAt).toLocaleString()}</span>
                  </div>

                  {currentDoc.uploadedAt && (
                    <div className="border-t border-slate-100 pt-2.5 mt-2 space-y-1.5 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                      <div>
                        <strong className="text-emerald-950 block text-[10px] font-black uppercase">Physical Upload Verification</strong>
                        <span className="text-emerald-900 block mt-0.5 font-semibold text-[10px]">{currentDoc.uploadedBy} ({currentDoc.uploadedByRole})</span>
                      </div>
                      <div>
                        <strong className="text-emerald-950 block text-[10px] font-black uppercase">Timestamp</strong>
                        <span className="text-emerald-900 block mt-0.5">{new Date(currentDoc.uploadedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Workflow Control Stage Actions */}
            {!readOnly && (
              <div className="space-y-4">
                {!currentDoc ? (
                  /* Form to Generate Document */
                  <div className="space-y-4">
                    {activeStage === 'SANCTIONER' && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 block font-mono">Sanctioned Amount (INR)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                          <input
                            type="number"
                            value={approvedAmount}
                            onChange={(e) => setApprovedAmount(Number(e.target.value))}
                            className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-bold"
                            placeholder="Enter sanctioned sum"
                          />
                        </div>
                        <p className="text-[9px] text-slate-400">Defaulting to official recommendation amount.</p>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 block font-mono">Findings & Sealing Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Provide explicit reasons, observations, or legal clauses..."
                        className="w-full h-24 p-3 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <button
                      onClick={() => handleGenerate(activeStage)}
                      disabled={isGenerating}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      <FileSignature className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span>{isGenerating ? 'Generating...' : 'Generate and Lock Document'}</span>
                    </button>
                  </div>
                ) : (
                  /* Action to Download/Print and Upload Signed copy */
                  <div className="space-y-4">
                    {/* Step 1: Download Draft Copy */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 block font-mono">Step 1: Download & Print</label>
                      <button
                        onClick={() => handleSimulateDownload(currentDoc)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>Download Certified Record</span>
                      </button>
                    </div>

                    {/* Step 2: Upload Signed Document */}
                    {currentDoc.status !== 'SIGNED_DOCUMENT_UPLOADED' && (
                      <form onSubmit={(e) => handleUploadSigned(e, currentDoc)} className="space-y-3 bg-white rounded-2xl border border-slate-200 p-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 block font-mono">Step 2: Sign, Seal & Scan Upload</label>
                          <input
                            type="text"
                            value={uploadUrl}
                            onChange={(e) => setUploadUrl(e.target.value)}
                            placeholder="Enter signed PDF URL or secure storage URI..."
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
                          />
                          <p className="text-[9px] text-slate-400 italic">Leave blank to auto-simulate official public security vault reference.</p>
                        </div>
                        <button
                          type="submit"
                          disabled={isUploading}
                          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploading ? 'Uploading...' : 'Commit Signed Document'}</span>
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Secure cryptographic thread info */}
          <div className="border-t border-slate-200 pt-4 flex items-center gap-3">
            <QrCode className="w-10 h-10 text-slate-400 shrink-0" />
            <div className="text-[10px] text-slate-400 leading-normal font-medium">
              <span className="font-bold text-slate-600 block uppercase">Public Blockchain Audit</span>
              State hashes and signatures are cryptographically committed to the central JanDrishti audit thread.
            </div>
          </div>
        </div>

        {/* Right Side: Beautiful Government Document Viewer */}
        <div className="flex-1 bg-slate-100 p-6 md:p-8 overflow-y-auto max-h-[85vh] flex justify-center">
          {currentDoc ? (
            <div className="bg-white border-2 border-slate-300 w-full max-w-xl p-8 md:p-10 shadow-lg relative font-serif text-slate-900 rounded-sm space-y-6 select-text">
              {/* Background watermark seal */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none rotate-12 flex flex-col items-center">
                <Building2 className="w-56 h-56 text-slate-900" />
                <span className="text-2xl font-black font-mono tracking-widest text-slate-900 mt-4">JANDRISHTI</span>
              </div>

              {/* State Emblem/Seal Header */}
              <div className="flex flex-col items-center text-center space-y-1.5 border-b-2 border-slate-900 pb-4">
                <div className="w-11 h-11 rounded-full border border-slate-900 flex items-center justify-center font-bold text-xs bg-slate-50 uppercase tracking-widest font-sans">
                  Govt
                </div>
                <h1 className="text-xs font-black tracking-widest uppercase font-sans text-slate-900">Government of Tamil Nadu</h1>
                <h2 className="text-[9px] font-bold tracking-wider uppercase text-slate-600 font-sans">{project.department}</h2>
                <h3 className="text-sm font-black tracking-wide uppercase pt-1.5 font-sans text-slate-950 underline decoration-slate-400 decoration-1 underline-offset-4">
                  {getDocName(activeStage)}
                </h3>
                <div className="flex justify-between w-full text-[9px] font-mono text-slate-500 pt-3">
                  <span>REF: {currentDoc.refNumber}</span>
                  <span>DATE: {new Date(currentDoc.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>

              {/* Section I: Context Block */}
              <div className="space-y-3 font-sans text-xs">
                <h4 className="font-extrabold border-b border-slate-200 pb-0.5 uppercase tracking-wider text-slate-900 text-[10px] font-sans">I. Governance & Identity Context</h4>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[9px] font-bold uppercase">Work Action Token</span>
                    <span className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded text-[9px] font-bold inline-block">{project.workTokenId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] font-bold uppercase">Project Identifier</span>
                    <span className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded text-[9px] font-bold inline-block">{project.id}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[9px] font-bold uppercase">Proposed Project Name</span>
                    <span className="text-slate-800 font-bold">{project.name}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[9px] font-bold uppercase">Administrative Geography</span>
                    <span className="text-slate-800 font-medium">
                      {project.district}, {project.state || 'Tamil Nadu'} {project.homeULB ? `(ULB: ${project.homeULB})` : ''}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[9px] font-bold uppercase">Approved Scope of Work</span>
                    <p className="text-slate-700 leading-relaxed font-serif text-[11px] italic bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1">
                      "{project.scopeOfWork}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Section II: Specific Details */}
              <div className="space-y-3 font-sans text-xs">
                <h4 className="font-extrabold border-b border-slate-200 pb-0.5 uppercase tracking-wider text-slate-900 text-[10px] font-sans">II. Decision Findings & Specifics</h4>
                
                {activeStage === 'OFFICIAL' && (
                  <div className="space-y-2 text-[11px]">
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Recommended Contractor</span>
                        <strong className="text-slate-900 text-xs">{project.recommendedContractorName || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Recommended Quote Sum</span>
                        <strong className="text-emerald-700 text-xs">{formatCurrency(project.recommendedAmount || 0)}</strong>
                      </div>
                    </div>
                    {currentDoc.notes && (
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Official Recommendation Justification</span>
                        <p className="text-slate-700 font-serif italic mt-0.5 bg-slate-50/50 p-2 rounded-lg">"{currentDoc.notes}"</p>
                      </div>
                    )}
                  </div>
                )}

                {activeStage === 'SANCTIONER' && (
                  <div className="space-y-2 text-[11px]">
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Approved Sanction Sum</span>
                        <strong className="text-emerald-700 text-xs">{formatCurrency(currentDoc.amount)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Awardee Contractor</span>
                        <strong className="text-slate-900 text-xs">{project.recommendedContractorName || 'N/A'}</strong>
                      </div>
                    </div>
                    {currentDoc.notes && (
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Sanctioning Conditions & Findings</span>
                        <p className="text-slate-700 font-serif italic mt-0.5 bg-slate-50/50 p-2 rounded-lg">"{currentDoc.notes}"</p>
                      </div>
                    )}
                  </div>
                )}

                {activeStage === 'POLICYMAKER' && (
                  <div className="space-y-2 text-[11px]">
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Treasury Authorization Sum</span>
                        <strong className="text-emerald-700 text-xs">{formatCurrency(project.funding.sanctioned || currentDoc.amount)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Ledger Head</span>
                        <strong className="text-slate-800 text-xs">PWD-CAP-INFRA-800</strong>
                      </div>
                    </div>
                    {currentDoc.notes && (
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Cabinet Treasury Release Clauses</span>
                        <p className="text-slate-700 font-serif italic mt-0.5 bg-slate-50/50 p-2 rounded-lg">"{currentDoc.notes}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section III: Formal Declaration and Signatures */}
              <div className="space-y-4 font-sans text-xs">
                <h4 className="font-extrabold border-b border-slate-200 pb-0.5 uppercase tracking-wider text-slate-900 text-[10px] font-sans">III. Legal Declaration & Sealing Area</h4>
                <p className="text-[10px] text-slate-500 font-serif leading-relaxed italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-200">
                  "By order of the Governor and the digital signature on this record, the signing authority certifies that the project budget, contractor quotes, and technical blueprints conform strictly to the state treasury specifications and local government administrative sanction acts."
                </p>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-[10px] leading-relaxed">
                  {/* Left Signature: Originator */}
                  <div className="space-y-1">
                    <span className="text-slate-400 block uppercase font-bold text-[8px]">I. Authorizing Official</span>
                    <div className="h-10 flex items-end justify-start font-serif font-black tracking-wide text-slate-800 text-xs italic opacity-85">
                      {currentDoc.createdBy}
                    </div>
                    <div className="border-t border-slate-300 pt-1 text-slate-600">
                      <span className="font-bold block text-slate-700">{currentDoc.createdBy}</span>
                      <span className="block text-slate-400 text-[9px]">{currentDoc.createdByRole}</span>
                    </div>
                  </div>

                  {/* Right Signature: Wet Signature / Upload Seal */}
                  <div className="space-y-1 text-right">
                    <span className="text-slate-400 block uppercase font-bold text-[8px] text-right">II. Physical Seal & Verification</span>
                    <div className="h-10 flex items-end justify-end">
                      {currentDoc.status === 'SIGNED_DOCUMENT_UPLOADED' ? (
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] bg-emerald-50 text-emerald-800 font-bold border border-emerald-300 px-2 py-0.5 rounded-md uppercase font-mono tracking-wider">
                            SECURE SEALED
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-amber-600 font-bold bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-md uppercase font-mono tracking-wider animate-pulse">
                          Awaiting Seal
                        </span>
                      )}
                    </div>
                    <div className="border-t border-slate-300 pt-1 text-slate-600">
                      {currentDoc.status === 'SIGNED_DOCUMENT_UPLOADED' ? (
                        <>
                          <span className="font-bold block text-emerald-700">{currentDoc.uploadedBy}</span>
                          <span className="block text-emerald-500 text-[9px]">{currentDoc.uploadedByRole}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold block text-slate-400">Scan & Seal Pending</span>
                          <span className="block text-slate-400 text-[9px]">Awaiting physical signed copy upload</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Document integrity check summary */}
              <div className="border-t-2 border-dashed border-slate-300 pt-4 flex justify-between items-center text-[9px] text-slate-400 font-mono">
                <div>HASH: {currentDoc.id.slice(0, 10).toUpperCase()}...</div>
                <div className="flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>JANDRISHTI DIGITAL LEDGER RECORD v{currentDoc.version || '1.0'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-12 max-w-md bg-white rounded-3xl border border-slate-200 shadow-md">
              <FileText className="w-16 h-16 text-slate-300 mb-4 animate-bounce" />
              <h3 className="font-extrabold text-lg text-slate-900 uppercase tracking-wide">Document Not Yet Created</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                The {getDocName(activeStage)} has not been drafted. You must fulfill previous stages first, then click "Generate and Lock Document" on the control hub to start compiling.
              </p>
              
              {/* If previous stage is not done, show warning */}
              {!currentStageEligible && (
                <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] p-3 rounded-2xl flex gap-2 text-left">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    You cannot generate this document yet because the previous stage document has not been signed & uploaded. Complete and verify all prior document milestones first.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
