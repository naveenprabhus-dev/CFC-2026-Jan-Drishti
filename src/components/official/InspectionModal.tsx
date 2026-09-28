import React, { useState } from 'react';
import { Project, Milestone, ContractorEvidence, OfficialInspection } from '../../types/domain';
import { apiClient } from '../../services/api';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { TranslatedText } from '../common/TranslatedText';
import { useLanguage } from '../../context/LanguageContext';
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
} from 'lucide-react';

interface InspectionModalProps {
  project: Project;
  milestone: Milestone;
  evidence: ContractorEvidence;
  communityObservations?: string[];
  onClose: () => void;
  onSuccess: (inspection: OfficialInspection, updatedProject: Project) => void;
}

export const InspectionModal: React.FC<InspectionModalProps> = ({
  project,
  milestone: initialMilestone,
  evidence: initialEvidence,
  communityObservations = [],
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [activeMilestoneId, setActiveMilestoneId] = useState<string>(initialMilestone.id);

  // Find currently active milestone
  const activeMilestone =
    project.milestones.find((m) => m.id === activeMilestoneId) || initialMilestone;

  // Active evidence for current milestone
  const activeEvidence: ContractorEvidence =
    initialEvidence.milestoneId === activeMilestone.id
      ? initialEvidence
      : {
          id: `EV-${project.id}-${activeMilestone.id}`,
          projectId: project.id,
          milestoneId: activeMilestone.id,
          submittedBy: project.contractorId || 'contractor-001',
          submittedByName: project.contractorName || 'Assigned PWD Contractor',
          submittedAt: activeMilestone.completedDate || new Date().toISOString(),
          description: `Contractor site execution photographic verification for milestone ${activeMilestone.sequence}: ${activeMilestone.title}. Core thickness and compaction standards complied per IRC specifications.`,
          mediaRefs: [
            {
              type: 'photo',
              url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
              caption: `On-site execution cross-section photograph for ${activeMilestone.title}.`,
            },
          ],
          claimedProgress: activeMilestone.completionPercentageClaimed || 100,
          location: {
            lat: 13.0827,
            lng: 80.2707,
            label: `${project.district} Construction Site`,
          },
          status: activeMilestone.status === 'VERIFIED' ? 'VERIFIED' : 'SUBMITTED',
          provenance: 'CONTRACTOR_SUBMISSION',
        };

  const aiResult = activeEvidence.aiVerification;
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

  const handleMilestoneSwitch = (m: Milestone) => {
    setActiveMilestoneId(m.id);
    setErrorMsg('');
    if (m.status === 'VERIFIED') {
      setOfficialNotes(`Milestone ${m.sequence} (${m.title}) has already been verified and certified.`);
    } else {
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

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const result = await apiClient.submitInspection({
        projectId: project.id,
        milestoneId: activeMilestone.id,
        evidenceId: activeEvidence.id,
        decision,
        officialNotes,
      });

      onSuccess(result.inspection, result.project);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit official inspection.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              {t('civilMilestones') || 'Civil Milestones'} ({project.milestones.length})
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Project: <strong className="text-slate-800">{project.id}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {project.milestones.map((m) => {
              const isSelected = m.id === activeMilestone.id;
              const isVerified = m.status === 'VERIFIED';
              const isDelayed = m.status === 'DELAYED';
              const isUnderReview = m.status === 'UNDER_REVIEW';

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleMilestoneSwitch(m)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 border cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-emerald-400/40'
                      : isVerified
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
                  {isVerified && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
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
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  activeMilestone.status === 'VERIFIED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : activeMilestone.status === 'DELAYED'
                    ? 'bg-red-100 text-red-800 border-red-300'
                    : activeMilestone.status === 'UNDER_REVIEW'
                    ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                    : 'bg-blue-100 text-blue-800 border-blue-300'
                }`}
              >
                {activeMilestone.status}
              </span>
            </div>
            <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{activeMilestone.title}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{activeMilestone.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-900 rounded-md font-bold">
              Progress Claim: {activeEvidence.claimedProgress}% Complete
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[55vh] overflow-y-auto">
          {/* If already verified, show celebration banner */}
          {activeMilestone.status === 'VERIFIED' && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 text-emerald-950">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-900">
                    Milestone Certified & Verified
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Official inspection passed and logged to public audit trail. Completed: {activeMilestone.completedDate || 'Certified'}.
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 bg-emerald-200/80 rounded-lg text-emerald-900">
                100% APPROVED
              </span>
            </div>
          )}

          {/* Contractor Submission Evidence */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <HardHat className="w-4 h-4 text-amber-600" />
                {t('contractorSubmissionMedia') || 'Contractor Submission & Media Records'}
              </h4>
              <ProvenanceBadge type="CONTRACTOR_SUBMISSION" />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 mb-3">
              <TranslatedText
                text={activeEvidence.description}
                originalLanguage="en"
                className="font-medium text-slate-900"
              />
              <p className="text-[11px] text-slate-500 mt-2">
                Submitted by <strong>{activeEvidence.submittedByName}</strong> on{' '}
                {new Date(activeEvidence.submittedAt).toLocaleString()}
              </p>
            </div>

            {activeEvidence.mediaRefs &&
              activeEvidence.mediaRefs.filter((m) => Boolean(m.url && m.url.trim())).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeEvidence.mediaRefs
                    .filter((m) => Boolean(m.url && m.url.trim()))
                    .map((m, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                      >
                        <img
                          src={m.url}
                          alt="Evidence photo"
                          className="w-full h-36 object-cover"
                        />
                        <p className="text-[10px] text-slate-600 p-2 text-center bg-white font-mono">
                          {m.caption}
                        </p>
                      </div>
                    ))}
                </div>
              )}
          </div>

          {/* AI Evidence Verification Comparison */}
          {aiResult && (
            <div
              className={`p-4 rounded-xl border text-xs ${
                aiResult.status === 'POTENTIAL_DISCREPANCY'
                  ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                  : 'bg-purple-50/80 border-purple-200 text-purple-950'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="font-bold uppercase tracking-wider text-xs">
                    AI Evidence Comparison & Divergence Intelligence
                  </span>
                </div>
                <ProvenanceBadge type="AI_ANALYSIS" modelOrSource={aiResult.modelUsed} />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                    aiResult.status === 'POTENTIAL_DISCREPANCY'
                      ? 'bg-red-200 text-red-900 border border-red-300'
                      : 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                  }`}
                >
                  {aiResult.status} ({Math.round(aiResult.confidence * 100)}% Confidence)
                </span>
              </div>

              <p className="font-bold text-slate-900 mb-2">{aiResult.summary}</p>

              {aiResult.observations && aiResult.observations.length > 0 && (
                <div className="space-y-1 mb-2">
                  <span className="font-bold text-slate-800 block text-[11px]">
                    Key Observations:
                  </span>
                  {aiResult.observations.map((obs, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-slate-700 text-[11px]">
                      <span className="text-slate-400">•</span>
                      <span>{obs}</span>
                    </div>
                  ))}
                </div>
              )}

              {aiResult.divergenceFlags && aiResult.divergenceFlags.length > 0 && (
                <div className="p-2 bg-red-100/70 border border-red-200 rounded-lg text-red-900 text-[11px]">
                  <strong className="block mb-0.5">Divergence Flags Detected:</strong>
                  {aiResult.divergenceFlags.join(' • ')}
                </div>
              )}
            </div>
          )}

          {/* Form: Official Inspection Decision */}
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
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
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
                    <p className="text-xs font-bold">{t('approveMilestoneBtn') || 'Approve & Verify Milestone'}</p>
                    <p className="text-[10px] text-slate-500">
                      Clears milestone to VERIFIED; unlocks next phase execution
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
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
                    <p className="text-[10px] text-slate-500">
                      Sets milestone to DELAYED; enforces rework loop on Contractor
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
                disabled={isSubmitting}
                className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer ${
                  decision === 'APPROVED'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSubmitting ? (
                  <span>Recording Inspection...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {decision === 'APPROVED'
                        ? `${t('approveMilestoneBtn') || 'Certify & Approve'} Milestone ${activeMilestone.sequence}`
                        : `${t('mandateReworkBtn') || 'Issue Mandatory Rework'} Milestone ${activeMilestone.sequence}`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
