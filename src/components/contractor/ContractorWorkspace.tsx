import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import { Project, Milestone, ContractorEvidence } from '../../types/domain';
import { SubmitEvidenceModal } from './SubmitEvidenceModal';
import { ProjectDetailModal } from '../project/ProjectDetailModal';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { DigitalThreadBadge } from '../common/DigitalThreadBadge';
import {
  HardHat,
  Building2,
  Calendar,
  Layers,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RefreshCw,
  Search,
  ChevronRight,
  Clock,
  MapPin,
  FileText,
  DollarSign,
  ShieldCheck,
  CheckCircle,
  Eye,
  Filter,
  ArrowRight,
  Briefcase,
  AlertCircle,
  Hammer,
  BadgePercent,
} from 'lucide-react';

interface ContractorWorkspaceProps {
  onOpenProject: (projectId: string) => void;
  onOpenToken: (tokenId: string) => void;
}

type ContractorTab =
  | 'ASSIGNED_PROJECTS'
  | 'PROJECT_DETAILS'
  | 'MILESTONES'
  | 'SUBMIT_EVIDENCE'
  | 'REWORK'
  | 'COMPLETION_STATUS';

export const ContractorWorkspace: React.FC<ContractorWorkspaceProps> = ({
  onOpenProject,
  onOpenToken,
}) => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ContractorTab>('ASSIGNED_PROJECTS');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDetailProjectId, setSelectedDetailProjectId] = useState<string>('');

  // Modals
  const [selectedProjectIdForModal, setSelectedProjectIdForModal] = useState<string | null>(null);
  const [evidenceModalData, setEvidenceModalData] = useState<{
    project: Project;
    milestone: Milestone;
    isRework?: boolean;
  } | null>(null);

  // Dedicated Evidence Tab Form State
  const [selectedEvidenceProjectId, setSelectedEvidenceProjectId] = useState<string>('');
  const [selectedEvidenceMilestoneId, setSelectedEvidenceMilestoneId] = useState<string>('');

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getProjects();
      setProjects(data);
      if (data.length > 0 && !selectedDetailProjectId) {
        setSelectedDetailProjectId(data[0].id);
        setSelectedEvidenceProjectId(data[0].id);
        if (data[0].milestones.length > 0) {
          setSelectedEvidenceMilestoneId(data[0].milestones[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load contractor projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [currentUser?.id]);

  useEffect(() => {
    const handleCfcNavigate = (e: any) => {
      const target = e.detail;
      if (target === 'CONTRACTOR_ASSIGNED_PROJECTS') setActiveTab('ASSIGNED_PROJECTS');
      else if (target === 'CONTRACTOR_MILESTONES') setActiveTab('MILESTONES');
      else if (target === 'CONTRACTOR_SUBMIT_EVIDENCE') setActiveTab('SUBMIT_EVIDENCE');
      else if (target === 'CONTRACTOR_REWORK') setActiveTab('REWORK');
    };

    window.addEventListener('cfc-navigate', handleCfcNavigate);
    return () => {
      window.removeEventListener('cfc-navigate', handleCfcNavigate);
    };
  }, []);

  const handleStartExecution = async (projectId: string) => {
    try {
      await apiClient.startProjectExecution(projectId);
      await fetchProjects();
    } catch (err) {
      console.error('Failed to start execution:', err);
    }
  };

  // Derived calculations
  const assignedCount = projects.length;
  const inProgressCount = projects.filter((p) => p.status === 'IN_PROGRESS').length;
  const pendingVerificationCount = projects.filter((p) => p.status === 'VERIFICATION_REQUIRED').length;
  const reworkCount = projects.filter(
    (p) => p.status === 'DELAYED' || p.milestones.some((m) => m.status === 'DELAYED' || m.status === 'REJECTED')
  ).length;
  const completedCount = projects.filter((p) => p.status === 'COMPLETED').length;

  const totalMilestones = projects.reduce((acc, p) => acc + p.milestones.length, 0);
  const verifiedMilestones = projects.reduce(
    (acc, p) => acc + p.milestones.filter((m) => m.status === 'VERIFIED').length,
    0
  );

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'REWORK') {
      return p.status === 'DELAYED' || p.milestones.some((m) => m.status === 'DELAYED');
    }
    return p.status === statusFilter;
  });

  const selectedDetailProject =
    projects.find((p) => p.id === selectedDetailProjectId) || projects[0] || null;

  // Selected project for dedicated evidence tab
  const evidenceSelectedProject =
    projects.find((p) => p.id === selectedEvidenceProjectId) || projects[0] || null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'IN_PROGRESS':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'VERIFICATION_REQUIRED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'DELAYED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'CONTRACTOR_ASSIGNED':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  const getMilestoneStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'UNDER_REVIEW':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'IN_PROGRESS':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'DELAYED':
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'PLANNED':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. CONTRACTOR IDENTITY HEADER */}
      <div className="bg-linear-to-r from-amber-950 via-slate-900 to-amber-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/30 flex items-center gap-1.5">
                <HardHat className="w-3.5 h-3.5" />
                Contractor Operations Workspace
              </span>
              <span className="text-slate-500 text-xs">|</span>
              <span className="text-slate-300 text-xs font-mono bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-700">
                User ID: {currentUser?.id || 'cont-apex-01'}
              </span>
              <span className="text-amber-200 text-xs font-semibold">
                {currentUser?.organization || 'Apex Roads Infrastructure Ltd.'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Public Civil Works Site Operations
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl mt-1.5 leading-relaxed">
              Track assigned works, log milestone completions, submit photographic & laboratory test evidence for AI evaluation, and resolve official rework directives.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchProjects}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition backdrop-blur-xs cursor-pointer border border-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Projects</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CONTRACTOR HOME: "WHAT WORK IS ASSIGNED TO ME?" OPERATIONAL SUMMARY */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-600" />
              What work is assigned to me?
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live operational summary of civil works, milestone progress claims, and government inspection queues.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Updated: Just now</span>
          </div>
        </div>

        {/* Metric Cards in Clean Pastel Tones */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div
            onClick={() => {
              setActiveTab('ASSIGNED_PROJECTS');
              setStatusFilter('ALL');
            }}
            className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 transition cursor-pointer"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
              Assigned Projects
            </span>
            <div className="text-2xl font-black text-amber-950 mt-1">{assignedCount}</div>
            <span className="text-[10px] text-amber-800 mt-1 block">Under Active Contracts</span>
          </div>

          <div
            onClick={() => {
              setActiveTab('MILESTONES');
            }}
            className="p-4 rounded-xl border border-sky-200 bg-sky-50/60 hover:bg-sky-100/60 transition cursor-pointer"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-900 block">
              Milestone Progress
            </span>
            <div className="text-2xl font-black text-sky-950 mt-1">
              {verifiedMilestones}/{totalMilestones}
            </div>
            <span className="text-[10px] text-sky-800 mt-1 block">Phases Verified</span>
          </div>

          <div
            onClick={() => {
              setActiveTab('ASSIGNED_PROJECTS');
              setStatusFilter('VERIFICATION_REQUIRED');
            }}
            className="p-4 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/60 transition cursor-pointer"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900 block">
              Pending Inspection
            </span>
            <div className="text-2xl font-black text-purple-950 mt-1">
              {pendingVerificationCount}
            </div>
            <span className="text-[10px] text-purple-800 mt-1 block">In PWD Official Queue</span>
          </div>

          <div
            onClick={() => {
              setActiveTab('REWORK');
            }}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              reworkCount > 0
                ? 'border-rose-300 bg-rose-50 hover:bg-rose-100/80 ring-2 ring-rose-200'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-900">
                Rework Directives
              </span>
              {reworkCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              )}
            </div>
            <div className="text-2xl font-black text-rose-950 mt-1">{reworkCount}</div>
            <span className="text-[10px] text-rose-800 mt-1 block">
              {reworkCount > 0 ? 'Urgent Remediation Required' : 'Zero Discrepancies'}
            </span>
          </div>

          <div
            onClick={() => {
              setActiveTab('COMPLETION_STATUS');
            }}
            className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 transition cursor-pointer"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 block">
              Completed
            </span>
            <div className="text-2xl font-black text-emerald-950 mt-1">{completedCount}</div>
            <span className="text-[10px] text-emerald-800 mt-1 block">Certified & Handed Over</span>
          </div>
        </div>

        {/* Urgent Action Banner if Rework is Active */}
        {projects.some((p) => p.status === 'DELAYED' && p.reworkRequiredMessage) && (
          <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 text-rose-950 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <RotateCcw className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-rose-900">
                  Urgent Official Action Required: Milestone Rework Mandate Active
                </h3>
                <p className="text-xs text-rose-800 mt-0.5">
                  PWD Official Inspector rejected evidence due to layer thickness/compaction divergence. Remediate site works and upload rectification reports.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('REWORK')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Go to Rework Hub</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. PRIMARY ACTION NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('ASSIGNED_PROJECTS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'ASSIGNED_PROJECTS'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Assigned Projects</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'ASSIGNED_PROJECTS' ? 'bg-amber-800 text-white' : 'bg-slate-200 text-slate-800'
            }`}
          >
            {assignedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('PROJECT_DETAILS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'PROJECT_DETAILS'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Project Details</span>
        </button>

        <button
          onClick={() => setActiveTab('MILESTONES')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'MILESTONES'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Milestones</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'MILESTONES' ? 'bg-amber-800 text-white' : 'bg-slate-200 text-slate-800'
            }`}
          >
            {totalMilestones}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('SUBMIT_EVIDENCE')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'SUBMIT_EVIDENCE'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Submit Evidence</span>
        </button>

        <button
          onClick={() => setActiveTab('REWORK')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'REWORK'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Rework</span>
          {reworkCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'REWORK' ? 'bg-rose-800 text-white' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {reworkCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('COMPLETION_STATUS')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'COMPLETION_STATUS'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Completion Status</span>
        </button>
      </div>

      {/* 4. TAB CONTENTS */}

      {/* TAB 1: ASSIGNED PROJECTS */}
      {activeTab === 'ASSIGNED_PROJECTS' && (
        <div className="space-y-6">
          {/* Controls: Search & Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search assigned projects by ID, title, district..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-slate-50"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({projects.length})
              </button>
              <button
                onClick={() => setStatusFilter('CONTRACTOR_ASSIGNED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  statusFilter === 'CONTRACTOR_ASSIGNED'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Assigned
              </button>
              <button
                onClick={() => setStatusFilter('IN_PROGRESS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  statusFilter === 'IN_PROGRESS'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setStatusFilter('VERIFICATION_REQUIRED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  statusFilter === 'VERIFICATION_REQUIRED'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Under Review
              </button>
              <button
                onClick={() => setStatusFilter('REWORK')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  statusFilter === 'REWORK'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Rework
              </button>
              <button
                onClick={() => setStatusFilter('COMPLETED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  statusFilter === 'COMPLETED'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <HardHat className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No matching projects found.</p>
              <p className="text-xs text-slate-500 mt-1">
                Only projects officially tendered and assigned to your firm under PWD contracts appear in this list.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredProjects.map((proj) => {
                const totalM = proj.milestones.length;
                const verifiedM = proj.milestones.filter((m) => m.status === 'VERIFIED').length;
                const progressPct = totalM > 0 ? Math.round((verifiedM / totalM) * 100) : 0;
                const hasRework =
                  proj.status === 'DELAYED' || proj.milestones.some((m) => m.status === 'DELAYED');

                return (
                  <div
                    key={proj.id}
                    className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition ${
                      hasRework
                        ? 'border-rose-300 ring-2 ring-rose-100'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Project Card Header */}
                    <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-300">
                            {proj.id}
                          </span>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(
                              proj.status
                            )}`}
                          >
                            {proj.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {proj.district}, {proj.state}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            Sanction: {proj.sanctionNumber}
                          </span>
                        </div>

                        <h3 className="font-black text-slate-900 text-base">{proj.name}</h3>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{proj.scopeOfWork}</p>

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span>Authority: <strong className="text-slate-800">{proj.department}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>Target: <strong className="text-slate-800">{proj.targetCompletionDate}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                            <span>Contract: <strong className="text-emerald-800 font-mono">INR {proj.funding.contracted?.toLocaleString()}</strong></span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <DigitalThreadBadge
                            requestId={proj.requestId}
                            workTokenId={proj.workTokenId}
                            projectId={proj.id}
                            onOpenToken={onOpenToken}
                          />
                        </div>
                      </div>

                      {/* Action Area for Project Card */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-2 shrink-0">
                        {proj.status === 'CONTRACTOR_ASSIGNED' && (
                          <button
                            onClick={() => handleStartExecution(proj.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Hammer className="w-3.5 h-3.5" />
                            <span>Start Execution</span>
                          </button>
                        )}

                        {hasRework ? (
                          <button
                            onClick={() => {
                              const reworkMilestone =
                                proj.milestones.find((m) => m.status === 'DELAYED') || proj.milestones[0];
                              setEvidenceModalData({
                                project: proj,
                                milestone: reworkMilestone,
                                isRework: true,
                              });
                            }}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Submit Rework</span>
                          </button>
                        ) : (
                          proj.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => {
                                const activeM =
                                  proj.milestones.find(
                                    (m) => m.status === 'IN_PROGRESS' || m.status === 'PLANNED'
                                  ) || proj.milestones[0];
                                setEvidenceModalData({
                                  project: proj,
                                  milestone: activeM,
                                  isRework: false,
                                });
                              }}
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Evidence</span>
                            </button>
                          )
                        )}

                        <button
                          onClick={() => {
                            setSelectedDetailProjectId(proj.id);
                            setActiveTab('PROJECT_DETAILS');
                          }}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <span>Full Project Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Milestones Horizontal Bar */}
                    <div className="p-5 bg-slate-50/70 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-slate-500" />
                          <span>Milestones & Evidence Status ({verifiedM}/{totalM} Verified)</span>
                        </h4>
                        <span className="text-xs font-mono font-bold text-slate-600">
                          {progressPct}% Completed
                        </span>
                      </div>

                      {/* Visual Progress Line */}
                      <div className="w-full bg-slate-200 rounded-full h-2 mb-4 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {proj.milestones.map((m) => (
                          <div
                            key={m.id}
                            className={`p-3.5 rounded-xl border bg-white text-xs flex flex-col justify-between ${
                              m.status === 'VERIFIED'
                                ? 'border-emerald-300 bg-emerald-50/20'
                                : m.status === 'DELAYED'
                                ? 'border-rose-300 bg-rose-50/40'
                                : m.status === 'UNDER_REVIEW'
                                ? 'border-purple-300 bg-purple-50/30'
                                : 'border-slate-200'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-black text-slate-900">
                                  Phase {m.sequence}: {m.title.slice(0, 24)}...
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getMilestoneStatusBadge(
                                    m.status
                                  )}`}
                                >
                                  {m.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 line-clamp-2">{m.description}</p>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[10px] text-slate-500 font-mono">
                                Claimed: <strong>{m.completionPercentageClaimed}%</strong>
                              </span>

                              {m.status !== 'VERIFIED' && (
                                <button
                                  onClick={() =>
                                    setEvidenceModalData({
                                      project: proj,
                                      milestone: m,
                                      isRework: m.status === 'DELAYED',
                                    })
                                  }
                                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                                    m.status === 'DELAYED'
                                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                                  }`}
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>{m.status === 'DELAYED' ? 'Submit Rework' : 'Upload Evidence'}</span>
                                </button>
                              )}

                              {m.status === 'VERIFIED' && (
                                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Verified by PWD
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROJECT DETAILS (CONTRACTOR-SCOPED) */}
      {activeTab === 'PROJECT_DETAILS' && (
        <div className="space-y-6">
          {/* Project Selector Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Select Assigned Project:</span>
                <span className="text-[11px] text-slate-500">
                  Inspect assigned scope, technical specifications, deadlines, and inspection status.
                </span>
              </div>
            </div>

            <select
              value={selectedDetailProjectId}
              onChange={(e) => setSelectedDetailProjectId(e.target.value)}
              className="text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} — {p.name}
                </option>
              ))}
            </select>
          </div>

          {selectedDetailProject ? (
            <div className="space-y-6">
              {/* Project Main Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-300">
                        {selectedDetailProject.id}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(
                          selectedDetailProject.status
                        )}`}
                      >
                        {selectedDetailProject.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Sanction No: {selectedDetailProject.sanctionNumber}
                      </span>
                    </div>

                    <h2 className="text-xl font-black text-slate-900">{selectedDetailProject.name}</h2>
                    <p className="text-xs text-slate-600 mt-1">{selectedDetailProject.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedProjectIdForModal(selectedDetailProject.id)}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Open Full Lifecycle Modal</span>
                    </button>
                  </div>
                </div>

                {/* Scope & Engineering Specifications */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span>Assigned Scope of Work</span>
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed font-mono bg-white p-3 rounded-lg border border-slate-200">
                      {selectedDetailProject.scopeOfWork}
                    </p>
                    <div className="text-[11px] text-slate-500 pt-1">
                      Department Authority: <strong>{selectedDetailProject.department}</strong>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>Contract & Milestone Financial Tranches</span>
                    </h4>
                    <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Contract Value:</span>
                        <span className="font-bold text-slate-900">
                          INR {selectedDetailProject.funding.contracted?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Disbursed Expenditure:</span>
                        <span className="font-bold text-emerald-700">
                          INR {selectedDetailProject.funding.expenditure?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Funding Scheme Source:</span>
                        <span className="font-semibold text-slate-800 text-[11px]">
                          {selectedDetailProject.funding.schemeSource}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      * Payments are released progressively upon PWD engineering inspection sign-off.
                    </p>
                  </div>
                </div>

                {/* Deadlines & SLA Tracking */}
                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-amber-700 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 block">Target Completion Deadline</span>
                      <span className="text-slate-600">
                        Official contract deadline: <strong>{selectedDetailProject.targetCompletionDate}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-lg border border-amber-300">
                      SLA Active • On Track
                    </span>
                  </div>
                </div>

                {/* Milestones & Quality Requirements */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-slate-500" />
                    <span>Project Execution Milestones & Quality Standards</span>
                  </h4>

                  <div className="space-y-3">
                    {selectedDetailProject.milestones.map((m) => (
                      <div
                        key={m.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {m.sequence}
                            </span>
                            <span className="font-black text-sm text-slate-900">{m.title}</span>
                          </div>
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getMilestoneStatusBadge(
                              m.status
                            )}`}
                          >
                            {m.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600">{m.description}</p>

                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-4 text-slate-500">
                            <span>Target Date: <strong className="text-slate-700">{m.targetDate}</strong></span>
                            <span>Claimed Progress: <strong className="text-amber-700">{m.completionPercentageClaimed}%</strong></span>
                          </div>

                          <div className="flex items-center gap-2">
                            {m.status === 'DELAYED' && (
                              <button
                                onClick={() =>
                                  setEvidenceModalData({
                                    project: selectedDetailProject,
                                    milestone: m,
                                    isRework: true,
                                  })
                                }
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Submit Rework</span>
                              </button>
                            )}

                            {m.status !== 'VERIFIED' && m.status !== 'DELAYED' && (
                              <button
                                onClick={() =>
                                  setEvidenceModalData({
                                    project: selectedDetailProject,
                                    milestone: m,
                                    isRework: false,
                                  })
                                }
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
                              >
                                <Upload className="w-3 h-3" />
                                <span>Upload Evidence</span>
                              </button>
                            )}

                            {m.status === 'VERIFIED' && (
                              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Certified by Official Inspector
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Rework note if present */}
                        {m.reworkNotes && (
                          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-bold">Official Inspector Rework Directive:</span>
                              <p className="text-[11px] text-rose-800 mt-0.5">{m.reworkNotes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Digital Thread & Provenance Anchor */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <DigitalThreadBadge
                    requestId={selectedDetailProject.requestId}
                    workTokenId={selectedDetailProject.workTokenId}
                    projectId={selectedDetailProject.id}
                    onOpenToken={onOpenToken}
                  />
                  <span className="text-slate-400 font-mono text-[10px]">
                    Blockchain Digital Anchor: Verified CFC-2026 Node
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-sm font-bold text-slate-700">No project selected.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MILESTONES */}
      {activeTab === 'MILESTONES' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-600" />
                  Milestone Execution & Progress Claims
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  View and update site progress across all phases. Official verification is conducted by PWD engineers.
                </p>
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-semibold text-[11px]">
                  Official approval requires human PWD inspection sign-off.
                </span>
              </div>
            </div>

            {/* List all milestones across projects */}
            <div className="space-y-4">
              {projects.map((proj) => (
                <div key={proj.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        {proj.id}
                      </span>
                      <span className="font-bold text-xs text-slate-900">{proj.name}</span>
                    </div>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(
                        proj.status
                      )}`}
                    >
                      {proj.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="p-4 space-y-3 bg-white">
                    {proj.milestones.map((m) => (
                      <div
                        key={m.id}
                        className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          m.status === 'VERIFIED'
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : m.status === 'DELAYED'
                            ? 'border-rose-200 bg-rose-50/30'
                            : 'border-slate-200 bg-slate-50/40'
                        }`}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">
                              Phase {m.sequence}: {m.title}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getMilestoneStatusBadge(
                                m.status
                              )}`}
                            >
                              {m.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">{m.description}</p>
                          <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono">
                            <span>Target: {m.targetDate}</span>
                            <span>Claimed: {m.completionPercentageClaimed}%</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {m.status === 'DELAYED' ? (
                            <button
                              onClick={() =>
                                setEvidenceModalData({
                                  project: proj,
                                  milestone: m,
                                  isRework: true,
                                })
                              }
                              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Submit Rework</span>
                            </button>
                          ) : m.status !== 'VERIFIED' ? (
                            <button
                              onClick={() =>
                                setEvidenceModalData({
                                  project: proj,
                                  milestone: m,
                                  isRework: false,
                                })
                              }
                              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Submit Evidence</span>
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Verified
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DEDICATED EVIDENCE SUBMISSION WORKFLOW */}
      {activeTab === 'SUBMIT_EVIDENCE' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-600" />
                Dedicated Evidence Submission Hub
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload on-site photographic evidence and laboratory test reports. Records are evaluated by Gemini AI and queued for PWD Official Inspection.
              </p>
            </div>

            {/* Quick Milestone Picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Project:</label>
                <select
                  value={selectedEvidenceProjectId}
                  onChange={(e) => {
                    setSelectedEvidenceProjectId(e.target.value);
                    const p = projects.find((x) => x.id === e.target.value);
                    if (p && p.milestones.length > 0) {
                      setSelectedEvidenceMilestoneId(p.milestones[0].id);
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id} — {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Milestone Phase:</label>
                <select
                  value={selectedEvidenceMilestoneId}
                  onChange={(e) => setSelectedEvidenceMilestoneId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                >
                  {evidenceSelectedProject?.milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      Phase {m.sequence}: {m.title} ({m.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Launch Submission Button */}
            {evidenceSelectedProject && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const activeM =
                      evidenceSelectedProject.milestones.find(
                        (m) => m.id === selectedEvidenceMilestoneId
                      ) || evidenceSelectedProject.milestones[0];
                    setEvidenceModalData({
                      project: evidenceSelectedProject,
                      milestone: activeM,
                      isRework: activeM.status === 'DELAYED',
                    });
                  }}
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Launch Evidence Submission Modal</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: REWORK DIRECTIVES HUB */}
      {activeTab === 'REWORK' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-rose-950 tracking-tight flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                Official Rework & Remediation Directives
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage and rectify milestones flagged with quality divergence during PWD engineering inspections.
              </p>
            </div>

            {reworkCount === 0 ? (
              <div className="p-12 text-center bg-emerald-50/50 rounded-2xl border border-emerald-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-emerald-950">No Active Rework Directives</h4>
                <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
                  All submitted evidence complies with official PWD specifications. Milestone inspections are progressing without non-compliance.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects
                  .filter(
                    (p) =>
                      p.status === 'DELAYED' ||
                      p.milestones.some((m) => m.status === 'DELAYED' || m.status === 'REJECTED')
                  )
                  .map((p) => {
                    const reworkMilestones = p.milestones.filter(
                      (m) => m.status === 'DELAYED' || m.status === 'REJECTED'
                    );

                    return (
                      <div
                        key={p.id}
                        className="bg-rose-50/40 border border-rose-300 rounded-2xl p-5 shadow-xs space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-rose-200 text-rose-950">
                                {p.id}
                              </span>
                              <span className="font-bold text-sm text-rose-950">{p.name}</span>
                            </div>
                            <span className="text-xs text-rose-700 mt-0.5 block">
                              Authority: {p.department}
                            </span>
                          </div>

                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            Rework Required
                          </span>
                        </div>

                        {reworkMilestones.map((m) => (
                          <div
                            key={m.id}
                            className="bg-white p-4 rounded-xl border border-rose-200 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900">
                                Phase {m.sequence}: {m.title}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                                Status: {m.status}
                              </span>
                            </div>

                            <div className="p-3 bg-rose-50 rounded-lg text-xs text-rose-900 space-y-1">
                              <span className="font-bold block">Official Rejection Reason:</span>
                              <p className="text-[11px] text-rose-800 leading-relaxed">
                                {m.reworkNotes || p.reworkRequiredMessage || 'Field inspection identified sub-base density discrepancy.'}
                              </p>
                            </div>

                            {/* Rework Lifecycle Tracker */}
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                                Remediation Stage:
                              </span>
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-slate-400">1. Rejection Issued</span>
                                <span className="text-slate-400">→</span>
                                <span className="text-amber-700 font-bold">2. Awaiting Contractor Rework</span>
                                <span className="text-slate-400">→</span>
                                <span className="text-slate-400">3. Official Re-inspection</span>
                              </div>
                            </div>

                            <div className="flex justify-end">
                              <button
                                onClick={() =>
                                  setEvidenceModalData({
                                    project: p,
                                    milestone: m,
                                    isRework: true,
                                  })
                                }
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Submit Rework</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: COMPLETION STATUS & HANDOVER */}
      {activeTab === 'COMPLETION_STATUS' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Civil Works Completion & Handover Certification
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of completed milestone verifications, site punch lists, and digital public infrastructure thread signatures.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((p) => {
                const totalM = p.milestones.length;
                const verifiedM = p.milestones.filter((m) => m.status === 'VERIFIED').length;
                const isAllVerified = totalM > 0 && verifiedM === totalM;

                return (
                  <div
                    key={p.id}
                    className={`p-5 rounded-2xl border transition ${
                      isAllVerified
                        ? 'border-emerald-300 bg-emerald-50/30'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {p.id}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(
                          p.status
                        )}`}
                      >
                        {p.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 className="font-black text-sm text-slate-900">{p.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.scopeOfWork}</p>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Milestone Certification:</span>
                        <span className="font-bold text-slate-900">
                          {verifiedM} of {totalM} Verified
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Contract Value:</span>
                        <span className="font-mono font-bold text-emerald-800">
                          INR {p.funding.contracted?.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <DigitalThreadBadge
                        requestId={p.requestId}
                        workTokenId={p.workTokenId}
                        projectId={p.id}
                        onOpenToken={onOpenToken}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {evidenceModalData && (
        <SubmitEvidenceModal
          project={evidenceModalData.project}
          milestone={evidenceModalData.milestone}
          isRework={evidenceModalData.isRework}
          onClose={() => setEvidenceModalData(null)}
          onSuccess={async () => {
            setEvidenceModalData(null);
            await fetchProjects();
          }}
        />
      )}

      {selectedProjectIdForModal && (
        <ProjectDetailModal
          projectId={selectedProjectIdForModal}
          onClose={() => setSelectedProjectIdForModal(null)}
          onProjectUpdated={fetchProjects}
          onOpenSubmitEvidence={(project, milestone, isRework) => {
            setSelectedProjectIdForModal(null);
            setEvidenceModalData({ project, milestone, isRework });
          }}
        />
      )}
    </div>
  );
};
