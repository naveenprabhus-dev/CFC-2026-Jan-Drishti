import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  Lock,
  FileText,
} from 'lucide-react';

interface CitizenProfileViewProps {
  onBack: () => void;
  requestsCount: number;
}

export const CitizenProfileView: React.FC<CitizenProfileViewProps> = ({
  onBack,
  requestsCount,
}) => {
  const { currentUser, isDemoAccount } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backToCitizenHome')}</span>
        </button>
        <span className="text-xs text-slate-400 font-mono">{t('citizenProfileTitle')}</span>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 border-b border-slate-100 pb-6">
          <img
            src={
              currentUser?.avatar && currentUser.avatar.trim()
                ? currentUser.avatar
                : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            }
            alt={currentUser?.name}
            className="w-20 h-20 rounded-3xl object-cover border-2 border-emerald-500 shadow-md shrink-0"
          />
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                {currentUser?.name || 'Aravind Swaminathan'}
              </h3>
              {isDemoAccount && (
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                  {t('profile')}
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-700 font-bold">
              {currentUser?.designation || 'Registered Resident & Civic Contributor'}
            </p>
            <p className="text-xs text-slate-500 font-mono">
              ID: <strong>{currentUser?.id || 'cit-chennai-001'}</strong>
            </p>
          </div>
        </div>

        {/* Contact & Jurisdiction Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {t('residentialWard')}
            </span>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{currentUser?.jurisdiction || 'Ward 14, Central District, Chennai'}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {t('registeredEmail')}
            </span>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Mail className="w-4 h-4 text-sky-600 shrink-0" />
              <span>{currentUser?.email || 'aravind.s@citizen.gov.in'}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {t('verifiedPhone')}
            </span>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{currentUser?.phone || '+91 98401 23456'}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {t('totalGrievancesCount')}
            </span>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <FileText className="w-4 h-4 text-purple-600 shrink-0" />
              <span>{requestsCount} {t('totalReports')}</span>
            </div>
          </div>
        </div>

        {/* Citizen Authority Scope */}
        <div className="space-y-2">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block">
            {t('authorizedCapabilities')}
          </span>
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-2 font-medium">
            <p>
              {currentUser?.authorityScope ||
                'Report local infrastructure issues, monitor personal grievance status, track cryptographic work tokens, submit real-time community observations.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-emerald-200/80">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-900">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{t('fileCivicReport')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-900">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{t('workTokenTracker')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-900">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{t('communityFieldObs')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-900">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{t('transparency')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Charter */}
        <div className="p-5 rounded-2xl bg-slate-900 text-slate-300 text-xs space-y-2">
          <div className="flex items-center gap-2 text-white font-bold">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>{t('privacyGuaranteeTitle')}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            {t('privacyGuaranteeDesc')}
          </p>
        </div>
      </div>
    </div>
  );
};
