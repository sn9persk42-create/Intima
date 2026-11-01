import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Language, translations } from '../i18n/translations';
import { useAuth } from './AuthContext';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (path: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, updateUserProfile, currentUser } = useAuth();

  // Supported languages
  const VALID_LANGUAGES: Language[] = ['fr', 'en', 'de', 'es', 'pt', 'la'];

  // Initialize from user profile or local storage, defaulting to 'fr'
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('intima_language') as Language | null;
      if (stored && VALID_LANGUAGES.includes(stored)) return stored;

      // Auto-detect browser language if available
      const navLang = (navigator.language || '').toLowerCase();
      if (navLang.startsWith('de')) return 'de';
      if (navLang.startsWith('es')) return 'es';
      if (navLang.startsWith('pt')) return 'pt';
      if (navLang.startsWith('en')) return 'en';
      if (navLang.startsWith('la')) return 'la';
    }
    return 'fr';
  });

  // Keep in sync with user profile if profile loads with a set language
  useEffect(() => {
    if (userProfile?.language && VALID_LANGUAGES.includes(userProfile.language)) {
      if (userProfile.language !== language) {
        setLanguageState(userProfile.language);
        localStorage.setItem('intima_language', userProfile.language);
      }
    }
  }, [userProfile?.language]);

  const setLanguage = async (newLang: Language) => {
    setLanguageState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('intima_language', newLang);
    }
    if (currentUser && userProfile) {
      await updateUserProfile({ language: newLang });
    }
  };

  // Translation helper function accepting paths like 'home.heroTitle1'
  const t = useMemo(() => {
    return (path: string, fallback?: string): string => {
      const currentDict = translations[language] as any;
      const parts = path.split('.');
      let result = currentDict;

      for (const part of parts) {
        if (result && typeof result === 'object' && part in result) {
          result = result[part];
        } else {
          // Fallback to french if missing in current language
          let fallbackResult = (translations.fr as any);
          for (const fbPart of parts) {
            if (fallbackResult && typeof fallbackResult === 'object' && fbPart in fallbackResult) {
              fallbackResult = fallbackResult[fbPart];
            } else {
              return fallback || path;
            }
          }
          return typeof fallbackResult === 'string' ? fallbackResult : fallback || path;
        }
      }

      return typeof result === 'string' ? result : fallback || path;
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Reusable Language Selector Component
export const LanguageSelector: React.FC<{
  className?: string;
  variant?: 'pill' | 'dropdown' | 'buttons' | 'dark';
}> = ({ className = '', variant = 'dark' }) => {
  const { language, setLanguage } = useLanguage();

  if (variant === 'buttons') {
    return (
      <div className={`inline-flex rounded-full bg-[#1b0d2b] p-1 border border-purple-800/40 ${className}`}>
        <button
          type="button"
          onClick={() => setLanguage('fr')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
            language === 'fr'
              ? 'bg-gradient-to-r from-rose-500 to-purple-700 text-white shadow-xs'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <span>Français</span>
          <span>🇫🇷</span>
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
            language === 'en'
              ? 'bg-gradient-to-r from-rose-500 to-purple-700 text-white shadow-xs'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <span>English</span>
          <span>🇬🇧</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="text-xs font-medium bg-[#1a0c29] border border-purple-800/50 rounded-full px-3 py-1.5 text-stone-200 hover:border-rose-400/50 focus:outline-hidden cursor-pointer transition-all appearance-none pr-7 shadow-xs"
        aria-label="Sélection de langue / Language selector"
      >
        <option value="fr" className="bg-[#140a20] text-stone-100">FR 🇫🇷</option>
        <option value="en" className="bg-[#140a20] text-stone-100">EN 🇬🇧</option>
      </select>
      <span className="pointer-events-none absolute right-2.5 text-[9px] text-stone-400">▼</span>
    </div>
  );
};
