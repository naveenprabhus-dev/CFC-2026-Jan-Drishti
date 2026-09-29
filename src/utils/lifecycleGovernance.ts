import { ProjectStatus, RequestStatus } from '../types/domain';

export interface CanonicalLifecycleStep {
  key: string;
  label: string;
  sublabel: string;
  role: 'Citizen' | 'AI' | 'Official' | 'Sanctioner' | 'Policymaker' | 'Contractor' | 'Public';
  order: number;
}

export const CANONICAL_LIFECYCLE_STEPS: CanonicalLifecycleStep[] = [
  {
    key: 'REPORT',
    label: 'Citizen Report',
    sublabel: 'Multilingual intake',
    role: 'Citizen',
    order: 0,
  },
  {
    key: 'AI_INTEL',
    label: 'AI Understanding',
    sublabel: 'Classification & triage',
    role: 'AI',
    order: 1,
  },
  {
    key: 'OFFICIAL_TRIAGE',
    label: 'Official Triage',
    sublabel: 'Human authority check',
    role: 'Official',
    order: 2,
  },
  {
    key: 'WORK_TOKEN',
    label: 'Work Token',
    sublabel: 'Digital thread anchor',
    role: 'Official',
    order: 3,
  },
  {
    key: 'PROJECT_CREATION',
    label: 'Project Proposal',
    sublabel: 'Scheme & estimate',
    role: 'Official',
    order: 4,
  },
  {
    key: 'FINANCIAL_SANCTION',
    label: 'Financial Sanction',
    sublabel: 'Authority approved',
    role: 'Sanctioner',
    order: 5,
  },
  {
    key: 'FUNDING_AUTH',
    label: 'Funding Authorization',
    sublabel: 'Treasury released',
    role: 'Policymaker',
    order: 6,
  },
  {
    key: 'WORK_ORDER',
    label: 'Work Order / Notice to Proceed',
    sublabel: 'Official signed order',
    role: 'Official',
    order: 7,
  },
  {
    key: 'EXECUTION',
    label: 'Contractor Execution',
    sublabel: 'Execution authorized',
    role: 'Contractor',
    order: 8,
  },
  {
    key: 'VERIFICATION',
    label: 'Evidence & Verification',
    sublabel: 'AI & field inspection',
    role: 'Official',
    order: 9,
  },
  {
    key: 'COMPLETION',
    label: 'Completion & Audit',
    sublabel: 'Public transparency',
    role: 'Public',
    order: 10,
  },
];

/**
 * Resolves the canonical digital thread step index (0-based) for any project/request status.
 * This is the SINGLE CENTRAL SOURCE OF TRUTH for lifecycle visualization across all role views.
 */
export function resolveProjectLifecycleStepIndex(
  statusOrProject?: ProjectStatus | RequestStatus | string | { status?: string } | null
): number {
  if (!statusOrProject) return 0;

  const rawStatus =
    typeof statusOrProject === 'object' && statusOrProject !== null
      ? (statusOrProject as any).status
      : statusOrProject;

  const status = String(rawStatus || '').toUpperCase().trim();

  switch (status) {
    case 'SUBMITTED':
      return 0; // Citizen Report

    case 'AI_UNDERSTANDING':
      return 1; // AI Understanding

    case 'TRIAGED':
    case 'TRIAGE':
      return 2; // Official Triage

    case 'TOKEN_ISSUED':
      return 3; // Work Token

    case 'PROJECT_CREATED':
    case 'PROPOSED':
    case 'SANCTIONED':
      return 4; // Project Proposal / Creation

    case 'CONTRACTOR_RECOMMENDED':
    case 'WAITING_FOR_FINANCIAL_SANCTION':
    case 'PENDING_FINANCIAL_SANCTION':
    case 'FINANCIAL_SANCTION_REJECTED':
      return 5; // Financial Sanction (CURRENT)

    case 'FINANCIAL_SANCTIONED':
    case 'WAITING_FOR_FUNDING_AUTHORIZATION':
      return 6; // Funding Authorization (CURRENT - Financial Sanction completed!)

    case 'FUNDING_AUTHORIZED':
    case 'WAITING_FOR_WORK_ORDER':
      return 7; // Work Order / Notice to Proceed (CURRENT - Funding Authorized!)

    case 'WORK_ORDER_ISSUED':
    case 'CONTRACTOR_EXECUTION_AUTHORIZED':
    case 'CONTRACTOR_ASSIGNED':
    case 'EXECUTION_ENABLED':
    case 'TENDERED':
    case 'IN_PROGRESS':
    case 'DELAYED':
    case 'REWORK_REQUIRED':
      return 8; // Contractor Execution (CURRENT)

    case 'VERIFICATION_REQUIRED':
    case 'READY_FOR_COMPLETION':
      return 9; // Evidence & Verification (CURRENT)

    case 'COMPLETED':
    case 'CLOSED':
      return 10; // Completion & Audit (COMPLETE)

    case 'RETURNED':
    case 'REJECTED':
      return 4; // Returned to project proposal revision

    default:
      if (status.includes('FINANCIAL_SANCTIONED') || status.includes('FUNDING_AUTH')) return 6;
      if (status.includes('WORK_ORDER')) return 7;
      if (status.includes('SANCTION')) return 5;
      if (status.includes('FUNDING')) return 6;
      if (status.includes('EXECUTION') || status.includes('PROGRESS')) return 8;
      if (status.includes('VERIF')) return 9;
      if (status.includes('COMPLET')) return 10;
      return 4;
  }
}

/**
 * Returns a human-readable stage summary badge description.
 */
export function getLifecycleStageDescription(statusOrProject?: ProjectStatus | RequestStatus | string | { status?: string } | null): {
  stepIndex: number;
  label: string;
  sublabel: string;
  role: string;
  isComplete: boolean;
} {
  const index = resolveProjectLifecycleStepIndex(statusOrProject);
  const step = CANONICAL_LIFECYCLE_STEPS[Math.min(index, CANONICAL_LIFECYCLE_STEPS.length - 1)];
  const isComplete = index >= CANONICAL_LIFECYCLE_STEPS.length - 1;

  return {
    stepIndex: index,
    label: step.label,
    sublabel: step.sublabel,
    role: step.role,
    isComplete,
  };
}
