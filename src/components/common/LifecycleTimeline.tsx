import React from 'react';
import {
  FileText,
  Sparkles,
  ShieldCheck,
  KeyRound,
  Layers,
  IndianRupee,
  Landmark,
  FileSignature,
  Hammer,
  HardHat,
  Eye,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { ProjectStatus, RequestStatus } from '../../types/domain';
import {
  CANONICAL_LIFECYCLE_STEPS,
  resolveProjectLifecycleStepIndex,
} from '../../utils/lifecycleGovernance';

interface LifecycleTimelineProps {
  currentStage?: ProjectStatus | RequestStatus | 'AI_UNDERSTANDING' | 'TRIAGE' | string;
  isReworkActive?: boolean;
  className?: string;
}

const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  REPORT: FileText,
  AI_INTEL: Sparkles,
  OFFICIAL_TRIAGE: ShieldCheck,
  WORK_TOKEN: KeyRound,
  PROJECT_CREATION: Layers,
  FINANCIAL_SANCTION: IndianRupee,
  FUNDING_AUTH: Landmark,
  WORK_ORDER: FileSignature,
  CONTRACTOR_ASSIGN: Hammer,
  EXECUTION: HardHat,
  VERIFICATION: Eye,
  COMPLETION: CheckCircle2,
};

export const LifecycleTimeline: React.FC<LifecycleTimelineProps> = ({
  currentStage,
  isReworkActive = false,
  className = '',
}) => {
  const activeIndex = resolveProjectLifecycleStepIndex(currentStage);

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

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-1.5 relative">
        {CANONICAL_LIFECYCLE_STEPS.map((step, idx) => {
          const Icon = STEP_ICONS[step.key] || FileText;
          const isDone = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const isPending = idx > activeIndex;

          return (
            <div
              key={step.key}
              className={`flex flex-col items-center text-center p-1.5 rounded-lg border transition-all ${
                isCurrent
                  ? isReworkActive
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200 shadow-xs'
                    : 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200 shadow-xs'
                  : isDone
                  ? 'bg-slate-50 border-slate-200 opacity-95'
                  : 'bg-white border-slate-100 opacity-60'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                  isCurrent
                    ? isReworkActive
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-600 text-white'
                    : isDone
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              </div>

              <span className="text-[9px] font-bold tracking-tight text-slate-500 mb-0.5 uppercase">
                {step.role}
              </span>
              <p className="text-[11px] font-bold text-slate-800 leading-tight line-clamp-2">{step.label}</p>
              <p className="text-[9px] text-slate-500 mt-0.5 leading-tight line-clamp-1">{step.sublabel}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
