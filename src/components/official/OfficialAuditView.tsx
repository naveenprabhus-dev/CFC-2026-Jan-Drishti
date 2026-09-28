import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { AuditEvent } from '../../types/domain';
import { ProvenanceBadge } from '../common/ProvenanceBadge';
import { useLanguage } from '../../context/LanguageContext';
import {
  ShieldCheck,
  Search,
  Clock,
  CheckCircle2,
  FileText,
  Activity,
  User,
  Filter,
} from 'lucide-react';

export const OfficialAuditView: React.FC = () => {
  const { t } = useLanguage();
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchAudit = async () => {
      setIsLoading(true);
      try {
        const logs = await apiClient.getAuditEvents();
        setAuditLogs(logs);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAudit();
  }, []);

  const filteredLogs = auditLogs.filter(
    (a) =>
      a.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.reason && a.reason.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              {t('digitalAuditTrailTitle') || 'Cryptographic Governance Audit Trail'}
            </h2>
            <ProvenanceBadge type="OFFICIAL_DECISION" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('digitalAuditTrailSub') ||
              'Immutable event ledger capturing every state change, human decision, AI recommendation, and photo hash'}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('search') || 'Search audit logs by actor, action name, or entity ID...'}
          className="w-full text-xs bg-transparent focus:outline-none"
        />
      </div>

      {/* Audit Events List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Logged Cryptographic Events ({filteredLogs.length})</span>
          <span className="font-mono text-slate-400">Ledger Verified</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading audit ledger...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No audit events found.</div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50/70 transition space-y-1.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{log.action}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                      {log.entityType}: {log.entityId}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-600 text-[11px]">
                  <span>
                    Actor: <strong>{log.actor}</strong> ({log.actorRole})
                  </span>
                  {log.previousState && log.newState && (
                    <span>
                      State: <strong className="text-slate-800">{log.previousState}</strong> →{' '}
                      <strong className="text-emerald-700">{log.newState}</strong>
                    </span>
                  )}
                </div>

                {log.reason && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                    "{log.reason}"
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
