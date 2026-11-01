import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ScreenType } from '../../types';
import {
  Sparkles,
  Check,
  ShieldCheck,
  Crown,
  Heart,
  Volume2,
  Users,
  MessageCircle,
  Clock,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface PricingScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

export const PricingScreen: React.FC<PricingScreenProps> = ({ onNavigate }) => {
  const { userProfile, upgradeToPremium, currentUser } = useAuth();
  const { t, language } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [upgrading, setUpgrading] = useState(false);
  const [upgradedSuccess, setUpgradedSuccess] = useState(false);

  const isPremium = userProfile?.subscriptionTier === 'premium';

  const handleUpgrade = async () => {
    if (!currentUser) {
      onNavigate('auth');
      return;
    }
    setUpgrading(true);
    await upgradeToPremium();
    setUpgrading(false);
    setUpgradedSuccess(true);
    setTimeout(() => setUpgradedSuccess(false), 3500);
  };

  return (
    <div className="min-h-screen bg-[#0c0714] py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-stone-100">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/60 text-rose-300 border border-rose-800/40 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('pricing.badge')}</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-white font-normal">
          {t('pricing.heading')}
        </h1>
        <p className="text-sm text-stone-400 leading-relaxed">
          {t('pricing.desc')}
        </p>

        {/* Billing Switch */}
        <div className="pt-2 flex items-center justify-center gap-3">
          <span
            className={`text-xs font-medium cursor-pointer ${
              billingCycle === 'monthly' ? 'text-rose-300 font-bold' : 'text-stone-400'
            }`}
            onClick={() => setBillingCycle('monthly')}
          >
            {t('pricing.monthly')}
          </span>

          <button
            type="button"
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className="w-12 h-6 rounded-full bg-purple-900/80 border border-purple-700/50 p-0.5 transition-colors relative"
            aria-label="Toggle billing cycle"
          >
            <div
              className={`w-5 h-5 rounded-full bg-rose-400 transition-transform ${
                billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>

          <span
            className={`text-xs font-medium cursor-pointer flex items-center gap-1.5 ${
              billingCycle === 'annual' ? 'text-rose-300 font-bold' : 'text-stone-400'
            }`}
            onClick={() => setBillingCycle('annual')}
          >
            {t('pricing.annual')}
            <span className="px-2 py-0.5 rounded-full bg-rose-900/60 text-rose-300 border border-rose-700/40 text-[10px] font-bold">
              {t('pricing.discount')}
            </span>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
        {/* Plan 1: Gratuit */}
        <div className="p-8 rounded-3xl bg-[#140a20] border border-purple-900/40 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                {t('pricing.freePlan')}
              </span>
              {!isPremium && (
                <span className="px-2.5 py-1 rounded-full bg-purple-950/60 text-purple-200 border border-purple-800/40 text-xs font-semibold">
                  {language === 'en' ? 'Your current plan' : 'Votre formule actuelle'}
                </span>
              )}
            </div>

            <h3 className="font-serif text-2xl text-white font-normal">
              {t('pricing.freeHeading')}
            </h3>
            <p className="text-xs text-stone-400 mt-1 mb-6">
              {t('pricing.freeDesc')}
            </p>

            <div className="mb-6">
              <span className="font-serif text-4xl font-bold text-white">0 €</span>
              <span className="text-xs text-stone-500"> {t('pricing.forever')}</span>
            </div>

            <ul className="space-y-3 text-xs text-stone-300 mb-8">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t('pricing.freeFeature1')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('pricing.freeFeature2')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('pricing.freeFeature3')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('pricing.freeFeature4')}</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => onNavigate('chat')}
            className="w-full py-3 rounded-full bg-[#24133b] hover:bg-[#301a4e] text-purple-200 border border-purple-700/50 text-xs font-semibold transition-colors"
          >
            {t('pricing.accessFree')}
          </button>
        </div>

        {/* Plan 2: Premium */}
        <div className="p-8 rounded-3xl bg-gradient-to-b from-purple-950 via-purple-900 to-rose-950 text-white shadow-xl border border-purple-700/50 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 text-purple-950 text-[11px] font-bold shadow-md">
              <Crown className="w-3.5 h-3.5 fill-current" />
              {language === 'en' ? 'Couples & Solos' : 'Recommandé pour couples & solos'}
            </span>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-300 block mb-4">
              {t('pricing.premiumPlan')}
            </span>

            <h3 className="font-serif text-2xl text-stone-100 font-normal">
              {t('pricing.premiumHeading')}
            </h3>
            <p className="text-xs text-purple-200/80 mt-1 mb-6">
              {t('pricing.premiumDesc')}
            </p>

            <div className="mb-6">
              <span className="font-serif text-4xl font-bold text-white">
                {billingCycle === 'annual' ? '6,90 €' : '9,90 €'}
              </span>
              <span className="text-xs text-purple-200"> {t('pricing.perMonth')}</span>
              {billingCycle === 'annual' && (
                <p className="text-[11px] text-rose-300 mt-1">{t('pricing.billedAnnual')}</p>
              )}
            </div>

            <ul className="space-y-3 text-xs text-purple-100 mb-8">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="font-semibold">{t('pricing.premiumFeature1')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{t('pricing.premiumFeature2')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{t('pricing.premiumFeature3')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{t('pricing.premiumFeature4')}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{t('pricing.premiumFeature5')}</span>
              </li>
            </ul>
          </div>

          <div>
            {isPremium ? (
              <div className="p-3 rounded-2xl bg-amber-400/20 border border-amber-300/40 text-center text-xs text-amber-200 font-semibold flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-amber-300" />
                <span>{t('pricing.alreadyPremium')}</span>
              </div>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-rose-500 via-pink-600 to-amber-400 text-white font-bold text-xs shadow-lg hover:shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {upgrading ? t('common.loading') : t('pricing.activatePremium')}
                </span>
              </button>
            )}

            {upgradedSuccess && (
              <p className="text-[11px] text-amber-300 text-center mt-2 animate-fade-in">
                {language === 'en'
                  ? 'Congratulations! Your account is now Premium in Firestore.'
                  : 'Félicitations ! Votre compte est désormais Premium dans Firestore.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Trust & FAQ Section */}
      <div className="max-w-3xl mx-auto space-y-4">
        <h3 className="font-serif text-2xl text-gray-900 text-center mb-6">
          {t('pricing.faqTitle')}
        </h3>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-1">
          <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-rose-500" />
            {language === 'en' ? 'Is billing discreet on my bank statement?' : 'L’intitulé sur mon relevé bancaire est-il discret ?'}
          </h4>
          <p className="text-xs text-stone-500 pl-6 leading-relaxed">
            {language === 'en'
              ? 'Yes, discretion is absolute. The charge appears as a neutral software subscription with no mention of therapy or relationship counseling.'
              : 'Oui, la discrétion est totale. Le libellé mentionne simplement un abonnement technologique neutre sans mention explicite de thérapie ou de couple.'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-1">
          <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-rose-500" />
            {language === 'en' ? 'Can I cancel at any time?' : 'Puis-je annuler à tout moment ?'}
          </h4>
          <p className="text-xs text-stone-500 pl-6 leading-relaxed">
            {language === 'en'
              ? 'Absolutely. You can cancel with a single click from your settings with no hidden fees or commitment.'
              : 'Absolument. Vous pouvez résilier en un clic depuis votre espace paramètres, sans préavis ni frais cachés.'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-1">
          <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-rose-500" />
            {language === 'en' ? 'Does my partner have access to my conversations?' : 'Mon/ma partenaire a-t-il/elle accès à mes échanges ?'}
          </h4>
          <p className="text-xs text-stone-500 pl-6 leading-relaxed">
            {language === 'en'
              ? 'No. Each account and session is strictly private and isolated. Only you can access your chats unless you voluntarily choose to share an advice excerpt.'
              : 'Non. Chaque compte et chaque appareil est strictement isolé. Seul vous pouvez consulter vos conversations, sauf si vous choisissez vous-même de partager un conseil précis.'}
          </p>
        </div>
      </div>
    </div>
  );
};
