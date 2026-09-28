import React from 'react';
import { KeyRound, ArrowRight, Layers, Building2, CheckCircle2 } from 'lucide-react';

interface DigitalThreadBadgeProps {
  requestId?: string;
  workTokenId?: string;
  projectId?: string;
  onOpenProject?: (id: string) => void;
  onOpenToken?: (id: string) => void;
  onOpenRequest?: (id: string) => void;
  className?: string;
}

export const DigitalThreadBadge: React.FC<DigitalThreadBadgeProps> = ({
  requestId,
  workTokenId,
  projectId,
  onOpenProject,
  onOpenToken,
  onOpenRequest,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono ${className}`}
      title="Verified Digital Public Infrastructure Thread: Links citizen report to official token and civil project execution"
    >
      <span className="text-slate-600 font-sans font-semibold text-[10px] tracking-wide uppercase px-1">
        Digital Thread
      </span>

      {requestId && (
        <button
          type="button"
          onClick={() => onOpenRequest && onOpenRequest(requestId)}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-100 text-sky-900 hover:bg-sky-200 rounded transition font-medium cursor-pointer"
        >
          <Layers className="w-3 h-3 text-sky-700" />
          <span>{requestId}</span>
        </button>
      )}

      {workTokenId && (
        <>
          <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
          <button
            type="button"
            onClick={() => onOpenToken && onOpenToken(workTokenId)}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-900 hover:bg-purple-200 rounded transition font-medium cursor-pointer"
          >
            <KeyRound className="w-3 h-3 text-purple-700" />
            <span>{workTokenId}</span>
          </button>
        </>
      )}

      {projectId && (
        <>
          <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
          <button
            type="button"
            onClick={() => onOpenProject && onOpenProject(projectId)}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-900 hover:bg-emerald-200 rounded transition font-bold cursor-pointer"
          >
            <Building2 className="w-3 h-3 text-emerald-700" />
            <span>{projectId}</span>
          </button>
        </>
      )}
    </div>
  );
};
