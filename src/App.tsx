/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage, LanguageSelector } from './context/LanguageContext';
import { ChatScreen } from './components/screens/ChatScreen';
import { HistoryScreen } from './components/screens/HistoryScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { PricingScreen } from './components/screens/PricingScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { AuthScreen } from './components/screens/AuthScreen';
import { AdminScreen } from './components/screens/AdminScreen';
import { MemoryModal } from './components/MemoryModal';
import { ScreenType, Conversation, RelationshipTopic } from './types';
import { IntimaLogo } from './components/IntimaLogo';
import { Lock, Unlock, ArrowLeft, MessageSquare } from 'lucide-react';

const AppContent: React.FC = () => {
  const { loading, userProfile } = useAuth();
  const { t, language } = useLanguage();
  // Navigation & session state
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('chat');
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>();
  const [chatInitialTopic, setChatInitialTopic] = useState<RelationshipTopic | undefined>();
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);

  // Track active conversation ID with local storage persistence across refresh and screen changes
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    return localStorage.getItem('intima_active_conv_id');
  });

  const handleSelectConversationId = (id: string | null) => {
    setActiveConversationId(id);
    if (id) {
      localStorage.setItem('intima_active_conv_id', id);
    } else {
      localStorage.removeItem('intima_active_conv_id');
    }
  };

  // PIN protection modal state
  const [pinEntered, setPinEntered] = useState('');
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);

  const needsPinUnlock =
    userProfile?.pinProtected && userProfile?.pinCode && !pinUnlocked;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinEntered === userProfile?.pinCode) {
      setPinUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinEntered('');
    }
  };

  const handleOpenConversationFromHistory = (conv: Conversation) => {
    handleSelectConversationId(conv.id);
    setCurrentScreen('chat');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0714] flex flex-col items-center justify-center p-4">
        <IntimaLogo size="lg" />
        <div className="mt-8 flex items-center gap-2 text-stone-400 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span>{language === 'en' ? 'Loading your intimate sanctuary...' : 'Chargement de votre sanctuaire intime...'}</span>
        </div>
      </div>
    );
  }

  // Lock Screen (Dark Plum Theme)
  if (needsPinUnlock) {
    return (
      <div className="min-h-screen bg-[#0c0714] flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-[#140a20] border border-purple-800/40 p-8 rounded-3xl text-center space-y-6 shadow-2xl animate-fade-in text-stone-100">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-800 to-rose-600 flex items-center justify-center mx-auto text-white shadow-md shadow-rose-950/50">
            <Lock className="w-7 h-7 text-rose-200" />
          </div>

          <div>
            <h2 className="font-serif text-2xl font-normal text-white">{t('lock.locked')}</h2>
            <p className="text-xs text-stone-400 mt-1">
              {t('lock.enterPin')}
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              maxLength={4}
              autoFocus
              value={pinEntered}
              onChange={(e) => {
                setPinEntered(e.target.value.replace(/\D/g, ''));
                setPinError(false);
              }}
              placeholder="••••"
              className="w-36 text-center text-2xl tracking-widest font-mono py-2 rounded-xl bg-[#09040e] border border-purple-700/50 text-white focus:outline-hidden focus:border-rose-400"
            />

            {pinError && (
              <p className="text-xs text-rose-400">{t('lock.pinError')}</p>
            )}

            <button
              type="submit"
              disabled={pinEntered.length < 4}
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-purple-700 hover:opacity-95 disabled:opacity-40 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>{t('lock.unlock')}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0714] text-stone-100 font-sans selection:bg-rose-500/30 selection:text-white">
      {/* Primary Conversation Screen - kept alive in DOM to prevent unmounting and message loss */}
      <div className={currentScreen === 'chat' ? 'flex-1 flex flex-col' : 'hidden'}>
        <ChatScreen
          initialPrompt={chatInitialPrompt}
          initialTopic={chatInitialTopic}
          selectedConversationId={activeConversationId}
          onSelectConversationId={handleSelectConversationId}
          onNavigate={setCurrentScreen}
          onOpenMemory={() => setIsMemoryOpen(true)}
        />
      </div>

      {/* Sub-screens with Top Bar back button */}
      {currentScreen !== 'chat' && (
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Sub-screen Navigation Header */}
          <header className="sticky top-0 z-30 h-14 bg-[#0c0714]/90 backdrop-blur-md border-b border-purple-900/40 px-4 sm:px-6 flex items-center justify-between">
            <button
              onClick={() => setCurrentScreen('chat')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/60 hover:bg-purple-900/60 text-stone-200 hover:text-white border border-purple-800/40 text-xs transition-all shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 text-rose-300" />
              <span>{t('nav.backToChat')}</span>
            </button>

            <IntimaLogo size="sm" />

            <div className="flex items-center gap-2">
              <LanguageSelector variant="dark" />
            </div>
          </header>

          <main className="flex-1 bg-[#0c0714] text-stone-100">
            {currentScreen === 'history' && (
              <HistoryScreen
                onNavigate={setCurrentScreen}
                onOpenConversation={handleOpenConversationFromHistory}
              />
            )}

            {currentScreen === 'profile' && (
              <ProfileScreen onNavigate={setCurrentScreen} />
            )}

            {currentScreen === 'pricing' && (
              <PricingScreen onNavigate={setCurrentScreen} />
            )}

            {currentScreen === 'settings' && (
              <SettingsScreen onNavigate={setCurrentScreen} />
            )}

            {currentScreen === 'admin' && (
              <AdminScreen onNavigate={setCurrentScreen} />
            )}

            {currentScreen === 'auth' && (
              <AuthScreen onNavigate={setCurrentScreen} />
            )}
          </main>
        </div>
      )}

      {/* Personal Memory Modal */}
      <MemoryModal
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
