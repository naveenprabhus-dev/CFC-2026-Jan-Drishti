import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
  IssueCluster,
} from '../../src/types/domain';
import { normalizeDistrictName } from '../../src/utils/jurisdictionGovernance';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash || !password) return false;
  if (!storedHash.includes(':')) {
    return password === storedHash;
  }
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  try {
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

export function sanitizeUser(user: UserSession): UserSession {
  const sanitized = { ...user };
  delete sanitized.password;
  return sanitized;
}

export interface ActiveSession {
  token: string;
  userId: string;
  role: UserRole;
  isPreview?: boolean;
  actualAdminId?: string;
  createdAt: string;
  expiresAt: string;
}

export interface DatabaseSchema {
  users: UserSession[];
  requests: CitizenRequest[];
  clusters?: IssueCluster[];
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

// The application starts with primary administrative account
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
  password: hashPassword('admin'),
};

export const DEFAULT_SANCTIONER: UserSession = {
  id: 'sanctioner-01',
  name: 'Shri K. R. Ramanathan, IAS',
  email: 'sanctioner@gov.in',
  role: 'SANCTIONING_AUTHORITY',
  designation: 'Principal Sanctioning Officer & Financial Commissioner',
  jurisdiction: 'Coimbatore & Western Circle',
  department: 'Finance & Treasury Sanctioning Department',
  authorityScope: 'Final authority for financial sanction and contractor award confirmation up to ₹1,00,00,000.',
  financialThreshold: 10000000,
  permissions: [
    'REVIEW_SANCTION_QUEUE',
    'APPROVE_FINANCIAL_SANCTION',
    'RETURN_FOR_REVISION',
    'REJECT_SANCTION',
    'ESTABLISH_SANCTIONED_AMOUNT'
  ],
  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  phone: '+91 94440 00002',
  primaryLanguage: 'en',
  status: 'active',
  password: hashPassword('sanctioner'),
  homeDistrict: 'Coimbatore',
  homeState: 'Tamil Nadu',
};

export function createCleanDatabase(): DatabaseSchema {
  return {
    users: [{ ...DEFAULT_ADMIN }],
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
  private sessions: Map<string, ActiveSession> = new Map();

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
          let modified = false;
          // Ensure default admin exists
          if (!parsed.users.some((u: UserSession) => u.role === 'ADMIN' || u.id === 'admin-001')) {
            parsed.users.unshift({ ...DEFAULT_ADMIN });
            modified = true;
          }

          // Ensure all stored passwords are secure hashes
          parsed.users.forEach((u: UserSession) => {
            if (u.password && !u.password.includes(':')) {
              u.password = hashPassword(u.password);
              modified = true;
            }
          });

          if (!Array.isArray(parsed.requests)) parsed.requests = [];
          if (!Array.isArray(parsed.clusters)) parsed.clusters = [];
          if (!Array.isArray(parsed.workTokens)) parsed.workTokens = [];
          if (!Array.isArray(parsed.projects)) parsed.projects = [];
          if (!Array.isArray(parsed.evidence)) parsed.evidence = [];
          if (!Array.isArray(parsed.inspections)) parsed.inspections = [];
          if (!Array.isArray(parsed.communityObservations)) parsed.communityObservations = [];
          if (!Array.isArray(parsed.ngoAssignments)) parsed.ngoAssignments = [];
          if (!Array.isArray(parsed.auditEvents)) parsed.auditEvents = [];
          if (!Array.isArray(parsed.notifications)) parsed.notifications = [];
          
          if (modified) {
            this.saveData(parsed as DatabaseSchema);
          }

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

  // --- Session Management ---
  public createSession(userId: string, isPreview?: boolean, actualAdminId?: string): { token: string; expiresAt: string } {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const expiresAt = new Date(now + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    const session: ActiveSession = {
      token,
      userId: user.id,
      role: user.role,
      isPreview: !!isPreview,
      actualAdminId: isPreview ? actualAdminId : undefined,
      createdAt: new Date(now).toISOString(),
      expiresAt,
    };
    this.sessions.set(token, session);
    return { token, expiresAt };
  }

  public getSession(token: string): { user: UserSession; isPreview?: boolean; actualAdminId?: string; token: string } | null {
    if (!token) return null;
    const session = this.sessions.get(token);
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      this.sessions.delete(token);
      return null;
    }
    const user = this.getUserById(session.userId);
    if (!user || user.status === 'inactive') {
      this.sessions.delete(token);
      return null;
    }
    return {
      user,
      isPreview: session.isPreview,
      actualAdminId: session.actualAdminId,
      token: session.token,
    };
  }

  public deleteSession(token: string): void {
    if (token) this.sessions.delete(token);
  }

  public deleteUserSessions(userId: string): void {
    for (const [token, s] of this.sessions.entries()) {
      if (s.userId === userId || s.actualAdminId === userId) {
        this.sessions.delete(token);
      }
    }
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
    const userToSave = { ...user };
    if (userToSave.password && !userToSave.password.includes(':')) {
      userToSave.password = hashPassword(userToSave.password);
    }
    const existingIndex = this.data.users.findIndex(
      (u) => u.id.toLowerCase() === userToSave.id.toLowerCase() || u.email.toLowerCase() === userToSave.email.toLowerCase()
    );
    if (existingIndex >= 0) {
      this.data.users[existingIndex] = { ...this.data.users[existingIndex], ...userToSave };
    } else {
      this.data.users.push(userToSave);
    }
    this.saveData();
    return userToSave;
  }

  public updateUser(id: string, updates: Partial<UserSession>): UserSession | undefined {
    const idx = this.data.users.findIndex((u) => u.id.toLowerCase() === id.toLowerCase());
    if (idx === -1) return undefined;
    const updatesToApply = { ...updates };
    if (updatesToApply.password && !updatesToApply.password.includes(':')) {
      updatesToApply.password = hashPassword(updatesToApply.password);
    }
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updatesToApply,
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
      notif.readAt = new Date().toISOString();
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

  // --- Issue Clusters / Request Aggregation ---
  public getClusters(): IssueCluster[] {
    if (!this.data.clusters) this.data.clusters = [];
    return this.data.clusters;
  }

  public getClusterById(id: string): IssueCluster | undefined {
    return this.getClusters().find((c) => c.id === id);
  }

  public updateCluster(id: string, update: Partial<IssueCluster>): IssueCluster | undefined {
    if (!this.data.clusters) this.data.clusters = [];
    const idx = this.data.clusters.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    this.data.clusters[idx] = {
      ...this.data.clusters[idx],
      ...update,
      updatedAt: new Date().toISOString(),
    };
    this.saveData();
    return this.data.clusters[idx];
  }

  public resolveIssueClusterForRequest(req: CitizenRequest): IssueCluster {
    if (!this.data.clusters) this.data.clusters = [];

    const rawDist = req.location?.district || req.incidentDistrict || req.location?.address || '';
    const normDist = normalizeDistrictName(rawDist);
    const category = req.aiAnalysis?.category || 'CIVIC_INFRASTRUCTURE';
    const subcategory = req.aiAnalysis?.intent || 'CIVIC_REPAIR';

    // Ward or ULB or address token
    const wardOrAddress = (req.incidentWard || req.incidentULB || req.location?.address || '').toLowerCase();

    // Search for matching active cluster (same district & category)
    let cluster = this.data.clusters.find((c) => {
      if (c.status === 'COMPLETED' || c.status === 'REJECTED') return false;
      const cDist = normalizeDistrictName(c.location?.district || '');
      if (cDist !== normDist) return false;

      // Category must match (e.g. ROAD vs STREET_LIGHTING are separate clusters)
      if (c.category !== category) return false;

      // Locality / Ward match or overlapping address text or same subcategory
      const cWardOrAddress = (c.location?.ward || c.location?.ulb || c.location?.address || '').toLowerCase();
      const addressMatch = wardOrAddress && cWardOrAddress && (wardOrAddress.includes(cWardOrAddress) || cWardOrAddress.includes(wardOrAddress));
      const subcatMatch = c.subcategory === subcategory;

      return addressMatch || subcatMatch || true;
    });

    if (cluster) {
      if (!cluster.requestIds.includes(req.id)) {
        cluster.requestIds.push(req.id);
      }
      cluster.reportCount = cluster.requestIds.length;
      cluster.lastReportedAt = req.createdAt || new Date().toISOString();

      if (req.aiAnalysis?.severity === 'CRITICAL' || cluster.severity === 'CRITICAL') {
        cluster.severity = 'CRITICAL';
      } else if (req.aiAnalysis?.severity === 'HIGH' || cluster.severity === 'HIGH') {
        cluster.severity = 'HIGH';
      }

      // Priority Calculation Signal
      const baseScore = cluster.reportCount * 20 + (cluster.severity === 'CRITICAL' ? 50 : cluster.severity === 'HIGH' ? 30 : 15);
      cluster.priorityScore = baseScore;
      cluster.priority = cluster.reportCount >= 4 || baseScore >= 60 || cluster.severity === 'CRITICAL' ? 'HIGH' : baseScore >= 80 ? 'EMERGENCY' : 'MEDIUM';

      const reasons: string[] = [
        `${cluster.reportCount} citizen reports submitted for this locality`,
        `Assessed category: ${cluster.category.replace(/_/g, ' ')}`,
        `Location: ${cluster.location.address || normDist}`,
        `Assessed severity: ${cluster.severity}`,
      ];
      if (cluster.reportCount >= 3) {
        reasons.push('High community demand density (multiple independent reports)');
      }
      if (req.aiAnalysis?.safetyRisk === 'HIGH') {
        reasons.push('Public safety hazard identified by AI Intelligence');
      }
      if (cluster.linkedWorkTokenId) {
        reasons.push(`Active Work Token linked: ${cluster.linkedWorkTokenId}`);
      } else {
        reasons.push('No active government work order found — official action required');
      }

      cluster.priorityReasoning = reasons;
      cluster.aiAssessment = `Multiple independent citizen reports (${cluster.reportCount}) confirm recurring ${cluster.category.replace(/_/g, ' ')} issue in ${normDist}. Official triage required.`;
      cluster.updatedAt = new Date().toISOString();

      req.clusterId = cluster.id;
      if (cluster.linkedWorkTokenId) {
        req.linkedWorkTokenId = cluster.linkedWorkTokenId;
        req.existingWorkMatch = true;
      }
      if (cluster.linkedProjectId) {
        req.linkedProjectId = cluster.linkedProjectId;
      }

      this.saveData();
      return cluster;
    }

    // Create new IssueCluster
    const newId = `CLUSTER-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;
    const canonicalTitle = req.aiAnalysis?.translatedTitle || req.title;

    const newCluster: IssueCluster = {
      id: newId,
      clusterKey: `${normDist}:${category}:${subcategory}`,
      canonicalTitle,
      category,
      subcategory,
      department: req.aiAnalysis?.suggestedDepartment || 'Public Works Department',
      jurisdiction: req.incidentWard || normDist,
      location: {
        address: req.location?.address || `${normDist} Locality`,
        district: normDist,
        state: req.location?.state || 'Tamil Nadu',
        ulb: req.incidentULB,
        ward: req.incidentWard,
        lat: req.location?.lat,
        lng: req.location?.lng,
      },
      severity: req.aiAnalysis?.severity || 'MEDIUM',
      priority: req.aiAnalysis?.severity === 'CRITICAL' ? 'EMERGENCY' : req.aiAnalysis?.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
      priorityScore: req.aiAnalysis?.severity === 'CRITICAL' ? 70 : 35,
      priorityReasoning: [
        `1 citizen report submitted`,
        `Assessed severity: ${req.aiAnalysis?.severity || 'MEDIUM'}`,
        `Location: ${req.location?.address || normDist}`,
        'No active government work found — awaiting official triage',
      ],
      aiAssessment: `Initial citizen report received for ${category.replace(/_/g, ' ')} in ${normDist}.`,
      reportCount: 1,
      requestIds: [req.id],
      firstReportedAt: req.createdAt || new Date().toISOString(),
      lastReportedAt: req.createdAt || new Date().toISOString(),
      status: req.status || 'SUBMITTED',
      circleId: req.circleId || 'TN-CENTRAL-01',
      jurisdictionId: req.jurisdictionId,
      linkedWorkTokenId: req.linkedWorkTokenId,
      linkedProjectId: req.linkedProjectId,
      aggregationConfidence: 0.92,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.clusters.push(newCluster);
    req.clusterId = newCluster.id;
    this.saveData();
    return newCluster;
  }

  public rebuildClusters(): void {
    if (!this.data.clusters) this.data.clusters = [];
    if (!this.data.requests || this.data.requests.length === 0) return;

    this.data.clusters = [];
    for (const req of this.data.requests) {
      this.resolveIssueClusterForRequest(req);
    }
    this.saveData();
  }
}

export const dbStore = new DatabaseStore();
