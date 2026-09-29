import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import {
  PolicymakerIntelligenceData,
  RegionalIntelligence,
  ConstituencyIntelligence,
  ServiceGapItem,
  DelayedProjectItem,
  EvidenceDivergenceCase,
  LifecycleStageMetrics,
  Project,
  CitizenRequest,
  WorkToken,
  AuditEvent,
} from '../../types/domain';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { DigitalThreadBadge } from '../common/DigitalThreadBadge';
import { ProjectDetailModal } from '../project/ProjectDetailModal';
import {
  TrendingUp,
  Building2,
  AlertTriangle,
  IndianRupee,
  Sparkles,
  PieChart,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  Layers,
  ShieldCheck,
  RotateCcw,
  MapPin,
  Clock,
  Send,
  HelpCircle,
  FileText,
  Search,
  ChevronRight,
  Filter,
  Eye,
  Info,
  Check,
  ShieldAlert,
  ArrowUpRight,
  Activity,
  Compass,
  Scale,
  Flame,
  UserCheck,
  Inbox,
  History,
  Folder,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  XCircle,
  Award,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';

interface PolicymakerWorkspaceProps {
  onOpenProject: (projectId: string) => void;
  onOpenToken: (tokenId: string) => void;
}

type MainTabType = 'decision_inbox' | 'intelligence' | 'funding' | 'portfolio' | 'history';
type IntelligenceSubTabType = 'regional' | 'constituency' | 'service_gaps' | 'lifecycle' | 'ai_insights';
type PortfolioSubTabType = 'all_projects' | 'delayed' | 'divergence';

export const PolicymakerWorkspace: React.FC<PolicymakerWorkspaceProps> = ({
  onOpenProject,
  onOpenToken,
}) => {
  const { currentUser } = useAuth();
  const [intelData, setIntelData] = useState<PolicymakerIntelligenceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MainTabType>('decision_inbox');
  const [approvedAmount, setApprovedAmount] = useState<number>(0);
  
  // Sub-tabs states
  const [activeIntelSubTab, setActiveIntelSubTab] = useState<IntelligenceSubTabType>('regional');
  const [activePortfolioSubTab, setActivePortfolioSubTab] = useState<PortfolioSubTabType>('all_projects');

  // Selected proposed project for sanctioning detail view
  const [selectedProposedId, setSelectedProposedId] = useState<string | null>(null);
  const [proposedProjectDetail, setProposedProjectDetail] = useState<(Project & {
    citizenRequest?: CitizenRequest;
    workToken?: WorkToken;
  }) | null>(null);
  const [isLoadingProposal, setIsLoadingProposal] = useState(false);
  const [proposalReason, setProposedReason] = useState('');
  const [sanctionStatusMessage, setSanctionStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmittingSanction, setIsSubmittingSanction] = useState(false);

  // Selected project from general portfolio to open the generic details modal
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Filters & Interactivity
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedScheme, setSelectedScheme] = useState<string>('ALL');
  const [projectSearch, setProjectSearch] = useState<string>('');

  // AI Insights Query State
  const [aiQuery, setAiQuery] = useState('');
  const [isQueryingAi, setIsQueryingAi] = useState(false);
  const [queryResult, setQueryResult] = useState<{
    answer: string;
    keyInsights: string[];
    recommendedActions: string[];
    citedProjects: string[];
    confidence: number;
    modelUsed: string;
    disclaimer: string;
  } | null>(null);

  // Immutable Decision history local caching (or from audits)
  const [decisionsHistory, setDecisionsHistory] = useState<AuditEvent[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchIntelligence = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getPolicymakerIntelligence();
      setIntelData(data);
    } catch (err) {
      console.error('Failed to load policymaker intelligence:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProposalDetail = async (id: string) => {
    setIsLoadingProposal(true);
    setProposedReason('');
    setSanctionStatusMessage(null);
    try {
      const detail: any = await apiClient.getProjectById(id);
      setProposedProjectDetail(detail);
      if (detail && detail.funding) {
        setApprovedAmount(detail.funding.sanctioned || detail.funding.allocated || 0);
      }
    } catch (err: any) {
      console.error('Failed to load proposal details:', err);
      setSanctionStatusMessage({ type: 'error', text: err.message || 'Failed to load proposed project details.' });
    } finally {
      setIsLoadingProposal(false);
    }
  };

  const fetchDecisionsHistory = async () => {
    setIsLoadingHistory(true);
    try {
      // Query all audit logs on the system and filter for project sanction actions
      const events: any = await apiClient.getAuditEvents();
      const policymakerActions = events.filter((e: any) => 
        e.action === 'PROJECT_SANCTION_APPROVED' || 
        e.action === 'PROJECT_SANCTION_RETURNED' || 
        e.action === 'PROJECT_SANCTION_REJECTED'
      );
      setDecisionsHistory(policymakerActions);
    } catch (err) {
      console.error('Failed to load decision history audits:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, [currentUser?.id]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchDecisionsHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedProposedId) {
      fetchProposalDetail(selectedProposedId);
    } else {
      setProposedProjectDetail(null);
    }
  }, [selectedProposedId]);

  const handleProcessSanction = async (decision: 'APPROVE' | 'RETURN' | 'REJECT') => {
    if (!selectedProposedId) return;
    if ((decision === 'RETURN' || decision === 'REJECT') && !proposalReason.trim()) {
      setSanctionStatusMessage({ type: 'error', text: 'An official reasoning/feedback is required for returning or rejecting proposals.' });
      return;
    }

    setIsSubmittingSanction(true);
    setSanctionStatusMessage(null);

    try {
      await apiClient.sanctionProject(selectedProposedId, {
        decision,
        reason: proposalReason.trim(),
        approvedAmount: decision === 'APPROVE' ? Number(approvedAmount) : undefined,
      });

      setSanctionStatusMessage({
        type: 'success',
        text: `Success: Project proposal successfully ${decision === 'APPROVE' ? 'approved and sanctioned' : decision === 'RETURN' ? 'returned for revision' : 'rejected'}.`,
      });

      // Clear selection after brief delay to show success, and reload stats
      setTimeout(() => {
        setSelectedProposedId(null);
        setProposedProjectDetail(null);
        fetchIntelligence();
      }, 1500);

    } catch (err: any) {
      console.error('Failed to submit sanction decision:', err);
      setSanctionStatusMessage({
        type: 'error',
        text: err.message || `Failed to process decision: ${err.error?.message || 'Unauthorized action.'}`,
      });
    } finally {
      setIsSubmittingSanction(false);
    }
  };

  const handleAskAi = async (questionToAsk?: string) => {
    const q = questionToAsk || aiQuery;
    if (!q.trim()) return;
    setIsQueryingAi(true);
    try {
      const res = await apiClient.queryPolicymaker(q);
      setQueryResult(res);
    } catch (err) {
      console.error('AI Policy Query error:', err);
    } finally {
      setIsQueryingAi(false);
    }
  };

  if (isLoading || !intelData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-700">Synthesizing State Infrastructure Intelligence...</p>
        <p className="text-xs text-slate-400 mt-1">Cross-referencing citizen grievances, PFMS funding, and physical audit threads.</p>
      </div>
    );
  }

  const {
    metrics,
    fundingAggregate,
    regionalIntelligence = [],
    constituencyIntelligence = [],
    projects = [],
    delayedProjects = [],
    divergenceCases = [],
    serviceGaps = [],
    lifecycleStages = [],
    categoryDemand = {},
    aiLifecycleInsights = [],
  } = intelData;

  // Filter proposed projects for the inbox
  const proposedProjects = projects.filter((p) => p.status === 'PROPOSED');
  const returnedProjects = projects.filter((p) => p.status === 'RETURNED');
  const highPriorityProposals = proposedProjects.filter((p) => {
    // Treat as priority review if sanctioned cost is > 25 Lakhs or is a critical category
    const cost = p.funding.sanctioned || p.funding.allocated || 0;
    return cost > 2500000 || p.department.toLowerCase().includes('bridge') || p.department.toLowerCase().includes('sewerage');
  });

  // Filtered projects for the Development Portfolio
  const filteredProjects = projects.filter((p) => {
    const matchesDistrict = selectedDistrict === 'ALL' || p.district.toLowerCase().includes(selectedDistrict.toLowerCase());
    const matchesScheme = selectedScheme === 'ALL' || (p.funding.schemeSource && p.funding.schemeSource.toLowerCase().includes(selectedScheme.toLowerCase()));
    const matchesSearch =
      !projectSearch ||
      p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.id.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.department.toLowerCase().includes(projectSearch.toLowerCase());
    return matchesDistrict && matchesScheme && matchesSearch;
  });

  // Dynamic stages helper for AI recommended plans
  const getAiRecommendedWorkPlan = (category: string) => {
    const cat = (category || '').toUpperCase();
    if (cat.includes('LIGHT') || cat.includes('ELECTRIC')) {
      return ['Diagnosis & component defect check', 'Repair or modular fixture replacement', 'Circuit functional testing', 'Engineering safety sign-off'];
    } else if (cat.includes('ROAD') || cat.includes('HIGHWAY')) {
      return ['Sub-grade compaction & clearance', 'Base preparation & stone aggregates', 'Asphalt bituminous overlay laying', 'IRC retroreflective road markings & handover'];
    } else if (cat.includes('DRAIN') || cat.includes('SEWER')) {
      return ['Site camera/sonar inspection', 'Mechanical desilting & debris clearing', 'RCC box culvert wall restoration', 'Gravity flow capacity verification'];
    } else if (cat.includes('WATER') || cat.includes('PIPE')) {
      return ['Acoustic pipeline leak localization', 'Zonal excavation & valve isolation', 'Ductile Iron (DI) sleeve coupling/repair', 'Hydrostatic pressure testing & surface restoration'];
    }
    return ['Preliminary site survey', 'Structural restoration execution', 'Quality calibration testing', 'Authorized engineering handover'];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Calm Executive Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-50/50 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                Decision-Support Workspace
              </span>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                Authorized: {currentUser?.id || 'policymaker'}
              </span>
              <span className="text-slate-300">|</span>
              <ProvenanceBadge type="AI_ANALYSIS" modelOrSource="Authorized State Synthesis" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              State Infrastructure Sanctioning & Policy Workspace
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Executive command center for <strong className="text-slate-800 font-semibold">{currentUser?.name || 'Policymaker Advisor'}</strong> ({currentUser?.designation || 'Sanctioning & Policy Authority'}). Manage real-time funding sanctions, priority reviews, delayed project radars, and multi-scheme outlays across <strong className="text-purple-900">{currentUser?.homeDistrict || currentUser?.homeState || currentUser?.jurisdiction || 'Authorized Geography Scope'}</strong>.
            </p>

            {/* Core Principle Notice */}
            <div className="flex items-center gap-2 pt-1 text-xs text-purple-950 bg-purple-50/80 px-3 py-2 rounded-xl border border-purple-100 max-w-2xl">
              <Scale className="w-4 h-4 text-purple-700 shrink-0" />
              <span>
                <strong>DPI Governance Rule:</strong> Administrative engineers prepare plans and proposals. The Sanctioning Authority conducts priority review, funding audits, and finalizes human-sanctioned decisions.
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={fetchIntelligence}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Workspace</span>
            </button>
            <div className="px-3.5 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold text-center shadow-xs">
              <span className="block text-[10px] text-purple-200 uppercase font-bold tracking-wider">Delegated Limit</span>
              <span>₹{((currentUser?.financialThreshold || 5000000) / 100000).toFixed(0)} Lakhs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 5 workspaces Navigation Tabs Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-1.5 shadow-xs overflow-x-auto">
        <nav className="flex space-x-1 min-w-max" aria-label="Workspaces">
          {[
            { id: 'decision_inbox', label: 'Decision Inbox', count: proposedProjects.length + returnedProjects.length, icon: Inbox },
            { id: 'intelligence', label: 'Development Intelligence', count: '5 Modules', icon: Compass },
            { id: 'funding', label: 'Funding & Sanction', count: `₹${(fundingAggregate.expenditure / 100000).toFixed(0)}L`, icon: IndianRupee },
            { id: 'portfolio', label: 'Development Portfolio', count: projects.length, icon: Folder },
            { id: 'history', label: 'Decision History', icon: History },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as MainTabType);
                  setSelectedProposedId(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-purple-800 text-purple-100' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ==================================================
          1. DECISION INBOX WORKSPACE
          ================================================== */}
      {activeTab === 'decision_inbox' && (
        <div className="space-y-6">
          {!selectedProposedId ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Proposals Lists */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Pending Infrastructure Proposals & Sanctions</span>
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                    {proposedProjects.length} Pending
                  </span>
                </div>

                {proposedProjects.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-800">Inbox Clean</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      All prepared project proposals from executive engineers have been reviewed and sanctioned. No pending files require immediate attention.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {proposedProjects.map((p) => {
                      const cost = p.funding.sanctioned || p.funding.allocated || 0;
                      return (
                        <div
                          key={p.id}
                          className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-purple-300 hover:shadow-md transition cursor-pointer"
                          onClick={() => setSelectedProposedId(p.id)}
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                  {p.id}
                                </span>
                                <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
                                  {p.department}
                                </span>
                                {cost > 2500000 && (
                                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                    Priority Review
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                              <p className="text-xs text-slate-500">{p.district} Region • Prepared: {new Date(p.createdAt).toLocaleDateString()}</p>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Required Outlay</span>
                              <span className="text-sm font-black font-mono text-purple-900">₹{(cost / 100000).toFixed(1)} Lakhs</span>
                              <span className="text-[10px] text-slate-400 block">{p.funding.schemeSource}</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>Target Completion: <strong>{p.targetCompletionDate}</strong></span>
                            </span>
                            <span className="text-purple-600 font-semibold hover:text-purple-700 flex items-center gap-0.5">
                              <span>Open Review</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Returned proposals section if any */}
                {returnedProjects.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900">Returned Proposals (Pending Official Revision)</span>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        {returnedProjects.length} Files
                      </span>
                    </div>

                    <div className="space-y-3">
                      {returnedProjects.map((p) => (
                        <div
                          key={p.id}
                          className="bg-white rounded-xl border border-amber-200 p-5 shadow-xs opacity-80"
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  {p.id}
                                </span>
                                <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
                                  Returned for Revision
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                              <p className="text-xs text-slate-500">{p.district} • Budget: ₹{((p.funding.sanctioned || 0) / 100000).toFixed(1)} Lakhs</p>
                            </div>
                          </div>
                          {p.officialReviewNotes && (
                            <div className="mt-3 p-2.5 bg-amber-50 rounded-lg border border-amber-100 text-[11px] text-amber-900 font-medium">
                              <strong>Reason for return:</strong> {p.officialReviewNotes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar: Priority Review & Metric Panel */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Inbox Action Statistics</h4>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <span className="text-[10px] text-slate-500 block truncate">Total Pending</span>
                      <span className="text-lg font-black text-slate-900">{proposedProjects.length}</span>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <span className="text-[10px] text-purple-700 block truncate">Priority Files</span>
                      <span className="text-lg font-black text-purple-900">{highPriorityProposals.length}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-linear-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Delegation Authority Scope</h4>
                  </div>
                  <div className="text-xs space-y-2.5 text-slate-200 leading-relaxed">
                    <p>
                      Your active profile contains a technical delegation threshold of <strong className="text-white">₹{((currentUser?.financialThreshold || 5000000) / 100000).toFixed(0)} Lakhs</strong>.
                    </p>
                    <p>
                      Proposals exceeding this budget will be blocked on execution. Regional circle filters are applied to projects based on physical coordinates and administrative boundaries.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Proposal Detail View with Sanction Workflow */
            <div className="space-y-4">
              <button
                onClick={() => {
                  setSelectedProposedId(null);
                  setProposedProjectDetail(null);
                  setSanctionStatusMessage(null);
                }}
                className="inline-flex items-center gap-1 text-xs text-purple-700 font-bold hover:underline mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Inbox List</span>
              </button>

              {isLoadingProposal || !proposedProjectDetail ? (
                <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
                  <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Querying project thread from PFMS & PWD repositories...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Triage context & Grievance */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">
                            ID: {proposedProjectDetail.id}
                          </span>
                          <h3 className="text-base font-bold text-slate-900">{proposedProjectDetail.name}</h3>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                          {proposedProjectDetail.status} - PENDING SANCTION
                        </span>
                      </div>

                      {/* Citizen Need */}
                      {proposedProjectDetail.citizenRequest && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-purple-700" />
                            <span>1. Citizen Need & Grievance Context</span>
                          </h4>
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-2 text-xs">
                            <strong className="text-slate-800 text-xs block">
                              {proposedProjectDetail.citizenRequest.title}
                            </strong>
                            <p className="text-slate-600 leading-relaxed">
                              "{proposedProjectDetail.citizenRequest.description}"
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 pt-1">
                              <span>Reported Language: {proposedProjectDetail.citizenRequest.originalLanguage}</span>
                              {proposedProjectDetail.citizenRequest.voiceRecorded && (
                                <span className="bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-semibold">
                                  Voice Recorded
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* AI Understanding Analysis */}
                      {proposedProjectDetail.citizenRequest?.aiAnalysis && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-purple-700" />
                            <span>2. AI Understanding & Triage</span>
                          </h4>
                          <div className="p-4 bg-purple-50/30 rounded-xl border border-purple-100 space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-slate-500 block text-[10px]">EXTRACTED CATEGORY</span>
                                <span className="font-bold text-slate-800">{proposedProjectDetail.citizenRequest.aiAnalysis.category.replace('_', ' ')}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px]">AI SEVERITY ASSESSMENT</span>
                                <span className="font-extrabold text-red-800">{proposedProjectDetail.citizenRequest.aiAnalysis.severity}</span>
                              </div>
                            </div>

                            <p className="text-slate-700 italic border-t border-purple-100/50 pt-2">
                              "AI Summary: {proposedProjectDetail.citizenRequest.aiAnalysis.summary}"
                            </p>

                            {proposedProjectDetail.citizenRequest.aiAnalysis.matchedGovernmentSchemes && proposedProjectDetail.citizenRequest.aiAnalysis.matchedGovernmentSchemes.length > 0 && (
                              <div className="pt-2 border-t border-purple-100/50 space-y-1">
                                <span className="text-[10px] font-bold text-purple-900 block">Matched Government Scheme Recommendation:</span>
                                <span className="font-bold text-slate-800 block text-[11px]">
                                  {proposedProjectDetail.citizenRequest.aiAnalysis.matchedGovernmentSchemes[0].schemeName}
                                </span>
                                <p className="text-[10px] text-slate-500">{proposedProjectDetail.citizenRequest.aiAnalysis.matchedGovernmentSchemes[0].relevance}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Location & Evidence Coordinates */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-purple-700" />
                          <span>3. Verified Location & Evidence Images</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/50">
                            <span className="text-[10px] text-slate-400 block uppercase">Address</span>
                            <span className="font-semibold text-slate-800">{proposedProjectDetail.citizenRequest?.location?.address || proposedProjectDetail.district}</span>
                            <span className="text-[10px] text-slate-500 block mt-1">District: {proposedProjectDetail.district} | State: {proposedProjectDetail.state}</span>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/50 font-mono text-[10px]">
                            <span className="text-[10px] text-slate-400 block uppercase font-sans">Coordinates</span>
                            <span>LAT: {proposedProjectDetail.citizenRequest?.location?.lat || 'Unavailable'}</span>
                            <span className="block">LNG: {proposedProjectDetail.citizenRequest?.location?.lng || 'Unavailable'}</span>
                          </div>
                        </div>

                        {proposedProjectDetail.citizenRequest?.photoUrls && proposedProjectDetail.citizenRequest.photoUrls.length > 0 && (
                          <div className="rounded-xl overflow-hidden border border-slate-200 max-h-56 bg-slate-50">
                            <img
                              src={proposedProjectDetail.citizenRequest.photoUrls[0]}
                              alt="Citizen evidence photo"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback for broken link
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Official final plan & sanction decision */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
                      <div className="border-b border-slate-100 pb-4">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Proposal Review & Sanction Decisions</h4>
                      </div>

                      {/* Official Final Plan */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-slate-900 block">Proposed Engineering Milestones</span>
                        <div className="space-y-2 text-xs">
                          {proposedProjectDetail.milestones.map((m, idx) => (
                            <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 space-y-1">
                              <div className="flex justify-between items-center text-[10px] text-slate-400">
                                <span>STAGE 0{idx + 1}</span>
                                <span>Target: {m.targetDate}</span>
                              </div>
                              <span className="font-bold text-slate-800 block leading-tight">{m.title}</span>
                              <p className="text-slate-500 text-[11px] leading-tight">{m.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AI Proposed work plan vs Official work plan comparison */}
                      <div className="bg-purple-50/40 p-4 rounded-xl border border-purple-100 space-y-2 text-xs">
                        <div className="flex items-center gap-1.5 text-purple-950 font-bold">
                          <Sparkles className="w-4 h-4 text-purple-700" />
                          <span>AI Recommended Work Plan Stages</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-0.5 text-slate-600 font-medium pl-1 text-[11px]">
                          {getAiRecommendedWorkPlan(proposedProjectDetail.citizenRequest?.aiAnalysis?.category || '').map((stage, idx) => (
                            <li key={idx}>{stage}</li>
                          ))}
                        </ol>
                        <p className="text-[10px] text-slate-400 leading-tight pt-1">
                          The official engineering milestones matched IRC specification requirements for {proposedProjectDetail.citizenRequest?.aiAnalysis?.category || 'general works'}.
                        </p>
                      </div>

                      {/* Investment requirement */}
                      <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 text-xs">
                        <span className="text-[10px] text-slate-400 block uppercase">Funding requirement from PFMS</span>
                        <div className="flex justify-between items-baseline">
                          <span className="text-slate-300">Sanctioned Outlay:</span>
                          <span className="text-lg font-black font-mono">₹{((proposedProjectDetail.funding.sanctioned || 0)/100000).toFixed(1)} Lakhs</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                          <span>Scheme: {proposedProjectDetail.funding.schemeSource}</span>
                          <span>Head: {proposedProjectDetail.funding.budgetHead}</span>
                        </div>
                      </div>

                      {/* Action Box */}
                      <div className="space-y-4 pt-2 border-t border-slate-100">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700 flex justify-between items-center">
                            <span>Approved Sanctioned Outlay (INR) *</span>
                            <span className="text-[10px] font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-100 animate-pulse">
                              ₹{(approvedAmount / 100000).toFixed(2)} Lakhs
                            </span>
                          </label>
                          <input
                            type="number"
                            value={approvedAmount}
                            onChange={(e) => setApprovedAmount(Number(e.target.value))}
                            className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition font-mono font-bold text-slate-900"
                            placeholder="Specify actual approved amount in INR"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">
                            Official Decision Reasoning / Comments
                          </label>
                          <textarea
                            value={proposalReason}
                            onChange={(e) => setProposedReason(e.target.value)}
                            rows={3}
                            placeholder="Provide official feedback, audit notes, or revision directives. Mandatory for returns/rejections."
                            className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none transition"
                          />
                        </div>

                        {sanctionStatusMessage && (
                          <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                            sanctionStatusMessage.type === 'success'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                              : 'bg-red-50 border-red-200 text-red-900'
                          }`}>
                            {sanctionStatusMessage.text}
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleProcessSanction('APPROVE')}
                            disabled={isSubmittingSanction}
                            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1 shadow-sm"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span>APPROVE SANCTION</span>
                          </button>

                          <button
                            onClick={() => handleProcessSanction('RETURN')}
                            disabled={isSubmittingSanction}
                            className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>RETURN REVISION</span>
                          </button>

                          <button
                            onClick={() => handleProcessSanction('REJECT')}
                            disabled={isSubmittingSanction}
                            className="py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>REJECT</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================================================
          2. DEVELOPMENT INTELLIGENCE WORKSPACE
          ================================================== */}
      {activeTab === 'intelligence' && (
        <div className="space-y-6">
          {/* Sub Navigation Tabs */}
          <div className="bg-slate-100/80 p-1 rounded-lg border border-slate-200/80 flex space-x-1 max-w-max">
            {[
              { id: 'regional', label: 'Regional Analytics' },
              { id: 'constituency', label: 'Constituency Index' },
              { id: 'service_gaps', label: 'Civic Service Gaps' },
              { id: 'lifecycle', label: 'Lifecycle Velocity' },
              { id: 'ai_insights', label: 'AI Policy Advisor' },
            ].map((subTab) => (
              <button
                key={subTab.id}
                onClick={() => setActiveIntelSubTab(subTab.id as IntelligenceSubTabType)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  activeIntelSubTab === subTab.id
                    ? 'bg-white text-purple-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {subTab.label}
              </button>
            ))}
          </div>

          {/* Sub-tab 1. Regional Analytics */}
          {activeIntelSubTab === 'regional' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-purple-700" />
                    Authorized Regional Intelligence Breakdown
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Aggregate governance data across districts. Strictly anonymized; no personal citizen grievance details are exposed.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Filter District:</span>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium focus:outline-hidden"
                  >
                    <option value="ALL">All Authorized Districts</option>
                    {regionalIntelligence.map((r) => (
                      <option key={r.district} value={r.district}>{r.district}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {regionalIntelligence
                  .filter((r) => selectedDistrict === 'ALL' || r.district.toLowerCase().includes(selectedDistrict.toLowerCase()))
                  .map((reg) => (
                    <div key={reg.district} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            Authorized District Circle
                          </span>
                          <h4 className="text-base font-bold text-slate-900 mt-1">{reg.district}</h4>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                          {reg.activeProjects} Active Works
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Strategic Focus:</span>
                        <p className="text-slate-800 font-medium mt-0.5">{reg.primaryNeed}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 bg-purple-50/40 rounded-lg border border-purple-100/50">
                          <span className="text-[10px] text-slate-500 block">Citizen Demands</span>
                          <span className="font-extrabold text-slate-900 text-sm">{reg.totalRequests}</span>
                          <span className="text-[9px] text-slate-500 block">{reg.openRequests} In Pipeline</span>
                        </div>

                        <div className="p-2 bg-sky-50/40 rounded-lg border border-sky-100/50">
                          <span className="text-[10px] text-slate-500 block">Sanctioned Outlay</span>
                          <span className="font-extrabold text-sky-950 text-sm font-mono">₹{(reg.allocatedFunds / 100000).toFixed(1)}L</span>
                          <span className="text-[9px] text-sky-700 block">{reg.absorptionRate.toFixed(0)}% Absorbed</span>
                        </div>

                        <div className="p-2 bg-amber-50/40 rounded-lg border border-amber-100/50">
                          <span className="text-[10px] text-slate-500 block">Delays / Rework</span>
                          <span className="font-extrabold text-amber-950 text-sm">{reg.delayedProjects}</span>
                          <span className="text-[9px] text-amber-700 block">{reg.serviceGapCount} Gaps Flagged</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-medium text-slate-600">
                          <span>Fund Absorption Rate</span>
                          <span className="font-mono font-bold text-slate-900">{reg.absorptionRate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, reg.absorptionRate)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Sub-tab 2. Constituency Index */}
          {activeIntelSubTab === 'constituency' && (
            <div className="space-y-6">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-emerald-950 text-sm">
                    Constitutional Compliance: Non-Partisan Civic Development Intelligence
                  </h4>
                  <p className="text-emerald-900 leading-relaxed">
                    In strict accordance with civil service governance ethics: This intelligence workspace displays <strong>physical asset development and service delivery metrics only</strong>. It does <strong>NOT</strong> create voter profiling, does <strong>NOT</strong> rank or score individual citizens, and does <strong>NOT</strong> generate electoral or campaign predictions.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {constituencyIntelligence.map((c) => (
                  <div key={c.constituencyId} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {c.constituencyId}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              c.developmentStatus === 'THRIVING'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.developmentStatus === 'STABLE_PROGRESS'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {c.developmentStatus.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900">{c.constituencyName}</h4>
                        <p className="text-xs text-slate-500">{c.region} • {c.authorizedCircle}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Infra Index</span>
                        <span className="text-2xl font-black text-purple-900">{c.infrastructureIndex || 85}</span>
                        <span className="text-[10px] text-slate-400 block">/ 100 Score</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="bg-slate-50 p-2 rounded-lg text-center">
                        <span className="text-[10px] text-slate-500 block">Road Network</span>
                        <span className="font-extrabold text-slate-800">{c.roadQualityScore || 80}/100</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg text-center">
                        <span className="text-[10px] text-slate-500 block">Drainage Res.</span>
                        <span className="font-extrabold text-slate-800">{c.drainageResilienceIndex || 75}/100</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg text-center">
                        <span className="text-[10px] text-slate-500 block">Open Demands</span>
                        <span className="font-extrabold text-slate-800">{c.civicGrievancesCount}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg text-center">
                        <span className="text-[10px] text-slate-500 block">Rework Mandates</span>
                        <span className={`font-extrabold ${c.reworkCasesCount > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
                          {c.reworkCasesCount}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 bg-purple-50/30 p-3 rounded-lg border border-purple-100/60 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">Public Capital Sanctioned:</span>
                        <span className="font-mono font-bold text-slate-900">₹{(c.totalSanctionedAmount / 100000).toFixed(1)} Lakhs</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">Verified Expenditure:</span>
                        <span className="font-mono font-bold text-purple-900">₹{(c.expenditureAmount / 100000).toFixed(1)} Lakhs</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-tab 3. Civic Service Gaps */}
          {activeIntelSubTab === 'service_gaps' && (
            <div className="space-y-6">
              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-purple-950 text-sm">
                    AI Cross-Domain Service Gap Detection
                  </h4>
                  <p className="text-purple-900 leading-relaxed">
                    Automated correlation comparing recurring citizen grievance frequency against active civil work outlays. Identifies high-risk infrastructure voids before seasonal monsoons or heavy industrial strain.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {serviceGaps.map((gap) => (
                  <div key={gap.id} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {gap.id}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              gap.severity === 'CRITICAL'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {gap.severity} PRIORITY GAP
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900">{gap.title}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{gap.location} • {gap.district}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Estimated Public Impact</span>
                        <span className="text-xs font-bold text-slate-800">{gap.estimatedCitizenImpact}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-purple-50/40 rounded-lg border border-purple-100 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <strong className="text-purple-950 font-semibold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                          <span>AI Correlated Evidence Pattern:</span>
                        </strong>
                        <span className="text-[10px] text-purple-700 font-mono">Confidence: {(gap.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{gap.aiEvidencePattern}</p>
                    </div>

                    <div className="p-3 bg-emerald-50/40 rounded-lg border border-emerald-100 text-xs space-y-1">
                      <strong className="text-emerald-950 font-semibold block text-[11px] uppercase tracking-wider">
                        Recommended Policy Action:
                      </strong>
                      <p className="text-emerald-900 leading-relaxed">{gap.recommendedPolicyAction}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-tab 4. Lifecycle Velocity */}
          {activeIntelSubTab === 'lifecycle' && (
            <div className="space-y-6">
              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                <h4 className="text-sm font-bold text-slate-900">State Infrastructure Lifecycle Velocity & Funnel</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Aggregated throughput metrics across all 6 sequential stages of the public works lifecycle.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {lifecycleStages.map((stage, idx) => (
                  <div key={stage.stage} className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-400">STAGE 0{idx + 1}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        SLA: {stage.slaAdherenceRate}%
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900">{stage.stage}</h4>
                      <p className="text-xs text-slate-500">Average Turnaround: {stage.avgTurnaroundDays} days</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="bg-slate-50 p-2 rounded-lg text-center">
                        <span className="text-[10px] text-slate-500 block">Total Volume</span>
                        <span className="font-extrabold text-slate-800 text-sm">{stage.totalCount}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg text-center">
                        <span className="text-[10px] text-slate-500 block">In-Flight</span>
                        <span className="font-extrabold text-purple-900 text-sm">{stage.activeCount}</span>
                      </div>
                    </div>

                    {stage.bottleneckFlag && (
                      <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900">
                        <strong className="block text-[10px] uppercase font-bold text-amber-800">Identified Bottleneck:</strong>
                        {stage.bottleneckFlag}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-tab 5. AI Policy Advisor */}
          {activeIntelSubTab === 'ai_insights' && (
            <div className="space-y-6">
              {/* Strategic cards */}
              <div className="bg-linear-to-br from-purple-50 via-white to-indigo-50/30 rounded-2xl border border-purple-200 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-purple-600 text-white">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        AI Strategic Policy & Resource Allocation Synthesis
                      </h3>
                      <p className="text-xs text-slate-500">
                        Synthesized from delayed project milestones, citizen complaint demand, and fiscal absorption patterns.
                      </p>
                    </div>
                  </div>
                  <ProvenanceBadge type="AI_ANALYSIS" modelOrSource="gemini-3.1-flash-lite" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {aiLifecycleInsights.length > 0 ? (
                    aiLifecycleInsights.map((insight, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border bg-white shadow-xs text-xs space-y-2.5 ${
                          insight.urgency === 'CRITICAL' ? 'border-red-300' : 'border-purple-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            {insight.urgency} URGENCY
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Confidence: {(insight.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{insight.title}</h4>
                        <p className="text-slate-700 leading-relaxed">{insight.summary}</p>
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-900">
                          <strong className="block text-[10px] uppercase text-purple-900 mb-0.5">
                            Policy Recommendation:
                          </strong>
                          {insight.recommendation}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-6 text-xs text-slate-400">
                      No active AI strategic recommendations for this scope.
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive Inquire Advisor */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Ask AI Policy Intelligence
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pose strategic inquiries regarding capital absorption, milestone delays, and service bottlenecks. Grounded strictly in authorized state public works data.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[11px] text-slate-400 font-semibold self-center mr-1">Pre-curated:</span>
                  {[
                    'What are the primary drivers of milestone delay in road works?',
                    'Where is funding absorption lagging behind schedule?',
                    'Which wards have high recurring drainage flood risks?',
                  ].map((sampleQ, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAiQuery(sampleQ);
                        handleAskAi(sampleQ);
                      }}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-900 rounded-lg text-xs font-medium border border-slate-200 transition cursor-pointer"
                    >
                      {sampleQ}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Ask about project velocity, contractor performance, fund absorption..."
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-purple-300"
                  />
                  <button
                    onClick={() => handleAskAi()}
                    disabled={isQueryingAi || !aiQuery.trim()}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 shadow-2xs"
                  >
                    {isQueryingAi ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Inquire</span>
                  </button>
                </div>

                {queryResult && (
                  <div className="mt-4 p-5 bg-purple-50/40 rounded-xl border border-purple-200 text-xs space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-purple-600 text-white">
                          <Sparkles className="w-3 h-3" />
                        </span>
                        <strong className="text-slate-900 font-bold text-sm">Strategic Policy Synthesis</strong>
                      </div>
                      <span className="text-[10px] font-mono text-purple-700">
                        Confidence: {(queryResult.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <p className="text-slate-800 leading-relaxed font-medium bg-white p-3.5 rounded-lg border border-purple-100">
                      {queryResult.answer}
                    </p>

                    {queryResult.keyInsights.length > 0 && (
                      <div className="space-y-1.5">
                        <strong className="block text-[10px] uppercase font-bold text-purple-900">
                          Key Takeaways:
                        </strong>
                        <ul className="space-y-1 text-slate-700">
                          {queryResult.keyInsights.map((insight, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================
          3. FUNDING & SANCTION WORKSPACE
          ================================================== */}
      {activeTab === 'funding' && (
        <div className="space-y-6">
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-amber-950 text-sm">
                PFMS Fiscal Ledger Integration
              </h4>
              <p className="text-amber-900 leading-relaxed">
                Budget figures, sanction ratios, and expenditure absorption are aggregated from the simulated <strong>Public Finance Management System (PFMS)</strong> ledger. Real-time disbursement is strictly gated by digital verification certificates.
              </p>
            </div>
          </div>

          {/* Grand Totals Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Allocated Outlay</span>
              <p className="text-lg font-mono font-black text-slate-900 mt-1">₹{(fundingAggregate.allocated / 100000).toFixed(1)} Lakhs</p>
              <span className="text-[10px] text-slate-500">Cabinet Approved Head</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Sanctioned</span>
              <p className="text-lg font-mono font-black text-purple-950 mt-1">₹{(fundingAggregate.sanctioned / 100000).toFixed(1)} Lakhs</p>
              <span className="text-[10px] text-purple-700 font-bold">Sanction: {fundingAggregate.sanctionRatio.toFixed(1)}%</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Contracted</span>
              <p className="text-lg font-mono font-black text-indigo-950 mt-1">₹{(fundingAggregate.contracted / 100000).toFixed(1)} Lakhs</p>
              <span className="text-[10px] text-indigo-700 font-bold">Work Orders Awarded</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Expenditure</span>
              <p className="text-lg font-mono font-black text-emerald-950 mt-1">₹{(fundingAggregate.expenditure / 100000).toFixed(1)} Lakhs</p>
              <span className="text-[10px] text-emerald-700 font-bold">Absorption: {fundingAggregate.absorptionRate.toFixed(1)}%</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs col-span-2 md:col-span-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Remaining Buffer</span>
              <p className="text-lg font-mono font-black text-slate-800 mt-1">₹{(fundingAggregate.remaining / 100000).toFixed(1)} Lakhs</p>
              <span className="text-[10px] text-slate-500">Unexpended Reserve</span>
            </div>
          </div>

          {/* Delegation Policy Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Capital Scheme Breakdown & Absorption Velocity</h4>
              <div className="space-y-4">
                {fundingAggregate.schemeBreakdown.map((sb, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h5 className="font-bold text-slate-900 text-sm">{sb.scheme}</h5>
                        <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          Budget Head: {sb.budgetHead}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-purple-900">
                          ₹{(sb.expenditure / 100000).toFixed(1)}L / ₹{(sb.sanctioned / 100000).toFixed(1)}L
                        </span>
                        <span className="block text-[10px] text-slate-500">Absorption: {sb.absorptionRate.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${Math.min(100, sb.absorptionRate)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Owner Rules panel */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-purple-700" />
                <span>Your Active Delegation Rules</span>
              </h4>
              <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                <div className="p-3 bg-purple-50 rounded-lg text-purple-950 space-y-1">
                  <span className="block text-[10px] font-bold uppercase text-purple-700">Financial Delegation Limit</span>
                  <p className="text-sm font-black">
                    ₹{((currentUser?.financialThreshold || 5000000) / 100000).toFixed(1)} Lakhs
                  </p>
                  <p className="text-[10px] text-purple-700 leading-tight">
                    Budget proposals above this amount will reject during approval with "insufficient authority (403)".
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Department Scope Locking</span>
                  <p className="text-slate-800 font-medium">
                    {currentUser?.department || 'General Statewide Planning & Resource Commission'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Regional Jurisdiction Locking</span>
                  <p className="text-slate-800 font-medium">
                    {currentUser?.homeDistrict || currentUser?.authorizedRegion || 'Statewide Circle - Comprehensive Bounds'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          4. DEVELOPMENT PORTFOLIO WORKSPACE
          ================================================== */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          {/* Sub Navigation */}
          <div className="bg-slate-100/80 p-1 rounded-lg border border-slate-200/80 flex space-x-1 max-w-max">
            {[
              { id: 'all_projects', label: 'All Projects Portfolio' },
              { id: 'delayed', label: 'Delayed Projects SLA' },
              { id: 'divergence', label: 'Evidence Divergence Cases' },
            ].map((subTab) => (
              <button
                key={subTab.id}
                onClick={() => setActivePortfolioSubTab(subTab.id as PortfolioSubTabType)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                  activePortfolioSubTab === subTab.id
                    ? 'bg-white text-purple-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {subTab.label}
              </button>
            ))}
          </div>

          {/* Sub-tab 1: All Projects */}
          {activePortfolioSubTab === 'all_projects' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search projects by ID, title, or department..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedScheme}
                    onChange={(e) => setSelectedScheme(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-hidden"
                  >
                    <option value="ALL">All Funding Schemes</option>
                    <option value="UIDF">Urban Infra (UIDF)</option>
                    <option value="PMGSY">PMGSY Phase III</option>
                    <option value="Disaster">Disaster Mitigation (NDMF)</option>
                  </select>

                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-hidden"
                  >
                    <option value="ALL">All Districts</option>
                    {regionalIntelligence.map((r) => (
                      <option key={r.district} value={r.district}>{r.district}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredProjects.map((p) => {
                  const completedMilestones = p.milestones.filter((m) => m.status === 'VERIFIED').length;
                  const totalMilestones = p.milestones.length;
                  const progressPct = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-purple-200 transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-mono font-bold text-xs text-purple-950 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              {p.id}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              Sanction: {p.sanctionNumber}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                p.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : p.status === 'DELAYED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-900">{p.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {p.department} • {p.district} • Target: {p.targetCompletionDate}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setSelectedProjectId(p.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect Project Intelligence</span>
                          </button>
                        </div>
                      </div>

                      {p.officialReviewNotes && p.status === 'RETURNED' && (
                        <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg text-xs text-red-900">
                          <strong className="block text-[11px] uppercase font-bold text-red-800 mb-0.5">
                            Active Quality Rework Directive:
                          </strong>
                          {p.officialReviewNotes}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
                        <div>
                          <div className="flex justify-between text-slate-600 mb-1">
                            <span>Milestones Certified:</span>
                            <span className="font-bold text-slate-900">{completedMilestones} of {totalMilestones}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${p.status === 'DELAYED' ? 'bg-amber-500' : 'bg-purple-600'}`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase">Sanctioned</span>
                            <span className="font-mono font-bold text-slate-900">₹{((p.funding.sanctioned || p.funding.allocated || 0) / 100000).toFixed(1)} Lakhs</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block uppercase">Expenditure</span>
                            <span className="font-mono font-bold text-purple-900">₹{(p.funding.expenditure / 100000).toFixed(1)} Lakhs</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-tab 2: Delayed Projects */}
          {activePortfolioSubTab === 'delayed' && (
            <div className="space-y-4">
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Delayed Works & Remediation Radar</h4>
                    <p className="text-xs text-slate-600">
                      Projects exceeding SLA targets or placed under official quality rework enforcement.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono px-2.5 py-1 bg-amber-200/70 text-amber-950 rounded-lg">
                  {delayedProjects.length} Delayed Assets
                </span>
              </div>

              <div className="space-y-3">
                {delayedProjects.length === 0 ? (
                  <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-800">Zero Delayed Projects</p>
                    <p className="text-xs text-slate-500">All registered works are operating within acceptable milestone SLA limits.</p>
                  </div>
                ) : (
                  delayedProjects.map((p) => (
                    <div key={p.id} className="bg-white rounded-xl border border-red-200 p-5 shadow-xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-bold text-xs text-red-950 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                              {p.id}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                              {p.daysOverdue} Days Overdue
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-900">{p.name}</h4>
                          <p className="text-xs text-slate-500">{p.department} • Contractor: {p.contractorName || 'Assigned Lead'}</p>
                        </div>

                        <button
                          onClick={() => setSelectedProjectId(p.id)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition"
                        >
                          Inspect Project Details
                        </button>
                      </div>

                      <div className="p-3 bg-red-50/60 rounded-lg border border-red-100 text-xs">
                        <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block mb-0.5">
                          Root Cause of Delay / Inspection Rejection:
                        </span>
                        <p className="text-slate-800 leading-relaxed">{p.reworkReason}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Sub-tab 3: Evidence Divergence */}
          {activePortfolioSubTab === 'divergence' && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-3">
                <Scale className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Multi-Party Evidence Triangulation
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Displays cases where <strong>Contractor Claim Evidence</strong>, <strong>Independent Community Observations</strong>, and <strong>Automated AI Vision Comparison</strong> indicate divergence.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {divergenceCases.length === 0 ? (
                  <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-800">No Potential Discrepancies</p>
                    <p className="text-xs text-slate-500">All submitted contractor evidence is consistent with community observations.</p>
                  </div>
                ) : (
                  divergenceCases.map((c) => (
                    <div key={c.id} className="bg-white rounded-xl border border-red-200/90 p-5 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-bold text-xs text-red-950 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                              {c.id}
                            </span>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                              Potential discrepancy detected
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-900">{c.projectName}</h4>
                          <p className="text-xs text-slate-500">Milestone: {c.milestoneTitle}</p>
                        </div>

                        <button
                          onClick={() => setSelectedProjectId(c.projectId)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                        >
                          Open Project Digital Thread
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70 space-y-1.5">
                          <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                            1. Contractor Progress Claim
                          </span>
                          <p className="font-bold text-slate-900">{c.contractorEvidence.claimedPercentage}% Claimed Completion</p>
                          <p className="text-slate-700 text-[11px] leading-relaxed italic">
                            "{c.contractorEvidence.description}"
                          </p>
                        </div>

                        <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-200/70 space-y-1.5">
                          <span className="text-[10px] font-bold text-sky-900 uppercase tracking-wider block">
                            2. Independent Ground Truth
                          </span>
                          {c.ngoAudits.length > 0 ? (
                            c.ngoAudits.map((ngo, idx) => (
                              <div key={idx} className="space-y-1">
                                <span className="text-[11px] font-semibold text-slate-900">{ngo.ngoName}</span>
                                <p className="text-slate-700 text-[11px] leading-relaxed">
                                  "{ngo.observation}"
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-500 text-[11px]">No third-party field audit filed.</p>
                          )}
                        </div>

                        <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200/70 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider">
                              3. AI Comparative Analysis
                            </span>
                            <span className="text-[9px] font-mono text-purple-700 bg-white px-1.5 py-0.2 rounded border border-purple-200">
                              {(c.aiComparison.confidence * 100).toFixed(0)}% Match
                            </span>
                          </div>
                          <p className="text-slate-800 text-[11px] leading-relaxed font-medium">
                            {c.aiComparison.summary}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================
          5. DECISION HISTORY WORKSPACE
          ================================================== */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Your Sanctioning Decision Audit History</h3>
              <p className="text-xs text-slate-500">Immutable trail of processed fund approvals, proposal revisions, and rejections.</p>
            </div>
            <button
              onClick={fetchDecisionsHistory}
              className="p-2 text-slate-500 hover:text-purple-600 transition"
              title="Reload decision history"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoadingHistory ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Querying platform audit ledger...
            </div>
          ) : decisionsHistory.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No recent sanctioning decisions recorded for your administrator session.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Project ID</th>
                    <th className="py-3 px-4">Action Decision</th>
                    <th className="py-3 px-4">Authorizer</th>
                    <th className="py-3 px-4">Remarks / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {decisionsHistory.map((h) => {
                    const isApprove = h.action === 'PROJECT_SANCTION_APPROVED';
                    const isReturn = h.action === 'PROJECT_SANCTION_RETURNED';
                    return (
                      <tr key={h.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-medium text-slate-500">{new Date(h.timestamp).toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-purple-950">{h.entityId}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isApprove ? 'bg-emerald-50 text-emerald-800' : isReturn ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-800'
                          }`}>
                            {h.action.replace('PROJECT_SANCTION_', '')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium">{h.actor}</td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-sm truncate" title={h.details || h.reason}>
                          {h.reason || h.details}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProjectId && (
        <ProjectDetailModal
          projectId={selectedProjectId}
          onClose={() => setSelectedProjectId(null)}
          onProjectUpdated={fetchIntelligence}
        />
      )}
    </div>
  );
};
