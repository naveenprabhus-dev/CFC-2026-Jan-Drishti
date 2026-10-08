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

export function normalizeLanguageCode(lang?: string): string {
  if (!lang) return 'en';
  const l = lang.toLowerCase().trim();
  if (l === 'ta' || l.includes('tamil') || l.includes('தமிழ்')) return 'ta';
  if (l === 'hi' || l.includes('hindi') || l.includes('हिन्दी')) return 'hi';
  if (l === 'ml' || l.includes('malayalam') || l.includes('മലയാളം')) return 'ml';
  if (l === 'te' || l.includes('telugu') || l.includes('తెలుగు')) return 'te';
  if (l === 'kn' || l.includes('kannada') || l.includes('ಕನ್ನಡ')) return 'kn';
  return 'en';
}

export function normalizeStateName(state?: string): string {
  if (!state || !state.trim()) return '';
  const s = state.toLowerCase().trim().replace(/[-_]/g, ' ');
  const clean = s.replace(/[^a-z0-9]/g, '');

  if (clean === 'tn' || clean === 'tamilnadu' || s.includes('tamil nadu') || s.includes('தமிழ்நாடு') || s.includes('तमिलनाडु')) {
    return 'Tamil Nadu';
  }
  if (clean === 'mh' || clean === 'maharashtra' || s.includes('महाराष्ट्र')) {
    return 'Maharashtra';
  }
  if (clean === 'ka' || clean === 'karnataka' || s.includes('कर्नाटक') || s.includes('ಕರ್ನಾಟಕ')) {
    return 'Karnataka';
  }
  if (clean === 'kl' || clean === 'kerala' || s.includes('केरल') || s.includes('കേരളം')) {
    return 'Kerala';
  }
  if (clean === 'ap' || clean === 'andhrapradesh' || s.includes('andhra') || s.includes('ఆంధ్రప్రదేశ్')) {
    return 'Andhra Pradesh';
  }
  if (clean === 'up' || clean === 'uttarpradesh' || s.includes('उत्तर प्रदेश')) {
    return 'Uttar Pradesh';
  }
  if (clean === 'dl' || clean === 'delhi' || s.includes('दिल्ली')) {
    return 'Delhi';
  }

  return state.trim();
}

export function normalizeDistrictName(dist?: string): string {
  if (!dist || !dist.trim()) return '';
  const d = dist.toLowerCase().trim();

  // Coimbatore
  if (
    d.includes('coimbatore') ||
    d.includes('கோயம்புத்தூர்') ||
    d.includes('கோவை') ||
    d.includes('कोयंबटूर') ||
    d.includes('കോയമ്പത്തൂർ') ||
    d.includes('కోయంబత్తూర్') ||
    d.includes('ಕೊಯಮತ್ತೂರು')
  ) {
    if (d.includes('north') || d.includes('வடக்கு') || d.includes('उत्तर') || d.includes('വടക്കൻ') || d.includes('ఉత్తర') || d.includes('ಉತ್ತರ')) {
      return 'Coimbatore North';
    }
    if (d.includes('south') || d.includes('தெற்கு') || d.includes('दक्षिण') || d.includes('തെക്കൻ') || d.includes('దక్షిణ') || d.includes('ದಕ್ಷಿಣ')) {
      return 'Coimbatore South';
    }
    if (d.includes('west') || d.includes('மேற்கு') || d.includes('पश्चिम') || d.includes('പടിഞ്ഞാറൻ') || d.includes('పశ్చిమ') || d.includes('ಪಶ್ಚಿಮ')) {
      return 'Coimbatore West';
    }
    return 'Coimbatore';
  }

  // Chennai
  if (
    d.includes('chennai') ||
    d.includes('madras') ||
    d.includes('சென்னை') ||
    d.includes('चेन्नई') ||
    d.includes('ചെന്നൈ') ||
    d.includes('చెన్నై') ||
    d.includes('ಚೆನ್ನೈ')
  ) {
    if (d.includes('north') || d.includes('வட') || d.includes('उत्तर') || d.includes('വടക്കൻ') || d.includes('ఉత్తర') || d.includes('ಉತ್ತರ')) {
      return 'Chennai North';
    }
    if (d.includes('south') || d.includes('தென்') || d.includes('दक्षिण') || d.includes('തെക്കൻ') || d.includes('దక్షిణ') || d.includes('ದಕ್ಷಿಣ')) {
      return 'Chennai South';
    }
    return 'Chennai';
  }

  // Madurai
  if (
    d.includes('madurai') ||
    d.includes('மதுரை') ||
    d.includes('मदुरै') ||
    d.includes('മധുര') ||
    d.includes('మదురై') ||
    d.includes('ಮದುರೈ')
  ) {
    return 'Madurai';
  }

  // Salem
  if (
    d.includes('salem') ||
    d.includes('சேலம்') ||
    d.includes('सेलम') ||
    d.includes('സേലം') ||
    d.includes('సేలం') ||
    d.includes('ಸೇಲಂ')
  ) {
    return 'Salem';
  }

  // Tiruchirappalli / Trichy
  if (
    d.includes('trichy') ||
    d.includes('tiruchirappalli') ||
    d.includes('திருச்சிராப்பள்ளி') ||
    d.includes('திருச்சி') ||
    d.includes('तिरुचिरापल्ली') ||
    d.includes('തിരുച്ചിറപ്പള്ളി') ||
    d.includes('തിരുച്ചി') ||
    d.includes('തിരുച്ചി') ||
    d.includes('తిరుచిరాపల్లి') ||
    d.includes('తిరుచి') ||
    d.includes('ತಿರುಚಿರಾಪಳ್ಳಿ') ||
    d.includes('ತಿರುಚಿ')
  ) {
    return 'Tiruchirappalli';
  }

  // Kakinada
  if (
    d.includes('kakinada') ||
    d.includes('காக்கிநாடா') ||
    d.includes('काकीनाडा') ||
    d.includes('കാക്കിനട') ||
    d.includes('కాకినాడ') ||
    d.includes('ಕಾಕಿನಾಡ')
  ) {
    return 'Kakinada';
  }

  // Lucknow
  if (
    d.includes('lucknow') ||
    d.includes('லக்னோ') ||
    d.includes('लखनऊ') ||
    d.includes('ലഖ്‌നൗ') ||
    d.includes('లక్నో') ||
    d.includes('ಲಕ್ನೋ')
  ) {
    return 'Lucknow';
  }

  // Kanchipuram
  if (
    d.includes('kanchipuram') ||
    d.includes('காஞ்சிபுரம்') ||
    d.includes('कांचीपुरम') ||
    d.includes('കാഞ്ചീപുരം') ||
    d.includes('కాంచీపురం') ||
    d.includes('ಕಾಂಚೀಪುರಂ')
  ) {
    return 'Kanchipuram';
  }

  // Thanjavur
  if (
    d.includes('thanjavur') ||
    d.includes('தஞ்சாவூர்') ||
    d.includes('तंजावुर') ||
    d.includes('തഞ്ചാവൂർ') ||
    d.includes('తంజావూరు') ||
    d.includes('ತಂಜಾವೂರು')
  ) {
    return 'Thanjavur';
  }

  // Erode
  if (
    d.includes('erode') ||
    d.includes('ஈரோடு') ||
    d.includes('इरोड') ||
    d.includes('ഈറോഡ്') ||
    d.includes('ఈరోడ్') ||
    d.includes('ಈರೋಡ್')
  ) {
    return 'Erode';
  }

  // Tirunelveli
  if (
    d.includes('tirunelveli') ||
    d.includes('nellai') ||
    d.includes('திருநெல்வேலி') ||
    d.includes('நெல்லை') ||
    d.includes('तिरुनेलवेली') ||
    d.includes('തിരുനെൽവേലി') ||
    d.includes('തിരുനെൽവേലി') ||
    d.includes('ತಿರುನೆಲ್ವೇಲಿ')
  ) {
    return 'Tirunelveli';
  }

  // Vellore
  if (
    d.includes('vellore') ||
    d.includes('வேலூர்') ||
    d.includes('वेल्लोर') ||
    d.includes('വെല്ലൂർ') ||
    d.includes('వేలూరు') ||
    d.includes('ವೇಲೂರು')
  ) {
    return 'Vellore';
  }

  if (/^[a-zA-Z0-9\s-]+$/.test(dist)) {
    return dist.trim();
  }

  return dist.trim();
}

/**
 * Resolves the canonical jurisdiction/circle ID for a project or citizen request.
 */
export function resolveProjectCircleId(project: any): string {
  if (project?.circleId && typeof project.circleId === 'string' && project.circleId.startsWith('TN-')) {
    return project.circleId;
  }
  if (project?.jurisdictionId && typeof project.jurisdictionId === 'string' && project.jurisdictionId.startsWith('TN-')) {
    return project.jurisdictionId;
  }

  const rawDist = project?.district || project?.incidentDistrict || project?.location?.district || '';
  const normalizedDist = normalizeDistrictName(rawDist);

  const text = `${rawDist} ${normalizedDist} ${project?.name || project?.title || ''} ${project?.description || ''} ${project?.state || project?.incidentState || ''} ${project?.location?.address || ''} ${project?.aiAnalysis?.extractedEntities?.locationMentioned || ''} ${project?.aiAnalysis?.translatedTitle || ''}`.toLowerCase();

  if (text.includes('coimbatore') || normalizedDist.toLowerCase().includes('coimbatore')) {
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

  if (text.includes('chennai') || normalizedDist.toLowerCase().includes('chennai')) {
    if (text.includes('north')) return 'TN-PWD-CHENNAI-NORTH';
    if (text.includes('south')) return 'TN-PWD-CHENNAI-SOUTH';
    return 'TN-PWD-CHENNAI-CENTRAL';
  }

  if (text.includes('madurai') || normalizedDist.toLowerCase().includes('madurai')) return 'TN-PWD-MADURAI-CENTRAL';
  if (text.includes('salem') || normalizedDist.toLowerCase().includes('salem')) return 'TN-PWD-SALEM-CENTRAL';
  if (text.includes('trichy') || text.includes('tiruchirappalli') || normalizedDist.toLowerCase().includes('tiruchirappalli')) return 'TN-PWD-TRICHY-CENTRAL';

  // Dynamic fallback format: STATE-DEPT-DISTRICT
  const stateCode = (project?.state || project?.incidentState || 'TN').toLowerCase().includes('tamil') ? 'TN' : 'IN';
  const cleanDist = normalizedDist ? normalizedDist.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase() : 'CENTRAL';
  return `${stateCode}-PWD-${cleanDist}`;
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

  // If statewide authority (e.g. state ministry / central admin / policymaker / tamil nadu state)
  const normState = normalizeStateName(entity.homeState || entity.jurisdiction || '');
  if (
    normState === 'Tamil Nadu' ||
    rawText.includes('tamil nadu') ||
    rawText.includes('tamilnadu') ||
    rawText.includes('statewide') ||
    rawText.includes('national') ||
    rawText.includes('state ministry') ||
    rawText.includes('planning commission')
  ) {
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
