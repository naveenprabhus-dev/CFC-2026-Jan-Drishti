import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { CitizenRequest, WorkToken, Project } from '../../types/domain';
import { useLanguage } from '../../context/LanguageContext';
import {
  ArrowLeft,
  Search,
  Activity,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface CitizenTrackWorkViewProps {
  initialTokenId?: string;
  onBack: () => void;
  requests: CitizenRequest[];
  onOpenProject: (projectId: string) => void;
}

export const CitizenTrackWorkView: React.FC<CitizenTrackWorkViewProps> = ({
  initialTokenId,
  onBack,
  requests,
  onOpenProject,
}) => {
  const { t } = useLanguage();
  const [searchTokenInput, setSearchTokenInput] = useState(initialTokenId || '');
  const [activeToken, setActiveToken] = useState<WorkToken | null>(null);
  const [matchedRequest, setMatchedRequest] = useState<CitizenRequest | null>(null);
  const [matchedProject, setMatchedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadTokenDetails = async (tokenIdToLoad: string) => {
    if (!tokenIdToLoad || !tokenIdToLoad.trim()) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      const tokens = await apiClient.getWorkTokens();
      const token = tokens.find(
        (t) =>
          t.id.toLowerCase() === tokenIdToLoad.trim().toLowerCase() ||
          t.requestId.toLowerCase() === tokenIdToLoad.trim().toLowerCase()
      );

      if (!token) {
        setErrorMsg(`Work Token or Request "${tokenIdToLoad}" was not found.`);
        setActiveToken(null);
        setMatchedRequest(null);
        setMatchedProject(null);
        return;
      }

      setActiveToken(token);

      const req = requests.find((r) => r.id === token.requestId || r.workTokenId === token.id);
      if (req) {
        setMatchedRequest(req);
      } else {
        try {
          const fetchedReq = await apiClient.getRequestById(token.requestId);
          setMatchedRequest(fetchedReq);
        } catch {
          // Non-critical
        }
      }

      if (token.projectId) {
        try {
          const proj = await apiClient.getProjectById(token.projectId);
          setMatchedProject(proj);
        } catch {
          // Non-critical
        }
      } else {
        setMatchedProject(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load work token lifecycle.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialTokenId) {
      setSearchTokenInput(initialTokenId);
      loadTokenDetails(initialTokenId);
    } else if (requests.length > 0 && requests[0].workTokenId) {
      setSearchTokenInput(requests[0].workTokenId);
      loadTokenDetails(requests[0].workTokenId);
    }
  }, [initialTokenId, requests]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadTokenDetails(searchTokenInput);
  };

  const getLifecycleSteps = () => {
    if (!activeToken) return [];

    const isCompleted = activeToken.status === 'VERIFICATION_REQUIRED' || matchedProject?.status === 'COMPLETED';
    const isInExecution =
      matchedProject?.status === 'IN_PROGRESS' ||
      matchedProject?.status === 'VERIFICATION_REQUIRED' ||
      matchedProject?.status === 'DELAYED' ||
      isCompleted;
    const isProjectSanctioned = !!activeToken.projectId || !!matchedProject || isInExecution;
    const isTokenIssued = true;
    const isTriageCompleted = true;
    const isRequestSubmitted = true;

    return [
      {
        step: 1,
        title: t('statusSubmitted'),
        description: `Grievance ${activeToken.requestId} recorded by citizen.`,
        status: isRequestSubmitted ? 'COMPLETE' : 'PENDING',
        actor: 'Citizen Intake',
        date: matchedRequest ? new Date(matchedRequest.createdAt).toLocaleDateString() : 'Recorded',
      },
      {
        step: 2,
        title: t('aiAnalysisAdvisory'),
        description: 'Gemini AI performed intent parsing and matched official schemes.',
        status: isTriageCompleted ? 'COMPLETE' : 'PENDING',
        actor: 'AI Engine',
        badge: 'AI ASSISTED',
      },
      {
        step: 3,
        title: t('statusTokenIssued'),
        description: `Chief Engineer generated cryptographic token (${activeToken.id}).`,
        status: isTokenIssued ? 'COMPLETE' : 'PENDING',
        actor: activeToken.issuedBy,
        date: new Date(activeToken.issuedAt).toLocaleDateString(),
        signature: activeToken.digitalThreadSignature,
      },
      {
        step: 4,
        title: t('statusProjectCreated'),
        description: matchedProject
          ? `Administrative sanction granted (${matchedProject.sanctionNumber}).`
          : 'Administrative budget sanction in progress.',
        status: isProjectSanctioned ? 'COMPLETE' : 'CURRENT',
        actor: 'PWD Highways Authority',
      },
      {
        step: 5,
        title: t('contractorName'),
        description: matchedProject
          ? `Site operations in progress. ${matchedProject.milestones?.filter((m) => m.status === 'VERIFIED').length || 0} milestones certified.`
          : 'Mobilization on site.',
        status: isCompleted ? 'COMPLETE' : isInExecution ? 'CURRENT' : 'PENDING',
        actor: matchedProject?.contractorName || 'Enlisted Contractor',
      },
      {
        step: 6,
        title: t('analyzingEvidence'),
        description: 'Contractor photo claims verified by AI and certified by inspection engineers.',
        status: isCompleted ? 'COMPLETE' : isInExecution ? 'CURRENT' : 'PENDING',
        actor: 'Government Inspection Team',
      },
      {
        step: 7,
        title: t('statusCompleted'),
        description: isCompleted
          ? 'Final engineering audit certified. Infrastructure restored.'
          : 'Pending final milestone signoff.',
        status: isCompleted ? 'COMPLETE' : 'PENDING',
        actor: 'Public Verification Ledger',
      },
    ];
  };

  const steps = getLifecycleSteps();

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition cursor-pointer shadow-2xs"
            title={t('backToCitizenHome')}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900">{t('workTokenTracker')}</h2>
            <p className="text-xs text-slate-500">
              {t('workTokenTrackerSub')}
            </p>
          </div>
        </div>
      </div>

      {/* Token Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row items-center gap-3"
      >
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTokenInput}
            onChange={(e) => setSearchTokenInput(e.target.value)}
            placeholder={t('selectWorkToken')}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none font-mono transition"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>{t('trackWorkToken')}</span>
            </>
          )}
        </button>
      </form>

      {/* User's Active Issued Work Tokens */}
      {requests.filter((r) => r.workTokenId).length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Your Active Tokens:</span>
          {requests
            .filter((r) => r.workTokenId)
            .map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setSearchTokenInput(r.workTokenId!);
                  loadTokenDetails(r.workTokenId!);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono hover:bg-emerald-100 transition cursor-pointer"
              >
                {r.workTokenId} ({r.title.slice(0, 20)}...)
              </button>
            ))}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Active Token Information Card */}
      {activeToken && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Token Header Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-purple-900">
                      {activeToken.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        matchedProject?.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : matchedProject?.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-purple-100 text-purple-800 border-purple-300'
                      }`}
                    >
                      {matchedProject?.status === 'COMPLETED'
                        ? t('statusCompleted')
                        : matchedProject?.status === 'IN_PROGRESS'
                        ? t('statusInProgress')
                        : t('statusTokenIssued')}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base mt-0.5">
                    {activeToken.title}
                  </h3>
                </div>
              </div>

              {matchedProject && (
                <button
                  type="button"
                  onClick={() => onOpenProject(matchedProject.id)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('viewExistingProject')}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 ml-1" />
                </button>
              )}
            </div>

            {/* Metadata row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('responsibleDept')}:</span>
                <span className="font-bold text-slate-800">{activeToken.department}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('districtLabel')}:</span>
                <span className="font-bold text-slate-800">{activeToken.jurisdiction}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('underOfficialTriage')}:</span>
                <span className="font-bold text-slate-800">{activeToken.issuedBy}</span>
              </div>
            </div>

            {/* Cryptographic Signature Stamp */}
            <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-200/80 flex items-center justify-between text-[11px] font-mono text-purple-900">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
                <span>SHA-256 Digital Thread Signature:</span>
              </span>
              <span className="font-bold">{activeToken.digitalThreadSignature}</span>
            </div>
          </div>

          {/* Clean 7-Step Lifecycle Timeline */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
            <h3 className="font-extrabold text-base text-slate-900 mb-6 flex items-center gap-2">
              <span>{t('tokenLifecycleStage')}</span>
            </h3>

            <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {steps.map((s, idx) => (
                <div key={idx} className="relative flex items-start gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 ${
                      s.status === 'COMPLETE'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : s.status === 'CURRENT'
                        ? 'bg-purple-600 text-white shadow-md ring-4 ring-purple-100 animate-pulse'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {s.status === 'COMPLETE' ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                  </div>

                  <div className="flex-1 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-slate-900">{s.title}</h4>
                        {s.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                            {s.badge}
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          s.status === 'COMPLETE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status === 'CURRENT'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {s.status === 'COMPLETE' ? t('statusCompleted') : s.status === 'CURRENT' ? t('statusInProgress') : t('filterPending')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>{s.actor}</span>
                      {s.date && <span>{s.date}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
