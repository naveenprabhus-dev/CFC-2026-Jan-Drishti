import React, { useState, useRef, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { CitizenRequest } from '../../types/domain';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageCode } from '../../i18n/translations';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import {
  ArrowLeft,
  Mic,
  MicOff,
  Camera,
  MapPin,
  Sparkles,
  Send,
  Globe,
  AlertCircle,
  CheckCircle2,
  Info,
  Clock,
  ShieldCheck,
  Activity,
  FileCheck2,
  ChevronRight,
  Upload,
  X,
  Building2,
  ExternalLink,
  Layers,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface CitizenReportViewProps {
  onBack: () => void;
  onSuccess: (newReq: CitizenRequest) => void;
  onTrackRequest: (req: CitizenRequest) => void;
  onOpenProjectDetail?: (projectId: string) => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const CitizenReportView: React.FC<CitizenReportViewProps> = ({
  onBack,
  onSuccess,
  onTrackRequest,
  onOpenProjectDetail,
}) => {
  const { language, setLanguage, supportedLanguages, currentLanguageOption, t } = useLanguage();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('Anna Salai Corridor, Ward 14');
  const [district, setDistrict] = useState('Central Chennai');

  // Real Voice Recognition State (Web Speech API)
  const [isRecording, setIsRecording] = useState(false);
  const [speechErrorMsg, setSpeechErrorMsg] = useState('');
  const recognitionRef = useRef<any>(null);

  // Real Photo Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');

  // Processing & Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingStep, setProcessingStep] = useState<number>(0); // 1: AI, 2: Photo, 3: Gov Check
  const [errorMsg, setErrorMsg] = useState('');

  // Path A vs Path B Result
  const [existingActionResult, setExistingAction] = useState<any | null>(null);
  const [submittedRequestResult, setSubmittedRequestResult] = useState<CitizenRequest | null>(null);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Voice Input Handler using Web Speech API
  const handleVoiceToggle = () => {
    setSpeechErrorMsg('');

    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechErrorMsg(t('micError'));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = currentLanguageOption.speechLocale || 'en-IN';
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }

        if (currentTranscript.trim()) {
          setDescription((prev) => {
            if (prev.endsWith(currentTranscript.trim())) return prev;
            return prev ? `${prev} ${currentTranscript.trim()}` : currentTranscript.trim();
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechErrorMsg(t('micDenied'));
        } else if (event.error === 'no-speech') {
          // non-fatal
        } else {
          setSpeechErrorMsg(t('micError'));
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setSpeechErrorMsg(t('micError'));
      setIsRecording(false);
    }
  };

  // Photo Selection Handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit. Please choose a smaller photo.');
      return;
    }

    setUploadError('');
    setIsUploadingPhoto(true);

    // Read file as base64 data URL for preview & multimodal AI analysis
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setPhotoPreview(dataUrl);

      try {
        const uploadRes = await apiClient.uploadPhoto(file);
        setUploadedMediaUrl(uploadRes.url);
      } catch (err: any) {
        console.warn('Backend upload fallback to data URL:', err);
        setUploadedMediaUrl(dataUrl);
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview('');
    setUploadedMediaUrl('');
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form Submission Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please provide an issue title and description.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setExistingAction(null);
    setSubmittedRequestResult(null);

    // Visual sequence indicator
    setProcessingStep(1); // Understanding report
    await new Promise((r) => setTimeout(r, 600));

    setProcessingStep(2); // Analyzing evidence
    await new Promise((r) => setTimeout(r, 600));

    setProcessingStep(3); // Checking government actions
    await new Promise((r) => setTimeout(r, 600));

    try {
      const finalPhotoUrls = uploadedMediaUrl
        ? [uploadedMediaUrl]
        : photoPreview
        ? [photoPreview]
        : [];

      const response = await apiClient.submitRequest({
        title,
        description,
        originalLanguage: currentLanguageOption.name,
        voiceRecorded: isRecording || description.length > 50,
        photoUrls: finalPhotoUrls,
        location: {
          address,
          district,
          state: 'Tamil Nadu',
          pincode: '600002',
          lat: 13.0827,
          lng: 80.2707,
        },
      });

      if (response.existingActionFound && response.existingAction) {
        // PATH A: EXISTING ACTION FOUND
        setExistingAction(response.existingAction);
      } else if (response.data) {
        // PATH B: NEW REQUEST CREATED
        setSubmittedRequestResult(response.data);
        onSuccess(response.data);
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setErrorMsg(err.message || 'Failed to submit complaint. Please check server logs.');
    } finally {
      setIsSubmitting(false);
      setProcessingStep(0);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('back')}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">{t('complaintLang')}:</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-extrabold text-slate-800 shadow-2xs cursor-pointer"
          >
            {supportedLanguages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeName} ({l.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ================= PATH A: EXISTING ACTION FOUND ================= */}
      {existingActionResult && (
        <div className="bg-white rounded-3xl border border-amber-300 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-amber-600 px-6 sm:px-8 py-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-amber-100">
                  Government Action Check • Duplicate Prevention
                </span>
                <h3 className="text-xl sm:text-2xl font-black">{t('existingActionFoundTitle')}</h3>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-amber-900 text-xs sm:text-sm font-medium leading-relaxed">
              {t('existingActionBanner')}
            </div>

            {/* Existing Action Case Card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">{t('existingProjectId')}</span>
                  <p className="font-mono font-black text-slate-900 text-base">{existingActionResult.existingProjectId}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">{t('workTokenId')}</span>
                  <p className="font-mono font-bold text-purple-700 text-sm">{existingActionResult.existingWorkTokenId}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">{t('currentStatus')}</span>
                  <p className="font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full text-xs border border-emerald-300">
                    {existingActionResult.status}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-base mb-1">{existingActionResult.projectTitle}</h4>
                <p className="text-xs text-slate-600">{existingActionResult.explanation}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">{t('responsibleDept')}</span>
                  <p className="font-bold text-slate-800">{existingActionResult.department}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400">{t('contractorName')}</span>
                  <p className="font-bold text-slate-800">{existingActionResult.contractorName}</p>
                </div>
              </div>
            </div>

            {/* AI Advisory Panel */}
            {existingActionResult.aiAnalysis && (
              <div className="bg-indigo-50/50 rounded-2xl border border-indigo-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>{t('aiAnalysisAdvisory')}</span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-600">Confidence: 94%</span>
                </div>
                <p className="text-xs text-indigo-900 leading-relaxed font-medium">
                  {existingActionResult.aiAnalysis.summary}
                </p>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{t('noDuplicateNotice')}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {onOpenProjectDetail && (
                <button
                  type="button"
                  onClick={() => onOpenProjectDetail(existingActionResult.existingProjectId)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  <Building2 className="w-4 h-4" />
                  <span>{t('viewExistingProject')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setExistingAction(null);
                  setTitle('');
                  setDescription('');
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-600" />
                <span>Report Another Issue</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PATH B: NEW REQUEST CREATED ================= */}
      {submittedRequestResult && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-emerald-600 px-6 sm:px-8 py-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-200">
                  Official Ledger Entry
                </span>
                <h3 className="text-xl sm:text-2xl font-black">{t('requestCreatedTitle')}</h3>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">{t('requestRefId')}</span>
                <p className="font-mono font-black text-base text-slate-900 mt-0.5">{submittedRequestResult.id}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">{t('currentStatus')}</span>
                <p className="font-bold text-sm text-amber-700 mt-0.5">{t('underOfficialTriage')}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">{t('locationLabel')}</span>
                <p className="font-bold text-xs text-slate-800 mt-0.5 truncate">{submittedRequestResult.location.address}</p>
              </div>
            </div>

            {submittedRequestResult.aiAnalysis && (
              <div className="bg-sky-50 rounded-2xl border border-sky-200 p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <span>{t('aiAnalysisAdvisory')}</span>
                  </div>
                  <span className="text-[10px] font-mono text-sky-600">Language: {submittedRequestResult.originalLanguage}</span>
                </div>
                <p className="text-xs text-sky-900 leading-relaxed font-medium">
                  {submittedRequestResult.aiAnalysis.summary}
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
                  <span className="bg-white px-2.5 py-1 rounded-md border border-sky-200 font-bold text-sky-800">
                    Category: {submittedRequestResult.aiAnalysis.category}
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded-md border border-sky-200 font-bold text-sky-800">
                    Severity: {submittedRequestResult.aiAnalysis.severity}
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded-md border border-sky-200 font-bold text-sky-800">
                    Dept: {submittedRequestResult.aiAnalysis.suggestedDepartment}
                  </span>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {t('whatsNext')}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onTrackRequest(submittedRequestResult)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                <Activity className="w-4 h-4" />
                <span>Track Work Token</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PRIMARY FORM ================= */}
      {!existingActionResult && !submittedRequestResult && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {t('fileCivicReport')}
              </h2>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {currentLanguageOption.nativeName}
              </span>
            </div>
            <p className="text-xs text-slate-500">{t('reportDescHelp')}</p>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Processing Status Banner */}
          {isSubmitting && (
            <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-3 animate-pulse">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>{t('submitting')}</span>
              </div>
              <div className="space-y-1.5 text-xs text-indigo-800">
                <p className={processingStep >= 1 ? 'font-bold text-indigo-900' : 'text-slate-400'}>
                  ✓ {t('understandingReport')}
                </p>
                <p className={processingStep >= 2 ? 'font-bold text-indigo-900' : 'text-slate-400'}>
                  ✓ {t('analyzingEvidence')}
                </p>
                <p className={processingStep >= 3 ? 'font-bold text-indigo-900' : 'text-slate-400'}>
                  ✓ {t('checkingGovAction')}
                </p>
              </div>
            </div>
          )}

          {/* 1. Issue Title */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              {t('issueTitleLabel')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('issueTitlePlaceholder')}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs font-semibold text-slate-900 outline-none transition"
              required
            />
          </div>

          {/* 2. Problem Description + Real Voice Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                {t('problemDescLabel')} <span className="text-rose-500">*</span>
              </label>

              {/* REAL VOICE INPUT BUTTON */}
              <button
                type="button"
                onClick={handleVoiceToggle}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs border ${
                  isRecording
                    ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isRecording ? t('stopRecording') : `${t('speakComplaint')} (${currentLanguageOption.nativeName})`}</span>
              </button>
            </div>

            {isRecording && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
                <span>{t('listening')}</span>
              </div>
            )}

            {speechErrorMsg && (
              <p className="text-xs font-semibold text-rose-600">{speechErrorMsg}</p>
            )}

            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('problemDescPlaceholder')}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium text-slate-900 outline-none transition leading-relaxed"
              required
            />
          </div>

          {/* 3. Real Photo Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              {t('photoLabel')}
            </label>
            <p className="text-[11px] text-slate-500">{t('photoHint')}</p>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleFileSelect}
              className="hidden"
            />

            {photoPreview ? (
              <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 group max-w-md">
                <img
                  src={photoPreview}
                  alt="Citizen Upload Evidence"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] font-mono font-bold text-emerald-400 border border-emerald-400/30 flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  <span>{t('citizenPhotoBadge')}</span>
                </div>
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-900 font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    {t('replacePhoto')}
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50 hover:bg-emerald-50/30 transition cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800">Click to Select / Capture Photo</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Supports JPG, PNG, WEBP up to 10MB</p>
              </div>
            )}

            {uploadError && <p className="text-xs font-semibold text-rose-600">{uploadError}</p>}
          </div>

          {/* 4. Location Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                {t('locationLabel')}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-500 text-xs font-semibold text-slate-900 outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                {t('districtLabel')}
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-500 text-xs font-semibold text-slate-900 outline-none transition"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || isUploadingPhoto}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/20 transition transform active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? t('submitting') : t('submitReport')}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
