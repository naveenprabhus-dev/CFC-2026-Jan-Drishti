import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import { UserRole } from '../../types/domain';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Shield,
  UserCheck,
  HardHat,
  Building2,
  Globe,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  FileText,
  Key,
  Layers,
  DollarSign,
  Camera,
  Eye,
  RefreshCw,
  X,
  Play,
  ArrowRight,
} from 'lucide-react';

export interface DemoStageInfo {
  number: number;
  title: string;
  shortTitle: string;
  role: UserRole;
  personaName: string;
  personaOrg: string;
  keyRecordId: string;
  badgeType: 'AI_ASSIST' | 'HUMAN_GOVERNANCE' | 'SYSTEM_THREAD' | 'PUBLIC_LEDGER';
  description: string;
  actionInstruction: string;
  targetView: string;
}

export const GOLDEN_STAGES: DemoStageInfo[] = [
  {
    number: 1,
    title: 'Stage 1 — Citizen Report',
    shortTitle: '1. Citizen Report',
    role: 'CITIZEN',
    personaName: 'Aravind Swaminathan',
    personaOrg: 'Local Resident, Chennai Ward 14',
    keyRecordId: 'REQ-2026-001',
    badgeType: 'SYSTEM_THREAD',
    description: 'Citizen identifies real road damage & stormwater outfall failure, uploads site photo & location.',
    actionInstruction: 'View citizen report REQ-2026-001 or submit a new report with photos.',
    targetView: 'CITIZEN_REPORT',
  },
  {
    number: 2,
    title: 'Stage 2 — AI Understanding & Classification',
    shortTitle: '2. AI Understanding',
    role: 'CITIZEN',
    personaName: 'Gemini AI Vision & Intelligence Engine',
    personaOrg: 'Server-Side AI Assistant',
    keyRecordId: 'REQ-2026-001',
    badgeType: 'AI_ASSIST',
    description: 'Gemini AI analyzes complaint photo & text, classifies category as Road Infrastructure, extracts severity (HIGH), & identifies PWD authority.',
    actionInstruction: 'Inspect AI Analysis card. (AI provides understanding; does not create projects).',
    targetView: 'CITIZEN_REQUEST_DETAIL',
  },
  {
    number: 3,
    title: 'Stage 3 — Government Review & Triage',
    shortTitle: '3. Govt Review',
    role: 'OFFICIAL',
    personaName: 'K. Ramanathan',
    personaOrg: 'Chief Engineer, Public Works Department (PWD)',
    keyRecordId: 'REQ-2026-001',
    badgeType: 'HUMAN_GOVERNANCE',
    description: 'Government Official reviews pending complaint in queue, inspects AI recommendation, and approves for infrastructure action.',
    actionInstruction: 'Switch to Official persona & open Request Queue to review REQ-2026-001.',
    targetView: 'OFFICIAL_TRIAGE',
  },
  {
    number: 4,
    title: 'Stage 4 — Work Token Generation',
    shortTitle: '4. Work Token',
    role: 'OFFICIAL',
    personaName: 'K. Ramanathan',
    personaOrg: 'Chief Engineer, PWD',
    keyRecordId: 'WT-2026-001',
    badgeType: 'HUMAN_GOVERNANCE',
    description: 'Official generates Work Token WT-2026-001 with cryptographically backed digital thread signature WT-SIG-8f3a9d22.',
    actionInstruction: 'Issue Work Token to establish unalterable digital thread anchor.',
    targetView: 'OFFICIAL_WORK_TOKEN',
  },
  {
    number: 5,
    title: 'Stage 5 — Project Creation & Sanction',
    shortTitle: '5. Project Sanction',
    role: 'OFFICIAL',
    personaName: 'K. Ramanathan',
    personaOrg: 'Chief Engineer, PWD',
    keyRecordId: 'PRJ-DEMO-001',
    badgeType: 'HUMAN_GOVERNANCE',
    description: 'Official creates & sanctions Civil Works Project PRJ-DEMO-001 tied directly to Work Token WT-2026-001.',
    actionInstruction: 'Sanction project scope, target completion date, and engineering milestones.',
    targetView: 'OFFICIAL_PROJECT_SANCTION',
  },
  {
    number: 6,
    title: 'Stage 6 — Fiscal Funding Governance',
    shortTitle: '6. Funding Ledger',
    role: 'OFFICIAL',
    personaName: 'K. Ramanathan / Finance Desk',
    personaOrg: 'PWD Capital Budget Division',
    keyRecordId: 'PRJ-DEMO-001',
    badgeType: 'PUBLIC_LEDGER',
    description: 'Funding Ledger displays: Allocated INR 50.0L - Expenditure INR 45.0L = Remaining INR 5.0L (PMGSY / Urban Infra Scheme).',
    actionInstruction: 'Inspect project funding ledger. Clearly labeled: SIMULATED / PROTOTYPE FISCAL DATA.',
    targetView: 'FUNDING_LEDGER',
  },
  {
    number: 7,
    title: 'Stage 7 — Contractor Assignment',
    shortTitle: '7. Assign Contractor',
    role: 'OFFICIAL',
    personaName: 'K. Ramanathan',
    personaOrg: 'Chief Engineer, PWD',
    keyRecordId: 'PRJ-DEMO-001',
    badgeType: 'HUMAN_GOVERNANCE',
    description: 'Official awards contract to Apex Roads Infrastructure Ltd. for INR 45,00,000 contracted budget.',
    actionInstruction: 'Assign lead contractor to project PRJ-DEMO-001.',
    targetView: 'ASSIGN_CONTRACTOR',
  },
  {
    number: 8,
    title: 'Stage 8 — Contractor Execution Start',
    shortTitle: '8. Start Execution',
    role: 'CONTRACTOR',
    personaName: 'Apex Roads Infrastructure',
    personaOrg: 'Class-1 Enlisted Infrastructure Contractor',
    keyRecordId: 'PRJ-DEMO-001',
    badgeType: 'SYSTEM_THREAD',
    description: 'Contractor opens assigned project PRJ-DEMO-001, mobilizes site machinery, and clicks Start Execution (TENDERED ➔ IN_PROGRESS).',
    actionInstruction: 'Switch to Contractor persona & initiate field execution.',
    targetView: 'CONTRACTOR_EXECUTION',
  },
  {
    number: 9,
    title: 'Stage 9 — Contractor Evidence Submission',
    shortTitle: '9. Submit Evidence',
    role: 'CONTRACTOR',
    personaName: 'Apex Roads Infrastructure',
    personaOrg: 'Lead Site Engineer',
    keyRecordId: 'EVID-001',
    badgeType: 'SYSTEM_THREAD',
    description: 'Contractor uploads site photo & claims 100% completion on Milestone 1 Sub-Base Excavation.',
    actionInstruction: 'Submit photographic evidence EVID-001 attached to Milestone 1.',
    targetView: 'SUBMIT_EVIDENCE',
  },
  {
    number: 10,
    title: 'Stage 10 — NGO Independent Ground Audit',
    shortTitle: '10. NGO Ground Audit',
    role: 'NGO',
    personaName: 'Civic Transparency Network',
    personaOrg: 'Authorized Independent NGO Monitor',
    keyRecordId: 'OBS-001',
    badgeType: 'HUMAN_GOVERNANCE',
    description: 'Independent NGO auditor conducts field audit on PRJ-DEMO-001, uploads ground photo flagging uncompacted subgrade.',
    actionInstruction: 'Switch to NGO persona & record independent site observation OBS-001.',
    targetView: 'NGO_AUDIT',
  },
  {
    number: 11,
    title: 'Stage 11 — AI Evidence Comparison & Discrepancy Signal',
    shortTitle: '11. AI Comparison',
    role: 'OFFICIAL',
    personaName: 'Gemini AI Vision & Evidence Analyzer',
    personaOrg: 'Server-Side Advisory Intelligence',
    keyRecordId: 'EVID-001',
    badgeType: 'AI_ASSIST',
    description: 'AI compares Contractor Evidence vs NGO Observation ➔ Flags POTENTIAL_DISCREPANCY (loose aggregate, missing bitumen binder).',
    actionInstruction: 'Review neutral AI comparison flag. Requires Official Human Inspection.',
    targetView: 'AI_COMPARISON',
  },
  {
    number: 12,
    title: 'Stage 12 — Official Inspection & Rework Mandate',
    shortTitle: '12. Rework Mandate',
    role: 'OFFICIAL',
    personaName: 'K. Ramanathan',
    personaOrg: 'Chief Engineer, PWD',
    keyRecordId: 'INSP-001',
    badgeType: 'HUMAN_GOVERNANCE',
    description: 'Official performs human site inspection, rejects flawed evidence, & issues Official Rework Notice mandating compaction.',
    actionInstruction: 'Select REQUIRE REWORK on Milestone 1 to enforce engineering standards.',
    targetView: 'OFFICIAL_INSPECTION_REWORK',
  },
  {
    number: 13,
    title: 'Stage 13 — Contractor Rework Rectification',
    shortTitle: '13. Contractor Rework',
    role: 'CONTRACTOR',
    personaName: 'Apex Roads Infrastructure',
    personaOrg: 'Lead Site Engineer',
    keyRecordId: 'EVID-RW-001',
    badgeType: 'SYSTEM_THREAD',
    description: 'Contractor receives Rework Notice, performs re-compaction and bitumen paver laying, uploads corrected evidence EVID-RW-001.',
    actionInstruction: 'Switch to Contractor persona & submit corrected rework evidence.',
    targetView: 'CONTRACTOR_REWORK_SUBMIT',
  },
  {
    number: 14,
    title: 'Stage 14 — Official Reinspection & Milestone Verification',
    shortTitle: '14. Reinspection Approved',
    role: 'OFFICIAL',
    personaName: 'K. Ramanathan',
    personaOrg: 'Chief Engineer, PWD',
    keyRecordId: 'INSP-002',
    badgeType: 'HUMAN_GOVERNANCE',
    description: 'Official reinspects corrected evidence EVID-RW-001, verifies bitumen layer thickness, and approves Milestone 1 (VERIFIED).',
    actionInstruction: 'Approve reinspection INSP-002.',
    targetView: 'OFFICIAL_REINSPECTION',
  },
  {
    number: 15,
    title: 'Stage 15 — Project Completion Certification',
    shortTitle: '15. Certify Complete',
    role: 'OFFICIAL',
    personaName: 'K. Ramanathan',
    personaOrg: 'Chief Engineer, PWD',
    keyRecordId: 'PRJ-DEMO-001',
    badgeType: 'HUMAN_GOVERNANCE',
    description: 'Official certifies 100% completion across all milestones. Project PRJ-DEMO-001 ➔ COMPLETED, Work Token WT-2026-001 ➔ COMPLETED.',
    actionInstruction: 'Certify project completion in Official Command Center.',
    targetView: 'CERTIFY_COMPLETED',
  },
  {
    number: 16,
    title: 'Stage 16 — Citizen Final View & Request Closure',
    shortTitle: '16. Citizen Request Closed',
    role: 'CITIZEN',
    personaName: 'Aravind Swaminathan',
    personaOrg: 'Reporting Citizen',
    keyRecordId: 'REQ-2026-001',
    badgeType: 'SYSTEM_THREAD',
    description: 'Citizen opens My Requests, sees REQ-2026-001 state CLOSED with complete 15-checkpoint verified timeline.',
    actionInstruction: 'Switch to Citizen persona & inspect verified request closure.',
    targetView: 'CITIZEN_CLOSED_VIEW',
  },
  {
    number: 17,
    title: 'Stage 17 — Public Transparency Portal Verification',
    shortTitle: '17. Public Transparency',
    role: 'PUBLIC_VIEWER',
    personaName: 'Public Citizen / Auditor',
    personaOrg: 'Open Digital Infrastructure Portal',
    keyRecordId: 'PRJ-DEMO-001',
    badgeType: 'PUBLIC_LEDGER',
    description: 'Public inspects sanitized PRJ-DEMO-001 record showing status COMPLETED, audit logs, and digital thread provenance signature.',
    actionInstruction: 'Switch to Public Transparency view & verify open public ledger.',
    targetView: 'PUBLIC_TRANSPARENCY',
  },
];

interface GoldenDemoWorkflowBarProps {
  currentStageNumber: number;
  onSelectStage: (stageNum: number) => void;
  onExecuteStageAction?: (stageNum: number) => Promise<void>;
  onOpenProjectDetail?: (projectId: string) => void;
}

export const GoldenDemoWorkflowBar: React.FC<GoldenDemoWorkflowBarProps> = ({
  currentStageNumber,
  onSelectStage,
  onExecuteStageAction,
  onOpenProjectDetail,
}) => {
  const { currentUser, loginDemo, resetDemo, isLoading } = useAuth();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const currentStage = GOLDEN_STAGES.find((s) => s.number === currentStageNumber) || GOLDEN_STAGES[0];

  const handleNextStage = () => {
    if (currentStageNumber < 17) {
      onSelectStage(currentStageNumber + 1);
    }
  };

  const handlePrevStage = () => {
    if (currentStageNumber > 1) {
      onSelectStage(currentStageNumber - 1);
    }
  };

  const handleJumpPersonaAndNavigate = async (stage: DemoStageInfo) => {
    setIsExecuting(true);
    setActionSuccessMsg(null);
    try {
      // 1. Switch active demo persona if needed
      if (currentUser?.role !== stage.role) {
        await loginDemo(stage.role);
      }
      // 2. Trigger parent stage selection
      onSelectStage(stage.number);

      // 3. Optional execute action if provided
      if (onExecuteStageAction) {
        await onExecuteStageAction(stage.number);
      }

      setActionSuccessMsg(`Navigated to ${stage.title} as ${stage.personaName}`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Error switching demo stage:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'CITIZEN':
        return <UserCheck className="w-3.5 h-3.5 text-sky-600" />;
      case 'OFFICIAL':
        return <Shield className="w-3.5 h-3.5 text-emerald-600" />;
      case 'CONTRACTOR':
        return <HardHat className="w-3.5 h-3.5 text-amber-600" />;
      case 'NGO':
        return <Building2 className="w-3.5 h-3.5 text-teal-600" />;
      case 'POLICYMAKER':
        return <TrendingUp className="w-3.5 h-3.5 text-purple-600" />;
      case 'PUBLIC_VIEWER':
      default:
        return <Globe className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  const getBadgeStyle = (badgeType: DemoStageInfo['badgeType']) => {
    switch (badgeType) {
      case 'AI_ASSIST':
        return 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
      case 'HUMAN_GOVERNANCE':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold';
      case 'PUBLIC_LEDGER':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold';
      case 'SYSTEM_THREAD':
      default:
        return 'bg-sky-100 text-sky-900 border-sky-300 font-bold';
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md transition-all">
      {/* Top Banner Control Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-extrabold text-emerald-400 tracking-wide uppercase text-[11px]">
            PRIMARY GOLDEN DEMO STORY
          </span>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-slate-300 text-[11px] hidden md:inline">
            Anna Salai Highway Restoration • Digital Thread: REQ-2026-001 ➔ WT-2026-001 ➔ PRJ-DEMO-001
          </span>
        </div>

        <div className="flex items-center gap-2">
          {actionSuccessMsg && (
            <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 animate-fade-in">
              {actionSuccessMsg}
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition cursor-pointer flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>{isExpanded ? 'Minimize Stepper' : 'Expand Golden Stepper (17 Stages)'}</span>
          </button>
        </div>
      </div>

      {/* Expanded Stepper & Stage Controller */}
      {isExpanded && (
        <div className="border-t border-slate-800 bg-slate-950 px-4 sm:px-6 lg:px-8 py-3.5 space-y-3.5">
          {/* Horizontal Stepper Progress Bar */}
          <div className="overflow-x-auto pb-1.5 scrollbar-thin">
            <div className="flex items-center gap-1.5 min-w-max">
              {GOLDEN_STAGES.map((s) => {
                const isActive = s.number === currentStageNumber;
                const isPassed = s.number < currentStageNumber;

                return (
                  <button
                    key={s.number}
                    type="button"
                    onClick={() => handleJumpPersonaAndNavigate(s)}
                    disabled={isExecuting}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer border ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm ring-2 ring-emerald-500/40'
                        : isPassed
                        ? 'bg-slate-800/90 text-emerald-400 border-emerald-900/60 hover:bg-slate-800'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center ${
                        isActive
                          ? 'bg-white text-emerald-900'
                          : isPassed
                          ? 'bg-emerald-900 text-emerald-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {s.number}
                    </span>
                    <span>{s.shortTitle}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Active Stage Detail Panel */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Left: Stage Title & Persona */}
            <div className="md:col-span-8 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                  Stage {currentStage.number} of 17
                </span>
                <span className="text-slate-600">•</span>
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  {currentStage.title}
                </h3>
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${getBadgeStyle(
                    currentStage.badgeType
                  )}`}
                >
                  {currentStage.badgeType === 'AI_ASSIST' && 'AI ASSIST (ADVISORY)'}
                  {currentStage.badgeType === 'HUMAN_GOVERNANCE' && 'CONSEQUENTIAL HUMAN DECISION'}
                  {currentStage.badgeType === 'SYSTEM_THREAD' && 'DIGITAL THREAD RECORD'}
                  {currentStage.badgeType === 'PUBLIC_LEDGER' && 'PUBLIC LEDGER'}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {currentStage.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 text-slate-200">
                  {getRoleIcon(currentStage.role)}
                  <span>Role: {currentStage.role}</span>
                  <span className="text-slate-500">({currentStage.personaName})</span>
                </div>

                <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 text-emerald-300">
                  <Key className="w-3 h-3 text-emerald-400" />
                  <span>Record ID: {currentStage.keyRecordId}</span>
                </div>

                {onOpenProjectDetail && (
                  <button
                    type="button"
                    onClick={() => onOpenProjectDetail('PRJ-DEMO-001')}
                    className="text-emerald-400 hover:text-emerald-300 underline cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Inspect Golden Thread Modal</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right: Step Action Controller Buttons */}
            <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col items-stretch justify-center gap-2">
              <button
                type="button"
                onClick={() => handleJumpPersonaAndNavigate(currentStage)}
                disabled={isExecuting}
                className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isExecuting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
                <span>Switch Persona & Go to Stage {currentStage.number}</span>
              </button>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handlePrevStage}
                  disabled={currentStageNumber <= 1 || isExecuting}
                  className="flex-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextStage}
                  disabled={currentStageNumber >= 17 || isExecuting}
                  className="flex-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1 disabled:opacity-40"
                >
                  <span>Next Stage</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
