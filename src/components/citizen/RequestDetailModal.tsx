import React from 'react';
import { CitizenRequest } from '../../types/domain';
import { useLanguage } from '../../context/LanguageContext';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { DigitalThreadBadge } from '../common/DigitalThreadBadge';
import { LifecycleTimeline } from '../common/LifecycleTimeline';
import { TranslatedText } from '../common/TranslatedText';
import {
  X,
  MapPin,
  Calendar,
  Sparkles,
  Building2,
  KeyRound,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
} from 'lucide-react';

interface RequestDetailModalProps {
  request: CitizenRequest;
  onClose: () => void;
  onOpenProject?: (projectId: string) => void;
  onOpenToken?: (tokenId: string) => void;
  onOfficialTriage?: (request: CitizenRequest) => void;
  isOfficial?: boolean;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  request,
  onClose,
  onOpenProject,
  onOpenToken,
  onOfficialTriage,
  isOfficial = false,
}) => {
  const { t } = useLanguage();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'PROJECT_CREATED':
      case 'IN_PROGRESS':
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                {request.id}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getStatusColor(
                  request.status
                )}`}
              >
                {request.status.replace('_', ' ')}
              </span>
            </div>
            <TranslatedText
              text={request.title}
              originalLanguage={request.originalLanguage || 'en'}
              className="font-extrabold text-base sm:text-lg text-white leading-snug"
            />
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {request.location?.address}, {request.location?.district}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Reported {new Date(request.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Digital Thread Progress */}
        <div className="bg-slate-50 p-4 border-b border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t('digitalThreadHeader')}
            </h4>
            <DigitalThreadBadge
              requestId={request.id}
              workTokenId={request.workTokenId}
              projectId={request.projectId}
              onOpenProject={onOpenProject}
              onOpenToken={onOpenToken}
            />
          </div>
          <LifecycleTimeline currentStage={request.status} />
        </div>

        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          {/* Section: Citizen Need & Evidence */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600" />
              {t('originatingCitizenNeed')}
            </h4>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed text-slate-800">
              <TranslatedText
                text={request.description}
                originalLanguage={request.originalLanguage || 'en'}
                className="font-medium text-slate-900"
              />
              <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-500 border-t border-slate-200/60 pt-2">
                <span>Reporter: <strong className="text-slate-700">{request.citizenName}</strong></span>
                <span>Language: <strong className="text-slate-700">{request.originalLanguage}</strong></span>
                {request.voiceRecorded && (
                  <span className="text-emerald-700 font-semibold">✓ Audio Voice Note Attached</span>
                )}
              </div>
            </div>

            {request.photoUrls && request.photoUrls.filter((u) => Boolean(u && u.trim())).length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {request.photoUrls.filter((u) => Boolean(u && u.trim())).map((url, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img
                      src={url}
                      alt="Citizen Site Evidence"
                      className="w-full h-36 object-cover"
                    />
                    <p className="text-[10px] text-slate-500 p-2 text-center bg-white font-mono">
                      Visual Record #{idx + 1} • Geo-Tagged to {request.location?.district}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: AI Understanding */}
          {request.aiAnalysis && (
            <div className="bg-linear-to-br from-purple-50 via-slate-50 to-indigo-50/50 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                    AI Problem Intelligence
                  </h4>
                </div>
                <ProvenanceBadge
                  type="AI_ANALYSIS"
                  modelOrSource={request.aiAnalysis.modelUsed}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 text-xs">
                <div className="p-2.5 bg-white/80 rounded-lg border border-purple-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Category</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {request.aiAnalysis.category.replace('_', ' ')}
                  </p>
                </div>
                <div className="p-2.5 bg-white/80 rounded-lg border border-purple-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Assessed Severity</span>
                  <p className="font-bold text-red-700 mt-0.5">
                    {request.aiAnalysis.severity} Severity
                  </p>
                </div>
                <div className="p-2.5 bg-white/80 rounded-lg border border-purple-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Suggested Department</span>
                  <p className="font-bold text-indigo-900 mt-0.5">
                    {request.aiAnalysis.suggestedDepartment}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-purple-100 text-xs text-slate-800 leading-relaxed mb-3">
                <span className="font-bold text-slate-900 block mb-1">AI Synthesis:</span>
                {request.aiAnalysis.summary}
              </div>

              {request.aiAnalysis.matchedGovernmentSchemes &&
                request.aiAnalysis.matchedGovernmentSchemes.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-purple-900 uppercase">
                        Matched Government Schemes & Funding Pathways
                      </span>
                      <ProvenanceBadge type="GOVERNMENT_DATA" modelOrSource="PMGSY / UIDF" />
                    </div>
                    <div className="space-y-1.5">
                      {request.aiAnalysis.matchedGovernmentSchemes.map((scheme, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-lg text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-950">{scheme.schemeName}</span>
                            <span className="font-mono text-[10px] text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                              {scheme.code}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-900 mt-1">{scheme.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Connected Action Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {request.workTokenId ? (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-purple-700">
                    Active Work Token
                  </span>
                  <p className="font-mono font-bold text-purple-950">{request.workTokenId}</p>
                </div>
                {onOpenToken && (
                  <button
                    onClick={() => onOpenToken(request.workTokenId!)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    View Token
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                Work Token pending official triage.
              </div>
            )}

            {request.projectId ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700">
                    Execution Project
                  </span>
                  <p className="font-mono font-bold text-emerald-950">{request.projectId}</p>
                </div>
                {onOpenProject && (
                  <button
                    onClick={() => onOpenProject(request.projectId!)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    Open Project
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                Project creation pending triage approval.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg transition cursor-pointer"
          >
            {t('close')}
          </button>

          {isOfficial && request.status === 'SUBMITTED' && onOfficialTriage && (
            <button
              onClick={() => onOfficialTriage(request)}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Official Triage & Issue Work Token</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
