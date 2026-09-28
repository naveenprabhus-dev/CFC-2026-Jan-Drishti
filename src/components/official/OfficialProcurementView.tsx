import React from 'react';
import { Project } from '../../types/domain';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { useLanguage } from '../../context/LanguageContext';
import {
  FileCheck2,
  HardHat,
  DollarSign,
  ShieldCheck,
  Building,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface OfficialProcurementViewProps {
  projects: Project[];
  onOpenAssignContractor: (project: Project) => void;
  onOpenProjectDetail: (projectId: string) => void;
}

export const OfficialProcurementView: React.FC<OfficialProcurementViewProps> = ({
  projects,
  onOpenAssignContractor,
  onOpenProjectDetail,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              {t('procurementTab') || 'Procurement & Tender Allocation'}
            </h2>
            <ProvenanceBadge type="OFFICIAL_DECISION" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent public work contract tendering and PWD Class-1 enlistment compliance
          </p>
        </div>
      </div>

      {/* Tender Allocation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((p) => {
          const isAssigned = !!p.contractorId;

          return (
            <div
              key={p.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                  <span className="font-mono font-black text-xs text-slate-900">{p.id}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isAssigned
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {isAssigned ? 'TENDER AWARDED' : 'AWAITING CONTRACTOR'}
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-slate-900 line-clamp-1">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.scopeOfWork}</p>

                <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Sanction Ceiling:</span>
                    <strong className="font-mono text-slate-900">
                      ₹{((p.funding?.sanctioned || 0) / 100000).toFixed(2)} Lakhs
                    </strong>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Assigned Contractor:</span>
                    <strong className="text-amber-800 truncate max-w-[140px]">
                      {p.contractorName || 'Not Assigned'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onOpenProjectDetail(p.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  {t('viewDetailsBtn') || 'Console'}
                </button>

                {!isAssigned ? (
                  <button
                    type="button"
                    onClick={() => onOpenAssignContractor(p)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <HardHat className="w-3.5 h-3.5" />
                    <span>Assign Contractor</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Tender Active</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
