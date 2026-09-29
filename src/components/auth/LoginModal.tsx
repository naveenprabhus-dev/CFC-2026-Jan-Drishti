import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/domain';
import {
  X,
  Lock,
  Mail,
  UserCheck,
  Shield,
  HardHat,
  TrendingUp,
  Building2,
  Globe,
  ArrowRight,
  AlertCircle,
  ShieldAlert,
  Landmark,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
  onSwitchToRegister: (role?: UserRole) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'CITIZEN',
  onSwitchToRegister,
}) => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your registered Email or User ID.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await login(email.trim(), password.trim() || undefined, selectedRole);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <ShieldAlert className="w-4 h-4 text-purple-600" />;
      case 'CITIZEN':
        return <UserCheck className="w-4 h-4 text-sky-600" />;
      case 'OFFICIAL':
        return <Shield className="w-4 h-4 text-emerald-600" />;
      case 'SANCTIONING_AUTHORITY':
        return <Landmark className="w-4 h-4 text-indigo-600" />;
      case 'CONTRACTOR':
        return <HardHat className="w-4 h-4 text-amber-600" />;
      case 'POLICYMAKER':
        return <TrendingUp className="w-4 h-4 text-indigo-600" />;
      case 'NGO':
        return <Building2 className="w-4 h-4 text-teal-600" />;
      case 'PUBLIC_VIEWER':
      default:
        return <Globe className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              JD
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Sign In to Platform</h3>
              <p className="text-xs text-slate-500">Authoritative DPI Access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Role Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Workspace Role
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              {(['CITIZEN', 'OFFICIAL', 'SANCTIONING_AUTHORITY', 'CONTRACTOR', 'POLICYMAKER', 'NGO', 'ADMIN'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setSelectedRole(r);
                    setErrorMsg(null);
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg text-center transition cursor-pointer ${
                    selectedRole === r
                      ? 'bg-white shadow-xs text-slate-900 font-extrabold ring-1 ring-slate-300'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <div className="mb-1">{getRoleIcon(r)}</div>
                  <span className="text-[10px] leading-tight font-bold capitalize">
                    {r.toLowerCase().replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Email or User ID Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Registered Email or User ID
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={selectedRole === 'ADMIN' ? 'admin@gov.in or admin-001' : 'e.g. cit-tamilnadu-001 or email'}
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Password
              </label>
              {selectedRole === 'ADMIN' && (
                <span className="text-[10px] text-slate-400 font-mono">Default: admin</span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (optional if unconfigured)"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition transform active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Need a new account?</span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onSwitchToRegister(selectedRole);
            }}
            className="font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
          >
            Register Now →
          </button>
        </div>
      </div>
    </div>
  );
};
