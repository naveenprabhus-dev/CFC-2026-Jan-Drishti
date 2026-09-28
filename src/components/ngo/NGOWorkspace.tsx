import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import { NGOAssignment, NGOEvidenceSubmission } from '../../types/domain';
import { PhotoUploadPicker } from '../common/PhotoUploadPicker';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Send,
  Eye,
  RefreshCw,
  FileCheck2,
  MapPin,
  Sparkles,
  Shield,
  ShieldAlert,
  ClipboardList,
  Calendar,
  ArrowRight,
  Camera,
  Check,
  X,
  ChevronRight,
  Info,
  UserCheck,
  FileText,
  ExternalLink,
  Layers,
  Flag,
  Navigation,
  Clock,
  Compass,
} from 'lucide-react';

interface NGOWorkspaceProps {
  onOpenProject: (projectId: string) => void;
}

type TabType =
  | 'ASSIGNMENTS'
  | 'AVAILABLE_TASKS'
  | 'ACTIVE_TASKS'
  | 'EVIDENCE'
  | 'VERIFICATION'
  | 'COMPLETION'
  | 'PROFILE';

export const NGOWorkspace: React.FC<NGOWorkspaceProps> = ({ onOpenProject }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('ASSIGNMENTS');
  const [assignments, setAssignments] = useState<NGOAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Evidence Submission Form State
  const [selectedTaskForEvidence, setSelectedTaskForEvidence] = useState<NGOAssignment | null>(null);
  const [evidenceObservation, setEvidenceObservation] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidencePhotoUrl, setEvidencePhotoUrl] = useState(
    'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f9?w=800&auto=format&fit=crop&q=80'
  );
  const [evidencePhotoCaption, setEvidencePhotoCaption] = useState('Ground condition photographic record');
  const [evidenceAddress, setEvidenceAddress] = useState('');
  const [evidenceLat, setEvidenceLat] = useState('13.0067');
  const [evidenceLng, setEvidenceLng] = useState('80.2575');
  const [groundTruthRating, setGroundTruthRating] = useState<
    'HIGH_INTEGRITY' | 'MINOR_ISSUES' | 'SEVERE_DISCREPANCY'
  >('MINOR_ISSUES');
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    success: boolean;
    message: string;
    aiSummary?: string;
  } | null>(null);

  // Detail Modal / Inspector
  const [viewingAssignment, setViewingAssignment] = useState<NGOAssignment | null>(null);

  // Decline Dialog
  const [decliningTaskId, setDecliningTaskId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('Geographic boundary mismatch / Auditor allocation constraint');
  const [isDeclining, setIsDeclining] = useState(false);

  // Fetch Assignments from API
  const fetchAssignments = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getNGOAssignments();
      setAssignments(data);
    } catch (err) {
      console.error('Failed to load NGO assignments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [currentUser?.id]);

  useEffect(() => {
    const handleCfcNavigate = (e: any) => {
      const target = e.detail;
      if (target === 'NGO_ASSIGNMENTS') setActiveTab('ASSIGNMENTS');
      else if (target === 'NGO_AVAILABLE_TASKS') setActiveTab('AVAILABLE_TASKS');
      else if (target === 'NGO_ACTIVE_TASKS') setActiveTab('ACTIVE_TASKS');
      else if (target === 'NGO_EVIDENCE') setActiveTab('EVIDENCE');
      else if (target === 'NGO_VERIFICATION') setActiveTab('VERIFICATION');
      else if (target === 'NGO_PROFILE') setActiveTab('PROFILE');
    };

    window.addEventListener('cfc-navigate', handleCfcNavigate);
    return () => {
      window.removeEventListener('cfc-navigate', handleCfcNavigate);
    };
  }, []);

  // Sync default task for evidence form
  useEffect(() => {
    if (!selectedTaskForEvidence && assignments.length > 0) {
      const activeOne = assignments.find((a) => a.status === 'ACCEPTED' || a.status === 'IN_OBSERVATION') || assignments[0];
      setSelectedTaskForEvidence(activeOne);
      if (activeOne.location) {
        setEvidenceAddress(activeOne.location.address);
        setEvidenceLat(String(activeOne.location.lat || '13.0067'));
        setEvidenceLng(String(activeOne.location.lng || '80.2575'));
      }
    }
  }, [assignments]);

  const handleSelectTaskForEvidence = (task: NGOAssignment) => {
    setSelectedTaskForEvidence(task);
    if (task.location) {
      setEvidenceAddress(task.location.address);
      setEvidenceLat(String(task.location.lat || '13.0067'));
      setEvidenceLng(String(task.location.lng || '80.2575'));
    }
    setActiveTab('EVIDENCE');
  };

  // Accept Task Handler
  const handleAcceptTask = async (taskId: string) => {
    try {
      await apiClient.acceptNGOTask(taskId);
      await fetchAssignments();
      setSubmissionFeedback({
        success: true,
        message: `Task ${taskId} accepted! It is now active under your field inspection schedule.`,
      });
      setTimeout(() => setSubmissionFeedback(null), 4000);
    } catch (err: any) {
      setSubmissionFeedback({
        success: false,
        message: err.message || 'Failed to accept task.',
      });
      setTimeout(() => setSubmissionFeedback(null), 4000);
    }
  };

  // Decline Task Handler
  const handleConfirmDecline = async () => {
    if (!decliningTaskId) return;
    setIsDeclining(true);
    try {
      await apiClient.declineNGOTask(decliningTaskId, declineReason);
      setDecliningTaskId(null);
      await fetchAssignments();
      setSubmissionFeedback({
        success: true,
        message: `Task ${decliningTaskId} has been declined and returned to the district assignment registry.`,
      });
      setTimeout(() => setSubmissionFeedback(null), 4000);
    } catch (err: any) {
      setSubmissionFeedback({
        success: false,
        message: err.message || 'Failed to decline task.',
      });
      setTimeout(() => setSubmissionFeedback(null), 4000);
    } finally {
      setIsDeclining(false);
    }
  };

  // Submit Evidence Handler
  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForEvidence || !evidenceObservation.trim() || !evidenceDescription.trim()) return;

    setIsSubmittingEvidence(true);
    try {
      const res = await apiClient.submitNGOEvidence({
        assignmentId: selectedTaskForEvidence.id,
        observation: evidenceObservation.trim(),
        description: evidenceDescription.trim(),
        photos: [
          {
            url: evidencePhotoUrl.trim(),
            caption: evidencePhotoCaption.trim() || 'Independent Field Audit Photography',
          },
        ],
        location: {
          address: evidenceAddress.trim() || selectedTaskForEvidence.location?.address || 'Site Area',
          lat: parseFloat(evidenceLat) || 13.0067,
          lng: parseFloat(evidenceLng) || 80.2575,
        },
        timestamp: new Date().toISOString(),
        groundTruthRating,
      });

      setSubmissionFeedback({
        success: true,
        message: `Evidence successfully submitted for ${selectedTaskForEvidence.id}! AI triage analysis generated. Official inspection queued.`,
        aiSummary: res.submission.aiAnalysis?.summary,
      });

      // Clear form
      setEvidenceObservation('');
      setEvidenceDescription('');
      await fetchAssignments();
      setActiveTab('VERIFICATION');
    } catch (err: any) {
      console.error('Failed to submit NGO evidence:', err);
      setSubmissionFeedback({
        success: false,
        message: err.message || 'Failed to submit evidence.',
      });
      setTimeout(() => setSubmissionFeedback(null), 4000);
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  // Filtered lists for tabs
  const availableTasks = assignments.filter((a) => a.status === 'AVAILABLE');
  const activeTasks = assignments.filter((a) => a.status === 'ACCEPTED' || a.status === 'IN_OBSERVATION');
  const submittedTasks = assignments.filter(
    (a) =>
      a.status === 'SUBMITTED' ||
      a.status === 'UNDER_REVIEW' ||
      a.status === 'REPORT_SUBMITTED' ||
      (a.evidenceSubmissions && a.evidenceSubmissions.length > 0)
  );

  // Count metrics for quick-stats
  const totalAssignedCount = assignments.length;
  const availableCount = availableTasks.length;
  const activeCount = activeTasks.length;
  const underReviewCount = assignments.filter(
    (a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW' || a.status === 'REPORT_SUBMITTED'
  ).length;
  const completedCount = assignments.filter((a) => a.status === 'COMPLETED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* NGO Banner & Operational Identity */}
      <div className="bg-linear-to-r from-teal-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-teal-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider bg-teal-500/20 text-teal-300 px-3 py-1 rounded-full border border-teal-400/30">
                Civic Society Field Monitor
              </span>
              <span className="text-slate-400 text-xs">|</span>
              <span className="text-xs font-mono text-slate-300">
                {currentUser?.organization || 'Civic Watch Foundation'}
              </span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30 font-mono">
                ID: {currentUser?.id || 'ngo-01'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Independent Civic Audit Workspace</span>
            </h1>

            <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
              <strong className="text-teal-200">"What assignments can I work on?"</strong> Discover government-authorized civic audits, accept field tasks, document ground truth evidence with geo-coordinates, and monitor official verifications.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={fetchAssignments}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition backdrop-blur-xs cursor-pointer border border-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Operational Stats Counter */}
        <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[11px] text-slate-300 font-bold block">Total Work Items</span>
            <span className="text-xl font-black text-white">{totalAssignedCount}</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[11px] text-teal-300 font-bold block">Available Tasks</span>
            <span className="text-xl font-black text-teal-400">{availableCount}</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[11px] text-amber-300 font-bold block">Active In Field</span>
            <span className="text-xl font-black text-amber-400">{activeCount}</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-[11px] text-indigo-300 font-bold block">Under Review</span>
            <span className="text-xl font-black text-indigo-300">{underReviewCount}</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-emerald-300 font-bold block">Completed Audits</span>
            <span className="text-xl font-black text-emerald-400">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {submissionFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-start justify-between gap-3 shadow-xs animate-in fade-in duration-300 ${
            submissionFeedback.success
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {submissionFeedback.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{submissionFeedback.message}</p>
              {submissionFeedback.aiSummary && (
                <p className="mt-1 text-slate-700 bg-white/70 p-2 rounded-lg border border-emerald-200 font-mono text-[11px]">
                  <strong>AI Preliminary Analysis:</strong> {submissionFeedback.aiSummary}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setSubmissionFeedback(null)}
            className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-bold scrollbar-none">
        <button
          onClick={() => setActiveTab('ASSIGNMENTS')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'ASSIGNMENTS'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Assignments</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'ASSIGNMENTS' ? 'bg-teal-800 text-teal-100' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {assignments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('AVAILABLE_TASKS')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'AVAILABLE_TASKS'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Available Tasks</span>
          {availableCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-500 text-white font-mono animate-pulse">
              {availableCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ACTIVE_TASKS')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'ACTIVE_TASKS'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Active Tasks</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'ACTIVE_TASKS' ? 'bg-teal-800 text-teal-100' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {activeCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('EVIDENCE')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'EVIDENCE'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Submit Evidence</span>
        </button>

        <button
          onClick={() => setActiveTab('VERIFICATION')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'VERIFICATION'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Verification & AI</span>
        </button>

        <button
          onClick={() => setActiveTab('COMPLETION')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'COMPLETION'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Completion</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'COMPLETION' ? 'bg-teal-800 text-teal-100' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {completedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'PROFILE'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>NGO Profile</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. ASSIGNMENTS TAB                                             */}
      {/* ============================================================== */}
      {activeTab === 'ASSIGNMENTS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">Government-Assigned NGO Work</h2>
              <p className="text-slate-500 text-xs">
                Civil society monitoring tasks officially sanctioned by the Department of Public Works and Urban Governance.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded-lg text-slate-700">
              Showing {assignments.length} assignments
            </span>
          </div>

          {assignments.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No Assignments Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No civic audit assignments have been published for this jurisdiction currently.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {assignments.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-teal-300 transition shadow-xs space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                          {task.id}
                        </span>
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          Project: {task.projectId}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                            task.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : task.status === 'UNDER_REVIEW' || task.status === 'REPORT_SUBMITTED'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : task.status === 'ACCEPTED' || task.status === 'IN_OBSERVATION'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-teal-50 text-teal-800 border-teal-200'
                          }`}
                        >
                          {task.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">{task.projectName}</h3>
                    </div>

                    <div className="text-right text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 font-bold justify-end">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Deadline: {task.deadline || '2026-10-15'}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">Assigned by: {task.assignedBy}</span>
                    </div>
                  </div>

                  {/* Location & Purpose */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/60 text-xs space-y-1">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-teal-600" />
                        Location
                      </span>
                      <p className="font-medium text-slate-800">
                        {task.location?.address || 'Site Area'}
                      </p>
                      <p className="text-slate-500 text-[11px] font-mono">
                        {task.location?.district}, Tamil Nadu • ({task.location?.lat || '13.0067'}, {task.location?.lng || '80.2575'})
                      </p>
                    </div>

                    <div className="p-3 bg-teal-50/40 rounded-xl border border-teal-200/50 text-xs space-y-1">
                      <span className="font-bold text-teal-700 uppercase tracking-wider text-[10px] flex items-center gap-1">
                        <Info className="w-3 h-3 text-teal-600" />
                        Purpose of Civic Audit
                      </span>
                      <p className="font-medium text-slate-800 leading-snug">
                        {task.purpose || task.taskScope}
                      </p>
                    </div>
                  </div>

                  {/* Required Evidence Checklist */}
                  <div className="text-xs space-y-1.5">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                      Required Evidence:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(task.requiredEvidence && task.requiredEvidence.length > 0
                        ? task.requiredEvidence
                        : ['Geotagged site photograph', 'Barricade safety check', 'Pedestrian hazard observation']
                      ).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[11px] flex items-center gap-1.5 font-medium"
                        >
                          <Check className="w-3 h-3 text-teal-600 shrink-0" />
                          <span>{item}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <button
                      onClick={() => onOpenProject(task.projectId)}
                      className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-900 font-bold transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Public Project Record ({task.projectId})</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewingAssignment(task)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                      >
                        View Full Details
                      </button>

                      {task.status === 'AVAILABLE' ? (
                        <button
                          onClick={() => handleAcceptTask(task.id)}
                          className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept Assignment</span>
                        </button>
                      ) : task.status === 'COMPLETED' ? (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Audit Completed & Certified</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSelectTaskForEvidence(task)}
                          className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Submit Field Evidence</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. AVAILABLE TASKS TAB                                         */}
      {/* ============================================================== */}
      {activeTab === 'AVAILABLE_TASKS' && (
        <div className="space-y-5">
          <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-5 text-xs text-teal-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-teal-900 text-sm">
              <Shield className="w-4 h-4 text-teal-700" />
              <span>Government-Sanctioned Civic Audit Registry</span>
            </div>
            <p className="leading-relaxed">
              These assignments have been formally designated for independent citizen observation by the district authority. Your organization is authorized to accept or decline based on auditor field availability.
            </p>
            <div className="p-3 bg-white/80 rounded-xl border border-teal-200 text-[11px] text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                Civil Society Governance Policy: Restricted Projects Protection
              </span>
              <p>
                NGOs are not permitted to self-assign to internal or restricted government infrastructure projects. Only tasks explicitly published by the Public Works Department to civil society appear in this verified queue.
              </p>
            </div>
          </div>

          {availableTasks.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">All Available Tasks Accepted</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                There are no pending unassigned tasks waiting for acceptance. Check your <strong>Active Tasks</strong> tab to view assignments in progress.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {availableTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 hover:border-teal-400 transition"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                          {task.id}
                        </span>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {task.projectId}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                          Open for Acceptance
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">{task.projectName}</h3>
                    </div>

                    <div className="text-right text-xs">
                      <span className="font-bold text-slate-600 block">Deadline: {task.deadline}</span>
                      <span className="text-slate-400 text-[11px] font-mono">Issued by: {task.assignedBy}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-600 uppercase text-[10px]">Purpose:</span>
                    <p className="text-slate-800 leading-relaxed">{task.purpose || task.taskScope}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 space-y-1">
                      <span className="font-bold text-slate-500 uppercase text-[10px]">Location:</span>
                      <p className="text-slate-800 font-medium">{task.location?.address}</p>
                      <p className="text-slate-500 text-[11px] font-mono">
                        Coordinates: {task.location?.lat}, {task.location?.lng}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 space-y-1">
                      <span className="font-bold text-slate-500 uppercase text-[10px]">Required Proofs:</span>
                      <ul className="list-disc list-inside text-slate-700 text-[11px] space-y-0.5">
                        {(task.requiredEvidence || ['Geotagged photos', 'Safety hazard notes']).map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                    <button
                      onClick={() => onOpenProject(task.projectId)}
                      className="text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer"
                    >
                      Examine Project Scope
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDecliningTaskId(task.id)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>

                      <button
                        onClick={() => handleAcceptTask(task.id)}
                        className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept Assignment</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. ACTIVE TASKS TAB                                            */}
      {/* ============================================================== */}
      {activeTab === 'ACTIVE_TASKS' && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-amber-900 text-sm">Active Field Work Assignments</h2>
              <p className="text-amber-800 text-xs mt-0.5">
                Tasks accepted by Civic Watch Foundation ready for site visit, photographic evidence collection, and ground truth logging.
              </p>
            </div>
            <span className="font-bold px-3 py-1 bg-amber-100 text-amber-900 rounded-lg border border-amber-300 font-mono shrink-0">
              {activeTasks.length} Active in Field
            </span>
          </div>

          {activeTasks.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Compass className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No Active Field Tasks</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You have no accepted tasks currently in progress. Go to the <strong>Available Tasks</strong> tab to accept new civic inspection mandates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {activeTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          {task.id}
                        </span>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {task.projectId}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Accepted & Scheduled
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">{task.projectName}</h3>
                    </div>

                    <div className="text-right text-xs">
                      <span className="font-bold text-red-600 block">Due Date: {task.deadline}</span>
                      <span className="text-slate-400 text-[11px]">Field observer dispatched</span>
                    </div>
                  </div>

                  {/* 4 Core NGO Questions Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        What was assigned?
                      </span>
                      <p className="font-semibold text-slate-800 text-xs">{task.taskScope}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Where?
                      </span>
                      <p className="font-semibold text-slate-800 text-xs">{task.location?.address}</p>
                      <span className="font-mono text-[10px] text-slate-500">
                        {task.location?.lat}, {task.location?.lng}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Why?
                      </span>
                      <p className="text-slate-700 text-xs leading-snug">{task.purpose}</p>
                    </div>

                    <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200/70 space-y-1">
                      <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                        What evidence is needed?
                      </span>
                      <p className="text-teal-950 font-medium text-xs">
                        {task.requiredEvidence?.join(', ') || 'Photos & safety barrier verification'}
                      </p>
                    </div>
                  </div>

                  {/* Instructions */}
                  {task.instructions && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-teal-600" />
                        Specific Field Auditor Instructions:
                      </span>
                      <p className="text-slate-700 leading-relaxed pl-5">{task.instructions}</p>
                    </div>
                  )}

                  {/* Next Step & Submit Action */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                      <span className="font-bold">Next Step:</span>
                      <span>Capture photos on site and upload geo-referenced observation log.</span>
                    </div>

                    <button
                      onClick={() => handleSelectTaskForEvidence(task)}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Submit Ground Audit Evidence</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. EVIDENCE SUBMISSION TAB                                     */}
      {/* ============================================================== */}
      {activeTab === 'EVIDENCE' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="font-black text-slate-900 text-lg flex items-center gap-2">
                <Camera className="w-5 h-5 text-teal-600" />
                <span>Field Evidence Submission Console</span>
              </h2>
              <p className="text-slate-500 text-xs mt-1">
                Submit independent ground observations, geotagged photographs, and technical defect assessments to the digital public thread.
              </p>
            </div>

            <form onSubmit={handleSubmitEvidence} className="space-y-5">
              {/* Task Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Associated Field Assignment *
                </label>
                <select
                  value={selectedTaskForEvidence?.id || ''}
                  onChange={(e) => {
                    const found = assignments.find((a) => a.id === e.target.value);
                    if (found) {
                      setSelectedTaskForEvidence(found);
                      if (found.location) {
                        setEvidenceAddress(found.location.address);
                        setEvidenceLat(String(found.location.lat || '13.0067'));
                        setEvidenceLng(String(found.location.lng || '80.2575'));
                      }
                    }
                  }}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
                  required
                >
                  {assignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.id}] {a.projectName} ({a.status})
                    </option>
                  ))}
                </select>
                {selectedTaskForEvidence && (
                  <p className="mt-1 text-[11px] text-teal-700 font-mono">
                    Target Project ID: {selectedTaskForEvidence.projectId} • Scope: {selectedTaskForEvidence.taskScope}
                  </p>
                )}
              </div>

              {/* Observation & Rating */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Field Observation Summary *
                  </label>
                  <input
                    type="text"
                    value={evidenceObservation}
                    onChange={(e) => setEvidenceObservation(e.target.value)}
                    placeholder="e.g. Open excavation 1.8m left unbarricaded near school gate; no safety blinkers."
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Concise summary of verified site conditions and safety standards.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ground Truth Integrity Rating *
                  </label>
                  <select
                    value={groundTruthRating}
                    onChange={(e) => setGroundTruthRating(e.target.value as any)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-bold"
                  >
                    <option value="HIGH_INTEGRITY">High Integrity (Conforms to Scope)</option>
                    <option value="MINOR_ISSUES">Minor Issues (Rectification Recommended)</option>
                    <option value="SEVERE_DISCREPANCY">
                      Severe Discrepancy (Safety Hazard / Misrepresentation)
                    </option>
                  </select>
                </div>
              </div>

              {/* Detailed Technical Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Detailed Description & Physical Measurements *
                </label>
                <textarea
                  rows={4}
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  placeholder="Record full contextual details: measured trench dimensions, aggregate compaction status, worker presence, pedestrian detour safety, public interview statements..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 leading-relaxed"
                  required
                />
              </div>

              {/* Photo & Caption */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <PhotoUploadPicker
                  label="Independent Field Audit Photo Evidence"
                  currentPhotoUrl={evidencePhotoUrl}
                  onChangePhotoUrl={(url) => setEvidencePhotoUrl(url)}
                  presets={[
                    {
                      id: 'ngo-p1',
                      label: 'Ground Excavation & Barricade Check',
                      url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f9?w=800&auto=format&fit=crop&q=80',
                    },
                    {
                      id: 'ngo-p2',
                      label: 'Culvert Outfall Flow Inspection',
                      url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80',
                    },
                    {
                      id: 'ngo-p3',
                      label: 'Finished Bitumen Surface Layer',
                      url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
                    },
                  ]}
                  helpText="Upload actual field inspection photograph from mobile camera or select a preset."
                />

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Photograph Caption & Context
                  </label>
                  <input
                    type="text"
                    value={evidencePhotoCaption}
                    onChange={(e) => setEvidencePhotoCaption(e.target.value)}
                    placeholder="e.g. Unprotected storm drain excavation 15m from school pedestrian entrance"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                    required
                  />
                </div>
              </div>

              {/* Geolocation & Timestamp */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    Site Location & Geotag Validation
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTaskForEvidence?.location) {
                        setEvidenceAddress(selectedTaskForEvidence.location.address);
                        setEvidenceLat(String(selectedTaskForEvidence.location.lat || '13.0067'));
                        setEvidenceLng(String(selectedTaskForEvidence.location.lng || '80.2575'));
                      }
                    }}
                    className="text-[11px] text-teal-700 hover:underline font-bold cursor-pointer"
                  >
                    Auto-Fill Project Coordinates
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Physical Address *</label>
                    <input
                      type="text"
                      value={evidenceAddress}
                      onChange={(e) => setEvidenceAddress(e.target.value)}
                      placeholder="Street, Ward, Landmark..."
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Latitude</label>
                    <input
                      type="text"
                      value={evidenceLat}
                      onChange={(e) => setEvidenceLat(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Longitude</label>
                    <input
                      type="text"
                      value={evidenceLng}
                      onChange={(e) => setEvidenceLng(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono pt-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Submission Timestamp: {new Date().toLocaleString()} (Automated ISO recorded)</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEvidenceObservation('');
                    setEvidenceDescription('');
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Clear Form
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingEvidence}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer flex items-center gap-2"
                >
                  <Send className={`w-4 h-4 ${isSubmittingEvidence ? 'animate-spin' : ''}`} />
                  <span>{isSubmittingEvidence ? 'Submitting & Analyzing...' : 'Certify & Submit Ground Evidence'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. VERIFICATION TAB                                            */}
      {/* ============================================================== */}
      {activeTab === 'VERIFICATION' && (
        <div className="space-y-5">
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 text-xs text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-indigo-900 text-sm">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Submitted Evidence & AI Verification Intelligence</span>
              </div>
              <p className="text-indigo-800 text-xs mt-0.5 leading-relaxed">
                Review automated AI discrepancy extraction and official inspection status. AI analysis is advisory; official human engineers make consequential sanctions.
              </p>
            </div>
            <span className="font-bold px-3 py-1 bg-indigo-100 text-indigo-900 rounded-lg border border-indigo-300 font-mono shrink-0">
              {submittedTasks.length} Submissions Logged
            </span>
          </div>

          {submittedTasks.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No Evidence Submissions Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Once you submit field observations, AI verification analysis and official inspector decisions will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {submittedTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                          {task.id}
                        </span>
                        <span className="font-bold text-slate-900 text-base">{task.projectName}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Project ID: {task.projectId}</p>
                    </div>

                    <span
                      className={`text-xs px-3 py-1 rounded-full font-bold border ${
                        task.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : task.status === 'UNDER_REVIEW'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      Status: {task.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Submissions for this task */}
                  {task.evidenceSubmissions && task.evidenceSubmissions.length > 0 ? (
                    <div className="space-y-4">
                      {task.evidenceSubmissions.map((sub) => (
                        <div
                          key={sub.id}
                          className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200 space-y-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {sub.id}
                              </span>
                              <span className="text-xs text-slate-500 font-mono">
                                {new Date(sub.timestamp).toLocaleString()}
                              </span>
                            </div>

                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                sub.groundTruthRating === 'SEVERE_DISCREPANCY'
                                  ? 'bg-rose-100 text-rose-800'
                                  : sub.groundTruthRating === 'HIGH_INTEGRITY'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              Rating: {sub.groundTruthRating?.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="text-xs space-y-1">
                            <span className="font-bold text-slate-800">Observation:</span>
                            <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                              {sub.observation}
                            </p>
                          </div>

                          {sub.photos && sub.photos.filter((ph) => Boolean(ph.url && ph.url.trim())).length > 0 && (
                            <div className="flex flex-wrap gap-3">
                              {sub.photos.filter((ph) => Boolean(ph.url && ph.url.trim())).map((ph, idx) => (
                                <div key={idx} className="space-y-1">
                                  <img
                                    src={ph.url}
                                    alt={ph.caption}
                                    className="w-40 h-28 object-cover rounded-xl border border-slate-200 shadow-xs"
                                  />
                                  <span className="text-[11px] text-slate-500 block max-w-40 truncate">
                                    {ph.caption}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* AI ANALYSIS BLOCK - Clearly Labeled & Non-Autonomous */}
                          {sub.aiAnalysis && (
                            <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 text-xs space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="font-black text-purple-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                                  <Sparkles className="w-4 h-4 text-purple-600" />
                                  AI Analysis (Advisory Only)
                                </span>
                                <span className="font-mono text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                                  Model: {sub.aiAnalysis.modelUsed.split(' ')[0]} • Confidence: {(sub.aiAnalysis.confidence * 100).toFixed(0)}%
                                </span>
                              </div>

                              <p className="text-slate-800 leading-relaxed font-medium">
                                {sub.aiAnalysis.summary}
                              </p>

                              {sub.aiAnalysis.divergenceFlags && sub.aiAnalysis.divergenceFlags.length > 0 && (
                                <div className="space-y-1">
                                  <span className="font-bold text-purple-900 text-[11px]">Divergence Flags Detected:</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {sub.aiAnalysis.divergenceFlags.map((flag, fIdx) => (
                                      <span
                                        key={fIdx}
                                        className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded-md text-[10px] font-bold flex items-center gap-1"
                                      >
                                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                                        <span>{flag}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="p-2 bg-purple-100/60 rounded-lg text-[10px] text-purple-950 font-medium border border-purple-200/60 leading-tight">
                                <strong>Non-Consequential AI Safeguard:</strong> {sub.aiAnalysis.disclaimer}
                              </div>
                            </div>
                          )}

                          {/* Official Review Status */}
                          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                                <Shield className="w-4 h-4 text-emerald-700" />
                                Official Government Verification (Authoritative)
                              </span>
                              <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md text-[11px]">
                                {sub.officialReview?.status || 'PENDING'}
                              </span>
                            </div>
                            <p className="text-slate-800 font-medium">
                              <strong>Inspector:</strong> {sub.officialReview?.officialName || 'PWD Chief Engineer'}
                            </p>
                            <p className="text-slate-700 leading-relaxed">
                              {sub.officialReview?.notes || 'Queued in government command center for official decision.'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Legacy fallback
                    task.report && (
                      <div className="p-4 bg-teal-50 rounded-xl border border-teal-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-teal-900">Filed Ground Truth Audit:</span>
                          <span className="font-mono font-bold text-red-700">{task.report.groundTruthRating}</span>
                        </div>
                        <p className="text-slate-800 leading-relaxed">{task.report.observationSummary}</p>
                      </div>
                    )
                  )}

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      onClick={() => handleSelectTaskForEvidence(task)}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Submit Additional Evidence</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. COMPLETION TAB                                              */}
      {/* ============================================================== */}
      {activeTab === 'COMPLETION' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h2 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-teal-600" />
              <span>Independent Civic Audit Lifecycle & Completion Pipeline</span>
            </h2>
            <p className="text-slate-500 text-xs">
              Complete end-to-end lifecycle tracking: <strong>Submitted → Under Review → Accepted → Requires Correction → Completed</strong>.
            </p>

            {/* Visual Stage Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Stage 1</span>
                <span className="font-bold text-xs text-slate-800">Submitted</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
                <span className="text-[10px] uppercase font-bold text-indigo-500 block">Stage 2</span>
                <span className="font-bold text-xs text-indigo-800">Under Review</span>
              </div>
              <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-center">
                <span className="text-[10px] uppercase font-bold text-teal-600 block">Stage 3</span>
                <span className="font-bold text-xs text-teal-800">Accepted</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-600 block">Stage 4</span>
                <span className="font-bold text-xs text-amber-800">Requires Correction</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">Stage 5</span>
                <span className="font-bold text-xs text-emerald-800">Completed</span>
              </div>
            </div>
          </div>

          {/* List of Tasks with Completion Lifecycle */}
          <div className="space-y-4">
            {assignments.map((task) => {
              const isCompleted = task.status === 'COMPLETED';
              const isUnderReview = task.status === 'UNDER_REVIEW' || task.status === 'REPORT_SUBMITTED';
              const isAccepted = task.status === 'ACCEPTED' || task.status === 'IN_OBSERVATION';
              const requiresCorrection = task.officialVerification?.status === 'REQUIRES_CORRECTION';

              return (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                          {task.id}
                        </span>
                        <span className="font-bold text-slate-900 text-base">{task.projectName}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Project ID: {task.projectId}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-bold border ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : isUnderReview
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                            : requiresCorrection
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-teal-50 text-teal-800 border-teal-300'
                        }`}
                      >
                        {task.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Progress Pipeline Visualization */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5">
                      <span className={task.evidenceSubmissions?.length ? 'text-teal-700' : ''}>1. Submitted</span>
                      <span className={isUnderReview || isCompleted ? 'text-indigo-700' : ''}>2. Under Review</span>
                      <span className={isAccepted || isCompleted ? 'text-teal-700' : ''}>3. Accepted</span>
                      <span className={requiresCorrection ? 'text-amber-700' : ''}>4. Correction</span>
                      <span className={isCompleted ? 'text-emerald-700 font-extrabold' : ''}>5. Certified Completed</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                      <div
                        className={`h-full ${
                          isCompleted
                            ? 'w-full bg-emerald-500'
                            : isUnderReview
                            ? 'w-2/5 bg-indigo-500'
                            : isAccepted
                            ? 'w-3/5 bg-teal-500'
                            : 'w-1/5 bg-slate-300'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Verification Outcome */}
                  {task.officialVerification && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Official Decision Record:</span>
                        <span className="font-bold text-emerald-700 font-mono">
                          {task.officialVerification.status}
                        </span>
                      </div>
                      <p className="text-slate-600">{task.officialVerification.officialNotes}</p>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                    <button
                      onClick={() => onOpenProject(task.projectId)}
                      className="text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer"
                    >
                      View Public Milestone Ledger
                    </button>

                    {requiresCorrection && (
                      <button
                        onClick={() => handleSelectTaskForEvidence(task)}
                        className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold transition shadow-xs cursor-pointer"
                      >
                        Submit Corrected Audit Evidence
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. NGO PROFILE TAB                                             */}
      {/* ============================================================== */}
      {activeTab === 'PROFILE' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-100 border border-teal-300 flex items-center justify-center text-teal-800 font-black text-xl">
                  CWF
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Civic Watch Foundation</h2>
                  <p className="text-slate-500 text-xs">Independent Citizen Audit & Infrastructure Integrity Network</p>
                  <span className="text-[11px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-bold mt-1 inline-block">
                    Accreditation: #TN-SOC-2021-88419
                  </span>
                </div>
              </div>

              <div className="text-right text-xs space-y-1">
                <span className="font-bold text-slate-800 block">Designation: Independent Citizen Audit Lead</span>
                <span className="text-slate-500 block">User ID: <span className="font-mono font-bold">ngo-01</span></span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-block">
                  Verified Civic Partner
                </span>
              </div>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                  Mandated Authority Scope
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Authorized under State Infrastructure Social Audit Guidelines 2026 to conduct independent third-party field inspections, safety hazard assessments in school and hospital corridors, and file structured ground truth discrepancy findings.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                  Jurisdiction & Coverage
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Central Chennai Infrastructure Circle • Public Works Department Highways Division • Ward 14 Municipal Roadways & Arterial Corridors.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                  Field Auditor Code of Ethics
                </span>
                <ul className="list-disc list-inside text-slate-700 space-y-1 leading-snug">
                  <li>Mandatory on-site physical presence with geotagged timestamp</li>
                  <li>Zero financial interest or contractor affiliation</li>
                  <li>Strict non-interference with active engineering operations</li>
                  <li>Objective reporting with dual photographic corroboration</li>
                </ul>
              </div>

              <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-200 space-y-2">
                <span className="font-bold text-teal-900 uppercase tracking-wider text-[10px] block">
                  Delegated Circulars & MOU
                </span>
                <p className="text-teal-950 text-xs leading-relaxed">
                  MOU Ref: <strong>PWD/TN/CIVIC-AUDIT/2026/04</strong> between the Chief Engineer, PWD and Civic Watch Foundation for civic quality assurance on urban civil works.
                </p>
                <div className="text-[11px] text-teal-800 font-mono pt-1">
                  Registered Contact: monitor@civicwatch.org • +91 98410 77665
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DECLINE CONFIRMATION MODAL                                     */}
      {/* ============================================================== */}
      {decliningTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-slate-900 font-black text-base">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Decline Civic Audit Assignment</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to decline task <strong className="font-mono text-slate-800">{decliningTaskId}</strong>? The task will be returned to the district civic audit registry for reassignment.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Declining</label>
              <select
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="Geographic boundary mismatch / Auditor allocation constraint">
                  Geographic boundary mismatch / Auditor allocation constraint
                </option>
                <option value="Auditor scheduling capacity full for this week">
                  Auditor scheduling capacity full for this week
                </option>
                <option value="Specialized bridge engineering expertise required">
                  Specialized bridge engineering expertise required
                </option>
                <option value="Other scheduling constraints">Other scheduling constraints</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setDecliningTaskId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeclining}
                onClick={handleConfirmDecline}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {isDeclining ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ASSIGNMENT FULL DETAIL MODAL                                   */}
      {/* ============================================================== */}
      {viewingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                  {viewingAssignment.id}
                </span>
                <h3 className="font-black text-slate-900 text-base">{viewingAssignment.projectName}</h3>
              </div>
              <button
                onClick={() => setViewingAssignment(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Audit Mandate & Purpose:</span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {viewingAssignment.purpose || viewingAssignment.taskScope}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Location:</span>
                  <p className="text-slate-800">{viewingAssignment.location?.address}</p>
                  <p className="font-mono text-[10px] text-slate-500">
                    {viewingAssignment.location?.lat}, {viewingAssignment.location?.lng}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Audit Deadline:</span>
                  <p className="text-slate-800 font-bold">{viewingAssignment.deadline}</p>
                  <p className="text-[10px] text-slate-500">Assigned by: {viewingAssignment.assignedBy}</p>
                </div>
              </div>

              {viewingAssignment.instructions && (
                <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 text-teal-950 space-y-1">
                  <span className="font-bold text-teal-900 uppercase text-[10px]">Field Auditor Instructions:</span>
                  <p className="leading-relaxed">{viewingAssignment.instructions}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 uppercase text-[10px]">Required Evidence Proofs:</span>
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  {(viewingAssignment.requiredEvidence || []).map((ev, i) => (
                    <li key={i}>{ev}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  onOpenProject(viewingAssignment.projectId);
                  setViewingAssignment(null);
                }}
                className="text-teal-700 hover:text-teal-900 font-bold text-xs underline cursor-pointer"
              >
                Inspect Project Lifecycle ({viewingAssignment.projectId})
              </button>

              <button
                onClick={() => {
                  setViewingAssignment(null);
                  handleSelectTaskForEvidence(viewingAssignment);
                }}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                <span>Go to Submit Evidence</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
