import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { RelationshipStatus, ScreenType, Language } from '../../types';
import {
  User,
  Shield,
  Heart,
  Lock,
  Download,
  Trash2,
  Check,
  Save,
  Crown,
  KeyRound,
  EyeOff,
  Clock,
  Sparkles,
  Globe,
} from 'lucide-react';

interface ProfileScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigate }) => {
  const { userProfile, updateUserProfile, currentUser, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus>(
    userProfile?.relationshipStatus || 'single'
  );
  const [partnerName, setPartnerName] = useState(userProfile?.partnerName || '');
  const [anonymousMode, setAnonymousMode] = useState(userProfile?.anonymousMode || false);
  const [dataRetentionDays, setDataRetentionDays] = useState(userProfile?.dataRetentionDays || 30);
  const [pinProtected, setPinProtected] = useState(userProfile?.pinProtected || false);
  const [pinCode, setPinCode] = useState(userProfile?.pinCode || '');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    userProfile?.language || language || 'fr'
  );
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await setLanguage(selectedLanguage);
    await updateUserProfile({
      displayName,
      relationshipStatus,
      partnerName: partnerName.trim() || undefined,
      anonymousMode,
      dataRetentionDays,
      pinProtected,
      pinCode: pinProtected ? pinCode : undefined,
      language: selectedLanguage,
    });
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportData = () => {
    const dataToExport = {
      user: {
        id: currentUser?.uid,
        email: currentUser?.email,
        profile: userProfile,
        exportedAt: new Date().toISOString(),
      },
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intima-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const isPremium = userProfile?.subscriptionTier === 'premium';

  return (
    <div className="min-h-screen bg-[#0c0714] py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-stone-100">
      {/* Title */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-semibold uppercase tracking-wider mb-1">
          <User className="w-4 h-4 text-rose-500" />
          <span>{language === 'en' ? 'Personal Space & Security' : 'Espace Personnel & Sécurité'}</span>
        </div>
        <h1 className="font-serif text-3xl text-white font-normal">
          {t('profile.title')}
        </h1>
        <p className="text-xs sm:text-sm text-stone-400 mt-1">
          {t('profile.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Card 1: Identity & Relationship context */}
        <div className="p-6 rounded-3xl bg-[#140a20] border border-purple-900/40 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-800 to-rose-600 text-white flex items-center justify-center text-lg font-serif font-bold shadow-xs">
                {(displayName || 'U')[0].toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-white text-base">{displayName || t('common.guest')}</h3>
                <p className="text-xs text-stone-400">{currentUser?.email || (language === 'en' ? 'Guest Account' : 'Compte Invité')}</p>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  isPremium
                    ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                    : 'bg-purple-950/60 text-purple-200 border border-purple-800/40'
                }`}
              >
                {isPremium ? (
                  <>
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    {language === 'en' ? 'Premium Member' : 'Membre Premium'}
                  </>
                ) : (
                  t('common.free')
                )}
              </span>
              {!isPremium && (
                <button
                  type="button"
                  onClick={() => onNavigate('pricing')}
                  className="block text-[11px] text-rose-400 hover:underline mt-1 font-medium"
                >
                  {language === 'en' ? 'Discover Premium →' : 'Découvrir le Premium →'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                {t('profile.name')}
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('profile.namePlaceholder')}
                className="w-full px-4 py-2.5 rounded-xl bg-[#1b0d2b] border border-purple-800/50 text-xs text-white focus:outline-hidden focus:border-rose-400 placeholder-stone-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                {t('profile.status')}
              </label>
              <select
                value={relationshipStatus}
                onChange={(e) => setRelationshipStatus(e.target.value as RelationshipStatus)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#1b0d2b] border border-purple-800/50 text-xs text-white focus:outline-hidden focus:border-rose-400"
              >
                <option value="single">{t('profile.single')}</option>
                <option value="couple">{t('profile.couple')}</option>
                <option value="dating">{t('profile.datingStatus')}</option>
                <option value="complicated">{t('profile.complicated')}</option>
                <option value="divorced">{t('profile.divorced')}</option>
                <option value="prefer_not_to_say">{t('profile.preferNot')}</option>
              </select>
            </div>

            {relationshipStatus === 'couple' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  {t('profile.partnerName')}
                </label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder={language === 'en' ? 'E.g.: Alex, Sarah, My love...' : 'Ex : Alexandre, Sarah, Mon amour...'}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#1b0d2b] border border-purple-800/50 text-xs text-white focus:outline-hidden focus:border-rose-400 placeholder-stone-500"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  {t('profile.partnerNotice')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Language Preference */}
        <div className="p-6 rounded-3xl bg-[#140a20] border border-purple-900/40 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-purple-900/40">
            <Globe className="w-5 h-5 text-rose-400" />
            <h3 className="font-semibold text-white text-base">
              {t('profile.languagePref')}
            </h3>
          </div>
          <p className="text-xs text-stone-400">
            {t('profile.languageNotice')}
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedLanguage('fr')}
              className={`px-3.5 py-2 rounded-2xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                selectedLanguage === 'fr'
                  ? 'border-rose-500 bg-rose-950/40 text-rose-200 shadow-xs'
                  : 'border-purple-900/40 bg-[#1b0d2b] text-stone-300 hover:bg-purple-950/30'
              }`}
            >
              <span className="text-base">🇫🇷</span>
              <span>Français 🇫🇷</span>
              {selectedLanguage === 'fr' && <Check className="w-3.5 h-3.5 text-rose-400 ml-1" />}
            </button>

            <button
              type="button"
              onClick={() => setSelectedLanguage('en')}
              className={`px-3.5 py-2 rounded-2xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                selectedLanguage === 'en'
                  ? 'border-rose-500 bg-rose-950/40 text-rose-200 shadow-xs'
                  : 'border-purple-900/40 bg-[#1b0d2b] text-stone-300 hover:bg-purple-950/30'
              }`}
            >
              <span className="text-base">🇬🇧</span>
              <span>English 🇬🇧</span>
              {selectedLanguage === 'en' && <Check className="w-3.5 h-3.5 text-rose-400 ml-1" />}
            </button>

            <button
              type="button"
              onClick={() => setSelectedLanguage('de')}
              className={`px-3.5 py-2 rounded-2xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                selectedLanguage === 'de'
                  ? 'border-rose-500 bg-rose-950/40 text-rose-200 shadow-xs'
                  : 'border-purple-900/40 bg-[#1b0d2b] text-stone-300 hover:bg-purple-950/30'
              }`}
            >
              <span className="text-base">🇩🇪</span>
              <span>Deutsch 🇩🇪</span>
              {selectedLanguage === 'de' && <Check className="w-3.5 h-3.5 text-rose-400 ml-1" />}
            </button>

            <button
              type="button"
              onClick={() => setSelectedLanguage('es')}
              className={`px-3.5 py-2 rounded-2xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                selectedLanguage === 'es'
                  ? 'border-rose-500 bg-rose-950/40 text-rose-200 shadow-xs'
                  : 'border-purple-900/40 bg-[#1b0d2b] text-stone-300 hover:bg-purple-950/30'
              }`}
            >
              <span className="text-base">🇪🇸</span>
              <span>Español 🇪🇸</span>
              {selectedLanguage === 'es' && <Check className="w-3.5 h-3.5 text-rose-400 ml-1" />}
            </button>

            <button
              type="button"
              onClick={() => setSelectedLanguage('pt')}
              className={`px-3.5 py-2 rounded-2xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                selectedLanguage === 'pt'
                  ? 'border-rose-500 bg-rose-950/40 text-rose-200 shadow-xs'
                  : 'border-purple-900/40 bg-[#1b0d2b] text-stone-300 hover:bg-purple-950/30'
              }`}
            >
              <span className="text-base">🇵🇹</span>
              <span>Português 🇵🇹</span>
              {selectedLanguage === 'pt' && <Check className="w-3.5 h-3.5 text-rose-400 ml-1" />}
            </button>

            <button
              type="button"
              onClick={() => setSelectedLanguage('la')}
              className={`px-3.5 py-2 rounded-2xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                selectedLanguage === 'la'
                  ? 'border-amber-500 bg-amber-950/40 text-amber-200 shadow-xs'
                  : 'border-purple-900/40 bg-[#1b0d2b] text-stone-300 hover:bg-purple-950/30'
              }`}
            >
              <span className="text-base">🏛️</span>
              <span>Latina 🏛️</span>
              {selectedLanguage === 'la' && <Check className="w-3.5 h-3.5 text-amber-400 ml-1" />}
            </button>
          </div>
        </div>

        {/* Card 3: Privacy & Security */}
        <div className="p-6 rounded-3xl bg-[#140a20] border border-purple-900/40 shadow-xl space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-purple-900/40">
            <Shield className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white text-base">
              {t('profile.privacySecurity')}
            </h3>
          </div>

          <div className="space-y-4">
            {/* Toggle Anonymous Mode */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1b0d2b] border border-purple-900/30">
              <div className="flex items-start gap-3">
                <EyeOff className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-white">
                    {t('profile.anonymousMode')}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    {t('profile.anonymousDesc')}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={anonymousMode}
                onChange={(e) => setAnonymousMode(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded-sm border-purple-700 bg-purple-950"
              />
            </div>

            {/* Data retention */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1b0d2b] border border-purple-900/30">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-white">
                    {t('profile.dataRetention')}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    {t('profile.dataRetentionDesc')}
                  </p>
                </div>
              </div>
              <select
                value={dataRetentionDays}
                onChange={(e) => setDataRetentionDays(parseInt(e.target.value, 10))}
                className="text-xs px-3 py-1.5 rounded-xl bg-[#140a20] border border-purple-800/50 text-stone-200"
              >
                <option value={7}>{language === 'en' ? '7 days' : '7 jours'}</option>
                <option value={30}>{language === 'en' ? '30 days (recommended)' : '30 jours (recommandé)'}</option>
                <option value={90}>{language === 'en' ? '90 days' : '90 jours'}</option>
                <option value={365}>{language === 'en' ? 'Unlimited' : 'Illimité'}</option>
              </select>
            </div>

            {/* PIN Code Protection */}
            <div className="p-3.5 rounded-2xl bg-[#1b0d2b] border border-purple-900/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <KeyRound className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {t('profile.pinProtection')}
                    </p>
                    <p className="text-[11px] text-stone-400">
                      {t('profile.pinDesc')}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={pinProtected}
                  onChange={(e) => setPinProtected(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded-sm border-purple-700 bg-purple-950"
                />
              </div>

              {pinProtected && (
                <div className="pl-8 pt-2">
                  <label className="block text-[11px] font-medium text-stone-300 mb-1">
                    {t('profile.pinLabel')}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-32 tracking-widest text-center px-3 py-1.5 rounded-lg bg-[#140a20] border border-purple-700 text-sm focus:outline-hidden focus:border-rose-400 text-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Data Export */}
        <div className="p-6 rounded-3xl bg-[#140a20] border border-purple-900/40 shadow-xl space-y-4">
          <h3 className="font-semibold text-white text-base">
            {t('profile.rights')}
          </h3>
          <p className="text-xs text-stone-400 leading-relaxed">
            {t('profile.rightsDesc')}
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={handleExportData}
              className="px-4 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 border border-purple-800/40 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{t('profile.exportData')}</span>
            </button>

            <button
              type="button"
              onClick={() => logout()}
              className="px-4 py-2 rounded-xl bg-purple-950/60 hover:bg-rose-950/60 text-stone-300 hover:text-rose-300 border border-purple-800/40 text-xs font-medium transition-colors ml-auto"
            >
              {t('nav.logout')}
            </button>
          </div>
        </div>

        {/* Submit Save Button */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold animate-fade-in">
              <Check className="w-4 h-4" />
              {t('profile.profileSaved')}
            </span>
          ) : (
            <span className="text-xs text-stone-500">
              {language === 'en' ? 'Synchronized with your private Firestore record.' : 'Toutes les données sont synchronisées avec votre profil sécurisé.'}
            </span>
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-purple-700 text-white font-medium text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? t('common.loading') : t('profile.saveProfile')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
