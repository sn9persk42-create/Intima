import React from 'react';
import { IntimaLogo } from './IntimaLogo';
import { ScreenType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Heart, ShieldCheck, Lock, Sparkles } from 'lucide-react';

interface FooterProps {
  onNavigate: (screen: ScreenType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  return (
    <footer className="w-full bg-stone-900 text-stone-200 py-12 px-4 sm:px-6 lg:px-8 border-t border-purple-950/40 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand Col */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-stone-800/60 p-2 rounded-2xl inline-block">
            <IntimaLogo size="sm" />
          </div>
          <p className="text-sm text-stone-400 max-w-md leading-relaxed">
            {t('footer.description')}
          </p>
          <div className="flex items-center gap-4 text-xs text-rose-300">
            <span className="flex items-center gap-1.5 bg-purple-950/80 px-2.5 py-1 rounded-full border border-purple-800/50">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              {t('footer.privacy')}
            </span>
            <span className="flex items-center gap-1.5 bg-purple-950/80 px-2.5 py-1 rounded-full border border-purple-800/50">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              {t('footer.isolatedData')}
            </span>
          </div>
        </div>

        {/* Navigation Col */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
            {t('footer.spaces')}
          </h4>
          <ul className="space-y-2 text-sm text-stone-300">
            <li>
              <button
                onClick={() => onNavigate('home')}
                className="hover:text-rose-400 transition-colors"
              >
                {t('nav.home')}
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('chat')}
                className="hover:text-rose-400 transition-colors"
              >
                {t('nav.chat')}
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('history')}
                className="hover:text-rose-400 transition-colors"
              >
                {t('nav.history')}
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('pricing')}
                className="hover:text-rose-400 transition-colors"
              >
                {t('nav.pricing')}
              </button>
            </li>
          </ul>
        </div>

        {/* Values Col */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
            {t('footer.ethics')}
          </h4>
          <ul className="space-y-2 text-xs text-stone-400 leading-relaxed">
            <li className="flex items-start gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
              <span>{t('footer.ethics1')}</span>
            </li>
            <li className="flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
              <span>{t('footer.ethics2')}</span>
            </li>
            <li>
              <span>{t('footer.ethics3')}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
        <p>© {new Date().getFullYear()} INTIMA. {t('footer.rights')}</p>
        <div className="flex gap-4">
          <button onClick={() => onNavigate('settings')} className="hover:text-stone-300">
            {t('nav.settings')}
          </button>
          <button onClick={() => onNavigate('profile')} className="hover:text-stone-300">
            {t('nav.profile')}
          </button>
        </div>
      </div>
    </footer>
  );
};
