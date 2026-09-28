import React, { useState, useEffect } from 'react';
import {
  Project,
  Milestone,
  ContractorEvidence,
  OfficialInspection,
  AuditEvent,
  UserSession,
} from '../../types/domain';
import { apiClient } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { DigitalThreadBadge } from '../common/DigitalThreadBadge';
import { LifecycleTimeline } from '../common/LifecycleTimeline';
import { InspectionModal } from '../official/InspectionModal';
import { AssignContractorModal } from '../official/AssignContractorModal';
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
    'OVERVIEW' | 'MILESTONES' | 'EVIDENCE' | 'FUNDING' | 'INSPECTIONS' | 'AUDIT'
  >('OVERVIEW');

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

            {isOfficial && p.status !== 'COMPLETED' && (
              <button
                onClick={() => setIsCompleting(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Certify Completion
              </button>
            )}

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
                    Execution Milestones & Progress Certification
                  </h4>
                  <p className="text-xs text-slate-500">
                    Each milestone requires evidence upload, AI comparison, and official human inspection sign-off.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {p.milestones.map((m, idx) => {
                  const mEvidence = evidenceList.filter((e) => e.milestoneId === m.id);

                  return (
                    <div
                      key={m.id}
                      className={`p-4 rounded-xl border transition ${
                        m.status === 'VERIFIED'
                          ? 'bg-emerald-50/60 border-emerald-300'
                          : m.status === 'DELAYED'
                          ? 'bg-red-50/70 border-red-300'
                          : m.status === 'UNDER_REVIEW'
                          ? 'bg-purple-50/60 border-purple-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                            {m.sequence}
                          </span>
                          <h5 className="font-bold text-slate-900 text-sm">{m.title}</h5>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                              m.status === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : m.status === 'DELAYED'
                                ? 'bg-red-100 text-red-800 border-red-300'
                                : m.status === 'UNDER_REVIEW'
                                ? 'bg-purple-100 text-purple-800 border-purple-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {m.status}
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            Claimed: {m.completionPercentageClaimed}%
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 mb-3">{m.description}</p>

                      {m.reworkNotes && (
                        <div className="p-2.5 bg-red-100/70 border border-red-200 rounded-lg text-xs text-red-900 mb-3">
                          <strong className="block text-[11px] mb-0.5">Rework Directive:</strong>
                          {m.reworkNotes}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
                        <span className="text-slate-500 text-[11px]">
                          Target Date: <strong className="text-slate-700">{m.targetDate}</strong>
                          {m.verifiedAt && (
                            <span className="text-emerald-700 ml-2">
                              • Verified on {new Date(m.verifiedAt).toLocaleDateString()}
                            </span>
                          )}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Contractor Submit Evidence Button */}
                          {isContractor && m.status !== 'VERIFIED' && onOpenSubmitEvidence && (
                            <button
                              onClick={() =>
                                onOpenSubmitEvidence(p, m, m.status === 'DELAYED')
                              }
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              {m.status === 'DELAYED' ? 'Submit Rework Evidence' : 'Submit Evidence'}
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
                                    mediaRefs: [
                                      {
                                        type: 'photo',
                                        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
                                        caption: `Milestone ${m.sequence} site execution photograph`,
                                      },
                                    ],
                                    claimedProgress: 100,
                                    location: { lat: 13.0827, lng: 80.2707, label: `${p.district} Site` },
                                    status: 'SUBMITTED',
                                    provenance: 'CONTRACTOR_SUBMISSION',
                                  },
                                })
                              }
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Official Inspection Review</span>
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
                              <img src={m.url} alt="Evidence" className="w-full h-32 object-cover" />
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

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Allocated Budget</span>
                  <p className="text-lg font-mono font-bold text-slate-900 mt-1">
                    INR {p.funding.allocated.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-400">Total Program Ceiling</span>
                </div>

                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-800">Sanctioned Amount</span>
                  <p className="text-lg font-mono font-bold text-emerald-950 mt-1">
                    INR {p.funding.sanctioned.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-emerald-700">Official Sanction Head</span>
                </div>

                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-amber-800">Contracted Value</span>
                  <p className="text-lg font-mono font-bold text-amber-950 mt-1">
                    INR {p.funding.contracted?.toLocaleString() || '0'}
                  </p>
                  <span className="text-[10px] text-amber-700">Awarded to Contractor</span>
                </div>

                <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
                  <span className="text-[10px] uppercase font-bold text-blue-800">Verified Expenditure</span>
                  <p className="text-lg font-mono font-bold text-blue-950 mt-1">
                    INR {p.funding.expenditure?.toLocaleString() || '0'}
                  </p>
                  <span className="text-[10px] text-blue-700">Disbursed on Verification</span>
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
              <span className="font-bold text-emerald-950 block">Official Project Completion Sign-Off</span>
              <input
                type="text"
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full text-xs p-2 rounded border border-emerald-300 bg-white mt-1"
                placeholder="Final engineering verification note..."
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCompleting(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteProject}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700 cursor-pointer"
              >
                Confirm Completion
              </button>
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
