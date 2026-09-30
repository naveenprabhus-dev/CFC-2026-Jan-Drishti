import React, { useState, useEffect } from 'react';
import { CitizenRequest, IssueCluster } from '../../types/domain';
import { apiClient } from '../../services/api';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { TranslatedText } from '../common/TranslatedText';
import { useLanguage } from '../../context/LanguageContext';
import {
  Search,
  Filter,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileText,
  ChevronRight,
  ShieldCheck,
  Building,
  Users,
  Activity,
  Layers,
} from 'lucide-react';

interface OfficialRequestQueueProps {
  requests: CitizenRequest[];
  clusters?: IssueCluster[];
  onOpenTriage?: (request: CitizenRequest) => void;
  onOpenClusterTriage?: (cluster: IssueCluster) => void;
  onOpenRequestDetail?: (request: CitizenRequest) => void;
}

export const OfficialRequestQueue: React.FC<OfficialRequestQueueProps> = ({
  requests,
  clusters: initialClusters,
  onOpenTriage,
  onOpenClusterTriage,
  onOpenRequestDetail,
}) => {
  const { t } = useLanguage();
  const [clusters, setClusters] = useState<IssueCluster[]>(initialClusters || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialClusters);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    const fetchClusters = async () => {
      try {
        const fetched = await apiClient.getOfficialClusters();
        if (isMounted && Array.isArray(fetched)) {
          setClusters(fetched);
        }
      } catch (err) {
        console.warn('Failed to load official issue clusters:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchClusters();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayClusters = clusters.length > 0 ? clusters : [];

  const filteredClusters = displayClusters.filter((c) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      c.canonicalTitle.toLowerCase().includes(query) ||
      c.id.toLowerCase().includes(query) ||
      c.location.address.toLowerCase().includes(query) ||
      c.location.district.toLowerCase().includes(query) ||
      c.category.toLowerCase().includes(query) ||
      c.priorityReasoning.some((r) => r.toLowerCase().includes(query));

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesPriority =
      priorityFilter === 'ALL' || c.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'IN_PROGRESS':
      case 'PROJECT_CREATED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'TOKEN_ISSUED':
      case 'TRIAGED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'SUBMITTED':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header & Jurisdiction Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              Aggregated Issue Clusters
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
              PWD Central Circle Jurisdiction
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Multiple citizen complaints covering the same real-world defect are aggregated into unified operational issue clusters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-2xl flex items-center gap-2 text-xs font-bold text-amber-900">
            <Users className="w-4 h-4 text-amber-600" />
            <span>Total Citizen Reports: {requests.length}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-900">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Operational Clusters: {clusters.length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Cluster ID, defect keywords, or ward location..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700 font-semibold focus:outline-none transition cursor-pointer"
          >
            <option value="ALL">All Statuses ({clusters.length})</option>
            <option value="SUBMITTED">Submitted (Pending Triage)</option>
            <option value="TOKEN_ISSUED">Work Token Issued</option>
            <option value="IN_PROGRESS">In Execution</option>
            <option value="COMPLETED">Certified Complete</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700 font-semibold focus:outline-none transition cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="EMERGENCY">Emergency Priority</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Clusters Table / Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Cluster ID & Date</th>
                <th className="py-3.5 px-4">Canonical Issue & Location</th>
                <th className="py-3.5 px-4">Citizen Demand Signal</th>
                <th className="py-3.5 px-4">Department & Category</th>
                <th className="py-3.5 px-4">Priority & Reasoning</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Administrative Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading issue clusters...
                  </td>
                </tr>
              ) : filteredClusters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No issue clusters match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredClusters.map((cluster) => (
                  <tr key={cluster.id} className="hover:bg-slate-50/70 transition">
                    {/* Cluster ID & Dates */}
                    <td className="py-4 px-4 align-top">
                      <span className="font-mono font-black text-xs text-slate-900 block">
                        {cluster.id}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Latest: {new Date(cluster.lastReportedAt).toLocaleDateString()}
                      </span>
                      {cluster.linkedWorkTokenId && (
                        <span className="mt-1 inline-block font-mono text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                          {cluster.linkedWorkTokenId}
                        </span>
                      )}
                    </td>

                    {/* Canonical Issue Title & Location */}
                    <td className="py-4 px-4 align-top max-w-xs">
                      <span className="font-extrabold text-xs text-slate-900 block leading-snug">
                        {cluster.canonicalTitle}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate inline-block font-medium">
                          {cluster.location.address}, {cluster.location.district}
                        </span>
                      </div>
                    </td>

                    {/* Prominent Citizen Report Count */}
                    <td className="py-4 px-4 align-top">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[11px] border border-amber-300 shadow-2xs">
                        <Users className="w-3.5 h-3.5 text-amber-700" />
                        <span>{cluster.reportCount} citizens reported</span>
                      </span>
                    </td>

                    {/* Department & Category */}
                    <td className="py-4 px-4 align-top">
                      <span className="text-[11px] font-bold text-slate-800 block truncate max-w-[140px]">
                        {cluster.department}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 block">
                        {cluster.category.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Priority & Reasoning */}
                    <td className="py-4 px-4 align-top max-w-xs">
                      <div className="space-y-1">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            cluster.priority === 'EMERGENCY'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {cluster.priority}
                        </span>
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          {cluster.priorityReasoning.slice(0, 2).join(' • ')}
                        </p>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 align-top">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                          cluster.status
                        )}`}
                      >
                        {cluster.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 align-top text-right">
                      {onOpenClusterTriage && (
                        <button
                          onClick={() => onOpenClusterTriage(cluster)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Review Issue ({cluster.reportCount})</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
