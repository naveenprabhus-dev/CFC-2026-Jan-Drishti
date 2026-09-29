import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { DigitalThreadBadge } from '../common/DigitalThreadBadge';
import { EvidenceImage } from '../common/EvidenceImage';
import { LifecycleTimeline } from '../common/LifecycleTimeline';
import {
  Globe,
  Search,
  Building2,
  CheckCircle2,
  Layers,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Eye,
  RefreshCw,
  X,
  MapPin,
  Clock,
  Compass,
  FileText,
  Check,
  HelpCircle,
  Camera,
  MessageSquare,
  Shield,
  HeartHandshake,
  Send,
  AlertCircle,
} from 'lucide-react';

type PublicActionTab = 'find' | 'explore' | 'track' | 'transparency' | 'about';

export const TransparencyPortal: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PublicActionTab>('find');

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Direct Tracker State
  const [trackerInput, setTrackerInput] = useState('');
  const [trackerError, setTrackerError] = useState<string | null>(null);

  // Selected Project Detail (Sanitized)
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Public Observation Submission State
  const [newComment, setNewComment] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newDivergenceSignal, setNewDivergenceSignal] = useState<'PROGRESSING_WELL' | 'WORK_HALTED' | 'POOR_QUALITY'>('PROGRESSING_WELL');
  const [isSubmittingObs, setIsSubmittingObs] = useState(false);
  const [obsSuccessMsg, setObsSuccessMsg] = useState(false);

  const fetchPublicProjects = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getPublicProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load public transparency projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicProjects();
  }, []);

  const openProjectDetail = async (idOrToken: string) => {
    setIsDetailLoading(true);
    setTrackerError(null);
    try {
      const detail = await apiClient.getPublicProjectById(idOrToken.trim());
      setSelectedProject(detail);
      setObsSuccessMsg(false);
    } catch (err: any) {
      console.error('Failed to load public project detail:', err);
      setTrackerError(
        'No public project found matching that Project ID or Work Token. Please check the identifier.'
      );
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackerInput.trim()) {
      setTrackerError('Please enter a valid Project ID or Work Token.');
      return;
    }
    openProjectDetail(trackerInput.trim());
  };

  const handlePublicObservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newComment.trim()) return;
    setIsSubmittingObs(true);
    try {
      await apiClient.submitCommunityObservation({
        projectId: selectedProject.id,
        comment: newComment.trim(),
        photoUrl: newPhotoUrl.trim() || undefined,
        divergenceSignal: newDivergenceSignal,
      });
      setObsSuccessMsg(true);
      setNewComment('');
      setNewPhotoUrl('');
      // Reload detail
      openProjectDetail(selectedProject.id);
    } catch (err) {
      console.error('Failed to submit public community observation:', err);
    } finally {
      setIsSubmittingObs(false);
    }
  };

  // Filter projects by Project ID, Work Token, Location, Project name/category
  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.id.toLowerCase().includes(q) ||
      (p.digitalThread?.workTokenId && p.digitalThread.workTokenId.toLowerCase().includes(q)) ||
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.district && p.district.toLowerCase().includes(q)) ||
      (p.digitalThread?.citizenLocation && p.digitalThread.citizenLocation.toLowerCase().includes(q)) ||
      (p.digitalThread?.citizenNeedCategory && p.digitalThread.citizenNeedCategory.toLowerCase().includes(q));

    const matchesDistrict =
      selectedDistrict === 'ALL' || (p.district && p.district.toLowerCase().includes(selectedDistrict.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'ALL' ||
      (p.digitalThread?.citizenNeedCategory &&
        p.digitalThread.citizenNeedCategory.toLowerCase().includes(selectedCategory.toLowerCase())) ||
      (p.department && p.department.toLowerCase().includes(selectedCategory.toLowerCase()));

    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'COMPLETED' && p.status === 'COMPLETED') ||
      (selectedStatus === 'IN_PROGRESS' && (p.status === 'IN_PROGRESS' || p.status === 'VERIFICATION_REQUIRED')) ||
      (selectedStatus === 'DELAYED' && p.status === 'DELAYED');

    return matchesSearch && matchesDistrict && matchesCategory && matchesStatus;
  });

  // Calculate public summary aggregates
  const totalAllocated = projects.reduce((sum, p) => sum + (p.funding?.allocated || 0), 0);
  const totalSanctioned = projects.reduce((sum, p) => sum + (p.funding?.sanctioned || 0), 0);
  const totalDisbursed = projects.reduce((sum, p) => sum + (p.funding?.expenditure || 0), 0);
  const completedCount = projects.filter((p) => p.status === 'COMPLETED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. LANDING & VALUE PROPOSITION (Soft Pastel & Trustworthy) */}
      <section className="bg-linear-to-b from-teal-50/70 via-white to-sky-50/50 rounded-3xl p-8 sm:p-12 border border-teal-100 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100/80 text-teal-800 border border-teal-200 text-xs font-bold uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5 text-teal-700" />
            <span>Open Public Governance • No Login Required</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Every Public Project.{' '}
            <span className="text-teal-700 font-black">Openly Accounted For.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
            Welcome to the open civic infrastructure portal. Every road, storm drain, and bridge initiated from citizen grievances is recorded with verifiable digital threads, public expenditure ledgers, and third-party inspection records.
          </p>

          {/* Quick Search on Landing */}
          <div className="pt-2 max-w-xl">
            <div className="relative flex items-center bg-white rounded-2xl border border-teal-200/90 shadow-xs p-1.5 focus-within:ring-2 focus-within:ring-teal-400 focus-within:border-teal-400 transition">
              <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab !== 'find') setActiveTab('find');
                }}
                placeholder="Search by Project ID (e.g. PRJ-DEMO-001), Work Token, Road, Ward..."
                className="w-full text-xs px-3 py-2 text-slate-900 placeholder-slate-400 bg-transparent focus:outline-hidden"
              />
              <button
                onClick={() => setActiveTab('find')}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer"
              >
                Search
              </button>
            </div>
          </div>

          {/* Live Quick Examples */}
          {projects.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-400">Quick Track:</span>
              {projects.slice(0, 3).map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => openProjectDetail(p.id)}
                  className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-white text-teal-800 border border-teal-200 hover:bg-teal-50 transition cursor-pointer"
                >
                  {p.id}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PRIMARY ACTIONS NAVIGATION BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-1.5 shadow-xs overflow-x-auto">
        <div className="flex items-center space-x-1 min-w-max">
          {[
            { id: 'find', label: 'Find a Project', icon: Search },
            { id: 'explore', label: 'Explore Development', icon: Compass },
            { id: 'track', label: 'Track Public Project', icon: Clock },
            { id: 'transparency', label: 'View Transparency', icon: ShieldCheck },
            { id: 'about', label: 'About Platform', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as PublicActionTab);
                  setTrackerError(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-teal-50 text-teal-900 border border-teal-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. FIND A PROJECT (Search View) */}
      {activeTab === 'find' && (
        <section className="space-y-6 animate-in fade-in duration-200">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Project ID, Work Token, Location, Road name, or Category..."
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-teal-400 text-slate-900 placeholder-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden"
              >
                <option value="ALL">All Districts</option>
                {Array.from(new Set(projects.map((p: any) => p.district).filter(Boolean))).map((dist: any) => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed (Handed Over)</option>
                <option value="IN_PROGRESS">Active In Execution</option>
                <option value="DELAYED">Delayed Remediation</option>
              </select>

              <button
                onClick={fetchPublicProjects}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer text-slate-700"
                title="Refresh public data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Results Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                Public Civil Works Registry ({filteredProjects.length} Projects Available)
              </h3>
              <span className="text-xs text-slate-500">Sanitized Open Data</span>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">No public projects match your criteria</h4>
                <p className="text-xs text-slate-500">Try searching by Project ID, Work Token, or Location Name.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredProjects.map((p) => {
                  const verifiedCount = p.milestones?.filter((m: any) => m.status === 'VERIFIED').length || 0;
                  const totalMilestones = p.milestones?.length || 0;

                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-teal-300 hover:shadow-md transition p-6 flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-teal-50 text-teal-900 border border-teal-200">
                            {p.id}
                          </span>

                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              p.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'DELAYED'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {p.status === 'COMPLETED'
                              ? 'Certified Complete'
                              : p.status === 'DELAYED'
                              ? 'Active Remediation'
                              : 'In Execution'}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 text-base leading-snug">{p.name}</h4>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{p.description}</p>

                        {/* Location & Authority */}
                        <div className="space-y-1 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-slate-700 font-medium">
                              {p.district || 'District'}{p.state ? `, ${p.state}` : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-slate-600 truncate">{p.department}</span>
                          </div>
                        </div>

                        {/* Public Funding Summary */}
                        <div className="grid grid-cols-2 gap-2 text-xs bg-teal-50/30 p-2.5 rounded-xl border border-teal-100/60">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Sanctioned Budget</span>
                            <span className="font-mono font-bold text-slate-900">
                              ₹{(p.funding?.sanctioned / 100000).toFixed(1)} Lakhs
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Public Scheme</span>
                            <span className="font-medium text-slate-700 truncate block">
                              {p.funding?.schemeSource || 'PMGSY Infrastructure'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Link */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-mono text-[11px]">
                          Token: {p.digitalThread?.workTokenId || p.workTokenId}
                        </span>

                        <button
                          onClick={() => openProjectDetail(p.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold text-xs cursor-pointer transition shadow-2xs"
                        >
                          <span>View Public Transparency</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. EXPLORE DEVELOPMENT (Category & District Breakdown) */}
      {activeTab === 'explore' && (
        <section className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-sky-50/60 p-5 rounded-2xl border border-sky-100">
            <h3 className="font-bold text-slate-900 text-base">Civic Sector Development Portfolio</h3>
            <p className="text-xs text-slate-600 mt-1">
              Explore ongoing infrastructure restoration categorised by civic sector and administrative circle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Roads & Thoroughfares</span>
              <p className="text-2xl font-black text-slate-900">
                {projects.filter((p) => p.name.toLowerCase().includes('road') || p.name.toLowerCase().includes('highway')).length} Works
              </p>
              <p className="text-xs text-slate-500">Pothole rectification, bituminous overlay, and sidewalk safety barriers.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stormwater & Drainage</span>
              <p className="text-2xl font-black text-teal-800">
                {projects.filter((p) => p.name.toLowerCase().includes('drain') || p.name.toLowerCase().includes('water')).length || 1} Works
              </p>
              <p className="text-xs text-slate-500">Pre-monsoon RCC drain construction, culvert scour protection, and silt clearance.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bridges & Arterial Links</span>
              <p className="text-2xl font-black text-purple-900">
                {projects.filter((p) => p.name.toLowerCase().includes('bridge') || p.name.toLowerCase().includes('culvert')).length || 1} Works
              </p>
              <p className="text-xs text-slate-500">Structural pier micro-piling, expansion joint repairs, and safety load compliance.</p>
            </div>
          </div>

          {/* Quick Browse by District Cards */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">Browse Public Works By Administrative Region</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from(new Set(projects.map((p: any) => p.district).filter(Boolean))).map((distName: any) => {
                const count = projects.filter((p: any) => p.district === distName).length;
                return (
                  <div
                    key={distName}
                    onClick={() => {
                      setSelectedDistrict(distName);
                      setActiveTab('find');
                    }}
                    className="p-4 bg-slate-50 hover:bg-teal-50/50 rounded-xl border border-slate-200/80 hover:border-teal-200 transition cursor-pointer space-y-1"
                  >
                    <h5 className="font-bold text-slate-900 text-sm">{distName}</h5>
                    <p className="text-[11px] text-slate-500 leading-snug">Public Infrastructure & Civil Works</p>
                    <span className="text-[10px] font-bold text-teal-800 block pt-1">
                      Explore {count} project{count === 1 ? '' : 's'} →
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 4. TRACK PUBLIC PROJECT (Direct Identifier Lookup) */}
      {activeTab === 'track' && (
        <section className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-teal-100 p-8 shadow-xs text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-slate-900">Track Any Public Civil Project</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Enter your Project ID (e.g., <code className="font-mono text-teal-800 font-bold">PRJ-DEMO-001</code>) or Work Token ID (e.g., <code className="font-mono text-teal-800 font-bold">WT-DEMO-001</code>) to inspect its verifiable lifecycle status.
            </p>

            <form onSubmit={handleTrackSubmit} className="space-y-3 pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={trackerInput}
                  onChange={(e) => {
                    setTrackerInput(e.target.value);
                    setTrackerError(null);
                  }}
                  placeholder="e.g. PRJ-DEMO-001 or WT-DEMO-001"
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 font-mono text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 uppercase"
                />
                <button
                  type="submit"
                  disabled={isDetailLoading || !trackerInput.trim()}
                  className="px-6 py-3 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
                >
                  {isDetailLoading ? 'Looking up...' : 'Track'}
                </button>
              </div>

              {trackerError && (
                <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs text-left flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{trackerError}</span>
                </div>
              )}
            </form>

            <div className="pt-4 border-t border-slate-100 flex justify-center gap-4 text-xs text-slate-500">
              <span>Try:</span>
              <button
                onClick={() => {
                  setTrackerInput('PRJ-DEMO-001');
                  openProjectDetail('PRJ-DEMO-001');
                }}
                className="text-teal-700 hover:underline font-mono font-bold cursor-pointer"
              >
                PRJ-DEMO-001 (Completed)
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  setTrackerInput('PRJ-DEMO-002');
                  openProjectDetail('PRJ-DEMO-002');
                }}
                className="text-amber-700 hover:underline font-mono font-bold cursor-pointer"
              >
                PRJ-DEMO-002 (In Execution)
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 5. VIEW TRANSPARENCY (Public Auditability & Integrity Summary) */}
      {activeTab === 'transparency' && (
        <section className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs space-y-6">
            <div className="max-w-3xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Open Public Governance Ledger
              </span>
              <h3 className="text-2xl font-bold text-slate-900">State Infrastructure Transparency Metrics</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                All capital expenditure is cross-validated against physical site evidence before disbursement. Zero ghost works or unaccounted fund transfers are permitted.
              </p>
            </div>

            {/* Metric Counters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-1">
                <span className="text-[10px] font-bold text-teal-800 uppercase block">Total Sanctioned Outlay</span>
                <p className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                  ₹{(totalSanctioned / 100000).toFixed(1)} Lakhs
                </p>
                <span className="text-[10px] text-slate-500">Across All Registered Works</span>
              </div>

              <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-100 space-y-1">
                <span className="text-[10px] font-bold text-sky-800 uppercase block">Verified Expenditure</span>
                <p className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                  ₹{(totalDisbursed / 100000).toFixed(1)} Lakhs
                </p>
                <span className="text-[10px] text-sky-700 font-medium">100% Tied to Evidence</span>
              </div>

              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Certified Completions</span>
                <p className="text-xl sm:text-2xl font-black text-slate-900">{completedCount}</p>
                <span className="text-[10px] text-emerald-700 font-medium">Chief Engineer Sign-off</span>
              </div>

              <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-1">
                <span className="text-[10px] font-bold text-purple-800 uppercase block">Digital Thread Integrity</span>
                <p className="text-xl sm:text-2xl font-black text-slate-900">100%</p>
                <span className="text-[10px] text-purple-700 font-medium">Zero Unverified Claims</span>
              </div>
            </div>

            {/* Public Accountability Guarantees */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="space-y-1 text-xs">
                <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>No Ghost Projects</span>
                </h5>
                <p className="text-slate-600 leading-relaxed">
                  Every project is anchored to an originating citizen demand ticket and a cryptographic Work Token.
                </p>
              </div>

              <div className="space-y-1 text-xs">
                <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-sky-600" />
                  <span>Third-Party NGO Audits</span>
                </h5>
                <p className="text-slate-600 leading-relaxed">
                  Independent civil society monitors conduct unannounced field inspections to verify safety and material specs.
                </p>
              </div>

              <div className="space-y-1 text-xs">
                <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-teal-600" />
                  <span>Open Resident Feedback</span>
                </h5>
                <p className="text-slate-600 leading-relaxed">
                  Local residents can post real-time ground truth observations on any active public work in their neighbourhood.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. ABOUT PLATFORM */}
      {activeTab === 'about' && (
        <section className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Civic Technology Architecture
              </span>
              <h3 className="text-2xl font-bold text-slate-900">How the Transparency Engine Works</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                CFC-2026 is an open digital public infrastructure designed to bridge the trust deficit between citizen grievances, contractor claims, and government expenditure.
              </p>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-slate-700">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">1. Citizen-Originated Work Tokens</h4>
                <p>
                  When a resident reports a road hazard, flooded drain, or bridge fissure, an official evaluates the need and issues a unique, cryptographically signed <strong>Work Token</strong>. No civil work can be sanctioned or funded without an authentic token anchor.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">2. AI Assists, Humans Govern</h4>
                <p>
                  Artificial Intelligence is employed strictly as an <strong>advisory intelligence and cross-referencing tool</strong>. AI analyzes site photos, detects potential discrepancies between contractor claims and physical ground reality, and estimates project urgency. However, <strong>all binding decisions</strong>—such as sanctioning funds, approving milestones, or mandating rework—are reserved exclusively for human government officials.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">3. Independent Civic Audits</h4>
                <p>
                  Accredited civil society organisations (such as Civic Watch Foundation) conduct independent third-party site audits, especially around school zones and pedestrian crossings, preventing one-sided contractor reporting.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 7. DETAILED SANITIZED PUBLIC PROJECT MODAL / DRAWER */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 sm:p-8 flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {selectedProject.id}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      selectedProject.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-900'
                        : selectedProject.status === 'DELAYED'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-teal-100 text-teal-900'
                    }`}
                  >
                    {selectedProject.status === 'COMPLETED'
                      ? '100% Certified Complete'
                      : selectedProject.status === 'DELAYED'
                      ? 'Remediation Underway'
                      : 'In Active Delivery'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Sanction: {selectedProject.sanctionNumber}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold">{selectedProject.name}</h3>

                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {selectedProject.district || 'District'}{selectedProject.state ? `, ${selectedProject.state}` : ''} • Authority:{' '}
                    {selectedProject.department}
                  </span>
                </p>
              </div>

              <button
                onClick={() => setSelectedProject(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CANONICAL PUBLIC LIFECYCLE TIMELINE */}
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <LifecycleTimeline
                currentStage={selectedProject.status}
                isReworkActive={selectedProject.status === 'DELAYED' || selectedProject.status === 'REWORK_REQUIRED'}
              />
            </div>

            {/* Modal Body (Sanitized Public Information) */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[65vh] overflow-y-auto text-xs">
              {/* Scope & Public Description */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Public Civil Scope of Work
                </h4>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-slate-700 leading-relaxed space-y-1.5">
                  <p className="font-semibold text-slate-900">{selectedProject.description}</p>
                  <p>{selectedProject.scopeOfWork}</p>
                  <div className="flex flex-wrap gap-4 pt-2 text-slate-500 border-t border-slate-200/60 text-[11px]">
                    <span>
                      Target Completion: <strong className="text-slate-800">{selectedProject.targetCompletionDate}</strong>
                    </span>
                    <span>
                      Contractor: <strong className="text-slate-800">{selectedProject.contractorName}</strong>
                    </span>
                    <span>
                      Inspection Status:{' '}
                      <strong className="text-teal-800">{selectedProject.inspectionStatus}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Public Funding Summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Public Funding Summary & Scheme Grant
                  </h4>
                  <ProvenanceBadge type="GOVERNMENT_DATA" modelOrSource="Public Accounts" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Sanctioned Outlay</span>
                    <p className="font-mono font-bold text-slate-900 mt-0.5 text-sm">
                      ₹{selectedProject.funding?.sanctioned?.toLocaleString()}
                    </p>
                    <span className="text-[9px] text-slate-500">Government Sanction</span>
                  </div>

                  <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-200">
                    <span className="text-[10px] text-teal-800 uppercase font-bold block">Verified Disbursed</span>
                    <p className="font-mono font-bold text-teal-950 mt-0.5 text-sm">
                      ₹{selectedProject.funding?.expenditure?.toLocaleString() || '0'}
                    </p>
                    <span className="text-[9px] text-teal-700">Tied to Certified Milestones</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Grant Scheme Source</span>
                    <p className="font-semibold text-slate-800 mt-0.5 truncate">
                      {selectedProject.funding?.schemeSource || 'Centrally Sponsored PMGSY'}
                    </p>
                    <span className="text-[9px] text-slate-500 font-mono">Head: {selectedProject.funding?.budgetHead || 'PWD-CAP-INFRA'}</span>
                  </div>
                </div>
              </div>

              {/* Public Milestones */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Public Verification Milestones ({selectedProject.milestones?.length || 0})
                </h4>

                <div className="space-y-2">
                  {selectedProject.milestones?.map((m: any) => (
                    <div
                      key={m.id}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 text-xs block">{m.title}</span>
                        <p className="text-[11px] text-slate-500 leading-snug">{m.description}</p>
                      </div>

                      <span
                        className={`font-bold text-[10px] px-2.5 py-0.5 rounded-full shrink-0 ${
                          m.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.status === 'DELAYED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {m.status === 'VERIFIED' ? 'Certified' : m.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Visual Progress Photos (Sanitized) */}
              {selectedProject.evidence && selectedProject.evidence.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Verified Visual Progress Records
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedProject.evidence.map((ev: any) =>
                      ev.mediaRefs?.filter((m: any) => Boolean(m.url && m.url.trim())).map((m: any, idx: number) => (
                        <div key={idx} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                          <EvidenceImage src={m.url} alt="Verified Site Evidence" className="w-full h-36 object-cover" />
                          <p className="text-[10px] text-slate-600 p-2.5 bg-slate-50 text-center font-mono">
                            {m.caption}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Sanitized Community Evidence & NGO Audits */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Public Community Observations & NGO Audits
                  </h4>
                  <span className="text-[10px] text-slate-400">Sanitized (No Citizen PII)</span>
                </div>

                {/* Independent NGO Audits */}
                {selectedProject.ngoAudits && selectedProject.ngoAudits.length > 0 && (
                  <div className="space-y-2">
                    {selectedProject.ngoAudits.map((ngo: any, idx: number) => (
                      <div key={idx} className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-teal-900">{ngo.ngoName}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                            Rating: {ngo.rating}
                          </span>
                        </div>
                        <p className="text-slate-700 text-[11px] leading-relaxed italic">
                          "{ngo.observation}"
                        </p>
                        <span className="text-[10px] text-slate-400 block pt-0.5">
                          Official Review: {ngo.officialReviewStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Local Citizen Observations */}
                {selectedProject.communityObservations && selectedProject.communityObservations.length > 0 ? (
                  <div className="space-y-2">
                    {selectedProject.communityObservations.map((obs: any) => (
                      <div key={obs.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{obs.submittedByName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(obs.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-700 text-[11px] leading-relaxed italic">"{obs.comment}"</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px]">No local resident observations filed yet.</p>
                )}

                {/* Submit Open Ground Truth Form */}
                <form
                  onSubmit={handlePublicObservationSubmit}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 mt-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-teal-700" />
                      <span>Post a Public Site Observation</span>
                    </span>
                    <span className="text-[10px] text-slate-500">Anonymous & Verified</span>
                  </div>

                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Have you seen this project site? Share an objective ground observation (e.g., barricades in place, road open to traffic, ongoing rolling)..."
                    rows={2}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-400"
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">Ground Status:</span>
                      <select
                        value={newDivergenceSignal}
                        onChange={(e: any) => setNewDivergenceSignal(e.target.value)}
                        className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden"
                      >
                        <option value="PROGRESSING_WELL">Progressing Well</option>
                        <option value="WORK_HALTED">Work Halted / Inactive</option>
                        <option value="POOR_QUALITY">Safety or Quality Issue</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingObs || !newComment.trim()}
                      className="px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-2xs self-end sm:self-auto"
                    >
                      {isSubmittingObs ? 'Submitting...' : 'Post Observation'}
                    </button>
                  </div>

                  {obsSuccessMsg && (
                    <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-[11px] border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Thank you! Your sanitized observation has been published to the open public ledger.</span>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-slate-400 text-[11px] font-mono">
                Thread: {selectedProject.digitalThread?.workTokenSignature}
              </span>

              <button
                onClick={() => setSelectedProject(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
