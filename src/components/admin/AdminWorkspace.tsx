import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiClient } from '../../services/api';
import { UserSession, UserRole } from '../../types/domain';
import {
  Users,
  UserPlus,
  ShieldAlert,
  Power,
  RotateCcw,
  Sparkles,
  Eye,
  CheckCircle,
  AlertCircle,
  FileText,
  UserCheck,
  Building,
  Briefcase,
  Key,
} from 'lucide-react';

export const AdminWorkspace: React.FC = () => {
  const { currentUser, switchUser, logout, allUsers, refreshNotifications } = useAuth();
  const { t } = useLanguage();
  const [usersList, setUsersList] = useState<UserSession[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'create_user' | 'preview_workspace'>('users');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State for User Creation
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('CITIZEN');
  const [department, setDepartment] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [organization, setOrganization] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const fetchUsers = async () => {
    try {
      const users = await apiClient.getUsers();
      setUsersList(users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [allUsers]);

  // Generate ID based on role & state
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!name.trim() || !email.trim()) {
      setMessage({ type: 'error', text: 'Name and email are required.' });
      return;
    }

    try {
      // Auto-compute unified id based on convention: role-state-sequence
      const stateCode = 'tn'; // Default to Tamil Nadu
      const sequence = String(usersList.filter(u => u.role === role).length + 101);
      const computedId = `${role.toLowerCase().slice(0, 3)}-${stateCode}-${sequence}`;

      const payload = {
        id: computedId,
        name: name.trim(),
        email: email.trim(),
        role,
        department: department.trim() || undefined,
        jurisdiction: jurisdiction.trim() || undefined,
        organization: organization.trim() || undefined,
        designation: designation.trim() || undefined,
        phone: phone.trim() || undefined,
        password: password || undefined,
        isDemo: false,
      };

      await apiClient.register(payload);
      setMessage({ type: 'success', text: `Successfully provisioned ${role} account: ${name} (${computedId})` });
      
      // Reset form
      setName('');
      setEmail('');
      setRole('CITIZEN');
      setDepartment('');
      setJurisdiction('');
      setOrganization('');
      setDesignation('');
      setPhone('');
      setPassword('');

      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create user.' });
    }
  };

  const handleToggleDeactivate = async (userId: string, currentStatus?: string) => {
    try {
      // For prototype, we simply toggle a property or add an deactivated indicator
      await apiClient.updateUserStatus(userId, currentStatus === 'inactive' ? 'active' : 'inactive');
      setMessage({ type: 'success', text: `User status updated.` });
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update user status.' });
    }
  };

  const handleStartImpersonation = (targetUser: UserSession) => {
    // Audit log impersonation
    apiClient.logAdminAction({
      action: 'ADMIN_PERSONA_PREVIEW_STARTED',
      targetUserId: targetUser.id,
      targetRole: targetUser.role,
    });

    // Save admin identity in localStorage to allow return
    localStorage.setItem('cfc_admin_impersonator_id', currentUser?.id || 'admin-001');
    localStorage.setItem('cfc_admin_impersonator_name', currentUser?.name || 'Administrator');

    // Switch session to the real created user
    switchUser(targetUser.id);
  };

  const getRoleBadgeColor = (r: UserRole) => {
    switch (r) {
      case 'CITIZEN': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'OFFICIAL': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CONTRACTOR': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'POLICYMAKER': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'NGO': return 'bg-teal-100 text-teal-800 border-teal-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Exclude Admin from list of previewable accounts
  const previewableUsers = usersList.filter(u => u.role !== 'ADMIN');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Executive Header */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-5 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                System Administration
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-slate-400 text-xs font-mono">ID: {currentUser?.id}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              DPI Account Provisioning & Control
            </h2>
            <p className="text-slate-400 text-xs max-w-xl">
              Platform administration dashboard. Register authenticated stakeholders, manage authority scopes, track platform audit trails, and preview workspace environments.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={() => setActiveTab('preview_workspace')}
              className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition transform active:scale-98 cursor-pointer flex items-center gap-1.5 shadow-lg"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Workspace ({previewableUsers.length} Users)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'users'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>View Stakeholders ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('create_user')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'create_user'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New Account</span>
        </button>

        <button
          onClick={() => setActiveTab('preview_workspace')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'preview_workspace'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Workspace Switcher</span>
        </button>
      </div>

      {/* Notifications Bar */}
      {message && (
        <div className={`p-4 rounded-2xl border text-xs flex items-start gap-2.5 ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
            : 'bg-rose-50 border-rose-200 text-rose-950'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tab 1: Stakeholders Table */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-extrabold text-sm text-slate-900">Enlisted Stakeholders Registry</h3>
            <span className="text-[10px] text-slate-400 font-mono">Total: {usersList.length} Active Accounts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                  <th className="py-3 px-6">ID & Credentials</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Officer Name</th>
                  <th className="py-3 px-6">Department/Organization</th>
                  <th className="py-3 px-6">Jurisdiction</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-700">
                      <div>{u.id}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{u.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${getRoleBadgeColor(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {u.name}
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {u.department || u.organization || '-'}
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-[11px]">
                      {u.jurisdiction || '-'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                        u.identityReference === 'inactive' ? 'bg-slate-300' : 'bg-emerald-500'
                      }`} title={u.identityReference === 'inactive' ? 'Deactivated' : 'Active'}></span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                      {u.role !== 'ADMIN' && (
                        <>
                          <button
                            onClick={() => handleStartImpersonation(u)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] cursor-pointer transition"
                          >
                            Preview Workspace
                          </button>
                          <button
                            onClick={() => handleToggleDeactivate(u.id, u.identityReference)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-600 cursor-pointer transition inline-flex items-center justify-center"
                            title={u.identityReference === 'inactive' ? 'Activate Account' : 'Deactivate Account'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Provision Form */}
      {activeTab === 'create_user' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs max-w-2xl mx-auto">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-extrabold text-sm text-slate-900">Provision Authorized Stakeholder Account</h3>
            <p className="text-xs text-slate-500 mt-0.5">Unified cryptographic credentials and jurisdictional scopes</p>
          </div>

          <form onSubmit={handleCreateUser} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name / Org Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. S. Kathiravan"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address / Login ID *</label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. s.kathiravan@pwd.gov.in"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Stakeholder Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="CITIZEN">Citizen / Resident</option>
                  <option value="OFFICIAL">PWD Government Official</option>
                  <option value="POLICYMAKER">Planning Policymaker</option>
                  <option value="CONTRACTOR">Enlisted Contractor</option>
                  <option value="NGO">NGO Citizen Audit Lead</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Secure Password / Auth Key</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank for automatic pre-authorization"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Role Specific Additional Fields */}
            {(role === 'OFFICIAL' || role === 'POLICYMAKER') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-1 duration-150">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Government Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Public Works Department"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Executive Engineer"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none transition"
                  />
                </div>
              </div>
            )}

            {(role === 'CONTRACTOR' || role === 'NGO') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-1 duration-150">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Organization Society Name</label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Apex Roads Ltd."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Focus Area Scope</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Urban Roads Quality Audit"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none transition"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Authorized Jurisdiction</label>
                <input
                  type="text"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  placeholder="e.g. Central Chennai Division"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Verified Mobile Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 94440 98765"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Confirm & Provision User Account</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Workspace Switcher */}
      {activeTab === 'preview_workspace' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs max-w-4xl mx-auto">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-extrabold text-sm text-slate-900">Sandbox Preview & Workspace Switcher</h3>
            <p className="text-xs text-slate-500 mt-0.5">ADMIN-ONLY: Securely impersonate any real stakeholder and preview their live workspace</p>
          </div>

          <div className="p-6">
            {previewableUsers.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-3">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-medium">No real stakeholder accounts available to preview.</p>
                <button
                  onClick={() => setActiveTab('create_user')}
                  className="text-xs font-bold text-emerald-600 underline"
                >
                  Create one now in Provisioning →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {previewableUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition flex flex-col justify-between space-y-4 bg-slate-50/40"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${getRoleBadgeColor(u.role)}`}>
                          {u.role}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 font-bold">{u.id}</span>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{u.name}</h4>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      </div>
                      <div className="text-[11px] text-slate-600 space-y-0.5 font-medium border-t border-slate-100 pt-2">
                        {u.department && (
                          <div className="flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{u.department}</span>
                          </div>
                        )}
                        {u.organization && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{u.organization}</span>
                          </div>
                        )}
                        {u.jurisdiction && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{u.jurisdiction}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartImpersonation(u)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview Stakeholder Workspace</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
