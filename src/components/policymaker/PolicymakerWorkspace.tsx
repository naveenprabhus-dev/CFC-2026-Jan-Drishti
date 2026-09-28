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
} from 'lucide-react';

interface PolicymakerWorkspaceProps {
  onOpenProject: (projectId: string) => void;
  onOpenToken: (tokenId: string) => void;
}

type TabType =
  | 'regional'
  | 'constituency'
  | 'projects'
  | 'funding'
  | 'service_gaps'
  | 'delayed'
  | 'divergence'
  | 'lifecycle'
  | 'ai_insights';

export const PolicymakerWorkspace: React.FC<PolicymakerWorkspaceProps> = ({
  onOpenProject,
  onOpenToken,
}) => {
  const { currentUser } = useAuth();
  const [intelData, setIntelData] = useState<PolicymakerIntelligenceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('regional');
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

  useEffect(() => {
    fetchIntelligence();
  }, [currentUser?.id]);

  useEffect(() => {
    const handleCfcNavigate = (e: any) => {
      const target = e.detail;
      if (target === 'POLICYMAKER_REGIONAL') setActiveTab('regional');
      else if (target === 'POLICYMAKER_CONSTITUENCY') setActiveTab('constituency');
      else if (target === 'POLICYMAKER_PROJECTS') setActiveTab('projects');
      else if (target === 'POLICYMAKER_FUNDING') setActiveTab('funding');
      else if (target === 'POLICYMAKER_SERVICE_GAPS') setActiveTab('service_gaps');
      else if (target === 'POLICYMAKER_DELAYED') setActiveTab('delayed');
      else if (target === 'POLICYMAKER_DIVERGENCE') setActiveTab('divergence');
      else if (target === 'POLICYMAKER_LIFECYCLE') setActiveTab('lifecycle');
      else if (target === 'POLICYMAKER_AI_INSIGHTS') setActiveTab('ai_insights');
    };

    window.addEventListener('cfc-navigate', handleCfcNavigate);
    return () => {
      window.removeEventListener('cfc-navigate', handleCfcNavigate);
    };
  }, []);

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

  // Filtered projects
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
                User ID: {currentUser?.id || 'off-sanction-cbe-01'}
              </span>
              <span className="text-slate-300">|</span>
              <ProvenanceBadge type="AI_ANALYSIS" modelOrSource="Statewide Synthesis" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              State Infrastructure Intelligence & Policy Center
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Real-time executive intelligence for <strong className="text-slate-800 font-semibold">{currentUser?.name || 'Dr. S. Meenakshi'}</strong> (Principal Infrastructure Advisor & Sanctioning Authority). Designed to provide macroscopic visibility into development gaps, fund absorption, and quality trends while reserving authoritative policy decisions strictly for human officials.
            </p>

            {/* Core Principle Notice */}
            <div className="flex items-center gap-2 pt-1 text-xs text-purple-900 bg-purple-50/80 px-3 py-2 rounded-xl border border-purple-100 max-w-2xl">
              <Scale className="w-4 h-4 text-purple-700 shrink-0" />
              <span>
                <strong>Core Principle:</strong> AI provides intelligence and explanations. Humans make policy decisions. Not an operational triage dashboard.
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={fetchIntelligence}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Intelligence</span>
            </button>
            <div className="px-3.5 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold text-center shadow-xs">
              <span className="block text-[10px] text-purple-200 uppercase font-bold tracking-wider">State Mandate</span>
              <span>TN Infrastructure 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI High-Level Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">Active Projects</span>
          <p className="text-xl font-black text-slate-900 mt-0.5">{metrics.activeProjectsCount}</p>
          <span className="text-[10px] text-slate-500">{metrics.totalProjects} Total Registered</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block truncate">Completed Works</span>
          <p className="text-xl font-black text-emerald-950 mt-0.5">{metrics.completedProjectsCount}</p>
          <span className="text-[10px] text-emerald-700 font-medium">100% Certified</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block truncate">Delayed Works</span>
          <p className="text-xl font-black text-amber-950 mt-0.5">{metrics.delayedProjectsCount}</p>
          <span className="text-[10px] text-amber-700 font-medium">Active Remediation</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block truncate">Discrepancy Cases</span>
          <p className="text-xl font-black text-rose-950 mt-0.5">{metrics.divergenceCount}</p>
          <span className="text-[10px] text-rose-700 font-medium">Potential Divergence</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block truncate">Sanctioned Outlay</span>
          <p className="text-base font-black font-mono text-purple-950 mt-0.5">
            ₹{(fundingAggregate.sanctioned / 100000).toFixed(1)}L
          </p>
          <span className="text-[10px] text-purple-700 font-medium">{fundingAggregate.sanctionRatio.toFixed(0)}% of Allocation</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block truncate">Verified Exp.</span>
          <p className="text-base font-black font-mono text-sky-950 mt-0.5">
            ₹{(fundingAggregate.expenditure / 100000).toFixed(1)}L
          </p>
          <span className="text-[10px] text-sky-700 font-medium">{fundingAggregate.absorptionRate.toFixed(1)}% Absorption</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block truncate">Identified Gaps</span>
          <p className="text-xl font-black text-teal-950 mt-0.5">{serviceGaps.length}</p>
          <span className="text-[10px] text-teal-700 font-medium">Policy Attention</span>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-1.5 shadow-xs overflow-x-auto">
        <nav className="flex space-x-1 min-w-max" aria-label="Tabs">
          {[
            { id: 'regional', label: 'Regional Intelligence', count: regionalIntelligence.length },
            { id: 'constituency', label: 'Constituency Intelligence', count: constituencyIntelligence.length },
            { id: 'projects', label: 'Projects', count: projects.length },
            { id: 'funding', label: 'Funding Intelligence', count: `₹${(fundingAggregate.expenditure / 100000).toFixed(0)}L` },
            { id: 'service_gaps', label: 'Service Gaps', count: serviceGaps.length },
            { id: 'delayed', label: 'Delayed Projects', count: delayedProjects.length },
            { id: 'divergence', label: 'Evidence Divergence', count: divergenceCases.length },
            { id: 'lifecycle', label: 'Lifecycle Intelligence', count: '6 Stages' },
            { id: 'ai_insights', label: 'AI Insights', count: aiLifecycleInsights.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-purple-50 text-purple-900 border border-purple-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-purple-200 text-purple-900' : 'bg-slate-100 text-slate-600'
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

      {/* TAB CONTENT AREAS */}

      {/* 1. REGIONAL INTELLIGENCE */}
      {activeTab === 'regional' && (
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
                <option value="Chennai">Central Chennai</option>
                <option value="Coimbatore">Coimbatore North & Urban</option>
                <option value="Madurai">Madurai East Corridor</option>
                <option value="Salem">Salem Urban & Highways</option>
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

                  {/* Primary Infrastructure Need */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Strategic Focus:</span>
                    <p className="text-slate-800 font-medium mt-0.5">{reg.primaryNeed}</p>
                  </div>

                  {/* Key Metrics Grid */}
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

                  {/* Absorption Progress Bar */}
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

      {/* 2. CONSTITUENCY INTELLIGENCE */}
      {activeTab === 'constituency' && (
        <div className="space-y-6">
          {/* Strict Non-Partisan Constitutional Guardrail Banner */}
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
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
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
                    <span className="text-2xl font-black text-purple-900">{c.infrastructureIndex}</span>
                    <span className="text-[10px] text-slate-400 block">/ 100 Score</span>
                  </div>
                </div>

                {/* Sub-Indices */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg text-center">
                    <span className="text-[10px] text-slate-500 block">Road Network</span>
                    <span className="font-extrabold text-slate-800">{c.roadQualityScore}/100</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg text-center">
                    <span className="text-[10px] text-slate-500 block">Drainage Res.</span>
                    <span className="font-extrabold text-slate-800">{c.drainageResilienceIndex}/100</span>
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

                {/* Fiscal Allocation for Region */}
                <div className="space-y-1.5 bg-purple-50/30 p-3 rounded-lg border border-purple-100/60 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Public Capital Sanctioned:</span>
                    <span className="font-mono font-bold text-slate-900">₹{(c.totalSanctionedAmount / 100000).toFixed(1)} Lakhs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Verified Expenditure:</span>
                    <span className="font-mono font-bold text-purple-900">₹{(c.expenditureAmount / 100000).toFixed(1)} Lakhs</span>
                  </div>
                  <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden mt-1">
                    <div
                      className="bg-purple-600 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, (c.expenditureAmount / c.totalSanctionedAmount) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Recent Verified Milestones */}
                <div className="text-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recent Physical Milestones:</span>
                  <ul className="space-y-1">
                    {c.recentMilestones.map((m, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. PROJECTS */}
      {activeTab === 'projects' && (
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
                <option value="Chennai">Central Chennai</option>
                <option value="Coimbatore">Coimbatore</option>
                <option value="Madurai">Madurai</option>
                <option value="Salem">Salem</option>
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

                  {/* Rework alert if any */}
                  {p.reworkRequiredMessage && (
                    <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg text-xs text-red-900">
                      <strong className="block text-[11px] uppercase font-bold text-red-800 mb-0.5">
                        Active Quality Rework Directive:
                      </strong>
                      {p.reworkRequiredMessage}
                    </div>
                  )}

                  {/* Milestone Progress Bar & Fiscal Summary */}
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
                        <span className="font-mono font-bold text-slate-900">₹{(p.funding.sanctioned / 100000).toFixed(1)} Lakhs</span>
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

      {/* 4. FUNDING INTELLIGENCE */}
      {activeTab === 'funding' && (
        <div className="space-y-6">
          {/* Prototype / Simulated Fiscal Sandbox Notice */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-amber-950 text-sm">
                PFMS Fiscal Ledger Integration: Prototype / Sandbox Data
              </h4>
              <p className="text-amber-900 leading-relaxed">
                Budget figures, sanction ratios, and expenditure absorption are aggregated from the simulated <strong>Public Finance Management System (PFMS)</strong> ledger mock. Real-time disbursement is strictly gated by digital verification certificates.
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

          {/* Scheme Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
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
        </div>
      )}

      {/* 5. SERVICE GAPS */}
      {activeTab === 'service_gaps' && (
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
                      <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {gap.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          gap.severity === 'CRITICAL'
                            ? 'bg-red-100 text-red-800'
                            : gap.severity === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {gap.severity} PRIORITY GAP
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {gap.category.replace('_', ' ')}
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

                {/* AI Evidence Pattern */}
                <div className="p-3 bg-purple-50/40 rounded-lg border border-purple-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-purple-950 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>AI Correlated Evidence Pattern:</span>
                    </strong>
                    <span className="text-[10px] text-purple-700 font-mono">Confidence: {(gap.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{gap.aiEvidencePattern}</p>
                </div>

                {/* Recommended Policy Action */}
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

      {/* 6. DELAYED PROJECTS */}
      {activeTab === 'delayed' && (
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
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          SLA Risk: {p.slaRisk}
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

                  {/* Root cause reason */}
                  <div className="p-3 bg-red-50/60 rounded-lg border border-red-100 text-xs">
                    <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block mb-0.5">
                      Root Cause of Delay / Inspection Rejection:
                    </span>
                    <p className="text-slate-800 leading-relaxed">{p.reworkReason}</p>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <span>Target Date: <strong className="text-slate-700">{p.targetCompletionDate}</strong></span>
                    <span>Sanction: <strong className="text-slate-700 font-mono">₹{(p.sanctioned / 100000).toFixed(1)}L</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 7. EVIDENCE DIVERGENCE */}
      {activeTab === 'divergence' && (
        <div className="space-y-6">
          {/* Neutral Terminology & Advisory Guardrail Notice */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-3">
            <Scale className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">
                Multi-Party Evidence Triangulation
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Displays cases where <strong>Contractor Claim Evidence</strong>, <strong>Independent Community Observations</strong>, and <strong>Automated AI Vision Comparison</strong> indicate divergence.
                In accordance with policy standards, AI indicators are flagged as <strong className="text-slate-800">"Potential discrepancy detected"</strong>. AI does not make legally binding accusations; official human verification remains authoritative.
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

                  {/* Tripartite Comparison Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {/* 1. Contractor Claim */}
                    <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70 space-y-1.5">
                      <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                        1. Contractor Progress Claim
                      </span>
                      <p className="font-bold text-slate-900">{c.contractorEvidence.claimedPercentage}% Claimed Completion</p>
                      <p className="text-slate-700 text-[11px] leading-relaxed italic">
                        "{c.contractorEvidence.description}"
                      </p>
                      {c.contractorEvidence.photoUrl && c.contractorEvidence.photoUrl.trim() ? (
                        <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 h-28 bg-slate-100">
                          <img
                            src={c.contractorEvidence.photoUrl}
                            alt="Contractor evidence"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : null}
                      <span className="text-[10px] text-slate-400 block pt-1">
                        By: {c.contractorEvidence.contractorName}
                      </span>
                    </div>

                    {/* 2. Community & NGO Observation */}
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
                            <span className="text-[10px] font-bold text-rose-700 block">
                              Rating: {ngo.groundTruthRating}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500 text-[11px]">No third-party field audit filed.</p>
                      )}
                      {c.communityObservations.map((obs, idx) => (
                        <div key={idx} className="pt-1 border-t border-sky-100">
                          <span className="text-[10px] font-bold text-slate-500">{obs.author}:</span>
                          <p className="text-[11px] text-slate-700 italic">"{obs.comment}"</p>
                        </div>
                      ))}
                    </div>

                    {/* 3. AI Multi-modal Comparison */}
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
                      <ul className="space-y-0.5 text-[10px] text-red-900 list-disc list-inside">
                        {c.aiComparison.divergenceFlags.map((flag, idx) => (
                          <li key={idx}>{flag}</li>
                        ))}
                      </ul>
                      <p className="text-[9px] text-slate-400 italic pt-1 border-t border-purple-100">
                        {c.aiComparison.disclaimer}
                      </p>
                    </div>
                  </div>

                  {/* Official Human Inspection Status */}
                  {c.officialInspection && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <strong className="text-slate-900">
                          Official Decision: {c.officialInspection.decision} by {c.officialInspection.inspectorName}
                        </strong>
                        <p className="text-slate-600">{c.officialInspection.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 8. LIFECYCLE INTELLIGENCE */}
      {activeTab === 'lifecycle' && (
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

      {/* 9. AI INSIGHTS */}
      {activeTab === 'ai_insights' && (
        <div className="space-y-6">
          {/* Executive Strategic Synthesis Cards */}
          <div className="bg-linear-to-br from-purple-50 via-white to-indigo-50/30 rounded-2xl border border-purple-200 p-6 shadow-xs space-y-4">
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
              {aiLifecycleInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border bg-white shadow-xs text-xs space-y-2.5 ${
                    insight.urgency === 'CRITICAL'
                      ? 'border-red-300'
                      : insight.urgency === 'HIGH'
                      ? 'border-amber-300'
                      : 'border-purple-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        insight.urgency === 'CRITICAL'
                          ? 'bg-red-100 text-red-800'
                          : insight.urgency === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
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
              ))}
            </div>
          </div>

          {/* Interactive AI Strategic Query Assistant */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
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
              <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-1 rounded border border-purple-200">
                Non-Partisan Advisor
              </span>
            </div>

            {/* Quick Policy Questions */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[11px] text-slate-400 font-semibold self-center mr-1">Pre-curated:</span>
              {[
                'What are the primary drivers of milestone delay in road works?',
                'Where is funding absorption lagging behind schedule?',
                'Which wards have high recurring drainage flood risks?',
                'Summarize the quality discrepancy on Project PRJ-DEMO-002',
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

            {/* Custom Input */}
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

            {/* AI Response Card */}
            {queryResult && (
              <div className="mt-4 p-5 bg-purple-50/40 rounded-xl border border-purple-200 text-xs space-y-4 animate-in fade-in duration-300">
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
                      Key Governance Takeaways:
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

                {queryResult.recommendedActions.length > 0 && (
                  <div className="space-y-1.5 bg-emerald-50/50 p-3 rounded-lg border border-emerald-200/60">
                    <strong className="block text-[10px] uppercase font-bold text-emerald-900">
                      Recommended Policy Interventions:
                    </strong>
                    <ul className="space-y-1 text-emerald-900">
                      {queryResult.recommendedActions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <ChevronRight className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {queryResult.citedProjects.length > 0 && (
                  <div className="flex items-center gap-2 pt-1 border-t border-purple-100">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Referenced Projects:</span>
                    {queryResult.citedProjects.map((pid) => (
                      <button
                        key={pid}
                        onClick={() => setSelectedProjectId(pid)}
                        className="text-[10px] font-mono font-bold px-2 py-0.5 bg-white text-purple-900 rounded border border-purple-200 hover:bg-purple-100 transition cursor-pointer"
                      >
                        {pid}
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-slate-400 italic pt-1 border-t border-purple-100">
                  {queryResult.disclaimer}
                </p>
              </div>
            )}
          </div>
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
