import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, UserSession } from '../../types/domain';
import {
  X,
  UserCheck,
  Shield,
  HardHat,
  TrendingUp,
  Building2,
  Globe,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Lock,
  Building,
  MapPin,
  ShieldAlert,
} from 'lucide-react';

interface DemoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole?: (role: UserRole) => void;
}

export const DemoLoginModal: React.FC<DemoLoginModalProps> = ({
  isOpen,
  onClose,
  onSelectRole,
}) => {
  const { allUsers, loginDemo, isLoading } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  if (!isOpen) return null;

  const handleDemoSignIn = async (user: UserSession) => {
    setSelectedUserId(user.id);
    setIsAuthenticating(true);
    try {
      await loginDemo(user.id);
      if (onSelectRole) onSelectRole(user.role);
      onClose();
    } catch (err) {
      console.error('Demo authentication error:', err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const getRoleTheme = (role: UserRole) => {
    switch (role) {
      case 'CITIZEN':
        return {
          icon: <UserCheck className="w-5 h-5 text-sky-600" />,
          bg: 'bg-sky-50',
          border: 'border-sky-200',
          badge: 'bg-sky-100 text-sky-800 border-sky-300',
          btn: 'bg-sky-600 hover:bg-sky-700 text-white',
          name: 'Citizen Portal',
        };
      case 'OFFICIAL':
        return {
          icon: <Shield className="w-5 h-5 text-emerald-600" />,
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          name: 'Government Official',
        };
      case 'CONTRACTOR':
        return {
          icon: <HardHat className="w-5 h-5 text-amber-600" />,
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          btn: 'bg-amber-600 hover:bg-amber-700 text-white',
          name: 'Contractor',
        };
      case 'POLICYMAKER':
        return {
          icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          badge: 'bg-purple-100 text-purple-800 border-purple-300',
          btn: 'bg-purple-600 hover:bg-purple-700 text-white',
          name: 'Policymaker',
        };
      case 'NGO':
        return {
          icon: <Building2 className="w-5 h-5 text-teal-600" />,
          bg: 'bg-teal-50',
          border: 'border-teal-200',
          badge: 'bg-teal-100 text-teal-800 border-teal-300',
          btn: 'bg-teal-600 hover:bg-teal-700 text-white',
          name: 'NGO Audit',
        };
      case 'PUBLIC_VIEWER':
      default:
        return {
          icon: <Globe className="w-5 h-5 text-indigo-600" />,
          bg: 'bg-indigo-50',
          border: 'border-indigo-200',
          badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
          btn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
          name: 'Public Viewer',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Demo Login — Hackathon & Evaluator Sandbox
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono uppercase font-bold border border-emerald-500/40">
                Authoritative Demo Mode
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Select a preconfigured identity below. Each account operates under the exact same backend authorization model as live users.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security & Authorization Notice Banner */}
        <div className="bg-slate-50 px-6 sm:px-8 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              <strong>Zero Security Bypass:</strong> Permissions, work token signing, and state transitions are strictly verified server-side.
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
            6 Predefined Personas Available
          </span>
        </div>

        {/* Personas Grid */}
        <div className="p-6 sm:p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allUsers.map((user) => {
            const theme = getRoleTheme(user.role);
            const isSelected = selectedUserId === user.id && isAuthenticating;

            return (
              <div
                key={user.id}
                className={`rounded-2xl border ${theme.border} bg-white p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition relative group`}
              >
                {/* Persona Card Top */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={user.avatar && user.avatar.trim() ? user.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                        alt={user.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm text-slate-900 truncate">{user.name}</h4>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${theme.badge}`}>
                      {theme.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      ID: {user.id}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Demo Account
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    {user.department && (
                      <div className="flex items-start gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-slate-700 font-medium leading-tight">
                          {user.department}
                        </span>
                      </div>
                    )}
                    {user.organization && (
                      <div className="flex items-start gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-slate-700 font-medium leading-tight">
                          {user.organization}
                        </span>
                      </div>
                    )}
                    {user.jurisdiction && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-slate-600 leading-tight">
                          {user.jurisdiction}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Authority Scope */}
                  <div className="mb-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                      Authority & Permission Scope:
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">
                      {user.authorityScope || 'Standard authorized civic access.'}
                    </p>
                  </div>
                </div>

                {/* One Click Demo Sign In Button */}
                <button
                  type="button"
                  disabled={isAuthenticating}
                  onClick={() => handleDemoSignIn(user)}
                  className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer ${theme.btn}`}
                >
                  {isSelected ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Launch as {user.name.split(' ')[0]}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
            <span>
              All demo actions (triages, token issuances, AI evidence verification) persist in local state and write to the cryptographic audit trail.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-semibold cursor-pointer transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
