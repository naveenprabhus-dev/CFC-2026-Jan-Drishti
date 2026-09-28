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
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
  onSwitchToRegister: (role?: UserRole) => void;
  onSwitchToDemoLogin: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'CITIZEN',
  onSwitchToRegister,
  onSwitchToDemoLogin,
}) => {
  const { login, allUsers } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Auto-fill suggested demo email when role changes if user wants convenience
  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg(null);
    const demoForRole = allUsers.find((u) => u.role === role);
    if (demoForRole) {
      setEmail(demoForRole.email);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await login(email.trim(), password, selectedRole);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials or use Demo Login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'CITIZEN':
        return <UserCheck className="w-4 h-4 text-sky-600" />;
      case 'OFFICIAL':
        return <Shield className="w-4 h-4 text-emerald-600" />;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
              CFC
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Sign In to Platform</h3>
              <p className="text-xs text-slate-500">Role-Aware Authoritative Authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo banner helper */}
        <div className="bg-emerald-50 px-6 py-2.5 border-b border-emerald-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-900 font-medium">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Evaluating or Testing?</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onSwitchToDemoLogin();
            }}
            className="font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
          >
            Use Demo Login →
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
              Select Your Role Workspace
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              {(['CITIZEN', 'OFFICIAL', 'CONTRACTOR', 'POLICYMAKER', 'NGO', 'PUBLIC_VIEWER'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleChange(r)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    selectedRole === r
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {getRoleIcon(r)}
                  <span className="truncate">
                    {r === 'PUBLIC_VIEWER' ? 'Public' : r.charAt(0) + r.slice(1).toLowerCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Email field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. aravind.s@citizen.gov.in"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Password / Auth Key</label>
              <span className="text-[10px] text-slate-400 font-mono">Demo accounts pre-authorized</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition transform active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In to {selectedRole.replace('_', ' ')} Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info & Register link */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <div>
            <span>Don't have an account? </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchToRegister(selectedRole);
              }}
              className="font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              Register here
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onSwitchToDemoLogin();
            }}
            className="text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
          >
            Demo Accounts Sandbox
          </button>
        </div>
      </div>
    </div>
  );
};
