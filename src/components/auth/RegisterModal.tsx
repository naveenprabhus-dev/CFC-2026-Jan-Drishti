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
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Fingerprint,
} from 'lucide-react';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
  onSwitchToLogin: (role?: UserRole) => void;
  onSwitchToDemoLogin: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'CITIZEN',
  onSwitchToLogin,
  onSwitchToDemoLogin,
}) => {
  const { register } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [selectedRole, setSelectedRole] = useState<UserRole>(
    defaultRole === 'OFFICIAL' || defaultRole === 'POLICYMAKER' ? 'CITIZEN' : defaultRole
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [organization, setOrganization] = useState('');
  const [designation, setDesignation] = useState('');

  // Primary Language Preference (defaults to the currently selected language)
  const [primaryLanguage, setPrimaryLanguage] = useState<LanguageCode>(language);

  // Citizen Identity & Home Jurisdiction
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [homeState, setHomeState] = useState('Tamil Nadu');
  const [homeDistrict, setHomeDistrict] = useState('Central Chennai');
  const [homeULB, setHomeULB] = useState('Greater Chennai Corporation');
  const [homeWard, setHomeWard] = useState('Ward 18');

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
      await register({
        name: name.trim(),
        email: email.trim(),
        role: selectedRole,
        phone: phone.trim() || undefined,
        jurisdiction: jurisdiction.trim() || `${homeWard}, ${homeDistrict}`,
        organization: organization.trim() || undefined,
        designation: designation.trim() || undefined,
        password,
        primaryLanguage,
        aadhaarNumber: aadhaarNumber.replace(/\s+/g, '') || undefined,
        homeState,
        homeDistrict,
        homeULB,
        homeWard,
      });
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
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
              CFC
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">{t('registerNewAccount')}</h3>
              <p className="text-xs text-slate-500">{t('registerOnboardingSub')}</p>
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
            <span>{t('preferInstantDemo')}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onSwitchToDemoLogin();
            }}
            className="font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
          >
            {t('demoSandboxBtn') || 'Demo Sandbox →'}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Role selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t('selectRegAccountType')}
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedRole('CITIZEN')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedRole === 'CITIZEN'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>{t('roleCitizen')}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('CONTRACTOR')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedRole === 'CONTRACTOR'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HardHat className="w-3.5 h-3.5 text-amber-600" />
                <span>{t('roleContractor')}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('NGO')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedRole === 'NGO'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <span>{t('ngoPortalEntry') || 'NGO Audit'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Note: Government Official & Policymaker accounts require pre-authorized administrative provisioning or Demo Mode.
            </p>
          </div>

          {/* Primary Application Language Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('primaryLangDefaultUI')}</span>
            </label>
            <select
              value={primaryLanguage}
              onChange={handleLanguageChange}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              {t('languageSwitchNote')}
            </p>
          </div>

          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {selectedRole === 'CONTRACTOR' ? t('contactOfficer') : t('fullName')}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priyadharshini K."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('emailAddress')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. priya@civic.in"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Citizen Identity (Aadhaar & Home Jurisdiction) */}
          {selectedRole === 'CITIZEN' && (
            <div className="space-y-3 p-3.5 bg-sky-50/70 rounded-2xl border border-sky-200">
              <div className="flex items-center justify-between border-b border-sky-200/80 pb-2">
                <span className="text-[11px] font-extrabold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-sky-600" />
                  <span>{t('verifiedIdentityHomeJurisdiction')}</span>
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300">
                  {t('prototypeIdentityVerification')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('aadhaarLabel')}
                </label>
                <input
                  type="text"
                  maxLength={14}
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  placeholder="1234 5678 9012"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white focus:border-sky-500 focus:outline-none transition"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {t('aadhaarSecurityProtection')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('homeDistrictLabel')}</label>
                  <input
                    type="text"
                    value={homeDistrict}
                    onChange={(e) => setHomeDistrict(e.target.value)}
                    placeholder="Central Chennai"
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:border-sky-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('homeWardArea')}</label>
                  <input
                    type="text"
                    value={homeWard}
                    onChange={(e) => setHomeWard(e.target.value)}
                    placeholder="Ward 18"
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:border-sky-500 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Phone & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('phoneNumber')}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98400 12345"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('createPassword')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Role specific fields */}
          {selectedRole === 'CONTRACTOR' && (
            <div className="space-y-3 p-3 bg-amber-50/60 rounded-2xl border border-amber-200">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                {t('contractorOrgDetails')}
              </span>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('enlistedEnterpriseFirmName')}
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. Horizon Infrastructure & Road Works Pvt Ltd"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:border-amber-500 focus:outline-none transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('pwdEnlistmentClass')}</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Class-1 (Highways)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:border-amber-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('operatingCircle')}</label>
                  <input
                    type="text"
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    placeholder="Central & South Chennai Circle"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:border-amber-500 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedRole === 'NGO' && (
            <div className="space-y-3 p-3 bg-teal-50/60 rounded-2xl border border-teal-200">
              <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wider block">
                {t('ngoCitizenWatchDetails')}
              </span>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('organizationSocietyName')}
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. People's Civic Audit Alliance"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:border-teal-500 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('focusAreaJurisdiction')}</label>
                <input
                  type="text"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  placeholder="Ward Safety, School Zones & Storm Drains"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:border-teal-500 focus:outline-none transition"
                />
              </div>
            </div>
          )}

          {selectedRole === 'CITIZEN' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('wardResidentialJurisdiction')}
              </label>
              <input
                type="text"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                placeholder="e.g. Ward 18, Anna Nagar, Chennai"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
              />
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition transform active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{t('completeRegistrationOpenWorkspace')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info & Login link */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
          <div>
            <span>{t('alreadyHaveAccount')} </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchToLogin(selectedRole);
              }}
              className="font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              {t('login')}
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
            {t('switchRole')}
          </button>
        </div>
      </div>
    </div>
  );
};
