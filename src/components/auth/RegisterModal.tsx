import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types/domain';
import { LanguageCode, SUPPORTED_LANGUAGES } from '../../i18n/translations';
import {
  X,
  UserCheck,
  HardHat,
  Building2,
  Mail,
  Lock,
  Phone,
  MapPin,
  Briefcase,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Globe,
  Fingerprint,
  Info,
} from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
  onSwitchToLogin: (role?: UserRole) => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'CITIZEN',
  onSwitchToLogin,
}) => {
  const { register, login } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // Only self-registerable roles allowed: CITIZEN, CONTRACTOR, NGO
  const initialRole: 'CITIZEN' | 'CONTRACTOR' | 'NGO' =
    defaultRole === 'CONTRACTOR' || defaultRole === 'NGO' ? defaultRole : 'CITIZEN';

  const [selectedRole, setSelectedRole] = useState<'CITIZEN' | 'CONTRACTOR' | 'NGO'>(initialRole);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [organization, setOrganization] = useState('');
  const [designation, setDesignation] = useState('');

  // Primary Language Preference (defaults to currently selected app language)
  const [primaryLanguage, setPrimaryLanguage] = useState<LanguageCode>(language);

  // Citizen Identity & Home Jurisdiction
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [homeState, setHomeState] = useState('');
  const [homeDistrict, setHomeDistrict] = useState('');
  const [homeULB, setHomeULB] = useState('');
  const [homeWard, setHomeWard] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLang = e.target.value as LanguageCode;
    setPrimaryLanguage(selectedLang);
    setLanguage(selectedLang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg('Name and email are required.');
      return;
    }

    if (selectedRole === 'CITIZEN') {
      const cleanAadhaar = aadhaarNumber.replace(/\s+/g, '');
      if (cleanAadhaar && (!/^\d{12}$/.test(cleanAadhaar))) {
        setErrorMsg('Please enter a valid 12-digit Aadhaar number for identity verification.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Create real database account
      const newUser = await register({
        name: name.trim(),
        email: email.trim(),
        role: selectedRole,
        phone: phone.trim() || undefined,
        jurisdiction: jurisdiction.trim() || `${homeWard}, ${homeDistrict}`,
        organization: organization.trim() || undefined,
        designation: designation.trim() || (selectedRole === 'CITIZEN' ? 'Registered Citizen' : undefined),
        password: password.trim() || undefined,
        primaryLanguage,
        aadhaarNumber: aadhaarNumber.replace(/\s+/g, '') || undefined,
        homeState,
        homeDistrict,
        homeULB,
        homeWard,
      });

      // 2. Automatically authenticate into new account
      await login(newUser.email, password.trim() || undefined, selectedRole);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              JD
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Public Stakeholder Registration</h3>
              <p className="text-xs text-slate-500">Citizen, Contractor, and NGO Portal Access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Institutional Government Notice */}
        <div className="bg-slate-900 text-slate-300 px-6 py-2.5 border-b border-slate-800 flex items-center gap-2 text-[11px]">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Government Official or Policymaker? Institutional accounts must be provisioned by your Administrator.</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Role selector - Citizen, Contractor, NGO ONLY */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Registration Account Type *
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedRole('CITIZEN')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedRole === 'CITIZEN'
                    ? 'bg-white text-sky-900 shadow-xs border border-sky-300 ring-2 ring-sky-400/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>Citizen</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('CONTRACTOR')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedRole === 'CONTRACTOR'
                    ? 'bg-white text-amber-900 shadow-xs border border-amber-300 ring-2 ring-amber-400/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HardHat className="w-3.5 h-3.5 text-amber-600" />
                <span>Contractor</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('NGO')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedRole === 'NGO'
                    ? 'bg-white text-teal-900 shadow-xs border border-teal-300 ring-2 ring-teal-400/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Civic NGO</span>
              </button>
            </div>
          </div>

          {/* Core User Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {selectedRole === 'CONTRACTOR'
                  ? 'Authorized Representative / Lead Engineer'
                  : selectedRole === 'NGO'
                  ? 'Audit Lead / Officer In-Charge'
                  : 'Full Legal Name *'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  selectedRole === 'CONTRACTOR'
                    ? 'e.g. Rajesh Kannan'
                    : selectedRole === 'NGO'
                    ? 'e.g. Meera Sundaram'
                    : 'e.g. Aravind Swaminathan'
                }
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Contact</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98401 23456"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Language</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={primaryLanguage}
                    onChange={handleLanguageChange}
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition font-semibold"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.nativeName} ({l.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Role Specific: Contractor */}
            {selectedRole === 'CONTRACTOR' && (
              <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900">
                  <HardHat className="w-4 h-4 text-amber-600" />
                  <span>Contractor Entity Credentials</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Organization / Firm Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. Apex Roads Infrastructure Ltd."
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      GSTIN / Enlistment Reference
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. 33AAACA0000A1Z5"
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Operating State / Regions
                  </label>
                  <input
                    type="text"
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    placeholder="e.g. State Capital or Municipal Circles"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Role Specific: NGO */}
            {selectedRole === 'NGO' && (
              <div className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-teal-900">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>Civic Audit Society Credentials</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Foundation / Society Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. Civic Watch Foundation"
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Societies Reg No / 80G Ref
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. SOC/CHN/2021/4891"
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Authorized Focus Area / Geography
                  </label>
                  <input
                    type="text"
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    placeholder="e.g. State / District Urban Governance Monitoring"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Role Specific: Citizen */}
            {selectedRole === 'CITIZEN' && (
              <div className="p-3.5 bg-sky-50/60 border border-sky-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-extrabold text-sky-900">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-sky-600" />
                    <span>Resident Jurisdiction Details</span>
                  </div>
                  <span className="text-[10px] text-sky-700 font-mono">DPI Jurisdiction Anchor</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">State</label>
                    <input
                      type="text"
                      value={homeState}
                      onChange={(e) => setHomeState(e.target.value)}
                      placeholder="e.g. Karnataka / Andhra Pradesh"
                      className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">District</label>
                    <input
                      type="text"
                      value={homeDistrict}
                      onChange={(e) => setHomeDistrict(e.target.value)}
                      placeholder="e.g. Kakinada / Coimbatore"
                      className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Local Body / ULB</label>
                    <input
                      type="text"
                      value={homeULB}
                      onChange={(e) => setHomeULB(e.target.value)}
                      placeholder="e.g. GCC Corp"
                      className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Ward / Division</label>
                    <input
                      type="text"
                      value={homeWard}
                      onChange={(e) => setHomeWard(e.target.value)}
                      placeholder="e.g. Ward 18"
                      className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    Aadhaar Reference (Optional - 12 digits)
                  </label>
                  <div className="relative">
                    <Fingerprint className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value)}
                      placeholder="XXXX-XXXX-1234"
                      maxLength={14}
                      className="w-full pl-8 pr-2 p-2 text-xs rounded-xl border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition transform active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            <span>{isSubmitting ? 'Registering...' : `Create ${selectedRole} Account`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Already have an account?</span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onSwitchToLogin(selectedRole);
            }}
            className="font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
          >
            Sign In →
          </button>
        </div>
      </div>
    </div>
  );
};
