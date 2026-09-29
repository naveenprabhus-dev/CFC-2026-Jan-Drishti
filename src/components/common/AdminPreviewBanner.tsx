import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Users, RotateCcw, ArrowLeft, Eye } from 'lucide-react';
import { UserRole } from '../../types/domain';

interface AdminPreviewBannerProps {
  onOpenPersonaSwitcher: () => void;
}

export const AdminPreviewBanner: React.FC<AdminPreviewBannerProps> = ({ onOpenPersonaSwitcher }) => {
  const { currentUser, isAdminPreview, stopAdminPreview, isLoading } = useAuth();

  if (!isAdminPreview || !currentUser) {
    return null;
  }

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'CITIZEN':
        return 'Citizen';
      case 'OFFICIAL':
        return 'Government Official';
      case 'POLICYMAKER':
        return 'Policymaker';
      case 'CONTRACTOR':
        return 'Contractor';
      case 'NGO':
        return 'NGO';
      case 'PUBLIC_VIEWER':
        return 'Public Viewer';
      default:
        return role;
    }
  };

  const roleName = getRoleDisplayName(currentUser.role);
  const locationScope = currentUser.department || currentUser.jurisdiction || currentUser.organization;

  return (
    <div className="bg-amber-500 text-slate-950 font-sans border-b border-amber-600 shadow-md sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Indicator Info */}
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-400 text-[10px] font-black tracking-wider uppercase border border-amber-400/40">
              <Eye className="w-3.5 h-3.5 animate-pulse" />
              <span>ADMIN PREVIEW</span>
            </span>
            <div className="text-xs font-bold leading-tight">
              <span>Viewing as: </span>
              <span className="font-extrabold underline decoration-slate-900/40 underline-offset-2">
                {currentUser.name}
              </span>
              <span className="text-slate-800 font-semibold"> — {roleName}</span>
              {locationScope && (
                <span className="hidden md:inline text-slate-800/80 font-normal text-[11px]">
                  {' '}({locationScope})
                </span>
              )}
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPersonaSwitcher}
              className="px-3 py-1 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-300 hover:text-amber-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Switch to another real database persona"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Switch Persona</span>
            </button>

            <button
              type="button"
              onClick={() => stopAdminPreview()}
              disabled={isLoading}
              className="px-3 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-black border border-amber-600 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Exit preview and restore administrator workspace"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
