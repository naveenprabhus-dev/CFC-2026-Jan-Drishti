import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiClient } from '../../services/api';
import { CitizenRequest } from '../../types/domain';
import { CitizenHome } from './CitizenHome';
import { CitizenReportView } from './CitizenReportView';
import { CitizenRequestsView } from './CitizenRequestsView';
import { CitizenTrackWorkView } from './CitizenTrackWorkView';
import { CitizenObservationView } from './CitizenObservationView';
import { CitizenProfileView } from './CitizenProfileView';
import { RequestDetailModal } from './RequestDetailModal';
import {
  Home,
  PlusCircle,
  FileText,
  Activity,
  MessageSquare,
  Globe,
  User,
  RefreshCw,
} from 'lucide-react';

interface CitizenWorkspaceProps {
  onOpenProject: (projectId: string) => void;
  onOpenToken: (tokenId: string) => void;
  onOpenPublicTransparency?: () => void;
}

type CitizenView =
  | 'HOME'
  | 'REPORT'
  | 'MY_REQUESTS'
  | 'TRACK_WORK'
  | 'MY_PROJECTS'
  | 'OBSERVATION'
  | 'PROFILE';

export const CitizenWorkspace: React.FC<CitizenWorkspaceProps> = ({
  onOpenProject,
  onOpenToken,
  onOpenPublicTransparency,
}) => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [activeView, setActiveView] = useState<CitizenView>('HOME');
  const [requests, setRequests] = useState<CitizenRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected request modal
  const [selectedRequestModal, setSelectedRequestModal] = useState<CitizenRequest | null>(null);

  // Parameter for Track Work & Observation
  const [trackTokenId, setTrackTokenId] = useState<string>('WT-DEMO-001');
  const [observationProjectId, setObservationProjectId] = useState<string>('PRJ-DEMO-002');

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getCitizenRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load citizen requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentUser?.id]);

  useEffect(() => {
    const handleCfcNavigate = (e: any) => {
      const target = e.detail;
      if (target === 'CITIZEN_HOME') setActiveView('HOME');
      else if (target === 'CITIZEN_REPORT') setActiveView('REPORT');
      else if (target === 'CITIZEN_MY_REQUESTS') setActiveView('MY_REQUESTS');
      else if (target === 'CITIZEN_TRACK_WORK') setActiveView('TRACK_WORK');
      else if (target === 'CITIZEN_OBSERVATION') setActiveView('OBSERVATION');
      else if (target === 'CITIZEN_PROFILE') setActiveView('PROFILE');
    };

    window.addEventListener('cfc-navigate', handleCfcNavigate);
    return () => {
      window.removeEventListener('cfc-navigate', handleCfcNavigate);
    };
  }, []);

  const handleReportSuccess = (newReq: CitizenRequest) => {
    setRequests((prev) => [newReq, ...prev]);
  };

  const handleTrackRequest = (req: CitizenRequest) => {
    if (req.workTokenId) {
      setTrackTokenId(req.workTokenId);
    } else {
      setTrackTokenId(req.id);
    }
    setActiveView('TRACK_WORK');
  };

  const handleTrackTokenDirect = (tokenId: string) => {
    setTrackTokenId(tokenId);
    setActiveView('TRACK_WORK');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Sub-Navigation Navigation Bar for Citizen Use Cases */}
      <nav className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          <button
            type="button"
            onClick={() => setActiveView('HOME')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeView === 'HOME'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>{t('citizenHome')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('REPORT')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeView === 'REPORT'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{t('reportIssue')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('MY_REQUESTS')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeView === 'MY_REQUESTS'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('myRequests')} ({requests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('TRACK_WORK')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeView === 'TRACK_WORK'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{t('trackWork')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('OBSERVATION')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeView === 'OBSERVATION'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t('communityObs')}</span>
          </button>

          {onOpenPublicTransparency && (
            <button
              type="button"
              onClick={onOpenPublicTransparency}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{t('transparency')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveView('PROFILE')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeView === 'PROFILE'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{t('profile')}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={fetchRequests}
          disabled={isLoading}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition cursor-pointer shrink-0"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </nav>

      {/* View Content Switcher */}
      <main>
        {activeView === 'HOME' && (
          <CitizenHome
            requests={requests}
            onNavigate={(v) => setActiveView(v)}
            onOpenReport={() => setActiveView('REPORT')}
            onSelectRequest={(r) => setSelectedRequestModal(r)}
            onOpenPublicTransparency={() => {
              if (onOpenPublicTransparency) {
                onOpenPublicTransparency();
              } else {
                setActiveView('TRACK_WORK');
              }
            }}
          />
        )}

        {activeView === 'REPORT' && (
          <CitizenReportView
            onBack={() => setActiveView('HOME')}
            onSuccess={handleReportSuccess}
            onTrackRequest={handleTrackRequest}
            onOpenProjectDetail={onOpenProject}
          />
        )}

        {activeView === 'MY_REQUESTS' && (
          <CitizenRequestsView
            requests={requests}
            onBack={() => setActiveView('HOME')}
            onSelectRequest={(r) => setSelectedRequestModal(r)}
            onOpenReport={() => setActiveView('REPORT')}
            onTrackToken={handleTrackTokenDirect}
          />
        )}

        {(activeView === 'TRACK_WORK' || activeView === 'MY_PROJECTS') && (
          <CitizenTrackWorkView
            initialTokenId={trackTokenId}
            requests={requests}
            onBack={() => setActiveView('HOME')}
            onOpenProject={onOpenProject}
          />
        )}

        {activeView === 'OBSERVATION' && (
          <CitizenObservationView
            initialProjectId={observationProjectId}
            onBack={() => setActiveView('HOME')}
            onOpenProject={onOpenProject}
          />
        )}

        {activeView === 'PROFILE' && (
          <CitizenProfileView
            onBack={() => setActiveView('HOME')}
            requestsCount={requests.length}
          />
        )}
      </main>

      {/* Global Request Detail Modal */}
      {selectedRequestModal && (
        <RequestDetailModal
          request={selectedRequestModal}
          onClose={() => setSelectedRequestModal(null)}
          onOpenProject={(pId) => {
            setSelectedRequestModal(null);
            onOpenProject(pId);
          }}
        />
      )}
    </div>
  );
};

