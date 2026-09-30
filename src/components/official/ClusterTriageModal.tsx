import React, { useState, useEffect } from 'react';
import { IssueCluster, CitizenRequest, WorkToken } from '../../types/domain';
import { apiClient } from '../../services/api';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { TranslatedText } from '../common/TranslatedText';
import { useLanguage } from '../../context/LanguageContext';
import {
  X,
  ShieldCheck,
  Sparkles,
  Users,
  MapPin,
  Clock,
  AlertTriangle,
  Send,
  FileCheck2,
  Building2,
  ChevronDown,
  ChevronUp,
  FileText,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface ClusterTriageModalProps {
  cluster: IssueCluster;
  onClose: () => void;
  onSuccess: (updatedCluster: IssueCluster, workToken?: WorkToken) => void;
}

export const ClusterTriageModal: React.FC<ClusterTriageModalProps> = ({
  cluster,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [sourceRequests, setSourceRequests] = useState<CitizenRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(true);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);

  const [decision, setDecision] = useState<'ACCEPT' | 'REJECT'>('ACCEPT');
  const [department, setDepartment] = useState<string>(
    cluster.department || 'Public Works Department (PWD Central Circle)'
  );
  const [jurisdiction, setJurisdiction] = useState<string>(
    cluster.jurisdiction || `${cluster.location.district} Infrastructure Circle`
  );
  const [priority, setPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>(
    (cluster.priority as any) || 'HIGH'
  );
  const [notes, setNotes] = useState<string>(
    `Official administrative triage approval based on aggregated demand signals (${cluster.reportCount} citizen reports). Proceeding to issue Work Token.`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchClusterDetail = async () => {
      setIsLoadingRequests(true);
      try {
        const detail = await apiClient.getClusterDetail(cluster.id);
        if (isMounted && detail?.requests) {
          setSourceRequests(detail.requests);
        }
      } catch (err) {
        console.warn('Failed to load cluster source requests:', err);
      } finally {
        if (isMounted) setIsLoadingRequests(false);
      }
    };
    fetchClusterDetail();
    return () => {
      isMounted = false;
    };
  }, [cluster.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const result = await apiClient.triageCluster(cluster.id, {
        decision,
        notes,
        priority,
        department,
        jurisdiction,
      });

      onSuccess(result.cluster, result.workToken);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete cluster triage.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLanguageLabel = (code?: string) => {
    switch (code) {
      case 'ta': return 'Tamil (தமிழ்)';
      case 'hi': return 'Hindi (हिन्दी)';
      case 'ml': return 'Malayalam (മലയാളം)';
      case 'te': return 'Telugu (తెలుగు)';
      case 'kn': return 'Kannada (ಕನ್ನಡ)';
      default: return 'English';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-900 via-slate-900 to-teal-950 text-white p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Users className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {cluster.id}
                </span>
                <span className="text-xs font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{cluster.reportCount} Citizen Reports</span>
                </span>
              </div>
              <h3 className="font-bold text-lg text-white mt-1">
                {cluster.canonicalTitle}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-slate-50/50">
          {/* Priority Intelligence Signals Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h4 className="font-black text-sm text-slate-900">
                  Priority Assessment & Supporting Signals
                </h4>
              </div>
              <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                cluster.priority === 'EMERGENCY'
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {cluster.priority} PRIORITY (Score: {cluster.priorityScore}/100)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                  Supporting Evidence Signals:
                </span>
                <ul className="space-y-1.5 text-slate-600">
                  {cluster.priorityReasoning.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-100 space-y-1.5">
                <span className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  AI Intelligence Summary
                </span>
                <p className="text-xs text-purple-950 leading-relaxed">
                  {cluster.aiAssessment || 'Multiple citizen submissions confirm recurring infrastructure issue.'}
                </p>
                <div className="pt-1 flex items-center justify-between text-[10px] text-purple-700 font-semibold">
                  <span>Confidence: {(cluster.aggregationConfidence * 100).toFixed(0)}%</span>
                  <span>Category: {cluster.category}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Source Citizen Reports Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Source Citizen Reports ({sourceRequests.length || cluster.reportCount})</span>
              </h4>
              <span className="text-xs text-slate-500 italic">
                Preserved original language & text
              </span>
            </div>

            {isLoadingRequests ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                Loading source reports...
              </div>
            ) : sourceRequests.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                Linked request records: {cluster.requestIds.join(', ')}
              </div>
            ) : (
              <div className="space-y-2.5">
                {sourceRequests.map((req, index) => {
                  const isExpanded = expandedRequestId === req.id || index === 0;
                  return (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition shadow-2xs"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedRequestId(isExpanded ? null : req.id)
                        }
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/80 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 shrink-0">
                            {req.id}
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                            {getLanguageLabel(req.originalLanguage)}
                          </span>
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {req.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-[10px] text-slate-400">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                          <div>
                            <span className="font-bold text-slate-500 text-[10px] uppercase block mb-0.5">
                              Report Description (Viewer Presentation):
                            </span>
                            <TranslatedText
                              text={req.description}
                              originalLanguage={req.originalLanguage || 'en'}
                              className="text-slate-800 font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-200/80"
                            />
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {req.location.address}, {req.location.district}
                            </span>
                            <span className="font-semibold text-slate-700">
                              Citizen: {req.citizenName}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Official Action & Work Token Authorization Form */}
          <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
            <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Official Decision & Work Token Authorization</span>
            </h4>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrative Decision
                </label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ACCEPT">
                    APPROVE & Authorize Work Token
                  </option>
                  <option value="REJECT">REJECT Cluster</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="CRITICAL">CRITICAL Priority</option>
                  <option value="HIGH">HIGH Priority</option>
                  <option value="MEDIUM">MEDIUM Priority</option>
                  <option value="LOW">LOW Priority</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jurisdiction Scope
                </label>
                <input
                  type="text"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Triage Findings & Decision Rationale
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                placeholder="Enter official rationale for triage decision..."
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Processing...'
                    : decision === 'ACCEPT'
                    ? 'Authorize Work Token'
                    : 'Record Decision'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
