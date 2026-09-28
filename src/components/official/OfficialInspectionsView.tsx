import React, { useState } from 'react';
import { Project, ContractorEvidence, Milestone } from '../../types/domain';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { TranslatedText } from '../common/TranslatedText';
import { useLanguage } from '../../context/LanguageContext';
import {
  Eye,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Camera,
  MapPin,
  Clock,
  ShieldCheck,
  Building,
  ChevronRight,
  Info,
  Check,
} from 'lucide-react';

interface OfficialInspectionsViewProps {
  projects: Project[];
  onOpenInspectionModal: (project: Project, evidence?: ContractorEvidence, milestone?: Milestone) => void;
  onOpenReworkModal: (project: Project) => void;
  onOpenProjectDetail: (projectId: string) => void;
  onCompleteProject?: (projectId: string) => void;
}

export const OfficialInspectionsView: React.FC<OfficialInspectionsViewProps> = ({
  projects,
  onOpenInspectionModal,
  onOpenReworkModal,
  onOpenProjectDetail,
  onCompleteProject,
}) => {
  const { t } = useLanguage();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects.find((p) => p.id === 'PRJ-DEMO-002')?.id || projects[0]?.id || ''
  );

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              {t('evidenceCockpitTitle') || 'Evidence Verification & Inspection Cockpit'}
            </h2>
            <ProvenanceBadge type="OFFICIAL_DECISION" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('evidenceCockpitSub') ||
              'Evaluate contractor photographic claims against Gemini AI vision verification, community signals, and field testing'}
          </p>
        </div>
      </div>

      {/* AI Divergence & Inspection Protocol Notice */}
      <div className="bg-linear-to-r from-teal-900 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <h3 className="font-extrabold text-base text-white">
              AI Vision Ground-Truth & Discrepancy Protocol
            </h3>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Gemini Vision compares contractor progress claims against geo-tagged site images, identifying uncompacted aggregate, missing bitumen coats, and divergence with community reports. The human official retains sole legal authority to approve milestones or issue rework mandates.
          </p>
        </div>

        {selectedProject && (
          <button
            onClick={() => onOpenInspectionModal(selectedProject)}
            className="shrink-0 px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition transform active:scale-98 cursor-pointer shadow-md"
          >
            {t('launchInspectionSession') || 'Launch Inspection Session'}
          </button>
        )}
      </div>

      {/* Project Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedProjectId(p.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer border shrink-0 flex items-center gap-2 ${
              selectedProjectId === p.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="font-mono">{p.id}</span>
            <span className="max-w-[140px] truncate">{p.name}</span>
            {p.status === 'DELAYED' && (
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
            )}
          </button>
        ))}
      </div>

      {/* Inspection Details for Selected Project */}
      {selectedProject && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Milestone Overview */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900">
                {t('civilMilestones') || 'Civil Milestones'}
              </h3>
              <span className="font-mono text-xs text-slate-400">{selectedProject.id}</span>
            </div>

            <div className="space-y-3">
              {selectedProject.milestones?.map((m) => (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-2xl border ${
                    m.status === 'VERIFIED'
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : m.status === 'REJECTED' || selectedProject.status === 'DELAYED'
                      ? 'bg-red-50/70 border-red-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-slate-900 flex items-center gap-1.5">
                      <span>Milestone {m.sequence}: {m.title}</span>
                      {m.status === 'VERIFIED' && <Check className="w-3.5 h-3.5 text-emerald-600 inline" />}
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-mono ${
                        m.status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.status === 'REJECTED' || selectedProject.status === 'DELAYED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{m.description}</p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onOpenInspectionModal(selectedProject, undefined, m)}
                      className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{t('inspectApproveBtn') || 'Inspect & Approve'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Evidence & Inspection Cockpit View */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scrutiny Alert for PRJ-DEMO-002 or Delayed projects */}
            {selectedProject.id === 'PRJ-DEMO-002' || selectedProject.status === 'DELAYED' ? (
              <div className="bg-linear-to-br from-amber-50/80 via-white to-red-50/50 rounded-3xl border border-amber-300 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-amber-200 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Discrepancy Signal Flagged for Quality Audit
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300">
                    [AI Confidence: 94%]
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Submitted Site Evidence Photo
                    </span>
                    <img
                      src="https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80"
                      alt="Site evidence"
                      className="w-full h-40 rounded-2xl object-cover border border-slate-300 shadow-2xs"
                    />
                  </div>

                  <div className="space-y-2 text-xs text-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      AI Vision Discrepancy Observations:
                    </span>
                    <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-700 font-medium">
                      <li>Contractor claimed progress completion for DBM & asphalt layer.</li>
                      <li>Submitted photo depicts raw dumped gravel with no bitumen binder or prime coat.</li>
                      <li>Community observation logs confirm school-gate trench hazard.</li>
                    </ul>
                  </div>
                </div>

                <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-900 font-medium flex items-start gap-2">
                  <RotateCcw className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Official Human Inspection Decision:</strong> REWORK_REQUIRED. Contractor must compact subgrade with 10-ton vibratory roller and lay 50mm Bituminous Concrete before reinspection.
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Milestone Evidence & Inspection State
                  </h4>
                  <span className="text-xs font-bold text-emerald-700">
                    {selectedProject.status === 'COMPLETED' ? '100% Certified' : 'Active Execution'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  All submitted milestone photo certificates, lab compaction test metrics, and citizen observation logs for {selectedProject.name} are accessible in the official inspection session.
                </p>
              </div>
            )}

            {/* Official Inspection Decision Actions */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs uppercase font-bold text-slate-400 block">
                  Official Human Inspection Decision
                </span>
                <p className="text-xs font-bold text-slate-800">
                  Authority: K. Ramanathan (Chief Engineer)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenReworkModal(selectedProject)}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('mandateReworkBtn') || 'Require Rework'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenInspectionModal(selectedProject)}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t('launchInspectionSession') || 'Complete Inspection'}</span>
                </button>

                {selectedProject.status !== 'COMPLETED' && onCompleteProject && (
                  <button
                    type="button"
                    onClick={() => onCompleteProject(selectedProject.id)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Certify Project Complete</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
