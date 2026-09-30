import React, { useState, useEffect } from 'react';
import { Project, Milestone, ContractorEvidence, OfficialInspection } from '../../types/domain';
import { apiClient } from '../../services/api';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { TranslatedText } from '../common/TranslatedText';
import { useLanguage } from '../../context/LanguageContext';
import { isProjectInInspectionStage } from '../../utils/milestoneGovernance';
import {
  X,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HardHat,
  RotateCcw,
  Eye,
  Camera,
  Layers,
  Calendar,
  Check,
  ChevronRight,
  Lock,
  Maximize2,
  Clock,
  MapPin,
} from 'lucide-react';

interface InspectionModalProps {
  project: Project;
  milestone: Milestone;
  evidence?: ContractorEvidence;
  communityObservations?: string[];
  onClose: () => void;
  onSuccess: (inspection: OfficialInspection, updatedProject: Project) => void;
}

export const InspectionModal: React.FC<InspectionModalProps> = ({
  project: initialProject,
  milestone: initialMilestone,
  evidence: initialEvidence,
  communityObservations = [],
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [currentProject, setCurrentProject] = useState<Project>(initialProject);
  const [activeMilestoneId, setActiveMilestoneId] = useState<string>(initialMilestone.id);
  const [projectEvidence, setProjectEvidence] = useState<ContractorEvidence[]>(initialProject.evidence || []);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);
  const [enlargedPhotoUrl, setEnlargedPhotoUrl] = useState<string | null>(null);

  // Load fresh project and evidence details on mount
  useEffect(() => {
    let isMounted = true;
    const fetchFreshData = async () => {
      setIsLoadingEvidence(true);
      try {
        const fullProj = await apiClient.getProjectById(initialProject.id);
        if (isMounted && fullProj) {
          setCurrentProject(fullProj);
          if (Array.isArray(fullProj.evidence)) {
            setProjectEvidence(fullProj.evidence);
          }
        }
      } catch (err) {
        console.warn('Could not fetch fresh project evidence in modal:', err);
      } finally {
        if (isMounted) setIsLoadingEvidence(false);
      }
    };
    fetchFreshData();
    return () => {
      isMounted = false;
    };
  }, [initialProject.id]);

  // Helper to extract media photos from any evidence format
  const extractMediaFromEvidence = (ev: ContractorEvidence) => {
    const list: Array<{ url: string; caption: string; type?: string }> = [];
    if (Array.isArray(ev.mediaRefs) && ev.mediaRefs.length > 0) {
      ev.mediaRefs.forEach((m: any, mIdx: number) => {
        if (typeof m === 'string' && m.trim()) {
          list.push({ url: m.trim(), caption: `Site Photo #${mIdx + 1}` });
        } else if (m && typeof m === 'object') {
          const url = (m.url || (m as any).photoUrl || (m as any).uri || '').trim();
          if (url) {
            list.push({ url, caption: m.caption || `Site Photo #${mIdx + 1}`, type: m.type });
          }
        }
      });
    }
    if ((ev as any).photos && Array.isArray((ev as any).photos)) {
      (ev as any).photos.forEach((p: any, pIdx: number) => {
        const url = typeof p === 'string' ? p.trim() : (p?.url || p?.photoUrl || '').trim();
        if (url && !list.some((item) => item.url === url)) {
          list.push({ url, caption: p?.caption || `Site Photo #${pIdx + 1}` });
        }
      });
    }
    if ((ev as any).photoUrls && Array.isArray((ev as any).photoUrls)) {
      (ev as any).photoUrls.forEach((pUrl: any, pIdx: number) => {
        if (typeof pUrl === 'string' && pUrl.trim() && !list.some((item) => item.url === pUrl.trim())) {
          list.push({ url: pUrl.trim(), caption: `Site Photo #${pIdx + 1}` });
        }
      });
    }

    return list;
  };

  // Find currently active milestone from latest project state
  const activeMilestone =
    currentProject.milestones?.find((m) => m.id === activeMilestoneId) || initialMilestone;

  // Filter all evidence submissions matching this active milestone sorted by date ascending
  const matchingEvidenceList = [...projectEvidence]
    .filter((e) => e.projectId === currentProject.id && e.milestoneId === activeMilestone.id)
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

  const latestEvidence = matchingEvidenceList.length > 0
    ? matchingEvidenceList[matchingEvidenceList.length - 1]
    : initialEvidence && initialEvidence.milestoneId === activeMilestone.id
    ? initialEvidence
    : null;

  const aiResult = latestEvidence?.aiVerification;
  const isDiscrepancyDetected = aiResult?.status === 'POTENTIAL_DISCREPANCY';

  const [decision, setDecision] = useState<'APPROVED' | 'REWORK_REQUIRED'>(
    isDiscrepancyDetected ? 'REWORK_REQUIRED' : 'APPROVED'
  );

  const [officialNotes, setOfficialNotes] = useState(
    isDiscrepancyDetected
      ? 'Official site inspection confirms AI discrepancy analysis. Dumped aggregate subgrade does not satisfy 80% bitumen compaction criteria. Rework and asphalt paver mobilization mandated.'
      : `Visual inspection, core compaction test reports, and site geometry satisfy PWD engineering quality specifications for Milestone ${activeMilestone.sequence}: ${activeMilestone.title}. Verified.`
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [justCompletedInspection, setJustCompletedInspection] = useState<OfficialInspection | null>(null);

  const handleMilestoneSwitch = (m: Milestone) => {
    setActiveMilestoneId(m.id);
    setErrorMsg('');
    setJustCompletedInspection(null);

    const mEvList = projectEvidence.filter(
      (e) => e.projectId === currentProject.id && e.milestoneId === m.id
    );
    const mLatestEv = mEvList.length > 0 ? mEvList[mEvList.length - 1] : null;
    const mAi = mLatestEv?.aiVerification;

    if (m.status === 'VERIFIED') {
      setOfficialNotes(`Milestone ${m.sequence} (${m.title}) has already been verified and certified.`);
    } else if (mAi?.status === 'POTENTIAL_DISCREPANCY') {
      setDecision('REWORK_REQUIRED');
      setOfficialNotes(
        'Official site inspection confirms AI discrepancy analysis. Deficiencies noted require contractor remediation.'
      );
    } else {
      setDecision('APPROVED');
      setOfficialNotes(
        `Visual inspection, core compaction test reports, and site geometry satisfy PWD engineering quality specifications for Milestone ${m.sequence}: ${m.title}. Verified.`
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officialNotes.trim()) {
      setErrorMsg('Please enter official inspection findings and decision justification.');
      return;
    }

    if (!latestEvidence && decision === 'APPROVED') {
      setErrorMsg('Cannot approve milestone: contractor progress evidence has not been submitted.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const result = await apiClient.submitInspection({
        projectId: currentProject.id,
        milestoneId: activeMilestone.id,
        evidenceId: latestEvidence?.id || '',
        decision,
        officialNotes,
      });

      setJustCompletedInspection(result.inspection);
      setCurrentProject(result.project);
      if (Array.isArray(result.project.evidence)) {
        setProjectEvidence(result.project.evidence);
      }

      onSuccess(result.inspection, result.project);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit official inspection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVerified = activeMilestone.status === 'VERIFIED' || justCompletedInspection?.decision === 'APPROVED';
  const isExecutionActive = isProjectInInspectionStage(currentProject);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">
                  {t('evidenceCockpitTitle') || 'Official Evidence Inspection & Quality Certification'}
                </h3>
                <ProvenanceBadge type="OFFICIAL_DECISION" />
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                AI assists with divergence analysis; humans make final legally consequential quality certification.
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

        {/* Milestone Selector Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-600" />
              {t('civilMilestones') || 'Civil Milestones'} ({currentProject.milestones.length})
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Project: <strong className="text-slate-800">{currentProject.id}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {currentProject.milestones.map((m) => {
              const isSelected = m.id === activeMilestone.id;
              const isMVerified = m.status === 'VERIFIED';
              const isDelayed = m.status === 'DELAYED' || m.status === 'REWORK_REQUIRED';
              const isUnderReview = m.status === 'UNDER_REVIEW';

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleMilestoneSwitch(m)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 border cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-emerald-400/40'
                      : isMVerified
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                      : isDelayed
                      ? 'bg-red-50 text-red-900 border-red-200 hover:bg-red-100'
                      : isUnderReview
                      ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-75">M{m.sequence}</span>
                  <span className="truncate max-w-[120px]">{m.title}</span>
                  {isMVerified && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                  {isDelayed && <RotateCcw className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                  {isUnderReview && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Milestone Context Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase font-bold text-slate-500">
                Phase {activeMilestone.sequence} • {activeMilestone.id}
              </span>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                  isVerified
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : activeMilestone.status === 'DELAYED' || activeMilestone.status === 'REWORK_REQUIRED'
                    ? 'bg-red-100 text-red-800 border-red-300'
                    : activeMilestone.status === 'UNDER_REVIEW'
                    ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                    : 'bg-blue-100 text-blue-800 border-blue-300'
                }`}
              >
                {isVerified ? 'VERIFIED ✓' : activeMilestone.status}
              </span>
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{activeMilestone.title}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{activeMilestone.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-900 rounded-md font-bold">
              Progress Claim: {latestEvidence ? latestEvidence.claimedProgress : activeMilestone.completionPercentageClaimed || 0}% Complete
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[55vh] overflow-y-auto">
          {/* If early lifecycle stage, show strict warning banner */}
          {!isExecutionActive && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-amber-950">
              <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <h4 className="font-extrabold text-amber-900">
                  Inspection Locked: Project in Stage &ldquo;{currentProject.status}&rdquo;
                </h4>
                <p className="text-amber-800 leading-relaxed">
                  Official inspections and milestone certifications are restricted to active execution stages following Work Order issuance. You may view project details in read-only mode, but inspection submissions are locked.
                </p>
              </div>
            </div>
          )}

          {/* If already verified or just completed, show celebration banner */}
          {isVerified && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 text-emerald-950">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-900">
                    Milestone Certified & Officially Verified
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Official quality inspection passed and logged to the public audit trail. Completed on:{' '}
                    <strong>{activeMilestone.completedDate || new Date().toISOString().split('T')[0]}</strong>.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 bg-emerald-200/80 rounded-lg text-emerald-900">
                100% VERIFIED
              </span>
            </div>
          )}

          {/* Contractor Submission Evidence & Actual Media */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <HardHat className="w-4 h-4 text-amber-600" />
                {t('contractorSubmissionMedia') || 'Contractor Submission & Media Records'}
                {matchingEvidenceList.length > 0 && (
                  <span className="px-2 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                    {matchingEvidenceList.length} {matchingEvidenceList.length === 1 ? 'submission' : 'submissions'}
                  </span>
                )}
              </h4>
              <ProvenanceBadge type="CONTRACTOR_SUBMISSION" />
            </div>

            {matchingEvidenceList.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No contractor progress evidence uploaded yet for this milestone.</p>
                <p className="text-[11px] text-slate-500">
                  The assigned contractor must upload geo-tagged photo evidence and test results before an official inspection can be recorded.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {matchingEvidenceList.map((ev, idx) => {
                  const isReworkSub = ev.status === 'REWORK_SUBMITTED' || (idx > 0);
                  const isLatest = idx === matchingEvidenceList.length - 1;

                  return (
                    <div
                      key={ev.id || idx}
                      className={`p-4 rounded-2xl border transition space-y-3 ${
                        isReworkSub
                          ? 'bg-amber-50/40 border-amber-200'
                          : 'bg-white border-slate-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isReworkSub
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}>
                            {isReworkSub ? `Submission #${idx + 1} (Rectification / Rework)` : `Submission #${idx + 1} (Original Evidence)`}
                          </span>
                          {isLatest && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              Active for Review
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{new Date(ev.submittedAt).toLocaleString()}</span>
                        </span>
                      </div>

                      <div className="text-xs text-slate-800 space-y-1">
                        <TranslatedText
                          text={ev.description}
                          originalLanguage="en"
                          className="font-medium text-slate-900 leading-relaxed block"
                        />
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                          <span>Submitted by: <strong className="text-slate-700">{ev.submittedByName || currentProject.contractorName || 'Assigned Contractor'}</strong></span>
                          <span>•</span>
                          <span>Claimed: <strong className="font-mono text-slate-700">{ev.claimedProgress}%</strong></span>
                          {ev.location?.label && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{ev.location.label}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Photo Thumbnails */}
                      {(() => {
                        const mediaPhotos = extractMediaFromEvidence(ev);
                        if (mediaPhotos.length === 0) {
                          return (
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                              <Camera className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>No contractor photographic media submitted with this record.</span>
                            </div>
                          );
                        }
                        return (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Uploaded Site Photographs & Material Verification ({mediaPhotos.length}):</span>
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {mediaPhotos.map((m, mIdx) => (
                                <div
                                  key={mIdx}
                                  onClick={() => setEnlargedPhotoUrl(m.url)}
                                  className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:border-emerald-400 hover:shadow-md transition"
                                >
                                  <img
                                    src={m.url}
                                    alt={m.caption || 'Site execution photo'}
                                    className="w-full h-32 object-cover group-hover:scale-105 transition duration-200"
                                  />
                                  <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <span className="p-1.5 rounded-full bg-slate-900/80 text-white shadow-sm">
                                      <Maximize2 className="w-3.5 h-3.5" />
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-600 p-1.5 truncate bg-white font-mono border-t border-slate-100">
                                    {m.caption || `Site Photo #${mIdx + 1}`}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* AI Verification Callout for this submission */}
                      {ev.aiVerification && (
                        <div
                          className={`p-3 rounded-xl border text-xs ${
                            ev.aiVerification.status === 'POTENTIAL_DISCREPANCY'
                              ? 'bg-amber-50 border-amber-300 text-amber-950'
                              : 'bg-purple-50/70 border-purple-200 text-purple-950'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                              AI Vision Verification Analysis
                            </span>
                            <span
                              className={`px-2 py-0.2 rounded-full font-bold text-[10px] ${
                                ev.aiVerification.status === 'POTENTIAL_DISCREPANCY'
                                  ? 'bg-red-200 text-red-900'
                                  : 'bg-emerald-200 text-emerald-900'
                              }`}
                            >
                              {ev.aiVerification.status} ({Math.round(ev.aiVerification.confidence * 100)}%)
                            </span>
                          </div>
                          <p className="font-semibold mb-1 text-[11px]">{ev.aiVerification.summary}</p>
                          {ev.aiVerification.reasoning && (
                            <p className="text-[11px] text-slate-700 leading-relaxed">
                              {ev.aiVerification.reasoning}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form: Official Inspection Decision (Only active when NOT already verified) */}
          {!isVerified ? (
            <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-100">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Official Inspection Decision for Milestone {activeMilestone.sequence} *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-2.5 p-3.5 rounded-xl border cursor-pointer transition ${
                      decision === 'APPROVED'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-200'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="insp-decision"
                      checked={decision === 'APPROVED'}
                      onChange={() => {
                        setDecision('APPROVED');
                        setOfficialNotes(
                          `Visual inspection, core compaction test reports, and site geometry satisfy PWD engineering quality specifications for Milestone ${activeMilestone.sequence}: ${activeMilestone.title}. Verified.`
                        );
                      }}
                      className="accent-emerald-600 mt-0.5"
                    />
                    <div>
                      <p className="text-xs font-bold">Acceptable / Field Inspection Satisfactory</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Certifies milestone completion and officially transitions phase to VERIFIED
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3.5 rounded-xl border cursor-pointer transition ${
                      decision === 'REWORK_REQUIRED'
                        ? 'bg-red-50 border-red-500 text-red-950 ring-2 ring-red-200'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="insp-decision"
                      checked={decision === 'REWORK_REQUIRED'}
                      onChange={() => {
                        setDecision('REWORK_REQUIRED');
                        setOfficialNotes(
                          `Mandatory Rework Notice for Milestone ${activeMilestone.sequence} (${activeMilestone.title}): Quality inspection reveals deficiency requiring remediation per PWD technical standards.`
                        );
                      }}
                      className="accent-red-600 mt-0.5"
                    />
                    <div>
                      <p className="text-xs font-bold">{t('mandateReworkBtn') || 'Reject & Require Rework'}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Sets milestone to REWORK_REQUIRED; enforces contractor remediation loop
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('officialInspectionFindings') || 'Official Inspection Notes & Directives *'}
                </label>
                <textarea
                  rows={3}
                  value={officialNotes}
                  onChange={(e) => setOfficialNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="Enter official quality inspection findings, compaction test metrics, or remediation instructions..."
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  {t('close') || 'Close'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isExecutionActive}
                  className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                    decision === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isSubmitting ? (
                    <span>Recording Inspection & Verifying...</span>
                  ) : !isExecutionActive ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Inspection Locked (Awaiting Execution)</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {decision === 'APPROVED'
                          ? `Verify & Complete Milestone ${activeMilestone.sequence}`
                          : `Issue Mandatory Rework for Milestone ${activeMilestone.sequence}`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="text-slate-600 font-medium">
                Official quality inspection completed. Milestone is certified in the digital thread.
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Photo Lightbox / Modal */}
      {enlargedPhotoUrl && (
        <div
          onClick={() => setEnlargedPhotoUrl(null)}
          className="fixed inset-0 z-60 bg-slate-950/80 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[85vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-2">
            <button
              onClick={() => setEnlargedPhotoUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={enlargedPhotoUrl}
              alt="Enlarged site evidence"
              className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
