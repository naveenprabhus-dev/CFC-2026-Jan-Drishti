import fs from 'fs';
import path from 'path';
import {
  CitizenRequest,
  WorkToken,
  Project,
  Milestone,
  ContractorEvidence,
  OfficialInspection,
  CommunityObservation,
  NGOAssignment,
  AuditEvent,
  AppNotification,
  UserSession,
  UserRole,
} from '../../src/types/domain';

export interface DatabaseSchema {
  users: UserSession[];
  requests: CitizenRequest[];
  workTokens: WorkToken[];
  projects: Project[];
  evidence: ContractorEvidence[];
  inspections: OfficialInspection[];
  communityObservations: CommunityObservation[];
  ngoAssignments: NGOAssignment[];
  auditEvents: AuditEvent[];
  notifications: AppNotification[];
  translationsCache?: Record<string, string>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'cfc_store.json');

// Initial seed accounts with granular authority scopes and permissions
export const SEED_USERS: UserSession[] = [
  {
    id: 'cit-chennai-001',
    name: 'Aravind Swaminathan',
    email: 'aravind.s@citizen.gov.in',
    role: 'CITIZEN',
    designation: 'Registered Resident & Civic Contributor',
    jurisdiction: 'Ward 14, Central District, Chennai',
    authorityScope: 'Report local infrastructure issues, monitor personal grievance status, track cryptographic work tokens, submit real-time community observations.',
    permissions: [
      'REPORT_ISSUE',
      'TRACK_OWN_REQUESTS',
      'VIEW_TOKEN_STATUS',
      'SUBMIT_COMMUNITY_OBSERVATION',
      'VIEW_PUBLIC_TRANSPARENCY'
    ],
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+91 98401 23456',
    isDemo: true,
  },
  {
    id: 'off-pwd-insp-01',
    name: 'K. Ramanathan',
    email: 'k.ramanathan@pwd.gov.in',
    role: 'OFFICIAL',
    designation: 'Chief Engineer & Executive Triage Officer',
    department: 'Public Works Department (PWD - Highways & Bridges)',
    jurisdiction: 'Central Infrastructure Circle, District PWD',
    authorityScope: 'Triage incoming citizen reports with AI intelligence, issue cryptographically signed Work Tokens, sanction and assign projects, review AI discrepancy analysis, approve milestone inspections & mandate contractor rework.',
    permissions: [
      'TRIAGE_REQUESTS',
      'ISSUE_WORK_TOKENS',
      'CREATE_PROJECTS',
      'SANCTION_BUDGET',
      'ASSIGN_CONTRACTORS',
      'INSPECT_EVIDENCE',
      'MANDATE_REWORK',
      'CERTIFY_COMPLETION',
      'VIEW_COMMAND_CENTER'
    ],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+91 94440 11223',
    isDemo: true,
  },
  {
    id: 'off-sanction-cbe-01',
    name: 'Dr. S. Meenakshi',
    email: 's.meenakshi@planning.gov.in',
    role: 'POLICYMAKER',
    designation: 'Principal Infrastructure Advisor & Sanctioning Authority',
    department: 'State Infrastructure Planning & Monitoring Commission',
    jurisdiction: 'Coimbatore & Western Region (Statewide Strategy & Resource Allocation)',
    authorityScope: 'Macro infrastructure health monitoring, multi-scheme funding absorption oversight (PMGSY, SRDMS, UID), delay radar detection, systemic quality divergence auditing, cross-department resource optimization.',
    permissions: [
      'VIEW_MACRO_INTELLIGENCE',
      'AUDIT_FUNDING_ABSORPTION',
      'TRACK_SERVICE_GAPS',
      'VIEW_DELAY_RADAR',
      'ANALYZE_QUALITY_DIVERGENCE',
      'EXPORT_POLICY_BRIEFS'
    ],
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    phone: '+91 98840 99887',
    isDemo: true,
  },
  {
    id: 'cont-apex-01',
    name: 'Apex Roads Infrastructure',
    email: 'contact@apexroads.in',
    role: 'CONTRACTOR',
    designation: 'Class-1 Enlisted Lead Contractor',
    organization: 'Apex Roads Infrastructure Ltd. (GSTIN: 33AAACA0000A1Z5)',
    jurisdiction: 'State Highways & Urban Roads Circle',
    authorityScope: 'Execute assigned public works, update milestone progress claims, upload geo-tagged photographic and material lab test certificates, respond to official rework mandates.',
    permissions: [
      'VIEW_ASSIGNED_PROJECTS',
      'CLAIM_MILESTONE_PROGRESS',
      'SUBMIT_CONTRACTOR_EVIDENCE',
      'SUBMIT_REWORK_RECTIFICATION',
      'REQUEST_OFFICIAL_INSPECTION'
    ],
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    phone: '+91 44 2841 5566',
    isDemo: true,
  },
  {
    id: 'ngo-01',
    name: 'Civic Watch Foundation',
    email: 'monitor@civicwatch.org',
    role: 'NGO',
    designation: 'Independent Citizen Audit Lead',
    organization: 'Civic Watch Foundation (Independent Citizen Audit Network)',
    jurisdiction: 'Urban Governance & Public Asset Monitoring',
    authorityScope: 'Perform independent third-party field inspections, conduct ground truth safety audits (especially school/hospital zones), file structured discrepancy reports.',
    permissions: [
      'VIEW_NGO_ASSIGNMENTS',
      'SUBMIT_GROUND_TRUTH_REPORTS',
      'FLAG_SAFETY_HAZARDS',
      'CONDUCT_CIVIC_AUDITS'
    ],
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    phone: '+91 98410 77665',
    isDemo: true,
  },
  {
    id: 'public-01',
    name: 'Public Citizen / Open Viewer',
    email: 'public@transparency.gov.in',
    role: 'PUBLIC_VIEWER',
    designation: 'Open Public Observer',
    jurisdiction: 'Open Transparency Portal (Worldwide Public Access)',
    authorityScope: 'Search and inspect verified public infrastructure records, examine milestone digital threads, review test certificates without PII exposure, verify expenditure against sanctions.',
    permissions: [
      'SEARCH_PUBLIC_PROJECTS',
      'VIEW_PROJECT_LIFECYCLE',
      'INSPECT_PUBLIC_EVIDENCE',
      'VIEW_FUNDING_LEDGER'
    ],
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    isDemo: true,
  },
];

function createInitialSeedData(): DatabaseSchema {
  const timestamp = new Date('2026-09-20T10:00:00Z').toISOString();

  // 1. Happy Path Seed: REQ-DEMO-001 -> WT-DEMO-001 -> PRJ-DEMO-001 (Completed)
  const req1: CitizenRequest = {
    id: 'REQ-DEMO-001',
    citizenId: 'citizen-01',
    citizenName: 'Aravind Swaminathan',
    citizenContact: '+91 98401 23456',
    title: 'Severe crater potholes on Anna Salai arterial junction causing dangerous transit',
    description: 'Multiple deep potholes spanning 200 meters near the metro flyover junction. Causing severe two-wheeler skids and acute traffic bottleneck during peak office hours.',
    originalLanguage: 'English',
    voiceRecorded: true,
    photoUrls: [
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
    ],
    location: {
      address: 'Anna Salai Junction, Near Metro Pillar 142',
      district: 'Central Chennai',
      state: 'Tamil Nadu',
      pincode: '600002',
      lat: 13.0827,
      lng: 80.2707,
    },
    status: 'COMPLETED',
    createdAt: new Date('2026-09-10T08:30:00Z').toISOString(),
    updatedAt: new Date('2026-09-22T16:00:00Z').toISOString(),
    workTokenId: 'WT-DEMO-001',
    projectId: 'PRJ-DEMO-001',
    aiAnalysis: {
      intent: 'PUBLIC_COMPLAINT',
      category: 'ROAD_INFRASTRUCTURE',
      severity: 'HIGH',
      summary: 'Arterial road surface cratering creating high accident hazard near rapid transit junction.',
      suggestedDepartment: 'Public Works Department (PWD - Roads & Highways)',
      estimatedUrgencyDays: 2,
      extractedEntities: {
        locationMentioned: 'Anna Salai Metro Pillar 142',
        infrastructureType: 'Bituminous Arterial Roadway',
        impactSummary: 'Acute two-wheeler hazard and peak-hour transit slowdown.',
      },
      matchedGovernmentSchemes: [
        {
          schemeName: 'Special Road Development & Modernization Scheme (SRDMS)',
          code: 'SRDMS-METRO-2026',
          description: 'High-density urban road structural resurfacing initiative.',
          relevance: 'Primary arterial roadway resurfacing matching high vehicular volume.',
        },
      ],
      confidence: 0.96,
      modelUsed: 'gemini-3.1-flash-lite (Gemini AI Developer API)',
      generatedAt: new Date('2026-09-10T08:31:00Z').toISOString(),
      provenance: 'AI_ANALYSIS',
    },
  };

  const wt1: WorkToken = {
    id: 'WT-DEMO-001',
    requestId: 'REQ-DEMO-001',
    projectId: 'PRJ-DEMO-001',
    title: 'Work Token: Anna Salai Arterial Junction Reconstruction',
    department: 'Public Works Department (PWD)',
    jurisdiction: 'Central Infrastructure Circle',
    priority: 'HIGH',
    status: 'COMPLETED',
    issuedBy: 'K. Ramanathan (Chief Engineer)',
    issuedByRole: 'OFFICIAL',
    issuedAt: new Date('2026-09-11T09:15:00Z').toISOString(),
    digitalThreadSignature: 'WT-SIG-e839a-7c91-49b2-9df3-882a17f9',
    notes: 'Prioritized for emergency resurfacing under SRDMS sanction head.',
  };

  const prj1: Project = {
    id: 'PRJ-DEMO-001',
    workTokenId: 'WT-DEMO-001',
    requestId: 'REQ-DEMO-001',
    name: 'Anna Salai Arterial Resurfacing & Reinforced Drainage Culvert',
    description: 'Comprehensive high-grade bituminous concrete laying (50mm BC over 75mm DBM) with edge kerb reinforcement and storm water run-off connection.',
    department: 'Public Works Department (PWD)',
    district: 'Central Chennai',
    state: 'Tamil Nadu',
    sanctionNumber: 'PWD/SRDMS/SANCT/2026/0891',
    status: 'COMPLETED',
    contractorId: 'contractor-01',
    contractorName: 'Apex Roads Infrastructure Ltd.',
    scopeOfWork: 'Mill damaged surface (200m x 14m), lay 75mm Dense Bituminous Macadam (DBM), 50mm Bituminous Concrete (BC), install thermoplastic lane markings and kerb stones.',
    targetCompletionDate: '2026-09-24',
    createdAt: new Date('2026-09-12T10:00:00Z').toISOString(),
    sanctionedAt: new Date('2026-09-12T11:00:00Z').toISOString(),
    assignedAt: new Date('2026-09-13T14:30:00Z').toISOString(),
    completedAt: new Date('2026-09-22T15:45:00Z').toISOString(),
    funding: {
      allocated: 4500000,
      sanctioned: 4200000,
      contracted: 3950000,
      expenditure: 3950000,
      currency: 'INR',
      schemeSource: 'Special Road Development & Modernization Scheme (SRDMS)',
      budgetHead: 'PWD-CAP-ROAD-842',
      lastAuditDate: '2026-09-23',
    },
    milestones: [
      {
        id: 'M1-PRJ-001',
        title: 'Milling, Surface Prep & Sub-base Stabilization',
        description: 'Cold milling of deteriorated asphalt, debris removal, base course compaction.',
        sequence: 1,
        status: 'VERIFIED',
        completionPercentageClaimed: 100,
        targetDate: '2026-09-15',
        completedDate: '2026-09-15',
        verifiedAt: new Date('2026-09-16T10:00:00Z').toISOString(),
      },
      {
        id: 'M2-PRJ-001',
        title: 'DBM Base & Bituminous Concrete Top Layer Laying',
        description: '75mm Dense Bituminous Macadam followed by 50mm Bituminous Concrete with tack coat.',
        sequence: 2,
        status: 'VERIFIED',
        completionPercentageClaimed: 100,
        targetDate: '2026-09-19',
        completedDate: '2026-09-19',
        verifiedAt: new Date('2026-09-20T11:30:00Z').toISOString(),
      },
      {
        id: 'M3-PRJ-001',
        title: 'Thermoplastic Marking, Kerb Stones & Site Clearance',
        description: 'High-visibility retroreflective striping, pedestrian crossing markings, and debris clearing.',
        sequence: 3,
        status: 'VERIFIED',
        completionPercentageClaimed: 100,
        targetDate: '2026-09-22',
        completedDate: '2026-09-22',
        verifiedAt: new Date('2026-09-22T15:30:00Z').toISOString(),
      },
    ],
  };

  // 2. Discrepancy + Rework Seed: REQ-DEMO-002 -> WT-DEMO-002 -> PRJ-DEMO-002 (In Rework / Verification Required)
  const req2: CitizenRequest = {
    id: 'REQ-DEMO-002',
    citizenId: 'citizen-01',
    citizenName: 'Aravind Swaminathan',
    citizenContact: '+91 98401 23456',
    title: 'Damaged pavement and incomplete road widening causing waterlogging at Gandhi Nagar Main Road',
    description: 'The road widening stopped halfway, leaving open aggregate subgrade and deep trenches on both shoulders. Rain has created massive standing muddy pools blocking pedestrian access to schools.',
    originalLanguage: 'English',
    voiceRecorded: false,
    photoUrls: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
    ],
    location: {
      address: 'Gandhi Nagar Main Road, Sector 3, Opposite Primary School',
      district: 'Central Chennai',
      state: 'Tamil Nadu',
      pincode: '600020',
      lat: 13.0035,
      lng: 80.2554,
    },
    status: 'IN_PROGRESS',
    createdAt: new Date('2026-09-14T11:00:00Z').toISOString(),
    updatedAt: new Date('2026-09-24T14:20:00Z').toISOString(),
    workTokenId: 'WT-DEMO-002',
    projectId: 'PRJ-DEMO-002',
    aiAnalysis: {
      intent: 'PUBLIC_COMPLAINT',
      category: 'ROAD_INFRASTRUCTURE',
      severity: 'HIGH',
      summary: 'Hazardous incomplete road widening causing pedestrian hazard and school access waterlogging.',
      suggestedDepartment: 'Public Works Department (PWD - Urban Division)',
      estimatedUrgencyDays: 2,
      extractedEntities: {
        locationMentioned: 'Gandhi Nagar Main Road Sector 3',
        infrastructureType: 'Pavement & Road Widening',
        impactSummary: 'School zone safety risk and acute pedestrian waterlogging.',
      },
      matchedGovernmentSchemes: [
        {
          schemeName: 'Urban Infrastructure Development Fund (UIDF)',
          code: 'UIDF-URBAN-SAFETY-26',
          description: 'School corridor and civic safety pathway remediation fund.',
          relevance: 'Targeted urban school road safety rectification.',
        },
      ],
      confidence: 0.95,
      modelUsed: 'gemini-3.1-flash-lite (Gemini AI Developer API)',
      generatedAt: new Date('2026-09-14T11:02:00Z').toISOString(),
      provenance: 'AI_ANALYSIS',
    },
  };

  const wt2: WorkToken = {
    id: 'WT-DEMO-002',
    requestId: 'REQ-DEMO-002',
    projectId: 'PRJ-DEMO-002',
    title: 'Work Token: Gandhi Nagar Sector 3 Road Widening & Storm Drain Completion',
    department: 'Public Works Department (PWD)',
    jurisdiction: 'Central Infrastructure Circle',
    priority: 'HIGH',
    status: 'VERIFICATION_REQUIRED',
    issuedBy: 'K. Ramanathan (Chief Engineer)',
    issuedByRole: 'OFFICIAL',
    issuedAt: new Date('2026-09-15T09:30:00Z').toISOString(),
    digitalThreadSignature: 'WT-SIG-44a91-bc10-4781-8172-192a0149bb88',
    notes: 'Under active official scrutiny due to divergence between claimed progress and ground reality.',
  };

  const prj2: Project = {
    id: 'PRJ-DEMO-002',
    workTokenId: 'WT-DEMO-002',
    requestId: 'REQ-DEMO-002',
    name: 'Gandhi Nagar Sector 3 Road Widening & Storm Drain Rectification',
    description: 'Complete 350m pavement widening, compact Wet Mix Macadam (WMM), lay bituminous wearing coat, and construct RCC covered storm drain.',
    department: 'Public Works Department (PWD)',
    district: 'Central Chennai',
    state: 'Tamil Nadu',
    sanctionNumber: 'PWD/UIDF/SANCT/2026/1042',
    status: 'DELAYED',
    contractorId: 'contractor-01',
    contractorName: 'Apex Roads Infrastructure Ltd.',
    scopeOfWork: 'Complete subgrade compaction, 150mm WMM, 50mm Bituminous Concrete, and complete 350m precast drain slabs along school perimeter.',
    targetCompletionDate: '2026-09-30',
    createdAt: new Date('2026-09-16T10:00:00Z').toISOString(),
    sanctionedAt: new Date('2026-09-16T11:30:00Z').toISOString(),
    assignedAt: new Date('2026-09-17T09:00:00Z').toISOString(),
    reworkRequiredMessage: 'OFFICIAL REWORK MANDATE: Contractor claimed 80% milestone completion, but site inspection & AI cross-validation confirmed that only subgrade aggregate was dumped with no bitumen wearing layer and open drains left unslabbed. Immediate resurfacing and drain covering required before reinspection.',
    officialReviewNotes: 'First milestone evidence rejected on 2026-09-23. Re-submission required.',
    funding: {
      allocated: 5200000,
      sanctioned: 4800000,
      contracted: 4450000,
      expenditure: 1200000,
      currency: 'INR',
      schemeSource: 'Urban Infrastructure Development Fund (UIDF)',
      budgetHead: 'PWD-CAP-URBAN-915',
      lastAuditDate: '2026-09-24',
    },
    milestones: [
      {
        id: 'M1-PRJ-002',
        title: 'Storm Drain Trenching & Precast Slabs Installation',
        description: '350m RCC drain trenching and precast top cover laying.',
        sequence: 1,
        status: 'VERIFIED',
        completionPercentageClaimed: 100,
        targetDate: '2026-09-20',
        completedDate: '2026-09-20',
        verifiedAt: new Date('2026-09-21T14:00:00Z').toISOString(),
      },
      {
        id: 'M2-PRJ-002',
        title: 'Wet Mix Macadam Base & 50mm Bituminous Wearing Coat',
        description: 'Compaction of 150mm WMM base followed by hot-mix 50mm BC layer.',
        sequence: 2,
        status: 'DELAYED',
        completionPercentageClaimed: 80,
        targetDate: '2026-09-23',
        reworkNotes: 'Rejection on 2026-09-23: Bituminous layer missing, uncompacted subgrade exposed. Contractor instructed to mobilize hot-mix paver.',
      },
      {
        id: 'M3-PRJ-002',
        title: 'Pedestrian Footpath, Kerb Stones & School Signage',
        description: 'Paver block sidewalk laying, safety railings and school zone road signs.',
        sequence: 3,
        status: 'PLANNED',
        completionPercentageClaimed: 0,
        targetDate: '2026-09-30',
      },
    ],
  };

  const evid2: ContractorEvidence = {
    id: 'EVID-DEMO-002',
    projectId: 'PRJ-DEMO-002',
    milestoneId: 'M2-PRJ-002',
    submittedBy: 'contractor-01',
    submittedByName: 'Apex Roads Infrastructure Ltd.',
    submittedAt: new Date('2026-09-23T09:30:00Z').toISOString(),
    mediaRefs: [
      {
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
        caption: 'Site photo showing loose gravel aggregate laid along widening flank.',
      },
    ],
    description: 'Completed 80% of pavement widening section. Loose aggregate filled and waiting for final roller pass.',
    claimedProgress: 80,
    location: {
      lat: 13.0035,
      lng: 80.2554,
      label: 'Gandhi Nagar Sector 3 Road Widening Site',
    },
    status: 'REJECTED',
    reworkNote: 'Evidence rejected: Contractor claimed 80% completion but only loose subgrade was dumped with no bitumen binder or seal coat. Divergence confirmed.',
    provenance: 'CONTRACTOR_SUBMISSION',
    aiVerification: {
      status: 'POTENTIAL_DISCREPANCY',
      confidence: 0.94,
      summary: 'High divergence detected: Contractor claimed 80% completion, but submitted photo reveals uncompacted aggregate base without bituminous binder.',
      observations: [
        'Contractor claimed 80% milestone progress for asphalt and base completion.',
        'Submitted site photo depicts raw aggregate sub-base without prime coat or bituminous macadam.',
        'Community reports indicate ongoing pedestrian disruption and school-gate waterlogging.',
      ],
      reasoning: 'The technical criteria for 80% milestone completion mandate bitumen laying and compaction testing. Raw dumped gravel does not satisfy the milestone criteria.',
      divergenceFlags: [
        'Missing Bituminous Concrete top layer',
        'Shoulder compaction incomplete',
        'Contradiction with community observation logs',
      ],
      modelUsed: 'gemini-3.1-flash-lite (Gemini AI Vision & Evidence Analyzer)',
      analyzedAt: new Date('2026-09-23T09:32:00Z').toISOString(),
      provenance: 'AI_ANALYSIS',
    },
  };

  const insp2: OfficialInspection = {
    id: 'INSP-DEMO-002',
    projectId: 'PRJ-DEMO-002',
    milestoneId: 'M2-PRJ-002',
    evidenceId: 'EVID-DEMO-002',
    inspectorId: 'official-01',
    inspectorName: 'K. Ramanathan (Chief Engineer)',
    decision: 'REWORK_REQUIRED',
    officialNotes: 'Ground inspection affirms AI divergence analysis. Contractor must mobilize paver, compact base with 10-ton vibratory roller, and lay 50mm Bituminous Concrete before milestone clearance.',
    inspectedAt: new Date('2026-09-23T11:45:00Z').toISOString(),
    provenance: 'OFFICIAL_HUMAN_DECISION',
  };

  // 3. Funding Intelligence Demo: REQ-DEMO-003 -> WT-DEMO-003 -> PRJ-DEMO-003 (Sanctioned & Tendered)
  const req3: CitizenRequest = {
    id: 'REQ-DEMO-003',
    citizenId: 'citizen-01',
    citizenName: 'Aravind Swaminathan',
    citizenContact: '+91 98401 23456',
    title: 'Cracked bridge culvert with soil erosion on Tambaram-Velachery Link Road',
    description: 'Heavy monsoon flow has eroded the bridge abutment wing wall. Visible structural fissure extending across the primary culvert slab. Risk of collapse if heavy commercial vehicles continue to pass.',
    originalLanguage: 'English',
    voiceRecorded: false,
    photoUrls: [
      'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=600&auto=format&fit=crop&q=80',
    ],
    location: {
      address: 'Tambaram-Velachery Link Road, Culvert Km 14/2',
      district: 'South Chennai',
      state: 'Tamil Nadu',
      pincode: '600100',
      lat: 12.9249,
      lng: 80.1481,
    },
    status: 'PROJECT_CREATED',
    createdAt: new Date('2026-09-18T14:00:00Z').toISOString(),
    updatedAt: new Date('2026-09-21T10:00:00Z').toISOString(),
    workTokenId: 'WT-DEMO-003',
    projectId: 'PRJ-DEMO-003',
    aiAnalysis: {
      intent: 'PUBLIC_COMPLAINT',
      category: 'BRIDGE_CULVERT',
      severity: 'CRITICAL',
      summary: 'Structural culvert abutment fissure and erosion threatening critical arterial bridge stability.',
      suggestedDepartment: 'PWD Bridges & Culverts Special Division',
      estimatedUrgencyDays: 1,
      extractedEntities: {
        locationMentioned: 'Tambaram-Velachery Link Km 14/2',
        infrastructureType: 'RCC Box Culvert & Retaining Wall',
        impactSummary: 'Acute bridge collapse hazard for heavy commercial transit.',
      },
      matchedGovernmentSchemes: [
        {
          schemeName: 'Pradhan Mantri Gram Sadak Yojana (PMGSY - Bridge Rehabilitation)',
          code: 'PMGSY-BRIDGE-CRIT-26',
          description: 'Emergency bridge and culvert structural restoration fund.',
          relevance: 'High priority grant for arterial link culvert strengthening.',
        },
        {
          schemeName: 'National Disaster Mitigation Fund (NDMF - Drainage Resilience)',
          code: 'NDMF-RESILIENCE-2026',
          description: 'Flood-induced infrastructure damage mitigation allocation.',
          relevance: 'Eligible for scouring protection and reinforced retaining walls.',
        },
      ],
      confidence: 0.98,
      modelUsed: 'gemini-3.1-flash-lite (Gemini AI Developer API)',
      generatedAt: new Date('2026-09-18T14:02:00Z').toISOString(),
      provenance: 'AI_ANALYSIS',
    },
  };

  const wt3: WorkToken = {
    id: 'WT-DEMO-003',
    requestId: 'REQ-DEMO-003',
    projectId: 'PRJ-DEMO-003',
    title: 'Work Token: Tambaram-Velachery Link Culvert Structural Rehabilitation',
    department: 'Public Works Department (PWD)',
    jurisdiction: 'South Infrastructure Division',
    priority: 'EMERGENCY',
    status: 'PROJECT_ATTACHED',
    issuedBy: 'K. Ramanathan (Chief Engineer)',
    issuedByRole: 'OFFICIAL',
    issuedAt: new Date('2026-09-19T08:30:00Z').toISOString(),
    digitalThreadSignature: 'WT-SIG-99f12-ad88-4102-bf77-2299d45e0031',
    notes: 'Emergency token fast-tracked through Bridge Safety Committee.',
  };

  const prj3: Project = {
    id: 'PRJ-DEMO-003',
    workTokenId: 'WT-DEMO-003',
    requestId: 'REQ-DEMO-003',
    name: 'Tambaram-Velachery Culvert Abutment Reconstruction & Scour Protection',
    description: 'Rebuild damaged RCC wing wall, install deep micro-piling for abutment stabilization, construct boulder pitching scour apron, and cast new M35 reinforced deck slab.',
    department: 'Public Works Department (PWD)',
    district: 'South Chennai',
    state: 'Tamil Nadu',
    sanctionNumber: 'PWD/PMGSY/SANCT/2026/1209',
    status: 'TENDERED',
    scopeOfWork: 'Micro-piling, RCC wing wall construction (12m x 4.5m), boulder gabion scour protection, and M35 deck slab replacement.',
    targetCompletionDate: '2026-10-15',
    createdAt: new Date('2026-09-20T09:00:00Z').toISOString(),
    sanctionedAt: new Date('2026-09-20T10:30:00Z').toISOString(),
    funding: {
      allocated: 8500000,
      sanctioned: 8200000,
      contracted: 0,
      expenditure: 0,
      currency: 'INR',
      schemeSource: 'Pradhan Mantri Gram Sadak Yojana (PMGSY)',
      budgetHead: 'PWD-CAP-BRIDGE-730',
      lastAuditDate: '2026-09-21',
    },
    milestones: [
      {
        id: 'M1-PRJ-003',
        title: 'Site Cofferdam, Flow Diversion & Abutment Excavation',
        description: 'Construct temporary stream diversion channel and excavate degraded soil behind abutment.',
        sequence: 1,
        status: 'PLANNED',
        completionPercentageClaimed: 0,
        targetDate: '2026-09-28',
      },
      {
        id: 'M2-PRJ-003',
        title: 'Micro-Piling & RCC Retaining Wing Wall Casting',
        description: 'Drive structural micro-piles and cast reinforced concrete wing wall with weep holes.',
        sequence: 2,
        status: 'PLANNED',
        completionPercentageClaimed: 0,
        targetDate: '2026-10-05',
      },
      {
        id: 'M3-PRJ-003',
        title: 'Scour Apron Pitching, Deck Slab & Approach Resurfacing',
        description: 'Boulder gabion apron, deck slab casting, expansion joint sealing and asphalt wearing coat.',
        sequence: 3,
        status: 'PLANNED',
        completionPercentageClaimed: 0,
        targetDate: '2026-10-15',
      },
    ],
  };

  const communityObs: CommunityObservation[] = [
    {
      id: 'OBS-001',
      projectId: 'PRJ-DEMO-002',
      submittedBy: 'citizen-01',
      submittedByName: 'Aravind Swaminathan (Local Citizen)',
      comment: 'Workers dumped loose crushed stones yesterday but left no bitumen or roller. School children are tripping on the unlevel stones when crossing.',
      timestamp: new Date('2026-09-23T08:15:00Z').toISOString(),
      divergenceSignal: 'POOR_QUALITY',
      provenance: 'COMMUNITY_VERIFICATION',
    },
    {
      id: 'OBS-002',
      projectId: 'PRJ-DEMO-001',
      submittedBy: 'citizen-01',
      submittedByName: 'Aravind Swaminathan (Local Citizen)',
      comment: 'The new road surface on Anna Salai is smooth and excellent. Lane markings are crisp and water drains freely now.',
      timestamp: new Date('2026-09-22T17:00:00Z').toISOString(),
      divergenceSignal: 'PROGRESSING_WELL',
      provenance: 'COMMUNITY_VERIFICATION',
    },
  ];

  const ngoTasks: NGOAssignment[] = [
    {
      id: 'NGO-TSK-001',
      projectId: 'PRJ-DEMO-002',
      projectName: 'Gandhi Nagar Sector 3 Road Widening & Storm Drain Rectification',
      ngoId: 'ngo-01',
      ngoName: 'Civic Watch Foundation',
      assignedBy: 'K. Ramanathan (Chief Engineer, PWD)',
      assignedAt: new Date('2026-09-21T10:00:00Z').toISOString(),
      location: {
        address: 'Gandhi Nagar 3rd Main Rd, Adyar, Ward 14',
        district: 'Central Chennai',
        state: 'Tamil Nadu',
        lat: 13.0067,
        lng: 80.2575,
      },
      purpose: 'Independent ground audit of open storm drain trenches, barricade continuity, and aggregate sub-base compaction near Government Girls Higher Secondary School.',
      deadline: '2026-09-28',
      requiredEvidence: [
        'Geotagged photos of trench edge barricades',
        'Measurement log of aggregate layer depth',
        'School gate clear pedestrian walkway width test',
      ],
      instructions: 'Conduct site audit during morning pedestrian peak hours (8:00 AM - 9:30 AM). Verify safety fencing around open excavation. Check whether contractor has provided safe timber plank ramps for school students. Note presence of warning blinkers at night.',
      status: 'UNDER_REVIEW',
      taskScope: 'School Zone Pedestrian Safety & Open Drain Hazard Verification',
      report: {
        observationSummary: 'Site inspection confirms open trench hazard. Contractor aggregate layer is incomplete and poses safety risk during school hours. Rework mandatory.',
        groundTruthRating: 'SEVERE_DISCREPANCY',
        submittedAt: new Date('2026-09-23T10:30:00Z').toISOString(),
      },
      evidenceSubmissions: [
        {
          id: 'NGO-EVD-001',
          assignmentId: 'NGO-TSK-001',
          projectId: 'PRJ-DEMO-002',
          observation: 'Open excavation 1.8m depth left without perimeter caution tape or hard barricading within 15 meters of school gate.',
          description: 'Inspected school access perimeter. Aggregate subgrade has loose crushed stone uncompacted. Two-wheeler skids observed. Barricade gaps detected at 3 key crossings.',
          photos: [
            {
              url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f9?w=600&auto=format&fit=crop&q=80',
              caption: 'Unprotected storm drain excavation 15m from school pedestrian entrance',
            },
            {
              url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
              caption: 'Loose uncompacted aggregate layer causing hazardous tripping for pedestrians',
            },
          ],
          location: {
            address: 'Gandhi Nagar 3rd Main Rd, School Zone, Adyar',
            lat: 13.0067,
            lng: 80.2575,
          },
          timestamp: new Date('2026-09-23T10:30:00Z').toISOString(),
          submittedBy: 'ngo-01',
          submittedByName: 'Civic Watch Foundation (Independent Civic Audit)',
          status: 'UNDER_REVIEW',
          groundTruthRating: 'SEVERE_DISCREPANCY',
          aiAnalysis: {
            summary: 'Third-party ground observation flags critical safety divergence and pedestrian hazard requiring immediate official intervention.',
            divergenceFlags: [
              'Unbarricaded excavation adjacent to active school pedestrian flow',
              'Material specification divergence between claimed vs actual site layer',
              'Pedestrian detour ramp missing or non-compliant',
            ],
            integrityRating: 'SEVERE_DISCREPANCY',
            confidence: 0.94,
            modelUsed: 'gemini-3.1-flash-lite (Gemini AI Vision & Evidence Analyzer)',
            analyzedAt: new Date('2026-09-23T10:32:00Z').toISOString(),
            disclaimer: 'AI Analysis: Advisory only. AI cannot sanction, approve, or reject civil work claims. Consequential decisions are reserved exclusively for authorized Government Officials.',
          },
          officialReview: {
            status: 'ACCEPTED',
            officialName: 'K. Ramanathan (Chief Engineer, PWD)',
            notes: 'Third-party NGO audit verified on site. Corroborates community complaints. Mandating immediate contractor rework.',
            reviewedAt: new Date('2026-09-23T11:45:00Z').toISOString(),
          },
        },
      ],
      officialVerification: {
        status: 'ACCEPTED',
        officialName: 'K. Ramanathan (Chief Engineer, PWD)',
        officialNotes: 'Official inspection conducted. NGO ground truth findings upheld. Contractor issued mandatory rework order.',
        verifiedAt: new Date('2026-09-23T11:45:00Z').toISOString(),
      },
    },
    {
      id: 'NGO-TSK-002',
      projectId: 'PRJ-DEMO-003',
      projectName: 'Tambaram-Velachery Culvert Abutment Reconstruction & Scour Protection',
      ngoId: 'ngo-01',
      ngoName: 'Civic Watch Foundation',
      assignedBy: 'PWD Bridges & Hydrology Division',
      assignedAt: new Date('2026-09-24T09:00:00Z').toISOString(),
      location: {
        address: 'Velachery-Tambaram Link Bridge Culvert 14B, Near Medavakkam Junction',
        district: 'South Chennai',
        state: 'Tamil Nadu',
        lat: 12.9249,
        lng: 80.1932,
      },
      purpose: 'Pre-monsoon hydrological stream clearance, scour barrier protection, and water flow obstruction independent audit.',
      deadline: '2026-10-10',
      requiredEvidence: [
        'Stream inlet cofferdam flow diversion channel photos',
        'High water mark scour buffer mesh verification',
        'Detour signage & public transit safety compliance',
      ],
      instructions: 'Verify whether stream diversion cofferdam is clear of silt debris. Check structural micro-pile casing alignment. Ensure clear bypass lanes are maintained for heavy traffic on Velachery Link Road.',
      status: 'AVAILABLE',
      taskScope: 'Environmental Scour Safety & Hydrological Flow Obstruction Verification',
    },
    {
      id: 'NGO-TSK-003',
      projectId: 'PRJ-DEMO-002',
      projectName: 'Gandhi Nagar Sector 3 Road Widening & Storm Drain Rectification',
      ngoId: 'ngo-01',
      ngoName: 'Civic Watch Foundation',
      assignedBy: 'K. Ramanathan (Chief Engineer, PWD)',
      assignedAt: new Date('2026-09-24T14:00:00Z').toISOString(),
      location: {
        address: 'Gandhi Nagar Sector 3 West Cross Street, Ward 14',
        district: 'Central Chennai',
        state: 'Tamil Nadu',
        lat: 13.0082,
        lng: 80.2541,
      },
      purpose: 'Verify contractor remediation actions: installation of continuous barricades and compaction of aggregate base before bitumen laying.',
      deadline: '2026-10-04',
      requiredEvidence: [
        'Continuous yellow barricade installation along storm drain',
        'Vibratory roller compaction depth confirmation',
        'Pedestrian timber walkway across drain intake',
      ],
      instructions: 'Re-audit sector 3 crossroads following contractor rework notice. Verify that open trenches are covered with heavy duty mesh, caution blinkers are operational, and dust suppression measures are active.',
      status: 'ACCEPTED',
      taskScope: 'Contractor Rework Remediation Audit & Field Inspection',
    },
    {
      id: 'NGO-TSK-004',
      projectId: 'PRJ-DEMO-001',
      projectName: 'Anna Salai Arterial Highway Pothole Restoration & Drainage Re-engineering',
      ngoId: 'ngo-01',
      ngoName: 'Civic Watch Foundation',
      assignedBy: 'K. Ramanathan (Chief Engineer, PWD)',
      assignedAt: new Date('2026-09-18T10:00:00Z').toISOString(),
      location: {
        address: 'Anna Salai Arterial Junction, Chintadripet',
        district: 'Central Chennai',
        state: 'Tamil Nadu',
        lat: 13.0732,
        lng: 80.2707,
      },
      purpose: 'Post-completion civic quality verification: Surface evenness, pedestrian crossing markings, and rainwater drainage intake performance.',
      deadline: '2026-09-22',
      requiredEvidence: [
        'Longitudinal view of restored wearing course',
        'Thermoplastic lane markings and pedestrian crossing paint',
        'Drain curb inlet debris clearance photo',
      ],
      instructions: 'Conduct post-commissioning ride quality and pedestrian safety walk-through. Test drainage inlets with municipal water flush. Interview local shopkeepers regarding traffic flow normalization.',
      status: 'COMPLETED',
      taskScope: 'Post-Commissioning Civic Audit & Community Satisfaction',
      report: {
        observationSummary: 'Restoration completed to high standard. Asphalt surface smooth, pedestrian zebra markings distinct, and curb drains intake water without pooling. Excellent civic outcome.',
        groundTruthRating: 'HIGH_INTEGRITY',
        submittedAt: new Date('2026-09-22T14:30:00Z').toISOString(),
      },
      evidenceSubmissions: [
        {
          id: 'NGO-EVD-004',
          assignmentId: 'NGO-TSK-004',
          projectId: 'PRJ-DEMO-001',
          observation: 'Smooth bitumen surface laid across entire 200m section. All road markings complete and clear of construction debris.',
          description: 'Walked the entire stretch. Measured zero surface undulation. Curb drop-inlets are clear and functional. Commuters confirm transit times restored.',
          photos: [
            {
              url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
              caption: 'Completed bituminous surface and high-visibility road markings',
            },
          ],
          location: {
            address: 'Anna Salai Junction, Near Metro Pillar 142',
            lat: 13.0732,
            lng: 80.2707,
          },
          timestamp: new Date('2026-09-22T14:30:00Z').toISOString(),
          submittedBy: 'ngo-01',
          submittedByName: 'Civic Watch Foundation (Independent Civic Audit)',
          status: 'COMPLETED',
          groundTruthRating: 'HIGH_INTEGRITY',
          aiAnalysis: {
            summary: 'NGO site observation records satisfactory alignment with safety barriers and preliminary site restoration standards.',
            divergenceFlags: [],
            integrityRating: 'HIGH_INTEGRITY',
            confidence: 0.96,
            modelUsed: 'gemini-3.1-flash-lite (Gemini AI Vision & Evidence Analyzer)',
            analyzedAt: new Date('2026-09-22T14:32:00Z').toISOString(),
            disclaimer: 'AI Analysis: Advisory only. AI cannot sanction, approve, or reject civil work claims. Consequential decisions are reserved exclusively for authorized Government Officials.',
          },
          officialReview: {
            status: 'ACCEPTED',
            officialName: 'K. Ramanathan (Chief Engineer, PWD)',
            notes: 'Independent civic audit accepted. High integrity rating confirmed. Full project handover certified.',
            reviewedAt: new Date('2026-09-22T15:45:00Z').toISOString(),
          },
        },
      ],
      officialVerification: {
        status: 'COMPLETED',
        officialName: 'K. Ramanathan (Chief Engineer, PWD)',
        officialNotes: 'Full civil restoration certified. Digital verification thread closed with positive civic audit report.',
        verifiedAt: new Date('2026-09-22T15:45:00Z').toISOString(),
      },
    },
  ];

  const auditLogs: AuditEvent[] = [
    {
      id: 'AUDIT-001',
      actor: 'Aravind Swaminathan',
      actorRole: 'CITIZEN',
      action: 'SUBMIT_CITIZEN_REQUEST',
      entityType: 'REQUEST',
      entityId: 'REQ-DEMO-001',
      timestamp: new Date('2026-09-10T08:30:00Z').toISOString(),
      newState: 'SUBMITTED',
      reason: 'Citizen reported severe pothole hazard on Anna Salai junction.',
      correlationId: 'REQ-DEMO-001',
    },
    {
      id: 'AUDIT-002',
      actor: 'K. Ramanathan (Chief Engineer)',
      actorRole: 'OFFICIAL',
      action: 'ISSUE_WORK_TOKEN',
      entityType: 'WORK_TOKEN',
      entityId: 'WT-DEMO-001',
      timestamp: new Date('2026-09-11T09:15:00Z').toISOString(),
      newState: 'ACTIVE',
      reason: 'Triage approval and Work Token generation under SRDMS.',
      correlationId: 'WT-DEMO-001',
    },
    {
      id: 'AUDIT-003',
      actor: 'K. Ramanathan (Chief Engineer)',
      actorRole: 'OFFICIAL',
      action: 'SANCTION_AND_ASSIGN_PROJECT',
      entityType: 'PROJECT',
      entityId: 'PRJ-DEMO-001',
      timestamp: new Date('2026-09-13T14:30:00Z').toISOString(),
      previousState: 'SANCTIONED',
      newState: 'CONTRACTOR_ASSIGNED',
      reason: 'Assigned to Apex Roads Infrastructure Ltd. for fast-track execution.',
      correlationId: 'PRJ-DEMO-001',
    },
    {
      id: 'AUDIT-004',
      actor: 'K. Ramanathan (Chief Engineer)',
      actorRole: 'OFFICIAL',
      action: 'REQUIRE_CONTRACTOR_REWORK',
      entityType: 'INSPECTION',
      entityId: 'INSP-DEMO-002',
      timestamp: new Date('2026-09-23T11:45:00Z').toISOString(),
      previousState: 'IN_PROGRESS',
      newState: 'DELAYED',
      reason: 'AI verification and official site inspection identified 80% claim discrepancy. Rework mandated.',
      correlationId: 'PRJ-DEMO-002',
    },
    {
      id: 'AUDIT-005',
      actor: 'K. Ramanathan (Chief Engineer)',
      actorRole: 'OFFICIAL',
      action: 'OFFICIAL_PROJECT_COMPLETION',
      entityType: 'PROJECT',
      entityId: 'PRJ-DEMO-001',
      timestamp: new Date('2026-09-22T15:45:00Z').toISOString(),
      previousState: 'IN_PROGRESS',
      newState: 'COMPLETED',
      reason: 'All 3 milestones inspected, tested and certified. Full civic restoration verified.',
      correlationId: 'PRJ-DEMO-001',
    },
  ];

  const notifs: AppNotification[] = [
    {
      id: 'NOTIF-001',
      targetRole: 'CITIZEN',
      targetUserId: 'citizen-01',
      title: 'Infrastructure Project Completed',
      message: 'Your report REQ-DEMO-001 (Anna Salai Road) has been fully executed, inspected and certified complete.',
      entityId: 'PRJ-DEMO-001',
      entityType: 'PROJECT',
      read: false,
      createdAt: new Date('2026-09-22T16:00:00Z').toISOString(),
    },
    {
      id: 'NOTIF-002',
      targetRole: 'CONTRACTOR',
      targetUserId: 'contractor-01',
      title: 'Official Rework Mandate Issued',
      message: 'Project PRJ-DEMO-002: Evidence for Milestone 2 was rejected. Proper base compaction and asphalt paver laying required before reinspection.',
      entityId: 'PRJ-DEMO-002',
      entityType: 'PROJECT',
      read: false,
      createdAt: new Date('2026-09-23T12:00:00Z').toISOString(),
    },
    {
      id: 'NOTIF-003',
      targetRole: 'OFFICIAL',
      targetUserId: 'official-01',
      title: 'High Priority Triage Pending',
      message: 'Emergency Bridge Culvert report REQ-DEMO-003 requires immediate technical review and contractor tendering.',
      entityId: 'REQ-DEMO-003',
      entityType: 'REQUEST',
      read: false,
      createdAt: new Date('2026-09-20T09:05:00Z').toISOString(),
    },
  ];

  return {
    users: SEED_USERS,
    requests: [req1, req2, req3],
    workTokens: [wt1, wt2, wt3],
    projects: [prj1, prj2, prj3],
    evidence: [evid2],
    inspections: [insp2],
    communityObservations: communityObs,
    ngoAssignments: ngoTasks,
    auditEvents: auditLogs,
    notifications: notifs,
    translationsCache: {},
  };
}

class DatabaseStore {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.requests) && Array.isArray(parsed.projects)) {
          // Ensure users are present
          parsed.users = SEED_USERS;
          // Ensure rich NGO assignments are present
          const seed = createInitialSeedData();
          if (!parsed.ngoAssignments || parsed.ngoAssignments.length < 4 || !parsed.ngoAssignments[0]?.purpose) {
            parsed.ngoAssignments = seed.ngoAssignments;
          }
          this.saveData(parsed as DatabaseSchema);
          return parsed as DatabaseSchema;
        }
      }
    } catch (err) {
      console.warn('[DatabaseStore] Could not read persisted file, re-seeding:', err);
    }

    const initial = createInitialSeedData();
    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DatabaseStore] Failed to write to disk:', err);
    }
  }

  public resetToSeed(): DatabaseSchema {
    this.data = createInitialSeedData();
    this.saveData();
    return this.data;
  }

  // --- Users & Auth ---
  public getUsers(): UserSession[] {
    return this.data.users;
  }

  public getUserById(id: string): UserSession | undefined {
    if (id === 'citizen-01' || id === 'cit-chennai-001') {
      return this.data.users.find((u) => u.id === 'cit-chennai-001' || u.id === 'citizen-01');
    }
    if (id === 'official-01' || id === 'off-pwd-insp-01') {
      return this.data.users.find((u) => u.id === 'off-pwd-insp-01' || u.id === 'official-01');
    }
    if (id === 'contractor-01' || id === 'cont-apex-01') {
      return this.data.users.find((u) => u.id === 'cont-apex-01' || u.id === 'contractor-01');
    }
    if (id === 'policymaker-01' || id === 'off-sanction-cbe-01') {
      return this.data.users.find((u) => u.id === 'off-sanction-cbe-01' || u.id === 'policymaker-01');
    }
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): UserSession | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: UserSession): UserSession {
    // Check if user already exists
    const existingIndex = this.data.users.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    if (existingIndex >= 0) {
      this.data.users[existingIndex] = { ...this.data.users[existingIndex], ...user };
    } else {
      this.data.users.push(user);
    }
    this.saveData();
    return user;
  }

  public updateUser(id: string, updates: Partial<UserSession>): UserSession | undefined {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
    };
    this.saveData();
    return this.data.users[idx];
  }

  // --- Citizen Requests ---
  public getRequests(filters?: { citizenId?: string; status?: string }): CitizenRequest[] {
    let list = [...this.data.requests];
    if (filters?.citizenId) {
      const cid = filters.citizenId;
      list = list.filter((r) => r.citizenId === cid || ((cid === 'cit-chennai-001' || cid === 'citizen-01') && (r.citizenId === 'cit-chennai-001' || r.citizenId === 'citizen-01')));
    }
    if (filters?.status) {
      list = list.filter((r) => r.status === filters.status);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getRequestById(id: string): CitizenRequest | undefined {
    return this.data.requests.find((r) => r.id === id);
  }

  public createRequest(req: CitizenRequest): CitizenRequest {
    this.data.requests.push(req);
    this.saveData();
    return req;
  }

  public updateRequest(id: string, update: Partial<CitizenRequest>): CitizenRequest | undefined {
    const idx = this.data.requests.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;
    this.data.requests[idx] = {
      ...this.data.requests[idx],
      ...update,
      updatedAt: new Date().toISOString(),
    };
    this.saveData();
    return this.data.requests[idx];
  }

  // --- Work Tokens ---
  public getWorkTokens(): WorkToken[] {
    return [...this.data.workTokens].sort(
      (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
    );
  }

  public getWorkTokenById(id: string): WorkToken | undefined {
    return this.data.workTokens.find((w) => w.id === id);
  }

  public createWorkToken(wt: WorkToken): WorkToken {
    this.data.workTokens.push(wt);
    this.saveData();
    return wt;
  }

  public updateWorkToken(id: string, update: Partial<WorkToken>): WorkToken | undefined {
    const idx = this.data.workTokens.findIndex((w) => w.id === id);
    if (idx === -1) return undefined;
    this.data.workTokens[idx] = {
      ...this.data.workTokens[idx],
      ...update,
    };
    this.saveData();
    return this.data.workTokens[idx];
  }

  // --- Projects ---
  public getProjects(filters?: {
    contractorId?: string;
    department?: string;
    status?: string;
  }): Project[] {
    let list = [...this.data.projects];
    if (filters?.contractorId) {
      const cid = filters.contractorId;
      list = list.filter(
        (p) =>
          p.contractorId === cid ||
          (cid === 'cont-apex-01' && p.contractorId === 'contractor-01') ||
          (cid === 'contractor-01' && p.contractorId === 'cont-apex-01')
      );
    }
    if (filters?.department) {
      list = list.filter((p) => p.department.toLowerCase().includes(filters.department!.toLowerCase()));
    }
    if (filters?.status) {
      list = list.filter((p) => p.status === filters.status);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getProjectById(id: string): Project | undefined {
    return this.data.projects.find((p) => p.id === id);
  }

  public createProject(project: Project): Project {
    this.data.projects.push(project);
    this.saveData();
    return project;
  }

  public updateProject(id: string, update: Partial<Project>): Project | undefined {
    const idx = this.data.projects.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    this.data.projects[idx] = {
      ...this.data.projects[idx],
      ...update,
    };
    this.saveData();
    return this.data.projects[idx];
  }

  // --- Milestones ---
  public updateMilestone(
    projectId: string,
    milestoneId: string,
    update: Partial<Milestone>
  ): Milestone | undefined {
    const project = this.getProjectById(projectId);
    if (!project) return undefined;
    const mIdx = project.milestones.findIndex((m) => m.id === milestoneId);
    if (mIdx === -1) return undefined;
    project.milestones[mIdx] = {
      ...project.milestones[mIdx],
      ...update,
    };
    this.updateProject(projectId, { milestones: project.milestones });
    return project.milestones[mIdx];
  }

  // --- Contractor Evidence ---
  public getEvidence(filters?: { projectId?: string; milestoneId?: string }): ContractorEvidence[] {
    let list = [...this.data.evidence];
    if (filters?.projectId) {
      list = list.filter((e) => e.projectId === filters.projectId);
    }
    if (filters?.milestoneId) {
      list = list.filter((e) => e.milestoneId === filters.milestoneId);
    }
    return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  public getEvidenceById(id: string): ContractorEvidence | undefined {
    return this.data.evidence.find((e) => e.id === id);
  }

  public createEvidence(ev: ContractorEvidence): ContractorEvidence {
    this.data.evidence.push(ev);
    this.saveData();
    return ev;
  }

  public updateEvidence(id: string, update: Partial<ContractorEvidence>): ContractorEvidence | undefined {
    const idx = this.data.evidence.findIndex((e) => e.id === id);
    if (idx === -1) return undefined;
    this.data.evidence[idx] = {
      ...this.data.evidence[idx],
      ...update,
    };
    this.saveData();
    return this.data.evidence[idx];
  }

  // --- Official Inspections ---
  public getInspections(projectId?: string): OfficialInspection[] {
    let list = [...this.data.inspections];
    if (projectId) {
      list = list.filter((i) => i.projectId === projectId);
    }
    return list.sort((a, b) => new Date(b.inspectedAt).getTime() - new Date(a.inspectedAt).getTime());
  }

  public createInspection(insp: OfficialInspection): OfficialInspection {
    this.data.inspections.push(insp);
    this.saveData();
    return insp;
  }

  // --- Community Observations ---
  public getCommunityObservations(projectId?: string): CommunityObservation[] {
    let list = [...this.data.communityObservations];
    if (projectId) {
      list = list.filter((o) => o.projectId === projectId);
    }
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public createCommunityObservation(obs: CommunityObservation): CommunityObservation {
    this.data.communityObservations.push(obs);
    this.saveData();
    return obs;
  }

  // --- NGO Assignments ---
  public getNGOAssignments(ngoId?: string): NGOAssignment[] {
    let list = [...this.data.ngoAssignments];
    if (ngoId) {
      list = list.filter((a) => a.ngoId === ngoId);
    }
    return list.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
  }

  public getNGOAssignmentById(id: string): NGOAssignment | undefined {
    return this.data.ngoAssignments.find((a) => a.id === id);
  }

  public createNGOAssignment(assignment: NGOAssignment): NGOAssignment {
    this.data.ngoAssignments.push(assignment);
    this.saveData();
    return assignment;
  }

  public updateNGOAssignment(id: string, update: Partial<NGOAssignment>): NGOAssignment | undefined {
    const idx = this.data.ngoAssignments.findIndex((a) => a.id === id);
    if (idx === -1) return undefined;
    this.data.ngoAssignments[idx] = {
      ...this.data.ngoAssignments[idx],
      ...update,
    };
    this.saveData();
    return this.data.ngoAssignments[idx];
  }

  // --- Audit Events ---
  public getAuditEvents(entityId?: string): AuditEvent[] {
    let list = [...this.data.auditEvents];
    if (entityId) {
      list = list.filter((a) => a.entityId === entityId || a.correlationId === entityId);
    }
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public logAudit(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const audit: AuditEvent = {
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };
    this.data.auditEvents.push(audit);
    this.saveData();
    return audit;
  }

  // --- Notifications ---
  public getNotifications(userRole?: UserRole, userId?: string): AppNotification[] {
    let list = [...this.data.notifications];
    if (userRole || userId) {
      list = list.filter((n) => {
        if (n.targetRole === 'ALL') return true;
        if (userRole && n.targetRole === userRole) return true;
        if (userId && n.targetUserId === userId) return true;
        return false;
      });
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createNotification(notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): AppNotification {
    const newNotif: AppNotification = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      read: false,
      ...notif,
    };
    this.data.notifications.push(newNotif);
    this.saveData();
    return newNotif;
  }

  public markNotificationRead(id: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.saveData();
      return true;
    }
    return false;
  }

  // --- Translation Caching ---
  public getCachedTranslation(text: string, targetLanguage: string): string | undefined {
    if (!this.data.translationsCache) {
      this.data.translationsCache = {};
    }
    const key = `${text.trim()}_${targetLanguage}`;
    return this.data.translationsCache[key];
  }

  public setCachedTranslation(text: string, targetLanguage: string, translatedText: string): void {
    if (!this.data.translationsCache) {
      this.data.translationsCache = {};
    }
    const key = `${text.trim()}_${targetLanguage}`;
    this.data.translationsCache[key] = translatedText;
    this.saveData();
  }
}

export const dbStore = new DatabaseStore();
