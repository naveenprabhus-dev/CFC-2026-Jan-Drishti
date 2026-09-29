import {
  Project,
  Milestone,
  ContractorEvidence,
  OfficialInspection,
  CommunityObservation,
} from '../types/domain';

export interface MilestoneChecklist {
  sequenceValid: boolean;
  evidenceSubmitted: boolean;
  aiAnalysisCompleted: boolean;
  officialInspectionCompleted: boolean;
  reworkCleared: boolean;
  reinspectionCompleted: boolean;
}

export interface MilestonePrerequisitesResult {
  milestoneId: string;
  milestoneTitle: string;
  isReadyForVerification: boolean;
  missingPrerequisites: string[];
  checklist: MilestoneChecklist;
}

export interface ProjectCompletionEligibilityResult {
  isReadyForCompletion: boolean;
  missingConditions: string[];
  unverifiedMilestones: Array<{ id: string; title: string; status: string }>;
  verifiedMilestonesCount: number;
  totalMilestonesCount: number;
}

/**
 * Evaluates whether a specific milestone satisfies all governance prerequisites
 * required to be eligible for human Official verification.
 */
export function evaluateMilestonePrerequisites(
  project: Project,
  milestone: Milestone,
  evidenceList: ContractorEvidence[] = [],
  inspectionList: OfficialInspection[] = [],
  observations: CommunityObservation[] = []
): MilestonePrerequisitesResult {
  const missingPrerequisites: string[] = [];

  // 1. Milestone Sequence Rule: Previous milestone in sequence must be VERIFIED
  const previousMilestones = (project.milestones || []).filter(
    (m) => m.sequence < milestone.sequence
  );
  const unverifiedPrevious = previousMilestones.find((m) => m.status !== 'VERIFIED');
  const sequenceValid = !unverifiedPrevious;
  if (!sequenceValid && unverifiedPrevious) {
    missingPrerequisites.push(
      `Previous milestone "${unverifiedPrevious.title}" (Sequence ${unverifiedPrevious.sequence}) must be verified first.`
    );
  }

  // 2. Contractor Evidence Rule: Matching contractor progress evidence must exist
  const milestoneEvidence = evidenceList.filter(
    (e) => e.projectId === project.id && e.milestoneId === milestone.id
  );
  const evidenceSubmitted = milestoneEvidence.length > 0;
  if (!evidenceSubmitted) {
    missingPrerequisites.push('Contractor progress evidence has not been submitted for this milestone.');
  }

  // 3. AI Verification Rule: Latest contractor evidence must have completed AI verification
  const latestEvidence = milestoneEvidence[milestoneEvidence.length - 1];
  const aiAnalysisCompleted = Boolean(latestEvidence && latestEvidence.aiVerification);
  if (evidenceSubmitted && !aiAnalysisCompleted) {
    missingPrerequisites.push('AI verification analysis is pending for the submitted contractor evidence.');
  }

  // 4. Official Inspection Rule: At least one official human field inspection recorded
  const milestoneInspections = inspectionList.filter(
    (i) => i.projectId === project.id && i.milestoneId === milestone.id
  );
  const officialInspectionCompleted = milestoneInspections.length > 0;
  if (!officialInspectionCompleted) {
    missingPrerequisites.push('Official human field inspection has not been recorded for this milestone.');
  }

  // 5. Rework & Reinspection Rule: Unresolved rework must be remediated and reinspected
  const lastInspection = milestoneInspections[milestoneInspections.length - 1];
  const isReworkMandated =
    milestone.status === 'REWORK_REQUIRED' ||
    milestone.status === 'DELAYED' ||
    (lastInspection && (lastInspection.decision === 'REWORK_REQUIRED' || (lastInspection.decision as string) === 'REJECTED'));

  let reworkCleared = true;
  let reinspectionCompleted = true;

  if (isReworkMandated) {
    const reworkInspectionTime = lastInspection ? new Date(lastInspection.inspectedAt).getTime() : 0;
    const reworkEvidence = milestoneEvidence.filter(
      (e) => (e.status === 'REWORK_SUBMITTED' || new Date(e.submittedAt).getTime() > reworkInspectionTime)
    );

    if (reworkEvidence.length === 0) {
      reworkCleared = false;
      missingPrerequisites.push('Contractor has not submitted remediation evidence for the required rework.');
    } else {
      const latestReworkTime = new Date(reworkEvidence[reworkEvidence.length - 1].submittedAt).getTime();
      const reinspections = milestoneInspections.filter(
        (i) =>
          new Date(i.inspectedAt).getTime() > latestReworkTime &&
          (i.decision === 'APPROVED' || (i.decision as string) === 'ACCEPTABLE')
      );

      if (reinspections.length === 0) {
        reinspectionCompleted = false;
        missingPrerequisites.push('Official field reinspection is required following contractor rework submission.');
      }
    }
  }

  const isReadyForVerification = missingPrerequisites.length === 0;

  return {
    milestoneId: milestone.id,
    milestoneTitle: milestone.title,
    isReadyForVerification,
    missingPrerequisites,
    checklist: {
      sequenceValid,
      evidenceSubmitted,
      aiAnalysisCompleted,
      officialInspectionCompleted,
      reworkCleared,
      reinspectionCompleted,
    },
  };
}

/**
 * Evaluates whether a project is eligible for final completion certification by an Official.
 */
export function evaluateProjectCompletionEligibility(
  project: Project,
  evidenceList: ContractorEvidence[] = [],
  inspectionList: OfficialInspection[] = []
): ProjectCompletionEligibilityResult {
  const missingConditions: string[] = [];
  const milestones = project.milestones || [];
  
  const unverifiedMilestones = milestones
    .filter((m) => m.status !== 'VERIFIED')
    .map((m) => ({ id: m.id, title: m.title, status: m.status }));

  const totalMilestonesCount = milestones.length;
  const verifiedMilestonesCount = totalMilestonesCount - unverifiedMilestones.length;

  if (unverifiedMilestones.length > 0) {
    missingConditions.push(
      `${unverifiedMilestones.length} of ${totalMilestonesCount} milestones remain unverified. All milestones must be verified first.`
    );
  }

  if (project.status === 'DELAYED') {
    missingConditions.push('Project has an active unresolved rework mandate.');
  }

  // Ensure project is in active or verification stage
  const validCompletionStates = [
    'IN_PROGRESS',
    'VERIFICATION_REQUIRED',
    'READY_FOR_COMPLETION',
    'CONTRACTOR_ASSIGNED',
    'SANCTIONED',
    'FINANCIAL_SANCTIONED',
    'EXECUTION_ENABLED',
  ];

  if (!validCompletionStates.includes(project.status) && project.status !== 'COMPLETED') {
    missingConditions.push(`Project in status "${project.status}" cannot be completed.`);
  }

  const isReadyForCompletion = missingConditions.length === 0;

  return {
    isReadyForCompletion,
    missingConditions,
    unverifiedMilestones,
    verifiedMilestonesCount,
    totalMilestonesCount,
  };
}
