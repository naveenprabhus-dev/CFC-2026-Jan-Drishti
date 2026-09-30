import React, { useState } from 'react';
import { Project, ContractorEvidence, Milestone } from '../../types/domain';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { TranslatedText } from '../common/TranslatedText';
import { useLanguage } from '../../context/LanguageContext';
import { isProjectInInspectionStage } from '../../utils/milestoneGovernance';
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
  Lock,
  HardHat,
} from 'lucide-react';

interface OfficialInspectionsViewProps {
  projects: Project[];
  onOpenInspectionModal: (project: Project, evidence?: ContractorEvidence, milestone?: Milestone) => void;
  onOpenReworkModal: (project: Project) => void;
  onOpenProjectDetail: (projectId: string) => void;
  onCompleteProject?: (projectId: string) => void;
  currentUser?: any;
}

export const OfficialInspectionsView: React.FC<OfficialInspectionsViewProps> = ({
  projects,
  onOpenInspectionModal,
  onOpenReworkModal,
  onOpenProjectDetail,
  onCompleteProject,
  currentUser,
}) => {
  const { t } = useLanguage();
  
  // Prefer projects that are in an active execution/inspection stage first
  const initialProjectId =
    projects.find((p) => p.id === 'PRJ-DEMO-002')?.id ||
    projects.find((p) => isProjectInInspectionStage(p))?.id ||
    projects[0]?.id ||
    '';

  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId);
  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const isExecutionActive = selectedProject ? isProjectInInspectionStage(selectedProject) : false;

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
          isExecutionActive ? (
            <button
              onClick={() => onOpenInspectionModal(selectedProject)}
              className="shrink-0 px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition transform active:scale-98 cursor-pointer shadow-md"
            >
              {t('launchInspectionSession') || 'Launch Inspection Session'}
            </button>
          ) : (
            <span
              className="shrink-0 px-4 py-2.5 rounded-2xl bg-white/10 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-white/20"
              title={`Project is at stage ${selectedProject.status}. Inspection unlocks after execution begins.`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Inspection Awaiting Execution</span>
            </span>
          )
        )}
      </div>

      {/* Project Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {projects.map((p) => {
          const inExecution = isProjectInInspectionStage(p);
          return (
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
              {inExecution ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400" title="Active Execution" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-300" title={`Stage: ${p.status}`} />
              )}
              {p.status === 'DELAYED' && (
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              )}
            </button>
          );
        })}
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
                    {isExecutionActive ? (
                      <button
                        type="button"
                        onClick={() => onOpenInspectionModal(selectedProject, undefined, m)}
                        className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{t('inspectApproveBtn') || 'Inspect & Approve'}</span>
                      </button>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Awaiting Execution</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Evidence & Inspection Cockpit View */}
          <div className="lg:col-span-2 space-y-6">
            {!isExecutionActive ? (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Lock className="w-5 h-5 text-amber-600" />
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Inspection & Verification Locked — Early Stage
                  </h4>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Project <strong>{selectedProject.name}</strong> is currently at lifecycle stage{' '}
                  <strong className="font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {selectedProject.status}
                  </strong>
                  . Under the JanDrishti Golden Thread governance architecture, official site inspections and milestone certifications are unlocked only after Funding Authorization, Work Order issuance, contractor on-site mobilization, and upload of photographic progress evidence.
                </p>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
                  <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                    Sequential Next Steps Required:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>Complete contractor assignment and financial sanction reviews</li>
                    <li>Policymaker funding authorization order upload</li>
                    <li>Official Work Order issuance & contractor mobilization</li>
                    <li>Contractor milestone progress photo submission</li>
                  </ul>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenProjectDetail(selectedProject.id)}
                    className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Open Project Governance Console</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            ) : (() => {
              const projEvidence = selectedProject.evidence || [];
              const activeMilestone =
                selectedProject.milestones?.find(
                  (m) => m.status === 'UNDER_REVIEW' || m.status === 'DELAYED' || m.status === 'REWORK_REQUIRED'
                ) ||
                selectedProject.milestones?.find((m) => m.status === 'IN_PROGRESS') ||
                selectedProject.milestones?.[0];

              const milestoneEvList = activeMilestone
                ? projEvidence.filter((e) => e.milestoneId === activeMilestone.id)
                : projEvidence;

              const latestEv = milestoneEvList.length > 0 ? milestoneEvList[milestoneEvList.length - 1] : projEvidence[0];
              const aiResult = latestEv?.aiVerification;
              const hasDiscrepancy =
                aiResult?.status === 'POTENTIAL_DISCREPANCY' ||
                selectedProject.status === 'DELAYED' ||
                activeMilestone?.status === 'REWORK_REQUIRED';

              const allVerified =
                selectedProject.milestones &&
                selectedProject.milestones.length > 0 &&
                selectedProject.milestones.every((m) => m.status === 'VERIFIED');

              const isReadyForCompletion =
                allVerified || selectedProject.status === 'READY_FOR_COMPLETION';

              if (isReadyForCompletion) {
                return (
                  <div className="bg-linear-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        <div>
                          <h4 className="font-extrabold text-base text-white">
                            All Civil Milestones Verified
                          </h4>
                          <p className="text-xs text-emerald-300/80">
                            100% of engineering milestones have passed official quality inspection
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-mono text-xs font-bold rounded-full">
                        READY_FOR_COMPLETION
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      All physical phases have been verified in the digital golden thread. You may now perform the final legally consequential Project Completion Certification.
                    </p>

                    {onCompleteProject && selectedProject.status !== 'COMPLETED' && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => onCompleteProject(selectedProject.id)}
                          className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-lg flex items-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Certify Project Completion (Final Sign-off)</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              if (hasDiscrepancy) {
                const photoUrl =
                  latestEv?.mediaRefs?.[0]?.url ||
                  (latestEv as any)?.photos?.[0]?.url ||
                  (latestEv as any)?.photos?.[0] ||
                  (latestEv as any)?.photoUrls?.[0] ||
                  '';

                return (
                  <div className="bg-linear-to-br from-amber-50/90 via-white to-red-50/60 rounded-3xl border border-amber-300 p-6 sm:p-7 shadow-xs space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-amber-200 pb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <h4 className="font-extrabold text-sm text-slate-900">
                          {activeMilestone?.title || 'Milestone Evidence'} — Discrepancy Flagged
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-300">
                        [AI Confidence: {Math.round((aiResult?.confidence || 0.94) * 100)}%]
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Submitted Site Evidence Photo
                        </span>
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt="Site evidence"
                            className="w-full h-40 rounded-2xl object-cover border border-slate-300 shadow-2xs"
                          />
                        ) : (
                          <div className="w-full h-40 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center p-4 text-center text-xs text-slate-400">
                            No contractor photographic media submitted.
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-xs text-slate-700">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          AI Vision Observations & Findings:
                        </span>
                        <p className="text-[11px] text-slate-800 font-semibold leading-relaxed">
                          {aiResult?.summary || 'AI discrepancy noted between claimed progress and submitted photo evidence.'}
                        </p>
                        {aiResult?.observations && aiResult.observations.length > 0 && (
                          <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-700 font-medium">
                            {aiResult.observations.map((obs, oIdx) => (
                              <li key={oIdx}>{obs}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-900 font-medium flex items-start gap-2">
                      <RotateCcw className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Remediation Notice:</strong>{' '}
                        {selectedProject.reworkRequiredMessage ||
                          activeMilestone?.reworkNotes ||
                          'Quality inspection requires contractor remediation per engineering standards.'}
                      </span>
                    </div>
                  </div>
                );
              }

              // Normal active execution view
              const photoUrl =
                latestEv?.mediaRefs?.[0]?.url ||
                (latestEv as any)?.photos?.[0]?.url ||
                (latestEv as any)?.photos?.[0] ||
                (latestEv as any)?.photoUrls?.[0] ||
                '';

              return (
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <HardHat className="w-4 h-4 text-emerald-600" />
                      <h4 className="font-extrabold text-sm text-slate-900">
                        {activeMilestone ? `Active Phase: ${activeMilestone.title}` : 'Milestone Evidence & Inspection State'}
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {activeMilestone?.status || selectedProject.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Latest Site Execution Photograph
                      </span>
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt="Site execution"
                          className="w-full h-36 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                        />
                      ) : (
                        <div className="w-full h-36 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center p-4 text-center text-xs text-slate-400">
                          No contractor photographic media submitted.
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-xs text-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Contractor Progress Claim & AI Vision:
                      </span>
                      <p className="text-[11px] text-slate-800 leading-relaxed font-medium">
                        {latestEv?.description || 'Contractor progress photos and materials test certificates logged to digital thread.'}
                      </p>
                      <div className="pt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-mono">
                        <span>Claimed: <strong>{latestEv ? latestEv.claimedProgress : activeMilestone?.completionPercentageClaimed || 0}%</strong></span>
                        <span>•</span>
                        <span>Status: <strong className="text-purple-700">{latestEv?.status || 'SUBMITTED'}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Official Inspection Decision Actions */}
            {isExecutionActive && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs uppercase font-bold text-slate-400 block">
                    Official Human Inspection Decision
                  </span>
                  <p className="text-xs font-bold text-slate-800">
                    Authority: {currentUser?.name || 'Authorized Official'}{currentUser?.designation ? ` (${currentUser.designation})` : ''}
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};
