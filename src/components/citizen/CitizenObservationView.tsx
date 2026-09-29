import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { CommunityObservation, Project } from '../../types/domain';
import { useLanguage } from '../../context/LanguageContext';
import {
  ArrowLeft,
  Camera,
  Send,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface CitizenObservationViewProps {
  initialProjectId?: string;
  onBack: () => void;
  onOpenProject: (projectId: string) => void;
}

export const CitizenObservationView: React.FC<CitizenObservationViewProps> = ({
  initialProjectId = '',
  onBack,
  onOpenProject,
}) => {
  const { t } = useLanguage();
  const [projectId, setProjectId] = useState(initialProjectId);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [comment, setComment] = useState('');
  const [photoUrl, setPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80'
  );
  const [divergenceSignal, setDivergenceSignal] = useState<
    'PROGRESSING_WELL' | 'POOR_QUALITY' | 'WORK_HALTED'
  >('POOR_QUALITY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [recentObservations, setRecentObservations] = useState<CommunityObservation[]>([]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const list = await apiClient.getProjects();
        setProjectsList(list);
        if (!projectId && list.length > 0) {
          setProjectId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load project list:', err);
      }
    };
    loadProjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !projectId) return;

    setIsSubmitting(true);
    try {
      const sentiment: 'EXCELLENT' | 'SATISFACTORY' | 'CONCERN_NOTED' | 'CRITICAL_HAZARD' =
        divergenceSignal === 'PROGRESSING_WELL'
          ? 'EXCELLENT'
          : divergenceSignal === 'WORK_HALTED'
          ? 'CRITICAL_HAZARD'
          : 'CONCERN_NOTED';

      const result = await apiClient.submitCommunityObservation({
        projectId,
        description: comment.trim(),
        photoUrls: photoUrl.trim() ? [photoUrl.trim()] : undefined,
        sentimentRating: sentiment,
      });

      setRecentObservations((prev) => [result, ...prev]);
      setComment('');
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to submit observation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h2 className="text-xl font-black text-slate-900">{t('communityFieldObs')}</h2>
            <p className="text-xs text-slate-500">
              {t('communityObsDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* Role Notice Banner */}
      <div className="bg-teal-50 rounded-3xl border border-teal-200 p-5 flex items-start gap-3.5 text-xs text-teal-950 shadow-2xs">
        <Info className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-extrabold text-sm text-teal-900 block">
            {t('publicParticipationTitle')}
          </span>
          <p className="text-teal-800 leading-relaxed text-[11px]">
            {t('publicParticipationDesc')}
          </p>
        </div>
      </div>

      {submitSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">
            {t('observationSuccess')}
          </span>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Target Project Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              {t('selectPublicProject')}
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-teal-500 focus:outline-none transition cursor-pointer font-medium"
            >
              {projectsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} — {p.name} ({p.district})
                </option>
              ))}
            </select>
          </div>

          {/* Divergence Signal Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              {t('groundObservationSignal')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setDivergenceSignal('PROGRESSING_WELL')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  divergenceSignal === 'PROGRESSING_WELL'
                    ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs font-bold text-emerald-800 block">{t('progressingWell')}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">{t('progressingWellDesc')}</span>
              </button>

              <button
                type="button"
                onClick={() => setDivergenceSignal('POOR_QUALITY')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  divergenceSignal === 'POOR_QUALITY'
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs font-bold text-amber-800 block">{t('qualityConcern')}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">{t('qualityConcernDesc')}</span>
              </button>

              <button
                type="button"
                onClick={() => setDivergenceSignal('WORK_HALTED')}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                  divergenceSignal === 'WORK_HALTED'
                    ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-200'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs font-bold text-rose-800 block">{t('workHalted')}</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">{t('workHaltedDesc')}</span>
              </button>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              {t('fieldNoteLabel')}
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('fieldNotePlaceholder')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            />
          </div>

          {/* Photo Attachment */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('photoEvidenceUrl')}</span>
            </label>
            <div className="flex items-center gap-3">
              {photoUrl && photoUrl.trim() ? (
                <img
                  src={photoUrl}
                  alt="Observation Preview"
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                  <Camera className="w-6 h-6" />
                </div>
              )}
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs shadow-md transition transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{t('submitGroundTruthObs')}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Community Eyewitness History */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-slate-900">
          {t('recentEyewitnessObs')}
        </h3>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-800">
                  Citizen Observation
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {t('poorQualitySignal')}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              "Workers dumped loose crushed stones yesterday but left no bitumen or roller. School children are tripping on the unlevel stones when crossing."
            </p>
          </div>

          {recentObservations.map((obs) => (
            <div
              key={obs.id}
              className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/80 space-y-2 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-800">
                    {obs.submittedByName || 'Aravind Swaminathan'}
                  </span>
                  <span className="text-[10px] text-slate-400">{obs.projectId}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  {obs.divergenceSignal === 'POOR_QUALITY'
                    ? t('qualityConcern')
                    : obs.divergenceSignal === 'PROGRESSING_WELL'
                    ? t('progressingWell')
                    : t('workHalted')}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{obs.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
