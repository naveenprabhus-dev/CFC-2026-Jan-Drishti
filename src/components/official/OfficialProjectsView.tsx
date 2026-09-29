import React, { useState } from 'react';
import { Project, ContractorEvidence, Milestone } from '../../types/domain';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { TranslatedText } from '../common/TranslatedText';
import { useLanguage } from '../../context/LanguageContext';
import {
  Layers,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  HardHat,
  Eye,
  RotateCcw,
  DollarSign,
  MapPin,
  Calendar,
  Building,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface OfficialProjectsViewProps {
  projects: Project[];
  onOpenProjectDetail: (projectId: string) => void;
  onOpenAssignContractor: (project: Project) => void;
  onOpenInspection: (project: Project, evidence?: ContractorEvidence, milestone?: Milestone) => void;
  onOpenReworkModal: (project: Project) => void;
  onCompleteProject: (projectId: string) => void;
}

export const OfficialProjectsView: React.FC<OfficialProjectsViewProps> = ({
  projects,
  onOpenProjectDetail,
  onOpenAssignContractor,
  onOpenInspection,
  onOpenReworkModal,
  onCompleteProject,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.contractorName && p.contractorName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'VERIFICATION_REQUIRED':
        return 'bg-purple-100 text-purple-800 border-purple-300 animate-pulse';
      case 'WAITING_FOR_FINANCIAL_SANCTION':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      case 'CONTRACTOR_RECOMMENDED':
        return 'bg-amber-50 text-amber-800 border-amber-200 font-bold';
      case 'WAITING_FOR_FUNDING_AUTHORIZATION':
        return 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
      case 'FINANCIAL_SANCTIONED':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold';
      case 'FUNDING_AUTHORIZED':
        return 'bg-emerald-50 text-emerald-900 border-emerald-200 font-bold';
      case 'EXECUTION_ENABLED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'DELAYED':
        return 'bg-red-100 text-red-800 border-red-300 animate-pulse';
      case 'CONTRACTOR_ASSIGNED':
      case 'SANCTIONED':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              {t('projectsTab') || 'Official Project Supervision'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-300">
              {projects.length} Active Public Works
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervise civil milestone progression, contractor accountability, and completion certification
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search') || 'Search projects by ID, scheme name, or contractor...'}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none transition"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700 font-semibold focus:outline-none transition cursor-pointer"
        >
          <option value="ALL">{t('allStatuses') || 'All Project Statuses'}</option>
          <option value="SANCTIONED">Sanctioned</option>
          <option value="CONTRACTOR_ASSIGNED">Contractor Assigned</option>
          <option value="IN_PROGRESS">{t('statusInProgress') || 'In Progress'}</option>
          <option value="VERIFICATION_REQUIRED">Verification Required</option>
          <option value="DELAYED">Delayed / Rework</option>
          <option value="COMPLETED">{t('statusCompleted') || 'Certified Completed'}</option>
        </select>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.map((p) => {
          const verifiedCount = p.milestones?.filter((m) => m.status === 'VERIFIED').length || 0;
          const totalMilestones = p.milestones?.length || 3;
          const isAllVerified = verifiedCount === totalMilestones && totalMilestones > 0;

          return (
            <div
              key={p.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs hover:shadow-md transition flex flex-col space-y-5"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    {p.id}
                  </span>
                  <span className="text-xs text-slate-400">
                    Token: <strong className="font-mono text-slate-700">{p.workTokenId}</strong>
                  </span>
                  <span className="text-xs text-slate-400">
                    Sanction: <strong className="font-mono text-slate-700">{p.sanctionNumber}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${getStatusBadge(p.status)}`}>
                    {p.status === 'CONTRACTOR_RECOMMENDED'
                      ? 'RECOMMENDED (SIGNATURE PENDING)'
                      : p.status === 'WAITING_FOR_FINANCIAL_SANCTION'
                      ? 'WAITING FOR FINANCIAL SANCTION'
                      : p.status === 'FINANCIAL_SANCTIONED'
                      ? 'FINANCIAL SANCTIONED (ORDER SIGNING)'
                      : p.status === 'WAITING_FOR_FUNDING_AUTHORIZATION'
                      ? 'WAITING FOR FUNDING AUTHORIZATION'
                      : p.status === 'FUNDING_AUTHORIZED'
                      ? 'FUNDING AUTHORIZED (ORDER SIGNING)'
                      : p.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-3">
                <TranslatedText
                  text={p.name}
                  originalLanguage="en"
                  className="font-extrabold text-lg text-slate-900 leading-snug"
                />
                <TranslatedText
                  text={p.scopeOfWork || p.description}
                  originalLanguage="en"
                  className="text-xs text-slate-600 leading-relaxed"
                />

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{p.department}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{p.district}, {p.state}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <HardHat className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="truncate font-semibold">{p.contractorName || 'Not Assigned'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-mono font-bold">
                      ₹{((p.funding?.sanctioned || 0) / 100000).toFixed(2)} Lakhs
                    </span>
                  </div>
                </div>
              </div>

              {/* Milestones Progress Bar & Interactive Verification Targets */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">
                    {t('civilMilestones') || 'Milestone Certification Progress'}
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {verifiedCount}/{totalMilestones} Milestones Inspected & Certified
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {p.milestones?.map((m, idx) => (
                    <button
                      key={m.id || idx}
                      type="button"
                      onClick={() => onOpenInspection(p, undefined, m)}
                      className={`p-2.5 rounded-xl border text-left text-[11px] transition cursor-pointer hover:ring-2 hover:ring-teal-400/50 ${
                        m.status === 'VERIFIED'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : m.status === 'IN_PROGRESS' || m.status === 'SUBMITTED'
                          ? 'bg-blue-50 border-blue-300 text-blue-900'
                          : m.status === 'DELAYED'
                          ? 'bg-red-50 border-red-300 text-red-900'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                      title={`Click to inspect Milestone ${m.sequence}: ${m.title}`}
                    >
                      <div className="flex items-center justify-between font-bold mb-0.5">
                        <span className="flex items-center gap-1">
                          <span>M{m.sequence}</span>
                          {m.status === 'VERIFIED' && <Check className="w-3 h-3 text-emerald-600 inline" />}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono">{m.status}</span>
                      </div>
                      <p className="truncate text-[10px] text-slate-600">{m.title}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Official Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  {!p.contractorId && (
                    p.status === 'WAITING_FOR_FINANCIAL_SANCTION' || p.status === 'CONTRACTOR_RECOMMENDED' || p.status === 'PENDING_FINANCIAL_SANCTION' ? (
                      <span className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Recommendation Submitted • Awaiting Sanctioning Authority</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenAssignContractor(p)}
                        className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                      >
                        <HardHat className="w-3.5 h-3.5" />
                        <span>Recommend Contractor</span>
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() => onOpenInspection(p)}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t('launchInspectionSession') || 'Inspection Cockpit'}</span>
                  </button>

                  {p.status === 'IN_PROGRESS' && (
                    <button
                      type="button"
                      onClick={() => onOpenReworkModal(p)}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{t('mandateReworkBtn') || 'Mandate Rework'}</span>
                    </button>
                  )}

                  {isAllVerified && p.status !== 'COMPLETED' && (
                    <button
                      type="button"
                      onClick={() => onCompleteProject(p.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-md flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Certify Final Completion</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenProjectDetail(p.id)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('viewDetailsBtn') || 'Full Project Console'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
