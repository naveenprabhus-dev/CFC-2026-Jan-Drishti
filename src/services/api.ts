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

let currentUserId = 'citizen-01';

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
  // Auth
  getUsers: () => request<UserSession[]>('/api/auth/users'),
  getMe: () => request<UserSession>('/api/auth/me'),
  login: (payload: { email: string; password?: string; role?: string }) =>
    request<UserSession>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  loginDemo: (payload: { userId?: string; role?: string }) =>
    request<UserSession>('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  register: (payload: {
    name: string;
    email: string;
    role: string;
    department?: string;
    organization?: string;
    jurisdiction?: string;
    designation?: string;
    phone?: string;
    password?: string;
  }) =>
    request<UserSession>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
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
  }) => {
    const activeUserId = localStorage.getItem('cfc_active_user_id') || 'cit-chennai-001';
    const res = await fetch('/api/citizen/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': activeUserId,
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to submit request');
    }
    return json as {
      success: boolean;
      existingActionFound: boolean;
      existingAction?: {
        existingProjectId: string;
        existingWorkTokenId: string;
        projectTitle: string;
        status: string;
        department: string;
        contractorName: string;
        nextMilestone: string;
        lastUpdate: string;
        explanation: string;
        aiAnalysis: any;
      };
      data?: CitizenRequest;
    };
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
  }) =>
    request<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getProjects: () => request<Project[]>('/api/projects'),
  getProjectById: (id: string) => request<any>(`/api/projects/${id}`),

  assignContractor: (payload: {
    projectId: string;
    contractorId: string;
    contractedAmount?: number;
  }) =>
    request<Project>('/api/projects/assign', {
      method: 'POST',
      body: JSON.stringify(payload),
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

  // Contractor Evidence
  submitEvidence: (payload: {
    projectId: string;
    milestoneId: string;
    description: string;
    claimedProgress: number;
    mediaRefs?: Array<{ type: 'photo' | 'document' | 'metric'; url: string; caption: string }>;
    location?: { lat?: number; lng?: number; label: string };
    isRework?: boolean;
  }) =>
    request<ContractorEvidence>('/api/contractor/evidence', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Inspections & Rework
  submitInspection: (payload: {
    projectId: string;
    milestoneId: string;
    evidenceId: string;
    decision: 'APPROVED' | 'REWORK_REQUIRED' | 'REJECTED';
    officialNotes: string;
  }) =>
    request<{ inspection: OfficialInspection; project: Project }>('/api/official/inspections', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  requireRework: (projectId: string, milestoneId: string, reason: string) =>
    request<Project>('/api/official/rework/require', {
      method: 'POST',
      body: JSON.stringify({ projectId, milestoneId, reason }),
    }),

  // Transparency
  getPublicProjects: () => request<any[]>('/api/transparency/projects'),
  getPublicProjectById: (id: string) => request<any>(`/api/transparency/projects/${id}`),

  // Community & NGO
  submitCommunityObservation: (payload: {
    projectId: string;
    comment: string;
    photoUrl?: string;
    divergenceSignal?: 'PROGRESSING_WELL' | 'WORK_HALTED' | 'POOR_QUALITY' | 'INCOMPLETE';
  }) =>
    request<CommunityObservation>('/api/community/observations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getNGOAssignments: () => request<NGOAssignment[]>('/api/ngo/assignments'),
  acceptNGOTask: (taskId: string) =>
    request<NGOAssignment>(`/api/ngo/tasks/${taskId}/accept`, {
      method: 'POST',
    }),
  declineNGOTask: (taskId: string, reason?: string) =>
    request<NGOAssignment>(`/api/ngo/tasks/${taskId}/decline`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  submitNGOEvidence: (payload: {
    assignmentId: string;
    observation: string;
    description: string;
    photos?: Array<{ url: string; caption: string }>;
    location?: { address: string; lat?: number; lng?: number };
    timestamp?: string;
    groundTruthRating?: 'HIGH_INTEGRITY' | 'MINOR_ISSUES' | 'SEVERE_DISCREPANCY';
  }) =>
    request<{ task: NGOAssignment; submission: NGOEvidenceSubmission }>('/api/ngo/evidence', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  submitNGOReport: (payload: {
    taskId: string;
    observationSummary: string;
    groundTruthRating: 'HIGH_INTEGRITY' | 'MINOR_ISSUES' | 'SEVERE_DISCREPANCY';
  }) =>
    request<NGOAssignment>('/api/ngo/report', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Policymaker & Audit
  getPolicymakerIntelligence: () => request<PolicymakerIntelligenceData>('/api/policymaker/intelligence'),
  queryPolicymaker: (query: string) =>
    request<{
      answer: string;
      keyInsights: string[];
      recommendedActions: string[];
      citedProjects: string[];
      confidence: number;
      modelUsed: string;
      disclaimer: string;
    }>('/api/policymaker/query', {
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
    const activeUserId = localStorage.getItem('cfc_active_user_id') || 'cit-chennai-001';
    return fetch('/api/ai/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': activeUserId,
      },
      body: JSON.stringify(payload),
    }).then(async (res) => {
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Assistant failed to respond');
      }
      return json.data as {
        text: string;
        actions: Array<{ label: string; target: string }>;
        modelUsed: string;
      };
    });
  },

  getAuditEvents: (entityId?: string) =>
    request<AuditEvent[]>(entityId ? `/api/audit?entityId=${encodeURIComponent(entityId)}` : '/api/audit'),

  // Admin Account Actions
  updateUserStatus: (userId: string, status: string) =>
    request<{ success: boolean }>(`/api/admin/users/${userId}/status`, {
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

  // Reset Demo
  resetDemoDatabase: () => request<any>('/api/system/reset', { method: 'POST' }),

  translateText: (text: string, targetLanguage: string) =>
    request<{ text: string; fromCache: boolean }>('/api/ai/translate', {
      method: 'POST',
      body: JSON.stringify({ text, targetLanguage }),
    }),

  // Media & Photo Upload
  uploadPhoto: async (file: File): Promise<{ url: string; filename: string; size: number }> => {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'x-user-id': currentUserId,
      },
      body: formData,
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error?.message || 'Failed to upload image file');
    }
    return json.data;
  },

  uploadPhotoBase64: (base64Data: string, filename?: string) =>
    request<{ url: string; filename: string; size: number }>('/api/upload-base64', {
      method: 'POST',
      body: JSON.stringify({ base64Data, filename }),
    }),
};
