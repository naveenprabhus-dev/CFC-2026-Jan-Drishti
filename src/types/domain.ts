export type UserRole =
  | 'CITIZEN'
  | 'OFFICIAL'
  | 'POLICYMAKER'
  | 'CONTRACTOR'
  | 'NGO'
  | 'PUBLIC_VIEWER'
  | 'ADMIN';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  jurisdiction?: string;
  organization?: string;
  designation?: string;
  authorityScope?: string;
  permissions?: string[];
  avatar?: string;
  phone?: string;
  isDemo?: boolean;
  primaryLanguage?: string;
  citizenId?: string;
  maskedAadhaar?: string;
  aadhaarHash?: string;
  identityReference?: string;
  verifiedIdentityStatus?: 'VERIFIED_PROTOTYPE_REF' | 'VERIFIED' | 'PENDING';
  homeState?: string;
  homeDistrict?: string;
  homeULB?: string;
  homeWard?: string;
}

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export type RequestStatus =
  | 'SUBMITTED'
  | 'TRIAGED'
  | 'TOKEN_ISSUED'
  | 'PROJECT_CREATED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED';

export type WorkTokenStatus =
  | 'ACTIVE'
  | 'PROJECT_ATTACHED'
  | 'VERIFICATION_REQUIRED'
  | 'COMPLETED'
  | 'SUSPENDED';

export type ProjectStatus =
  | 'PROPOSED'
  | 'SANCTIONED'
  | 'TENDERED'
  | 'CONTRACTOR_ASSIGNED'
  | 'IN_PROGRESS'
  | 'VERIFICATION_REQUIRED'
  | 'DELAYED'
  | 'COMPLETED'
  | 'SUSPENDED';

export type MilestoneStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'DELAYED';

export type EvidenceVerificationStatus =
  | 'CONSISTENT'
  | 'POTENTIAL_DISCREPANCY'
  | 'INSUFFICIENT_EVIDENCE';

export type InspectionDecision =
  | 'APPROVED'
  | 'REWORK_REQUIRED'
  | 'REJECTED';

export interface AIProblemIntelligence {
  intent: string;
  category: string;
  severity: SeverityLevel;
  safetyRisk?: 'LOW' | 'MEDIUM' | 'HIGH';
  urgencyReason?: string;
  summary: string;
  suggestedDepartment: string;
  estimatedUrgencyDays: number;
  extractedEntities: {
    locationMentioned: string;
    infrastructureType: string;
    impactSummary: string;
  };
  matchedGovernmentSchemes?: Array<{
    schemeName: string;
    code: string;
    description: string;
    relevance: string;
  }>;
  confidence: number;
  modelUsed: string;
  generatedAt: string;
  provenance: 'AI_ANALYSIS';
}

export interface CitizenRequest {
  id: string;
  citizenId: string;
  citizenName: string;
  citizenContact?: string;
  title: string;
  description: string;
  originalLanguage: string;
  voiceRecorded?: boolean;
  photoUrls: string[];
  location: {
    address: string;
    district: string;
    state: string;
    pincode?: string;
    lat?: number;
    lng?: number;
  };
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  aiAnalysis?: AIProblemIntelligence;
  workTokenId?: string;
  projectId?: string;
  rejectionReason?: string;
  triagePriority?: 'NORMAL' | 'HIGH' | 'CRITICAL';
  safetyRisk?: 'LOW' | 'MEDIUM' | 'HIGH';
  routedDepartment?: string;
  routedAuthority?: string;
  urgentAlertSent?: boolean;
}

export interface WorkToken {
  id: string;
  requestId: string;
  projectId?: string;
  title: string;
  department: string;
  jurisdiction: string;
  priority: PriorityLevel;
  status: WorkTokenStatus;
  issuedBy: string;
  issuedByRole: string;
  issuedAt: string;
  digitalThreadSignature: string;
  notes?: string;
}

export interface FundingLedger {
  allocated: number;
  sanctioned: number;
  contracted: number;
  expenditure: number;
  currency: string;
  schemeSource: string;
  budgetHead: string;
  lastAuditDate: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  sequence: number;
  status: MilestoneStatus;
  completionPercentageClaimed: number;
  targetDate: string;
  completedDate?: string;
  verifiedAt?: string;
  reworkNotes?: string;
}

export interface Project {
  id: string;
  workTokenId: string;
  requestId: string;
  name: string;
  description: string;
  department: string;
  district: string;
  state: string;
  sanctionNumber: string;
  status: ProjectStatus;
  contractorId?: string;
  contractorName?: string;
  funding: FundingLedger;
  milestones: Milestone[];
  createdAt: string;
  sanctionedAt?: string;
  assignedAt?: string;
  completedAt?: string;
  scopeOfWork: string;
  targetCompletionDate: string;
  reworkRequiredMessage?: string;
  officialReviewNotes?: string;
}

export interface ContractorEvidence {
  id: string;
  projectId: string;
  milestoneId: string;
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  mediaRefs: Array<{
    type: 'photo' | 'document' | 'metric';
    url: string;
    caption: string;
  }>;
  description: string;
  claimedProgress: number;
  location: {
    lat?: number;
    lng?: number;
    label: string;
  };
  status: 'SUBMITTED' | 'AI_ANALYZED' | 'VERIFIED' | 'REJECTED' | 'REWORK_SUBMITTED';
  reworkNote?: string;
  provenance: 'CONTRACTOR_SUBMISSION';
  aiVerification?: AIEvidenceVerification;
}

export interface AIEvidenceVerification {
  status: EvidenceVerificationStatus;
  confidence: number;
  summary: string;
  observations: string[];
  reasoning: string;
  divergenceFlags: string[];
  modelUsed: string;
  analyzedAt: string;
  provenance: 'AI_ANALYSIS';
}

export interface OfficialInspection {
  id: string;
  projectId: string;
  milestoneId: string;
  evidenceId: string;
  inspectorId: string;
  inspectorName: string;
  decision: InspectionDecision;
  officialNotes: string;
  inspectedAt: string;
  provenance: 'OFFICIAL_HUMAN_DECISION';
}

export interface CommunityObservation {
  id: string;
  projectId: string;
  submittedBy: string;
  submittedByName: string;
  comment: string;
  photoUrl?: string;
  timestamp: string;
  divergenceSignal?: 'PROGRESSING_WELL' | 'WORK_HALTED' | 'POOR_QUALITY' | 'INCOMPLETE';
  provenance: 'COMMUNITY_VERIFICATION';
}

export type NGOAssignmentStatus =
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_OBSERVATION'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'REQUIRES_CORRECTION'
  | 'COMPLETED'
  | 'DECLINED'
  | 'REPORT_SUBMITTED';

export interface NGOEvidenceSubmission {
  id: string;
  assignmentId: string;
  projectId: string;
  observation: string;
  description: string;
  photos: Array<{
    url: string;
    caption: string;
  }>;
  location: {
    address: string;
    lat?: number;
    lng?: number;
  };
  timestamp: string;
  submittedBy: string;
  submittedByName: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REQUIRES_CORRECTION' | 'COMPLETED';
  groundTruthRating?: 'HIGH_INTEGRITY' | 'MINOR_ISSUES' | 'SEVERE_DISCREPANCY';
  aiAnalysis?: {
    summary: string;
    divergenceFlags: string[];
    integrityRating: 'HIGH_INTEGRITY' | 'MINOR_ISSUES' | 'SEVERE_DISCREPANCY';
    confidence: number;
    modelUsed: string;
    analyzedAt: string;
    disclaimer: string;
  };
  officialReview?: {
    status: 'ACCEPTED' | 'REQUIRES_CORRECTION' | 'REJECTED';
    officialName: string;
    notes: string;
    reviewedAt: string;
  };
}

export interface NGOAssignment {
  id: string;
  projectId: string;
  projectName: string;
  ngoId: string;
  ngoName: string;
  assignedBy: string;
  assignedAt: string;
  location?: {
    address: string;
    district: string;
    state?: string;
    lat?: number;
    lng?: number;
  };
  purpose?: string;
  deadline?: string;
  requiredEvidence?: string[];
  instructions?: string;
  status: NGOAssignmentStatus;
  taskScope: string;
  report?: {
    observationSummary: string;
    groundTruthRating: 'HIGH_INTEGRITY' | 'MINOR_ISSUES' | 'SEVERE_DISCREPANCY';
    submittedAt: string;
  };
  evidenceSubmissions?: NGOEvidenceSubmission[];
  officialVerification?: {
    status: 'PENDING' | 'ACCEPTED' | 'REQUIRES_CORRECTION' | 'COMPLETED';
    officialName: string;
    officialNotes: string;
    verifiedAt?: string;
    correctionDetails?: string;
  };
  isRestricted?: boolean;
}

export interface AuditEvent {
  id: string;
  actor: string;
  actorRole: string;
  action: string;
  entityType: 'REQUEST' | 'WORK_TOKEN' | 'PROJECT' | 'EVIDENCE' | 'INSPECTION' | 'FUNDING' | 'NGO_TASK' | 'USER';
  entityId: string;
  timestamp: string;
  previousState?: string;
  newState?: string;
  reason: string;
  correlationId: string;
}

export interface AppNotification {
  id: string;
  targetRole: UserRole | 'ALL';
  targetUserId?: string;
  title: string;
  message: string;
  entityId: string;
  entityType: string;
  read: boolean;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// -------------------------------------------------------------
// POLICYMAKER & STRATEGIC INTELLIGENCE MODELS
// -------------------------------------------------------------
export interface RegionalIntelligence {
  district: string;
  totalRequests: number;
  openRequests: number;
  resolvedRequests: number;
  totalProjects: number;
  activeProjects: number;
  delayedProjects: number;
  completedProjects: number;
  allocatedFunds: number;
  expenditure: number;
  absorptionRate: number;
  serviceGapCount: number;
  primaryNeed: string;
  topCategory: string;
}

export interface ConstituencyIntelligence {
  constituencyId: string;
  constituencyName: string;
  region: string;
  authorizedCircle: string;
  infrastructureIndex: number;
  activeCapitalProjectsCount: number;
  totalSanctionedAmount: number;
  expenditureAmount: number;
  roadQualityScore: number;
  drainageResilienceIndex: number;
  civicGrievancesCount: number;
  reworkCasesCount: number;
  developmentStatus: 'THRIVING' | 'STABLE_PROGRESS' | 'ATTENTION_REQUIRED' | 'CRITICAL_INTERVENTION';
  recentMilestones: string[];
  isVoterData: false;
  isElectoralPrediction: false;
  isCitizenRanking: false;
}

export interface FundingIntelligenceData {
  allocated: number;
  sanctioned: number;
  contracted: number;
  expenditure: number;
  remaining: number;
  sanctionRatio: number;
  absorptionRate: number;
  schemeBreakdown: Array<{
    scheme: string;
    budgetHead: string;
    allocated: number;
    sanctioned: number;
    expenditure: number;
    absorptionRate: number;
  }>;
  isSimulatedFiscalData: boolean;
  provenanceSource: string;
}

export interface ServiceGapItem {
  id: string;
  title: string;
  category: string;
  location: string;
  district: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  unaddressedCitizenReportsCount: number;
  estimatedCitizenImpact: string;
  aiEvidencePattern: string;
  recommendedPolicyAction: string;
  confidence: number;
  modelUsed: string;
}

export interface DelayedProjectItem {
  id: string;
  name: string;
  department: string;
  district: string;
  sanctionNumber: string;
  status: ProjectStatus;
  targetCompletionDate: string;
  daysOverdue: number;
  slaRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reworkRequired: boolean;
  reworkReason?: string;
  hasEvidenceDivergence: boolean;
  contractorName?: string;
  expenditure: number;
  sanctioned: number;
}

export interface EvidenceDivergenceCase {
  id: string;
  projectId: string;
  projectName: string;
  milestoneId: string;
  milestoneTitle: string;
  contractorEvidence: {
    claimedPercentage: number;
    contractorName: string;
    description: string;
    photoUrl?: string;
    timestamp: string;
  };
  communityObservations: Array<{
    author: string;
    comment: string;
    timestamp: string;
    divergenceSignal?: string;
  }>;
  ngoAudits: Array<{
    ngoName: string;
    observation: string;
    groundTruthRating?: string;
    timestamp: string;
  }>;
  aiComparison: {
    status: 'POTENTIAL_DISCREPANCY';
    confidence: number;
    summary: string;
    divergenceFlags: string[];
    modelUsed: string;
    disclaimer: string;
  };
  officialInspection?: {
    inspectorName: string;
    decision: string;
    notes: string;
    inspectedAt: string;
  };
}

export interface LifecycleStageMetrics {
  stage: 'Requests' | 'Work Tokens' | 'Projects' | 'Execution' | 'Verification' | 'Completion';
  totalCount: number;
  activeCount: number;
  avgTurnaroundDays: number;
  slaAdherenceRate: number;
  bottleneckFlag?: string;
  statusColor: string;
}

export interface PolicymakerIntelligenceData {
  metrics: {
    totalRequests: number;
    totalWorkTokens: number;
    totalProjects: number;
    activeProjectsCount: number;
    delayedProjectsCount: number;
    completedProjectsCount: number;
    divergenceCount: number;
  };
  fundingAggregate: FundingIntelligenceData;
  regionalIntelligence: RegionalIntelligence[];
  constituencyIntelligence: ConstituencyIntelligence[];
  projects: Project[];
  delayedProjects: DelayedProjectItem[];
  divergenceCases: EvidenceDivergenceCase[];
  serviceGaps: ServiceGapItem[];
  lifecycleStages: LifecycleStageMetrics[];
  categoryDemand: Record<string, number>;
  aiLifecycleInsights: Array<{
    title: string;
    summary: string;
    recommendation: string;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidence: number;
    modelUsed: string;
  }>;
}
