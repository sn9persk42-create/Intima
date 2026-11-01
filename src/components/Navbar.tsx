import React from 'react';
import { ScreenType } from '../types';
import { IntimaLogo } from './IntimaLogo';
import { useAuth } from '../context/AuthContext';
import { useLanguage, LanguageSelector } from '../context/LanguageContext';
import {
  MessageCircle,
  Home,
  History,
  Sparkles,
  User,
  Settings,
  LogIn,
  LogOut,
  ShieldCheck,
  Crown,
} from 'lucide-react';

interface NavbarProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentScreen, onNavigate }) => {
  const { currentUser, userProfile, logout } = useAuth();
  const { t } = useLanguage();
  const isPremium = userProfile?.subscriptionTier === 'premium';

  return (
    <>
      {/* Top Header (Desktop & Mobile) */}
      <header className="sticky top-0 z-40 w-full bg-cream-50/80 backdrop-blur-md border-b border-rose-100/60 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center text-left focus:outline-hidden hover:opacity-95 transition-opacity py-1"
          >
            <IntimaLogo size="sm" />
          </button>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                currentScreen === 'home'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-gray-600 hover:text-purple-900 hover:bg-rose-50/60'
              }`}
            >
              {t('nav.home')}
            </button>
            <button
              onClick={() => onNavigate('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                currentScreen === 'chat'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-gray-600 hover:text-purple-900 hover:bg-rose-50/60'
              }`}
            >
              <MessageCircle className="w-4 h-4 text-rose-400" />
              {t('nav.chat')}
            </button>
            <button
              onClick={() => onNavigate('history')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                currentScreen === 'history'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-gray-600 hover:text-purple-900 hover:bg-rose-50/60'
              }`}
            >
              {t('nav.history')}
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                currentScreen === 'pricing'
                  ? 'bg-gradient-to-r from-rose-500 to-purple-800 text-white shadow-xs'
                  : 'text-gray-600 hover:text-rose-600 hover:bg-rose-50/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {t('nav.pricing')}
            </button>
            <button
              onClick={() => onNavigate('profile')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                currentScreen === 'profile'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-gray-600 hover:text-purple-900 hover:bg-rose-50/60'
              }`}
            >
              {t('nav.profile')}
            </button>
            <button
              onClick={() => onNavigate('settings')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                currentScreen === 'settings'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-gray-600 hover:text-purple-900 hover:bg-rose-50/60'
              }`}
            >
              {t('nav.settings')}
            </button>
          </nav>

          {/* Right Action: Language Selector & Auth Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Visible Language Selector */}
            <LanguageSelector variant="pill" />

            {currentUser ? (
              <div className="flex items-center gap-2">
                {/* Subscription Tier Pill */}
                <button
                  onClick={() => onNavigate('pricing')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                    isPremium
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-purple-50 text-purple-900 border-purple-200'
                  }`}
                  title={isPremium ? 'Intima Premium' : t('common.free')}
                >
                  {isPremium ? (
                    <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  )}
                  <span className="hidden sm:inline font-semibold">
                    {isPremium ? t('common.premium') : t('common.free')}
                  </span>
                </button>

                {/* Profile Avatar / Name button */}
                <button
                  onClick={() => onNavigate('profile')}
                  className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-purple-900 p-1 rounded-full hover:bg-rose-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-400 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                    {(userProfile?.displayName || 'U')[0].toUpperCase()}
                  </div>
                  <span className="hidden lg:inline text-xs font-medium max-w-[85px] truncate">
                    {userProfile?.displayName || t('nav.mySpace')}
                  </span>
                </button>

                {/* Logout */}
                <button
                  onClick={() => logout()}
                  title={t('nav.logout')}
                  className="p-1.5 text-gray-400 hover:text-rose-600 rounded-full hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('auth')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-rose-500 to-purple-800 text-white shadow-xs hover:shadow-md hover:opacity-95 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t('nav.login')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Bottom Nav Bar specifically tailored for Android & mobile screens */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-rose-100 shadow-lg px-2 py-1.5 flex items-center justify-around safe-bottom">
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[11px] font-medium transition-colors ${
            currentScreen === 'home' ? 'text-purple-900' : 'text-gray-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>{t('nav.home')}</span>
        </button>

        <button
          onClick={() => onNavigate('chat')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[11px] font-medium relative transition-colors ${
            currentScreen === 'chat' ? 'text-rose-600 font-semibold' : 'text-gray-400'
          }`}
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
          </div>
          <span>{t('nav.chat')}</span>
        </button>

        <button
          onClick={() => onNavigate('history')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[11px] font-medium transition-colors ${
            currentScreen === 'history' ? 'text-purple-900' : 'text-gray-400'
          }`}
        >
          <History className="w-5 h-5" />
          <span>{t('nav.history')}</span>
        </button>

        <button
          onClick={() => onNavigate('pricing')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[11px] font-medium transition-colors ${
            currentScreen === 'pricing' ? 'text-rose-600' : 'text-gray-400'
          }`}
        >
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>{t('nav.pricing')}</span>
        </button>

        <button
          onClick={() => onNavigate(currentUser ? 'profile' : 'auth')}
          className={`flex flex-col items-center gap-0.5 p-1 text-[11px] font-medium transition-colors ${
            currentScreen === 'profile' || currentScreen === 'auth' ? 'text-purple-900' : 'text-gray-400'
          }`}
        >
          <User className="w-5 h-5" />
          <span>{currentUser ? t('nav.profile') : t('nav.login')}</span>
        </button>
      </nav>
    </>
  );
};
