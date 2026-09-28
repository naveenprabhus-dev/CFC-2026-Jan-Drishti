import React, { useState } from 'react';
import { WorkToken, Project } from '../../types/domain';
import { apiClient } from '../../services/api';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { useLanguage } from '../../context/LanguageContext';
import {
  X,
  Building2,
  Hammer,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  IndianRupee,
  Layers,
} from 'lucide-react';

interface CreateProjectModalProps {
  workToken: WorkToken;
  onClose: () => void;
  onSuccess: (project: Project) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  workToken,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [name, setName] = useState(
    workToken.title.replace('Work Token:', 'Civil Works:').replace('Infrastructure Action Token:', 'Project:')
  );
  const [description, setDescription] = useState(
    'Comprehensive restorative civil re-engineering and surface pavement rehabilitation.'
  );
  const [scopeOfWork, setScopeOfWork] = useState(
    'Milling of damaged asphalt, sub-base compaction, laying 75mm Dense Bituminous Macadam (DBM) and 50mm Bituminous Concrete (BC) with thermoplastic markings and drain rehabilitation.'
  );
  const [allocatedBudget, setAllocatedBudget] = useState(4800000);
  const [sanctionedBudget, setSanctionedBudget] = useState(4500000);
  const [schemeSource, setSchemeSource] = useState(
    'Special Road Development & Modernization Scheme (SRDMS)'
  );
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !scopeOfWork.trim()) {
      setErrorMsg('Please enter a project title and technical scope of work.');
      return;
    }

    if (sanctionedBudget > allocatedBudget) {
      setErrorMsg('Sanctioned budget cannot exceed total allocated funds.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const project = await apiClient.createProject({
        workTokenId: workToken.id,
        name,
        description,
        department: workToken.department,
        district: 'Central Chennai',
        state: 'Tamil Nadu',
        scopeOfWork,
        allocatedBudget,
        sanctionedBudget,
        targetCompletionDate: targetDate,
        schemeSource,
      });

      onSuccess(project);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Sanction Infrastructure Project</h3>
                <ProvenanceBadge type="OFFICIAL_DECISION" />
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Convert Work Token <span className="font-mono text-emerald-300">{workToken.id}</span> into an authorized civil works project.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Token Anchor Context */}
        <div className="p-4 bg-purple-50/70 border-b border-purple-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-purple-700">Digital Thread Anchor</span>
            <p className="font-mono font-bold text-purple-950">{workToken.id} • {workToken.department}</p>
          </div>
          <span className="font-bold px-2 py-0.5 rounded bg-purple-200 text-purple-900 text-[10px]">
            {workToken.priority} PRIORITY
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Official Project Title *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Engineering Scope of Work *
            </label>
            <textarea
              rows={3}
              value={scopeOfWork}
              onChange={(e) => setScopeOfWork(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              required
            />
          </div>

          {/* Funding Scheme & Head */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Government Scheme Funding Source *
            </label>
            <select
              value={schemeSource}
              onChange={(e) => setSchemeSource(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden"
            >
              <option value="Special Road Development & Modernization Scheme (SRDMS)">
                Special Road Development & Modernization Scheme (SRDMS)
              </option>
              <option value="Pradhan Mantri Gram Sadak Yojana (PMGSY - Phase III)">
                Pradhan Mantri Gram Sadak Yojana (PMGSY - Phase III)
              </option>
              <option value="Urban Infrastructure Development Fund (UIDF)">
                Urban Infrastructure Development Fund (UIDF)
              </option>
              <option value="State Disaster Mitigation Fund (NDMF)">
                State Disaster Mitigation Fund (NDMF)
              </option>
            </select>
          </div>

          {/* Budgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Allocated Budget (INR)
              </label>
              <input
                type="number"
                value={allocatedBudget}
                onChange={(e) => setAllocatedBudget(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sanctioned Amount (INR)
              </label>
              <input
                type="number"
                value={sanctionedBudget}
                onChange={(e) => setSanctionedBudget(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                required
              />
            </div>
          </div>

          {/* Target Completion Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Target Handover Date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              required
            />
          </div>

          {/* Actions */}
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
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Sanctioning Project...</span>
              ) : (
                <>
                  <Hammer className="w-4 h-4" />
                  <span>Sanction Project & Generate PRJ ID</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
