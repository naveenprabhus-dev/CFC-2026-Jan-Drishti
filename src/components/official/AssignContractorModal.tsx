import React, { useState } from 'react';
import { Project, UserSession } from '../../types/domain';
import { apiClient } from '../../services/api';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { useLanguage } from '../../context/LanguageContext';
import {
  isContractorEligibleForProject,
  resolveProjectCircleId,
} from '../../utils/jurisdictionGovernance';
import {
  X,
  HardHat,
  ShieldCheck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  IndianRupee,
  MapPin,
} from 'lucide-react';

interface AssignContractorModalProps {
  project: Project;
  contractors: UserSession[];
  onClose: () => void;
  onSuccess: (updatedProject: Project) => void;
}

export const AssignContractorModal: React.FC<AssignContractorModalProps> = ({
  project,
  contractors,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();

  const projectCircleId = resolveProjectCircleId(project);
  const eligibleContractors = contractors.filter((c) =>
    isContractorEligibleForProject(c, project).eligible
  );

  const [contractorId, setContractorId] = useState(
    eligibleContractors[0]?.id || ''
  );
  const [contractedAmount, setContractedAmount] = useState(
    Math.round(project.funding.sanctioned * 0.92)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractorId) {
      setErrorMsg('Please select an eligible contractor registered for this project jurisdiction circle.');
      return;
    }

    if (contractedAmount > project.funding.sanctioned) {
      setErrorMsg('Contracted amount cannot exceed sanctioned allocation limit.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const updated = await apiClient.assignContractor({
        projectId: project.id,
        contractorId,
        contractedAmount,
      });

      onSuccess(updated);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to assign contractor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <HardHat className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Recommend Contractor for Financial Sanction</h3>
                <ProvenanceBadge type="OFFICIAL_DECISION" />
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-mono">{project.id} • {project.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Funding Check */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Sanctioned Limit</span>
            <p className="font-mono font-bold text-slate-900 mt-0.5">
              INR {project.funding.sanctioned.toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Department</span>
            <p className="font-bold text-slate-900 mt-0.5">{project.department}</p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Circle Jurisdiction Badge */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-900">
              <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-500 block">Project Jurisdiction Circle</span>
                <span className="font-mono font-bold text-indigo-950">{projectCircleId}</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-200/60 text-indigo-800">
              {eligibleContractors.length} Eligible Agency
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Enlisted Contractor Agency *
            </label>
            {eligibleContractors.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>No contractors currently enlisted for circle {projectCircleId}. Contractors from other jurisdictions cannot be selected.</span>
              </div>
            ) : (
              <select
                value={contractorId}
                onChange={(e) => setContractorId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                required
              >
                {eligibleContractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.organization || c.name} ({c.jurisdiction || c.homeDistrict || 'PWD Enlisted'})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Contracted Award Amount (INR) *
            </label>
            <input
              type="number"
              value={contractedAmount}
              onChange={(e) => setContractedAmount(Number(e.target.value))}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Must be ≤ INR {project.funding.sanctioned.toLocaleString()} (Sanction ceiling).
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg transition cursor-pointer"
            >
              {t('close') || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Submitting Recommendation...</span>
              ) : (
                <>
                  <HardHat className="w-4 h-4" />
                  <span>Submit Recommendation for Sanction</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
