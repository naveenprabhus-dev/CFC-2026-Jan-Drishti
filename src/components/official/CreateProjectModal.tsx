import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';

interface CreateProjectModalProps {
  workToken: WorkToken;
  onClose: () => void;
  onSuccess: (project: Project) => void;
}

interface TempMilestone {
  title: string;
  description: string;
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
  const [isLoadingProposal, setIsLoadingProposal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Interactive Milestones reviewed and human-approved (AI proposes initially)
  const [milestones, setMilestones] = useState<TempMilestone[]>([]);
  const [isMilestonesModified, setIsMilestonesModified] = useState(false);

  // Load associated request and generate dynamic AI work plan proposal
  useEffect(() => {
    const loadProposedWorkPlan = async () => {
      if (!workToken.requestId) return;
      setIsLoadingProposal(true);
      try {
        const reqDetail = await apiClient.getRequestById(workToken.requestId);
        if (reqDetail) {
          const category = reqDetail.aiAnalysis?.category || 'ROAD_INFRASTRUCTURE';

          if (category === 'LIGHTING') {
            setName(`Restorative Works: Street Lighting Repair at ${reqDetail.location.address}`);
            setDescription("Comprehensive electrical system repairs, wiring rehabilitation, and high-efficiency smart LED luminaire installation.");
            setScopeOfWork("Replace faulty wiring and ballast, mount new 120W high-efficiency smart LED fixtures, secure structural bracket mounts, and calibrate photodiode illumination sensors.");
            setMilestones([
              {
                title: "Phase 1: Initial Diagnosis, Isolation & Electrical Safety Assessment",
                description: "Identify cables faults or grid failures. Secure physical zone isolation and continuous electrical earth insulation testing."
              },
              {
                title: "Phase 2: Component Repair, Luminaire Replacement & Grid Integration",
                description: "Physically replace defective fixtures with smart LED luminaires, splice couplings, and secure safe electrical wiring connectivity."
              },
              {
                title: "Phase 3: Functional Testing, Lux Calibration & Handover",
                description: "Perform photodiode sensor responsiveness calibration, verify average lux illumination profiles, and issue electrical safety compliance certificate."
              }
            ]);
            setSchemeSource("Urban Infrastructure Development Fund (UIDF)");
          } else if (category === 'DRAINAGE' || category === 'SANITATION') {
            setName(`Restorative Works: Drainage & Culvert De-clogging at ${reqDetail.location.address}`);
            setDescription("Mechanical desilting of blocked storm drainage channels, structural wall plastering, and masonry culvert cover restoration.");
            setScopeOfWork("De-clog and mechanically dredge silt from waterlogged storm-water drainage channels, repair structural masonry damage, and lay concrete safety slabs.");
            setMilestones([
              {
                title: "Phase 1: Hydrological Inspection & Desilting Operations",
                description: "Clear solid blockages, mechanically dredge silt/sludge from channels, and safely dispose of municipal dump waste."
              },
              {
                title: "Phase 2: Structural Wall Masonry & Concrete Bed Plastering",
                description: "Repair cracked masonry sidewalls using standard grade cement mortar and reinforce structural bedding."
              },
              {
                title: "Phase 3: Peak Flow Testing & Safety Slab Handover",
                description: "Execute water hydraulic flow and pressure resistance tests, install precast concrete cover slabs, and clear surrounding pathways."
              }
            ]);
            setSchemeSource("Urban Infrastructure Development Fund (UIDF)");
          } else if (category === 'WATER_SUPPLY') {
            setName(`Restorative Works: Water Distribution Pipeline Repair at ${reqDetail.location.address}`);
            setDescription("High-accuracy acoustic leak localization, damaged segment excavation, pipeline coupling, and hydrostatic pressure testing.");
            setScopeOfWork("Acoustically detect subterranean pipeline leakage points, excavate worksite safely, install high-pressure DI/PVC coupling sleeve, and sanitize zone pipeline.");
            setMilestones([
              {
                title: "Phase 1: Subterranean Leak Localization & Worksite Excavation",
                description: "Conduct zone valve isolation, acoustically isolate leak sounds, and excavate surrounding earth layers."
              },
              {
                title: "Phase 2: Pipeline Section Replacement & Joint Gasket Compression",
                description: "Laying new certified Class-6 ductile iron pipeline segment and compress high-durability coupling gaskets."
              },
              {
                title: "Phase 3: Hydrostatic Pressure Testing & Chlorine Disinfection Flush",
                description: "Execute pressure test at 1.5x operating limit for 2 hours, run chlorinated flush for water quality, and backfill pavement sub-base."
              }
            ]);
            setSchemeSource("Urban Infrastructure Development Fund (UIDF)");
          } else {
            // Default: ROAD
            setName(`Restorative Works: Pavement Rehabilitation at ${reqDetail.location.address}`);
            setDescription("Comprehensive road pavement rehabilitation, subgrade compaction, and laying durable wearing course.");
            setScopeOfWork("Scarifying damaged asphalt, compacting aggregate subgrade, laying 75mm DBM binder layer, and placing 50mm Bituminous Concrete wearing course.");
            setMilestones([
              {
                title: "Phase 1: Site Clearing, Demolition & Sub-Base Preparation",
                description: "Complete milling of asphalt, subgrade grading, base compaction, and structural materials delivery."
              },
              {
                title: "Phase 2: Structural Layer Engineering & Bituminous Concrete Laying",
                description: "Laying 75mm Dense Bituminous Macadam (DBM) binder layer and compacting with heavy vibratory rollers."
              },
              {
                title: "Phase 3: Finishing, Thermoplastic Markings & Site Handover",
                description: "Install thermoplastic line markings, fit kerb stones, align stormwater outlet connections, and clear site."
              }
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to load request for AI proposed milestones:", err);
      } finally {
        setIsLoadingProposal(false);
      }
    };
    loadProposedWorkPlan();
  }, [workToken]);

  // Milestone modification actions
  const handleMilestoneChange = (index: number, field: keyof TempMilestone, value: string) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
    setIsMilestonesModified(true);
  };

  const handleAddMilestone = () => {
    setMilestones([...milestones, { title: 'New Custom Phase', description: 'Specify technical scope of work for this phase...' }]);
    setIsMilestonesModified(true);
  };

  const handleDeleteMilestone = (index: number) => {
    const updated = milestones.filter((_, idx) => idx !== index);
    setMilestones(updated);
    setIsMilestonesModified(true);
  };

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

    if (milestones.length === 0) {
      setErrorMsg('A valid civil engineering project must contain at least one milestone phase.');
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
        scopeOfWork,
        allocatedBudget,
        sanctionedBudget,
        targetCompletionDate: targetDate,
        schemeSource,
        milestones, // Pass the human-reviewed milestones list to the backend!
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
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
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
        <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoadingProposal ? (
            <div className="py-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600 animate-spin" />
              <span>Analyzing citizen reported problem and generating engineering work plan proposal...</span>
            </div>
          ) : null}

          <div className="space-y-4">
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
                Brief Technical Description *
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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

            {/* Funding Scheme */}
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

            {/* Engineering Work Plan Section */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 rounded bg-purple-100 text-purple-700">
                    <Layers className="w-4 h-4" />
                  </span>
                  <span className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Engineering Work Plan & Milestones
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  <Sparkles className="w-3 h-3 text-purple-600 shrink-0" />
                  Proposed by Gemini AI
                </span>
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                Review and modify the AI-proposed work plan. The human official retains full authority to add, delete, or modify any milestone phase before final sanction submission.
              </p>

              {/* Milestones list */}
              <div className="space-y-3 mt-2">
                {milestones.map((m, idx) => (
                  <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 relative shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="font-bold text-[11px] text-slate-800 uppercase">
                        Phase {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteMilestone(idx)}
                        className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition cursor-pointer"
                        title="Remove milestone phase"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={m.title}
                        onChange={(e) => handleMilestoneChange(idx, 'title', e.target.value)}
                        className="w-full text-xs font-bold p-2 bg-slate-50 rounded border border-slate-200 focus:bg-white"
                        placeholder="Milestone Phase Title"
                        required
                      />
                      <textarea
                        rows={2}
                        value={m.description}
                        onChange={(e) => handleMilestoneChange(idx, 'description', e.target.value)}
                        className="w-full text-[11px] p-2 bg-slate-50 rounded border border-slate-200 focus:bg-white leading-normal"
                        placeholder="Milestone technical description..."
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">
                  {isMilestonesModified ? "Status: Human Modified" : "Status: AI Recommended"}
                </span>
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Phase</span>
                </button>
              </div>
            </div>
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
              disabled={isSubmitting || isLoadingProposal}
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
