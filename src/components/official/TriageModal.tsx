import React, { useState } from 'react';
import { CitizenRequest, WorkToken } from '../../types/domain';
import { apiClient } from '../../services/api';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { TranslatedText } from '../common/TranslatedText';
import { useLanguage } from '../../context/LanguageContext';
import {
  X,
  ShieldCheck,
  Sparkles,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building2,
  FileCheck2,
} from 'lucide-react';

interface TriageModalProps {
  request: CitizenRequest;
  onClose: () => void;
  onSuccess: (updatedReq: CitizenRequest, workToken?: WorkToken) => void;
}

export const TriageModal: React.FC<TriageModalProps> = ({
  request,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [decision, setDecision] = useState<'ACCEPT' | 'REJECT'>('ACCEPT');
  const [department, setDepartment] = useState(
    request.aiAnalysis?.suggestedDepartment || 'Public Works Department (PWD Central Circle)'
  );
  const [jurisdiction, setJurisdiction] = useState('Central Infrastructure Circle');
  const [priority, setPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>(
    (request.aiAnalysis?.severity as any) || 'HIGH'
  );
  const [notes, setNotes] = useState(
    `Official triage approval based on AI severity assessment (${request.aiAnalysis?.severity || 'HIGH'}). Proceeding to provision Work Token for infrastructure remediation.`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Triage decision
      const triagedReq = await apiClient.triageRequest({
        requestId: request.id,
        decision,
        notes,
        priority,
      });

      let token: WorkToken | undefined;

      // 2. If ACCEPT, provision Work Token
      if (decision === 'ACCEPT') {
        token = await apiClient.createWorkToken({
          requestId: request.id,
          title: `Infrastructure Action Token: ${request.title}`,
          department,
          jurisdiction,
          priority,
          notes: request.description,
        });
      }

      onSuccess(triagedReq, token);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete triage.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-900 via-slate-900 to-teal-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">
                  {t('triageModalHeading') || 'Official Administrative Triage & Work Token Authorization'}
                </h3>
                <ProvenanceBadge type="OFFICIAL_DECISION" />
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Review AI Problem Intelligence and issue official Work Token thread anchor.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Request Context Summary with TranslatedText */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs font-bold text-slate-600">
              Target Request ID: {request.id}
            </span>
            <span className="text-xs font-semibold text-slate-500">{request.location.district}</span>
          </div>
          <TranslatedText
            text={request.title}
            originalLanguage={request.originalLanguage || 'en'}
            className="font-bold text-slate-900 text-sm"
          />
          <TranslatedText
            text={request.description}
            originalLanguage={request.originalLanguage || 'en'}
            className="text-xs text-slate-600 mt-1"
          />
        </div>

        {/* AI Recommendations Panel */}
        {request.aiAnalysis && (
          <div className="p-4 bg-purple-50/60 border-b border-purple-100 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
            <div className="text-xs text-purple-950 flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">AI Recommended Classification</span>
                <ProvenanceBadge type="AI_ANALYSIS" modelOrSource={request.aiAnalysis.modelUsed} />
              </div>
              <TranslatedText
                text={request.aiAnalysis.summary}
                originalLanguage={request.originalLanguage || 'en'}
                className="text-slate-700 leading-relaxed mb-2"
              />
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="px-2 py-0.5 bg-white rounded border border-purple-200 font-semibold">
                  Category: {request.aiAnalysis.category}
                </span>
                <span className="px-2 py-0.5 bg-white rounded border border-purple-200 font-semibold text-red-700">
                  Assessed Severity: {request.aiAnalysis.severity}
                </span>
                <span className="px-2 py-0.5 bg-white rounded border border-purple-200 font-semibold">
                  Urgency: {request.aiAnalysis.estimatedUrgencyDays} days
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Triage Decision Form */}
        <form onSubmit={handleTriageSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Decision Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Administrative Decision *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                  decision === 'ACCEPT'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-200'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  checked={decision === 'ACCEPT'}
                  onChange={() => setDecision('ACCEPT')}
                  className="accent-emerald-600"
                />
                <div>
                  <p className="text-xs font-bold">{t('issueTokenBtn') || 'Accept & Issue Work Token'}</p>
                  <p className="text-[10px] text-slate-500">
                    Provisions immutable Work Token and advances digital thread
                  </p>
                </div>
              </label>

              <label
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                  decision === 'REJECT'
                    ? 'bg-red-50 border-red-500 text-red-950 ring-2 ring-red-200'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  checked={decision === 'REJECT'}
                  onChange={() => setDecision('REJECT')}
                  className="accent-red-600"
                />
                <div>
                  <p className="text-xs font-bold">{t('rejectRequestBtn') || 'Reject / Non-Actionable'}</p>
                  <p className="text-[10px] text-slate-500">
                    Closes grievance with administrative explanation
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Accept Details: Department & Priority */}
          {decision === 'ACCEPT' && (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Designated Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Priority Tier
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  >
                    <option value="CRITICAL">CRITICAL (Immediate Dispatch)</option>
                    <option value="HIGH">HIGH Priority</option>
                    <option value="MEDIUM">MEDIUM Priority</option>
                    <option value="LOW">LOW Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Circle Jurisdiction
                </label>
                <input
                  type="text"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  required
                />
              </div>
            </div>
          )}

          {/* Official Justification Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Official Justification & Administrative Directives *
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              placeholder="State official reason for triage decision..."
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg transition cursor-pointer"
            >
              {t('close') || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer ${
                decision === 'ACCEPT'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isSubmitting ? (
                <span>Executing...</span>
              ) : decision === 'ACCEPT' ? (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{t('issueTokenBtn') || 'Authorize & Issue Work Token'}</span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4" />
                  <span>{t('rejectRequestBtn') || 'Confirm Rejection'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
