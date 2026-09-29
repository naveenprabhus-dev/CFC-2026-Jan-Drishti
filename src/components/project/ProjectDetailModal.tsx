import React, { useState, useEffect } from 'react';
import {
  Project,
  Milestone,
  ContractorEvidence,
  OfficialInspection,
  CommunityObservation,
  AuditEvent,
  UserSession,
  GovernanceDocType,
} from '../../types/domain';
import { apiClient } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { GovernanceDocumentConsole } from '../common/GovernanceDocumentConsole';
import { DocumentController } from '../common/DocumentController';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { DigitalThreadBadge } from '../common/DigitalThreadBadge';
import { EvidenceImage } from '../common/EvidenceImage';
import { LifecycleTimeline } from '../common/LifecycleTimeline';
import { InspectionModal } from '../official/InspectionModal';
import { AssignContractorModal } from '../official/AssignContractorModal';
import {
  evaluateMilestonePrerequisites,
  evaluateProjectCompletionEligibility,
} from '../../utils/milestoneGovernance';
import {
  X,
  Building2,
  HardHat,
  ShieldCheck,
  Calendar,
  Layers,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Eye,
  Landmark,
  Lock,
  Check,
  FileText,
  Clock,
  Hammer,
  ArrowRight,
} from 'lucide-react';

interface ProjectDetailModalProps {
  projectId: string;
  onClose: () => void;
  onProjectUpdated?: () => void;
  onOpenSubmitEvidence?: (project: Project, milestone: Milestone, isRework?: boolean) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  projectId,
  onClose,
  onProjectUpdated,
  onOpenSubmitEvidence,
}) => {
  const { currentUser, allUsers } = useAuth();
  const [projectData, setProjectData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'GOVERNANCE' | 'MILESTONES' | 'EVIDENCE' | 'FUNDING' | 'INSPECTIONS' | 'AUDIT'
  >('OVERVIEW');

  const [selectedDocType, setSelectedDocType] = useState<GovernanceDocType>('CONTRACTOR_RECOMMENDATION');

  // Automatically focus on the document type matching the current stage
  useEffect(() => {
    if (projectData) {
      if (projectData.status === 'CONTRACTOR_RECOMMENDED') {
        setSelectedDocType('CONTRACTOR_RECOMMENDATION');
      } else if (projectData.status === 'WAITING_FOR_FINANCIAL_SANCTION' || projectData.status === 'FINANCIAL_SANCTIONED') {
        setSelectedDocType('FINANCIAL_SANCTION_ORDER');
      } else if (projectData.status === 'WAITING_FOR_FUNDING_AUTHORIZATION' || projectData.status === 'FUNDING_AUTHORIZED') {
        setSelectedDocType('FUNDING_AUTHORIZATION_ORDER');
      }
    }
  }, [projectData?.status]);

  // Modals
  const [inspectingEvidence, setInspectingEvidence] = useState<{
    milestone: Milestone;
    evidence: ContractorEvidence;
  } | null>(null);

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionNotes, setCompletionNotes] = useState(
    'All engineering specifications, layer compaction tests, and safety markings fully certified by PWD Chief Engineer.'
  );

  const [verifyingMilestone, setVerifyingMilestone] = useState<Milestone | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isVerifyingSubmitting, setIsVerifyingSubmitting] = useState(false);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  const handleVerifyMilestoneSubmit = async (milestoneId: string) => {
    setIsVerifyingSubmitting(true);
    setActionErrorMsg(null);
    try {
      await apiClient.verifyMilestone(projectId, milestoneId, verificationNotes || 'All prerequisites verified by Official.');
      setVerifyingMilestone(null);
      setVerificationNotes('');
      await fetchProjectDetails();
      if (onProjectUpdated) onProjectUpdated();
    } catch (err: any) {
      console.error('Milestone verification error:', err);
      setActionErrorMsg(err.message || 'Milestone verification failed. Prerequisites incomplete.');
    } finally {
      setIsVerifyingSubmitting(false);
    }
  };

  const handleCompleteProjectSubmit = async () => {
    setActionErrorMsg(null);
    try {
      await apiClient.certifyProjectCompletion(projectId, completionNotes);
      setIsCompleting(false);
      await fetchProjectDetails();
      if (onProjectUpdated) onProjectUpdated();
    } catch (err: any) {
      console.error('Project completion certification error:', err);
      setActionErrorMsg(err.message || 'Project completion certification locked. All milestones must be verified first.');
    }
  };

  const fetchProjectDetails = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getProjectById(projectId);
      setProjectData(data);
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const handleStartExecution = async () => {
    try {
      await apiClient.startProjectExecution(projectId);
      await fetchProjectDetails();
      if (onProjectUpdated) onProjectUpdated();
    } catch (err) {
      console.error('Failed to start execution:', err);
    }
  };

  const handleCompleteProject = async () => {
    try {
      await apiClient.completeProject(projectId, completionNotes);
      setIsCompleting(false);
      await fetchProjectDetails();
      if (onProjectUpdated) onProjectUpdated();
    } catch (err) {
      console.error('Failed to complete project:', err);
    }
  };

  if (isLoading || !projectData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-700">Loading Project Digital Thread...</p>
        </div>
      </div>
    );
  }

  const p: Project = projectData;
  const evidenceList: ContractorEvidence[] = projectData.evidence || [];
  const inspectionList: OfficialInspection[] = projectData.inspections || [];
  const observations: CommunityObservation[] = projectData.communityObservations || projectData.observations || [];
  const auditLogs: AuditEvent[] = projectData.auditHistory || [];
  const isReworkMandated = p.status === 'DELAYED' && !!p.reworkRequiredMessage;

  const isOfficial = currentUser?.role === 'OFFICIAL';
  const isContractor = currentUser?.role === 'CONTRACTOR';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'VERIFICATION_REQUIRED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'DELAYED':
        return 'bg-red-100 text-red-800 border-red-300 animate-pulse';
      case 'CONTRACTOR_ASSIGNED':
      case 'SANCTIONED':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {p.id}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(
                  p.status
                )}`}
              >
                {p.status.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Sanction #: {p.sanctionNumber}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white leading-tight">{p.name}</h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
              <span>{p.department}</span>
              <span>•</span>
              <span>{p.district}, {p.state}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Target: {p.targetCompletionDate}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Action buttons in header depending on role & state */}
            {isOfficial && p.status === 'SANCTIONED' && (
              <button
                onClick={() => setIsAssignOpen(true)}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Assign Contractor
              </button>
            )}

            {isContractor && p.status === 'CONTRACTOR_ASSIGNED' && (
              <button
                onClick={handleStartExecution}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Start Site Execution
              </button>
            )}

            {/* Project Completion Certification Button (Governance Locked) */}
            {isOfficial && p.status !== 'COMPLETED' && (() => {
              const completionEligibility = evaluateProjectCompletionEligibility(p, evidenceList, inspectionList);
              if (completionEligibility.isReadyForCompletion) {
                return (
                  <button
                    onClick={() => setIsCompleting(true)}
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-lg text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Certify Project Completion</span>
                  </button>
                );
              } else {
                return (
                  <div className="relative group">
                    <button
                      disabled
                      className="px-3.5 py-2 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold border border-slate-700 opacity-60 cursor-not-allowed flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Completion Locked ({completionEligibility.verifiedMilestonesCount}/{completionEligibility.totalMilestonesCount} Verified)</span>
                    </button>
                    <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block w-64 bg-slate-900 text-white text-[10px] p-2.5 rounded-xl shadow-xl z-50 border border-slate-700 leading-relaxed font-medium">
                      <strong className="block text-amber-400 mb-0.5">Completion Locked</strong>
                      All engineering milestones must be verified first. Unverified: {completionEligibility.unverifiedMilestones.map((m) => m.title).join(', ')}.
                    </div>
                  </div>
                );
              }
            })()}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Digital Thread Banner */}
        <div className="bg-slate-50 p-4 border-b border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Connected Digital Public Infrastructure Thread
            </h4>
            <DigitalThreadBadge
              requestId={p.requestId}
              workTokenId={p.workTokenId}
              projectId={p.id}
            />
          </div>
          <LifecycleTimeline
            currentStage={p.status}
            isReworkActive={p.status === 'DELAYED'}
          />
        </div>

        {/* Mandatory Rework Alert Banner */}
        {isReworkMandated && (
          <div className="p-4 bg-red-50 border-b border-red-200 flex items-start gap-3 text-red-950">
            <RotateCcw className="w-5 h-5 text-red-600 mt-0.5 shrink-0 animate-spin" />
            <div className="flex-1 text-xs">
              <span className="font-black uppercase tracking-wider text-red-900 block mb-0.5">
                Official Rework & Remediation Mandate in Effect
              </span>
              <p className="leading-relaxed font-medium text-red-800">
                {p.reworkRequiredMessage}
              </p>
              {isContractor && onOpenSubmitEvidence && (
                <button
                  onClick={() => {
                    const delayedMilestone =
                      p.milestones.find((m) => m.status === 'DELAYED') || p.milestones[0];
                    onOpenSubmitEvidence(p, delayedMilestone, true);
                  }}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Submit Remediation & Rework Evidence</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-4 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-3 border-b-2 cursor-pointer transition ${
              activeTab === 'OVERVIEW'
                ? 'border-emerald-600 text-emerald-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview & Scope
          </button>
          <button
            onClick={() => setActiveTab('GOVERNANCE')}
            className={`px-4 py-3 border-b-2 cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'GOVERNANCE'
                ? 'border-emerald-600 text-emerald-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Governance Orders</span>
            {p.governanceDocuments && p.governanceDocuments.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                {p.governanceDocuments.filter(d => d.status === 'SIGNED_DOCUMENT_UPLOADED').length}/{p.governanceDocuments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('MILESTONES')}
            className={`px-4 py-3 border-b-2 cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'MILESTONES'
                ? 'border-emerald-600 text-emerald-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Milestones</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px]">
              {p.milestones.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('EVIDENCE')}
            className={`px-4 py-3 border-b-2 cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'EVIDENCE'
                ? 'border-emerald-600 text-emerald-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Evidence & AI Check</span>
            <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-900 text-[10px] font-bold">
              {evidenceList.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('FUNDING')}
            className={`px-4 py-3 border-b-2 cursor-pointer transition ${
              activeTab === 'FUNDING'
                ? 'border-emerald-600 text-emerald-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Funding Ledger
          </button>
          <button
            onClick={() => setActiveTab('INSPECTIONS')}
            className={`px-4 py-3 border-b-2 cursor-pointer transition ${
              activeTab === 'INSPECTIONS'
                ? 'border-emerald-600 text-emerald-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Inspections ({inspectionList.length})
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-4 py-3 border-b-2 cursor-pointer transition ${
              activeTab === 'AUDIT'
                ? 'border-emerald-600 text-emerald-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Audit Trail ({auditLogs.length})
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Technical Scope of Work
                </h4>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed">
                  <p className="font-semibold text-slate-900 mb-1">{p.description}</p>
                  <p className="text-slate-700">{p.scopeOfWork}</p>
                </div>
              </div>

              {/* Contractor & Originating Citizen Request */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Financial Sanction Banner for Pending Sanction */}
                {(p.status === 'CONTRACTOR_RECOMMENDED' || p.status === 'PENDING_FINANCIAL_SANCTION' || p.status === 'PROPOSED') && (
                  <div className="p-5 bg-amber-50 border border-amber-300 rounded-2xl space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-2">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-amber-700 shrink-0" />
                        <span className="font-extrabold text-amber-950 uppercase tracking-wider text-xs">
                          Financial Sanction Status: WAITING FOR FINANCIAL SANCTION
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded bg-amber-200 text-amber-900 font-mono font-bold text-[10px]">
                        Submitted to Sanctioning Authority
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <span className="text-[10px] text-amber-800 font-bold uppercase block">Sanctioning Authority</span>
                        <span className="font-bold text-slate-900">Finance & Treasury Sanctioning Authority</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-800 font-bold uppercase block">Requested Amount</span>
                        <span className="font-mono font-bold text-slate-900">INR {(p.recommendedAmount || p.funding?.contracted || p.funding?.sanctioned)?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-800 font-bold uppercase block">Recommended Contractor</span>
                        <span className="font-bold text-slate-900">{p.recommendedContractorName || p.contractorName || 'Selected Enlisted Agency'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-800 font-bold uppercase block">Next Step</span>
                        <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 inline-block">
                          Awaiting Financial Sanction
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-amber-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <HardHat className="w-4 h-4 text-amber-700" />
                      Assigned Contractor
                    </span>
                    <ProvenanceBadge type="CONTRACTOR_SUBMISSION" />
                  </div>
                  {p.contractorName ? (
                    <div>
                      <p className="font-bold text-sm text-amber-950">{p.contractorName}</p>
                      <p className="text-slate-600 mt-1">
                        Contracted Sum: <strong className="font-mono">INR {p.funding.contracted?.toLocaleString()}</strong>
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Assigned on {p.assignedAt ? new Date(p.assignedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  ) : (
                    <div className="text-amber-800">
                      <p>No contractor assigned yet.</p>
                      {isOfficial && (
                        <button
                          onClick={() => setIsAssignOpen(true)}
                          className="mt-2 px-3 py-1.5 bg-amber-600 text-white rounded font-bold hover:bg-amber-700 cursor-pointer text-xs"
                        >
                          Assign Contractor Now
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-200 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sky-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-sky-700" />
                      Originating Citizen Need
                    </span>
                    <ProvenanceBadge type="PROTOTYPE_DATA" />
                  </div>
                  <p className="font-mono font-bold text-sky-900">{p.requestId}</p>
                  <p className="text-slate-700 mt-1 line-clamp-2">
                    {projectData.citizenRequest?.title || 'Citizen infrastructure report'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Location: {p.district} • Ward 14
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MILESTONES */}
          {activeTab === 'MILESTONES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Execution Milestones & Governance Prerequisites
                  </h4>
                  <p className="text-xs text-slate-500">
                    Milestones are locked from premature verification. All prerequisites must be satisfied.
                  </p>
                </div>
              </div>

              {actionErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-bold flex items-center justify-between gap-2">
                  <span>{actionErrorMsg}</span>
                  <button onClick={() => setActionErrorMsg(null)} className="text-rose-700 hover:text-rose-900 cursor-pointer">✕</button>
                </div>
              )}

              <div className="space-y-4">
                {p.milestones.map((m) => {
                  const mEvidence = evidenceList.filter((e) => e.milestoneId === m.id);
                  const mInspections = inspectionList.filter((i) => i.milestoneId === m.id);
                  const prereqs = evaluateMilestonePrerequisites(p, m, evidenceList, inspectionList, observations);

                  return (
                    <div
                      key={m.id}
                      className={`p-5 rounded-2xl border transition space-y-3 ${
                        m.status === 'VERIFIED'
                          ? 'bg-emerald-50/60 border-emerald-300'
                          : m.status === 'DELAYED' || m.status === 'REWORK_REQUIRED'
                          ? 'bg-red-50/70 border-red-300'
                          : prereqs.isReadyForVerification
                          ? 'bg-indigo-50/60 border-indigo-300'
                          : 'bg-white border-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-xs">
                            {m.sequence}
                          </span>
                          <div>
                            <h5 className="font-extrabold text-slate-900 text-sm">{m.title}</h5>
                            <p className="text-xs text-slate-600 mt-0.5">{m.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-black border ${
                              m.status === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : m.status === 'DELAYED' || m.status === 'REWORK_REQUIRED'
                                ? 'bg-rose-100 text-rose-900 border-rose-300'
                                : prereqs.isReadyForVerification
                                ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                                : 'bg-amber-100 text-amber-900 border-amber-300'
                            }`}
                          >
                            {m.status === 'VERIFIED'
                              ? '✓ VERIFIED'
                              : m.status === 'DELAYED' || m.status === 'REWORK_REQUIRED'
                              ? 'REWORK MANDATED'
                              : prereqs.isReadyForVerification
                              ? 'READY FOR VERIFICATION'
                              : 'INSPECTION PENDING'}
                          </span>
                        </div>
                      </div>

                      {/* PREREQUISITES CHECKLIST */}
                      {m.status !== 'VERIFIED' && (
                        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-2">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
                            Verification Prerequisites Governance Checklist
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-bold">
                            <div className={`flex items-center gap-1.5 ${prereqs.checklist.sequenceValid ? 'text-emerald-700' : 'text-slate-400'}`}>
                              {prereqs.checklist.sequenceValid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                              <span>Sequence Active</span>
                            </div>

                            <div className={`flex items-center gap-1.5 ${prereqs.checklist.evidenceSubmitted ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {prereqs.checklist.evidenceSubmitted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-amber-600" />}
                              <span>Evidence Uploaded</span>
                            </div>

                            <div className={`flex items-center gap-1.5 ${prereqs.checklist.aiAnalysisCompleted ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {prereqs.checklist.aiAnalysisCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-amber-600" />}
                              <span>AI Verification</span>
                            </div>

                            <div className={`flex items-center gap-1.5 ${prereqs.checklist.officialInspectionCompleted ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {prereqs.checklist.officialInspectionCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-amber-600" />}
                              <span>Field Inspection</span>
                            </div>

                            <div className={`flex items-center gap-1.5 ${prereqs.checklist.reworkCleared && prereqs.checklist.reinspectionCompleted ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {prereqs.checklist.reworkCleared && prereqs.checklist.reinspectionCompleted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                              <span>Rework Cleared</span>
                            </div>
                          </div>

                          {!prereqs.isReadyForVerification && (
                            <div className="p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium flex items-start gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" />
                              <span><strong>Verification Locked:</strong> {prereqs.missingPrerequisites[0]}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {m.reworkNotes && (
                        <div className="p-2.5 bg-red-100/80 border border-red-200 rounded-xl text-xs text-red-950">
                          <strong className="block text-[11px] mb-0.5">Rework Directive:</strong>
                          {m.reworkNotes}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
                        <span className="text-slate-500 text-[11px]">
                          Target Date: <strong className="text-slate-700">{m.targetDate}</strong>
                          {m.verifiedAt && (
                            <span className="text-emerald-700 font-bold ml-2">
                              • Verified on {new Date(m.verifiedAt).toLocaleDateString()}
                            </span>
                          )}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Contractor Submit Evidence Button */}
                          {isContractor && m.status !== 'VERIFIED' && onOpenSubmitEvidence && (
                            <button
                              onClick={() => onOpenSubmitEvidence(p, m, m.status === 'DELAYED' || m.status === 'REWORK_REQUIRED')}
                              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                            >
                              {m.status === 'DELAYED' || m.status === 'REWORK_REQUIRED' ? 'Submit Rework Evidence' : 'Submit Progress Evidence'}
                            </button>
                          )}

                          {/* Official Inspect Button */}
                          {isOfficial && m.status !== 'VERIFIED' && (
                            <button
                              onClick={() =>
                                setInspectingEvidence({
                                  milestone: m,
                                  evidence: mEvidence[0] || {
                                    id: `EV-${p.id}-${m.id}`,
                                    projectId: p.id,
                                    milestoneId: m.id,
                                    submittedBy: p.contractorId || 'ctr-001',
                                    submittedByName: p.contractorName || 'Assigned Contractor',
                                    submittedAt: new Date().toISOString(),
                                    description: `Execution evidence for milestone: ${m.title}`,
                                    mediaRefs: p.evidence?.[0] ? p.evidence[0].mediaRefs : [],
                                    claimedProgress: m.completionPercentageClaimed || 100,
                                    location: { label: `${p.district || 'Worksite'} Site` },
                                    status: 'SUBMITTED',
                                    provenance: 'CONTRACTOR_SUBMISSION',
                                  },
                                })
                              }
                              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Record Field Inspection</span>
                            </button>
                          )}

                          {/* Official Verify Milestone Button (Prerequisites Locked) */}
                          {isOfficial && m.status !== 'VERIFIED' && (
                            <button
                              disabled={!prereqs.isReadyForVerification}
                              onClick={() => {
                                setVerificationNotes(`Official verification sign-off for milestone ${m.sequence} (${m.title}) after checking all evidence, AI verification, and field test logs.`);
                                setVerifyingMilestone(m);
                              }}
                              className={`px-4 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                                prereqs.isReadyForVerification
                                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                              }`}
                            >
                              {!prereqs.isReadyForVerification && <Lock className="w-3.5 h-3.5" />}
                              <span>{prereqs.isReadyForVerification ? 'Verify Milestone' : 'Verification Locked'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: EVIDENCE & AI CHECK */}
          {activeTab === 'EVIDENCE' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Contractor Uploaded Evidence & AI Cross-Verification
                  </h4>
                  <p className="text-xs text-slate-500">
                    AI inspects photo layers and tests for divergence against claimed progress.
                  </p>
                </div>
              </div>

              {evidenceList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No evidence submissions uploaded yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {evidenceList.map((e) => (
                    <div
                      key={e.id}
                      className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-600">{e.id}</span>
                          <span className="text-xs font-bold text-slate-900">
                            Milestone: {e.milestoneId}
                          </span>
                          <ProvenanceBadge type="CONTRACTOR_SUBMISSION" />
                        </div>

                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            e.status === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : e.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {e.status} (Claimed {e.claimedProgress}%)
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 font-medium">{e.description}</p>

                      {e.mediaRefs && e.mediaRefs.filter((m) => Boolean(m.url && m.url.trim())).length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {e.mediaRefs.filter((m) => Boolean(m.url && m.url.trim())).map((m, idx) => (
                            <div key={idx} className="rounded-lg overflow-hidden border border-slate-200">
                              <EvidenceImage src={m.url} alt="Evidence" className="w-full h-32 object-cover" />
                              <p className="text-[10px] text-slate-500 p-1.5 text-center bg-slate-50 font-mono">
                                {m.caption}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* AI Verification Block */}
                      {e.aiVerification && (
                        <div
                          className={`p-3 rounded-lg border text-xs ${
                            e.aiVerification.status === 'POTENTIAL_DISCREPANCY'
                              ? 'bg-amber-50 border-amber-300 text-amber-950'
                              : 'bg-purple-50 border-purple-200 text-purple-950'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                              AI Evidence Comparison Intelligence
                            </span>
                            <ProvenanceBadge
                              type="AI_ANALYSIS"
                              modelOrSource={e.aiVerification.modelUsed}
                            />
                          </div>
                          <p className="font-bold mb-1">{e.aiVerification.summary}</p>
                          <p className="text-[11px] text-slate-700 leading-relaxed">
                            {e.aiVerification.reasoning}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: GOVERNANCE ORDERS & DIGITAL THREAD */}
          {activeTab === 'GOVERNANCE' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Governance Thread Visual Timeline */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                    Decentralized Multi-Tier Governance Thread
                  </h4>
                </div>

                {/* 3 Step Governance Pipeline */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                  {/* Step 1: Procurement */}
                  <div className={`p-4 rounded-xl border transition ${
                    p.status === 'CONTRACTOR_RECOMMENDED'
                      ? 'bg-amber-50/50 border-amber-200 shadow-2xs'
                      : p.governanceDocuments?.some(d => d.docType === 'CONTRACTOR_RECOMMENDATION' && d.status === 'SIGNED_DOCUMENT_UPLOADED')
                      ? 'bg-emerald-50/30 border-emerald-100'
                      : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                        p.governanceDocuments?.some(d => d.docType === 'CONTRACTOR_RECOMMENDATION' && d.status === 'SIGNED_DOCUMENT_UPLOADED')
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}>1</span>
                      <strong className="text-xs text-slate-800 font-bold block">Procurement</strong>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2 space-y-1">
                      <div><span className="font-bold text-slate-600">Authority:</span> Government Official</div>
                      <div><span className="font-bold text-slate-600">Document:</span> Recommendation Report</div>
                      <div><span className="font-bold text-slate-600">Status:</span> {
                        p.governanceDocuments?.some(d => d.docType === 'CONTRACTOR_RECOMMENDATION' && d.status === 'SIGNED_DOCUMENT_UPLOADED')
                          ? 'Signed & Submitted'
                          : p.status === 'CONTRACTOR_RECOMMENDED'
                          ? 'Generated (Signing Pending)'
                          : 'Awaiting Bidding'
                      }</div>
                    </div>
                  </div>

                  {/* Step 2: Sanction */}
                  <div className={`p-4 rounded-xl border transition ${
                    p.status === 'WAITING_FOR_FINANCIAL_SANCTION' || p.status === 'FINANCIAL_SANCTIONED'
                      ? 'bg-amber-50/50 border-amber-200 shadow-2xs'
                      : p.governanceDocuments?.some(d => d.docType === 'FINANCIAL_SANCTION_ORDER' && d.status === 'SIGNED_DOCUMENT_UPLOADED')
                      ? 'bg-emerald-50/30 border-emerald-100'
                      : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                        p.governanceDocuments?.some(d => d.docType === 'FINANCIAL_SANCTION_ORDER' && d.status === 'SIGNED_DOCUMENT_UPLOADED')
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}>2</span>
                      <strong className="text-xs text-slate-800 font-bold block">Financial Sanction</strong>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2 space-y-1">
                      <div><span className="font-bold text-slate-600">Authority:</span> Sanctioning Authority</div>
                      <div><span className="font-bold text-slate-600">Document:</span> Sanction Order</div>
                      <div><span className="font-bold text-slate-600">Status:</span> {
                        p.governanceDocuments?.some(d => d.docType === 'FINANCIAL_SANCTION_ORDER' && d.status === 'SIGNED_DOCUMENT_UPLOADED')
                          ? 'Signed & Certified'
                          : p.status === 'FINANCIAL_SANCTIONED'
                          ? 'Generated (Signing Pending)'
                          : p.status === 'WAITING_FOR_FINANCIAL_SANCTION'
                          ? 'Awaiting Sanction'
                          : 'Locked'
                      }</div>
                    </div>
                  </div>

                  {/* Step 3: Authorization */}
                  <div className={`p-4 rounded-xl border transition ${
                    p.status === 'WAITING_FOR_FUNDING_AUTHORIZATION' || p.status === 'FUNDING_AUTHORIZED'
                      ? 'bg-amber-50/50 border-amber-200 shadow-2xs'
                      : p.governanceDocuments?.some(d => d.docType === 'FUNDING_AUTHORIZATION_ORDER' && d.status === 'SIGNED_DOCUMENT_UPLOADED')
                      ? 'bg-emerald-50/30 border-emerald-100'
                      : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                        p.governanceDocuments?.some(d => d.docType === 'FUNDING_AUTHORIZATION_ORDER' && d.status === 'SIGNED_DOCUMENT_UPLOADED')
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}>3</span>
                      <strong className="text-xs text-slate-800 font-bold block">Treasury Release</strong>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2 space-y-1">
                      <div><span className="font-bold text-slate-600">Authority:</span> Policymaker</div>
                      <div><span className="font-bold text-slate-600">Document:</span> Authorization Order</div>
                      <div><span className="font-bold text-slate-600">Status:</span> {
                        p.governanceDocuments?.some(d => d.docType === 'FUNDING_AUTHORIZATION_ORDER' && d.status === 'SIGNED_DOCUMENT_UPLOADED')
                          ? 'Authorized & Effective'
                          : p.status === 'FUNDING_AUTHORIZED'
                          ? 'Generated (Signing Pending)'
                          : p.status === 'WAITING_FOR_FUNDING_AUTHORIZATION'
                          ? 'Awaiting Authorization'
                          : 'Locked'
                      }</div>
                    </div>
                  </div>
                </div>

                {/* State Visibility Card */}
                <div className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Current Stage</span>
                    <span className="text-amber-400 font-bold block mt-0.5">{p.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Responsible Authority</span>
                    <span className="text-slate-100 font-bold block mt-0.5">{
                      p.status === 'CONTRACTOR_RECOMMENDED'
                        ? 'Government Official'
                        : (p.status === 'WAITING_FOR_FINANCIAL_SANCTION' || p.status === 'FINANCIAL_SANCTIONED')
                        ? 'Sanctioning Authority'
                        : (p.status === 'WAITING_FOR_FUNDING_AUTHORIZATION' || p.status === 'FUNDING_AUTHORIZED')
                        ? 'Policymaker'
                        : 'Contractor & Inspectors'
                    }</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Required Document Gate</span>
                    <span className="text-slate-100 font-bold block mt-0.5">{
                      p.status === 'CONTRACTOR_RECOMMENDED'
                        ? 'Contractor Recommendation Report'
                        : (p.status === 'WAITING_FOR_FINANCIAL_SANCTION' || p.status === 'FINANCIAL_SANCTIONED')
                        ? 'Financial Sanction Order'
                        : (p.status === 'WAITING_FOR_FUNDING_AUTHORIZATION' || p.status === 'FUNDING_AUTHORIZED')
                        ? 'Funding Authorization Order'
                        : 'N/A'
                    }</span>
                  </div>
                </div>
              </div>

              {/* Unified Stage-by-Stage Document Controller */}
              <div className="pt-2">
                <DocumentController
                  project={p}
                  onDocumentActionSuccess={async (updatedProj) => {
                    setProjectData(updatedProj);
                    if (onProjectUpdated) {
                      onProjectUpdated();
                    }
                  }}
                />
              </div>

              {/* Document Selector & Console */}
              <div className="space-y-4 pt-6 border-t border-slate-200 mt-6">
                <div className="flex items-center justify-between">
                  <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                    Select Governance Document to View / Sign
                  </h5>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedDocType('CONTRACTOR_RECOMMENDATION')}
                    className={`p-3 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                      selectedDocType === 'CONTRACTOR_RECOMMENDATION'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Procurement Recommendation
                  </button>
                  <button
                    onClick={() => setSelectedDocType('FINANCIAL_SANCTION_ORDER')}
                    disabled={!p.governanceDocuments?.some(d => d.docType === 'CONTRACTOR_RECOMMENDATION' && d.status === 'SIGNED_DOCUMENT_UPLOADED')}
                    className={`p-3 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                      selectedDocType === 'FINANCIAL_SANCTION_ORDER'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    Financial Sanction Order
                  </button>
                  <button
                    onClick={() => setSelectedDocType('FUNDING_AUTHORIZATION_ORDER')}
                    disabled={!p.governanceDocuments?.some(d => d.docType === 'FINANCIAL_SANCTION_ORDER' && d.status === 'SIGNED_DOCUMENT_UPLOADED')}
                    className={`p-3 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                      selectedDocType === 'FUNDING_AUTHORIZATION_ORDER'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    Treasury Authorization Order
                  </button>
                </div>

                <div className="pt-2">
                  <GovernanceDocumentConsole
                    project={p}
                    docType={selectedDocType}
                    onDocumentActionSuccess={async (updatedProj) => {
                      setProjectData(updatedProj);
                      if (onProjectUpdated) {
                        onProjectUpdated();
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FUNDING LEDGER */}
          {activeTab === 'FUNDING' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Infrastructure Project Funding & Expenditure Ledger
                  </h4>
                  <p className="text-xs text-slate-500">
                    Deterministic budget governance: Contracted ≤ Sanctioned ≤ Allocated.
                  </p>
                </div>
                <ProvenanceBadge type="GOVERNMENT_DATA" modelOrSource="PMGSY / State PWD Head" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block truncate">Allocated Budget</span>
                  <p className="text-sm font-mono font-black text-slate-800 mt-1">
                    INR {p.funding.allocated.toLocaleString()}
                  </p>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Program Ceiling</span>
                </div>

                <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-200">
                  <span className="text-[9px] uppercase font-bold text-purple-800 block truncate">Sanctioned Outlay</span>
                  <p className="text-sm font-mono font-black text-purple-950 mt-1">
                    INR {p.funding.sanctioned.toLocaleString()}
                  </p>
                  <span className="text-[9px] text-purple-700 block mt-0.5">Approved Amount</span>
                </div>

                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200">
                  <span className="text-[9px] uppercase font-bold text-amber-800 block truncate">Contracted Value</span>
                  <p className="text-sm font-mono font-black text-amber-950 mt-1">
                    INR {p.funding.contracted?.toLocaleString() || '0'}
                  </p>
                  <span className="text-[9px] text-amber-700 block mt-0.5">Awarded Value</span>
                </div>

                <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200">
                  <span className="text-[9px] uppercase font-bold text-blue-800 block truncate">Expenditure</span>
                  <p className="text-sm font-mono font-black text-blue-950 mt-1">
                    INR {p.funding.expenditure?.toLocaleString() || '0'}
                  </p>
                  <span className="text-[9px] text-blue-700 block mt-0.5">Disbursed Funds</span>
                </div>

                <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 col-span-2 sm:col-span-1">
                  <span className="text-[9px] uppercase font-bold text-emerald-800 block truncate">Remaining Balance</span>
                  <p className="text-sm font-mono font-black text-emerald-950 mt-1">
                    INR {((p.funding.allocated || 0) - (p.funding.expenditure || 0)).toLocaleString()}
                  </p>
                  <span className="text-[9px] text-emerald-700 block mt-0.5">Allocated - Spent</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
                <p><strong>Funding Scheme:</strong> {p.funding.schemeSource}</p>
                <p><strong>Budget Accounting Head:</strong> <span className="font-mono">{p.funding.budgetHead}</span></p>
                <p><strong>Last Audit Timestamp:</strong> {p.funding.lastAuditDate}</p>
              </div>
            </div>
          )}

          {/* TAB 5: INSPECTIONS */}
          {activeTab === 'INSPECTIONS' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Official Certified Site Inspections
              </h4>

              {inspectionList.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No official inspections recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {inspectionList.map((insp) => (
                    <div
                      key={insp.id}
                      className="p-4 bg-white rounded-xl border border-slate-200 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">{insp.id}</span>
                          <ProvenanceBadge type="OFFICIAL_DECISION" />
                        </div>
                        <span
                          className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${
                            insp.decision === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {insp.decision}
                        </span>
                      </div>
                      <p className="text-slate-800 leading-relaxed font-medium">"{insp.officialNotes}"</p>
                      <p className="text-[11px] text-slate-500">
                        Inspector: <strong>{insp.inspectorName}</strong> • {new Date(insp.inspectedAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: AUDIT TRAIL */}
          {activeTab === 'AUDIT' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Immutable Governance Audit Log
              </h4>

              {auditLogs.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No audit records found.</p>
              ) : (
                <div className="space-y-2 font-mono text-xs">
                  {auditLogs.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{a.action}</span>
                          <span className="text-[10px] text-slate-500">({a.actorRole})</span>
                        </div>
                        <p className="text-slate-600 font-sans text-xs mt-0.5">{a.reason}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(a.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Completion Modal Overlay */}
        {isCompleting && (
          <div className="p-4 bg-emerald-50 border-t border-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex-1">
              <span className="font-bold text-emerald-950 block">Official Project Completion Certification Sign-Off</span>
              <p className="text-[11px] text-emerald-800 mb-1">Certifying that all milestones have been verified and full engineering specifications are met.</p>
              <input
                type="text"
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-emerald-300 bg-white"
                placeholder="Final engineering verification note..."
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCompleting(false)}
                className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-700 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteProjectSubmit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black shadow-md cursor-pointer"
              >
                Certify Project Completion
              </button>
            </div>
          </div>
        )}

        {/* Milestone Verification Modal Overlay */}
        {verifyingMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Verify Milestone {verifyingMilestone.sequence}</h3>
                  <p className="text-xs text-slate-500">{verifyingMilestone.title}</p>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All governance prerequisites (Evidence, AI check, Field Inspection) satisfied!</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Official Verification Notes
                </label>
                <textarea
                  rows={3}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition"
                  placeholder="Enter official engineering verification sign-off notes..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setVerifyingMilestone(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleVerifyMilestoneSubmit(verifyingMilestone.id)}
                  disabled={isVerifyingSubmitting}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isVerifyingSubmitting ? 'Verifying...' : 'Confirm Milestone Verification'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Sub-modals */}
      {inspectingEvidence && (
        <InspectionModal
          project={p}
          milestone={inspectingEvidence.milestone}
          evidence={inspectingEvidence.evidence}
          onClose={() => setInspectingEvidence(null)}
          onSuccess={async () => {
            setInspectingEvidence(null);
            await fetchProjectDetails();
            if (onProjectUpdated) onProjectUpdated();
          }}
        />
      )}

      {isAssignOpen && (
        <AssignContractorModal
          project={p}
          contractors={allUsers}
          onClose={() => setIsAssignOpen(false)}
          onSuccess={async () => {
            setIsAssignOpen(false);
            await fetchProjectDetails();
            if (onProjectUpdated) onProjectUpdated();
          }}
        />
      )}
    </div>
  );
};
