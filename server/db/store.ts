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
  ProjectTender,
  TenderQuote,
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
  tenders?: ProjectTender[];
  quotes?: TenderQuote[];
  translationsCache?: Record<string, string>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'cfc_store.json');

// The application starts with primary administrative and sanctioning accounts
export const DEFAULT_ADMIN: UserSession = {
  id: 'admin-001',
  name: 'System Administrator',
  email: 'admin@gov.in',
  role: 'ADMIN',
  designation: 'Central Platform Administrator',
  jurisdiction: 'National & State Infrastructure Operations',
  department: 'Ministry of Infrastructure & Digital Public Works',
  authorityScope: 'Comprehensive DPI governance: user provisioning, role-based access management, platform audit auditing, policy enforcement, secure persona preview.',
  permissions: [
    'ADMIN_ACCESS',
    'USER_MANAGEMENT',
    'PROVISION_ACCOUNTS',
    'VIEW_ALL_RECORDS',
    'AUDIT_PLATFORM',
    'ADMIN_PERSONA_PREVIEW',
    'SYSTEM_CONFIG'
  ],
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  phone: '+91 94440 00001',
  primaryLanguage: 'en',
  status: 'active',
  password: 'admin',
};

export const DEFAULT_SANCTIONER: UserSession = {
  id: 'sanctioner-01',
  name: 'Shri K. R. Ramanathan, IAS',
  email: 'sanctioner@gov.in',
  role: 'SANCTIONING_AUTHORITY',
  designation: 'Principal Sanctioning Officer & Financial Commissioner',
  jurisdiction: 'Coimbatore & Western Circle',
  department: 'Finance & Treasury Sanctioning Department',
  authorityScope: 'Final authority for financial sanction, treasury authorization, and contractor award confirmation up to ₹1,00,00,000.',
  financialThreshold: 10000000,
  permissions: [
    'REVIEW_SANCTION_QUEUE',
    'APPROVE_FINANCIAL_SANCTION',
    'RETURN_FOR_REVISION',
    'REJECT_SANCTION',
    'ESTABLISH_SANCTIONED_AMOUNT',
    'AUTHORIZE_TREASURY_RELEASE'
  ],
  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  phone: '+91 94440 00002',
  primaryLanguage: 'en',
  status: 'active',
  password: 'sanctioner',
  homeDistrict: 'Coimbatore',
  homeState: 'Tamil Nadu',
};

export function createCleanDatabase(): DatabaseSchema {
  return {
    users: [{ ...DEFAULT_ADMIN }, { ...DEFAULT_SANCTIONER }],
    requests: [],
    workTokens: [],
    projects: [],
    evidence: [],
    inspections: [],
    communityObservations: [],
    ngoAssignments: [],
    tenders: [],
    quotes: [],
    auditEvents: [
      {
        id: `AUDIT-INIT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: DEFAULT_ADMIN.name,
        actorRole: 'ADMIN',
        actorId: DEFAULT_ADMIN.id,
        actorName: DEFAULT_ADMIN.name,
        action: 'PLATFORM_INITIALIZED',
        entityType: 'PLATFORM',
        entityId: 'SYS-INIT',
        details: 'JanDrishti platform initialized with clean operational database and central administrator account.',
        reason: 'Initial clean system bootstrap',
        correlationId: 'SYS-INIT',
      }
    ],
    notifications: [
      {
        id: `NOTIF-INIT-${Date.now()}`,
        targetRole: 'ADMIN',
        targetUserId: 'admin-001',
        title: 'Platform Initialized',
        message: 'Welcome to JanDrishti. Proceed to User Management in the Admin Workspace to provision real operational stakeholders.',
        entityId: 'SYS-INIT',
        entityType: 'PLATFORM',
        read: false,
        createdAt: new Date().toISOString(),
      }
    ],
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
        if (parsed && Array.isArray(parsed.users)) {
          // Ensure default admin and sanctioner exist
          if (!parsed.users.some((u: UserSession) => u.role === 'ADMIN' || u.id === 'admin-001')) {
            parsed.users.unshift({ ...DEFAULT_ADMIN });
          }
          if (!parsed.users.some((u: UserSession) => u.role === 'SANCTIONING_AUTHORITY' || u.id === 'sanctioner-01')) {
            parsed.users.push({ ...DEFAULT_SANCTIONER });
          }
          if (!Array.isArray(parsed.requests)) parsed.requests = [];
          if (!Array.isArray(parsed.workTokens)) parsed.workTokens = [];
          if (!Array.isArray(parsed.projects)) parsed.projects = [];
          if (!Array.isArray(parsed.evidence)) parsed.evidence = [];
          if (!Array.isArray(parsed.inspections)) parsed.inspections = [];
          if (!Array.isArray(parsed.communityObservations)) parsed.communityObservations = [];
          if (!Array.isArray(parsed.ngoAssignments)) parsed.ngoAssignments = [];
          if (!Array.isArray(parsed.auditEvents)) parsed.auditEvents = [];
          if (!Array.isArray(parsed.notifications)) parsed.notifications = [];
          
          return parsed as DatabaseSchema;
        }
      }
    } catch (err) {
      console.warn('[DatabaseStore] Could not read persisted file, initializing clean database:', err);
    }

    const clean = createCleanDatabase();
    this.saveData(clean);
    return clean;
  }

  private saveData(dataToSave?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DatabaseStore] Failed to write database to disk:', err);
    }
  }

  public resetToClean(): DatabaseSchema {
    this.data = createCleanDatabase();
    this.saveData();
    return this.data;
  }

  // --- Users & Identity ---
  public getUsers(): UserSession[] {
    return this.data.users;
  }

  public getActiveUsers(): UserSession[] {
    return this.data.users.filter((u) => u.status !== 'inactive');
  }

  public getUserById(id: string): UserSession | undefined {
    if (!id) return undefined;
    return this.data.users.find((u) => u.id.toLowerCase() === id.toLowerCase());
  }

  public getUserByEmail(email: string): UserSession | undefined {
    if (!email) return undefined;
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: UserSession): UserSession {
    const existingIndex = this.data.users.findIndex(
      (u) => u.id.toLowerCase() === user.id.toLowerCase() || u.email.toLowerCase() === user.email.toLowerCase()
    );
    if (existingIndex >= 0) {
      this.data.users[existingIndex] = { ...this.data.users[existingIndex], ...user };
    } else {
      this.data.users.push(user);
    }
    this.saveData();
    return user;
  }

  public updateUser(id: string, updates: Partial<UserSession>): UserSession | undefined {
    const idx = this.data.users.findIndex((u) => u.id.toLowerCase() === id.toLowerCase());
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
      list = list.filter((r) => r.citizenId.toLowerCase() === filters.citizenId!.toLowerCase());
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
      list = list.filter((p) => p.contractorId && p.contractorId.toLowerCase() === filters.contractorId!.toLowerCase());
    }
    if (filters?.department) {
      list = list.filter((p) => p.department.toLowerCase().includes(filters.department!.toLowerCase()));
    }
    if (filters?.status) {
      list = list.filter((p) => p.status === filters.status);
    }
    // Enforce dynamic arithmetic on every record: remaining = allocated - expenditure
    list.forEach(p => {
      if (p.funding) {
        p.funding.remaining = (p.funding.allocated || 0) - (p.funding.expenditure || 0);
      }
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getProjectById(id: string): Project | undefined {
    const p = this.data.projects.find((p) => p.id === id);
    if (p && p.funding) {
      p.funding.remaining = (p.funding.allocated || 0) - (p.funding.expenditure || 0);
    }
    return p;
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
      list = list.filter((a) => a.ngoId.toLowerCase() === ngoId.toLowerCase());
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

  public logAudit(event: Partial<AuditEvent>): AuditEvent {
    const actorName = event.actor || event.actorName || 'System';
    const actorRole = event.actorRole || 'ADMIN';
    const audit: AuditEvent = {
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      actor: actorName,
      actorRole: actorRole,
      actorId: event.actorId,
      actorName: event.actorName,
      action: event.action || 'AUDIT_LOG',
      entityType: (event.entityType as any) || 'PLATFORM',
      entityId: event.entityId || 'SYS',
      reason: event.reason || event.details || '',
      correlationId: event.correlationId || event.entityId || 'CORR',
      details: event.details,
      adminId: event.adminId,
      targetUserId: event.targetUserId,
      targetRole: event.targetRole,
      amount: event.amount,
      decision: event.decision,
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
        if (userId && n.targetUserId && n.targetUserId.toLowerCase() === userId.toLowerCase()) return true;
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

  // --- Tenders ---
  public getTenders(): ProjectTender[] {
    if (!this.data.tenders) this.data.tenders = [];
    return this.data.tenders;
  }

  public getTenderById(id: string): ProjectTender | undefined {
    return this.getTenders().find((t) => t.id === id);
  }

  public getTenderByProjectId(projectId: string): ProjectTender | undefined {
    return this.getTenders().find((t) => t.projectId === projectId);
  }

  public createTender(tender: ProjectTender): ProjectTender {
    if (!this.data.tenders) this.data.tenders = [];
    this.data.tenders.push(tender);
    this.saveData();
    return tender;
  }

  public updateTender(id: string, update: Partial<ProjectTender>): ProjectTender | undefined {
    if (!this.data.tenders) this.data.tenders = [];
    const idx = this.data.tenders.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    this.data.tenders[idx] = {
      ...this.data.tenders[idx],
      ...update,
    };
    this.saveData();
    return this.data.tenders[idx];
  }

  // --- Contractor Quotes / Bids ---
  public getQuotes(filters?: { tenderId?: string; projectId?: string; contractorId?: string }): TenderQuote[] {
    if (!this.data.quotes) this.data.quotes = [];
    let list = this.data.quotes;
    if (filters?.tenderId) {
      list = list.filter((q) => q.tenderId === filters.tenderId);
    }
    if (filters?.projectId) {
      list = list.filter((q) => q.projectId === filters.projectId);
    }
    if (filters?.contractorId) {
      list = list.filter((q) => q.contractorId === filters.contractorId);
    }
    return list;
  }

  public getQuoteById(id: string): TenderQuote | undefined {
    return this.getQuotes().find((q) => q.id === id);
  }

  public createQuote(quote: TenderQuote): TenderQuote {
    if (!this.data.quotes) this.data.quotes = [];
    this.data.quotes.push(quote);
    this.saveData();
    return quote;
  }

  public updateQuote(id: string, update: Partial<TenderQuote>): TenderQuote | undefined {
    if (!this.data.quotes) this.data.quotes = [];
    const idx = this.data.quotes.findIndex((q) => q.id === id);
    if (idx === -1) return undefined;
    this.data.quotes[idx] = {
      ...this.data.quotes[idx],
      ...update,
    };
    this.saveData();
    return this.data.quotes[idx];
  }
}

export const dbStore = new DatabaseStore();
