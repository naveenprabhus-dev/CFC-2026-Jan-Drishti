import React from 'react';
import { CitizenRequest, Project } from '../../types/domain';
import { useLanguage } from '../../context/LanguageContext';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Building,
  ArrowRight,
  Eye,
  RotateCcw,
} from 'lucide-react';

interface OfficialSLAViewProps {
  requests: CitizenRequest[];
  projects: Project[];
  onOpenTriage: (request: CitizenRequest) => void;
  onOpenProjectDetail: (projectId: string) => void;
}

export const OfficialSLAView: React.FC<OfficialSLAViewProps> = ({
  requests,
  projects,
  onOpenTriage,
  onOpenProjectDetail,
}) => {
  const { t } = useLanguage();
  const pendingTriageOverdue = requests.filter((r) => r.status === 'SUBMITTED');
  const delayedProjects = projects.filter((p) => p.status === 'DELAYED');

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              {t('slaMonitorTitle') || 'SLA & Escalation Management Radar'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-bold border border-red-300">
              State Citizen Charter Enforced
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('slaMonitorSub') ||
              'Real-time tracking of statutory triage timelines, contractor rectification deadlines, and administrative escalations'}
          </p>
        </div>
      </div>

      {/* Escalation Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Triage SLA Warning */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Grievance Triage SLA Radar
              </h3>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              {pendingTriageOverdue.length} Awaiting Official Action
            </span>
          </div>

          <p className="text-xs text-slate-600">
            Citizen charters mandate official problem triage and work token decisions within 48 hours of submission.
          </p>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {pendingTriageOverdue.map((r) => (
              <div
                key={r.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs gap-3"
              >
                <div>
                  <span className="font-mono font-bold text-slate-900 block">{r.id}</span>
                  <span className="font-semibold text-slate-800 block truncate max-w-xs">{r.title}</span>
                  <span className="text-[10px] text-slate-500">{r.location.district}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenTriage(r)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-2xs"
                >
                  {t('triageDecideBtn') || 'Triage Now'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Project Rework & Delivery Delays */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Active Execution Remediation Directives
              </h3>
            </div>
            <span className="text-xs font-bold text-red-800 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
              {delayedProjects.length} Delayed / Rework Mandated
            </span>
          </div>

          <p className="text-xs text-slate-600">
            Contractors with active rework mandates or delayed milestones require immediate engineering inspection before next fund disbursal.
          </p>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {delayedProjects.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-2xl bg-red-50/50 border border-red-200 flex items-center justify-between text-xs gap-3"
              >
                <div>
                  <span className="font-mono font-bold text-slate-900 block">{p.id}</span>
                  <span className="font-semibold text-slate-800 block truncate max-w-xs">{p.name}</span>
                  <span className="text-[10px] text-red-700 block font-medium">
                    {p.reworkRequiredMessage || 'Mandatory corrective work required per official inspection'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenProjectDetail(p.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shrink-0 cursor-pointer shadow-2xs"
                >
                  {t('viewDetailsBtn') || 'Inspect'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
