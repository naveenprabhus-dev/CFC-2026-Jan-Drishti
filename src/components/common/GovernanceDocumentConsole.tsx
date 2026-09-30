import React, { useState } from 'react';
import { Project, GovernanceDocument, GovernanceDocType } from '../../types/domain';
import { apiClient, getSessionToken } from '../../services/api';
import { 
  FileText, 
  Download, 
  Upload, 
  CheckCircle, 
  Clock, 
  QrCode, 
  Printer, 
  FileSignature, 
  X, 
  Building2, 
  FileSearch, 
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface GovernanceDocumentConsoleProps {
  project: Project;
  docType: GovernanceDocType;
  onClose?: () => void;
  onDocumentActionSuccess?: (updatedProject: Project) => void;
  readOnly?: boolean;
}

export const GovernanceDocumentConsole: React.FC<GovernanceDocumentConsoleProps> = ({
  project,
  docType,
  onClose,
  onDocumentActionSuccess,
  readOnly = false,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Find the latest active document of this type
  const doc = (project.governanceDocuments || [])
    .filter(d => d.docType === docType)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const handleGenerateDocument = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const payload: any = { docType, notes };
      if (docType === 'FINANCIAL_SANCTION_ORDER') {
        payload.approvedAmount = project.recommendedAmount || project.funding.sanctioned || 0;
      }
      const updatedProj = await apiClient.generateGovernanceDocument(project.id, payload);
      if (onDocumentActionSuccess) {
        onDocumentActionSuccess(updatedProj);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate document.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUploadSignedDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doc) return;
    setIsUploading(true);
    setErrorMsg(null);
    try {
      const url = uploadUrl.trim() || `https://jandrishti.gov.in/vault/signed_${doc.id.toLowerCase()}.pdf`;
      const updatedProj = await apiClient.uploadSignedDocument(project.id, doc.id, { fileUrl: url });
      setUploadUrl('');
      if (onDocumentActionSuccess) {
        onDocumentActionSuccess(updatedProj);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload signed document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSimulatePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getDocTypeName = (type: GovernanceDocType) => {
    switch (type) {
      case 'CONTRACTOR_RECOMMENDATION':
        return 'Contractor Recommendation & Procurement Report';
      case 'FINANCIAL_SANCTION_ORDER':
        return 'Financial Sanction Order';
      case 'FUNDING_AUTHORIZATION_ORDER':
        return 'Funding & Treasury Authorization Order';
      case 'WORK_ORDER':
        return 'Official Work Order & Notice to Proceed';
      default:
        return type;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-7xl w-full mx-auto flex flex-col lg:flex-row min-h-[600px]">
      {/* Left Control Panel / Document Metadata Panel */}
      <div className="w-full lg:w-80 bg-slate-50 border-r border-slate-200 p-6 flex flex-col justify-between gap-6 shrink-0">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase font-mono block">Governance Node</span>
              <h4 className="font-extrabold text-sm text-slate-900">Document Console</h4>
            </div>
            {onClose && (
              <button 
                onClick={onClose} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Doc Status Indicator */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase font-mono block">Status Indicator</span>
              <div className="flex items-center gap-2">
                {doc ? (
                  doc.status === 'SIGNED_DOCUMENT_UPLOADED' ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Signed & Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      <span>Signature Pending</span>
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                    <span>Not Yet Generated</span>
                  </div>
                )}
              </div>
            </div>

            {doc && (
              <div className="space-y-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500 font-medium">
                <div>
                  <strong className="text-slate-700 block">Document ID:</strong>
                  <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-600 inline-block mt-0.5">{doc.id}</span>
                </div>
                <div>
                  <strong className="text-slate-700 block">Reference No:</strong>
                  <span className="font-mono text-[10px] text-slate-600 block mt-0.5">{doc.refNumber}</span>
                </div>
                <div>
                  <strong className="text-slate-700 block">Authority Owner:</strong>
                  <span className="block text-slate-600 mt-0.5">{doc.createdBy} ({doc.createdByRole})</span>
                </div>
                <div>
                  <strong className="text-slate-700 block">Generated On:</strong>
                  <span className="block text-slate-600 mt-0.5">{new Date(doc.createdAt).toLocaleString()}</span>
                </div>
                {doc.uploadedAt && (
                  <div className="border-t border-slate-100 pt-2 mt-2 space-y-1 bg-emerald-50/50 p-2 rounded-lg">
                    <div>
                      <strong className="text-emerald-950 block">Signed By:</strong>
                      <span className="text-emerald-900 block">{doc.uploadedBy} ({doc.uploadedByRole})</span>
                    </div>
                    <div>
                      <strong className="text-emerald-950 block">Uploaded On:</strong>
                      <span className="text-emerald-900 block">{new Date(doc.uploadedAt).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Generator Actions Panel */}
          {!readOnly && (
            <div className="space-y-4">
              {!doc ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">Administrative Notes / Findings</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Enter verification notes, instructions, or specific conditions..."
                      className="w-full h-24 p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    />
                  </div>
                  <button
                    onClick={handleGenerateDocument}
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <FileSignature className="w-4 h-4 text-emerald-400" />
                    <span>{isGenerating ? 'Generating...' : 'Generate Official Document'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button
                      onClick={handleSimulatePrint}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                      title="Simulate Print"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>
                    <a
                      href={`/api/projects/${project.id}/documents/${doc.id}/download?token=${encodeURIComponent(getSessionToken())}`}
                      download={`JanDrishti_${doc.docType.toLowerCase()}_${doc.refNumber}.pdf`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition text-center cursor-pointer"
                      title="Download Certified Record"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </a>
                  </div>

                  {doc.status !== 'SIGNED_DOCUMENT_UPLOADED' && (
                    <form onSubmit={handleUploadSignedDocument} className="space-y-3 bg-white rounded-2xl border border-slate-200 p-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 block font-mono">Sign & Seal Upload</label>
                        <input
                          type="text"
                          value={uploadUrl}
                          onChange={(e) => setUploadUrl(e.target.value)}
                          placeholder="Simulate signed PDF URL or path..."
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
                        />
                        <p className="text-[9px] text-slate-400 italic">Leave empty to auto-simulate signed government secure vault path.</p>
                      </div>
                      <button
                        type="submit"
                        disabled={isUploading}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploading ? 'Uploading...' : 'Upload Signed Copy'}</span>
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 pt-4 flex items-center gap-3">
          <QrCode className="w-10 h-10 text-slate-400" />
          <div className="text-[10px] text-slate-400 leading-normal font-medium">
            <span className="font-bold text-slate-600 block">DPI Decentralized Verification</span>
            Scan or copy reference ID to trace on Central JanDrishti Registry.
          </div>
        </div>
      </div>

      {/* Right Document Preview Area (High Fidelity Printed Report Sheet) */}
      <div className="flex-1 bg-slate-100 p-6 lg:p-12 overflow-y-auto max-h-[85vh] flex justify-center">
        {doc ? (
          <div className="bg-white border-2 border-slate-300 w-full max-w-3xl p-10 lg:p-12 shadow-lg relative font-serif text-slate-900 rounded-xs space-y-8 select-text">
            {/* Stamp/Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none rotate-12 flex flex-col items-center">
              <Building2 className="w-64 h-64 text-slate-900" />
              <span className="text-3xl font-black font-mono tracking-widest text-slate-900 mt-4">JANDRISHTI</span>
            </div>

            {/* Gov Seal Header */}
            <div className="flex flex-col items-center text-center space-y-2 border-b-2 border-slate-900 pb-5">
              <div className="w-12 h-12 rounded-full border-2 border-slate-900 flex items-center justify-center font-bold text-sm bg-slate-50">
                GOVT
              </div>
              <h1 className="text-xs font-black tracking-widest uppercase font-sans">Government of Tamil Nadu</h1>
              <h2 className="text-[10px] font-bold tracking-wider uppercase text-slate-600 font-sans">{project.department}</h2>
              <h3 className="text-sm font-extrabold tracking-wide uppercase pt-2 font-sans text-slate-950 underline decoration-slate-400 decoration-2 underline-offset-4">
                {doc.title}
              </h3>
              <div className="flex justify-between w-full text-[10px] font-mono text-slate-500 pt-3">
                <span>REF: {doc.refNumber}</span>
                <span>DATE: {new Date(doc.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            {/* Project / Bidding Context Section */}
            <div className="space-y-4 font-sans text-xs">
              <h4 className="font-bold border-b border-slate-300 pb-1 uppercase tracking-wider text-slate-900 font-sans text-[11px]">I. Administrative & Project Context</h4>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider font-sans">Work Action Token</span>
                  <span className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded text-[10px] font-bold inline-block mt-0.5">{doc.workTokenId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider font-sans">Project Identifier</span>
                  <span className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded text-[10px] font-bold inline-block mt-0.5">{doc.projectId}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider font-sans">Proposed Project Name</span>
                  <span className="text-slate-800 font-semibold">{project.name}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider font-sans">Operational Geography</span>
                  <span className="text-slate-800 font-medium">{project.district}, {project.state} (ULB: {project.homeULB || 'Urban Development Commission'})</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider font-sans">Approved Scope of Civil Works</span>
                  <p className="text-slate-800 leading-relaxed font-serif text-xs italic bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1">"{project.scopeOfWork}"</p>
                </div>
              </div>
            </div>

            {/* Specific Bidding / Sanction Information depending on Doc Type */}
            <div className="space-y-4 font-sans text-xs">
              <h4 className="font-bold border-b border-slate-300 pb-1 uppercase tracking-wider text-slate-900 font-sans text-[11px]">II. Bidding Details & Decision Findings</h4>
              
              {doc.docType === 'CONTRACTOR_RECOMMENDATION' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Recommended Contractor</span>
                      <strong className="text-slate-900 text-xs">{doc.contractorName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Recommended Amount</span>
                      <strong className="text-emerald-700 text-xs">{formatCurrency(doc.amount)}</strong>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Official Bidding Justification</span>
                    <p className="text-slate-800 font-serif leading-relaxed italic bg-slate-50 p-3 rounded-lg mt-1">
                      "{doc.generatedContent.justification}"
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[11px] space-y-1">
                    <span className="font-bold text-slate-800 block">Participating Contractor Audits</span>
                    <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                      {project.quotes?.map(q => (
                        <li key={q.id} className={q.contractorId === doc.contractorId ? 'font-bold text-slate-900' : ''}>
                          {q.contractorName}: Quoted {formatCurrency(q.quotedAmount)} · Score: {q.aiAnalysis?.score}/100
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {doc.docType === 'FINANCIAL_SANCTION_ORDER' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Approved Sanctioned Amount</span>
                      <strong className="text-emerald-700 text-xs">{formatCurrency(doc.amount)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Budget Ledger Head</span>
                      <strong className="text-slate-800 text-[10px] font-mono">{doc.generatedContent.budgetHead}</strong>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Technical & Sanction Findings</span>
                    <p className="text-slate-800 font-serif leading-relaxed italic bg-slate-50 p-3 rounded-lg mt-1">
                      "{doc.generatedContent.findings}"
                    </p>
                  </div>
                </div>
              )}

              {doc.docType === 'FUNDING_AUTHORIZATION_ORDER' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Authorized Disbursement Limit</span>
                      <strong className="text-emerald-700 text-xs">{formatCurrency(doc.amount)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Sanction Ref ID</span>
                      <strong className="text-slate-800 text-xs font-mono">{doc.generatedContent.sanctionRef}</strong>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Disbursement Releases & Conditions</span>
                    <p className="text-slate-800 font-serif leading-relaxed italic bg-slate-50 p-3 rounded-lg mt-1">
                      "{doc.generatedContent.conditions}"
                    </p>
                  </div>
                </div>
              )}

              {doc.docType === 'WORK_ORDER' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Approved Contract Value</span>
                      <strong className="text-emerald-700 text-xs">{formatCurrency(doc.amount)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Work Order Reference</span>
                      <strong className="text-slate-800 text-xs font-mono">{doc.refNumber}</strong>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Execution Scope, Milestones & Conditions</span>
                    <p className="text-slate-800 font-serif leading-relaxed italic bg-slate-50 p-3 rounded-lg mt-1">
                      "{doc.generatedContent.conditions || doc.generatedContent.scope}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Declaration Block */}
            <div className="space-y-3 border-t border-slate-300 pt-4 font-sans text-xs">
              <h4 className="font-bold uppercase tracking-wider text-[11px]">III. Declaration of Intent</h4>
              <p className="text-slate-600 leading-relaxed font-serif text-xs">
                I hereby declare that this {getDocTypeName(doc.docType)} is generated directly from the canonical digital ledger records of the JanDrishti Civic Platform. The technical proposals, contractor bids, on-site telemetry, and administrative verifications are validated, and this decision is hereby sealed and executed under my formal delegatory powers as an active institutional governor.
              </p>
            </div>

            {/* Signatures & Seal Placement Area */}
            <div className="border-t border-slate-300 pt-6 flex justify-between items-end gap-6 font-sans text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Office Seal</span>
                <div className="w-24 h-24 rounded-full border border-dashed border-slate-400 flex items-center justify-center text-[10px] text-slate-400 font-mono text-center p-2 select-none uppercase">
                  Government Office Seal Placeholder
                </div>
              </div>
              <div className="space-y-2 text-right">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Authorized Signatory</span>
                  <div className="font-serif italic text-base font-bold text-slate-900 pr-1 select-none">
                    {doc.uploadedBy ? `Signed / ${doc.uploadedBy}` : '______________________'}
                  </div>
                </div>
                <div className="text-[11px] text-slate-700 leading-normal font-medium">
                  <strong>{doc.createdBy}</strong>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider">{doc.generatedContent.authorityDesignation}</span>
                  <span className="block text-[9px] text-slate-400 font-mono">ID: {doc.createdByRole}</span>
                </div>
              </div>
            </div>

            {/* Central Platform Certification Tag */}
            <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-[9px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>SECURE JANDRISHTI DIGITAL THREAD VERIFIED</span>
              </div>
              <span>VER: {doc.version}.0</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-white border border-slate-200 rounded-3xl w-full max-w-md h-96 shadow-sm space-y-4">
            <FileText className="w-16 h-16 text-slate-300 animate-pulse" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-slate-900">Document Generation Pending</h4>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                The institutional {getDocTypeName(docType)} has not yet been generated for this governance phase.
              </p>
            </div>
            {!readOnly && (
              <button
                onClick={handleGenerateDocument}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                <FileSignature className="w-4 h-4 text-emerald-400" />
                <span>Generate Report Sheet</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
