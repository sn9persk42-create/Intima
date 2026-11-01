import React, { useState } from 'react';
import { ScreenType, Conversation } from '../types';
import { IntimaLogo } from './IntimaLogo';
import { useAuth } from '../context/AuthContext';
import { useLanguage, LanguageSelector } from '../context/LanguageContext';
import {
  Menu,
  X,
  Plus,
  History,
  Brain,
  User,
  Settings,
  Sparkles,
  LogIn,
  LogOut,
  Crown,
  ShieldCheck,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';

interface ChatHeaderProps {
  onNewChat: () => void;
  onNavigate: (screen: ScreenType) => void;
  onOpenMemory: () => void;
  conversations?: Conversation[];
  activeConversationId?: string;
  onSelectConversation?: (conv: Conversation) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onNewChat,
  onNavigate,
  onOpenMemory,
  conversations = [],
  activeConversationId,
  onSelectConversation,
}) => {
  const { currentUser, userProfile, logout } = useAuth();
  const { t, language } = useLanguage();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isPremium = userProfile?.subscriptionTier === 'premium';

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 w-full h-14 bg-[#0c0714]/90 backdrop-blur-md border-b border-purple-900/30 px-3 sm:px-5 flex items-center justify-between select-none">
        {/* Left: Menu Drawer Toggle & Compact Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsDrawerOpen(true)}
            title={t('common.menu') || 'Menu'}
            aria-label={t('common.menu') || 'Menu'}
            className="p-2 rounded-xl text-stone-300 hover:text-white hover:bg-purple-900/30 active:scale-95 transition-all"
          >
            <Menu className="w-5 h-5 text-rose-300" />
          </button>

          <button
            onClick={onNewChat}
            className="flex items-center hover:opacity-95 transition-opacity"
            title="INTIMA"
          >
            <IntimaLogo size="sm" />
          </button>
        </div>

        {/* Right: New Chat button & Language Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            title={t('chat.newChat')}
            aria-label={t('chat.newChat')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-stone-200 hover:text-white bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/40 hover:border-rose-400/40 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">{t('chat.newChat')}</span>
          </button>

          {/* Language Selector */}
          <LanguageSelector variant="dark" />

          {/* User Profile Pill or Login */}
          {currentUser ? (
            <button
              onClick={() => onNavigate('profile')}
              title={userProfile?.displayName || t('nav.profile')}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-purple-800 text-white font-bold flex items-center justify-center text-xs shadow-md border border-purple-400/30 hover:scale-105 transition-transform"
            >
              {(userProfile?.displayName || 'U')[0].toUpperCase()}
            </button>
          ) : (
            <button
              onClick={() => onNavigate('auth')}
              className="p-1.5 text-xs text-rose-300 hover:text-white rounded-lg hover:bg-purple-900/30"
              title={t('nav.login')}
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Drawer Overlay Backdrop */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
        />
      )}

      {/* Slide-out Navigation Drawer (Inspired by ChatGPT mobile/web sidebar) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 bg-[#12081d] border-r border-purple-900/40 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-purple-900/30 flex items-center justify-between">
          <IntimaLogo size="sm" />
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-purple-900/40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action: New Chat */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              setIsDrawerOpen(false);
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-purple-900 to-rose-700 hover:from-purple-800 hover:to-rose-600 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Plus className="w-4 h-4 text-rose-200" />
            <span>{t('chat.newChat')}</span>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {/* Recent Conversations preview */}
          <div className="mb-3">
            <div className="flex items-center justify-between px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              <span className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-purple-400" />
                {t('chat.yourChats')}
              </span>
              <button
                onClick={() => {
                  onNavigate('history');
                  setIsDrawerOpen(false);
                }}
                className="text-rose-400 hover:underline capitalize"
              >
                {t('history.all')}
              </button>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {conversations.length === 0 ? (
                <p className="text-[11px] text-stone-500 italic px-2 py-1">
                  {t('chat.noChats')}
                </p>
              ) : (
                conversations.slice(0, 6).map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      if (onSelectConversation) onSelectConversation(conv);
                      setIsDrawerOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                      activeConversationId === conv.id
                        ? 'bg-purple-900/50 text-white font-medium border border-purple-700/50'
                        : 'text-stone-300 hover:bg-purple-950/40 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{conv.title}</span>
                    <ChevronRight className="w-3 h-3 text-stone-500 shrink-0 ml-1" />
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-purple-900/30 my-2" />

          {/* Mémoire Personnelle Button */}
          <button
            onClick={() => {
              onOpenMemory();
              setIsDrawerOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-stone-200 hover:text-white hover:bg-purple-950/50 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-900/60 flex items-center justify-center text-rose-300">
              <Brain className="w-4 h-4" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-white">{t('memory.title')}</div>
              <div className="text-[10px] text-stone-400 truncate">
                {language === 'en' ? 'Manage your relationship memory' : 'Gérer vos souvenirs & préférences'}
              </div>
            </div>
          </button>

          {/* Profil */}
          <button
            onClick={() => {
              onNavigate('profile');
              setIsDrawerOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-stone-200 hover:text-white hover:bg-purple-950/50 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-900/60 flex items-center justify-center text-rose-300">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 text-left font-medium text-white">
              {t('nav.profile')}
            </div>
          </button>

          {/* Abonnements */}
          <button
            onClick={() => {
              onNavigate('pricing');
              setIsDrawerOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-stone-200 hover:text-white hover:bg-purple-950/50 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-900/60 flex items-center justify-center text-amber-300">
              <Crown className="w-4 h-4" />
            </div>
            <div className="flex-1 text-left font-medium text-white flex items-center justify-between">
              <span>{t('nav.pricing')}</span>
              {isPremium ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  Premium
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200">
                  Gratuit
                </span>
              )}
            </div>
          </button>

          {/* Paramètres */}
          <button
            onClick={() => {
              onNavigate('settings');
              setIsDrawerOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-stone-200 hover:text-white hover:bg-purple-950/50 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-900/60 flex items-center justify-center text-rose-300">
              <Settings className="w-4 h-4" />
            </div>
            <div className="flex-1 text-left font-medium text-white">
              {t('nav.settings')}
            </div>
          </button>

          {/* Supervision IA / AI Oversight */}
          <button
            onClick={() => {
              onNavigate('admin');
              setIsDrawerOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-stone-200 hover:text-white hover:bg-purple-950/50 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-rose-950/80 border border-rose-700/40 flex items-center justify-center text-rose-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-white flex items-center gap-1.5">
                <span>{t('nav.admin')}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold uppercase">
                  Lab
                </span>
              </div>
              <div className="text-[10px] text-stone-400 truncate">
                {language === 'en' ? 'Models, grounding & rules' : 'Modèles, web & versions'}
              </div>
            </div>
          </button>
        </div>

        {/* Drawer Footer: User account */}
        <div className="p-3 border-t border-purple-900/30 bg-[#0e0617]">
          {currentUser ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-purple-800 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {(userProfile?.displayName || 'U')[0].toUpperCase()}
                </div>
                <div className="truncate">
                  <p className="text-xs font-medium text-white truncate">
                    {userProfile?.displayName || 'Utilisateur'}
                  </p>
                  <p className="text-[10px] text-stone-400 truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  setIsDrawerOpen(false);
                }}
                title={t('nav.logout')}
                className="p-1.5 text-stone-400 hover:text-rose-400 rounded-lg hover:bg-purple-950 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onNavigate('auth');
                setIsDrawerOpen(false);
              }}
              className="w-full py-2 px-3 rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-xs font-semibold flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{t('nav.login')}</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
