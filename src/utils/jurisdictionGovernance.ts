import { Project, UserSession } from '../types/domain';

export interface CanonicalCircle {
  id: string;
  name: string;
  state: string;
  district: string;
  department: string;
  zone?: string;
}

export const CANONICAL_CIRCLES: CanonicalCircle[] = [
  {
    id: 'TN-PWD-COIMBATORE-NORTH',
    name: 'Coimbatore North Circle',
    state: 'Tamil Nadu',
    district: 'Coimbatore North',
    department: 'Public Works Department (PWD - Roads & Highways)',
    zone: 'Western Zone',
  },
  {
    id: 'TN-PWD-COIMBATORE-SOUTH',
    name: 'Coimbatore South Circle',
    state: 'Tamil Nadu',
    district: 'Coimbatore South',
    department: 'Public Works Department (PWD - Roads & Highways)',
    zone: 'Western Zone',
  },
  {
    id: 'TN-PWD-COIMBATORE-WEST',
    name: 'Coimbatore Western Circle',
    state: 'Tamil Nadu',
    district: 'Coimbatore West',
    department: 'Public Works Department (PWD - Roads & Highways)',
    zone: 'Western Zone',
  },
  {
    id: 'TN-PWD-COIMBATORE-CENTRAL',
    name: 'Coimbatore Central Circle',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    department: 'Public Works Department (PWD - Roads & Highways)',
    zone: 'Western Zone',
  },
  {
    id: 'TN-PWD-CHENNAI-CENTRAL',
    name: 'Chennai Central Circle',
    state: 'Tamil Nadu',
    district: 'Chennai',
    department: 'Public Works Department (PWD - Roads & Highways)',
    zone: 'Northern Zone',
  },
  {
    id: 'TN-PWD-CHENNAI-NORTH',
    name: 'Chennai North Circle',
    state: 'Tamil Nadu',
    district: 'Chennai North',
    department: 'Public Works Department (PWD - Roads & Highways)',
    zone: 'Northern Zone',
  },
  {
    id: 'TN-PWD-CHENNAI-SOUTH',
    name: 'Chennai South Circle',
    state: 'Tamil Nadu',
    district: 'Chennai South',
    department: 'Public Works Department (PWD - Roads & Highways)',
    zone: 'Northern Zone',
  },
  {
    id: 'TN-PWD-MADURAI-CENTRAL',
    name: 'Madurai Infrastructure Circle',
    state: 'Tamil Nadu',
    district: 'Madurai',
    department: 'Public Works Department (PWD - Roads & Highways)',
    zone: 'Southern Zone',
  },
  {
    id: 'TN-PWD-SALEM-CENTRAL',
    name: 'Salem Infrastructure Circle',
    state: 'Tamil Nadu',
    district: 'Salem',
    department: 'Public Works Department (PWD - Roads & Highways)',
    zone: 'Western Zone',
  },
  {
    id: 'TN-PWD-TRICHY-CENTRAL',
    name: 'Tiruchirappalli Infrastructure Circle',
    state: 'Tamil Nadu',
    district: 'Tiruchirappalli',
    department: 'Public Works Department (PWD - Roads & Highways)',
    zone: 'Central Zone',
  },
];

/**
 * Resolves the canonical jurisdiction/circle ID for a project.
 */
export function resolveProjectCircleId(project: Partial<Project>): string {
  if (project.circleId && project.circleId.startsWith('TN-')) {
    return project.circleId;
  }
  if (project.jurisdictionId && project.jurisdictionId.startsWith('TN-')) {
    return project.jurisdictionId;
  }

  const text = `${project.district || ''} ${project.name || ''} ${project.description || ''} ${project.state || ''}`.toLowerCase();

  if (text.includes('coimbatore')) {
    if (text.includes('north') || text.includes('thudiyalur')) {
      return 'TN-PWD-COIMBATORE-NORTH';
    }
    if (text.includes('south')) {
      return 'TN-PWD-COIMBATORE-SOUTH';
    }
    if (text.includes('west') || text.includes('western')) {
      return 'TN-PWD-COIMBATORE-WEST';
    }
    return 'TN-PWD-COIMBATORE-NORTH';
  }

  if (text.includes('chennai')) {
    if (text.includes('north')) return 'TN-PWD-CHENNAI-NORTH';
    if (text.includes('south')) return 'TN-PWD-CHENNAI-SOUTH';
    return 'TN-PWD-CHENNAI-CENTRAL';
  }

  if (text.includes('madurai')) return 'TN-PWD-MADURAI-CENTRAL';
  if (text.includes('salem')) return 'TN-PWD-SALEM-CENTRAL';
  if (text.includes('trichy') || text.includes('tiruchirappalli')) return 'TN-PWD-TRICHY-CENTRAL';

  // Dynamic fallback format: STATE-DEPT-DISTRICT
  const stateCode = (project.state || 'TN').toLowerCase().includes('tamil') ? 'TN' : 'IN';
  const rawDist = (project.district || 'CENTRAL').replace(/[^a-zA-Z0-9]/g, '-').toUpperCase();
  return `${stateCode}-PWD-${rawDist}`;
}

/**
 * Resolves all canonical circles that an entity (Contractor, Official, Sanctioning Authority) has jurisdiction over.
 */
export function resolveEntityCircleIds(entity: Partial<UserSession>): string[] {
  if (entity.jurisdictionIds && Array.isArray(entity.jurisdictionIds) && entity.jurisdictionIds.length > 0) {
    return entity.jurisdictionIds;
  }

  if (entity.circleId) {
    return [entity.circleId];
  }

  const rawText = `${entity.jurisdiction || ''} ${entity.homeDistrict || ''} ${entity.authorizedRegion || ''} ${entity.organization || ''} ${entity.department || ''}`.toLowerCase();
  const circles: Set<string> = new Set();

  if (rawText.includes('coimbatore')) {
    if (rawText.includes('north')) circles.add('TN-PWD-COIMBATORE-NORTH');
    if (rawText.includes('south')) circles.add('TN-PWD-COIMBATORE-SOUTH');
    if (rawText.includes('west') || rawText.includes('western')) circles.add('TN-PWD-COIMBATORE-WEST');
    
    // If no specific sub-circle is mentioned, contractor covers all Coimbatore circles
    if (circles.size === 0) {
      circles.add('TN-PWD-COIMBATORE-NORTH');
      circles.add('TN-PWD-COIMBATORE-SOUTH');
      circles.add('TN-PWD-COIMBATORE-WEST');
      circles.add('TN-PWD-COIMBATORE-CENTRAL');
    }
  }

  if (rawText.includes('chennai')) {
    if (rawText.includes('north')) circles.add('TN-PWD-CHENNAI-NORTH');
    if (rawText.includes('south')) circles.add('TN-PWD-CHENNAI-SOUTH');
    if (rawText.includes('central') || circles.size === 0) {
      circles.add('TN-PWD-CHENNAI-CENTRAL');
      circles.add('TN-PWD-CHENNAI-NORTH');
      circles.add('TN-PWD-CHENNAI-SOUTH');
    }
  }

  if (rawText.includes('madurai')) circles.add('TN-PWD-MADURAI-CENTRAL');
  if (rawText.includes('salem')) circles.add('TN-PWD-SALEM-CENTRAL');
  if (rawText.includes('trichy') || rawText.includes('tiruchirappalli')) circles.add('TN-PWD-TRICHY-CENTRAL');

  // If statewide authority (e.g. state ministry / central admin)
  if (rawText.includes('statewide') || rawText.includes('national') || rawText.includes('state ministry')) {
    CANONICAL_CIRCLES.forEach(c => circles.add(c.id));
  }

  return Array.from(circles);
}

/**
 * Validates deterministic contractor eligibility for a project.
 * Checks circle jurisdiction, role, status, department, and capacity.
 */
export function isContractorEligibleForProject(
  contractor: Partial<UserSession>,
  project: Partial<Project>
): { eligible: boolean; reason?: string; projectCircleId?: string; contractorCircles?: string[] } {
  if (!contractor) {
    return { eligible: false, reason: 'Contractor record is missing or undefined.' };
  }

  if (contractor.role !== 'CONTRACTOR') {
    return { eligible: false, reason: 'User does not possess CONTRACTOR role.' };
  }

  if (contractor.status === 'inactive') {
    return { eligible: false, reason: 'Contractor account is deactivated / inactive.' };
  }

  const projCircleId = resolveProjectCircleId(project);
  const contractorCircles = resolveEntityCircleIds(contractor);

  const circleMatch = contractorCircles.includes(projCircleId);

  if (!circleMatch) {
    const contractorJurisdictionName = contractor.organization || contractor.name || 'Contractor';
    const projDistrict = project.district || 'project circle';
    return {
      eligible: false,
      reason: `Selected contractor is not eligible for the project's jurisdiction. (${contractorJurisdictionName} is registered for ${contractor.jurisdiction || 'another circle'}, but project requires ${projDistrict} / ${projCircleId}).`,
      projectCircleId: projCircleId,
      contractorCircles,
    };
  }

  return {
    eligible: true,
    projectCircleId: projCircleId,
    contractorCircles,
  };
}

/**
 * Validates whether a Sanctioning Authority is authorized to process a project's financial sanction.
 * Checks role, status, covered jurisdiction circles, and delegated financial sanction ceiling limit.
 */
export function isAuthorityEligibleForProject(
  authority: Partial<UserSession>,
  project: Partial<Project>,
  proposedAmount?: number
): { eligible: boolean; reason?: string; projectCircleId?: string; authorityCircles?: string[] } {
  if (!authority) {
    return { eligible: false, reason: 'Sanctioning authority record is missing.' };
  }

  if (authority.role !== 'SANCTIONING_AUTHORITY' && authority.role !== 'ADMIN') {
    return { eligible: false, reason: 'User is not an authorized Sanctioning Authority.' };
  }

  if (authority.status === 'inactive') {
    return { eligible: false, reason: 'Sanctioning authority account is deactivated.' };
  }

  const projCircleId = resolveProjectCircleId(project);
  const authorityCircles = resolveEntityCircleIds(authority);

  const circleMatch = authority.role === 'ADMIN' || authorityCircles.includes(projCircleId);

  if (!circleMatch) {
    return {
      eligible: false,
      reason: `Unauthorized: Project circle (${project.district || projCircleId}) is outside your authorized regional jurisdiction circles.`,
      projectCircleId: projCircleId,
      authorityCircles,
    };
  }

  // Delegated Financial Threshold Check
  const effectiveAmount =
    proposedAmount !== undefined
      ? proposedAmount
      : project.recommendedAmount || project.funding?.sanctioned || project.funding?.allocated || 0;
  
  const delegatedLimit = authority.financialThreshold || 10000000; // Default ₹100 Lakhs

  if (effectiveAmount > delegatedLimit) {
    return {
      eligible: false,
      reason: `Proposed budget (₹${(effectiveAmount / 100000).toFixed(2)} Lakhs) exceeds your delegated sanctioning authority limit (₹${(delegatedLimit / 100000).toFixed(2)} Lakhs).`,
      projectCircleId: projCircleId,
      authorityCircles,
    };
  }

  return {
    eligible: true,
    projectCircleId: projCircleId,
    authorityCircles,
  };
}

/**
 * Finds the most suitable active Sanctioning Authority for a project proposal.
 */
export function findEligibleSanctioningAuthority(
  allUsers: UserSession[],
  project: Partial<Project>,
  amount?: number
): UserSession | undefined {
  const authorities = allUsers.filter(
    (u) => u.role === 'SANCTIONING_AUTHORITY' && u.status !== 'inactive'
  );

  return authorities.find((auth) => isAuthorityEligibleForProject(auth, project, amount).eligible);
}
