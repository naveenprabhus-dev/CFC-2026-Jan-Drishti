import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  ShieldCheck,
  Building,
  MapPin,
  Mail,
  Phone,
  User,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';

interface AuthorityScopeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthorityScopeModal: React.FC<AuthorityScopeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, isDemoAccount } = useAuth();

  if (!isOpen || !currentUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Identity & Authority Scope</h3>
              <p className="text-xs text-slate-500">Authoritative Platform Permissions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Identity Card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <img
              src={currentUser.avatar && currentUser.avatar.trim() ? currentUser.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser.name}
              className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-base text-slate-900 truncate">{currentUser.name}</h4>
                {isDemoAccount && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                    Demo Mode
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-emerald-700">{currentUser.role.replace('_', ' ')}</p>
              {currentUser.designation && (
                <p className="text-xs text-slate-500 mt-0.5">{currentUser.designation}</p>
              )}
            </div>
          </div>

          {/* Institutional Context */}
          <div className="space-y-2 text-xs text-slate-700 bg-white p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
              Jurisdiction & Organization
            </span>
            {currentUser.department && (
              <div className="flex items-start gap-2">
                <Building className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="font-medium text-slate-800">{currentUser.department}</span>
              </div>
            )}
            {currentUser.organization && (
              <div className="flex items-start gap-2">
                <Building className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="font-medium text-slate-800">{currentUser.organization}</span>
              </div>
            )}
            {currentUser.jurisdiction && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{currentUser.jurisdiction}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{currentUser.email}</span>
            </div>
            {currentUser.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{currentUser.phone}</span>
              </div>
            )}
          </div>

          {/* Authority Scope */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
              Governing Authority Scope
            </span>
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-950 leading-relaxed font-medium">
              {currentUser.authorityScope || 'Standard authorized civic access.'}
            </div>
          </div>

          {/* Permission Flags */}
          {currentUser.permissions && currentUser.permissions.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                Server-Authoritative Capabilities ({currentUser.permissions.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentUser.permissions.map((perm) => (
                  <div
                    key={perm}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{perm}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
