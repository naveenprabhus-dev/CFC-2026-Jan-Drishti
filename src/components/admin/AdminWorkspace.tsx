import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiClient } from '../../services/api';
import { UserSession, UserRole } from '../../types/domain';
import { SUPPORTED_LANGUAGES, LanguageCode } from '../../i18n/translations';
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
  Globe,
  ArrowRight,
  Search,
  Shield,
  TrendingUp,
} from 'lucide-react';

export const AdminWorkspace: React.FC = () => {
  const { currentUser, allUsers, startAdminPreview, refreshUsers, availableStakeholders } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'users' | 'provision_account' | 'persona_switcher'>('users');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State for Government Official / Policymaker Provisioning ONLY
  const [customId, setCustomId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'OFFICIAL' | 'POLICYMAKER'>('OFFICIAL');
  const [department, setDepartment] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [primaryLanguage, setPrimaryLanguage] = useState<string>('en');
  const [authorityScope, setAuthorityScope] = useState('');
  const [financialThreshold, setFinancialThreshold] = useState('5000000');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [registryFilter, setRegistryFilter] = useState<'ALL' | 'GOVERNMENT' | 'SELF_REGISTERED'>('ALL');

  // Auto-suggest unified ID when role changes
  useEffect(() => {
    if (!customId || customId.startsWith('gov-') || customId.startsWith('pm-')) {
      const prefix = role === 'OFFICIAL' ? 'gov' : 'pm';
      const count = allUsers.filter((u) => u.role === role).length + 1;
      setCustomId(`${prefix}-tamilnadu-${String(count).padStart(3, '0')}`);
    }
  }, [role, allUsers]);

  const handleProvisionAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!name.trim() || !email.trim()) {
      setMessage({ type: 'error', text: 'Officer Name and Official Email address are required.' });
      return;
    }

    try {
      const payload = {
        id: customId.trim() || undefined,
        name: name.trim(),
        email: email.trim(),
        role,
        department: department.trim() || (role === 'OFFICIAL' ? 'Public Works Department (PWD)' : 'State Infrastructure Planning Commission'),
        jurisdiction: jurisdiction.trim() || 'Regional Jurisdiction Circle',
        designation: designation.trim() || (role === 'OFFICIAL' ? 'Executive Engineer & Triage Officer' : 'Principal Infrastructure Advisor'),
        phone: phone.trim() || undefined,
        password: password.trim() || undefined,
        primaryLanguage,
        authorityScope: authorityScope.trim() || undefined,
        financialThreshold: role === 'POLICYMAKER' ? Number(financialThreshold) || 5000000 : undefined,
      };

      const newOfficial = await apiClient.provisionOfficialAccount(payload);
      setMessage({
        type: 'success',
        text: `Successfully provisioned ${role === 'OFFICIAL' ? 'Government Official' : 'Policymaker'} account: ${newOfficial.name} (${newOfficial.id})`,
      });

      // Reset form
      setName('');
      setEmail('');
      setDepartment('');
      setJurisdiction('');
      setDesignation('');
      setPhone('');
      setPassword('');
      setAuthorityScope('');
      setPrimaryLanguage('en');
      setFinancialThreshold('5000000');

      await refreshUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to provision account.' });
    }
  };

  const handleToggleDeactivate = async (userId: string, currentStatus?: string) => {
    try {
      const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
      await apiClient.updateUserStatus(userId, newStatus);
      setMessage({ type: 'success', text: `Updated user status to ${newStatus}.` });
      await refreshUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update user status.' });
    }
  };

  const handleStartPreview = async (targetUser: UserSession) => {
    try {
      await startAdminPreview(targetUser.id);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to launch preview session.' });
    }
  };

  const getRoleBadgeColor = (r: UserRole) => {
    switch (r) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CITIZEN':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'OFFICIAL':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CONTRACTOR':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'POLICYMAKER':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'NGO':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Grouped users
  const governmentAccounts = allUsers.filter((u) => u.role === 'OFFICIAL' || u.role === 'POLICYMAKER');
  const selfRegisteredAccounts = allUsers.filter((u) => u.role === 'CITIZEN' || u.role === 'CONTRACTOR' || u.role === 'NGO');

  const filteredUsers = allUsers.filter((u) => {
    if (registryFilter === 'GOVERNMENT' && u.role !== 'OFFICIAL' && u.role !== 'POLICYMAKER' && u.role !== 'ADMIN') return false;
    if (registryFilter === 'SELF_REGISTERED' && u.role !== 'CITIZEN' && u.role !== 'CONTRACTOR' && u.role !== 'NGO') return false;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q)) ||
      (u.organization && u.organization.toLowerCase().includes(q)) ||
      (u.jurisdiction && u.jurisdiction.toLowerCase().includes(q));
    return matchesQuery;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Executive Header */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-5 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Central Platform Administration
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-slate-400 text-xs font-mono">Admin ID: {currentUser?.id}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Institutional Account Governance & Persona Preview
            </h2>
            <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
              Provision authorized Government Official and Policymaker credentials. View self-registered Citizens, Contractors, and NGOs. Use Switch Persona to inspect real operational workspaces securely.
            </p>
          </div>

          <div className="shrink-0 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('persona_switcher')}
              className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition transform active:scale-98 cursor-pointer flex items-center gap-2 shadow-lg"
            >
              <Users className="w-4 h-4" />
              <span>Switch Persona ({availableStakeholders.length} Real Users)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
            activeTab === 'users'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Stakeholders Registry ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('provision_account')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
            activeTab === 'provision_account'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision Official / Policymaker</span>
        </button>

        <button
          onClick={() => setActiveTab('persona_switcher')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
            activeTab === 'persona_switcher'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Switch Persona ({availableStakeholders.length})</span>
        </button>
      </div>

      {/* Status Notifications */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-start gap-2.5 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* TAB 1: User Registry Table */}
      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs space-y-4">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Database Stakeholders Registry</h3>
              <p className="text-xs text-slate-500">
                Institutional government accounts & self-registered public stakeholders
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stakeholders..."
                  className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setRegistryFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    registryFilter === 'ALL' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({allUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRegistryFilter('GOVERNMENT')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    registryFilter === 'GOVERNMENT' ? 'bg-white shadow-xs text-emerald-800' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Government ({governmentAccounts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRegistryFilter('SELF_REGISTERED')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    registryFilter === 'SELF_REGISTERED' ? 'bg-white shadow-xs text-sky-800' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Self-Registered ({selfRegisteredAccounts.length})
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                  <th className="py-3 px-6">ID & Identifier</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Creation Method</th>
                  <th className="py-3 px-6">Full Name / Entity</th>
                  <th className="py-3 px-6">Department / Organization</th>
                  <th className="py-3 px-6">Jurisdiction</th>
                  <th className="py-3 px-6 text-center">Lang</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No stakeholder records found in this category.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-6 font-mono font-bold text-slate-700">
                        <div>{u.id}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{u.email}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold ${getRoleBadgeColor(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            u.creationMethod === 'ADMIN_PROVISIONED' || u.role === 'ADMIN'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-sky-50 text-sky-700 border-sky-200'
                          }`}
                        >
                          {u.creationMethod === 'ADMIN_PROVISIONED'
                            ? 'Admin Provisioned'
                            : u.role === 'ADMIN'
                            ? 'System Bootstrap'
                            : 'Self Registered'}
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
                      <td className="py-4 px-6 text-center font-mono uppercase text-[10px] text-slate-500 font-bold">
                        {u.primaryLanguage || 'en'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'inactive'
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {u.status === 'inactive' ? 'Inactive' : 'Active'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                        {u.role !== 'ADMIN' && (
                          <>
                            <button
                              onClick={() => handleStartPreview(u)}
                              disabled={u.status === 'inactive'}
                              className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition inline-flex items-center gap-1 ${
                                u.status === 'inactive'
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer shadow-xs'
                              }`}
                              title="Preview workspace as this real persona"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Switch Persona</span>
                            </button>
                            <button
                              onClick={() => handleToggleDeactivate(u.id, u.status)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-600 cursor-pointer transition inline-flex items-center justify-center"
                              title={u.status === 'inactive' ? 'Activate Account' : 'Deactivate Account'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Provision Official / Policymaker Account */}
      {activeTab === 'provision_account' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto shadow-xs">
          <div className="border-b border-slate-100 pb-5 mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider mb-1.5">
              <Shield className="w-3 h-3 text-emerald-600" />
              <span>Government Institutional Provisioning Only</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Provision Institutional Government Account
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Admin is authorized to provision Government Officials and Policymakers. (Citizens, Contractors, and NGOs self-register through public onboarding).
            </p>
          </div>

          <form onSubmit={handleProvisionAccount} className="space-y-5">
            {/* Role selection tabs - OFFICIAL or POLICYMAKER ONLY */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Institutional Account Type *
              </label>
              <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setRole('OFFICIAL')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition cursor-pointer ${
                    role === 'OFFICIAL'
                      ? 'bg-white text-emerald-900 shadow-xs border border-emerald-300 ring-2 ring-emerald-400/20'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Government Official (PWD / Municipal Engineer)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('POLICYMAKER')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition cursor-pointer ${
                    role === 'POLICYMAKER'
                      ? 'bg-white text-indigo-900 shadow-xs border border-indigo-300 ring-2 ring-indigo-400/20'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>Policymaker (Planning & Sanctions Commission)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Institutional Login ID *
                </label>
                <input
                  type="text"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                  placeholder={role === 'OFFICIAL' ? 'e.g. gov-tamilnadu-001' : 'e.g. pm-tamilnadu-001'}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none transition font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Officer Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Government Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'OFFICIAL' ? 'officer@pwd.gov.in' : 'advisor@planning.gov.in'}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Password Provisioning
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Initial password for officer login"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department / Commission
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder={role === 'OFFICIAL' ? 'Public Works Department (PWD - Highways)' : 'State Infrastructure Planning Commission'}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Designation / Title
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder={role === 'OFFICIAL' ? 'Chief Engineer & Triage Officer' : 'Principal Infrastructure Advisor'}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Authorized Jurisdiction / Region
                </label>
                <input
                  type="text"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  placeholder="e.g. State Infrastructure Circle / Administrative District"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Saved Primary Language
                </label>
                <select
                  value={primaryLanguage}
                  onChange={(e) => setPrimaryLanguage(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none transition font-semibold"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.nativeName} ({l.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {role === 'POLICYMAKER' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Delegated Financial Sanction Threshold (INR) *
                  </label>
                  <input
                    type="number"
                    value={financialThreshold}
                    onChange={(e) => setFinancialThreshold(e.target.value)}
                    placeholder="e.g. 5000000 for ₹50.0 Lakhs"
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none transition font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Limit of financial sanction authority. Recommended: ₹50.0 Lakhs (5,000,000) or ₹1.0 Crore (10,000,000).
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Authorized Governance Scope & Authority Notes
              </label>
              <textarea
                value={authorityScope}
                onChange={(e) => setAuthorityScope(e.target.value)}
                rows={2}
                placeholder={role === 'OFFICIAL' ? 'Triage incoming reports, issue cryptographic Work Tokens, sanction public tenders, approve milestone inspections.' : 'Macro regional monitoring, delay radar oversight, funding absorption optimization.'}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Provision {role === 'OFFICIAL' ? 'Official' : 'Policymaker'} Account</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: Switch Persona */}
      {activeTab === 'persona_switcher' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs max-w-4xl mx-auto">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Switch Persona (Admin Preview)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Preview real database accounts (Admin-provisioned & Self-registered) without password re-entry.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg">
              {availableStakeholders.length} Active Accounts
            </span>
          </div>

          <div className="p-6">
            {availableStakeholders.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                <p className="font-extrabold text-slate-900 text-sm">
                  No users available. Create a user from User Management or register public stakeholders.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('provision_account')}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
                >
                  Provision Government Account Now →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableStakeholders.map((u) => (
                  <div
                    key={u.id}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition flex flex-col justify-between space-y-4 bg-slate-50/40"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold ${getRoleBadgeColor(u.role)}`}>
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
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{u.department}</span>
                          </div>
                        )}
                        {u.organization && (
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{u.organization}</span>
                          </div>
                        )}
                        {u.jurisdiction && (
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{u.jurisdiction}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                          <span>Origin: {u.creationMethod === 'ADMIN_PROVISIONED' ? 'Admin Provisioned' : 'Self Registered'}</span>
                          <span>Lang: {u.primaryLanguage?.toUpperCase() || 'EN'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartPreview(u)}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Switch to this Persona</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-auto" />
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
