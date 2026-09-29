import React, { useState } from 'react';
import { Project, Milestone, ContractorEvidence } from '../../types/domain';
import { apiClient } from '../../services/api';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { PhotoUploadPicker } from '../common/PhotoUploadPicker';
import {
  X,
  HardHat,
  Camera,
  Sparkles,
  Upload,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  RotateCcw,
  FileCheck,
  Layers,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface SubmitEvidenceModalProps {
  project: Project;
  milestone: Milestone;
  isRework?: boolean;
  onClose: () => void;
  onSuccess: (evidence: ContractorEvidence) => void;
}

export const SubmitEvidenceModal: React.FC<SubmitEvidenceModalProps> = ({
  project,
  milestone,
  isRework = false,
  onClose,
  onSuccess,
}) => {
  const [claimedProgress, setClaimedProgress] = useState(
    isRework ? 100 : milestone.completionPercentageClaimed > 0 ? milestone.completionPercentageClaimed : 85
  );
  const [description, setDescription] = useState('');
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedResult, setSubmittedResult] = useState<ContractorEvidence | null>(null);

  // Determine project category dynamically to match evidence requirements exactly
  const deptLower = (project.department || '').toLowerCase();
  const nameLower = (project.name || '').toLowerCase();
  const scopeLower = (project.scopeOfWork || '').toLowerCase();

  let category: 'LIGHTING' | 'ROAD' | 'DRAINAGE' | 'WATER_SUPPLY' = 'ROAD';
  if (
    deptLower.includes('light') ||
    deptLower.includes('electr') ||
    nameLower.includes('light') ||
    scopeLower.includes('light') ||
    nameLower.includes('lamp')
  ) {
    category = 'LIGHTING';
  } else if (
    deptLower.includes('drain') ||
    deptLower.includes('sanitat') ||
    deptLower.includes('sewer') ||
    nameLower.includes('drain') ||
    scopeLower.includes('drain') ||
    nameLower.includes('culvert') ||
    scopeLower.includes('culvert')
  ) {
    category = 'DRAINAGE';
  } else if (
    deptLower.includes('water') ||
    nameLower.includes('water') ||
    scopeLower.includes('water') ||
    nameLower.includes('pipe') ||
    scopeLower.includes('pipe')
  ) {
    category = 'WATER_SUPPLY';
  }

  let checklistItems: string[] = [];
  let descriptionLabel = "Technical Execution Description & Test Results *";
  let descriptionHelp = "Include material density, batch specs, IRC standards";
  let descriptionPlaceholder = "Describe works executed, machinery deployed, and compliance test results...";
  let aiAdvisory = "Upon submission, the Gemini vision model will evaluate the cross-section layer thickness, aggregate compaction, and IRC standard adherence. Official certification remains exclusively with the PWD Engineer.";

  if (category === 'LIGHTING') {
    checklistItems = [
      "Photographic evidence of illuminated street lamp/fixture in active operating state (Night/Under-test).",
      "Lux meter readings showing minimum prescribed average illuminance (lux levels).",
      "Electrical continuity & earth resistance safety certificate signed by certified wireman.",
      "Luminaire batch specifications and manufacturer warranty certificate."
    ];
    descriptionLabel = "Electrical Repair & Luminaire Installation Details *";
    descriptionHelp = "Include luminaire wattage, cable testing, earth insulation specs";
    descriptionPlaceholder = "Describe physical repairs made, luminaire specifications installed, wire connections secured, and functional testing results...";
    aiAdvisory = "Upon submission, the Gemini vision model will evaluate the luminaire mounting alignment, active illumination state, and lux sensor patterns. No road compaction tests are required.";
  } else if (category === 'DRAINAGE') {
    checklistItems = [
      "Photographic evidence of cleaned, desilted, or rebuilt drainage/culvert channel.",
      "Hydraulic test report certifying free flow and lack of obstruction.",
      "Silt removal quantity measurement sheet and dump-site disposal receipt.",
      "Structural masonry/RCC compressive strength certificate (for rebuilt walls)."
    ];
    descriptionLabel = "Drainage Desilting & Structural Restoration Details *";
    descriptionHelp = "Include desilt cubic capacity, structural masonry grade, wall thickness";
    descriptionPlaceholder = "Describe desilting quantity removed, masonry repairs done, and hydraulic flow capacity verified...";
    aiAdvisory = "Upon submission, the Gemini vision model will evaluate desilted channel clearance, structural masonry alignment, and free-flowing water signals. No road-compaction test criteria will apply.";
  } else if (category === 'WATER_SUPPLY') {
    checklistItems = [
      "Photographic evidence of repaired pipeline section before backfilling, showing couplers.",
      "Hydrostatic pressure test report (certified at 1.5x working pressure for 2 hours).",
      "Pipe thickness, class (e.g., Class 6 PVC/DI), and joint alignment sheet.",
      "Disinfection, chlorination, and water quality clearance certificate."
    ];
    descriptionLabel = "Water Pipeline Remediation & Hydrostatic Test Details *";
    descriptionHelp = "Include pipeline class/material, hydrostatic pressure (PSI), disinfection records";
    descriptionPlaceholder = "Describe pipeline leak remediation, pressure test results (PSI), joint alignment, and site disinfection...";
    aiAdvisory = "Upon submission, the Gemini vision model will verify joint alignment, high-pressure coupling seals, and water-disinfection clearance. No asphalt compaction tests are required.";
  } else {
    // ROAD
    checklistItems = [
      "Photographic evidence of completed road section with clear wearing course compaction.",
      "Core cutter compaction density test report signed by third-party lab.",
      "CAMBER and cross-section irregularity checks against IRC:SP:11 standards.",
      "Asphalt/Bituminous concrete batch mix plant delivery slip."
    ];
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Please enter an engineering evidence description.');
      return;
    }

    if (!customPhotoUrl.trim()) {
      setErrorMsg('Please upload on-site photographic evidence before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const evidence = await apiClient.submitEvidence({
        projectId: project.id,
        milestoneId: milestone.id,
        description: description.trim(),
        claimedProgress: Number(claimedProgress),
        mediaRefs: [
          {
            type: 'photo',
            url: customPhotoUrl.trim(),
            caption: 'Contractor uploaded on-site construction photo.',
          },
        ],
        location: {
          label: `${project.district || 'Worksite'} Construction Site`,
        },
        isRework,
      });

      setSubmittedResult(evidence);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit evidence.');
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    if (submittedResult) {
      onSuccess(submittedResult);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-linear-to-r from-amber-950 via-slate-900 to-amber-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {isRework ? <RotateCcw className="w-5 h-5" /> : <HardHat className="w-5 h-5" />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base tracking-tight">
                  {isRework ? 'Submit Official Rework Remediation' : 'Submit Milestone Execution Evidence'}
                </h3>
                <ProvenanceBadge type="CONTRACTOR_SUBMISSION" />
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5 font-mono">
                {project.id} • Phase {milestone.sequence}: {milestone.title}
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

        {/* Post-Submission Result Screen */}
        {submittedResult ? (
          <div className="p-6 space-y-6">
            <div className="text-center py-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <h4 className="text-lg font-black text-emerald-950">
                {isRework ? 'Rework Remediation Submitted Successfully' : 'Milestone Evidence Submitted'}
              </h4>
              <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
                Evidence record created and automatically evaluated by Gemini AI verification pipeline. Awaiting official PWD human engineering inspection.
              </p>
            </div>

            {/* Submission Details Summary */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Evidence ID</span>
                  <span className="font-mono font-bold text-slate-900">{submittedResult.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Project ID</span>
                  <span className="font-mono font-bold text-slate-900">{submittedResult.projectId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Claimed Progress</span>
                  <span className="font-mono font-bold text-amber-700">{submittedResult.claimedProgress}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Status</span>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                    {submittedResult.status}
                  </span>
                </div>
              </div>

              {/* AI Verification Analysis */}
              {submittedResult.aiVerification && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                      AI Evidence Analysis
                    </span>
                    <ProvenanceBadge type="AI_ANALYSIS" />
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Consistency Rating:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          submittedResult.aiVerification.status === 'CONSISTENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {submittedResult.aiVerification.status} ({Math.round(submittedResult.aiVerification.confidence * 100)}% confidence)
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      {submittedResult.aiVerification.summary}
                    </p>
                  </div>
                </div>
              )}

              {/* Official Human Governance Note */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 text-blue-900 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block">Next Official Step:</span>
                  <span>
                    PWD Assistant Executive Engineer has been notified to conduct site inspection and authorize milestone certification. AI analysis serves as advisory decision support.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Done & Return to Workspace
              </button>
            </div>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Context Notice */}
            {isRework ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2.5">
                <RotateCcw className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block">Official Remediation Directives:</span>
                  <p className="text-[11px] text-red-800 mt-0.5">
                    {milestone.reworkNotes || project.reworkRequiredMessage || 'Address engineering deficiencies noted by the Official Inspector.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                <span className="font-bold block text-slate-900 mb-0.5">{milestone.title}</span>
                <p className="text-slate-600 text-[11px]">{milestone.description}</p>
              </div>
            )}

            {/* Claimed Progress % Slider */}
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-600" />
                  Claimed Milestone Progress Percentage (%) *
                </label>
                <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  {claimedProgress}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={claimedProgress}
                onChange={(e) => setClaimedProgress(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>10% (Initial prep)</span>
                <span>50% (Structural mid-phase)</span>
                <span>100% (Fully completed)</span>
              </div>
            </div>

            {/* Checklist items based on category */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="block text-xs font-bold text-slate-800 mb-2 uppercase tracking-wide">
                Required Civil Engineering Submissions Checklist
              </span>
              <div className="space-y-2">
                {checklistItems.map((item, idx) => (
                  <label key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                      required
                    />
                    <span className="leading-tight">{item}</span>
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">
                * Note: All checklist items must be physically verified and checked in order to submit execution progress.
              </p>
            </div>

            {/* Technical Description */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                <span>{descriptionLabel}</span>
                <span className="text-[10px] font-normal text-slate-500">{descriptionHelp}</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white text-slate-900 leading-relaxed font-sans"
                placeholder={descriptionPlaceholder}
                required
              />
            </div>

            {/* Photo / Video Evidence Picker */}
            <PhotoUploadPicker
              label="Site Photographic Evidence"
              currentPhotoUrl={customPhotoUrl}
              onChangePhotoUrl={(url) => setCustomPhotoUrl(url)}
              helpText="Upload actual site photograph from your device camera or file."
            />

            {/* Geolocation & Timestamp Anchor */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block text-[11px] text-slate-900">Worksite Location Anchor</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {project.district || 'Worksite'} Construction Location
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{new Date().toLocaleString()}</span>
              </div>
            </div>

            {/* AI Advisory Disclosure */}
            <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl flex items-start gap-2 text-xs text-purple-950">
              <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-[11px] block">AI Visual Inspection Analysis:</span>
                <p className="text-[10px] text-purple-800 leading-relaxed mt-0.5">
                  {aiAdvisory}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Processing AI Analysis & Submitting...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>{isRework ? 'Submit Rework to Inspection Queue' : 'Submit Milestone Evidence'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
