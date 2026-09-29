import React from 'react';
import { Project } from '../../types/domain';
import { useLanguage } from '../../context/LanguageContext';
import {
  HardHat,
  Building,
  CheckCircle2,
  AlertTriangle,
  Layers,
  MapPin,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface OfficialContractorsViewProps {
  projects: Project[];
  onOpenProjectDetail: (projectId: string) => void;
}

export const OfficialContractorsView: React.FC<OfficialContractorsViewProps> = ({
  projects,
  onOpenProjectDetail,
}) => {
  const { t } = useLanguage();

  // Aggregate contractors
  const contractors = [
    {
      id: 'contractor-01',
      name: 'Apex Roads Infrastructure Ltd.',
      enlistment: 'Class-1 PWD Enlisted Lead Contractor',
      gstin: '33AAACA0000A1Z5',
      operatingCircle: 'State Highways Infrastructure Circle',
      assignedProjects: projects.filter((p) => p.contractorId === 'contractor-01' || p.contractorName?.includes('Apex')),
      rating: '4.8/5.0 Compliance Rating',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              {t('contractorsTab') || 'Enlisted Contractor Roster'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
              Class-1 Certified Enlistment
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor contracted civil infrastructure enterprises, milestone quality benchmarks, and rework accountability
          </p>
        </div>
      </div>

      {contractors.map((c) => (
        <div
          key={c.id}
          className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6"
        >
          {/* Top Contractor Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3.5">
              <span className="p-3 rounded-2xl bg-amber-100 text-amber-900 border border-amber-200">
                <HardHat className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg text-slate-900">{c.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                    {c.rating}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {c.enlistment} • GSTIN: <span className="font-mono">{c.gstin}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold">
                {c.assignedProjects.length} Active Civil Tokens
              </span>
            </div>
          </div>

          {/* Assigned Works List */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Current Assigned Public Works Execution Contracts
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {c.assignedProjects.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-bold text-slate-900">{p.id}</span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                          p.status === 'DELAYED'
                            ? 'bg-red-100 text-red-800'
                            : p.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <h5 className="font-bold text-xs text-slate-800 line-clamp-1">{p.name}</h5>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{p.scopeOfWork}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                    <span className="font-mono font-bold text-slate-700">
                      ₹{((p.funding?.contracted || p.funding?.sanctioned || 0) / 100000).toFixed(2)}L
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenProjectDetail(p.id)}
                      className="text-xs font-bold text-slate-700 hover:text-slate-900 underline cursor-pointer"
                    >
                      {t('viewDetailsBtn') || 'View Details'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
