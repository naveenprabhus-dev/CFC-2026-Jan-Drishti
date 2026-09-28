import React from 'react';
import { Project } from '../../types/domain';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { useLanguage } from '../../context/LanguageContext';
import {
  DollarSign,
  PieChart,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Building,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface OfficialFundingViewProps {
  projects: Project[];
  onOpenProjectDetail: (projectId: string) => void;
}

export const OfficialFundingView: React.FC<OfficialFundingViewProps> = ({
  projects,
  onOpenProjectDetail,
}) => {
  const { t } = useLanguage();
  const totalAllocated = projects.reduce((acc, p) => acc + (p.funding?.allocated || 0), 0);
  const totalSanctioned = projects.reduce((acc, p) => acc + (p.funding?.sanctioned || 0), 0);
  const totalContracted = projects.reduce((acc, p) => acc + (p.funding?.contracted || 0), 0);
  const totalExpenditure = projects.reduce((acc, p) => acc + (p.funding?.expenditure || 0), 0);
  const totalRemaining = totalAllocated - totalExpenditure;

  const schemeBreakdown = projects.reduce((acc: Record<string, number>, p) => {
    const src = p.funding?.schemeSource || 'SRDMS';
    acc[src] = (acc[src] || 0) + (p.funding?.sanctioned || 0);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              {t('fundingTab') || 'Deterministic Capital Funding Ledger'}
            </h2>
            <ProvenanceBadge type="GOVERNMENT_DATA" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic fiscal governance enforcing Expenditure ≤ Contracted ≤ Sanctioned ≤ Allocated rule
          </p>
        </div>
      </div>

      {/* Financial Decision Authority Banner */}
      <div className="bg-emerald-50 rounded-3xl border border-emerald-200 p-5 flex items-start gap-3.5 text-xs text-emerald-950 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-extrabold text-sm text-emerald-900 block">
            Fiscal Integrity Equation: Remaining = Allocated - Expenditure
          </span>
          <p className="text-emerald-800 leading-relaxed text-[11px]">
            Every financial sanction is bound to an authenticated government budget head and cryptographically validated against the project sanction ceiling. AI provides allocation advisory; human administrative sanction officers execute all binding fund disbursals.
          </p>
        </div>
      </div>

      {/* 5 Deterministic Financial Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            1. Allocated
          </span>
          <div className="text-xl font-black text-slate-900 font-mono">
            ₹{(totalAllocated / 100000).toFixed(2)}L
          </div>
          <span className="text-[10px] text-slate-500 block">Provisioned budget</span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
            2. {t('sanctioned') || 'Sanctioned'}
          </span>
          <div className="text-xl font-black text-emerald-800 font-mono">
            ₹{(totalSanctioned / 100000).toFixed(2)}L
          </div>
          <span className="text-[10px] text-emerald-700 block">
            {totalAllocated > 0 ? ((totalSanctioned / totalAllocated) * 100).toFixed(0) : 0}% of Allocation
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
            3. Contracted
          </span>
          <div className="text-xl font-black text-amber-800 font-mono">
            ₹{(totalContracted / 100000).toFixed(2)}L
          </div>
          <span className="text-[10px] text-amber-700 block">Awarded to contractors</span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
            4. {t('expenditure') || 'Expenditure'}
          </span>
          <div className="text-xl font-black text-blue-800 font-mono">
            ₹{(totalExpenditure / 100000).toFixed(2)}L
          </div>
          <span className="text-[10px] text-blue-700 block">
            Certified disbursals
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
            5. {t('remaining') || 'Remaining'}
          </span>
          <div className="text-xl font-black text-purple-800 font-mono">
            ₹{(totalRemaining / 100000).toFixed(2)}L
          </div>
          <span className="text-[10px] text-purple-700 block">
            {t('allocatedMinusExpenditure') || 'Allocated - Expenditure'}
          </span>
        </div>
      </div>

      {/* Scheme Breakdown & Project Funding Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scheme Breakdown Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-slate-900">Scheme Source Distribution</h3>
          <div className="space-y-3">
            {Object.entries(schemeBreakdown).map(([scheme, amount]) => (
              <div key={scheme} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-xs">
                  <span className="text-slate-800">{scheme}</span>
                  <span className="font-mono text-emerald-800">₹{(amount / 100000).toFixed(2)} L</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: `${Math.min(100, (amount / (totalSanctioned || 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Ledger Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-base text-slate-900">Capital Works Budget Ledger</h3>
            <span className="text-xs font-mono text-slate-400">{projects.length} Works</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Project ID & Title</th>
                  <th className="py-3 px-4 text-right">Sanctioned</th>
                  <th className="py-3 px-4 text-right">Contracted</th>
                  <th className="py-3 px-4 text-right">Expenditure</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-sans">
                      <span className="font-mono font-bold text-slate-900 block">{p.id}</span>
                      <span className="text-[11px] text-slate-500 block truncate max-w-xs">{p.name}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-800 font-bold">
                      ₹{((p.funding?.sanctioned || 0) / 100000).toFixed(2)}L
                    </td>
                    <td className="py-3 px-4 text-right text-amber-800 font-bold">
                      ₹{((p.funding?.contracted || 0) / 100000).toFixed(2)}L
                    </td>
                    <td className="py-3 px-4 text-right text-blue-800 font-bold">
                      ₹{((p.funding?.expenditure || 0) / 100000).toFixed(2)}L
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => onOpenProjectDetail(p.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                      >
                        {t('viewDetailsBtn') || 'Details'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
