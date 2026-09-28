import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { CitizenRequest } from '../../types/domain';
import {
  PlusCircle,
  FileText,
  Activity,
  Layers,
  MessageSquare,
  Globe,
  ArrowRight,
  MapPin,
  ChevronRight,
} from 'lucide-react';

interface CitizenHomeProps {
  onNavigate: (
    view: 'HOME' | 'REPORT' | 'MY_REQUESTS' | 'TRACK_WORK' | 'MY_PROJECTS' | 'OBSERVATION' | 'PROFILE'
  ) => void;
  requests: CitizenRequest[];
  onOpenPublicTransparency: () => void;
  onSelectRequest: (req: CitizenRequest) => void;
  onOpenReport: () => void;
}

export const CitizenHome: React.FC<CitizenHomeProps> = ({
  onNavigate,
  requests,
  onOpenPublicTransparency,
  onSelectRequest,
  onOpenReport,
}) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const completedCount = requests.filter((r) => r.status === 'COMPLETED').length;
  const inProgressCount = requests.filter(
    (r) => r.status === 'IN_PROGRESS' || r.status === 'PROJECT_CREATED' || r.status === 'TOKEN_ISSUED' || r.status === 'TRIAGED'
  ).length;

  const recentRequests = requests.slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Friendly, Reassuring Greeting Card */}
      <div className="bg-linear-to-br from-sky-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-400/30">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
              <span>{t('civicServicesPortal')} • {currentUser?.jurisdiction || 'Ward 14, Chennai'}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              {t('greetingHelp', { name: currentUser?.name?.split(' ')[0] || 'Resident' })}
            </h2>

            <p className="text-slate-300 text-sm leading-relaxed">
              {t('greetingSub')}
            </p>

            {/* Quick Status Overview Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <span className="px-3 py-1 rounded-xl bg-white/10 text-slate-200 border border-white/10 font-medium">
                <strong>{requests.length}</strong> {t('totalReports')}
              </span>
              <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                <strong>{completedCount}</strong> {t('resolvedCertified')}
              </span>
              <span className="px-3 py-1 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 font-medium">
                <strong>{inProgressCount}</strong> {t('underActiveWork')}
              </span>
            </div>
          </div>

          {/* Quick CTA button */}
          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-3">
            <button
              onClick={onOpenReport}
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition transform active:scale-98 cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>{t('reportIssue')}</span>
            </button>
            <button
              onClick={() => onNavigate('TRACK_WORK')}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 transition cursor-pointer"
            >
              <Activity className="w-4 h-4 text-sky-400" />
              <span>{t('trackWorkToken')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Action Grid (6 Clean Cards) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">{t('primaryActions')}</h3>
          <span className="text-xs text-slate-500 font-medium">{t('selectServiceToGetStarted')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Report an Issue */}
          <div
            onClick={onOpenReport}
            className="group p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <PlusCircle className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-700 transition mb-1">
                {t('reportIssue')}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('reportDescHelp')}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition">
              <span>{t('fileNewReport')}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* 2. My Requests */}
          <div
            onClick={() => onNavigate('MY_REQUESTS')}
            className="group p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-sky-300 transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-extrabold text-base text-slate-900 group-hover:text-sky-700 transition">
                  {t('myRequests')}
                </h4>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                  {requests.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('myGrievancesSub')}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-sky-600 group-hover:translate-x-1 transition">
              <span>{t('viewMyRequests')}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* 3. Track Work */}
          <div
            onClick={() => onNavigate('TRACK_WORK')}
            className="group p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-purple-300 transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <Activity className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-base text-slate-900 group-hover:text-purple-700 transition mb-1">
                {t('trackWork')}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('workTokenTrackerSub')}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-purple-600 group-hover:translate-x-1 transition">
              <span>{t('trackLifecycle')}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* 4. My Projects */}
          <div
            onClick={() => onNavigate('MY_PROJECTS')}
            className="group p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-amber-300 transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-base text-slate-900 group-hover:text-amber-700 transition mb-1">
                {t('myProjects')}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('publicProjectsSub')}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-amber-600 group-hover:translate-x-1 transition">
              <span>{t('inspectProjects')}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* 5. Community Observation */}
          <div
            onClick={() => onNavigate('OBSERVATION')}
            className="group p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-teal-300 transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-base text-slate-900 group-hover:text-teal-700 transition mb-1">
                {t('communityObs')}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('communityObsDesc')}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-teal-600 group-hover:translate-x-1 transition">
              <span>{t('submitFieldNote')}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* 6. Public Transparency */}
          <div
            onClick={onOpenPublicTransparency}
            className="group p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-300 transition cursor-pointer flex flex-col justify-between bg-linear-to-b from-white to-indigo-50/20"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <Globe className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-base text-slate-900 group-hover:text-indigo-700 transition mb-1">
                {t('transparency')}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t('publicSub')}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition">
              <span>{t('openTransparencyData')}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">{t('myGrievancesTitle')}</h3>
            <p className="text-xs text-slate-500">{t('myGrievancesSub')}</p>
          </div>
          <button
            onClick={() => onNavigate('MY_REQUESTS')}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 underline cursor-pointer"
          >
            {t('details')} ({requests.length})
          </button>
        </div>

        {recentRequests.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-500 mb-3">{t('noRequestsFound')}</p>
            <button
              onClick={onOpenReport}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-500 transition cursor-pointer"
            >
              {t('fileCivicReport')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentRequests.map((req) => (
              <div
                key={req.id}
                onClick={() => onSelectRequest(req)}
                className="p-4 rounded-2xl bg-slate-50 hover:bg-sky-50/50 border border-slate-200/80 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                      {req.id}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                    {req.workTokenId && (
                      <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                        Token: {req.workTokenId}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 truncate group-hover:text-sky-700 transition">
                    {req.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{req.location.address}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      req.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : req.status === 'IN_PROGRESS' || req.status === 'PROJECT_CREATED'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : req.status === 'TOKEN_ISSUED' || req.status === 'TRIAGED'
                        ? 'bg-purple-100 text-purple-800 border-purple-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
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
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
