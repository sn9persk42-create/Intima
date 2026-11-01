import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, LanguageSelector } from '../../context/LanguageContext';
import { ScreenType } from '../../types';
import { IntimaLogo } from '../IntimaLogo';
import {
  Lock,
  Mail,
  ShieldCheck,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface AuthScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onNavigate }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsGuest } = useAuth();
  const { t, language } = useLanguage();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        if (!name.trim()) {
          setErrorMsg(language === 'en' ? 'Please enter a name or nickname.' : 'Veuillez entrer un prénom ou pseudonyme.');
          setLoading(false);
          return;
        }
        await signUpWithEmail(email, password, name.trim());
      }
      onNavigate('chat');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setErrorMsg(language === 'en' ? 'Incorrect email or password.' : 'Email ou mot de passe incorrect.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg(language === 'en' ? 'An INTIMA account already exists with this email.' : 'Cet email possède déjà un compte INTIMA.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg(language === 'en' ? 'Password must be at least 6 characters.' : 'Le mot de passe doit comporter au moins 6 caractères.');
      } else {
        setErrorMsg(err.message || (language === 'en' ? 'Unable to connect.' : 'Impossible de se connecter.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onNavigate('chat');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(language === 'en' ? 'Google sign-in was interrupted.' : 'Connexion Google interrompue.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInAsGuest();
      onNavigate('chat');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(language === 'en' ? 'Unable to start in guest mode.' : 'Impossible de démarrer en mode invité.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0714] py-12 px-4 sm:px-6 lg:px-8 text-stone-100">
      <div className="max-w-md w-full space-y-6">
        {/* Language switch bar above auth card */}
        <div className="flex justify-center">
          <LanguageSelector variant="buttons" />
        </div>

        {/* Logo and Greeting */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <IntimaLogo size="md" />
          </div>
          <h2 className="font-serif text-2xl text-white font-normal pt-1">
            {mode === 'signin' ? t('auth.loginTitle') : t('auth.signupTitle')}
          </h2>
          <p className="text-xs text-stone-400 max-w-xs mx-auto leading-relaxed">
            {t('auth.tagline')}
          </p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-3xl bg-[#140a20] border border-purple-900/40 shadow-2xl space-y-5">
          {/* Tab Switcher */}
          <div className="flex bg-[#1b0d2b] p-1 rounded-full text-xs border border-purple-800/40">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-full font-medium transition-all ${
                mode === 'signin'
                  ? 'bg-gradient-to-r from-rose-500 to-purple-700 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {t('auth.signin')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-full font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-rose-500 to-purple-700 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {t('auth.signup')}
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl border border-purple-800/50 hover:border-purple-600 bg-[#1b0d2b] text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 shadow-xs hover:bg-purple-950/50 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{t('auth.googleLogin')}</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-purple-900/50 w-full" />
            <span className="bg-[#140a20] px-3 text-[11px] uppercase tracking-wider text-stone-500 absolute font-semibold">
              {t('auth.orEmail')}
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t('auth.name')}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('auth.namePrompt')}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1b0d2b] border border-purple-800/50 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-rose-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@exemple.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1b0d2b] border border-purple-800/50 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-rose-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1b0d2b] border border-purple-800/50 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-rose-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-purple-700 text-white font-semibold text-xs shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span>{loading ? t('common.loading') : mode === 'signin' ? t('auth.submitLogin') : t('auth.submitSignup')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Guest Mode Discovery option */}
          <div className="pt-2 text-center border-t border-purple-900/40">
            <button
              type="button"
              onClick={handleGuestSignIn}
              disabled={loading}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold inline-flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('auth.guestBtn')}</span>
            </button>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="text-center text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{t('auth.secureFooter')}</span>
        </div>
      </div>
    </div>
  );
};
