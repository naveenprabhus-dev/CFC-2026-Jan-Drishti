import React, { useState } from 'react';
import { CitizenRequest } from '../../types/domain';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { TranslatedText } from '../common/TranslatedText';
import { useLanguage } from '../../context/LanguageContext';
import {
  Search,
  Filter,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileText,
  ChevronRight,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface OfficialRequestQueueProps {
  requests: CitizenRequest[];
  onOpenTriage: (request: CitizenRequest) => void;
  onOpenRequestDetail: (request: CitizenRequest) => void;
}

export const OfficialRequestQueue: React.FC<OfficialRequestQueueProps> = ({
  requests,
  onOpenTriage,
  onOpenRequestDetail,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.district.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSeverity =
      severityFilter === 'ALL' || r.aiAnalysis?.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'IN_PROGRESS':
      case 'PROJECT_CREATED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'TOKEN_ISSUED':
      case 'TRIAGED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'SUBMITTED':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header & Jurisdiction Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              {t('citizenRequestQueueTitle') || 'Citizen Request Queue'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
              {t('pwdJurisdiction') || 'PWD Central Circle Jurisdiction'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('requestQueueSub') ||
              'Incoming public infrastructure grievances awaiting administrative triage and token authorization'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              t('searchRequestPlaceholder') ||
              'Search by Request ID, defect keywords, or ward location...'
            }
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700 font-semibold focus:outline-none transition cursor-pointer"
          >
            <option value="ALL">{t('allStatuses') || 'All Statuses'} ({requests.length})</option>
            <option value="SUBMITTED">{t('statusSubmitted') || 'Submitted (Pending Triage)'}</option>
            <option value="TOKEN_ISSUED">{t('statusTokenIssued') || 'Work Token Issued'}</option>
            <option value="PROJECT_CREATED">{t('statusProjectCreated') || 'Project Created'}</option>
            <option value="IN_PROGRESS">{t('statusInProgress') || 'In Execution'}</option>
            <option value="COMPLETED">{t('statusCompleted') || 'Certified Complete'}</option>
            <option value="REJECTED">{t('statusRejected') || 'Rejected'}</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700 font-semibold focus:outline-none transition cursor-pointer"
          >
            <option value="ALL">{t('allSeverities') || 'All Severities'}</option>
            <option value="CRITICAL">{t('criticalSeverity') || 'Critical Severity'}</option>
            <option value="HIGH">{t('highSeverity') || 'High Severity'}</option>
            <option value="MEDIUM">{t('mediumSeverity') || 'Medium Severity'}</option>
            <option value="LOW">{t('lowSeverity') || 'Low Severity'}</option>
          </select>
        </div>
      </div>

      {/* Requests Table / Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">{t('requestIdDate') || 'Request ID & Date'}</th>
                <th className="py-3.5 px-4">{t('grievanceSummaryLocation') || 'Grievance Summary & Location'}</th>
                <th className="py-3.5 px-4">{t('aiProblemClassification') || 'AI Problem Classification'}</th>
                <th className="py-3.5 px-4">{t('suggestedSchemeDept') || 'Suggested Scheme / Dept'}</th>
                <th className="py-3.5 px-4">{t('authorityStatus') || 'Authority Status'}</th>
                <th className="py-3.5 px-4 text-right">{t('administrativeAction') || 'Administrative Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {t('noRequestsMatch') || 'No requests match the selected filters.'}
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    {/* ID & Date */}
                    <td className="py-4 px-4 align-top">
                      <span className="font-mono font-black text-xs text-slate-900 block">
                        {r.id}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                      {r.workTokenId && (
                        <span className="mt-1 inline-block font-mono text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                          {r.workTokenId}
                        </span>
                      )}
                    </td>

                    {/* Summary & Location with TranslatedText */}
                    <td className="py-4 px-4 align-top max-w-xs">
                      <TranslatedText
                        text={r.title}
                        originalLanguage={r.originalLanguage || 'en'}
                        className="font-bold text-xs text-slate-900"
                      />
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{r.location.address}</span>
                      </div>
                    </td>

                    {/* AI Classification */}
                    <td className="py-4 px-4 align-top">
                      {r.aiAnalysis ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                r.aiAnalysis.severity === 'CRITICAL'
                                  ? 'bg-rose-100 text-rose-800'
                                  : r.aiAnalysis.severity === 'HIGH'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {r.aiAnalysis.severity}
                            </span>
                            <span className="text-[10px] font-bold text-slate-700">
                              {r.aiAnalysis.category.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-1">
                            {r.aiAnalysis.summary}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Pending AI analysis</span>
                      )}
                    </td>

                    {/* Suggested Scheme / Dept */}
                    <td className="py-4 px-4 align-top">
                      <span className="text-[11px] font-semibold text-slate-800 block truncate max-w-[140px]">
                        {r.aiAnalysis?.suggestedDepartment || 'PWD Central Circle'}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700 block">
                        SRDMS / State Fund
                      </span>
                    </td>

                    {/* Authority Status */}
                    <td className="py-4 px-4 align-top">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                          r.status
                        )}`}
                      >
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 align-top text-right space-x-2">
                      {r.status === 'SUBMITTED' ? (
                        <button
                          onClick={() => onOpenTriage(r)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-2xs inline-flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{t('triageDecideBtn') || 'Review & Triage'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenRequestDetail(r)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t('viewDetailsBtn') || 'Details'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
