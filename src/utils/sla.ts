import { CitizenRequest, Project } from '../types/domain';

export interface RequestSlaInfo {
  triageDeadline: string;
  isTriageDueSoon: boolean;
  isTriageBreached: boolean;
  triageHoursRemaining: number;
  resolutionDeadline: string;
  isResolutionDueSoon: boolean;
  isResolutionBreached: boolean;
  resolutionDaysRemaining: number;
  statusLabel: 'ON_TRACK' | 'DUE_SOON' | 'BREACHED';
}

export interface ProjectSlaInfo {
  targetDate: string;
  isDueSoon: boolean;
  isBreached: boolean;
  isDelayed: boolean;
  daysRemaining: number;
  statusLabel: 'ON_TRACK' | 'DUE_SOON' | 'BREACHED' | 'REWORK_MANDATED' | 'COMPLETED';
}

/**
 * Deterministic calculation of Citizen Grievance Triage & Resolution SLA
 * Standard Civic Charter:
 * - Official Triage Window: 48 Hours from request creation
 * - Resolution Window: based on AI estimated urgency days (default 14 days)
 */
export function getRequestSlaInfo(request: CitizenRequest): RequestSlaInfo {
  const createdMs = Date.parse(request.createdAt) || Date.now();
  const now = Date.now();

  // Triage SLA (48 Hours)
  const triageWindowMs = 48 * 3600 * 1000;
  const triageDeadlineMs = createdMs + triageWindowMs;
  const triageRemainingMs = triageDeadlineMs - now;
  const triageHoursRemaining = Math.round(triageRemainingMs / (3600 * 1000));

  const isTriaged = request.status !== 'SUBMITTED';
  const isTriageBreached = !isTriaged && triageRemainingMs < 0;
  const isTriageDueSoon = !isTriaged && !isTriageBreached && triageRemainingMs <= 12 * 3600 * 1000;

  // Resolution SLA
  const urgencyDays = request.aiAnalysis?.estimatedUrgencyDays || 14;
  const resolutionWindowMs = urgencyDays * 24 * 3600 * 1000;
  const resolutionDeadlineMs = createdMs + resolutionWindowMs;
  const resolutionRemainingMs = resolutionDeadlineMs - now;
  const resolutionDaysRemaining = Math.round(resolutionRemainingMs / (24 * 3600 * 1000));

  const isCompleted = request.status === 'COMPLETED';
  const isResolutionBreached = !isCompleted && resolutionRemainingMs < 0;
  const isResolutionDueSoon =
    !isCompleted && !isResolutionBreached && resolutionRemainingMs <= 3 * 24 * 3600 * 1000;

  let statusLabel: 'ON_TRACK' | 'DUE_SOON' | 'BREACHED' = 'ON_TRACK';
  if (isTriageBreached || isResolutionBreached) {
    statusLabel = 'BREACHED';
  } else if (isTriageDueSoon || isResolutionDueSoon) {
    statusLabel = 'DUE_SOON';
  }

  return {
    triageDeadline: new Date(triageDeadlineMs).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    isTriageDueSoon,
    isTriageBreached,
    triageHoursRemaining,
    resolutionDeadline: new Date(resolutionDeadlineMs).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
    isResolutionDueSoon,
    isResolutionBreached,
    resolutionDaysRemaining,
    statusLabel,
  };
}

/**
 * Deterministic calculation of Public Civil Project Handover SLA
 */
export function getProjectSlaInfo(project: Project): ProjectSlaInfo {
  const isCompleted = project.status === 'COMPLETED';
  const isDelayed = project.status === 'DELAYED';

  const targetDateMs = Date.parse(project.targetCompletionDate) || Date.now() + 30 * 86400000;
  const now = Date.now();
  const diffDays = Math.round((targetDateMs - now) / (86400 * 1000));

  const isBreached = !isCompleted && targetDateMs < now;
  const isDueSoon = !isCompleted && !isBreached && diffDays <= 7;

  let statusLabel: 'ON_TRACK' | 'DUE_SOON' | 'BREACHED' | 'REWORK_MANDATED' | 'COMPLETED' =
    'ON_TRACK';
  if (isCompleted) {
    statusLabel = 'COMPLETED';
  } else if (isDelayed) {
    statusLabel = 'REWORK_MANDATED';
  } else if (isBreached) {
    statusLabel = 'BREACHED';
  } else if (isDueSoon) {
    statusLabel = 'DUE_SOON';
  }

  return {
    targetDate: new Date(targetDateMs).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    isDueSoon,
    isBreached,
    isDelayed,
    daysRemaining: diffDays,
    statusLabel,
  };
}
