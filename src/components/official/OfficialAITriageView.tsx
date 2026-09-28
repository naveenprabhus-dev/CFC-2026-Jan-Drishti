import React, { useState } from 'react';
import { CitizenRequest } from '../../types/domain';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { TranslatedText } from '../common/TranslatedText';
import { useLanguage } from '../../context/LanguageContext';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  MapPin,
  Clock,
  Send,
  Building,
  KeyRound,
  FileText,
  Layers,
} from 'lucide-react';

interface OfficialAITriageViewProps {
  requests: CitizenRequest[];
  onOpenTriageModal: (req: CitizenRequest) => void;
}

export const OfficialAITriageView: React.FC<OfficialAITriageViewProps> = ({
  requests,
  onOpenTriageModal,
}) => {
  const { t } = useLanguage();
  const pendingRequests = requests.filter((r) => r.status === 'SUBMITTED');
  const [selectedReq, setSelectedReq] = useState<CitizenRequest>(
    pendingRequests[0] || requests[0]
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              {t('aiTriageCockpitTitle') || 'AI Triage & Safety Intelligence Cockpit'}
            </h2>
            <ProvenanceBadge type="AI_ANALYSIS" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('aiTriageCockpitSub') ||
              'Multimodal problem classification, damage severity extraction, and algorithmic routing recommendations'}
          </p>
        </div>
      </div>

      {/* Principle Banner */}
      <div className="bg-indigo-50 rounded-3xl border border-indigo-200 p-5 flex items-start gap-3.5 text-xs text-indigo-950 shadow-2xs">
        <Info className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-extrabold text-sm text-indigo-900 block">
            Governance Charter: AI Assists; Humans Govern
          </span>
          <p className="text-indigo-800 leading-relaxed text-[11px]">
            The multimodal AI engine extracts entity categories, translates regional transcripts, assesses defect dimensions, and suggests engineering schemes. It does <strong>NOT</strong> have authority to sanction public budgets or issue work tokens. The designated Chief Engineer must review and authorize every cryptographic Work Token.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Queue of Requests */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900">
              {t('citizenRequestQueueTitle') || 'Select Grievance for Analysis'}
            </h3>
            <span className="text-xs font-mono text-slate-500">{requests.length} Total</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {requests.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedReq(r)}
                className={`w-full p-3.5 rounded-2xl text-left border transition cursor-pointer ${
                  selectedReq?.id === r.id
                    ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-200'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-xs text-slate-900">{r.id}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      r.status === 'SUBMITTED'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-800 truncate">{r.title}</h4>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                  <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                  <span className="truncate">{r.location.address}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Detailed AI Analysis & Human Triage Decision */}
        {selectedReq && (
          <div className="lg:col-span-2 space-y-6">
            {/* Citizen Submission Info */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-slate-900">
                    {selectedReq.id}
                  </span>
                  <span className="text-xs text-slate-400">
                    Reported by: <strong>{selectedReq.citizenName}</strong>
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(selectedReq.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {selectedReq.photoUrls && selectedReq.photoUrls[0] && selectedReq.photoUrls[0].trim() && (
                  <img
                    src={selectedReq.photoUrls[0]}
                    alt="Defect"
                    className="w-full sm:w-44 h-32 rounded-2xl object-cover border border-slate-200 shrink-0"
                  />
                )}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <TranslatedText
                    text={selectedReq.title}
                    originalLanguage={selectedReq.originalLanguage || 'en'}
                    className="font-extrabold text-base text-slate-900"
                  />
                  <TranslatedText
                    text={selectedReq.description}
                    originalLanguage={selectedReq.originalLanguage || 'en'}
                    className="text-xs text-slate-600 leading-relaxed mt-1"
                  />
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{selectedReq.location.address}, {selectedReq.location.district}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Problem Intelligence Box */}
            {selectedReq.aiAnalysis ? (
              <div className="bg-linear-to-br from-indigo-50/80 via-white to-sky-50/50 rounded-3xl border border-indigo-200 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-indigo-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-extrabold text-sm text-indigo-950 uppercase tracking-wider">
                      Gemini AI Problem Understanding
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold border border-indigo-300">
                    [AI Analysis • Advisory Only]
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {selectedReq.aiAnalysis.summary}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white/80 p-4 rounded-2xl border border-indigo-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Category</span>
                    <span className="font-bold text-slate-900">{selectedReq.aiAnalysis.category.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Severity Rating</span>
                    <span className="font-bold text-rose-700">{selectedReq.aiAnalysis.severity}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Urgency SLA</span>
                    <span className="font-bold text-slate-900">{selectedReq.aiAnalysis.estimatedUrgencyDays} Days</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Confidence</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {Math.round((selectedReq.aiAnalysis.confidence || 0.95) * 100)}%
                    </span>
                  </div>
                </div>

                {selectedReq.aiAnalysis.matchedGovernmentSchemes && (
                  <div className="p-3 bg-white/80 rounded-2xl border border-indigo-100 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Matched Government Funding Scheme:
                    </span>
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                      <span>{selectedReq.aiAnalysis.matchedGovernmentSchemes[0]?.schemeName || 'State Road Development Scheme (SRDMS)'}</span>
                      <span className="text-[10px] font-mono text-slate-500 bg-indigo-50 px-2 py-0.5 rounded">
                        Code: {selectedReq.aiAnalysis.matchedGovernmentSchemes[0]?.code || 'SRDMS-PWD-01'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-3xl text-xs text-slate-500">
                No AI Problem intelligence generated yet.
              </div>
            )}

            {/* Consequential Human Decision CTA */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block">
                  Consequential Human Decision
                </span>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Ready to Issue Cryptographic Work Token?
                </h4>
                <p className="text-xs text-slate-500">
                  Authorized action signed by K. Ramanathan (Chief Engineer)
                </p>
              </div>

              <button
                onClick={() => onOpenTriageModal(selectedReq)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>{t('issueTokenBtn') || 'Launch Triage & Issue Token'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
