import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { apiClient } from './services/api';
import { Header } from './components/common/Header';
import { LandingPage } from './components/auth/LandingPage';
import { LoginModal } from './components/auth/LoginModal';
import { RegisterModal } from './components/auth/RegisterModal';
import { DemoLoginModal } from './components/auth/DemoLoginModal';
import { CitizenWorkspace } from './components/citizen/CitizenWorkspace';
import { OfficialWorkspace } from './components/official/OfficialWorkspace';
import { ContractorWorkspace } from './components/contractor/ContractorWorkspace';
import { PolicymakerWorkspace } from './components/policymaker/PolicymakerWorkspace';
import { NGOWorkspace } from './components/ngo/NGOWorkspace';
import { TransparencyPortal } from './components/transparency/TransparencyPortal';
import { ProjectDetailModal } from './components/project/ProjectDetailModal';
import { RequestDetailModal } from './components/citizen/RequestDetailModal';
import { FloatingAssistant } from './components/common/FloatingAssistant';
import { UserRole } from './types/domain';

const AppContent: React.FC = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();

  // Public Transparency toggle state (allows viewing public portal even without logging in or while logged in)
  const [isPublicPortalActive, setIsPublicPortalActive] = useState<boolean>(false);

  // Floating Assistant state
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);

  // Custom event listener for navigation inside the assistant
  useEffect(() => {
    const handleTransparencyNav = () => {
      setIsPublicPortalActive(true);
    };
    const handleCfcNavigate = () => {
      setIsPublicPortalActive(false);
    };

    window.addEventListener('cfc-navigate-transparency', handleTransparencyNav);
    window.addEventListener('cfc-navigate', handleCfcNavigate);

    return () => {
      window.removeEventListener('cfc-navigate-transparency', handleTransparencyNav);
      window.removeEventListener('cfc-navigate', handleCfcNavigate);
    };
  }, []);

  // Authentication Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginRole, setLoginRole] = useState<UserRole>('CITIZEN');

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerRole, setRegisterRole] = useState<UserRole>('CITIZEN');

  const [isDemoLoginOpen, setIsDemoLoginOpen] = useState(false);

  // Shared Global Modals
  const [modalProjectId, setModalProjectId] = useState<string | null>(null);
  const [activeRequestObj, setActiveRequestObj] = useState<any | null>(null);

  const handleOpenProject = (projectId: string) => {
    setModalProjectId(projectId);
  };

  const handleOpenToken = (tokenId: string) => {
    setModalProjectId('PRJ-DEMO-001');
  };

  const handleOpenQuickDemo = (demoId: 'DEMO-001' | 'DEMO-002' | 'DEMO-003') => {
    if (demoId === 'DEMO-001') {
      setModalProjectId('PRJ-DEMO-001');
    } else if (demoId === 'DEMO-002') {
      setModalProjectId('PRJ-DEMO-002');
    } else if (demoId === 'DEMO-003') {
      setModalProjectId('PRJ-DEMO-003');
    }
  };

  const handleOpenLoginModal = (preferredRole?: UserRole) => {
    if (preferredRole) setLoginRole(preferredRole);
    setIsLoginOpen(true);
  };

  const handleOpenRegisterModal = (preferredRole?: UserRole) => {
    if (preferredRole) setRegisterRole(preferredRole);
    setIsRegisterOpen(true);
  };

  // Render main body content based on Authentication state & Role
  const renderMainContent = () => {
    // 1. If user explicitly toggled Public Portal (or logged in as PUBLIC_VIEWER)
    if (isPublicPortalActive || (isAuthenticated && currentUser?.role === 'PUBLIC_VIEWER')) {
      return <TransparencyPortal />;
    }

    // 2. If NOT authenticated, show the landing page
    if (!isAuthenticated || !currentUser) {
      return (
        <LandingPage
          onOpenLogin={handleOpenLoginModal}
          onOpenRegister={handleOpenRegisterModal}
          onOpenDemoLogin={() => setIsDemoLoginOpen(true)}
          onOpenPublicTransparency={() => setIsPublicPortalActive(true)}
          onOpenQuickDemo={handleOpenQuickDemo}
          onOpenHelpSupport={() => setIsAssistantOpen(true)}
        />
      );
    }

    // 3. Authenticated: Render the exact workspace assigned to the user's role
    switch (currentUser.role) {
      case 'CITIZEN':
        return (
          <CitizenWorkspace
            onOpenProject={handleOpenProject}
            onOpenToken={handleOpenToken}
            onOpenPublicTransparency={() => setIsPublicPortalActive(true)}
          />
        );
      case 'OFFICIAL':
        return (
          <OfficialWorkspace
            onOpenProject={handleOpenProject}
            onOpenToken={handleOpenToken}
          />
        );
      case 'CONTRACTOR':
        return (
          <ContractorWorkspace
            onOpenProject={handleOpenProject}
            onOpenToken={handleOpenToken}
          />
        );
      case 'POLICYMAKER':
        return (
          <PolicymakerWorkspace
            onOpenProject={handleOpenProject}
            onOpenToken={handleOpenToken}
          />
        );
      case 'NGO':
        return <NGOWorkspace onOpenProject={handleOpenProject} />;
      case 'PUBLIC_VIEWER':
      default:
        return <TransparencyPortal />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      <Header
        onOpenLogin={handleOpenLoginModal}
        onOpenRegister={handleOpenRegisterModal}
        onOpenDemoLogin={() => setIsDemoLoginOpen(true)}
        onOpenQuickDemo={handleOpenQuickDemo}
        isPublicPortalView={isPublicPortalActive}
        onTogglePublicPortal={() => setIsPublicPortalActive(!isPublicPortalActive)}
        onNavigateHome={() => {
          setIsPublicPortalActive(false);
        }}
        onOpenHelpSupport={() => setIsAssistantOpen(true)}
      />

      <main className="flex-1 pb-16">{renderMainContent()}</main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-400">CFC-2026</span>
            <span>•</span>
            <span>Public Development Intelligence & Transparency Platform</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
            <span>Digital Public Infrastructure</span>
            <span>•</span>
            <span>Deterministic Governance</span>
            <span>•</span>
            <span>AI Assists; Humans Govern</span>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {isLoginOpen && (
        <LoginModal
          isOpen={isLoginOpen}
          defaultRole={loginRole}
          onClose={() => {
            setIsLoginOpen(false);
            setIsPublicPortalActive(false);
          }}
          onSwitchToRegister={(r) => {
            if (r) setRegisterRole(r);
            setIsRegisterOpen(true);
          }}
          onSwitchToDemoLogin={() => setIsDemoLoginOpen(true)}
        />
      )}

      {/* Register Modal */}
      {isRegisterOpen && (
        <RegisterModal
          isOpen={isRegisterOpen}
          defaultRole={registerRole}
          onClose={() => {
            setIsRegisterOpen(false);
            setIsPublicPortalActive(false);
          }}
          onSwitchToLogin={(r) => {
            if (r) setLoginRole(r);
            setIsLoginOpen(true);
          }}
          onSwitchToDemoLogin={() => setIsDemoLoginOpen(true)}
        />
      )}

      {/* Demo Login Modal */}
      {isDemoLoginOpen && (
        <DemoLoginModal
          isOpen={isDemoLoginOpen}
          onClose={() => {
            setIsDemoLoginOpen(false);
            setIsPublicPortalActive(false);
          }}
          onSelectRole={() => {
            setIsPublicPortalActive(false);
          }}
        />
      )}

      {/* Global Project Detail Console */}
      {modalProjectId && (
        <ProjectDetailModal
          projectId={modalProjectId}
          onClose={() => setModalProjectId(null)}
        />
      )}

      {/* Global Request Detail Modal */}
      {activeRequestObj && (
        <RequestDetailModal
          request={activeRequestObj}
          onClose={() => setActiveRequestObj(null)}
          onOpenProject={(pId) => {
            setActiveRequestObj(null);
            setModalProjectId(pId);
          }}
        />
      )}

      {/* Global Gemini Civic Assistant */}
      <FloatingAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
