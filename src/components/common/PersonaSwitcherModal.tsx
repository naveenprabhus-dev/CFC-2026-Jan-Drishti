import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
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
  AlertCircle,
  Building,
  Briefcase,
  Users,
  Search,
  CheckCircle2,
  Landmark,
} from 'lucide-react';

interface PersonaSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUserManagement?: () => void;
}

export const PersonaSwitcherModal: React.FC<PersonaSwitcherModalProps> = ({
  isOpen,
  onClose,
  onOpenUserManagement,
}) => {
  const { availableStakeholders, startAdminPreview, stopAdminPreview, isAdminPreview, currentUser } = useAuth();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [isSwitching, setIsSwitching] = useState(false);

  if (!isOpen) return null;

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
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

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'CITIZEN':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'OFFICIAL':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'SANCTIONING_AUTHORITY':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'CONTRACTOR':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'POLICYMAKER':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'NGO':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case 'CITIZEN':
        return 'Citizen';
      case 'OFFICIAL':
        return 'Government Official';
      case 'SANCTIONING_AUTHORITY':
        return 'Sanctioning Authority';
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

  const filteredUsers = availableStakeholders.filter((u) => {
    const matchesRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q)) ||
      (u.organization && u.organization.toLowerCase().includes(q)) ||
      (u.jurisdiction && u.jurisdiction.toLowerCase().includes(q));
    return matchesRole && matchesQuery;
  });

  const handleSelectUser = async (targetUser: UserSession) => {
    setIsSwitching(true);
    try {
      await startAdminPreview(targetUser.id);
      onClose();
    } catch (err: any) {
      console.error('Failed to start admin preview:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleReturnToAdmin = async () => {
    setIsSwitching(true);
    try {
      await stopAdminPreview();
      onClose();
    } catch (err: any) {
      console.error('Failed to return to admin:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base">Switch Persona</h3>
                <span className="text-[10px] font-mono uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Admin Preview
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Impersonate real database accounts to inspect workspace behaviour and verify workflows
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Persona Strip */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Currently active:</span>
            <span className="font-bold text-slate-900">{currentUser?.name}</span>
            <span className="text-slate-400">({currentUser?.role})</span>
          </div>
          {isAdminPreview && (
            <button
              onClick={handleReturnToAdmin}
              disabled={isSwitching}
              className="font-bold text-xs text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1 rounded-lg transition cursor-pointer"
            >
              Return to Admin Workspace
            </button>
          )}
        </div>

        {/* Filters & Search */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by user name, ID, department, or jurisdiction..."
              className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0">Filter:</span>
            {['ALL', 'CITIZEN', 'OFFICIAL', 'POLICYMAKER', 'SANCTIONING_AUTHORITY', 'CONTRACTOR', 'NGO'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRoleFilter(r)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0 ${
                  selectedRoleFilter === r
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r === 'ALL' ? 'All Roles' : getRoleDisplayName(r as UserRole)}
              </button>
            ))}
          </div>
        </div>

        {/* Stakeholders List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 min-h-[220px]">
          {availableStakeholders.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 text-sm">No operational users available</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No users available. Create a user from User Management in the Admin Workspace.
                </p>
              </div>
              {onOpenUserManagement && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenUserManagement();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition cursor-pointer"
                >
                  Open User Management →
                </button>
              )}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No matching active users found for this query.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredUsers.map((user) => {
                const isCurrent = currentUser?.id === user.id;
                return (
                  <div
                    key={user.id}
                    onClick={() => !isCurrent && !isSwitching && handleSelectUser(user)}
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-3 text-left ${
                      isCurrent
                        ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400'
                        : 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-md cursor-pointer'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold flex items-center gap-1 ${getRoleBadge(user.role)}`}>
                          {getRoleIcon(user.role)}
                          <span>{getRoleDisplayName(user.role)}</span>
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 font-bold">{user.id}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900">{user.name}</h4>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>

                      <div className="text-[11px] text-slate-600 space-y-0.5 font-medium border-t border-slate-100 pt-2">
                        {user.department && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{user.department}</span>
                          </div>
                        )}
                        {user.organization && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{user.organization}</span>
                          </div>
                        )}
                        {user.jurisdiction && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{user.jurisdiction}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isCurrent || isSwitching}
                      className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
                        isCurrent
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-xs'
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active Persona</span>
                        </>
                      ) : (
                        <>
                          <span>Switch to this Persona</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Available real users in database: {availableStakeholders.length}</span>
          <span className="font-mono">Security: RBAC strictly enforced per target identity</span>
        </div>
      </div>
    </div>
  );
};
