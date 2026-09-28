import React, { useState } from 'react';
import { CitizenRequest } from '../../types/domain';
import { useLanguage } from '../../context/LanguageContext';
import {
  ArrowLeft,
  Search,
  MapPin,
  Clock,
  Activity,
  PlusCircle,
  FileText,
  ChevronRight,
} from 'lucide-react';

interface CitizenRequestsViewProps {
  requests: CitizenRequest[];
  onBack: () => void;
  onSelectRequest: (req: CitizenRequest) => void;
  onOpenReport: () => void;
  onTrackToken: (tokenId: string) => void;
}

export const CitizenRequestsView: React.FC<CitizenRequestsViewProps> = ({
  requests,
  onBack,
  onSelectRequest,
  onOpenReport,
  onTrackToken,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredRequests = requests.filter((r) => {
    const matchesQuery =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.district.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'ALL') return matchesQuery;
    return matchesQuery && r.status === statusFilter;
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
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition cursor-pointer shadow-2xs"
            title={t('backToCitizenHome')}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900">{t('myGrievancesTitle')}</h2>
            <p className="text-xs text-slate-500">
              {t('myGrievancesSub')} • {requests.length} {t('totalReports')}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenReport}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('fileCivicReport')}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search')}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: t('filterAll') },
            { id: 'SUBMITTED', label: t('filterPending') },
            { id: 'IN_PROGRESS', label: t('filterInWork') },
            { id: 'COMPLETED', label: t('filterCompleted') },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatusFilter(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                statusFilter === item.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-slate-800">{t('noRequestsFound')}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {t('noRequestsFound')}
          </p>
          <button
            onClick={onOpenReport}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-500 transition cursor-pointer"
          >
            {t('fileCivicReport')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition flex flex-col space-y-4"
            >
              {/* Header line */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                    {req.id}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-3 py-1 rounded-full border ${getStatusBadge(
                      req.status
                    )}`}
                  >
                    {req.status === 'COMPLETED'
                      ? t('statusCompleted')
                      : req.status === 'IN_PROGRESS'
                      ? t('statusInProgress')
                      : req.status === 'PROJECT_CREATED'
                      ? t('statusProjectCreated')
                      : req.status === 'TOKEN_ISSUED'
                      ? t('statusTokenIssued')
                      : req.status === 'TRIAGED'
                      ? t('statusTriaged')
                      : t('statusSubmitted')}
                  </span>
                  {req.workTokenId && (
                    <button
                      type="button"
                      onClick={() => onTrackToken(req.workTokenId!)}
                      className="text-[11px] font-mono font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1"
                    >
                      <Activity className="w-3 h-3 text-purple-600" />
                      <span>{req.workTokenId}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Main Content */}
              <div className="flex flex-col md:flex-row gap-5">
                {req.photoUrls && req.photoUrls[0] && req.photoUrls[0].trim() && (
                  <img
                    src={req.photoUrls[0]}
                    alt="Defect Preview"
                    className="w-full md:w-36 h-28 rounded-2xl object-cover border border-slate-200 shrink-0"
                  />
                )}

                <div className="flex-1 min-w-0 space-y-2">
                  <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                    {req.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {req.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {req.location.address}, {req.location.district}
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Action Box */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {t('currentStatus')}:
                  </span>
                  <p className="text-slate-700 font-medium text-[11px] leading-relaxed truncate">
                    {req.status === 'COMPLETED'
                      ? t('statusCompleted')
                      : req.status === 'IN_PROGRESS'
                      ? t('statusInProgress')
                      : req.status === 'TOKEN_ISSUED'
                      ? t('statusTokenIssued')
                      : t('whatsNext')}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectRequest(req)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>{t('details')}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
