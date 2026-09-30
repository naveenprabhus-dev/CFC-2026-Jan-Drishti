import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types/domain';
import { SUPPORTED_LANGUAGES, LanguageCode } from '../../i18n/translations';
import {
  UserCheck,
  Shield,
  TrendingUp,
  HardHat,
  Building2,
  Globe,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Search,
  ChevronRight,
  Activity,
  Cpu,
  Eye,
  AlertTriangle,
  Clock,
  ShieldCheck,
  HelpCircle,
  Volume2,
  Layers,
  Lock,
  ExternalLink,
  MapPin,
  FileText,
  Award,
  BarChart3,
  CheckSquare,
  Users,
  Compass,
} from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: (preferredRole?: UserRole) => void;
  onOpenRegister: (preferredRole?: UserRole) => void;
  onOpenPublicTransparency: () => void;
  onOpenHelpSupport?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onOpenRegister,
  onOpenPublicTransparency,
  onOpenHelpSupport,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onOpenPublicTransparency();
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'large':
        return 'text-[105%]';
      case 'xlarge':
        return 'text-[110%]';
      default:
        return 'text-100%';
    }
  };

  return (
    <div className={`flex flex-col min-h-screen font-sans ${getFontSizeClass()} ${highContrast ? 'contrast-125 bg-black text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* 1. TOP INSTITUTIONAL TRICOLOR STRIPE & UTILITY BAR */}
      <div className="w-full h-1.5 bg-linear-to-r from-amber-500 via-white to-emerald-600"></div>
      
      <div className="bg-slate-950 text-slate-300 text-xs border-b border-slate-800 py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left Emblem & Utility Label */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold tracking-wider uppercase text-[11px]">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{t('govtUtilityPortal') || 'JanDrishti • Public Development Intelligence & Transparency Platform'}</span>
            </div>
          </div>

          {/* Right Utility Controls: Font Size, High Contrast, Language Selector */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Font Size Adjuster */}
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 text-[11px]">
              <span className="text-slate-400 text-[10px] mr-1">{t('accessibilityFont') || 'Text Size'}:</span>
              <button
                onClick={() => setFontSize('normal')}
                className={`px-1.5 py-0.5 rounded-xs font-bold cursor-pointer ${fontSize === 'normal' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
                title="Normal Font Size"
              >
                A
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-1.5 py-0.5 rounded-xs font-bold cursor-pointer ${fontSize === 'large' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
                title="Large Font Size"
              >
                A+
              </button>
            </div>

            {/* High Contrast Toggle */}
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium border cursor-pointer transition ${
                highContrast ? 'bg-amber-400 text-black border-amber-300 font-bold' : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              {t('highContrast') || 'High Contrast'}
            </button>

            {/* Language Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Helpline Link */}
            <button
              onClick={onOpenHelpSupport || onOpenPublicTransparency}
              className="flex items-center gap-1 text-slate-300 hover:text-amber-300 transition text-[11px] font-semibold cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>{t('portalHelp') || 'Help & Support'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TOP INSTITUTIONAL IDENTITY HEADER & CREST */}
      <header className="bg-slate-900 text-white border-b border-slate-800 py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          {/* Institutional Crest & Brand */}
          <div className="flex items-center gap-4 text-center md:text-left">
            {/* CFC Logo Emblem Motif */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-950 border-2 border-emerald-500/40 shadow-xl flex flex-col items-center justify-center shrink-0 p-2 text-emerald-400">
              <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-11 h-11 sm:w-14 sm:h-14">
                {/* Outer Emblem Hexagon */}
                <path d="M50 10 L85 28 V72 L50 90 L15 72 V28 Z" stroke="currentColor" strokeWidth="3" />
                <path d="M50 15 L80 31 V69 L50 85 L20 69 V31 Z" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" fill="currentColor" fillOpacity="0.05" />
                
                {/* Modern Stylized CFC Lettering Monogram */}
                {/* Left C */}
                <path d="M38 36 C30 40 30 60 38 64" stroke="currentColor" strokeWidth="4" />
                
                {/* Center F */}
                <path d="M47 36 V64 M47 36 H55 M47 48 H53" stroke="currentColor" strokeWidth="4" />
                
                {/* Right C */}
                <path d="M62 36 C54 40 54 60 62 64" stroke="currentColor" strokeWidth="4" />
                
                {/* Bottom Citizen/Growth Motif */}
                <path d="M35 76 Q50 70 65 76" stroke="currentColor" strokeWidth="2.5" />
                <circle cx="50" cy="71" r="3.5" fill="currentColor" />
              </svg>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-extrabold uppercase tracking-widest mb-1">
                <span>JanDrishti • CIVIC DEVELOPMENT INTELLIGENCE</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight uppercase">
                {t('appTitle') || 'PUBLIC DEVELOPMENT INTELLIGENCE & TRANSPARENCY PLATFORM'}
              </h1>
              <p className="text-xs sm:text-sm font-bold text-emerald-400 tracking-wide mt-0.5">
                {t('heroSubline') || 'Citizen Need → Government Action → Verified Public Works'}
              </p>
            </div>
          </div>

          {/* Quick Platform Entry */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenLogin('CITIZEN')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition shadow-lg cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>{t('login') || 'Sign In to Workspace'}</span>
            </button>
            <button
              onClick={onOpenPublicTransparency}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 font-bold text-xs transition cursor-pointer"
            >
              <Globe className="w-4 h-4 text-sky-400" />
              <span>{t('publicTransparencyPortal') || 'Public Transparency'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO BANNER SECTION (PUBLIC INFRASTRUCTURE VISUAL, NO POLITICIANS) */}
      <section className="relative bg-slate-950 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 overflow-hidden">
        {/* Subtle Infrastructure Backdrop image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 filter saturate-50 mix-blend-luminosity"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=1600&q=80')`
          }}
        ></div>
        <div className="absolute inset-0 bg-linear-to-b from-slate-950/90 via-slate-900/85 to-slate-950/95"></div>

        <div className="relative max-w-5xl mx-auto text-center space-y-6 z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{t('heroBadge') || 'National Standard Digital Public Infrastructure for Public Development'}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight max-w-4xl mx-auto">
            {t('heroHeadline') || 'Connecting Citizen Needs with Verifiable Government Action'}
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            {t('heroDesc') || 'An AI-assisted digital public infrastructure platform connecting citizen infrastructure grievances with authorized government review, cryptographic Work Tokens, contractor evidence verification, and open public audit.'}
          </p>

          {/* 4. PRIMARY ACTION AREA ("Access CFC-2026 Services") */}
          <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-700/80 p-6 sm:p-8 max-w-4xl mx-auto shadow-2xl text-left space-y-6 mt-8">
            <div className="border-b border-slate-800 pb-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <span>{t('accessServicesTitle') || 'Access JanDrishti Services'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('accessServicesSub') || 'Select your role or action to enter the public infrastructure platform'}
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                {t('authorizedGatewayBadge') || 'Authorized Gateway'}
              </span>
            </div>

            {/* Primary Big Buttons: Citizen Login / Register */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => onOpenLogin('CITIZEN')}
                className="flex items-center justify-between p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition transform active:scale-98 cursor-pointer shadow-lg shadow-emerald-900/40 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-extrabold">{t('citizenPortalEntry') || 'Citizen Services Portal'}</div>
                    <div className="text-[11px] font-normal text-emerald-100 opacity-90">{t('login') || 'Sign In'} / File Complaint</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => onOpenRegister('CITIZEN')}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white font-bold border border-slate-700 transition transform active:scale-98 cursor-pointer shadow-md group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-extrabold">{t('registerAsCitizen') || 'Register as Citizen'}</div>
                    <div className="text-[11px] font-normal text-slate-300">{t('newAccountSetup') || 'New Account Setup'}</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition text-slate-400" />
              </button>
            </div>

            {/* Secondary Role Entry Buttons Grid */}
            <div className="pt-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                {t('stakeholderPortalsHeader') || 'Stakeholder & Authority Portals:'}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Official */}
                <button
                  onClick={() => onOpenLogin('OFFICIAL')}
                  className="p-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-emerald-500/30 text-emerald-300 font-bold flex flex-col items-start gap-1.5 transition text-left cursor-pointer hover:border-emerald-400"
                >
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>{t('officialPortalEntry') || 'Government Official'}</span>
                </button>

                {/* Contractor */}
                <button
                  onClick={() => onOpenLogin('CONTRACTOR')}
                  className="p-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-amber-500/30 text-amber-300 font-bold flex flex-col items-start gap-1.5 transition text-left cursor-pointer hover:border-amber-400"
                >
                  <HardHat className="w-4 h-4 text-amber-400" />
                  <span>{t('contractorPortalEntry') || 'Contractor'}</span>
                </button>

                {/* NGO */}
                <button
                  onClick={() => onOpenLogin('NGO')}
                  className="p-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-teal-500/30 text-teal-300 font-bold flex flex-col items-start gap-1.5 transition text-left cursor-pointer hover:border-teal-400"
                >
                  <Building2 className="w-4 h-4 text-teal-400" />
                  <span>{t('ngoPortalEntry') || 'NGO Auditor'}</span>
                </button>

                {/* Policymaker */}
                <button
                  onClick={() => onOpenLogin('POLICYMAKER')}
                  className="p-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-purple-500/30 text-purple-300 font-bold flex flex-col items-start gap-1.5 transition text-left cursor-pointer hover:border-purple-400"
                >
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span>{t('policymakerPortalEntry') || 'Policymaker'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. DIRECT PROJECT SEARCH / LOOKUP SECTION */}
      <section className="bg-slate-100 border-b border-slate-200 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold">
            <Search className="w-3.5 h-3.5 text-sky-600" />
            <span>{t('openIntelligenceLookup') || 'Open Public Intelligence Lookup'}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('findProjectTitle') || 'Find a Public Infrastructure Project'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            {t('findProjectSub') || 'Search public audit records by Project ID, Ward, District, or Public Work name'}
          </p>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto pt-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchProjectPlaceholder') || 'Enter Project ID (e.g. PRJ-2026-001) or location...'}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-slate-50 font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-sm shadow-md transition cursor-pointer shrink-0"
            >
              {t('findProjectBtn') || 'Find Project'}
            </button>
          </form>

          {/* Transparency Search Helper */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-600">{t('searchBySanctionTokenLoc') || 'Search by Sanction Number, Work Token, or Location'}</span>
          </div>
        </div>
      </section>

      {/* 6. SIMPLE PUBLIC SERVICE EXPLANATION ("WHAT CFC-2026 DOES") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 mb-3">
            {t('publicGovArchitecture') || 'Public Governance Architecture'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('whatPlatformDoesTitle') || 'How JanDrishti Digital Public Infrastructure Works'}
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            {t('whatPlatformDoesSub') || 'A 5-stage deterministic pipeline connecting citizen grievances with verified public works'}
          </p>
        </div>

        {/* 5-Step Process Flow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 relative hover:shadow-md transition">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 font-black text-sm flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide text-sky-900">
                {t('step1Title') || 'REPORT'}
              </h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {t('step1Desc') || 'Citizen submits infrastructure fault via voice note, geotagged photo, or multilingual text.'}
              </p>
            </div>
            <div className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-1 rounded-md border border-sky-100 mt-2">
              {t('step1Badge') || 'Citizen Input'}
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 relative hover:shadow-md transition">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 font-black text-sm flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide text-indigo-900">
                {t('step2Title') || 'UNDERSTAND'}
              </h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {t('step2Desc') || 'Gemini AI classifies defect type, severity grade, department routing, and government scheme.'}
              </p>
            </div>
            <div className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 mt-2">
              {t('step2Badge') || 'AI Triage'}
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 relative hover:shadow-md transition">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide text-emerald-900">
                {t('step3Title') || 'ACT'}
              </h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {t('step3Desc') || 'Authorized official reviews triage, sanctions budget, and issues an immutable Work Token.'}
              </p>
            </div>
            <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 mt-2">
              {t('step3Badge') || 'Government Sanction'}
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 relative hover:shadow-md transition">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 font-black text-sm flex items-center justify-center shrink-0">
              4
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide text-amber-900">
                {t('step4Title') || 'VERIFY'}
              </h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {t('step4Desc') || 'Contractors upload photos & lab test certs; AI Vision pre-screens site progress for inspection.'}
              </p>
            </div>
            <div className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100 mt-2">
              {t('step4Badge') || 'Evidence Audit'}
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 relative hover:shadow-md transition">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 font-black text-sm flex items-center justify-center shrink-0">
              5
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide text-teal-900">
                {t('step5Title') || 'TRANSPARENT'}
              </h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {t('step5Desc') || 'Public-safe project records, expenditure logs, and field notes are published for open audit.'}
              </p>
            </div>
            <div className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-md border border-teal-100 mt-2">
              {t('step5Badge') || 'Open Audit Thread'}
            </div>
          </div>
        </div>
      </section>

      {/* 7. CORE USE CASES ("WHY / HOW / WHO") */}
      <section className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-t border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              {t('publicImpactCapabilities') || 'Public Sector Impact & Capabilities'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">
              {t('useCaseTitle') || 'Civic Governance Architecture & Use Cases'}
            </h2>
            <p className="text-sm text-slate-300 mt-2">
              {t('useCaseSub') || 'Eliminating ghost projects, ensuring fund accountability, and empowering citizens with verified digital records'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Ghost Projects */}
            <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {t('ghostProjectsTitle') || 'Ending Ghost Projects & Fraud'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t('ghostProjectsDesc') || 'Public funds are disbursed only when cryptographic milestone photo evidence and official inspection certificates are verified in the audit trail. Prevents double-drawdown and unbuilt roads.'}
              </p>
            </div>

            {/* 2. Multilingual */}
            <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {t('multilingualInclusivityTitle') || 'Multilingual Citizen Inclusivity'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t('multilingualInclusivityDesc') || 'Supports 6 major Indian languages (English, Tamil, Hindi, Malayalam, Telugu, Kannada) with AI speech-to-text input, ensuring every resident can participate without language barriers.'}
              </p>
            </div>

            {/* 3. Field Observation */}
            <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {t('fieldObservationTitle') || 'Ground Truth Eyewitness Verification'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t('fieldObservationDesc') || 'Local residents and NGO auditors submit site observations directly to district engineers, ensuring real-world progress matches official claims and highlighting quality hazards.'}
              </p>
            </div>

            {/* 4. Policy Intelligence */}
            <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {t('policyIntelligenceTitle') || 'Macro Policy & SLA Intelligence'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t('policyIntelligenceDesc') || 'State administrative heads monitor municipal performance, contractor quality divergence, scheme budget utilization, and SLA resolution compliance in real-time.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. LIVE PLATFORM IMPACT COUNTERS & REAL-TIME AUDIT TICKER */}
      <section className="bg-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              {t('liveMetricsTitle') || 'Live Platform Governance Metrics'}
            </h3>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">1,284</div>
              <div className="text-[11px] font-bold text-slate-400 mt-1">{t('activeProjectsStat') || 'Active Public Projects'}</div>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">3,920</div>
              <div className="text-[11px] font-bold text-slate-400 mt-1">{t('workTokensStat') || 'Work Tokens Issued'}</div>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="text-2xl sm:text-3xl font-black text-sky-400">12,450</div>
              <div className="text-[11px] font-bold text-slate-400 mt-1">{t('communityObsStat') || 'Community Observations'}</div>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="text-2xl sm:text-3xl font-black text-purple-400">₹482 Cr</div>
              <div className="text-[11px] font-bold text-slate-400 mt-1">{t('fundsTrackedStat') || 'Public Funds Tracked'}</div>
            </div>

            <div className="col-span-2 md:col-span-1 bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="text-2xl sm:text-3xl font-black text-teal-400">98.4%</div>
              <div className="text-[11px] font-bold text-slate-400 mt-1">{t('slaAdherenceStat') || 'Average SLA Compliance'}</div>
            </div>
          </div>

          {/* Ticker Feed */}
          <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-3 flex items-center gap-3 text-xs overflow-hidden">
            <div className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-black text-[10px] shrink-0 uppercase">
              {t('recentUpdatesTicker') || 'Live Ticker'}
            </div>
            <div className="text-slate-300 font-mono truncate">
              <span className="text-emerald-400 font-bold">PRJ-2026-001:</span> Compaction test certified in Madurai &bull; <span className="text-amber-400 font-bold">PRJ-2026-002:</span> Community eyewitness observation logged in Ward 12 &bull; <span className="text-purple-400 font-bold">WT-2026-089:</span> Work Token sanctioned for Coimbatore Culvert Rebuilding
            </div>
          </div>
        </div>
      </section>

      {/* 9. INSTITUTIONAL MULTI-COLUMN FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Platform Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-extrabold text-sm uppercase">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>JANDRISHTI PLATFORM</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('footerNotice') || 'An open digital public infrastructure connecting citizen needs with authorized government action, milestone verification, and public expenditure transparency.'}
            </p>
            <div className="text-[11px] text-emerald-400 font-mono font-bold">
              {t('nationalStdCompliant') || 'National Infrastructure Standard Compliant'}
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-2">
            <div className="text-white font-bold text-xs uppercase tracking-wider mb-2">
              {t('quickLinksTitle') || 'Portal Quick Links'}
            </div>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => onOpenLogin('CITIZEN')} className="hover:text-amber-300 transition cursor-pointer">
                  {t('citizenHome') || 'Citizen Services'}
                </button>
              </li>
              <li>
                <button onClick={onOpenPublicTransparency} className="hover:text-amber-300 transition cursor-pointer">
                  {t('publicTransparencyPortal') || 'Open Transparency Hub'}
                </button>
              </li>
              <li>
                <button onClick={() => onOpenLogin('OFFICIAL')} className="hover:text-amber-300 transition cursor-pointer">
                  {t('officialDashboard') || 'Government Gateway'}
                </button>
              </li>
              <li>
                <button onClick={() => onOpenLogin('ADMIN')} className="hover:text-amber-300 transition cursor-pointer">
                  {t('administratorPortal') || 'Administrator Portal'}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Policies & Charters */}
          <div className="space-y-2">
            <div className="text-white font-bold text-xs uppercase tracking-wider mb-2">
              {t('policiesTitle') || 'Governance Charters'}
            </div>
            <ul className="space-y-1.5 text-xs">
              <li className="hover:text-slate-200 cursor-pointer">{t('nonPiiPrivacyCharter') || 'Citizen Non-PII Privacy Charter'}</li>
              <li className="hover:text-slate-200 cursor-pointer">{t('accessibilityPolicy') || 'Accessibility & Inclusivity Policy'}</li>
              <li className="hover:text-slate-200 cursor-pointer">{t('publicAuditStandards') || 'Public Audit Trail Standards'}</li>
              <li className="hover:text-slate-200 cursor-pointer">{t('workTokenSecurityProtocol') || 'Work Token Security Protocol'}</li>
            </ul>
          </div>

          {/* Col 4: Disclaimer & Prototype Notice */}
          <div className="space-y-2">
            <div className="text-white font-bold text-xs uppercase tracking-wider mb-2">
              {t('prototypeDisclaimerTitle') || 'Prototype Disclaimer'}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t('disclaimerNotice') || 'This platform demonstrates deterministic digital public infrastructure for municipal and state governance under JanDrishti.'}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; 2026 JanDrishti Public Development Intelligence System. All Rights Reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Powered by Gemini AI Triage</span>
            <span>&bull;</span>
            <span>Cryptographic Work Tokens</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
