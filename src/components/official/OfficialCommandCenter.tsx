import React from 'react';
import { CitizenRequest, WorkToken, Project, ContractorEvidence, Milestone } from '../../types/domain';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { useLanguage } from '../../context/LanguageContext';
import { getRequestSlaInfo, getProjectSlaInfo } from '../../utils/sla';
import {
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Activity,
  Layers,
  HardHat,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Eye,
  KeyRound,
  DollarSign,
  AlertCircle,
  Building,
  CheckSquare,
} from 'lucide-react';

interface OfficialCommandCenterProps {
  requests: CitizenRequest[];
  tokens: WorkToken[];
  projects: Project[];
  onNavigate: (view: any, options?: any) => void;
  onOpenTriage: (request: CitizenRequest) => void;
  onOpenCreateProject: (token: WorkToken) => void;
  onOpenInspection: (project: Project, evidence?: ContractorEvidence, milestone?: Milestone) => void;
  onOpenProjectDetail: (projectId: string) => void;
}

export const OfficialCommandCenter: React.FC<OfficialCommandCenterProps> = ({
  requests,
  tokens,
  projects,
  onNavigate,
  onOpenTriage,
  onOpenCreateProject,
  onOpenInspection,
  onOpenProjectDetail,
}) => {
  const { t } = useLanguage();

  // 1. Pending Requests (Awaiting administrative triage)
  const pendingRequests = requests.filter((r) => r.status === 'SUBMITTED');

  // 2. Urgent / Safety Alerts (Safety hazards or critical/high severity)
  const urgentSafetyRequests = requests.filter(
    (r) =>
      r.status === 'SUBMITTED' &&
      (r.aiAnalysis?.severity === 'CRITICAL' ||
        r.aiAnalysis?.severity === 'HIGH' ||
        r.aiAnalysis?.category === 'SAFETY_HAZARD')
  );

  // 3. SLA Due Soon (Requests with triage due in <= 12h or resolution due soon, or projects nearing target date within 7 days)
  const requestsDueSoon = requests.filter((r) => {
    if (r.status === 'COMPLETED') return false;
    const sla = getRequestSlaInfo(r);
    return sla.isTriageDueSoon || sla.isResolutionDueSoon;
  });
  const projectsDueSoon = projects.filter((p) => {
    if (p.status === 'COMPLETED') return false;
    const sla = getProjectSlaInfo(p);
    return sla.isDueSoon;
  });
  const totalSlaDueSoon = requestsDueSoon.length + projectsDueSoon.length;

  // 4. SLA Breached (Requests where triage/resolution deadline passed, or projects overdue)
  const requestsBreached = requests.filter((r) => {
    if (r.status === 'COMPLETED') return false;
    const sla = getRequestSlaInfo(r);
    return sla.isTriageBreached || sla.isResolutionBreached;
  });
  const projectsBreached = projects.filter((p) => {
    if (p.status === 'COMPLETED') return false;
    const sla = getProjectSlaInfo(p);
    return sla.isBreached;
  });
  const totalSlaBreached = requestsBreached.length + projectsBreached.length;

  // 5. Pending Approvals (Active tokens awaiting project creation or projects awaiting contractor)
  const unassignedTokens = tokens.filter(
    (t) => t.status === 'ACTIVE' && !projects.some((p) => p.workTokenId === t.id)
  );
  const unassignedProjects = projects.filter((p) => !p.contractorId);
  const totalPendingApprovals = unassignedTokens.length + unassignedProjects.length;

  // 6. Projects Needing Attention (Delayed or Verification Required projects)
  const attentionProjects = projects.filter(
    (p) => p.status === 'DELAYED' || p.status === 'VERIFICATION_REQUIRED'
  );

  // 7. Pending Inspections (Projects waiting for milestone inspection sign-off)
  const pendingInspections = projects.filter(
    (p) =>
      p.status === 'VERIFICATION_REQUIRED' ||
      p.milestones?.some((m) => m.status === 'UNDER_REVIEW')
  );

  // 8. Rework Required (Projects with active rework mandates)
  const reworkProjects = projects.filter(
    (p) =>
      p.status === 'DELAYED' ||
      p.milestones?.some((m) => m.status === 'REJECTED' || m.status === 'DELAYED' || Boolean(m.reworkNotes)) ||
      Boolean(p.reworkRequiredMessage)
  );

  const totalAllocated = projects.reduce((acc, p) => acc + (p.funding?.allocated || 0), 0);
  const totalSanctioned = projects.reduce((acc, p) => acc + (p.funding?.sanctioned || 0), 0);
  const totalExpenditure = projects.reduce((acc, p) => acc + (p.funding?.expenditure || 0), 0);
  const totalRemaining = totalAllocated - totalExpenditure;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Official Executive Header */}
      <div className="bg-linear-to-r from-emerald-950 via-slate-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                {t('officialCommandCenterTitle') || 'Government Command Center'}
              </span>
              <span className="text-slate-400 text-xs">|</span>
              <ProvenanceBadge type="OFFICIAL_DECISION" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {t('publicWorksGovernance') || 'Public Works Governance'}
            </h2>
            <p className="text-slate-300 text-xs leading-relaxed">
              {t('officialGovSub') ||
                'Authoritative operational command answering: What requires my attention right now?'}
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5">
            {pendingRequests.length > 0 ? (
              <button
                type="button"
                onClick={() => onOpenTriage(pendingRequests[0])}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition transform active:scale-98 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t('triageNextRequest') || 'Triage Next Request'} ({pendingRequests.length})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('REQUESTS', { filter: 'ALL' })}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
              >
                <span>{t('openRequestQueue') || 'Open Requests'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigate('INSPECTIONS_EVIDENCE', { subView: 'INSPECTIONS' })}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 transition cursor-pointer"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>{t('inspectionsDue') || 'Inspections Due'} ({pendingInspections.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8 Connected Real Operational Metrics ("What requires my attention right now?") */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Operational Priorities & Attention Demands</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            Live persisted metrics across 6 operational domains
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Pending Requests */}
          <div
            onClick={() => onNavigate('REQUESTS', { filter: 'SUBMITTED' })}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-amber-400 transition cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pending Requests
              </span>
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs">
                {pendingRequests.length}
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-slate-900">
                {pendingRequests.length}
              </div>
              <p className="text-xs text-slate-500">
                Grievances awaiting official intake and triage
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
              <span>Review Requests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 2. Urgent / Safety Alerts */}
          <div
            onClick={() => onNavigate('REQUESTS', { filter: 'URGENT' })}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-red-400 transition cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Urgent / Safety Alerts
              </span>
              <span className="w-7 h-7 rounded-lg bg-red-100 text-red-800 flex items-center justify-center font-black text-xs">
                {urgentSafetyRequests.length}
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-red-600">
                {urgentSafetyRequests.length}
              </div>
              <p className="text-xs text-slate-500">
                High hazard & safety hazards flagged by AI
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-red-700">
              <span>View Safety Alerts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 3. SLA Due Soon */}
          <div
            onClick={() => onNavigate('WORK_PROJECTS', { subView: 'SLA' })}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-amber-400 transition cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                SLA Due Soon
              </span>
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs">
                {totalSlaDueSoon}
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-amber-600">
                {totalSlaDueSoon}
              </div>
              <p className="text-xs text-slate-500">
                {requestsDueSoon.length} requests, {projectsDueSoon.length} projects near deadline
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
              <span>Monitor SLAs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 4. SLA Breached */}
          <div
            onClick={() => onNavigate('WORK_PROJECTS', { subView: 'SLA' })}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-rose-400 transition cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                SLA Breached
              </span>
              <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-black text-xs">
                {totalSlaBreached}
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-rose-600">
                {totalSlaBreached}
              </div>
              <p className="text-xs text-slate-500">
                {requestsBreached.length} requests, {projectsBreached.length} projects breached
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-700">
              <span>Escalate & Resolve</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 5. Pending Approvals */}
          <div
            onClick={() => onNavigate('FINANCE_PROCUREMENT', { subView: 'FUNDING' })}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-purple-400 transition cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pending Approvals
              </span>
              <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-black text-xs">
                {totalPendingApprovals}
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-purple-700">
                {totalPendingApprovals}
              </div>
              <p className="text-xs text-slate-500">
                {unassignedTokens.length} tokens to project, {unassignedProjects.length} pending bids
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700">
              <span>Authorize & Sanction</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 6. Projects Needing Attention */}
          <div
            onClick={() => onNavigate('WORK_PROJECTS', { subView: 'PROJECTS' })}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-400 transition cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Projects Needing Attention
              </span>
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-black text-xs">
                {attentionProjects.length}
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-blue-700">
                {attentionProjects.length}
              </div>
              <p className="text-xs text-slate-500">
                Civil works delayed or requiring field verification
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
              <span>Open Project Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 7. Pending Inspections */}
          <div
            onClick={() => onNavigate('INSPECTIONS_EVIDENCE', { subView: 'INSPECTIONS' })}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-teal-400 transition cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pending Inspections
              </span>
              <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-black text-xs">
                {pendingInspections.length}
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-teal-700">
                {pendingInspections.length}
              </div>
              <p className="text-xs text-slate-500">
                Milestones ready for photo & engineering certification
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700">
              <span>Conduct Inspection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 8. Rework Required */}
          <div
            onClick={() => onNavigate('INSPECTIONS_EVIDENCE', { subView: 'REWORK' })}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-rose-400 transition cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Rework Required
              </span>
              <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-black text-xs">
                {reworkProjects.length}
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-rose-700">
                {reworkProjects.length}
              </div>
              <p className="text-xs text-slate-500">
                Discrepancy remediations active for contractors
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-700">
              <span>View Rework Directives</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Health Summary */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>Public Works Fiscal Summary</span>
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('FINANCE_PROCUREMENT', { subView: 'FUNDING' })}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Funding & Procurement</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Sanctioned</span>
            <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">
              ₹{(totalSanctioned / 100000).toFixed(1)}L
            </div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Allocated Budget</span>
            <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
              ₹{(totalAllocated / 100000).toFixed(1)}L
            </div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Disbursed Expenditure</span>
            <div className="text-lg font-black text-blue-700 font-mono mt-0.5">
              ₹{(totalExpenditure / 100000).toFixed(1)}L
            </div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Remaining Treasury</span>
            <div className="text-lg font-black text-amber-700 font-mono mt-0.5">
              ₹{(totalRemaining / 100000).toFixed(1)}L
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
