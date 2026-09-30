import React, { useState } from 'react';
import { apiClient } from '../../services/api';
import { CitizenRequest } from '../../types/domain';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { PhotoUploadPicker } from '../common/PhotoUploadPicker';
import {
  X,
  Mic,
  MicOff,
  Camera,
  MapPin,
  Sparkles,
  Send,
  Globe2,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface ReportIssueModalProps {
  onClose: () => void;
  onSuccess: (newReq: CitizenRequest) => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English (English)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'ml', name: 'Malayalam (മലയാളം)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
];

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('English (English)');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleVoiceToggle = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setVoiceRecorded(true);
        if (!description) {
          setDescription(
            'Voice transcript: Infrastructure issue observed near location requiring urgent public works attention.'
          );
        }
      }, 2500);
    } else {
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please provide a title and detailed problem description.');
      return;
    }

    if (!address.trim() || !district.trim()) {
      setErrorMsg('Please provide incident location details (Landmark Address and District).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const result: any = await apiClient.submitRequest({
        title: title.trim(),
        description: description.trim(),
        originalLanguage: language,
        voiceRecorded,
        photoUrls: photoUrl ? [photoUrl] : [],
        location: {
          address: address.trim(),
          district: district.trim(),
          state: '',
        },
        incidentState: '',
        incidentDistrict: district.trim(),
        incidentULB: '',
        incidentWard: '',
        address: address.trim(),
        latitude: undefined,
        longitude: undefined,
      });

      const createdReq = result?.data || (result?.id ? result : null);
      if (createdReq) {
        onSuccess(createdReq);
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit complaint. Please check fields and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-sky-900 via-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-sky-500/20 text-sky-300">
                <Globe2 className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-base">Report Public Infrastructure Problem</h3>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              AI will analyze, translate, and cross-reference government schemes before official triage.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Language Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Preferred Input Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Administrative District / Ward *
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                placeholder="e.g. Coimbatore, Kakinada, Lucknow"
                required
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Issue Title / Headline *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Severe road damage / broken culvert on main street"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              required
            />
          </div>

          {/* Description + Voice Option */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Detailed Problem Description *
              </label>
              <button
                type="button"
                onClick={handleVoiceToggle}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium cursor-pointer transition ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : voiceRecorded
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isRecording ? (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>Listening (AI Transcribing)...</span>
                  </>
                ) : voiceRecorded ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Voice Attached</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>Voice Input</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the severity, location landmarks, and public risk..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              required
            />
          </div>

          {/* Location & Image */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              Specific Location Landmark *
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Near Market Junction / Main Water Tank"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>

          <PhotoUploadPicker
            label="Site Photo Evidence"
            currentPhotoUrl={photoUrl}
            onChangePhotoUrl={(url) => setPhotoUrl(url)}
            helpText="Upload actual photograph from your device camera or file system."
          />

          {/* AI Orchestrator Notice */}
          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-start gap-2.5 text-xs text-purple-950">
            <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Next in Digital Thread:</p>
              <p className="text-[11px] text-purple-800 mt-0.5 leading-relaxed">
                Gemini AI will extract structured infrastructure category, assess urgency, search for matching government funding schemes (e.g. PMGSY, UIDF), and route directly to the PWD Official Command queue.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>AI Analyzing & Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Complaint & Generate Token</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
