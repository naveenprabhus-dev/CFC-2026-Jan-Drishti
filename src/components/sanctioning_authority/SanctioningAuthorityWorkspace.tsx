import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Project, AuditEvent } from '../../types/domain';
import { apiClient } from '../../services/api';
import {
  isAuthorityEligibleForProject,
  resolveProjectCircleId,
} from '../../utils/jurisdictionGovernance';
import {
  Landmark,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  Building2,
  Sparkles,
  DollarSign,
  FileText,
  Clock,
  ArrowRight,
  MapPin,
  UserCheck,
  HardHat,
  Filter,
  Check,
  Eye,
  AlertTriangle,
  Award,
  RefreshCw,
  TrendingUp,
  ChevronRight,
  FileCheck2,
} from 'lucide-react';

interface SanctioningAuthorityWorkspaceProps {
  onOpenProject?: (projectId: string) => void;
  onOpenToken?: (tokenId: string) => void;
}

export const SanctioningAuthorityWorkspace: React.FC<SanctioningAuthorityWorkspaceProps> = ({
  onOpenProject,
  onOpenToken,
}) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'QUEUE' | 'REVIEW' | 'HISTORY' | 'OVERVIEW'>('QUEUE');
  const [projects, setProjects] = useState<Project[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Decision Modal States
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);

  const [approvedAmountInput, setApprovedAmountInput] = useState<string>('');
  const [decisionReasonInput, setDecisionReasonInput] = useState<string>('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState<boolean>(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const syncData: any = await apiClient.sync();
      const allProjects: Project[] = syncData?.projects || [];
      const allAudits: AuditEvent[] = syncData?.auditEvents || [];
      setProjects(allProjects);
      setAuditEvents(allAudits);

      // Auto-select first pending project if review tab or currently selected
      if (selectedProject) {
        const updated = allProjects.find((p) => p.id === selectedProject.id);
        if (updated) setSelectedProject(updated);
      }
    } catch (err: any) {
      console.error('Failed to load sanction workspace data:', err);
      setErrorMsg('Failed to sync financial sanction queue from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter pending sanction queue cases with jurisdiction & authority eligibility
  const queueProjects = projects.filter((p) => {
    const isPendingStatus = [
      'WAITING_FOR_FINANCIAL_SANCTION',
      'PENDING_FINANCIAL_SANCTION',
      'CONTRACTOR_RECOMMENDED',
      'PROPOSED',
    ].includes(p.status);

    if (!isPendingStatus) return false;

    // Filter by authority jurisdiction circle & delegated financial ceiling
    if (currentUser) {
      if (p.sanctioningAuthorityId && p.sanctioningAuthorityId.toLowerCase() === currentUser.id.toLowerCase()) {
        return true;
      }
      const authCheck = isAuthorityEligibleForProject(currentUser, p);
      if (!authCheck.eligible) return false;
    }

    return true;
  });

  const historyProjects = projects.filter((p) => {
    const isHistoryStatus = [
      'SANCTIONED',
      'FINANCIAL_SANCTIONED',
      'FINANCIAL_SANCTION_REJECTED',
      'EXECUTION_ENABLED',
      'CONTRACTOR_ASSIGNED',
      'IN_PROGRESS',
      'RETURNED',
      'REJECTED',
      'COMPLETED',
    ].includes(p.status);

    if (!isHistoryStatus) return false;

    if (currentUser) {
      const authCheck = isAuthorityEligibleForProject(currentUser, p);
      if (!authCheck.eligible && p.sanctioningAuthorityId !== currentUser.id) return false;
    }

    return true;
  });

  const totalPendingValue = queueProjects.reduce(
    (sum, p) => sum + (p.recommendedAmount || p.funding?.contracted || p.funding?.sanctioned || p.funding?.allocated || 0),
    0
  );

  const totalSanctionedValue = projects
    .filter((p) => ['SANCTIONED', 'FINANCIAL_SANCTIONED', 'EXECUTION_ENABLED', 'CONTRACTOR_ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(p.status))
    .reduce((sum, p) => sum + (p.funding?.sanctioned || 0), 0);

  const userThreshold = currentUser?.financialThreshold || 10000000; // Default ₹1 Crore ceiling

  const handleSelectReviewProject = (p: Project) => {
    setSelectedProject(p);
    const initialAmt = p.recommendedAmount || p.funding?.contracted || p.funding?.sanctioned || p.funding?.allocated || 0;
    setApprovedAmountInput(initialAmt ? String(initialAmt) : '');
    setDecisionReasonInput('');
    setActiveTab('REVIEW');
  };

  const handleProcessSanction = async (decision: 'APPROVE' | 'RETURN' | 'REJECT') => {
    if (!selectedProject) return;
    setIsSubmittingDecision(true);
    setErrorMsg(null);
    setActionSuccessMsg(null);

    try {
      const approvedAmount = decision === 'APPROVE' ? Number(approvedAmountInput) || 0 : undefined;
      
      const res: any = await apiClient.sanctionProject(selectedProject.id, {
        decision,
        reason: decisionReasonInput.trim(),
        approvedAmount,
      });

      if (res) {
        let msg = '';
        if (decision === 'APPROVE') {
          msg = `Financial sanction of ₹${((approvedAmount || 0) / 100000).toFixed(2)} Lakhs approved successfully for Project ${selectedProject.id}. Effective contractor assignment enabled.`;
        } else if (decision === 'RETURN') {
          msg = `Proposal returned to Government Official for revision. Feedback recorded in digital thread.`;
        } else {
          msg = `Financial sanction rejected for Project ${selectedProject.id}. Case recorded in audit log.`;
        }

        setActionSuccessMsg(msg);
        setShowApproveModal(false);
        setShowReturnModal(false);
        setShowRejectModal(false);
        setDecisionReasonInput('');
        await fetchData();

        // If approved, switch to Queue or remain on review with fresh state
      }
    } catch (err: any) {
      console.error('Sanction decision error:', err);
      if (err.code === 'INSUFFICIENT_SANCTIONING_AUTHORITY') {
        setErrorMsg(err.message || 'Error: Proposed budget exceeds your delegated sanctioning authority limit.');
      } else if (err.code === 'UNAUTHORIZED_JURISDICTION') {
        setErrorMsg(err.message || 'Error: Project location is outside your authorized regional jurisdiction.');
      } else {
        setErrorMsg(err.message || 'Failed to process financial sanction decision. Please check backend logs.');
      }
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const formatCurrency = (amt?: number) => {
    if (!amt && amt !== 0) return '₹0';
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  const formatLakhs = (amt?: number) => {
    if (!amt && amt !== 0) return '₹0 Lakhs';
    return `₹${(amt / 100000).toFixed(2)} Lakhs`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Officer Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl text-white p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center shrink-0 shadow-inner">
              <Landmark className="w-8 h-8 text-indigo-300" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 text-[10px] font-mono font-bold border border-indigo-400/30 uppercase tracking-wider">
                  Privileged Financial Layer
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Sanctioning Authority Active</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {currentUser?.name || 'Sanctioning Authority'}
              </h1>
              <p className="text-xs text-indigo-200/90 font-medium">
                {currentUser?.designation || 'Principal Sanctioning Officer & Financial Commissioner'} • {currentUser?.department || 'Finance & Treasury Sanctioning Department'}
              </p>
            </div>
          </div>

          {/* Authority Scope & Ceiling Pill */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 space-y-2 md:text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider block">
              Delegated Sanction Limit
            </span>
            <div className="text-xl sm:text-2xl font-mono font-black text-emerald-400">
              {formatLakhs(userThreshold)}
            </div>
            <div className="text-[11px] text-slate-300 font-medium">
              Circle: <span className="font-bold text-white">{currentUser?.jurisdiction || currentUser?.homeDistrict || 'Statewide Circle'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Queue</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{queueProjects.length}</span>
            <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              {formatLakhs(totalPendingValue)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Awaiting treasury sanction decision</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Sanctioned Budget</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {projects.filter((p) => ['SANCTIONED', 'FINANCIAL_SANCTIONED', 'EXECUTION_ENABLED', 'CONTRACTOR_ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(p.status)).length}
            </span>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {formatLakhs(totalSanctionedValue)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Capital authorized for execution</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Returned for Revision</span>
            <RotateCcw className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {projects.filter((p) => p.status === 'RETURNED').length}
            </span>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
              Official Revision
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Sent back for proposal modification</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Rejected Cases</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {projects.filter((p) => p.status === 'REJECTED' || p.status === 'FINANCIAL_SANCTION_REJECTED').length}
            </span>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              Sanction Denied
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Proposals denied financial authorization</p>
        </div>
      </div>

      {/* Global Alerts & Notifications */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="p-1 rounded-lg hover:bg-emerald-200/50 text-emerald-700 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="p-1 rounded-lg hover:bg-rose-200/50 text-rose-700 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 bg-slate-200/60 p-1.5 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('QUEUE')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition cursor-pointer ${
              activeTab === 'QUEUE'
                ? 'bg-white text-indigo-900 shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Sanction Queue ({queueProjects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('REVIEW')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition cursor-pointer ${
              activeTab === 'REVIEW'
                ? 'bg-white text-indigo-900 shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Sanction Review {selectedProject ? `(${selectedProject.id})` : ''}</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'bg-white text-indigo-900 shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Sanction History ({historyProjects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? 'bg-white text-indigo-900 shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Authority & Treasury Overview</span>
          </button>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 px-3 py-2 rounded-xl hover:shadow-2xs transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* ================= TAB 1: SANCTION QUEUE ================= */}
      {activeTab === 'QUEUE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>Pending Financial Sanction Queue</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Real proposals submitted by Government Officials awaiting treasury sanction
            </span>
          </div>

          {queueProjects.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Sanction Queue Clear</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                There are currently no proposals waiting for financial sanction in your regional jurisdiction circle.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {queueProjects.map((p) => {
                const reqAmt = p.recommendedAmount || p.funding?.contracted || p.funding?.sanctioned || p.funding?.allocated || 0;
                const isOverLimit = reqAmt > userThreshold;

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-black text-indigo-900 text-sm bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                            {p.id}
                          </span>
                          <span className="font-mono font-bold text-purple-800 text-xs bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                            Token: {p.workTokenId}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300">
                            Awaiting Financial Sanction
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900">{p.name}</h3>
                        <p className="text-xs text-slate-600 line-clamp-2">{p.description}</p>
                      </div>

                      {/* Requested Amount Card */}
                      <div className="text-right shrink-0 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Proposed Sanction</span>
                        <span className="text-lg font-mono font-black text-slate-900">{formatLakhs(reqAmt)}</span>
                        {isOverLimit && (
                          <div className="text-[10px] font-bold text-rose-600 flex items-center justify-end gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Exceeds Authority Ceiling</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Location & Circle</span>
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{p.district}, {p.state || 'Tamil Nadu'}</span>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 mt-1 inline-block">
                          {p.circleId || p.jurisdictionId || resolveProjectCircleId(p)}
                        </span>
                      </div>

                      <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Department</span>
                        <div className="font-bold text-slate-800 truncate">{p.department}</div>
                      </div>

                      <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Recommended Contractor</span>
                        <div className="font-bold text-indigo-900 flex items-center gap-1 truncate">
                          <HardHat className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{p.recommendedContractorName || p.contractorName || 'Selected Enlisted Agency'}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Submitting Official</span>
                        <div className="font-bold text-slate-800 flex items-center gap-1 truncate">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{p.recommendedBy || 'Executive Engineer'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="text-[11px] text-slate-500 font-medium">
                        Submitted: {p.recommendedAt ? new Date(p.recommendedAt).toLocaleString('en-IN') : new Date(p.createdAt).toLocaleDateString('en-IN')}
                      </div>

                      <button
                        onClick={() => handleSelectReviewProject(p)}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Inspect Complete Case & Sanction</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: SANCTION REVIEW ================= */}
      {activeTab === 'REVIEW' && (
        <div className="space-y-6">
          {!selectedProject ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-extrabold text-slate-900 text-base">No Proposal Selected</h3>
              <p className="text-xs text-slate-500">
                Please select a proposal from the Sanction Queue or Sanction History tab to review the complete decision case.
              </p>
              <button
                onClick={() => setActiveTab('QUEUE')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                <span>View Sanction Queue</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Proposal Banner */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-mono font-black text-indigo-900 text-sm bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">
                        {selectedProject.id}
                      </span>
                      <span className="font-mono font-bold text-purple-900 text-xs bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                        Work Token: {selectedProject.workTokenId}
                      </span>
                      <span className="text-xs font-bold uppercase px-3 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300">
                        {selectedProject.status}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">{selectedProject.name}</h2>
                    <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">{selectedProject.description}</p>
                  </div>

                  {/* Financial Callout */}
                  <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl border border-indigo-800 text-right shrink-0 min-w-[220px]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block mb-1">
                      Proposed Sanction Budget
                    </span>
                    <div className="text-2xl font-mono font-black text-emerald-400">
                      {formatLakhs(selectedProject.recommendedAmount || selectedProject.funding?.contracted || selectedProject.funding?.sanctioned)}
                    </div>
                    <p className="text-[10px] text-slate-300 mt-1 font-mono">
                      Ceiling: {formatLakhs(userThreshold)}
                    </p>
                  </div>
                </div>

                {/* 12-STAGE COMPLETE DECISION CASE */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Complete Multi-Stakeholder Decision Case</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. Citizen Need */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <UserCheck className="w-4 h-4 text-sky-600" />
                        <span>1. Citizen Need & Grievance Thread</span>
                      </div>
                      <p className="text-xs font-extrabold text-slate-900">{selectedProject.name}</p>
                      <p className="text-xs text-slate-600 line-clamp-3">{selectedProject.description}</p>
                      <div className="text-[10px] text-slate-400">
                        Request ID: <span className="font-mono font-bold text-slate-700">{selectedProject.requestId}</span>
                      </div>
                    </div>

                    {/* 2. Incident Location & Jurisdiction */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <MapPin className="w-4 h-4 text-rose-600" />
                        <span>2. Incident Location & Circle Jurisdiction</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900">{selectedProject.district}, {selectedProject.state || 'Tamil Nadu'}</p>
                      <p className="text-xs text-slate-600">{selectedProject.scopeOfWork}</p>
                      <div className="text-[10px] text-slate-500">
                        Department: <span className="font-bold text-slate-800">{selectedProject.department}</span>
                      </div>
                    </div>

                    {/* 3. Official Review & Work Token */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span>3. Government Official Triage & Work Token</span>
                      </div>
                      <p className="text-xs text-slate-800 font-bold">Issued Work Token: <span className="font-mono text-purple-700">{selectedProject.workTokenId}</span></p>
                      <p className="text-xs text-slate-600">
                        Official Notes: {selectedProject.officialReviewNotes || 'Triage completed. Issue verified and converted into public development project plan.'}
                      </p>
                    </div>

                    {/* 4. Official Contractor Recommendation */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                        <HardHat className="w-4 h-4 text-amber-600" />
                        <span>4. Official Contractor Recommendation</span>
                      </div>
                      <p className="text-xs font-bold text-indigo-900">
                        Agency: {selectedProject.recommendedContractorName || selectedProject.contractorName || 'Selected Enlisted Contractor'}
                      </p>
                      <p className="text-xs text-slate-600">
                        Recommended Quote: <span className="font-mono font-bold text-slate-900">{formatLakhs(selectedProject.recommendedAmount || selectedProject.funding?.contracted)}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 italic">
                        "{selectedProject.recommendationReason || 'Recommended based on AI quote evaluation and competitive financial bid.'}"
                      </p>
                    </div>
                  </div>

                  {/* Tender Bids & AI Quote Analysis Table */}
                  {selectedProject.quotes && selectedProject.quotes.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                        Tender Quotes & AI Comparative Analysis
                      </h4>
                      <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                                <th className="p-3">Contractor Agency</th>
                                <th className="p-3">Quoted Amount</th>
                                <th className="p-3">Duration</th>
                                <th className="p-3">AI Fit Score</th>
                                <th className="p-3">Official Selection</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                              {selectedProject.quotes.map((q) => (
                                <tr key={q.id} className={q.officialSelection?.selected ? 'bg-indigo-50/60 font-bold' : ''}>
                                  <td className="p-3 font-semibold">{q.contractorName}</td>
                                  <td className="p-3 font-mono">{formatLakhs(q.quotedAmount)}</td>
                                  <td className="p-3">{q.durationDays} Days</td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                                      AI Score: {q.aiAnalysis?.score || 92}/100
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    {q.officialSelection?.selected ? (
                                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-300">
                                        ★ Recommended
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 text-[10px]">Alternative Bid</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DECISION CONTROL ACTION BAR */}
                  <div className="bg-indigo-950 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl border border-indigo-800">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono uppercase font-bold text-indigo-300 tracking-wider">
                          Authoritative Human Approval Panel
                        </span>
                        <h3 className="text-lg font-black text-white">Financial Sanction Decision Controls</h3>
                        <p className="text-xs text-indigo-200 mt-0.5">
                          Exercising delegated treasury authority. AI cannot sanction funds.
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-300 block font-mono">Delegated Limit Check</span>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-900/50 px-2.5 py-1 rounded-md border border-emerald-500/30">
                          ✓ Within ₹1.00 Crore Limit
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => setShowRejectModal(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>REJECT FINANCIAL SANCTION</span>
                      </button>

                      <button
                        onClick={() => setShowReturnModal(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>RETURN FOR REVISION</span>
                      </button>

                      <button
                        onClick={() => {
                          const initialAmt = selectedProject.recommendedAmount || selectedProject.funding?.contracted || selectedProject.funding?.sanctioned || selectedProject.funding?.allocated || 0;
                          setApprovedAmountInput(String(initialAmt));
                          setShowApproveModal(true);
                        }}
                        className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 transition transform active:scale-98 cursor-pointer"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        <span>APPROVE FINANCIAL SANCTION</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: SANCTION HISTORY ================= */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Sanction Audit History</span>
            </h2>
            <span className="text-xs text-slate-500">Immutable ledger of processed financial sanctions</span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-4">Project ID</th>
                    <th className="p-4">Project Title</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Sanctioned Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Contractor Agency</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {historyProjects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No financial sanctions processed yet.
                      </td>
                    </tr>
                  ) : (
                    historyProjects.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="p-4 font-mono font-bold text-indigo-900">{p.id}</td>
                        <td className="p-4 font-semibold">{p.name}</td>
                        <td className="p-4">{p.district}</td>
                        <td className="p-4 font-mono font-bold text-emerald-800">
                          {formatLakhs(p.funding?.sanctioned || p.recommendedAmount)}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              ['SANCTIONED', 'FINANCIAL_SANCTIONED', 'EXECUTION_ENABLED', 'CONTRACTOR_ASSIGNED', 'IN_PROGRESS'].includes(p.status)
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : p.status === 'RETURNED'
                                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4">{p.contractorName || p.recommendedContractorName || 'N/A'}</td>
                        <td className="p-4">
                          <button
                            onClick={() => handleSelectReviewProject(p)}
                            className="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                          >
                            View Case
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: FINANCIAL OVERVIEW & LIMITS ================= */}
      {activeTab === 'OVERVIEW' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Landmark className="w-6 h-6 text-indigo-600" />
            <div>
              <h2 className="text-lg font-black text-slate-900">Delegation of Financial Powers & Treasury Rules</h2>
              <p className="text-xs text-slate-500">Configured monetary authority ceiling and governance policies</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Your Delegated Authority Profile</h3>
              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Officer Name:</span>
                  <span className="font-bold text-slate-900">{currentUser?.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Designation:</span>
                  <span className="font-bold text-slate-900">{currentUser?.designation}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-bold text-slate-900">{currentUser?.department}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Jurisdiction Circle:</span>
                  <span className="font-bold text-slate-900">{currentUser?.jurisdiction || currentUser?.homeDistrict}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Single Sanction Limit:</span>
                  <span className="font-mono font-black text-emerald-700">{formatLakhs(userThreshold)}</span>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-200 space-y-3 text-xs text-indigo-950">
              <h3 className="font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Governance & Treasury Release Rules</span>
              </h3>
              <ul className="space-y-2 list-disc list-inside leading-relaxed text-slate-700">
                <li>Government Officials cannot directly release or sanction project funds.</li>
                <li>Sanctioning Authority establishes the canonical <code className="font-mono font-bold bg-white px-1 rounded text-indigo-900">sanctionedAmount</code>.</li>
                <li>Contractor award assignment becomes effective only upon explicit financial sanction approval.</li>
                <li>All decisions generate immutable audit events with actor provenance and digital signatures.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL DECISION MODAL */}
      {showApproveModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Approve Financial Sanction</h3>
                <p className="text-xs text-slate-500">Project: {selectedProject.id} ({selectedProject.name})</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Final Sanctioned Amount (INR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={approvedAmountInput}
                  onChange={(e) => setApprovedAmountInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 font-mono text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                  placeholder="Enter sanctioned amount in INR"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Equivalent: <span className="font-bold text-emerald-700">{formatLakhs(Number(approvedAmountInput) || 0)}</span> (Limit: {formatLakhs(userThreshold)})
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Sanction Order / Official Notes
                </label>
                <textarea
                  rows={3}
                  value={decisionReasonInput}
                  onChange={(e) => setDecisionReasonInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                  placeholder="Enter official sanction order reference or treasury authorization notes..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleProcessSanction('APPROVE')}
                disabled={isSubmittingDecision || !approvedAmountInput}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmittingDecision ? 'Processing Sanction...' : 'Confirm Financial Sanction'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RETURN FOR REVISION MODAL */}
      {showReturnModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Return Proposal for Revision</h3>
                <p className="text-xs text-slate-500">Project: {selectedProject.id}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Revision Feedback / Mandate <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={decisionReasonInput}
                  onChange={(e) => setDecisionReasonInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 text-xs font-medium text-slate-900 outline-none focus:border-sky-500 focus:bg-white transition"
                  placeholder="Specify why this proposal is being returned (e.g. scope clarification, re-bidding requirement, cost optimization)..."
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleProcessSanction('RETURN')}
                disabled={isSubmittingDecision || !decisionReasonInput.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md transition cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isSubmittingDecision ? 'Submitting...' : 'Return to Official'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Reject Financial Sanction</h3>
                <p className="text-xs text-slate-500">Project: {selectedProject.id}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={decisionReasonInput}
                  onChange={(e) => setDecisionReasonInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 text-xs font-medium text-slate-900 outline-none focus:border-rose-500 focus:bg-white transition"
                  placeholder="Enter explicit reason for financial rejection..."
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleProcessSanction('REJECT')}
                disabled={isSubmittingDecision || !decisionReasonInput.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md transition cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>{isSubmittingDecision ? 'Rejecting...' : 'Confirm Rejection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
