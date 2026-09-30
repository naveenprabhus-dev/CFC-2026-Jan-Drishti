export type UserRole =
  | 'CITIZEN'
  | 'OFFICIAL'
  | 'POLICYMAKER'
  | 'SANCTIONING_AUTHORITY'
  | 'CONTRACTOR'
  | 'NGO'
  | 'PUBLIC_VIEWER'
  | 'ADMIN';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  status?: 'active' | 'inactive';
  creationMethod?: 'ADMIN_PROVISIONED' | 'SELF_REGISTERED';
  createdAt?: string;
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
  authorizedRegion?: string;
  financialThreshold?: number;
  circleId?: string;
  jurisdictionIds?: string[];
  // Secure Admin Preview & Impersonation Session
  isPreviewSession?: boolean;
  actualAdminId?: string;
  actualAdminName?: string;
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
  | 'REJECTED'
  | 'LINKED_TO_EXISTING';

export type WorkTokenStatus =
  | 'ACTIVE'
  | 'PROJECT_ATTACHED'
  | 'VERIFICATION_REQUIRED'
  | 'COMPLETED'
  | 'SUSPENDED';

export type ProjectStatus =
  | 'PROPOSED'
  | 'RETURNED'
  | 'REJECTED'
  | 'SANCTIONED'
  | 'TENDERED'
  | 'CONTRACTOR_RECOMMENDED'
  | 'WAITING_FOR_FINANCIAL_SANCTION'
  | 'PENDING_FINANCIAL_SANCTION'
  | 'FINANCIAL_SANCTIONED'
  | 'WAITING_FOR_FUNDING_AUTHORIZATION'
  | 'FINANCIAL_SANCTION_REJECTED'
  | 'FUNDING_AUTHORIZED'
  | 'WAITING_FOR_WORK_ORDER'
  | 'WORK_ORDER_ISSUED'
  | 'CONTRACTOR_EXECUTION_AUTHORIZED'
  | 'EXECUTION_ENABLED'
  | 'CONTRACTOR_ASSIGNED'
  | 'IN_PROGRESS'
  | 'VERIFICATION_REQUIRED'
  | 'DELAYED'
  | 'COMPLETED'
  | 'SUSPENDED'
  | 'READY_FOR_COMPLETION';

export type MilestoneStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'DELAYED'
  | 'REWORK_REQUIRED'
  | 'READY_FOR_VERIFICATION';

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
  authorityCandidateCode?: string;
  authorityCandidateName?: string;
  authorityResolutionCertainty?: number;
  translatedTitle?: string;
  translatedDescription?: string;
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
    state?: string;
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
  circleId?: string;
  jurisdictionId?: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  aiAnalysis?: AIProblemIntelligence;
  workTokenId?: string;
  projectId?: string;
  existingWorkMatch?: boolean;
  linkedWorkTokenId?: string;
  linkedProjectId?: string;
  rejectionReason?: string;
  triagePriority?: 'NORMAL' | 'HIGH' | 'CRITICAL';
  safetyRisk?: 'LOW' | 'MEDIUM' | 'HIGH';
  routedDepartment?: string;
  routedAuthority?: string;
  urgentAlertSent?: boolean;
  clusterId?: string;
}

export interface IssueCluster {
  id: string;
  clusterKey: string;
  canonicalTitle: string;
  category: string;
  subcategory: string;
  department: string;
  jurisdiction: string;
  location: {
    address: string;
    district: string;
    state?: string;
    pincode?: string;
    lat?: number;
    lng?: number;
    ulb?: string;
    ward?: string;
  };
  severity: SeverityLevel;
  priority: PriorityLevel;
  priorityScore: number;
  priorityReasoning: string[];
  aiAssessment?: string;
  reportCount: number;
  requestIds: string[];
  firstReportedAt: string;
  lastReportedAt: string;
  status: RequestStatus;
  circleId?: string;
  jurisdictionId?: string;
  linkedWorkTokenId?: string;
  linkedProjectId?: string;
  aggregationConfidence: number;
  createdAt: string;
  updatedAt: string;
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
  remaining?: number;
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

export interface TenderQuote {
  id: string;
  tenderId: string;
  projectId: string;
  contractorId: string;
  contractorName: string;
  quotedAmount: number;
  durationDays: number;
  scopeConfirmation: boolean;
  notes: string;
  supportingInfoUrl?: string;
  submittedAt: string;
  aiAnalysis?: {
    score: number;
    priceFit: string;
    technicalFit: string;
    recommendation: 'RECOMMENDED' | 'ACCEPTABLE' | 'NOT_RECOMMENDED';
    reasoning: string;
  };
  officialSelection?: {
    selected: boolean;
    decisionActor: string;
    decisionTimestamp: string;
    reason: string;
  };
}

export interface ProjectTender {
  id: string;
  projectId: string;
  title: string;
  developmentType: 'ROAD' | 'STREETLIGHT' | 'WATER' | 'DRAINAGE' | 'BRIDGE' | 'OTHER';
  district: string;
  state: string;
  sanctionedAmount: number;
  requiredScope: string;
  deadline: string;
  eligibleContractorIds: string[];
  status: 'OPEN_FOR_QUOTES' | 'EVALUATION' | 'AWARDED' | 'CLOSED';
  createdAt: string;
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
  circleId?: string;
  jurisdictionId?: string;
  sanctioningAuthorityId?: string;
  sanctioningAuthorityName?: string;
  sanctionRequestId?: string;
  sanctionNumber: string;
  status: ProjectStatus;
  contractorId?: string;
  contractorName?: string;
  recommendedContractorId?: string;
  recommendedContractorName?: string;
  recommendedQuoteId?: string;
  recommendedAmount?: number;
  recommendedBy?: string;
  recommendedAt?: string;
  recommendationReason?: string;
  fundingAuthorizationId?: string;
  fundingAuthorizationDate?: string;
  fundingAuthorizedBy?: string;
  workOrderId?: string;
  workOrderDate?: string;
  workOrderIssuedBy?: string;
  workOrderNumber?: string;
  workOrderAccepted?: boolean;
  workOrderAcceptedAt?: string;
  assignmentEffectiveAt?: string;
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
  evidence?: ContractorEvidence[];
  tender?: ProjectTender;
  quotes?: TenderQuote[];
  governanceDocuments?: GovernanceDocument[];
  homeULB?: string;
}

export type GovernanceDocType = 
  | 'CONTRACTOR_RECOMMENDATION'
  | 'FINANCIAL_SANCTION_ORDER'
  | 'FUNDING_AUTHORIZATION_ORDER'
  | 'WORK_ORDER';

export type GovernanceDocStatus =
  | 'GENERATED'
  | 'DOWNLOADED'
  | 'SIGNATURE_PENDING'
  | 'SIGNED_UPLOAD_PENDING'
  | 'SIGNED_DOCUMENT_UPLOADED'
  | 'VERIFIED';

export interface GovernanceDocument {
  id: string;
  projectId: string;
  workTokenId: string;
  requestId: string;
  docType: GovernanceDocType;
  title: string;
  refNumber: string;
  version: number;
  status: GovernanceDocStatus;
  createdBy: string;
  createdByRole: string;
  createdAt: string;
  generatedContent: any;
  uploadedBy?: string;
  uploadedByRole?: string;
  uploadedAt?: string;
  fileUrl?: string;
  amount: number;
  contractorId?: string;
  contractorName?: string;
  decisionReference?: string;
  notes?: string;
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
  actorId?: string;
  actorName?: string;
  action: string;
  entityType: 'REQUEST' | 'WORK_TOKEN' | 'PROJECT' | 'EVIDENCE' | 'INSPECTION' | 'FUNDING' | 'NGO_TASK' | 'USER' | 'USER_SESSION' | 'PLATFORM' | 'MILESTONE';
  entityId: string;
  projectId?: string;
  milestoneId?: string;
  timestamp: string;
  previousState?: string;
  newState?: string;
  reason?: string;
  correlationId?: string;
  details?: string;
  adminId?: string;
  targetUserId?: string;
  targetRole?: string;
  amount?: number;
  decision?: string;
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
  readAt?: string;
  type?: string;
  projectId?: string;
  workTokenId?: string;
  location?: string;
  amount?: number;
  refNumber?: string;
  recipientUserId?: string;
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
