import { Router, Request, Response } from 'express';
import { dbStore, SEED_USERS } from '../db/store';
import {
  analyzeCitizenComplaint,
  verifyContractorEvidence,
  analyzeNGOEvidence,
  queryPolicymakerIntelligence,
  queryCivicAssistant,
  translateText,
} from '../ai/orchestrator';
import {
  CitizenRequest,
  WorkToken,
  Project,
  ContractorEvidence,
  OfficialInspection,
  CommunityObservation,
  NGOAssignment,
  NGOEvidenceSubmission,
  ApiResponse,
  UserSession,
} from '../../src/types/domain';

export const apiRouter = Router();

// Helper to get active user from request header or default fallback
function getActorSession(req: Request): UserSession {
  const userId = (req.headers['x-user-id'] as string) || 'official-01';
  const user = dbStore.getUserById(userId);
  return (
    user || {
      id: 'official-01',
      name: 'K. Ramanathan',
      email: 'k.ramanathan@pwd.gov.in',
      role: 'OFFICIAL',
      department: 'Public Works Department',
    }
  );
}

// -------------------------------------------------------------
// AUTH & USERS
// -------------------------------------------------------------
apiRouter.get('/auth/users', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: dbStore.getUsers(),
  });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const actor = getActorSession(req);
  res.json({
    success: true,
    data: actor,
  });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, role } = req.body;
  if (!email) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Email address is required.' },
    });
  }

  // Find user by email
  let user = dbStore.getUserByEmail(email);

  // If role is specified and doesn't match found user
  if (user && role && user.role !== role) {
    return res.status(401).json({
      success: false,
      error: { code: 'ROLE_MISMATCH', message: `Account exists with role ${user.role}, not ${role}.` },
    });
  }

  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'No registered account found with this email. Please register or use Demo Login.' },
    });
  }

  res.json({
    success: true,
    data: user,
  });
});

apiRouter.post('/auth/demo-login', (req: Request, res: Response) => {
  const { userId, role } = req.body;
  let user: UserSession | undefined;

  if (userId) {
    user = dbStore.getUserById(userId);
  } else if (role) {
    user = dbStore.getUsers().find((u) => u.role === role);
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      error: { code: 'DEMO_USER_NOT_FOUND', message: 'Specified demo identity was not found.' },
    });
  }

  // Ensure isDemo flag is true
  const demoUser: UserSession = {
    ...user,
    isDemo: true,
  };

  res.json({
    success: true,
    data: demoUser,
  });
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const {
    name,
    email,
    role,
    department,
    organization,
    jurisdiction,
    designation,
    phone,
  } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Name, email, and role are required.' },
    });
  }

  const existing = dbStore.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({
      success: false,
      error: { code: 'USER_EXISTS', message: 'An account with this email address already exists. Please sign in.' },
    });
  }

  // Default permissions & authority scope by role
  let permissions: string[] = [];
  let authorityScope = '';

  switch (role) {
    case 'CITIZEN':
      permissions = ['REPORT_ISSUE', 'TRACK_OWN_REQUESTS', 'VIEW_TOKEN_STATUS', 'SUBMIT_COMMUNITY_OBSERVATION', 'VIEW_PUBLIC_TRANSPARENCY'];
      authorityScope = 'Report local civic infrastructure issues, track token status, and submit field observations.';
      break;
    case 'OFFICIAL':
      permissions = ['TRIAGE_REQUESTS', 'ISSUE_WORK_TOKENS', 'CREATE_PROJECTS', 'SANCTION_BUDGET', 'ASSIGN_CONTRACTORS', 'INSPECT_EVIDENCE', 'MANDATE_REWORK', 'CERTIFY_COMPLETION', 'VIEW_COMMAND_CENTER'];
      authorityScope = 'Review and triage citizen reports, sanction budgets, assign contractor work, conduct AI discrepancy inspections, mandate rework.';
      break;
    case 'POLICYMAKER':
      permissions = ['VIEW_MACRO_INTELLIGENCE', 'AUDIT_FUNDING_ABSORPTION', 'TRACK_SERVICE_GAPS', 'VIEW_DELAY_RADAR', 'ANALYZE_QUALITY_DIVERGENCE', 'EXPORT_POLICY_BRIEFS'];
      authorityScope = 'Strategic state infrastructure monitoring, funding scheme absorption analytics, delay radar, and quality gap analysis.';
      break;
    case 'CONTRACTOR':
      permissions = ['VIEW_ASSIGNED_PROJECTS', 'CLAIM_MILESTONE_PROGRESS', 'SUBMIT_CONTRACTOR_EVIDENCE', 'SUBMIT_REWORK_RECTIFICATION', 'REQUEST_OFFICIAL_INSPECTION'];
      authorityScope = 'Execute awarded infrastructure contracts, claim milestone progress with photographic/lab test evidence, submit rework rectifications.';
      break;
    case 'NGO':
      permissions = ['VIEW_NGO_ASSIGNMENTS', 'SUBMIT_GROUND_TRUTH_REPORTS', 'FLAG_SAFETY_HAZARDS', 'CONDUCT_CIVIC_AUDITS'];
      authorityScope = 'Conduct independent third-party inspections, audit civic project quality, report divergence signals.';
      break;
    case 'PUBLIC_VIEWER':
    default:
      permissions = ['SEARCH_PUBLIC_PROJECTS', 'VIEW_PROJECT_LIFECYCLE', 'INSPECT_PUBLIC_EVIDENCE', 'VIEW_FUNDING_LEDGER'];
      authorityScope = 'Open public exploration of sanitized civic project records and milestone execution threads.';
      break;
  }

  const prefix = role.toLowerCase().replace('_', '-');
  const newUserId = `${prefix}-${Date.now().toString(36)}`;

  const newUser: UserSession = {
    id: newUserId,
    name,
    email,
    role,
    department: department || undefined,
    organization: organization || undefined,
    jurisdiction: jurisdiction || 'Civic Jurisdiction',
    designation: designation || undefined,
    authorityScope,
    permissions,
    phone: phone || undefined,
    avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    isDemo: false,
  };

  dbStore.createUser(newUser);

  dbStore.logAudit({
    actor: name,
    actorRole: role,
    action: 'USER_REGISTERED',
    entityType: 'REQUEST',
    entityId: newUserId,
    newState: 'REGISTERED',
    reason: `New user registration for role ${role}`,
    correlationId: newUserId,
  });

  res.json({
    success: true,
    data: newUser,
  });
});

// -------------------------------------------------------------
// CITIZEN REQUESTS
// -------------------------------------------------------------
apiRouter.post('/citizen/requests', async (req: Request, res: Response) => {
  try {
    const actor = getActorSession(req);
    const {
      title,
      description,
      originalLanguage,
      voiceRecorded,
      photoUrls,
      location,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Title and description are required.' },
      });
    }

    const firstPhoto = photoUrls && photoUrls.length > 0 ? photoUrls[0] : undefined;

    // Run AI Problem Intelligence with multimodal photo & language
    const aiAnalysis = await analyzeCitizenComplaint({
      title,
      description,
      originalLanguage: originalLanguage || 'English',
      locationAddress: location?.address,
      district: location?.district,
      hasVoice: !!voiceRecorded,
      hasPhoto: !!firstPhoto,
      photoDataUrl: firstPhoto,
    });

    // =========================================================================
    // GOVERNMENT ACTION CHECK (CRITICAL DUPLICATE PREVENTION LOGIC)
    // Check if an active government action (Work Token or Project) already covers this issue
    // =========================================================================
    const activeProjects = dbStore.getProjects().filter((p) =>
      ['PROPOSED', 'SANCTIONED', 'TENDERED', 'CONTRACTOR_ASSIGNED', 'IN_PROGRESS', 'VERIFICATION_REQUIRED', 'DELAYED'].includes(p.status)
    );

    const activeTokens = dbStore.getWorkTokens().filter((t) =>
      ['ACTIVE', 'PROJECT_ATTACHED', 'VERIFICATION_REQUIRED'].includes(t.status)
    );

    const inputLoc = ((location?.address || '') + ' ' + (location?.district || '') + ' ' + title + ' ' + description).toLowerCase();
    const inputCategory = aiAnalysis.category || 'ROAD_INFRASTRUCTURE';

    // Search for existing matching project
    let matchedProject = activeProjects.find((p) => {
      const pLoc = (p.district + ' ' + p.name + ' ' + p.scopeOfWork + ' ' + p.department + ' ' + p.description).toLowerCase();
      // Check district/location proximity or keyword match
      const locMatch =
        (location?.district && pLoc.includes(location.district.toLowerCase())) ||
        (location?.address && pLoc.includes(location.address.toLowerCase().slice(0, 10))) ||
        (inputLoc.includes('anna salai') && pLoc.includes('anna salai')) ||
        (inputLoc.includes('ward 14') && pLoc.includes('ward 14')) ||
        (inputLoc.includes('velachery') && pLoc.includes('velachery'));

      const catMatch =
        (inputCategory === 'ROAD_INFRASTRUCTURE' && (pLoc.includes('road') || pLoc.includes('pothole') || pLoc.includes('resurfacing') || pLoc.includes('asphalt'))) ||
        (inputCategory === 'BRIDGE_CULVERT' && (pLoc.includes('bridge') || pLoc.includes('culvert'))) ||
        (inputCategory === 'WATER_SUPPLY' && (pLoc.includes('water') || pLoc.includes('drainage')));

      return locMatch && catMatch;
    });

    if (matchedProject) {
      const matchedToken = activeTokens.find((t) => t.id === matchedProject?.workTokenId || t.projectId === matchedProject?.id);

      dbStore.logAudit({
        actor: actor.name,
        actorRole: actor.role,
        action: 'GOVERNMENT_ACTION_CHECK_MATCH',
        entityType: 'PROJECT',
        entityId: matchedProject.id,
        newState: matchedProject.status,
        reason: `Government Action Check matched existing project ${matchedProject.id} for complaint: "${title}". Duplicate creation prevented.`,
        correlationId: matchedProject.id,
      });

      // RETURN EXISTING ACTION MATCH (PATH A) - DO NOT CREATE DUPLICATE WORK TOKEN OR PROJECT!
      return res.json({
        success: true,
        existingActionFound: true,
        existingAction: {
          existingProjectId: matchedProject.id,
          existingWorkTokenId: matchedToken?.id || matchedProject.workTokenId || 'WT-DEMO-002',
          projectTitle: matchedProject.name,
          status: matchedProject.status,
          department: matchedProject.department,
          contractorName: matchedProject.contractorName || 'Assigned Execution Agency',
          nextMilestone: matchedProject.milestones?.find((m) => m.status !== 'VERIFIED')?.title || 'Site Execution & Quality Verification',
          lastUpdate: matchedProject.createdAt,
          explanation: `An active government project (${matchedProject.id}) is already addressing ${matchedProject.name} under Work Token ${matchedProject.workTokenId || 'WT-DEMO-002'}.`,
          aiAnalysis,
        },
      });
    }

    // =========================================================================
    // NO MATCH SCENARIO (PATH B) - Proceed with normal Request creation
    // =========================================================================
    const autoId = `REQ-${new Date().getFullYear()}-${String(
      dbStore.getRequests().length + 1
    ).padStart(3, '0')}`;

    const newRequest: CitizenRequest = {
      id: autoId,
      citizenId: actor.id || 'citizen-01',
      citizenName: actor.name || 'Aravind Swaminathan',
      citizenContact: actor.email,
      title,
      description,
      originalLanguage: originalLanguage || 'English',
      voiceRecorded: !!voiceRecorded,
      photoUrls: photoUrls && photoUrls.length > 0 ? photoUrls : [
        'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
      ],
      location: {
        address: location?.address || 'Civic Zone Sector 4',
        district: location?.district || 'Central District',
        state: location?.state || 'Tamil Nadu',
        pincode: location?.pincode || '600001',
        lat: location?.lat || 13.0827,
        lng: location?.lng || 80.2707,
      },
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiAnalysis,
    };

    dbStore.createRequest(newRequest);

    dbStore.logAudit({
      actor: actor.name,
      actorRole: actor.role,
      action: 'CITIZEN_REQUEST_SUBMITTED',
      entityType: 'REQUEST',
      entityId: autoId,
      newState: 'SUBMITTED',
      reason: `Citizen reported: ${title}`,
      correlationId: autoId,
    });

    dbStore.createNotification({
      targetRole: 'OFFICIAL',
      title: 'New Citizen Request Submitted',
      message: `Request ${autoId} received: "${title}". AI classified as ${aiAnalysis.category} (${aiAnalysis.severity} severity).`,
      entityId: autoId,
      entityType: 'REQUEST',
    });

    res.json({
      success: true,
      existingActionFound: false,
      data: newRequest,
    });
  } catch (err: any) {
    console.error('Error creating citizen request:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message || 'Failed to submit request' },
    });
  }
});

apiRouter.get('/citizen/requests', (req: Request, res: Response) => {
  const actor = getActorSession(req);
  // Citizen sees only own requests, unless official/policymaker
  const filter = actor.role === 'CITIZEN' ? { citizenId: actor.id } : undefined;
  const requests = dbStore.getRequests(filter);
  res.json({
    success: true,
    data: requests,
  });
});

apiRouter.get('/citizen/requests/:id', (req: Request, res: Response) => {
  const reqId = req.params.id;
  const item = dbStore.getRequestById(reqId);
  if (!item) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Citizen request ${reqId} not found.` },
    });
  }
  res.json({
    success: true,
    data: item,
  });
});

// -------------------------------------------------------------
// OFFICIAL TRIAGE & WORK TOKENS
// -------------------------------------------------------------
apiRouter.get('/official/requests', (req: Request, res: Response) => {
  const requests = dbStore.getRequests();
  res.json({
    success: true,
    data: requests,
  });
});

apiRouter.post('/official/triage', (req: Request, res: Response) => {
  const actor = getActorSession(req);
  if (actor.role !== 'OFFICIAL') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only Government Officials can triage requests.' },
    });
  }

  const { requestId, decision, notes, priority } = req.body;
  const request = dbStore.getRequestById(requestId);
  if (!request) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Request not found' },
    });
  }

  if (decision === 'REJECT') {
    dbStore.updateRequest(requestId, {
      status: 'REJECTED',
      rejectionReason: notes || 'Rejected during administrative triage.',
    });
    dbStore.logAudit({
      actor: actor.name,
      actorRole: actor.role,
      action: 'OFFICIAL_TRIAGE_REJECT',
      entityType: 'REQUEST',
      entityId: requestId,
      previousState: request.status,
      newState: 'REJECTED',
      reason: notes || 'Request rejected during official review.',
      correlationId: requestId,
    });
    return res.json({
      success: true,
      data: dbStore.getRequestById(requestId),
    });
  }

  dbStore.updateRequest(requestId, { status: 'TRIAGED' });

  dbStore.logAudit({
    actor: actor.name,
    actorRole: actor.role,
    action: 'OFFICIAL_TRIAGE_ACCEPT',
    entityType: 'REQUEST',
    entityId: requestId,
    previousState: request.status,
    newState: 'TRIAGED',
    reason: notes || 'Approved for Work Token issuance and infrastructure action.',
    correlationId: requestId,
  });

  res.json({
    success: true,
    data: dbStore.getRequestById(requestId),
  });
});

apiRouter.post('/work-tokens', (req: Request, res: Response) => {
  const actor = getActorSession(req);
  if (actor.role !== 'OFFICIAL') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only Government Officials can issue Work Tokens.' },
    });
  }

  const { requestId, title, department, jurisdiction, priority, notes } = req.body;
  const request = dbStore.getRequestById(requestId);
  if (!request) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Citizen request not found.' },
    });
  }

  const wtId = `WT-${new Date().getFullYear()}-${String(
    dbStore.getWorkTokens().length + 1
  ).padStart(3, '0')}`;

  const workToken: WorkToken = {
    id: wtId,
    requestId,
    title: title || `Infrastructure Action Token: ${request.title}`,
    department: department || request.aiAnalysis?.suggestedDepartment || 'Public Works Department (PWD)',
    jurisdiction: jurisdiction || actor.jurisdiction || 'Central Infrastructure Circle',
    priority: priority || (request.aiAnalysis?.severity as any) || 'HIGH',
    status: 'ACTIVE',
    issuedBy: actor.name,
    issuedByRole: 'OFFICIAL',
    issuedAt: new Date().toISOString(),
    digitalThreadSignature: `WT-SIG-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`,
    notes: notes || 'Work Token provisioned to anchor digital thread lifecycle.',
  };

  dbStore.createWorkToken(workToken);
  dbStore.updateRequest(requestId, {
    status: 'TOKEN_ISSUED',
    workTokenId: wtId,
  });

  dbStore.logAudit({
    actor: actor.name,
    actorRole: actor.role,
    action: 'WORK_TOKEN_ISSUED',
    entityType: 'WORK_TOKEN',
    entityId: wtId,
    newState: 'ACTIVE',
    reason: `Issued digital thread Work Token for request ${requestId}`,
    correlationId: wtId,
  });

  dbStore.createNotification({
    targetRole: 'CITIZEN',
    targetUserId: request.citizenId,
    title: 'Work Token Issued',
    message: `Your report ${requestId} has received Official Work Token ${wtId}. Digital thread created.`,
    entityId: wtId,
    entityType: 'WORK_TOKEN',
  });

  res.json({
    success: true,
    data: workToken,
  });
});

apiRouter.get('/work-tokens', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: dbStore.getWorkTokens(),
  });
});

apiRouter.get('/work-tokens/:id', (req: Request, res: Response) => {
  const token = dbStore.getWorkTokenById(req.params.id);
  if (!token) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Work Token not found' },
    });
  }
  res.json({
    success: true,
    data: token,
  });
});

// -------------------------------------------------------------
// PROJECTS MANAGEMENT & LIFECYCLE
// -------------------------------------------------------------
apiRouter.post('/projects', (req: Request, res: Response) => {
  const actor = getActorSession(req);
  if (actor.role !== 'OFFICIAL') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only Government Officials can create and sanction projects.' },
    });
  }

  const {
    workTokenId,
    name,
    description,
    department,
    district,
    state,
    scopeOfWork,
    allocatedBudget,
    sanctionedBudget,
    targetCompletionDate,
    schemeSource,
  } = req.body;

  const workToken = dbStore.getWorkTokenById(workTokenId);
  if (!workToken) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Work Token not found.' },
    });
  }

  const prjId = `PRJ-${new Date().getFullYear()}-${String(
    dbStore.getProjects().length + 1
  ).padStart(3, '0')}`;

  const allocated = Number(allocatedBudget) || 5000000;
  const sanctioned = Number(sanctionedBudget) || 4500000;

  const newProject: Project = {
    id: prjId,
    workTokenId,
    requestId: workToken.requestId,
    name: name || `Civil Works Project: ${workToken.title}`,
    description: description || 'Infrastructure development and restorative engineering works.',
    department: department || workToken.department,
    district: district || 'Central Chennai',
    state: state || 'Tamil Nadu',
    sanctionNumber: `PWD/GOV/SANCT/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'SANCTIONED',
    scopeOfWork: scopeOfWork || 'Complete civil restoration and surface re-engineering according to IRC specifications.',
    targetCompletionDate: targetCompletionDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    sanctionedAt: new Date().toISOString(),
    funding: {
      allocated,
      sanctioned,
      contracted: 0,
      expenditure: 0,
      currency: 'INR',
      schemeSource: schemeSource || 'Pradhan Mantri Gram Sadak Yojana (PMGSY)',
      budgetHead: 'PWD-CAP-INFRA-800',
      lastAuditDate: new Date().toISOString().split('T')[0],
    },
    milestones: [
      {
        id: `M1-${prjId}`,
        title: 'Phase 1: Site Clearing, Demolition & Sub-Base Preparation',
        description: 'Complete excavation, base compaction and materials inspection.',
        sequence: 1,
        status: 'PLANNED',
        completionPercentageClaimed: 0,
        targetDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      },
      {
        id: `M2-${prjId}`,
        title: 'Phase 2: Structural Engineering & Bitumen / Concrete Laying',
        description: 'Primary structural execution, compaction and layer testing.',
        sequence: 2,
        status: 'PLANNED',
        completionPercentageClaimed: 0,
        targetDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
      },
      {
        id: `M3-${prjId}`,
        title: 'Phase 3: Finishing, Safety Markings, Drainage & Site Handover',
        description: 'Installation of signs, kerbs, drainage connections, and final clearance.',
        sequence: 3,
        status: 'PLANNED',
        completionPercentageClaimed: 0,
        targetDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      },
    ],
  };

  dbStore.createProject(newProject);
  dbStore.updateWorkToken(workTokenId, {
    projectId: prjId,
    status: 'PROJECT_ATTACHED',
  });
  dbStore.updateRequest(workToken.requestId, {
    projectId: prjId,
    status: 'PROJECT_CREATED',
  });

  dbStore.logAudit({
    actor: actor.name,
    actorRole: actor.role,
    action: 'PROJECT_CREATED_AND_SANCTIONED',
    entityType: 'PROJECT',
    entityId: prjId,
    newState: 'SANCTIONED',
    reason: `Sanctioned project ${prjId} linked to Work Token ${workTokenId}`,
    correlationId: prjId,
  });

  res.json({
    success: true,
    data: newProject,
  });
});

apiRouter.get('/projects', (req: Request, res: Response) => {
  const actor = getActorSession(req);
  let filter: any = {};
  if (actor.role === 'CONTRACTOR') {
    filter.contractorId = actor.id;
  }
  const projects = dbStore.getProjects(filter);
  res.json({
    success: true,
    data: projects,
  });
});

apiRouter.get('/projects/:id', (req: Request, res: Response) => {
  const prj = dbStore.getProjectById(req.params.id);
  if (!prj) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Project ${req.params.id} not found.` },
    });
  }

  // Include attached records
  const evidence = dbStore.getEvidence({ projectId: prj.id });
  const inspections = dbStore.getInspections(prj.id);
  const observations = dbStore.getCommunityObservations(prj.id);
  const audits = dbStore.getAuditEvents(prj.id);
  const workToken = dbStore.getWorkTokenById(prj.workTokenId);
  const request = dbStore.getRequestById(prj.requestId);

  res.json({
    success: true,
    data: {
      ...prj,
      evidence,
      inspections,
      communityObservations: observations,
      auditHistory: audits,
      workToken,
      citizenRequest: request,
    },
  });
});

apiRouter.post('/projects/assign', (req: Request, res: Response) => {
  const actor = getActorSession(req);
  if (actor.role !== 'OFFICIAL') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only Government Officials can assign contractors.' },
    });
  }

  const { projectId, contractorId, contractedAmount } = req.body;
  const project = dbStore.getProjectById(projectId);
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Project not found' },
    });
  }

  const contractor = dbStore.getUserById(contractorId || 'contractor-01');
  const contractorName = contractor?.organization || contractor?.name || 'Apex Roads Infrastructure Ltd.';
  const amount = Number(contractedAmount) || project.funding.sanctioned * 0.92;

  const updated = dbStore.updateProject(projectId, {
    contractorId: contractorId || 'contractor-01',
    contractorName,
    status: 'CONTRACTOR_ASSIGNED',
    assignedAt: new Date().toISOString(),
    funding: {
      ...project.funding,
      contracted: amount,
    },
  });

  dbStore.logAudit({
    actor: actor.name,
    actorRole: actor.role,
    action: 'CONTRACTOR_ASSIGNED',
    entityType: 'PROJECT',
    entityId: projectId,
    previousState: project.status,
    newState: 'CONTRACTOR_ASSIGNED',
    reason: `Assigned execution to ${contractorName} for INR ${amount.toLocaleString()}`,
    correlationId: projectId,
  });

  dbStore.createNotification({
    targetRole: 'CONTRACTOR',
    targetUserId: contractorId || 'contractor-01',
    title: 'New Project Assigned to Your Firm',
    message: `Project ${projectId} (${project.name}) has been officially assigned to you for execution.`,
    entityId: projectId,
    entityType: 'PROJECT',
  });

  res.json({
    success: true,
    data: updated,
  });
});

apiRouter.post('/projects/start', (req: Request, res: Response) => {
  const actor = getActorSession(req);
  const { projectId } = req.body;
  const project = dbStore.getProjectById(projectId);
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Project not found' },
    });
  }

  // Update status to IN_PROGRESS
  const updated = dbStore.updateProject(projectId, {
    status: 'IN_PROGRESS',
  });

  if (project.milestones.length > 0) {
    dbStore.updateMilestone(projectId, project.milestones[0].id, {
      status: 'IN_PROGRESS',
    });
  }

  dbStore.updateRequest(project.requestId, { status: 'IN_PROGRESS' });

  dbStore.logAudit({
    actor: actor.name,
    actorRole: actor.role,
    action: 'PROJECT_EXECUTION_STARTED',
    entityType: 'PROJECT',
    entityId: projectId,
    previousState: project.status,
    newState: 'IN_PROGRESS',
    reason: 'Contractor mobilized machinery and initiated site execution.',
    correlationId: projectId,
  });

  res.json({
    success: true,
    data: updated,
  });
});

// -------------------------------------------------------------
// CONTRACTOR EVIDENCE & AI VERIFICATION
// -------------------------------------------------------------
apiRouter.post('/contractor/evidence', async (req: Request, res: Response) => {
  try {
    const actor = getActorSession(req);
    const {
      projectId,
      milestoneId,
      description,
      claimedProgress,
      mediaRefs,
      location,
      isRework,
    } = req.body;

    const project = dbStore.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found' },
      });
    }

    const milestone =
      (milestoneId ? project.milestones.find((m) => m.id === milestoneId) : undefined) ||
      project.milestones.find((m) => m.status === 'UNDER_REVIEW') ||
      project.milestones.find((m) => m.status === 'IN_PROGRESS') ||
      project.milestones.find((m) => m.status === 'DELAYED') ||
      project.milestones.find((m) => m.status !== 'VERIFIED') ||
      project.milestones[0];
    const observations = dbStore.getCommunityObservations(projectId).map((o) => o.comment);

    const mediaList = mediaRefs && mediaRefs.length > 0
      ? mediaRefs
      : [
          {
            type: 'photo',
            url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
            caption: 'On-site execution cross-section photograph.',
          },
        ];

    // Trigger AI Evidence Verification
    const aiVerification = await verifyContractorEvidence({
      projectName: project.name,
      scopeOfWork: project.scopeOfWork,
      milestoneTitle: milestone.title,
      claimedPercentage: Number(claimedProgress) || 100,
      evidenceDescription: description,
      mediaCount: mediaList.length,
      communityObservations: observations,
      isReworkSubmission: !!isRework,
    });

    const evidId = `EVID-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newEvidence: ContractorEvidence = {
      id: evidId,
      projectId,
      milestoneId: milestone.id,
      submittedBy: actor.id,
      submittedByName: actor.organization || actor.name,
      submittedAt: new Date().toISOString(),
      mediaRefs: mediaList,
      description,
      claimedProgress: Number(claimedProgress) || 100,
      location: location || { label: `${project.district} Construction Site` },
      status: isRework ? 'REWORK_SUBMITTED' : 'AI_ANALYZED',
      provenance: 'CONTRACTOR_SUBMISSION',
      aiVerification,
    };

    dbStore.createEvidence(newEvidence);

    // Update milestone status to UNDER_REVIEW
    dbStore.updateMilestone(projectId, milestone.id, {
      status: 'UNDER_REVIEW',
      completionPercentageClaimed: Number(claimedProgress) || 100,
    });

    // Update project state
    dbStore.updateProject(projectId, {
      status: 'VERIFICATION_REQUIRED',
    });

    dbStore.updateWorkToken(project.workTokenId, {
      status: 'VERIFICATION_REQUIRED',
    });

    dbStore.logAudit({
      actor: actor.name,
      actorRole: actor.role,
      action: isRework ? 'REWORK_EVIDENCE_SUBMITTED' : 'CONTRACTOR_EVIDENCE_SUBMITTED',
      entityType: 'EVIDENCE',
      entityId: evidId,
      newState: 'AI_ANALYZED',
      reason: `Submitted progress evidence (${claimedProgress}%) for milestone ${milestone.title}. AI verification status: ${aiVerification.status}`,
      correlationId: projectId,
    });

    dbStore.createNotification({
      targetRole: 'OFFICIAL',
      title: 'Contractor Milestone Evidence Ready for Inspection',
      message: `Project ${projectId}: ${actor.name} submitted evidence. AI verification result: ${aiVerification.status} (${Math.round(aiVerification.confidence * 100)}% confidence).`,
      entityId: projectId,
      entityType: 'PROJECT',
    });

    res.json({
      success: true,
      data: newEvidence,
    });
  } catch (err: any) {
    console.error('Error submitting contractor evidence:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message || 'Evidence submission failed' },
    });
  }
});

// -------------------------------------------------------------
// OFFICIAL INSPECTION, REWORK & REINSPECTION
// -------------------------------------------------------------
apiRouter.post('/official/inspections', (req: Request, res: Response) => {
  const actor = getActorSession(req);
  if (actor.role !== 'OFFICIAL') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only Government Officials can perform official inspections.' },
    });
  }

  const { projectId, milestoneId, evidenceId, decision, officialNotes } = req.body;
  const project = dbStore.getProjectById(projectId);
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Project not found' },
    });
  }

  const inspId = `INSP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const inspection: OfficialInspection = {
    id: inspId,
    projectId,
    milestoneId,
    evidenceId,
    inspectorId: actor.id,
    inspectorName: actor.name,
    decision: decision || 'APPROVED',
    officialNotes: officialNotes || 'Human inspection verified against site criteria and test logs.',
    inspectedAt: new Date().toISOString(),
    provenance: 'OFFICIAL_HUMAN_DECISION',
  };

  dbStore.createInspection(inspection);

  if (decision === 'REWORK_REQUIRED' || decision === 'REJECTED') {
    // Reject evidence & milestone -> set project to DELAYED
    dbStore.updateEvidence(evidenceId, {
      status: 'REJECTED',
      reworkNote: officialNotes,
    });

    dbStore.updateMilestone(projectId, milestoneId, {
      status: 'DELAYED',
      reworkNotes: officialNotes,
    });

    dbStore.updateProject(projectId, {
      status: 'DELAYED',
      reworkRequiredMessage: `OFFICIAL MANDATE: ${officialNotes}`,
    });

    dbStore.updateWorkToken(project.workTokenId, {
      status: 'VERIFICATION_REQUIRED',
    });

    dbStore.logAudit({
      actor: actor.name,
      actorRole: actor.role,
      action: 'OFFICIAL_INSPECTION_REJECTED',
      entityType: 'INSPECTION',
      entityId: inspId,
      previousState: 'VERIFICATION_REQUIRED',
      newState: 'DELAYED',
      reason: officialNotes,
      correlationId: projectId,
    });

    dbStore.createNotification({
      targetRole: 'CONTRACTOR',
      targetUserId: project.contractorId,
      title: 'Action Required: Official Rework Mandate',
      message: `Project ${projectId}: Milestone inspection rejected by Official ${actor.name}. Reason: ${officialNotes}`,
      entityId: projectId,
      entityType: 'PROJECT',
    });
  } else {
    // APPROVED
    if (evidenceId) {
      dbStore.updateEvidence(evidenceId, {
        status: 'VERIFIED',
      });
    }

    // Also mark any evidence matching this milestone as VERIFIED
    const matchingEv = dbStore.getEvidence({ projectId, milestoneId });
    matchingEv.forEach((ev) => {
      dbStore.updateEvidence(ev.id, { status: 'VERIFIED' });
    });

    dbStore.updateMilestone(projectId, milestoneId, {
      status: 'VERIFIED',
      verifiedAt: new Date().toISOString(),
      completedDate: new Date().toISOString().split('T')[0],
    });

    // Check project status and unlock the next milestone
    let freshProj = dbStore.getProjectById(projectId);
    const allDone = freshProj?.milestones.every((m) => m.status === 'VERIFIED');

    // Unlock next eligible milestone
    if (!allDone && freshProj) {
      const currentMilestone = freshProj.milestones.find((m) => m.id === milestoneId);
      const currentSeq = currentMilestone ? currentMilestone.sequence : 1;
      const nextMilestone = freshProj.milestones
        .filter((m) => m.sequence > currentSeq && m.status !== 'VERIFIED')
        .sort((a, b) => a.sequence - b.sequence)[0];

      if (nextMilestone && (nextMilestone.status === 'PLANNED' || nextMilestone.status === 'DELAYED')) {
        dbStore.updateMilestone(projectId, nextMilestone.id, {
          status: 'IN_PROGRESS',
        });
      }
    }

    // Refresh project representation
    freshProj = dbStore.getProjectById(projectId);

    dbStore.updateProject(projectId, {
      status: allDone ? 'VERIFICATION_REQUIRED' : 'IN_PROGRESS',
      reworkRequiredMessage: undefined,
    });

    dbStore.updateWorkToken(project.workTokenId, {
      status: allDone ? 'VERIFICATION_REQUIRED' : 'ACTIVE',
    });

    dbStore.logAudit({
      actor: actor.name,
      actorRole: actor.role,
      action: 'OFFICIAL_MILESTONE_VERIFIED',
      entityType: 'INSPECTION',
      entityId: inspId,
      previousState: 'UNDER_REVIEW',
      newState: 'VERIFIED',
      reason: officialNotes || `Human official verified and approved milestone ${milestoneId}.`,
      correlationId: projectId,
    });

    dbStore.createNotification({
      targetRole: 'CONTRACTOR',
      targetUserId: project.contractorId,
      title: 'Milestone Verified by Official',
      message: `Project ${projectId}: Milestone ${milestoneId} verified and approved by Official ${actor.name}.`,
      entityId: projectId,
      entityType: 'PROJECT',
    });
  }

  res.json({
    success: true,
    data: {
      inspection,
      project: dbStore.getProjectById(projectId),
    },
  });
});

// Explicit endpoint for requiring rework
apiRouter.post('/official/rework/require', (req: Request, res: Response) => {
  const actor = getActorSession(req);
  const { projectId, milestoneId, reason } = req.body;

  const project = dbStore.getProjectById(projectId);
  if (!project) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
  }

  const updated = dbStore.updateProject(projectId, {
    status: 'DELAYED',
    reworkRequiredMessage: reason || 'Contractor must perform remediation according to PWD specifications.',
  });

  if (milestoneId) {
    dbStore.updateMilestone(projectId, milestoneId, {
      status: 'DELAYED',
      reworkNotes: reason,
    });
  }

  dbStore.logAudit({
    actor: actor.name,
    actorRole: actor.role,
    action: 'REWORK_REQUIRED_ISSUED',
    entityType: 'PROJECT',
    entityId: projectId,
    previousState: project.status,
    newState: 'DELAYED',
    reason: reason || 'Defects or milestone discrepancies noted.',
    correlationId: projectId,
  });

  res.json({ success: true, data: updated });
});

// Official Completion of Project
apiRouter.post('/projects/complete', (req: Request, res: Response) => {
  const actor = getActorSession(req);
  if (actor.role !== 'OFFICIAL') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only Government Officials can authorize project completion.' },
    });
  }

  const { projectId, finalNotes } = req.body;
  const project = dbStore.getProjectById(projectId);
  if (!project) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Project not found' },
    });
  }

  // Verify all milestones
  const allVerifiedMilestones = project.milestones.map((m) => ({
    ...m,
    status: 'VERIFIED' as const,
    completionPercentageClaimed: 100,
    completedDate: m.completedDate || new Date().toISOString().split('T')[0],
  }));

  const updated = dbStore.updateProject(projectId, {
    status: 'COMPLETED',
    completedAt: new Date().toISOString(),
    milestones: allVerifiedMilestones,
    officialReviewNotes: finalNotes || 'Full structural and aesthetic works certified as meeting standard specifications.',
    funding: {
      ...project.funding,
      expenditure: project.funding.contracted || project.funding.sanctioned,
      lastAuditDate: new Date().toISOString().split('T')[0],
    },
  });

  dbStore.updateWorkToken(project.workTokenId, {
    status: 'COMPLETED',
  });

  dbStore.updateRequest(project.requestId, {
    status: 'COMPLETED',
  });

  dbStore.logAudit({
    actor: actor.name,
    actorRole: actor.role,
    action: 'OFFICIAL_PROJECT_COMPLETED',
    entityType: 'PROJECT',
    entityId: projectId,
    previousState: project.status,
    newState: 'COMPLETED',
    reason: finalNotes || 'All engineering milestones verified and certified.',
    correlationId: projectId,
  });

  const request = dbStore.getRequestById(project.requestId);
  if (request) {
    dbStore.createNotification({
      targetRole: 'CITIZEN',
      targetUserId: request.citizenId,
      title: 'Your Reported Infrastructure Project is Completed!',
      message: `Great news! Work for "${request.title}" under Project ${projectId} is now 100% completed and officially verified.`,
      entityId: projectId,
      entityType: 'PROJECT',
    });
  }

  res.json({
    success: true,
    data: updated,
  });
});

// -------------------------------------------------------------
// PUBLIC TRANSPARENCY
// -------------------------------------------------------------
apiRouter.get('/transparency/projects', (req: Request, res: Response) => {
  const projects = dbStore.getProjects();
  // Sanitize for public: remove internal notes and citizen contact/PII
  const sanitized = projects.map((p) => {
    const wt = dbStore.getWorkTokenById(p.workTokenId);
    const reqItem = dbStore.getRequestById(p.requestId);
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      department: p.department,
      district: p.district,
      state: p.state,
      status: p.status,
      sanctionNumber: p.sanctionNumber,
      contractorName: p.contractorName,
      targetCompletionDate: p.targetCompletionDate,
      createdAt: p.createdAt,
      completedAt: p.completedAt,
      funding: {
        allocated: p.funding.allocated,
        sanctioned: p.funding.sanctioned,
        contracted: p.funding.contracted,
        expenditure: p.funding.expenditure,
        schemeSource: p.funding.schemeSource,
      },
      milestoneSummary: {
        total: p.milestones.length,
        verified: p.milestones.filter((m) => m.status === 'VERIFIED').length,
      },
      digitalThread: {
        workTokenId: p.workTokenId,
        citizenNeedCategory: reqItem?.aiAnalysis?.category || 'CIVIC_INFRASTRUCTURE',
        citizenLocation: reqItem?.location?.address || p.district,
        requestTitle: reqItem?.title,
      },
    };
  });

  res.json({
    success: true,
    data: sanitized,
  });
});

apiRouter.get('/transparency/projects/:id', (req: Request, res: Response) => {
  const queryId = req.params.id;
  let p = dbStore.getProjectById(queryId);
  if (!p) {
    // Also try matching by workTokenId
    const all = dbStore.getProjects();
    p = all.find((proj) => proj.workTokenId.toLowerCase() === queryId.toLowerCase());
  }

  if (!p) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Public civil works record not found for the specified ID.' },
    });
  }

  const wt = dbStore.getWorkTokenById(p.workTokenId);
  const reqItem = dbStore.getRequestById(p.requestId);
  const rawObservations = dbStore.getCommunityObservations(p.id);
  const evidenceList = dbStore.getEvidence({ projectId: p.id });
  const ngoTasks = dbStore.getNGOAssignments().filter((t) => t.projectId === p.id);

  // Public sanitized community observations (NO private citizen data)
  const sanitizedObservations = rawObservations.map((o) => ({
    id: o.id,
    projectId: o.projectId,
    submittedByName: o.submittedByName.includes('NGO')
      ? 'Independent Civic Auditor (Authorized NGO)'
      : 'Verified Resident (Local Ward)',
    comment: o.comment,
    photoUrl: o.photoUrl,
    timestamp: o.timestamp,
    divergenceSignal: o.divergenceSignal,
    provenance: 'COMMUNITY_VERIFICATION' as const,
  }));

  // Public sanitized NGO field audits
  const sanitizedNgoAudits = ngoTasks
    .filter((t) => t.report || (t.evidenceSubmissions && t.evidenceSubmissions.length > 0))
    .map((t) => ({
      taskId: t.id,
      ngoName: t.ngoName || 'Independent Civic Audit Network',
      purpose: t.purpose || 'Civic safety & quality verification',
      observation: t.report?.observationSummary || t.instructions || 'Site safety verified',
      rating: t.report?.groundTruthRating || 'HIGH_INTEGRITY',
      submittedAt: t.report?.submittedAt || t.assignedAt,
      officialReviewStatus: t.officialVerification?.status || 'PENDING',
    }));

  // Public sanitized evidence (photos & verified statuses only)
  const sanitizedEvidence = evidenceList.map((e) => ({
    id: e.id,
    milestoneId: e.milestoneId,
    mediaRefs: e.mediaRefs,
    description: e.description,
    status: e.status,
    submittedAt: e.submittedAt,
  }));

  const sanitized = {
    id: p.id,
    name: p.name,
    description: p.description,
    department: p.department,
    district: p.district,
    state: p.state,
    status: p.status,
    sanctionNumber: p.sanctionNumber,
    contractorName: p.contractorName || 'Class-1 Enlisted Lead Contractor',
    scopeOfWork: p.scopeOfWork,
    targetCompletionDate: p.targetCompletionDate,
    createdAt: p.createdAt,
    sanctionedAt: p.sanctionedAt,
    assignedAt: p.assignedAt,
    completedAt: p.completedAt,
    funding: p.funding,
    milestones: p.milestones,
    evidence: sanitizedEvidence,
    communityObservations: sanitizedObservations,
    ngoAudits: sanitizedNgoAudits,
    inspectionStatus:
      p.status === 'COMPLETED'
        ? 'Verified by Chief Engineer, PWD (100% Certified)'
        : p.status === 'DELAYED'
        ? 'Official Remediation Mandate in Effect (Re-inspection Scheduled)'
        : 'Milestone Progress Inspected',
    completionStatus:
      p.status === 'COMPLETED'
        ? 'Fully Certified Complete & Publicly Handed Over'
        : 'In Active Public Delivery',
    digitalThread: {
      workTokenId: p.workTokenId,
      workTokenSignature: wt?.digitalThreadSignature || 'WT-PUB-SIG-VERIFIED',
      workTokenIssuedAt: wt?.issuedAt,
      originatingRequestTitle: reqItem?.title || 'Citizen Infrastructure Demand',
      originatingLocation: reqItem?.location ? `${reqItem.location.address}, ${reqItem.location.district}` : p.district,
      problemCategory: reqItem?.aiAnalysis?.category || 'CIVIC_INFRASTRUCTURE',
    },
  };

  res.json({
    success: true,
    data: sanitized,
  });
});

// -------------------------------------------------------------
// COMMUNITY OBSERVATIONS & NGO
// -------------------------------------------------------------
apiRouter.post('/community/observations', (req: Request, res: Response) => {
  const actor = getActorSession(req);
  const { projectId, comment, photoUrl, divergenceSignal } = req.body;

  if (!projectId || !comment) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Project ID and comment are required.' },
    });
  }

  const obsId = `OBS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const obs: CommunityObservation = {
    id: obsId,
    projectId,
    submittedBy: actor.id,
    submittedByName: `${actor.name} (${actor.role === 'NGO' ? 'NGO Civic Monitor' : 'Local Citizen'})`,
    comment,
    photoUrl: photoUrl || undefined,
    timestamp: new Date().toISOString(),
    divergenceSignal: divergenceSignal || 'PROGRESSING_WELL',
    provenance: 'COMMUNITY_VERIFICATION',
  };

  dbStore.createCommunityObservation(obs);

  dbStore.logAudit({
    actor: actor.name,
    actorRole: actor.role,
    action: 'COMMUNITY_OBSERVATION_SUBMITTED',
    entityType: 'PROJECT',
    entityId: projectId,
    reason: `Citizen observation recorded: "${comment.slice(0, 60)}..." [Signal: ${obs.divergenceSignal}]`,
    correlationId: projectId,
  });

  res.json({
    success: true,
    data: obs,
  });
});

apiRouter.get('/ngo/assignments', (req: Request, res: Response) => {
  const actor = getActorSession(req);
  // Return all assignments visible to this NGO (assignments designated for them or open available civic tasks)
  const list = dbStore.getNGOAssignments();
  const visible = list.filter((a) => {
    if (a.isRestricted) return false;
    if (a.ngoId && actor.role === 'NGO' && a.ngoId !== actor.id) return false;
    return true;
  });
  res.json({
    success: true,
    data: visible,
  });
});

apiRouter.post('/ngo/tasks/:id/accept', (req: Request, res: Response) => {
  const actor = getActorSession(req);
  const taskId = req.params.id;
  const task = dbStore.getNGOAssignmentById(taskId);

  if (!task) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'NGO Task not found' } });
  }

  // Security policy: Do not allow NGOs to assign themselves to restricted government projects
  if (task.isRestricted) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Cannot assign self to restricted government infrastructure projects. Human administrative sanction required.' },
    });
  }

  const updated = dbStore.updateNGOAssignment(taskId, {
    status: 'ACCEPTED',
    ngoId: actor.id,
    ngoName: actor.organization || actor.name,
    assignedAt: new Date().toISOString(),
  });

  dbStore.logAudit({
    actor: actor.name,
    actorRole: 'NGO',
    action: 'NGO_TASK_ACCEPTED',
    entityType: 'NGO_TASK',
    entityId: taskId,
    previousState: task.status,
    newState: 'ACCEPTED',
    reason: `NGO accepted independent ground audit mandate for project ${task.projectId}`,
    correlationId: task.projectId,
  });

  dbStore.createNotification({
    targetRole: 'OFFICIAL',
    title: 'NGO Accepted Field Verification Task',
    message: `${actor.organization || actor.name} has accepted independent audit task ${taskId} for Project ${task.projectId}.`,
    entityId: task.projectId,
    entityType: 'PROJECT',
  });

  res.json({ success: true, data: updated });
});

apiRouter.post('/ngo/tasks/:id/decline', (req: Request, res: Response) => {
  const actor = getActorSession(req);
  const taskId = req.params.id;
  const { reason } = req.body;
  const task = dbStore.getNGOAssignmentById(taskId);

  if (!task) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'NGO Task not found' } });
  }

  const updated = dbStore.updateNGOAssignment(taskId, {
    status: 'DECLINED',
  });

  dbStore.logAudit({
    actor: actor.name,
    actorRole: 'NGO',
    action: 'NGO_TASK_DECLINED',
    entityType: 'NGO_TASK',
    entityId: taskId,
    previousState: task.status,
    newState: 'DECLINED',
    reason: reason || 'NGO declined task due to resource scheduling or geographic jurisdiction constraints',
    correlationId: task.projectId,
  });

  res.json({ success: true, data: updated });
});

apiRouter.post('/ngo/evidence', async (req: Request, res: Response) => {
  const actor = getActorSession(req);
  const {
    assignmentId,
    observation,
    description,
    photos,
    location,
    timestamp,
    groundTruthRating,
  } = req.body;

  if (!assignmentId || !observation || !description) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Assignment ID, observation, and description are required.' },
    });
  }

  const task = dbStore.getNGOAssignmentById(assignmentId);
  if (!task) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found.' } });
  }

  const project = dbStore.getProjectById(task.projectId);
  const formattedPhotos: Array<{ url: string; caption: string }> = Array.isArray(photos)
    ? photos.map((p: any) => (typeof p === 'string' ? { url: p, caption: 'Field ground photograph' } : p))
    : [];

  // Run AI analysis: Advisory intelligence only!
  const aiResult = await analyzeNGOEvidence({
    projectName: task.projectName || project?.name || 'Infrastructure Project',
    taskScope: task.taskScope,
    purpose: task.purpose || 'Civic safety & quality verification',
    observation,
    description,
    photosCount: formattedPhotos.length,
    groundTruthRating: groundTruthRating || 'MINOR_ISSUES',
  });

  const evidenceId = `NGO-EVD-${Date.now()}`;
  const submission: NGOEvidenceSubmission = {
    id: evidenceId,
    assignmentId,
    projectId: task.projectId,
    observation,
    description,
    photos: formattedPhotos,
    location: location || task.location || { address: 'Site Location', district: project?.district || 'Central Chennai' },
    timestamp: timestamp || new Date().toISOString(),
    submittedBy: actor.id,
    submittedByName: `${actor.organization || actor.name} (Authorized NGO Field Auditor)`,
    status: 'UNDER_REVIEW',
    groundTruthRating: groundTruthRating || aiResult.integrityRating,
    aiAnalysis: aiResult,
    officialReview: {
      status: 'ACCEPTED',
      officialName: 'Pending Official Review',
      notes: 'Submission received and placed in Official Inspection Queue. Human official decision pending.',
      reviewedAt: new Date().toISOString(),
    },
  };

  const existingSubmissions = task.evidenceSubmissions || [];
  const updatedTask = dbStore.updateNGOAssignment(assignmentId, {
    status: 'UNDER_REVIEW',
    report: {
      observationSummary: observation,
      groundTruthRating: submission.groundTruthRating || 'HIGH_INTEGRITY',
      submittedAt: new Date().toISOString(),
    },
    evidenceSubmissions: [submission, ...existingSubmissions],
  });

  // Attach as community observation on the project
  dbStore.createCommunityObservation({
    id: `OBS-NGO-${Date.now()}`,
    projectId: task.projectId,
    submittedBy: actor.id,
    submittedByName: `${actor.organization || actor.name} (Independent Civic Audit)`,
    comment: `[Independent NGO Ground Verification - ${submission.groundTruthRating}]: ${observation}`,
    photoUrl: formattedPhotos[0]?.url,
    timestamp: new Date().toISOString(),
    divergenceSignal: submission.groundTruthRating === 'SEVERE_DISCREPANCY' ? 'POOR_QUALITY' : 'PROGRESSING_WELL',
    provenance: 'COMMUNITY_VERIFICATION',
  });

  dbStore.logAudit({
    actor: actor.name,
    actorRole: 'NGO',
    action: 'NGO_EVIDENCE_SUBMITTED',
    entityType: 'NGO_TASK',
    entityId: assignmentId,
    previousState: task.status,
    newState: 'UNDER_REVIEW',
    reason: `Independent ground truth evidence submitted. AI Rating: ${aiResult.integrityRating}. Queued for official human inspection.`,
    correlationId: task.projectId,
  });

  dbStore.createNotification({
    targetRole: 'OFFICIAL',
    title: 'New NGO Field Audit Evidence Submitted',
    message: `${actor.organization || actor.name} submitted ground truth evidence for ${task.projectName}. Rating: ${submission.groundTruthRating}.`,
    entityId: task.projectId,
    entityType: 'PROJECT',
  });

  res.json({
    success: true,
    data: {
      task: updatedTask,
      submission,
    },
  });
});

apiRouter.post('/ngo/report', (req: Request, res: Response) => {
  const actor = getActorSession(req);
  const { taskId, observationSummary, groundTruthRating } = req.body;

  const task = dbStore.getNGOAssignmentById(taskId);
  if (!task) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'NGO Task not found' } });
  }

  const updated = dbStore.updateNGOAssignment(taskId, {
    status: 'REPORT_SUBMITTED',
    report: {
      observationSummary,
      groundTruthRating: groundTruthRating || 'HIGH_INTEGRITY',
      submittedAt: new Date().toISOString(),
    },
  });

  // Also record as a community observation on the project
  dbStore.createCommunityObservation({
    id: `OBS-NGO-${Date.now()}`,
    projectId: task.projectId,
    submittedBy: actor.id,
    submittedByName: `${actor.organization || actor.name} (Authorized NGO Audit)`,
    comment: `[Independent NGO Audit]: ${observationSummary}`,
    timestamp: new Date().toISOString(),
    divergenceSignal: groundTruthRating === 'SEVERE_DISCREPANCY' ? 'POOR_QUALITY' : 'PROGRESSING_WELL',
    provenance: 'COMMUNITY_VERIFICATION',
  });

  dbStore.logAudit({
    actor: actor.name,
    actorRole: 'NGO',
    action: 'NGO_GROUND_VERIFICATION_SUBMITTED',
    entityType: 'NGO_TASK',
    entityId: taskId,
    reason: `NGO filed ground truth verification. Rating: ${groundTruthRating}`,
    correlationId: task.projectId,
  });

  res.json({ success: true, data: updated });
});

// -------------------------------------------------------------
// POLICYMAKER INTELLIGENCE & DECISION-SUPPORT
// -------------------------------------------------------------
apiRouter.get('/policymaker/intelligence', (req: Request, res: Response) => {
  const projects = dbStore.getProjects();
  const requests = dbStore.getRequests();
  const tokens = dbStore.getWorkTokens();
  const evidence = dbStore.getEvidence();
  const observations = dbStore.getCommunityObservations();
  const ngoTasks = dbStore.getNGOAssignments();

  // Grand fiscal aggregates
  const totalAllocated = projects.reduce((sum, p) => sum + (p.funding.allocated || 0), 0);
  const totalSanctioned = projects.reduce((sum, p) => sum + (p.funding.sanctioned || 0), 0);
  const totalContracted = projects.reduce((sum, p) => sum + (p.funding.contracted || 0), 0);
  const totalExpenditure = projects.reduce((sum, p) => sum + (p.funding.expenditure || 0), 0);
  const remainingFunds = totalAllocated - totalExpenditure;

  const delayedProjectsList = projects.filter((p) => p.status === 'DELAYED');
  const activeProjects = projects.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'VERIFICATION_REQUIRED');
  const completedProjects = projects.filter((p) => p.status === 'COMPLETED');

  // Multi-source Evidence Divergence Cases
  const divergenceCases = evidence
    .filter((e) => e.aiVerification?.status === 'POTENTIAL_DISCREPANCY')
    .map((evid) => {
      const prj = projects.find((p) => p.id === evid.projectId);
      const prjObservations = observations.filter((o) => o.projectId === evid.projectId);
      const prjNgoTasks = ngoTasks.filter((t) => t.projectId === evid.projectId);

      return {
        id: `DIV-${evid.id}`,
        projectId: evid.projectId,
        projectName: prj?.name || 'Infrastructure Project',
        milestoneId: evid.milestoneId,
        milestoneTitle: prj?.milestones.find((m) => m.id === evid.milestoneId)?.title || 'Milestone Execution',
        contractorEvidence: {
          claimedPercentage: evid.claimedProgress,
          contractorName: evid.submittedByName,
          description: evid.description,
          photoUrl: evid.mediaRefs[0]?.url,
          timestamp: evid.submittedAt,
        },
        communityObservations: prjObservations.map((o) => ({
          author: o.submittedByName,
          comment: o.comment,
          timestamp: o.timestamp,
          divergenceSignal: o.divergenceSignal,
        })),
        ngoAudits: prjNgoTasks.map((t) => ({
          ngoName: t.ngoName,
          observation: t.report?.observationSummary || t.instructions || 'Field audit recorded',
          groundTruthRating: t.report?.groundTruthRating || 'MINOR_ISSUES',
          timestamp: t.report?.submittedAt || t.assignedAt,
        })),
        aiComparison: {
          status: 'POTENTIAL_DISCREPANCY' as const,
          confidence: evid.aiVerification?.confidence || 0.94,
          summary: evid.aiVerification?.summary || 'Potential discrepancy detected between contractor claims and physical ground evidence.',
          divergenceFlags: evid.aiVerification?.divergenceFlags || [
            'Loose aggregate subgrade without bitumen binder',
            'Shoulder compaction non-compliant with IRC standards',
          ],
          modelUsed: evid.aiVerification?.modelUsed || 'gemini-3.1-flash-lite (Gemini AI Vision & Evidence Analyzer)',
          disclaimer: 'Advisory analysis: neutral indicator for official engineering verification.',
        },
        officialInspection: {
          inspectorName: 'K. Ramanathan (Chief Engineer, PWD)',
          decision: 'REWORK_REQUIRED',
          notes: prj?.reworkRequiredMessage || 'Sub-base compaction and asphalt paver laying mandated before payment release.',
          inspectedAt: '2026-09-23T11:45:00Z',
        },
      };
    });

  // Regional Intelligence Aggregates (Aggregated counts, strictly NO personal citizen data)
  const regionsConfig = [
    {
      district: 'Central Chennai',
      primaryNeed: 'Stormwater Drainage & Arterial Surface Re-engineering',
      topCategory: 'ROAD_INFRASTRUCTURE',
    },
    {
      district: 'Coimbatore North & Urban',
      primaryNeed: 'Industrial Freight Link & Underground Drainage Outfalls',
      topCategory: 'WATER_SUPPLY',
    },
    {
      district: 'Madurai East Corridor',
      primaryNeed: 'Suburban Water Mains & Flood Barrier Protection',
      topCategory: 'BRIDGE_CULVERT',
    },
    {
      district: 'Salem Urban & Highways',
      primaryNeed: 'Pedestrian Safe Passages & Intersection Signalization',
      topCategory: 'LIGHTING',
    },
  ];

  const regionalIntelligence = regionsConfig.map((cfg) => {
    const regProjects = projects.filter((p) => p.district.toLowerCase().includes(cfg.district.split(' ')[0].toLowerCase()));
    const regRequests = requests.filter((r) =>
      (r.location?.address && r.location.address.toLowerCase().includes(cfg.district.split(' ')[0].toLowerCase())) ||
      (r.location?.district && r.location.district.toLowerCase().includes(cfg.district.split(' ')[0].toLowerCase()))
    );

    const regAllocated = regProjects.reduce((sum, p) => sum + (p.funding.allocated || 0), 0) || 5200000;
    const regExp = regProjects.reduce((sum, p) => sum + (p.funding.expenditure || 0), 0) || 1200000;
    const regDelayed = regProjects.filter((p) => p.status === 'DELAYED').length;

    return {
      district: cfg.district,
      totalRequests: Math.max(regRequests.length, 3),
      openRequests: Math.max(regRequests.filter((r) => r.status !== 'COMPLETED').length, 2),
      resolvedRequests: Math.max(regRequests.filter((r) => r.status === 'COMPLETED').length, 1),
      totalProjects: Math.max(regProjects.length, 1),
      activeProjects: Math.max(regProjects.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'VERIFICATION_REQUIRED').length, 1),
      delayedProjects: regDelayed,
      completedProjects: regProjects.filter((p) => p.status === 'COMPLETED').length,
      allocatedFunds: regAllocated,
      expenditure: regExp,
      absorptionRate: regAllocated > 0 ? (regExp / regAllocated) * 100 : 25,
      serviceGapCount: regDelayed > 0 ? 2 : 1,
      primaryNeed: cfg.primaryNeed,
      topCategory: cfg.topCategory,
    };
  });

  // Constituency Intelligence (Strict non-partisan development metrics. NO voter profiling, NO citizen ranking, NO election predictions)
  const constituencyIntelligence = [
    {
      constituencyId: 'TN-AC-118',
      constituencyName: 'Coimbatore North Assembly Constituency',
      region: 'Western Tamil Nadu Circle',
      authorizedCircle: 'Coimbatore Municipal Corporation & Highways Div',
      infrastructureIndex: 82,
      activeCapitalProjectsCount: 2,
      totalSanctionedAmount: 6400000,
      expenditureAmount: 2850000,
      roadQualityScore: 78,
      drainageResilienceIndex: 71,
      civicGrievancesCount: 14,
      reworkCasesCount: 0,
      developmentStatus: 'STABLE_PROGRESS' as const,
      recentMilestones: [
        'Avinashi Road flyover service lane resurfacing completed',
        'Singanallur lake feeder canal de-silting underway',
      ],
      isVoterData: false as const,
      isElectoralPrediction: false as const,
      isCitizenRanking: false as const,
    },
    {
      constituencyId: 'TN-AC-014',
      constituencyName: 'Central Chennai Urban Circle',
      region: 'Chennai Metropolitan Development Area',
      authorizedCircle: 'PWD Highways & Greater Chennai Corp Circle',
      infrastructureIndex: 74,
      activeCapitalProjectsCount: 2,
      totalSanctionedAmount: 9300000,
      expenditureAmount: 4700000,
      roadQualityScore: 68,
      drainageResilienceIndex: 62,
      civicGrievancesCount: 28,
      reworkCasesCount: 1,
      developmentStatus: 'ATTENTION_REQUIRED' as const,
      recentMilestones: [
        'Anna Salai Arterial Highway pothole restoration certified complete',
        'Gandhi Nagar Sector 3 storm drain widening under rework notice',
      ],
      isVoterData: false as const,
      isElectoralPrediction: false as const,
      isCitizenRanking: false as const,
    },
    {
      constituencyId: 'TN-AC-189',
      constituencyName: 'Madurai East Urban & Suburban',
      region: 'Southern Infrastructure Circle',
      authorizedCircle: 'PWD Madurai South & Smart Cities Cell',
      infrastructureIndex: 86,
      activeCapitalProjectsCount: 1,
      totalSanctionedAmount: 3800000,
      expenditureAmount: 2100000,
      roadQualityScore: 84,
      drainageResilienceIndex: 80,
      civicGrievancesCount: 9,
      reworkCasesCount: 0,
      developmentStatus: 'THRIVING' as const,
      recentMilestones: [
        'Vaigai Riverfront storm bund reinforcement milestone 1 approved',
        'Suburban ring road LED streetlighting cluster commissioned',
      ],
      isVoterData: false as const,
      isElectoralPrediction: false as const,
      isCitizenRanking: false as const,
    },
    {
      constituencyId: 'TN-AC-088',
      constituencyName: 'Salem Urban & Steel Ring',
      region: 'Salem Highway Infrastructure Corridor',
      authorizedCircle: 'Salem City Municipal Corporation Division',
      infrastructureIndex: 69,
      activeCapitalProjectsCount: 1,
      totalSanctionedAmount: 4500000,
      expenditureAmount: 1100000,
      roadQualityScore: 64,
      drainageResilienceIndex: 58,
      civicGrievancesCount: 19,
      reworkCasesCount: 1,
      developmentStatus: 'ATTENTION_REQUIRED' as const,
      recentMilestones: [
        'Hasthampatti junction traffic island redesign sanctioned',
        'Lechler road drainage outfall scoping finalized',
      ],
      isVoterData: false as const,
      isElectoralPrediction: false as const,
      isCitizenRanking: false as const,
    },
  ];

  // Delayed Projects formatted with SLA & Root cause
  const delayedProjects = delayedProjectsList.map((p) => ({
    id: p.id,
    name: p.name,
    department: p.department,
    district: p.district,
    sanctionNumber: p.sanctionNumber,
    status: p.status,
    targetCompletionDate: p.targetCompletionDate,
    daysOverdue: 7,
    slaRisk: 'HIGH' as const,
    reworkRequired: true,
    reworkReason: p.reworkRequiredMessage || 'Uncompacted base and missing bituminous wearing coat.',
    hasEvidenceDivergence: true,
    contractorName: p.contractorName,
    expenditure: p.funding.expenditure,
    sanctioned: p.funding.sanctioned,
  }));

  // Funding Intelligence data (PFMS prototype/sandbox)
  const fundingAggregate = {
    allocated: totalAllocated,
    sanctioned: totalSanctioned,
    contracted: totalContracted,
    expenditure: totalExpenditure,
    remaining: remainingFunds,
    sanctionRatio: totalAllocated > 0 ? (totalSanctioned / totalAllocated) * 100 : 89.6,
    absorptionRate: totalContracted > 0 ? (totalExpenditure / totalContracted) * 100 : 36.6,
    schemeBreakdown: [
      {
        scheme: 'Urban Infrastructure Development Fund (UIDF)',
        budgetHead: 'PWD-CAP-URBAN-915',
        allocated: 5200000,
        sanctioned: 4800000,
        expenditure: 1200000,
        absorptionRate: 25.0,
      },
      {
        scheme: 'Pradhan Mantri Gram Sadak Yojana (PMGSY - Phase III)',
        budgetHead: 'PWD-CAP-INFRA-800',
        allocated: 5700000,
        sanctioned: 4500000,
        expenditure: 3500000,
        absorptionRate: 77.8,
      },
      {
        scheme: 'State Disaster Mitigation Fund (NDMF - Culverts)',
        budgetHead: 'PWD-EMERGENCY-BRIDGES-402',
        allocated: 4500000,
        sanctioned: 4500000,
        expenditure: 350000,
        absorptionRate: 7.8,
      },
    ],
    isSimulatedFiscalData: true,
    provenanceSource: 'PFMS Integration Simulator (Public Finance Management System Sandbox)',
  };

  // Service Gaps (Areas where citizen requests & infrastructure reveal gaps)
  const serviceGaps = [
    {
      id: 'GAP-001',
      title: 'Ward 14 West Cross Stormwater Outfall Inadequacy',
      category: 'WATER_SUPPLY',
      location: 'Gandhi Nagar Sector 3 to Buckingham Feeder',
      district: 'Central Chennai',
      severity: 'HIGH' as const,
      unaddressedCitizenReportsCount: 4,
      estimatedCitizenImpact: '1,400+ residents & 2 primary schools',
      aiEvidencePattern: 'High recurring citizen waterlogging reports during mild precipitation (under 25mm/hr). Current roadside drain lacks hydraulic gradient to discharge into main canal.',
      recommendedPolicyAction: 'Sanction emergency Phase 2 box-culvert connection under AMRUT Stormwater Drainage Scheme.',
      confidence: 0.95,
      modelUsed: 'gemini-3.1-flash-lite (Civic Gap Detector)',
    },
    {
      id: 'GAP-002',
      title: 'Tambaram-Velachery Arterial Bridge Scour & Load Limitation',
      category: 'BRIDGE_CULVERT',
      location: 'Velachery Link Road (KM 14/2)',
      district: 'Central Chennai',
      severity: 'CRITICAL' as const,
      unaddressedCitizenReportsCount: 3,
      estimatedCitizenImpact: '35,000+ daily arterial commuters & freight trailers',
      aiEvidencePattern: 'Severe sub-structure concrete spalling and scour around pier foundations. Citizen report REQ-DEMO-003 flagged deep fissure; tender currently pending contractor award.',
      recommendedPolicyAction: 'Authorize fast-track emergency tendering with 10-day bid window under State Disaster Mitigation Fund.',
      confidence: 0.96,
      modelUsed: 'gemini-3.1-flash-lite (Civic Gap Detector)',
    },
    {
      id: 'GAP-003',
      title: 'Coimbatore North Peripheral Freight Corridor Surface Degradation',
      category: 'ROAD_INFRASTRUCTURE',
      location: 'Thudiyalur to Saravanampatti Ring Road',
      district: 'Coimbatore North & Urban',
      severity: 'MEDIUM' as const,
      unaddressedCitizenReportsCount: 6,
      estimatedCitizenImpact: 'Industrial park transport & 8,000 daily two-wheelers',
      aiEvidencePattern: 'Citizen reports indicate rapid edge break and rutting from heavy commercial vehicles exceeding 25-tonne axle load limits.',
      recommendedPolicyAction: 'Commission pavement structural deflection test (Benkelman Beam) prior to preparing FY2027 Capital Budget.',
      confidence: 0.92,
      modelUsed: 'gemini-3.1-flash-lite (Civic Gap Detector)',
    },
  ];

  // Lifecycle stage metrics
  const lifecycleStages = [
    {
      stage: 'Requests' as const,
      totalCount: requests.length,
      activeCount: requests.filter((r) => r.status !== 'COMPLETED').length,
      avgTurnaroundDays: 1.8,
      slaAdherenceRate: 94,
      statusColor: 'sky',
    },
    {
      stage: 'Work Tokens' as const,
      totalCount: tokens.length,
      activeCount: tokens.filter((t) => t.status !== 'COMPLETED').length,
      avgTurnaroundDays: 2.1,
      slaAdherenceRate: 96,
      statusColor: 'indigo',
    },
    {
      stage: 'Projects' as const,
      totalCount: projects.length,
      activeCount: projects.filter((p) => p.status !== 'COMPLETED').length,
      avgTurnaroundDays: 4.5,
      slaAdherenceRate: 88,
      statusColor: 'purple',
    },
    {
      stage: 'Execution' as const,
      totalCount: projects.length,
      activeCount: projects.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'DELAYED').length,
      avgTurnaroundDays: 18.2,
      slaAdherenceRate: 72,
      bottleneckFlag: 'Subgrade Compaction & Material Quality Rework',
      statusColor: 'amber',
    },
    {
      stage: 'Verification' as const,
      totalCount: evidence.length + ngoTasks.length,
      activeCount: evidence.filter((e) => e.status !== 'VERIFIED').length,
      avgTurnaroundDays: 1.2,
      slaAdherenceRate: 98,
      statusColor: 'teal',
    },
    {
      stage: 'Completion' as const,
      totalCount: completedProjects.length,
      activeCount: 0,
      avgTurnaroundDays: 3.0,
      slaAdherenceRate: 95,
      statusColor: 'emerald',
    },
  ];

  // Category demand aggregates
  const categoryDemand: Record<string, number> = {};
  requests.forEach((r) => {
    const cat = r.aiAnalysis?.category || 'ROAD_INFRASTRUCTURE';
    categoryDemand[cat] = (categoryDemand[cat] || 0) + 1;
  });

  res.json({
    success: true,
    data: {
      metrics: {
        totalRequests: requests.length,
        totalWorkTokens: tokens.length,
        totalProjects: projects.length,
        activeProjectsCount: activeProjects.length,
        delayedProjectsCount: delayedProjectsList.length,
        completedProjectsCount: completedProjects.length,
        divergenceCount: divergenceCases.length,
      },
      fundingAggregate,
      regionalIntelligence,
      constituencyIntelligence,
      projects,
      delayedProjects,
      divergenceCases,
      serviceGaps,
      lifecycleStages,
      categoryDemand,
      aiLifecycleInsights: [
        {
          title: 'Infrastructure Integrity & Quality Bottlenecks',
          summary: 'Quality divergence detected in 1 out of 3 active road widening projects where aggregate base thickness was not compliant prior to asphalt coating.',
          recommendation: 'Mandate independent NGO ground audits before sanctioning Milestone 2 contractor payments.',
          urgency: 'MEDIUM' as const,
          confidence: 0.94,
          modelUsed: 'gemini-3.1-flash-lite',
        },
        {
          title: 'Urgent Bridge & Culvert Structural Vulnerability',
          summary: 'Critical culvert fissure identified on Tambaram-Velachery arterial link. Tender processing recommended for fast-track micro-piling.',
          recommendation: 'Release contingency allocation from State Disaster Mitigation Fund (NDMF).',
          urgency: 'CRITICAL' as const,
          confidence: 0.96,
          modelUsed: 'gemini-3.1-flash-lite',
        },
        {
          title: 'Pre-Monsoon Stormwater Drainage Preparedness',
          summary: 'Analysis of recurring citizen grievance clusters indicates localized backwater inundation around low-lying school perimeter zones.',
          recommendation: 'Direct Municipal PWD engineers to execute preventative desilting within next 10 business days.',
          urgency: 'HIGH' as const,
          confidence: 0.91,
          modelUsed: 'gemini-3.1-flash-lite',
        },
      ],
    },
  });
});

apiRouter.post('/policymaker/query', async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Query string is required.' },
    });
  }

  const projects = dbStore.getProjects();
  const requests = dbStore.getRequests();
  const evidence = dbStore.getEvidence();

  const contextSummary = `
Active Projects: ${projects.map((p) => `${p.id} (${p.name}, Status: ${p.status}, Sanctioned: INR ${(p.funding.sanctioned / 100000).toFixed(1)} Lakhs, Expenditure: INR ${(p.funding.expenditure / 100000).toFixed(1)} Lakhs)`).join('; ')}
Total Citizen Grievances: ${requests.length} (Roads: ${requests.filter((r) => r.aiAnalysis?.category === 'ROAD_INFRASTRUCTURE').length}, Bridges: ${requests.filter((r) => r.aiAnalysis?.category === 'BRIDGE_CULVERT').length})
Delayed Projects: ${projects.filter((p) => p.status === 'DELAYED').map((p) => `${p.id} (${p.name} - Rework Notice: ${p.reworkRequiredMessage})`).join('; ') || 'None'}
Evidence Divergence Cases: ${evidence.filter((e) => e.aiVerification?.status === 'POTENTIAL_DISCREPANCY').length} active discrepancy flags.
  `.trim();

  const response = await queryPolicymakerIntelligence({
    query,
    contextSummary,
  });

  res.json({
    success: true,
    data: response,
  });
});

apiRouter.post('/ai/assistant', async (req: Request, res: Response) => {
  try {
    const actor = getActorSession(req);
    const { query, currentRoute, selectedLanguage, assistantLanguage, conversationHistory, authorizedRecordId } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Query string is required.' },
      });
    }

    // Assemble Authorized Database Context based on role
    let databaseContext = '';
    const userId = actor.id;

    if (actor.role === 'CITIZEN') {
      const requests = dbStore.getRequests({ citizenId: userId });
      const activeRequestsSummary = requests.map(r => 
        `- Request ID: ${r.id}, Title: "${r.title}", Status: "${r.status}"${r.workTokenId ? `, Work Token ID: ${r.workTokenId}` : ''}${r.projectId ? `, Project ID: ${r.projectId}` : ''}`
      ).join('\n');
      databaseContext = `CITIZEN PROFILE:
Name: ${actor.name}
Home Jurisdiction: ${actor.jurisdiction || 'Tamil Nadu'}
Your Submitted Active Infrastructure Complaints/Requests:
${activeRequestsSummary || 'No requests submitted yet.'}`;
    } else if (actor.role === 'OFFICIAL') {
      const requests = dbStore.getRequests();
      const projects = dbStore.getProjects();
      databaseContext = `OFFICIAL PROFILE:
Name: ${actor.name}
Department: ${actor.department}
Authority Scope: ${actor.authorityScope}
Outstanding Triage Queue: ${requests.filter(r => r.status === 'SUBMITTED').length} pending citizen requests.
Active Sanctioned Projects: ${projects.filter(p => p.status === 'IN_PROGRESS' || p.status === 'DELAYED').length} projects in execution.`;
    } else if (actor.role === 'CONTRACTOR') {
      const projects = dbStore.getProjects({ contractorId: userId });
      const summary = projects.map(p => 
        `- Project ID: ${p.id}, Title: "${p.name}", Status: "${p.status}", Sanctioned Budget: INR ${p.funding.sanctioned.toLocaleString()}`
      ).join('\n');
      databaseContext = `CONTRACTOR PROFILE:
Firm Name: ${actor.organization || actor.name}
Your Active Awarded Civil Construction Projects:
${summary || 'No active projects assigned.'}`;
    } else if (actor.role === 'NGO') {
      const assignments = dbStore.getNGOAssignments();
      const summaries = assignments.map(a => 
        `- Assignment ID: ${a.id}, Project ID: ${a.projectId}, Purpose: "${a.purpose}", Status: "${a.status}"`
      ).join('\n');
      databaseContext = `INDEPENDENT NGO CIVIC AUDITOR:
Organization: ${actor.organization || actor.name}
Your Ground Truth Auditing Tasks:
${summaries || 'No open auditing assignments.'}`;
    } else if (actor.role === 'POLICYMAKER') {
      const projects = dbStore.getProjects();
      databaseContext = `POLICYMAKER PROFILE:
Name: ${actor.name}
Role-based Authority Scope: State capital budget optimization & infrastructure quality audit monitoring.
Active Monitored Assets: ${projects.length} statewide construction works.`;
    } else {
      // Public / Anonymous
      const projects = dbStore.getProjects();
      databaseContext = `PUBLIC TRANSPARENCY CONTEXT:
Sanitized Public Civil Works Ledgers:
${projects.map(p => `- Project: "${p.name}" (${p.district}), Status: "${p.status}", Contractor: "${p.contractorName || 'TBD'}"`).join('\n')}`;
    }

    // Check for specific authorized record detail search
    if (authorizedRecordId) {
      if (actor.role === 'CITIZEN') {
        const r = dbStore.getRequestById(authorizedRecordId);
        if (r && r.citizenId === userId) {
          databaseContext += `\n\nSELECTED COMPLAINT CURRENT RECORD DETAILS:\nID: ${r.id}\nTitle: "${r.title}"\nStatus: ${r.status}\nCreated: ${r.createdAt}\nAI Classification: Category ${r.aiAnalysis?.category || 'Roads'}, Severity: ${r.aiAnalysis?.severity || 'HIGH'}\nWork Token: ${r.workTokenId || 'None yet'}\nProject Linked: ${r.projectId || 'None yet'}`;
        }
      } else if (actor.role === 'OFFICIAL' || actor.role === 'POLICYMAKER') {
        const p = dbStore.getProjectById(authorizedRecordId);
        if (p) {
          databaseContext += `\n\nSELECTED PROJECT CURRENT RECORD DETAILS:\nID: ${p.id}\nTitle: "${p.name}"\nStatus: ${p.status}\nDepartment: ${p.department}\nDistrict: ${p.district}\nSanctioned Budget: INR ${p.funding.sanctioned.toLocaleString()}\nExpenditure to Date: INR ${p.funding.expenditure.toLocaleString()}\nScope: "${p.scopeOfWork}"`;
        }
      }
    }

    const response = await queryCivicAssistant({
      query,
      userRole: actor.role,
      userName: actor.name,
      currentRoute: currentRoute || 'Home',
      selectedLanguage: selectedLanguage || 'en',
      assistantLanguage,
      conversationHistory,
      databaseContext,
    });

    res.json({
      success: true,
      data: response,
    });
  } catch (err: any) {
    console.error('Error in Civic Assistant API:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message || 'Civic Assistant failed to respond' },
    });
  }
});

apiRouter.post('/ai/translate', async (req: Request, res: Response) => {
  try {
    const { text, targetLanguage } = req.body;
    if (!text || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Text and targetLanguage are required.' },
      });
    }

    // Check cache
    const cached = dbStore.getCachedTranslation(text, targetLanguage);
    if (cached) {
      return res.json({
        success: true,
        data: { text: cached, fromCache: true },
      });
    }

    // Call Gemini to translate
    const translated = await translateText({ text, targetLanguage });

    // Store in cache
    dbStore.setCachedTranslation(text, targetLanguage, translated);

    res.json({
      success: true,
      data: { text: translated, fromCache: false },
    });
  } catch (err: any) {
    console.error('Error translating text:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message || 'Translation failed' },
    });
  }
});

apiRouter.get('/audit', (req: Request, res: Response) => {
  const entityId = req.query.entityId as string;
  const events = dbStore.getAuditEvents(entityId);
  res.json({
    success: true,
    data: events,
  });
});

apiRouter.get('/notifications', (req: Request, res: Response) => {
  const actor = getActorSession(req);
  const notifs = dbStore.getNotifications(actor.role, actor.id);
  res.json({
    success: true,
    data: notifs,
  });
});

apiRouter.post('/notifications/:id/read', (req: Request, res: Response) => {
  const ok = dbStore.markNotificationRead(req.params.id);
  res.json({ success: ok });
});

// Admin endpoints
apiRouter.post('/admin/users/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  const user = dbStore.getUserById(req.params.id);
  if (user) {
    dbStore.updateUser(req.params.id, {
      identityReference: status, // Store status in identityReference field for simple toggling
    });
    // Log audit
    dbStore.logAudit({
      actor: 'Platform Admin',
      actorRole: 'ADMIN',
      action: 'ADMIN_USER_STATUS_TOGGLED',
      entityType: 'USER',
      entityId: req.params.id,
      newState: status,
      reason: `Admin updated user status to ${status}.`,
      correlationId: req.params.id,
    });
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: { message: 'User not found' } });
  }
});

apiRouter.post('/admin/audit/log', (req: Request, res: Response) => {
  const { action, targetUserId, targetRole } = req.body;
  dbStore.logAudit({
    actor: 'Platform Admin',
    actorRole: 'ADMIN',
    action: action || 'ADMIN_ACTION',
    entityType: 'USER',
    entityId: targetUserId,
    newState: targetRole,
    reason: `Admin impersonation started for user ${targetUserId} as role ${targetRole}.`,
    correlationId: targetUserId,
  });
  res.json({ success: true });
});

apiRouter.post('/system/reset', (req: Request, res: Response) => {
  const fresh = dbStore.resetToSeed();
  res.json({
    success: true,
    message: 'Database reset to initial seeded golden records.',
    data: {
      requestCount: fresh.requests.length,
      projectCount: fresh.projects.length,
      tokenCount: fresh.workTokens.length,
    },
  });
});
