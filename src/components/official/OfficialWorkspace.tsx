import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiClient } from '../../services/api';
import {
  CitizenRequest,
  IssueCluster,
  WorkToken,
  Project,
  ContractorEvidence,
  UserSession,
  Milestone,
} from '../../types/domain';
import { OfficialCommandCenter } from './OfficialCommandCenter';
import { OfficialRequestQueue } from './OfficialRequestQueue';
import { OfficialAITriageView } from './OfficialAITriageView';
import { OfficialWorkTokensView } from './OfficialWorkTokensView';
import { OfficialProjectsView } from './OfficialProjectsView';
import { OfficialFundingView } from './OfficialFundingView';
import { OfficialProcurementView } from './OfficialProcurementView';
import { OfficialContractorsView } from './OfficialContractorsView';
import { OfficialInspectionsView } from './OfficialInspectionsView';
import { OfficialSLAView } from './OfficialSLAView';
import { OfficialAuditView } from './OfficialAuditView';
import { TriageModal } from './TriageModal';
import { ClusterTriageModal } from './ClusterTriageModal';
import { CreateProjectModal } from './CreateProjectModal';
import { AssignContractorModal } from './AssignContractorModal';
import { InspectionModal } from './InspectionModal';
import { ProjectDetailModal } from '../project/ProjectDetailModal';
import { RequestDetailModal } from '../citizen/RequestDetailModal';
import {
  Shield,
  Layers,
  KeyRound,
  HardHat,
  Eye,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  FileText,
  DollarSign,
  Briefcase,
  FileCheck2,
  RotateCcw,
} from 'lucide-react';

interface OfficialWorkspaceProps {
  onOpenProject: (projectId: string) => void;
  onOpenToken: (tokenId: string) => void;
}

type OfficialWorkspaceTab =
  | 'COMMAND_CENTER'
  | 'REQUESTS'
  | 'WORK_PROJECTS'
  | 'FINANCE_PROCUREMENT'
  | 'INSPECTIONS_EVIDENCE'
  | 'AUDIT_ACTIVITY';

export const OfficialWorkspace: React.FC<OfficialWorkspaceProps> = ({
  onOpenProject,
  onOpenToken,
}) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  
  // 6 Primary Workspaces
  const [activeTab, setActiveTab] = useState<OfficialWorkspaceTab>('COMMAND_CENTER');

  // Sub-view states for consolidated workspaces
  const [requestSubView, setRequestSubView] = useState<'QUEUE' | 'AI_TRIAGE'>('QUEUE');
  const [workSubView, setWorkSubView] = useState<'PROJECTS' | 'TOKENS' | 'SLA'>('PROJECTS');
  const [financeSubView, setFinanceSubView] = useState<'FUNDING' | 'PROCUREMENT' | 'CONTRACTORS'>('FUNDING');
  const [inspectionsSubView, setInspectionsSubView] = useState<'INSPECTIONS' | 'REWORK'>('INSPECTIONS');

  // Core Data
  const [requests, setRequests] = useState<CitizenRequest[]>([]);
  const [clusters, setClusters] = useState<IssueCluster[]>([]);
  const [tokens, setTokens] = useState<WorkToken[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contractors, setContractors] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedTriageRequest, setSelectedTriageRequest] = useState<CitizenRequest | null>(null);
  const [selectedClusterForTriage, setSelectedClusterForTriage] = useState<IssueCluster | null>(null);
  const [selectedTokenForProject, setSelectedTokenForProject] = useState<WorkToken | null>(null);
  const [selectedProjectForContractor, setSelectedProjectForContractor] = useState<Project | null>(null);
  const [selectedProjectForInspection, setSelectedProjectForInspection] = useState<Project | null>(null);
  const [inspectionEvidence, setInspectionEvidence] = useState<ContractorEvidence | undefined>(undefined);
  const [selectedMilestoneForInspection, setSelectedMilestoneForInspection] = useState<Milestone | null>(null);
  const [activeProjectDetailId, setActiveProjectDetailId] = useState<string | null>(null);
  const [activeRequestDetailObj, setActiveRequestDetailObj] = useState<CitizenRequest | null>(null);

  // Rework prompt state
  const [reworkModalProject, setReworkModalProject] = useState<Project | null>(null);
  const [selectedReworkMilestoneId, setSelectedReworkMilestoneId] = useState<string>('');
  const [reworkReason, setReworkReason] = useState('');
  const [isSubmittingRework, setIsSubmittingRework] = useState(false);

  const openReworkModal = (proj: Project, milestone?: Milestone) => {
    setReworkModalProject(proj);
    const targetM =
      milestone ||
      proj.milestones?.find(
        (m) => m.status === 'UNDER_REVIEW' || m.status === 'DELAYED' || m.status === 'IN_PROGRESS'
      ) ||
      proj.milestones?.[0];
    setSelectedReworkMilestoneId(targetM?.id || '');
    setReworkReason(
      proj.reworkRequiredMessage ||
        'Official site inspection confirms AI discrepancy analysis. Core compaction density or layer finishing does not satisfy PWD IRC criteria. Remediation mandated.'
    );
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [reqData, clusterData, tokenData, projectData, allUsers] = await Promise.all([
        apiClient.getOfficialRequests(),
        apiClient.getOfficialClusters(),
        apiClient.getWorkTokens(),
        apiClient.getProjects(),
        apiClient.getUsers(),
      ]);
      setRequests(reqData);
      setClusters(clusterData);
      setTokens(tokenData);
      setProjects(projectData);
      setContractors(allUsers.filter((u) => u.role === 'CONTRACTOR'));
    } catch (err) {
      console.error('Failed to load official workspace data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser?.id]);

  useEffect(() => {
    const handleCfcNavigate = (e: any) => {
      const target = e.detail;
      if (!target) return;
      if (target === 'OFFICIAL_COMMAND_CENTER' || target === 'COMMAND_CENTER') {
        setActiveTab('COMMAND_CENTER');
      } else if (
        target === 'OFFICIAL_REQUEST_QUEUE' ||
        target === 'REQUEST_QUEUE' ||
        target === 'REQUESTS'
      ) {
        setActiveTab('REQUESTS');
        setRequestSubView('QUEUE');
      } else if (target === 'OFFICIAL_AI_TRIAGE' || target === 'AI_TRIAGE') {
        setActiveTab('REQUESTS');
        setRequestSubView('AI_TRIAGE');
      } else if (target === 'OFFICIAL_TRIAGE') {
        setActiveTab('REQUESTS');
        setRequestSubView('QUEUE');
        const pending = requests.find((r) => r.status === 'SUBMITTED');
        if (pending) setSelectedTriageRequest(pending);
      } else if (
        target === 'OFFICIAL_WORK_TOKENS' ||
        target === 'WORK_TOKENS' ||
        target === 'OFFICIAL_WORK_TOKEN'
      ) {
        setActiveTab('WORK_PROJECTS');
        setWorkSubView('TOKENS');
      } else if (
        target === 'OFFICIAL_PROJECTS' ||
        target === 'PROJECTS' ||
        target === 'OFFICIAL_PROJECT_SANCTION'
      ) {
        setActiveTab('WORK_PROJECTS');
        setWorkSubView('PROJECTS');
      } else if (target === 'OFFICIAL_SLA' || target === 'SLA') {
        setActiveTab('WORK_PROJECTS');
        setWorkSubView('SLA');
      } else if (target === 'OFFICIAL_FUNDING' || target === 'FUNDING') {
        setActiveTab('FINANCE_PROCUREMENT');
        setFinanceSubView('FUNDING');
      } else if (target === 'OFFICIAL_PROCUREMENT' || target === 'PROCUREMENT') {
        setActiveTab('FINANCE_PROCUREMENT');
        setFinanceSubView('PROCUREMENT');
      } else if (target === 'OFFICIAL_CONTRACTORS' || target === 'CONTRACTORS') {
        setActiveTab('FINANCE_PROCUREMENT');
        setFinanceSubView('CONTRACTORS');
      } else if (
        target === 'OFFICIAL_INSPECTIONS' ||
        target === 'INSPECTIONS' ||
        target === 'OFFICIAL_REINSPECTION'
      ) {
        setActiveTab('INSPECTIONS_EVIDENCE');
        setInspectionsSubView('INSPECTIONS');
      } else if (target === 'OFFICIAL_INSPECTION_REWORK') {
        setActiveTab('INSPECTIONS_EVIDENCE');
        setInspectionsSubView('REWORK');
      } else if (target === 'OFFICIAL_AUDIT' || target === 'AUDIT') {
        setActiveTab('AUDIT_ACTIVITY');
      }
    };

    window.addEventListener('cfc-navigate', handleCfcNavigate);
    return () => {
      window.removeEventListener('cfc-navigate', handleCfcNavigate);
    };
  }, [requests]);

  const handleCommandCenterNavigate = (view: string, options?: any) => {
    if (view === 'REQUESTS' || view === 'REQUEST_QUEUE') {
      setActiveTab('REQUESTS');
      setRequestSubView('QUEUE');
    } else if (view === 'WORK_PROJECTS' || view === 'PROJECTS') {
      setActiveTab('WORK_PROJECTS');
      setWorkSubView(options?.subView || 'PROJECTS');
    } else if (view === 'WORK_TOKENS') {
      setActiveTab('WORK_PROJECTS');
      setWorkSubView('TOKENS');
    } else if (view === 'SLA') {
      setActiveTab('WORK_PROJECTS');
      setWorkSubView('SLA');
    } else if (
      view === 'FINANCE_PROCUREMENT' ||
      view === 'FUNDING' ||
      view === 'PROCUREMENT' ||
      view === 'CONTRACTORS'
    ) {
      setActiveTab('FINANCE_PROCUREMENT');
      setFinanceSubView(options?.subView || 'FUNDING');
    } else if (view === 'INSPECTIONS_EVIDENCE' || view === 'INSPECTIONS') {
      setActiveTab('INSPECTIONS_EVIDENCE');
      setInspectionsSubView(options?.subView || 'INSPECTIONS');
    } else if (view === 'AUDIT_ACTIVITY' || view === 'AUDIT') {
      setActiveTab('AUDIT_ACTIVITY');
    } else {
      setActiveTab('COMMAND_CENTER');
    }
  };

  const handleTriageComplete = (_updatedRequest: CitizenRequest) => {
    setSelectedTriageRequest(null);
    fetchData();
  };

  const handleClusterTriageComplete = (_updatedCluster: IssueCluster, _workToken?: WorkToken) => {
    setSelectedClusterForTriage(null);
    fetchData();
  };

  const handleProjectCreated = (_newProject: Project) => {
    setSelectedTokenForProject(null);
    fetchData();
  };

  const handleContractorAssigned = (_updatedProject: Project) => {
    setSelectedProjectForContractor(null);
    fetchData();
  };

  const handleInspectionComplete = () => {
    setSelectedProjectForInspection(null);
    setInspectionEvidence(undefined);
    setSelectedMilestoneForInspection(null);
    fetchData();
  };

  const handleRequireReworkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reworkModalProject || !reworkReason.trim()) return;

    setIsSubmittingRework(true);
    try {
      const milestoneId =
        selectedReworkMilestoneId ||
        reworkModalProject.milestones?.find(
          (m) => m.status === 'UNDER_REVIEW' || m.status === 'DELAYED' || m.status === 'IN_PROGRESS'
        )?.id ||
        reworkModalProject.milestones?.[0]?.id ||
        'M1';
      await apiClient.requireRework(reworkModalProject.id, milestoneId, reworkReason.trim());
      setReworkModalProject(null);
      setReworkReason('');
      setSelectedReworkMilestoneId('');
      await fetchData();
    } catch (err) {
      console.error('Failed to require rework:', err);
    } finally {
      setIsSubmittingRework(false);
    }
  };

  const handleCertifyFinalCompletion = async (projectId: string) => {
    try {
      await apiClient.completeProject(
        projectId,
        'All civil milestones inspected, field compaction verified, and certified complete.'
      );
      await fetchData();
    } catch (err) {
      console.error('Failed to complete project:', err);
    }
  };

  const pendingRequestsCount = requests.filter((r) => r.status === 'SUBMITTED').length;
  const activeTokensCount = tokens.filter((t) => t.status === 'ACTIVE').length;
  const inspectionDueCount = projects.filter(
    (p) => p.status === 'VERIFICATION_REQUIRED' || p.status === 'DELAYED'
  ).length;
  const reworkProjectsList = projects.filter(
    (p) =>
      p.status === 'DELAYED' ||
      p.milestones?.some((m) => m.status === 'REJECTED' || m.status === 'DELAYED' || Boolean(m.reworkNotes)) ||
      Boolean(p.reworkRequiredMessage)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Consolidated 6-Workspace Official Navigation Bar */}
      <nav className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {/* 1. Command Center */}
          <button
            type="button"
            onClick={() => setActiveTab('COMMAND_CENTER')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'COMMAND_CENTER'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>{t('navCommandCenter') || 'Command Center'}</span>
          </button>

          {/* 2. Requests */}
          <button
            type="button"
            onClick={() => setActiveTab('REQUESTS')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'REQUESTS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t('navRequests') || 'Requests'}</span>
            {pendingRequestsCount > 0 && (
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  activeTab === 'REQUESTS'
                    ? 'bg-emerald-800 text-emerald-100'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {pendingRequestsCount}
              </span>
            )}
          </button>

          {/* 3. Work & Projects */}
          <button
            type="button"
            onClick={() => setActiveTab('WORK_PROJECTS')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'WORK_PROJECTS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t('navWorkProjects') || 'Work & Projects'}</span>
            <span
              className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                activeTab === 'WORK_PROJECTS'
                  ? 'bg-blue-800 text-blue-100'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {projects.length}
            </span>
          </button>

          {/* 4. Procurement & Contractor Review */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('FINANCE_PROCUREMENT');
              setFinanceSubView('PROCUREMENT');
            }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'FINANCE_PROCUREMENT'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Procurement & Contractor Review</span>
          </button>

          {/* 5. Inspections & Evidence */}
          <button
            type="button"
            onClick={() => setActiveTab('INSPECTIONS_EVIDENCE')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'INSPECTIONS_EVIDENCE'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{t('navInspectionsEvidence') || 'Inspections & Evidence'}</span>
            {inspectionDueCount > 0 && (
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  activeTab === 'INSPECTIONS_EVIDENCE'
                    ? 'bg-teal-800 text-teal-100'
                    : 'bg-teal-100 text-teal-800'
                }`}
              >
                {inspectionDueCount}
              </span>
            )}
          </button>

          {/* 6. Audit & Activity */}
          <button
            type="button"
            onClick={() => setActiveTab('AUDIT_ACTIVITY')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'AUDIT_ACTIVITY'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>{t('navAuditActivity') || 'Audit & Activity'}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={fetchData}
          disabled={isLoading}
          className="p-2.5 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition cursor-pointer shrink-0"
          title="Refresh Workspace Data"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </nav>

      {/* Main Workspace Views */}
      <main>
        {/* 1. Command Center */}
        {activeTab === 'COMMAND_CENTER' && (
          <OfficialCommandCenter
            requests={requests}
            tokens={tokens}
            projects={projects}
            onNavigate={handleCommandCenterNavigate}
            onOpenTriage={(req) => setSelectedTriageRequest(req)}
            onOpenCreateProject={(tok) => setSelectedTokenForProject(tok)}
            onOpenInspection={(proj: Project, ev?: ContractorEvidence, m?: Milestone) => {
              setSelectedProjectForInspection(proj);
              setInspectionEvidence(ev);
              setSelectedMilestoneForInspection(m || null);
            }}
            onOpenProjectDetail={(pId) => setActiveProjectDetailId(pId)}
          />
        )}

        {/* 2. Requests Workspace */}
        {activeTab === 'REQUESTS' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRequestSubView('QUEUE')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  requestSubView === 'QUEUE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Grievance Queue</span>
                {pendingRequestsCount > 0 && (
                  <span className="text-[10px] bg-emerald-800 text-emerald-100 px-1.5 py-0.2 rounded-full">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setRequestSubView('AI_TRIAGE')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  requestSubView === 'AI_TRIAGE'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                <span>AI Triage & Safety Intelligence</span>
              </button>
            </div>

            {requestSubView === 'QUEUE' ? (
              <OfficialRequestQueue
                requests={requests}
                clusters={clusters}
                onOpenRequestDetail={(req) => setActiveRequestDetailObj(req)}
                onOpenTriage={(req) => setSelectedTriageRequest(req)}
                onOpenClusterTriage={(cluster) => setSelectedClusterForTriage(cluster)}
              />
            ) : (
              <OfficialAITriageView
                requests={requests}
                onOpenTriageModal={(req) => setSelectedTriageRequest(req)}
                currentUser={currentUser}
              />
            )}
          </div>
        )}

        {/* 3. Work & Projects Workspace */}
        {activeTab === 'WORK_PROJECTS' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setWorkSubView('PROJECTS')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  workSubView === 'PROJECTS'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Project Directory ({projects.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setWorkSubView('TOKENS')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  workSubView === 'TOKENS'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Work Action Tokens ({tokens.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setWorkSubView('SLA')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  workSubView === 'SLA'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>SLA Monitor & Escalations</span>
              </button>
            </div>

            {workSubView === 'PROJECTS' && (
              <OfficialProjectsView
                projects={projects}
                onOpenProjectDetail={(pId) => setActiveProjectDetailId(pId)}
                onOpenAssignContractor={(proj) => setSelectedProjectForContractor(proj)}
                onOpenInspection={(proj: Project, ev?: ContractorEvidence, m?: Milestone) => {
                  setSelectedProjectForInspection(proj);
                  setInspectionEvidence(ev);
                  setSelectedMilestoneForInspection(m || null);
                }}
                onOpenReworkModal={(proj) => openReworkModal(proj)}
                onCompleteProject={(pId) => handleCertifyFinalCompletion(pId)}
              />
            )}

            {workSubView === 'TOKENS' && (
              <OfficialWorkTokensView
                tokens={tokens}
                projects={projects}
                onOpenCreateProject={(tok) => setSelectedTokenForProject(tok)}
                onOpenProjectDetail={(pId) => setActiveProjectDetailId(pId)}
              />
            )}

            {workSubView === 'SLA' && (
              <OfficialSLAView
                requests={requests}
                projects={projects}
                onOpenTriage={(req) => setSelectedTriageRequest(req)}
                onOpenProjectDetail={(pId) => setActiveProjectDetailId(pId)}
              />
            )}
          </div>
        )}

        {/* 4. Finance & Procurement Workspace */}
        {activeTab === 'FINANCE_PROCUREMENT' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setFinanceSubView('PROCUREMENT')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  financeSubView === 'PROCUREMENT'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Procurement & Tenders</span>
              </button>

              <button
                type="button"
                onClick={() => setFinanceSubView('CONTRACTORS')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  financeSubView === 'CONTRACTORS'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <HardHat className="w-3.5 h-3.5" />
                <span>Contractor Directory & Performance</span>
              </button>
            </div>

            {financeSubView === 'PROCUREMENT' && (
              <OfficialProcurementView
                projects={projects}
                onOpenAssignContractor={(proj) => setSelectedProjectForContractor(proj)}
                onOpenProjectDetail={(pId) => setActiveProjectDetailId(pId)}
              />
            )}

            {financeSubView === 'CONTRACTORS' && (
              <OfficialContractorsView
                projects={projects}
                contractors={contractors}
                onOpenProjectDetail={(pId) => setActiveProjectDetailId(pId)}
              />
            )}
          </div>
        )}

        {/* 5. Inspections & Evidence Workspace */}
        {activeTab === 'INSPECTIONS_EVIDENCE' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInspectionsSubView('INSPECTIONS')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  inspectionsSubView === 'INSPECTIONS'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Site Inspections & Scrutiny</span>
                {inspectionDueCount > 0 && (
                  <span className="text-[10px] bg-teal-800 text-teal-100 px-1.5 py-0.2 rounded-full">
                    {inspectionDueCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setInspectionsSubView('REWORK')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  inspectionsSubView === 'REWORK'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Active Rework Directives</span>
                {reworkProjectsList.length > 0 && (
                  <span className="text-[10px] bg-rose-800 text-rose-100 px-1.5 py-0.2 rounded-full">
                    {reworkProjectsList.length}
                  </span>
                )}
              </button>
            </div>

            {inspectionsSubView === 'INSPECTIONS' ? (
              <OfficialInspectionsView
                projects={projects}
                currentUser={currentUser}
                onOpenInspectionModal={(proj, ev, m) => {
                  setSelectedProjectForInspection(proj);
                  setInspectionEvidence(ev);
                  setSelectedMilestoneForInspection(m || null);
                }}
                onOpenReworkModal={(proj) => openReworkModal(proj)}
                onOpenProjectDetail={(pId) => setActiveProjectDetailId(pId)}
                onCompleteProject={(pId) => handleCertifyFinalCompletion(pId)}
              />
            ) : (
              /* Focused Rework Directives Workspace View */
              <div className="space-y-4">
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <h3 className="font-extrabold text-sm text-rose-950">
                      Mandated Contractor Remediations & Engineering Directives
                    </h3>
                  </div>
                  <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                    Civil works flagged for layer compaction failure, material discrepancy, or safety violations. Public funding disbursements are held until certified on-site remediation.
                  </p>
                </div>

                {reworkProjectsList.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                    No active rework orders. All contractor milestones satisfy civic engineering benchmarks.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {reworkProjectsList.map((proj) => (
                      <div
                        key={proj.id}
                        className="bg-white rounded-2xl border border-rose-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 max-w-2xl">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                              {proj.id}
                            </span>
                            <span className="text-xs font-extrabold text-slate-900">
                              {proj.name}
                            </span>
                            <span className="text-[10px] text-slate-500">• {proj.district}</span>
                          </div>
                          <p className="text-xs text-rose-900 bg-rose-50 p-3 rounded-xl border border-rose-100 font-medium">
                            <strong>Directive:</strong> {proj.reworkRequiredMessage || 'Field inspection discrepancy noted. Remediation mandated.'}
                          </p>
                          <div className="text-[11px] text-slate-500 flex items-center gap-3">
                            <span>Contractor: <strong className="text-slate-700">{proj.contractorName || 'Assigned Contractor'}</strong></span>
                            <span>Status: <strong className="text-rose-600 uppercase font-bold">{proj.status}</strong></span>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProjectForInspection(proj);
                            }}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Launch Re-Inspection
                          </button>
                          <button
                            type="button"
                            onClick={() => openReworkModal(proj)}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Update Directive
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveProjectDetailId(proj.id)}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 6. Audit & Activity Workspace */}
        {activeTab === 'AUDIT_ACTIVITY' && <OfficialAuditView />}
      </main>

      {/* Modals */}
      {selectedClusterForTriage && (
        <ClusterTriageModal
          cluster={selectedClusterForTriage}
          onClose={() => setSelectedClusterForTriage(null)}
          onSuccess={(updatedCluster, workToken) => {
            setSelectedClusterForTriage(null);
            fetchData();
          }}
        />
      )}

      {selectedTriageRequest && (
        <TriageModal
          request={selectedTriageRequest}
          onClose={() => setSelectedTriageRequest(null)}
          onSuccess={handleTriageComplete}
        />
      )}

      {selectedClusterForTriage && (
        <ClusterTriageModal
          cluster={selectedClusterForTriage}
          onClose={() => setSelectedClusterForTriage(null)}
          onSuccess={handleClusterTriageComplete}
        />
      )}

      {selectedTokenForProject && (
        <CreateProjectModal
          workToken={selectedTokenForProject}
          onClose={() => setSelectedTokenForProject(null)}
          onSuccess={handleProjectCreated}
        />
      )}

      {selectedProjectForContractor && (
        <AssignContractorModal
          project={selectedProjectForContractor}
          contractors={contractors}
          onClose={() => setSelectedProjectForContractor(null)}
          onSuccess={handleContractorAssigned}
        />
      )}

      {selectedProjectForInspection && (() => {
        const activeMilestone =
          selectedMilestoneForInspection ||
          selectedProjectForInspection.milestones?.find((m) => m.id === inspectionEvidence?.milestoneId) ||
          selectedProjectForInspection.milestones?.find((m) => m.status === 'UNDER_REVIEW') ||
          selectedProjectForInspection.milestones?.find((m) => m.status === 'IN_PROGRESS') ||
          selectedProjectForInspection.milestones?.find((m) => m.status === 'DELAYED') ||
          selectedProjectForInspection.milestones?.find((m) => m.status !== 'VERIFIED') ||
          selectedProjectForInspection.milestones?.[0] || {
            id: 'M1',
            title: 'Initial Execution',
            description: 'Site preparation and material mobilization',
            sequence: 1,
            targetDate: new Date().toISOString(),
            completionPercentageClaimed: 100,
            status: 'VERIFICATION_REQUIRED',
          };

        const activeEvidence =
          inspectionEvidence || {
            id: `EV-${selectedProjectForInspection.id}-${activeMilestone.id}`,
            projectId: selectedProjectForInspection.id,
            milestoneId: activeMilestone.id,
            submittedBy: selectedProjectForInspection.contractorId || 'ctr-001',
            submittedByName: selectedProjectForInspection.contractorName || 'Assigned Contractor',
            submittedAt: new Date().toISOString(),
            description: `Site ground photo evidence for milestone: ${activeMilestone.title}`,
            mediaRefs: selectedProjectForInspection.evidence?.[0] ? selectedProjectForInspection.evidence[0].mediaRefs : [],
            claimedProgress: 100,
            location: {
              label: `${selectedProjectForInspection.district || 'Worksite'} Location`,
            },
            status: 'SUBMITTED',
            provenance: 'CONTRACTOR_SUBMISSION',
          };

        return (
          <InspectionModal
            project={selectedProjectForInspection}
            milestone={activeMilestone}
            evidence={activeEvidence}
            onClose={() => {
              setSelectedProjectForInspection(null);
              setSelectedMilestoneForInspection(null);
              setInspectionEvidence(undefined);
            }}
            onSuccess={handleInspectionComplete}
          />
        );
      })()}

      {activeProjectDetailId && (
        <ProjectDetailModal
          projectId={activeProjectDetailId}
          onClose={() => setActiveProjectDetailId(null)}
        />
      )}

      {activeRequestDetailObj && (
        <RequestDetailModal
          request={activeRequestDetailObj}
          onClose={() => setActiveRequestDetailObj(null)}
          isOfficial={true}
          onOfficialTriage={(req) => {
            setActiveRequestDetailObj(null);
            setSelectedTriageRequest(req);
          }}
          onOpenProject={(pId) => {
            setActiveRequestDetailObj(null);
            setActiveProjectDetailId(pId);
          }}
          onOpenToken={(tId) => {
            setActiveRequestDetailObj(null);
            setActiveTab('WORK_PROJECTS');
            setWorkSubView('TOKENS');
          }}
        />
      )}

      {/* Rework Reason Modal */}
      {reworkModalProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-lg text-slate-900">
              {t('details')} — {reworkModalProject.id}
            </h3>

            <form onSubmit={handleRequireReworkSubmit} className="space-y-4">
              {reworkModalProject.milestones && reworkModalProject.milestones.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Milestone for Remediation *
                  </label>
                  <select
                    value={selectedReworkMilestoneId}
                    onChange={(e) => setSelectedReworkMilestoneId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-red-500 focus:outline-none cursor-pointer"
                  >
                    {reworkModalProject.milestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        Phase {m.sequence}: {m.title} ({m.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rejection Reason / Required Remediation *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reworkReason}
                  onChange={(e) => setReworkReason(e.target.value)}
                  placeholder="Specify engineering defect, compaction failure, or missing site safety requirements..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReworkModalProject(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  {t('close')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRework}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md"
                >
                  {isSubmittingRework ? 'Issuing...' : 'Issue Rework Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
