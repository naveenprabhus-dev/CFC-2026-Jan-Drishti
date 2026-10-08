import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types/domain';
import { AuthorityScopeModal } from './AuthorityScopeModal';
import {
  Building2,
  Shield,
  UserCheck,
  HardHat,
  TrendingUp,
  Globe,
  Bell,
  RotateCcw,
  Sparkles,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Users,
  ShieldAlert,
  ArrowLeft,
  Landmark,
} from 'lucide-react';

interface HeaderProps {
  onOpenLogin?: (preferredRole?: UserRole) => void;
  onOpenRegister?: (preferredRole?: UserRole) => void;
  onOpenPersonaSwitcher?: () => void;
  isPublicPortalView?: boolean;
  onTogglePublicPortal?: () => void;
  onNavigateHome?: () => void;
  onOpenHelpSupport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenLogin,
  onOpenRegister,
  onOpenPersonaSwitcher,
  isPublicPortalView = false,
  onTogglePublicPortal,
  onNavigateHome,
  onOpenHelpSupport,
}) => {
  const {
    currentUser,
    isAuthenticated,
    isAdmin,
    isAdminPreview,
    notifications,
    unreadCount,
    markRead,
    resetDatabase,
    logout,
    stopAdminPreview,
    isLoading,
  } = useAuth();

  const { language, setLanguage, supportedLanguages, currentLanguageOption, t } = useLanguage();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <ShieldAlert className="w-4 h-4 text-emerald-600" />;
      case 'CITIZEN':
        return <UserCheck className="w-4 h-4 text-sky-600" />;
      case 'OFFICIAL':
        return <Shield className="w-4 h-4 text-emerald-600" />;
      case 'SANCTIONING_AUTHORITY':
        return <Landmark className="w-4 h-4 text-indigo-600" />;
      case 'CONTRACTOR':
        return <HardHat className="w-4 h-4 text-amber-600" />;
      case 'POLICYMAKER':
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case 'NGO':
        return <Building2 className="w-4 h-4 text-teal-600" />;
      case 'PUBLIC_VIEWER':
      default:
        return <Globe className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getRoleWorkspaceTitle = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'Admin Workspace';
      case 'CITIZEN':
        return t('citizenHome');
      case 'OFFICIAL':
        return t('officialDashboard');
      case 'SANCTIONING_AUTHORITY':
        return 'Sanctioning Authority Workspace';
      case 'CONTRACTOR':
        return t('contractorPortal');
      case 'POLICYMAKER':
        return t('policymakerPortal');
      case 'NGO':
        return t('ngoPortal');
      case 'PUBLIC_VIEWER':
      default:
        return t('publicTransparencyPortal');
    }
  };

  const handleReset = async () => {
    await resetDatabase();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  // Only Admin or Admin in preview can access persona switching
  const canSwitchPersona = isAdmin || isAdminPreview;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        {/* Top Institutional Banner */}
        <div className="bg-slate-900 text-slate-200 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-bold tracking-wider text-emerald-400">JanDrishti</span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline font-medium text-slate-300">
              {t('appTitle')}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-slate-400 italic">"AI ASSISTS; HUMANS GOVERN."</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono">Deterministic Public Governance</span>
          </div>
        </div>

        {/* Main Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand / Logo */}
            <div
              onClick={onNavigateHome}
              className="flex items-center gap-3 cursor-pointer select-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition">
                JD
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-slate-900 text-base leading-none">
                    {t('appTitle')}
                  </h1>
                  {isAuthenticated && currentUser ? (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      {getRoleIcon(currentUser.role)}
                      <span>{getRoleWorkspaceTitle(currentUser.role)}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {t('transparency')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                  {t('civicServicesPortal')}
                </p>
              </div>
            </div>

            {/* Right-Side Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Help & Support Button */}
              {onOpenHelpSupport && (
                <button
                  type="button"
                  onClick={onOpenHelpSupport}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition cursor-pointer shadow-2xs"
                  title="✦ Gemini Civic Assistant"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  <span>{t('portalHelp') || 'Help & Support'}</span>
                </button>
              )}

              {/* Multilingual Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-slate-800 bg-emerald-50/80 hover:bg-emerald-100/90 border border-emerald-300/80 rounded-xl transition cursor-pointer shadow-2xs"
                  title="Select Application Language / மொழி தேர்வு"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{currentLanguageOption.nativeName}</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>

                {showLangDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-1.5 space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Select Language
                    </div>
                    {supportedLanguages.map((langOpt) => (
                      <button
                        key={langOpt.code}
                        type="button"
                        onClick={() => {
                          setLanguage(langOpt.code);
                          setShowLangDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          language === langOpt.code
                            ? 'bg-emerald-600 text-white font-black shadow-xs'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{langOpt.nativeName}</span>
                        <span className={`text-[10px] font-mono ${language === langOpt.code ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {langOpt.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Persistent Admin Persona Switcher Button (Admin Only) */}
              {canSwitchPersona && onOpenPersonaSwitcher && (
                <button
                  type="button"
                  onClick={onOpenPersonaSwitcher}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 border border-amber-500 rounded-xl transition cursor-pointer shadow-sm"
                  title="Switch to another real database persona"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Switch Persona</span>
                </button>
              )}

              {/* Admin Return Button if in preview */}
              {isAdminPreview && (
                <button
                  type="button"
                  onClick={() => stopAdminPreview()}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition cursor-pointer shadow-2xs"
                  title="Return to Admin Workspace"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Admin</span>
                </button>
              )}

              {/* Reset Database Button (Admin only) */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(true)}
                  disabled={isLoading}
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition cursor-pointer"
                  title="Reset database to clean initial state"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{resetSuccess ? 'Reset Complete!' : 'Clean DB'}</span>
                </button>
              )}

              {/* AUTHENTICATED CONTROLS */}
              {isAuthenticated && currentUser ? (
                <>
                  {/* Public Transparency Quick Toggle */}
                  {onTogglePublicPortal && (
                    <button
                      type="button"
                      onClick={onTogglePublicPortal}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                        isPublicPortalView
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="hidden sm:inline">
                        {isPublicPortalView ? t('citizenHome') : t('transparency')}
                      </span>
                    </button>
                  )}

                  {/* Notification Bell */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowNotifMenu(!showNotifMenu)}
                      className="relative p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                      aria-label="Notifications"
                    >
                      <Bell className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notification Menu */}
                    {showNotifMenu && (
                      <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 max-h-96 overflow-y-auto">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                            Notifications ({notifications.length})
                          </h3>
                        </div>

                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-4">No notifications yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {notifications.map((n) => (
                              <div
                                key={n.id}
                                onClick={() => markRead(n.id)}
                                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                                  n.read
                                    ? 'bg-slate-50 border-slate-100 text-slate-600'
                                    : 'bg-sky-50/70 border-sky-200 text-slate-900 font-medium'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-slate-800">{n.title}</span>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Active User Persona Badge & Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition cursor-pointer"
                    >
                      <img
                        src={currentUser.avatar && currentUser.avatar.trim() ? currentUser.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                        alt={currentUser.name}
                        className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                      />
                      <div className="text-left hidden sm:block">
                        <div className="flex items-center gap-1.5">
                          <span className="leading-tight text-slate-900 font-bold max-w-[120px] truncate">
                            {currentUser.name}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-normal leading-tight flex items-center gap-1">
                          {getRoleIcon(currentUser.role)}
                          <span>{currentUser.role.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                    </button>

                    {/* User Dropdown Menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2">
                        <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                          <p className="text-xs font-extrabold text-slate-900">{currentUser.name}</p>
                          <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                        </div>

                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowUserMenu(false);
                              setShowScopeModal(true);
                            }}
                            className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>{t('profile')}</span>
                          </button>

                          {canSwitchPersona && onOpenPersonaSwitcher && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowUserMenu(false);
                                onOpenPersonaSwitcher();
                              }}
                              className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs text-amber-900 bg-amber-50 hover:bg-amber-100 transition cursor-pointer font-bold"
                            >
                              <Users className="w-4 h-4 text-amber-600" />
                              <span>Switch Persona</span>
                            </button>
                          )}

                          <div className="border-t border-slate-100 my-1"></div>

                          <button
                            type="button"
                            onClick={() => {
                              setShowUserMenu(false);
                              logout();
                            }}
                            className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <LogOut className="w-4 h-4 text-rose-600" />
                            <span>{t('signOut')}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* UNAUTHENTICATED CONTROLS */
                <>
                  <button
                    type="button"
                    onClick={onTogglePublicPortal}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer border ${
                      isPublicPortalView
                        ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
                        : 'text-teal-800 bg-teal-50 hover:bg-teal-100 border-teal-200'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{t('transparency')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenLogin && onOpenLogin('CITIZEN')}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    {t('login')}
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenRegister && onOpenRegister('CITIZEN')}
                    className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  >
                    {t('register')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Authority Scope Modal */}
      {showScopeModal && (
        <AuthorityScopeModal
          isOpen={showScopeModal}
          onClose={() => setShowScopeModal(false)}
        />
      )}

      {/* Clean Database Confirmation Modal (Admin Only) */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Clean Operational Database?</h3>
                <p className="text-xs text-slate-500">Administrator System Maintenance</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/80 p-3.5 rounded-2xl border border-amber-300 font-medium">
              WARNING: This permanently deletes all application data. This action cannot be undone. Only continue if you intentionally want to reset the database. Existing projects, citizen grievances, contractors, evidence, work tokens, and non-admin users will be permanently removed. The primary Administrator account will be preserved for system recovery.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowResetConfirmModal(false);
                  await handleReset();
                }}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Yes, Clean Database</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
