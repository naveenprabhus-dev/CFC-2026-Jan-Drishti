import React, { useState } from 'react';
import { WorkToken, Project } from '../../types/domain';
import { TranslatedText } from '../common/TranslatedText';
import { useLanguage } from '../../context/LanguageContext';
import {
  KeyRound,
  Search,
  Layers,
  CheckCircle2,
  ShieldCheck,
  Building,
  MapPin,
  Clock,
  PlusCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface OfficialWorkTokensViewProps {
  tokens: WorkToken[];
  projects: Project[];
  onOpenCreateProject: (token: WorkToken) => void;
  onOpenProjectDetail: (projectId: string) => void;
}

export const OfficialWorkTokensView: React.FC<OfficialWorkTokensViewProps> = ({
  tokens,
  projects,
  onOpenCreateProject,
  onOpenProjectDetail,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredTokens = tokens.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.requestId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              {t('workTokensTab') || 'Work Token Registry'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold border border-purple-300">
              Immutable Cryptographic Registry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically signed digital public tokens authorizing civic capital expenditure and execution
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search') || 'Search tokens by ID, request reference, or department...'}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-purple-500 focus:outline-none transition"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700 font-semibold focus:outline-none transition cursor-pointer"
        >
          <option value="ALL">{t('allStatuses') || 'All Token Statuses'}</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="VERIFICATION_REQUIRED">VERIFICATION REQUIRED</option>
          <option value="COMPLETED">{t('statusCompleted') || 'COMPLETED'}</option>
        </select>
      </div>

      {/* Work Tokens List */}
      <div className="space-y-4">
        {filteredTokens.map((token) => {
          const linkedProject = projects.find((p) => p.workTokenId === token.id);

          return (
            <div
              key={token.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition space-y-4"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs text-purple-950 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                    {token.id}
                  </span>
                  <span className="text-xs text-slate-400">
                    Anchor Request: <strong className="font-mono text-slate-700">{token.requestId}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      token.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : token.status === 'VERIFICATION_REQUIRED'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-purple-100 text-purple-800 border-purple-300'
                    }`}
                  >
                    {token.status}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-2">
                <TranslatedText
                  text={token.title}
                  originalLanguage="en"
                  className="font-extrabold text-base text-slate-900"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{token.department}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{token.jurisdiction}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Priority: <strong>{token.priority}</strong></span>
                  </div>
                </div>
              </div>

              {/* Digital Thread Signature */}
              <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100 flex items-center justify-between text-[11px] font-mono text-purple-900">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>SHA-256 Digital Thread Signature:</span>
                </span>
                <span className="font-bold truncate max-w-xs">{token.digitalThreadSignature}</span>
              </div>

              {/* Action row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                {linkedProject ? (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>Linked Project: <strong className="font-mono text-slate-900">{linkedProject.id}</strong> ({linkedProject.name})</span>
                  </div>
                ) : (
                  <span className="text-xs text-amber-700 font-bold">
                    Pending Administrative Project Sanction & Contractor Assignment
                  </span>
                )}

                <div className="flex items-center gap-2">
                  {linkedProject ? (
                    <button
                      type="button"
                      onClick={() => onOpenProjectDetail(linkedProject.id)}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t('viewDetailsBtn') || 'Inspect Project'}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenCreateProject(token)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Sanction & Create Project</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
