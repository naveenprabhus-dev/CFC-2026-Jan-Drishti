import React from 'react';
import {
  FileText,
  Sparkles,
  ShieldCheck,
  KeyRound,
  Hammer,
  HardHat,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { ProjectStatus, RequestStatus } from '../../types/domain';

interface LifecycleTimelineProps {
  currentStage: ProjectStatus | RequestStatus | 'AI_UNDERSTANDING' | 'TRIAGE';
  isReworkActive?: boolean;
  className?: string;
}

interface TimelineStep {
  key: string;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  role: 'Citizen' | 'AI' | 'Official' | 'Contractor' | 'Public';
}

const STEPS: TimelineStep[] = [
  {
    key: 'REPORT',
    label: 'Citizen Report',
    sublabel: 'Multilingual intake',
    icon: FileText,
    role: 'Citizen',
  },
  {
    key: 'AI_INTEL',
    label: 'AI Understanding',
    sublabel: 'Extraction & classification',
    icon: Sparkles,
    role: 'AI',
  },
  {
    key: 'OFFICIAL_TRIAGE',
    label: 'Official Triage',
    sublabel: 'Human authority check',
    icon: ShieldCheck,
    role: 'Official',
  },
  {
    key: 'WORK_TOKEN',
    label: 'Work Token',
    sublabel: 'Digital thread anchor',
    icon: KeyRound,
    role: 'Official',
  },
  {
    key: 'SANCTION_ASSIGN',
    label: 'Project Sanction',
    sublabel: 'Contractor assigned',
    icon: Hammer,
    role: 'Official',
  },
  {
    key: 'EXECUTION',
    label: 'Site Execution',
    sublabel: 'Milestones & progress',
    icon: HardHat,
    role: 'Contractor',
  },
  {
    key: 'VERIFICATION',
    label: 'Evidence & AI Check',
    sublabel: 'AI compares, Official inspects',
    icon: Eye,
    role: 'Official',
  },
  {
    key: 'COMPLETION',
    label: 'Completion & Audit',
    sublabel: 'Public transparency',
    icon: CheckCircle2,
    role: 'Public',
  },
];

export const LifecycleTimeline: React.FC<LifecycleTimelineProps> = ({
  currentStage,
  isReworkActive = false,
  className = '',
}) => {
  // Determine active step index
  const getStepIndex = (): number => {
    switch (currentStage) {
      case 'SUBMITTED':
        return 0;
      case 'AI_UNDERSTANDING':
        return 1;
      case 'TRIAGED':
      case 'TRIAGE':
        return 2;
      case 'TOKEN_ISSUED':
        return 3;
      case 'PROJECT_CREATED':
      case 'PROPOSED':
      case 'SANCTIONED':
      case 'TENDERED':
      case 'CONTRACTOR_ASSIGNED':
        return 4;
      case 'IN_PROGRESS':
        return 5;
      case 'VERIFICATION_REQUIRED':
      case 'DELAYED':
        return 6;
      case 'COMPLETED':
        return 7;
      default:
        return 0;
    }
  };

  const activeIndex = getStepIndex();

  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-4 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Public Development Lifecycle (Digital Thread)
          </h4>
        </div>
        {isReworkActive && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
            <RotateCcw className="w-3 h-3 text-amber-600 animate-spin" />
            Active Rework & Reinspection Loop
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 relative">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const isPending = idx > activeIndex;

          return (
            <div
              key={step.key}
              className={`flex flex-col items-center text-center p-2 rounded-lg border transition-all ${
                isCurrent
                  ? isReworkActive
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200'
                    : 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200'
                  : isDone
                  ? 'bg-slate-50 border-slate-200 opacity-90'
                  : 'bg-white border-slate-100 opacity-60'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center mb-1.5 ${
                  isCurrent
                    ? isReworkActive
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-600 text-white'
                    : isDone
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>

              <span className="text-[10px] font-semibold tracking-wide text-slate-500 mb-0.5">
                {step.role}
              </span>
              <p className="text-xs font-bold text-slate-800 leading-tight">{step.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{step.sublabel}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
