import {
  CitizenRequest,
  WorkToken,
  Project,
  ContractorEvidence,
  OfficialInspection,
  CommunityObservation,
  NGOAssignment,
  NGOEvidenceSubmission,
  AuditEvent,
  AppNotification,
  UserSession,
  PolicymakerIntelligenceData,
} from '../types/domain';

let currentUserId = 'admin-001';
let currentAdminId = '';
let currentIsPreview = false;

export function setActiveSession(userId: string, adminId?: string, isPreview: boolean = false) {
  currentUserId = userId;
  currentAdminId = adminId || '';
  currentIsPreview = isPreview;
}

export function setActiveUserId(id: string) {
  currentUserId = id;
}

export function getActiveUserId() {
  return currentUserId;
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-id': currentUserId,
    ...(currentIsPreview ? { 'x-admin-preview': 'true', 'x-actual-admin-id': currentAdminId } : {}),
    ...(options.headers as any),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`Server returned non-JSON response (${res.status} ${res.statusText})`);
  }

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || `Request failed with status ${res.status}`);
  }

  return json.data;
}

export const apiClient = {
  // Sync
  sync: () =>
    request<{
      timestamp: string;
      version: number;
      requests: CitizenRequest[];
      workTokens: WorkToken[];
      projects: Project[];
      evidence: ContractorEvidence[];
      inspections: OfficialInspection[];
      communityObservations: CommunityObservation[];
      ngoAssignments: NGOAssignment[];
      auditEvents: AuditEvent[];
      notifications: AppNotification[];
    }>('/api/sync'),

  // Auth & Identity
  getUsers: () => request<UserSession[]>('/api/auth/users'),
  getMe: () => request<UserSession>('/api/auth/me'),
  login: (payload: { email: string; password?: string; role?: string }) =>
    request<UserSession>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Citizen / Contractor / NGO Self-Registration
  register: (payload: {
    id?: string;
    name: string;
    email: string;
    role: string;
    department?: string;
    organization?: string;
    jurisdiction?: string;
    designation?: string;
    phone?: string;
    password?: string;
    primaryLanguage?: string;
    homeState?: string;
    homeDistrict?: string;
    homeULB?: string;
    homeWard?: string;
    aadhaarNumber?: string;
  }) =>
    request<UserSession>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Administrator Institutional Provisioning (Official / Policymaker ONLY)
  provisionOfficialAccount: (payload: {
    id?: string;
    name: string;
    email: string;
    role: 'OFFICIAL' | 'POLICYMAKER';
    department?: string;
    jurisdiction?: string;
    designation?: string;
    phone?: string;
    password?: string;
    primaryLanguage?: string;
    authorityScope?: string;
  }) =>
    request<UserSession>('/api/admin/provision', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Milestone Verification (Governance Prerequisites Locked)
  verifyMilestone: (projectId: string, milestoneId: string, officialNotes?: string) =>
    request<Project>(`/api/projects/${projectId}/milestones/${milestoneId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ projectId, milestoneId, officialNotes }),
    }),

  // Project Completion Certification (Locked until ALL milestones verified)
  certifyProjectCompletion: (projectId: string, finalNotes?: string) =>
    request<Project>(`/api/projects/${projectId}/certify`, {
      method: 'POST',
      body: JSON.stringify({ projectId, finalNotes }),
    }),

  // Policymaker Sanction Decision (APPROVE | RETURN | REJECT)
  sanctionProject: (projectId: string, payload: {
    decision: 'APPROVE' | 'RETURN' | 'REJECT';
    reason?: string;
    approvedAmount?: number;
  }) =>
    request<Project>(`/api/projects/${projectId}/sanction`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Secure Admin Preview / Persona Switcher
  startAdminPreview: (targetUserId: string) =>
    request<{ session: UserSession; auditId: string }>('/api/auth/admin-preview/start', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    }),

  stopAdminPreview: (currentPreviewUserId?: string) =>
    request<UserSession>('/api/auth/admin-preview/stop', {
      method: 'POST',
      body: JSON.stringify({ currentPreviewUserId }),
    }),

  // Citizen Requests
  submitRequest: async (payload: {
    title: string;
    description: string;
    originalLanguage: string;
    voiceRecorded?: boolean;
    photoUrls?: string[];
    location: {
      address: string;
      district: string;
      state: string;
      pincode?: string;
      lat?: number;
      lng?: number;
    };
    incidentState?: string;
    incidentDistrict?: string;
    incidentULB?: string;
    incidentWard?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  }) => {
    return request<any>('/api/citizen/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getCitizenRequests: () => request<CitizenRequest[]>('/api/citizen/requests'),
  getRequestById: (id: string) => request<CitizenRequest>(`/api/citizen/requests/${id}`),

  // Official Triage & Work Tokens
  getOfficialRequests: () => request<CitizenRequest[]>('/api/official/requests'),
  triageRequest: (payload: {
    requestId: string;
    decision: 'ACCEPT' | 'REJECT';
    notes?: string;
    priority?: string;
  }) =>
    request<CitizenRequest>('/api/official/triage', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createWorkToken: (payload: {
    requestId: string;
    title?: string;
    department?: string;
    jurisdiction?: string;
    priority?: string;
    notes?: string;
  }) =>
    request<WorkToken>('/api/work-tokens', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getWorkTokens: () => request<WorkToken[]>('/api/work-tokens'),
  getWorkTokenById: (id: string) => request<WorkToken>(`/api/work-tokens/${id}`),

  // Projects
  createProject: (payload: {
    workTokenId: string;
    name: string;
    description?: string;
    department?: string;
    district?: string;
    state?: string;
    scopeOfWork?: string;
    allocatedBudget?: number;
    sanctionedBudget?: number;
    targetCompletionDate?: string;
    schemeSource?: string;
    milestones?: any[];
  }) =>
    request<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  syncState: () => request<{
    timestamp: string;
    version: number;
    requests: any[];
    workTokens: any[];
    projects: any[];
    evidence: any[];
    inspections: any[];
    communityObservations: any[];
    ngoAssignments: any[];
    auditEvents: any[];
    notifications: any[];
  }>('/api/sync'),

  getMetrics: () => request<{
    scope: string;
    totalRequests: number;
    pendingRequests: number;
    activeRequests: number;
    activeProjects: number;
    completedProjects: number;
    delayedProjects: number;
    pendingSanctions: number;
    sanctionedProjects: number;
    pendingInspections: number;
    reworkCases: number;
    contractorsCount: number;
    activeContractorsCount: number;
    totalMilestones: number;
    funding: {
      allocated: number;
      sanctioned: number;
      contracted: number;
      expenditure: number;
      remaining: number;
    };
  }>('/api/metrics'),

  getProjects: () => request<Project[]>('/api/projects'),
  getProjectById: (id: string) => request<any>(`/api/projects/${id}`),
  getPublicProjects: () => request<Project[]>('/api/projects'),
  getPublicProjectById: (id: string) => request<any>(`/api/projects/${id}`),

  assignContractor: (payload: {
    projectId: string;
    contractorId: string;
    contractedAmount?: number;
  }) =>
    request<Project>('/api/projects/assign', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  submitTenderQuote: (projectId: string, payload: {
    quotedAmount: number;
    durationDays: number;
    scopeConfirmation: boolean;
    notes?: string;
    supportingInfoUrl?: string;
  }) =>
    request<any>(`/api/projects/${projectId}/tender/quotes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  selectTenderContractor: (projectId: string, quoteId: string, reason?: string) =>
    request<Project>(`/api/projects/${projectId}/select-contractor`, {
      method: 'POST',
      body: JSON.stringify({ quoteId, reason }),
    }),

  startProjectExecution: (projectId: string) =>
    request<Project>('/api/projects/start', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    }),

  completeProject: (projectId: string, finalNotes?: string) =>
    request<Project>('/api/projects/complete', {
      method: 'POST',
      body: JSON.stringify({ projectId, finalNotes }),
    }),

  // Contractor Evidence & Milestones
  submitEvidence: (payload: {
    projectId: string;
    milestoneId: string;
    description: string;
    claimedProgress: number;
    mediaRefs: Array<{
      type: 'photo' | 'document' | 'metric';
      url: string;
      caption: string;
    }>;
    location?: { lat?: number; lng?: number; label: string };
    isRework?: boolean;
  }) =>
    request<ContractorEvidence>('/api/contractor/evidence', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getContractorEvidence: (projectId?: string) =>
    request<ContractorEvidence[]>(
      projectId ? `/api/contractor/evidence?projectId=${encodeURIComponent(projectId)}` : '/api/contractor/evidence'
    ),

  // Official Inspections & Rework
  submitInspection: (payload: {
    projectId: string;
    milestoneId: string;
    evidenceId: string;
    decision: 'APPROVED' | 'REWORK_REQUIRED' | 'REJECTED';
    notes?: string;
    officialNotes?: string;
    reworkInstructions?: string;
    reworkDeadlineDays?: number;
  }) =>
    request<{ inspection: OfficialInspection; project: Project }>('/api/official/inspections', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        officialNotes: payload.officialNotes || payload.notes || '',
      }),
    }),

  requireRework: (
    projectIdOrPayload:
      | string
      | {
          projectId: string;
          milestoneId: string;
          evidenceId?: string;
          notes?: string;
          officialNotes?: string;
          reworkInstructions?: string;
          reworkDeadlineDays?: number;
        },
    milestoneId?: string,
    reason?: string
  ) => {
    if (typeof projectIdOrPayload === 'string') {
      return request<Project>('/api/official/rework/require', {
        method: 'POST',
        body: JSON.stringify({
          projectId: projectIdOrPayload,
          milestoneId,
          reason,
        }),
      });
    }
    return request<OfficialInspection>('/api/official/inspections', {
      method: 'POST',
      body: JSON.stringify({ ...projectIdOrPayload, decision: 'REWORK_REQUIRED' }),
    });
  },

  getOfficialInspections: (projectId?: string) =>
    request<OfficialInspection[]>(
      projectId ? `/api/official/inspections?projectId=${encodeURIComponent(projectId)}` : '/api/official/inspections'
    ),

  // Community Observations
  submitCommunityObservation: (payload: {
    projectId: string;
    description?: string;
    comment?: string;
    photoUrl?: string;
    photoUrls?: string[];
    sentimentRating?: 'EXCELLENT' | 'SATISFACTORY' | 'CONCERN_NOTED' | 'CRITICAL_HAZARD';
    divergenceSignal?: 'PROGRESSING_WELL' | 'WORK_HALTED' | 'POOR_QUALITY' | 'INCOMPLETE';
    locationAddress?: string;
  }) =>
    request<CommunityObservation>('/api/citizen/observations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getCommunityObservations: (projectId?: string) =>
    request<CommunityObservation[]>(
      projectId ? `/api/citizen/observations?projectId=${encodeURIComponent(projectId)}` : '/api/citizen/observations'
    ),

  // NGO Independent Civic Audit & Field Tasks
  getNGOAssignments: () => request<NGOAssignment[]>('/api/ngo/assignments'),
  getNGOAssignmentById: (id: string) => request<NGOAssignment>(`/api/ngo/assignments/${id}`),

  acceptNGOTask: (taskId: string, notes?: string) =>
    request<NGOAssignment>(`/api/ngo/tasks/${taskId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  declineNGOTask: (taskId: string, reason?: string) =>
    request<NGOAssignment>(`/api/ngo/tasks/${taskId}/decline`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  submitNGOEvidence: (payload: {
    assignmentId: string;
    projectId?: string;
    observation: string;
    description: string;
    photos: Array<{ url: string; caption: string }>;
    location: { address: string; lat?: number; lng?: number };
    timestamp?: string;
    groundTruthRating?: 'HIGH_INTEGRITY' | 'MINOR_ISSUES' | 'SEVERE_DISCREPANCY';
  }) =>
    request<{ task: NGOAssignment; submission: NGOEvidenceSubmission }>('/api/ngo/submit-evidence', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  reviewNGOEvidence: (payload: {
    assignmentId: string;
    submissionId: string;
    decision: 'ACCEPTED' | 'REQUIRES_CORRECTION' | 'REJECTED';
    notes: string;
  }) =>
    request<NGOAssignment>('/api/official/ngo-reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Policymaker & Macro Intelligence
  getPolicymakerIntelligence: () => request<PolicymakerIntelligenceData>('/api/policymaker/intelligence'),

  queryPolicymaker: (query: string) =>
    request<any>('/api/policymaker/query', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  queryPolicymakerAssistant: (query: string) =>
    request<any>('/api/policymaker/query', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  queryAssistant: (payload: {
    query: string;
    currentRoute: string;
    selectedLanguage: string;
    assistantLanguage?: string;
    conversationHistory?: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
    authorizedRecordId?: string;
  }) => {
    return request<any>('/api/ai/assistant', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getAuditEvents: (entityId?: string) =>
    request<AuditEvent[]>(entityId ? `/api/audit?entityId=${encodeURIComponent(entityId)}` : '/api/audit'),

  // Admin Account Actions
  updateUserStatus: (userId: string, status: string) =>
    request<{ success: boolean; data?: UserSession }>(`/api/admin/users/${userId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),

  logAdminAction: (payload: { action: string; targetUserId: string; targetRole: string }) =>
    request<{ success: boolean }>('/api/admin/audit/log', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Notifications
  getNotifications: () => request<AppNotification[]>('/api/notifications'),
  markNotificationRead: (id: string) => request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'POST' }),

  // System Clean Reset
  resetDatabase: () => request<any>('/api/system/reset', { method: 'POST' }),

  translateText: (text: string, targetLanguage: string) =>
    request<{ text: string; fromCache: boolean }>('/api/ai/translate', {
      method: 'POST',
      body: JSON.stringify({ text, targetLanguage }),
    }),

  // Media & Photo Upload
  uploadPhoto: async (file: File): Promise<{ url: string; filename: string; size: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await request<{ url: string; filename: string; size: number }>('/api/upload', {
            method: 'POST',
            body: JSON.stringify({
              base64Data,
              filename: file.name,
            }),
          });
          resolve(res);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file from disk'));
      reader.readAsDataURL(file);
    });
  },

  uploadPhotoBase64: (base64Data: string, filename?: string) =>
    request<{ url: string; filename: string; size: number }>('/api/upload-base64', {
      method: 'POST',
      body: JSON.stringify({ base64Data, filename }),
    }),
};
