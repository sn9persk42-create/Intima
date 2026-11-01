import React, { useState } from 'react';
import { ScreenType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, LanguageSelector } from '../../context/LanguageContext';
import {
  Heart,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  HelpCircle,
  ArrowRight,
  Smile,
  CheckCircle2,
  Lock,
  Flower2,
  Users,
  Compass,
  Volume2,
  Globe,
} from 'lucide-react';

interface HomeScreenProps {
  onNavigate: (screen: ScreenType) => void;
  onStartChatWithPrompt?: (prompt: string, topic?: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onStartChatWithPrompt,
}) => {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const [selectedPill, setSelectedPill] = useState<'couple' | 'solo'>('couple');
  const [interactiveFact, setInteractiveFact] = useState('');
  const [interactiveHypothesis, setInteractiveHypothesis] = useState('');
  const [exerciseResult, setExerciseResult] = useState<string | null>(null);

  const handleTestClarity = () => {
    if (!interactiveFact.trim()) return;
    if (language === 'en') {
      setExerciseResult(
        `INTIMA Insight: You have pinpointed the objective fact ("${interactiveFact}"). Be mindful not to turn "${interactiveHypothesis || "this silence"}" into an absolute certainty of rejection. Propose a gentle, open question.`
      );
    } else {
      setExerciseResult(
        `Analyse INTIMA : Vous avez identifié le fait objectif ("${interactiveFact}"). Prenez garde à ne pas transformer "${interactiveHypothesis || "ce silence"}" en certitude de désintérêt. Proposez une question simple et ouverte.`
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-rose-50/20 to-purple-50/30 text-stone-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Soft atmospheric blurred circles */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-rose-200/40 via-purple-300/30 to-pink-100/20 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Badge & Language Selector row on home */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-rose-200/80 shadow-xs text-xs font-medium text-purple-900 animate-fade-in">
              <Flower2 className="w-4 h-4 text-rose-500" />
              <span>{t('home.badge')}</span>
            </div>
            <LanguageSelector variant="buttons" />
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-gray-900 leading-[1.15]">
            {t('home.heroTitle1')}
            <span className="italic font-medium bg-clip-text text-transparent bg-gradient-to-r from-purple-950 via-purple-800 to-rose-600">
              {t('home.heroTitle2')}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
            {t('home.heroDesc')}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('chat')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-gradient-to-r from-purple-900 via-purple-800 to-rose-600 text-white font-medium text-sm sm:text-base shadow-lg shadow-purple-900/15 hover:shadow-xl hover:shadow-purple-900/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 group"
            >
              <MessageCircle className="w-5 h-5 text-rose-300 group-hover:scale-110 transition-transform" />
              <span>{t('home.openChatBtn')}</span>
              <ArrowRight className="w-4 h-4 text-rose-200 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate(currentUser ? 'history' : 'auth')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white/90 border border-stone-200 text-stone-700 hover:text-purple-900 hover:border-purple-200 text-sm sm:text-base font-medium shadow-xs hover:shadow-sm transition-all"
            >
              {currentUser ? t('home.pastConvsBtn') : t('home.createAccountBtn')}
            </button>
          </div>

          {/* Quick reassurance strip */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {t('home.zeroJudgement')}
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-purple-600" />
              {t('home.privateData')}
            </span>
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-rose-500" />
              {t('home.ttsVoice')}
            </span>
          </div>
        </div>
      </section>

      {/* Core Philosophy Pillar: Facts vs Hypotheses */}
      <section className="py-12 bg-white/70 border-y border-rose-100/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs uppercase tracking-wider text-rose-700 font-semibold">
              {t('home.signatureTitle')}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-gray-900 mt-1">
              {t('home.signatureHeading')}
            </h2>
            <p className="text-sm text-stone-600 mt-2">
              {t('home.signatureDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Facts */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50/70 to-white border border-purple-100 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-900 text-white flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5 text-purple-300" />
              </div>
              <h3 className="font-semibold text-lg text-purple-950">
                {t('home.factsTitle')}
              </h3>
              <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                {t('home.factsDesc')}
              </p>
              <div className="mt-4 p-3 rounded-lg bg-purple-100/50 text-xs text-purple-900 border border-purple-200/50">
                <span className="font-semibold">{language === 'en' ? 'Factual Example:' : 'Exemple factuel :'} </span>
                {t('home.factsExample')}
              </div>
            </div>

            {/* Box 2: Hypotheses */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-50/70 to-white border border-rose-100 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center mb-4">
                <HelpCircle className="w-5 h-5 text-rose-200" />
              </div>
              <h3 className="font-semibold text-lg text-rose-950">
                {t('home.hypothesesTitle')}
              </h3>
              <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                {t('home.hypothesesDesc')}
              </p>
              <div className="mt-4 p-3 rounded-lg bg-rose-100/50 text-xs text-rose-900 border border-rose-200/50">
                <span className="font-semibold">{language === 'en' ? 'Frequent Assumption:' : 'Supposition fréquente :'} </span>
                {t('home.hypothesesExample')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Relationship Clarity Pulse */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-br from-purple-950 via-purple-900 to-rose-950 text-white p-6 sm:p-10 shadow-xl border border-purple-800/40">
          <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>{t('home.exerciseBadge')}</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl text-stone-100 font-normal">
            {t('home.exerciseHeading')}
          </h3>
          <p className="text-sm text-purple-200/80 mt-1 max-w-xl">
            {t('home.exerciseSub')}
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-purple-200 mb-1">
                {t('home.factLabel')}
              </label>
              <input
                type="text"
                value={interactiveFact}
                onChange={(e) => setInteractiveFact(e.target.value)}
                placeholder={t('home.factPlaceholder')}
                className="w-full px-4 py-2.5 rounded-xl bg-purple-900/60 border border-purple-700/60 text-stone-100 placeholder-purple-300/40 text-sm focus:outline-hidden focus:border-rose-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-purple-200 mb-1">
                {t('home.hypLabel')}
              </label>
              <input
                type="text"
                value={interactiveHypothesis}
                onChange={(e) => setInteractiveHypothesis(e.target.value)}
                placeholder={t('home.hypPlaceholder')}
                className="w-full px-4 py-2.5 rounded-xl bg-purple-900/60 border border-purple-700/60 text-stone-100 placeholder-purple-300/40 text-sm focus:outline-hidden focus:border-rose-400"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleTestClarity}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-rose-500 hover:bg-rose-400 text-white font-medium text-sm transition-all shadow-md"
              >
                {t('home.analyzeDiffBtn')}
              </button>

              <button
                onClick={() => {
                  if (onStartChatWithPrompt) {
                    onStartChatWithPrompt(
                      interactiveFact
                        ? language === 'en'
                          ? `I would like your help getting perspective on this situation:\nFact: ${interactiveFact}\nWhat I imagine: ${interactiveHypothesis}`
                          : `J'aimerais ton aide pour prendre du recul sur cette situation :\nFait : ${interactiveFact}\nCe que j'imagine : ${interactiveHypothesis}`
                        : language === 'en'
                        ? 'I feel some relationship tension and I would like us to separate facts from assumptions together.'
                        : "Je ressens une tension relationnelle et j'aimerais qu'on démêle les faits des suppositions ensemble."
                    );
                  } else {
                    onNavigate('chat');
                  }
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-purple-800/80 hover:bg-purple-700 text-purple-100 text-sm font-medium transition-all"
              >
                {t('home.discussDeepBtn')}
              </button>
            </div>

            {exerciseResult && (
              <div className="mt-4 p-4 rounded-xl bg-purple-900/80 border border-rose-400/30 text-xs sm:text-sm text-purple-100 animate-fade-in leading-relaxed">
                {exerciseResult}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Two Paths: Célibataires vs En Couple */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="font-serif text-3xl text-gray-900">
            {language === 'en' ? 'Tailored guidance for every heart' : 'Un accompagnement sur-mesure pour chaque cœur'}
          </h2>
          <div className="mt-4 inline-flex p-1 bg-stone-200/60 rounded-full">
            <button
              onClick={() => setSelectedPill('couple')}
              className={`px-5 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedPill === 'couple'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {t('home.coupleTab')}
            </button>
            <button
              onClick={() => setSelectedPill('solo')}
              className={`px-5 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedPill === 'solo'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {t('home.soloTab')}
            </button>
          </div>
        </div>

        {selectedPill === 'couple' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-rose-100 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 text-base">
                {t('home.conflictHeading')}
              </h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                {t('home.conflictDesc')}
              </p>
              <button
                onClick={() =>
                  onStartChatWithPrompt
                    ? onStartChatWithPrompt(
                        language === 'en'
                          ? 'We frequently argue over minor details and it escalates. How can we de-escalate in the very first minutes?'
                          : "On se dispute souvent pour des broutilles et ça dégénère. Comment désamorcer dès les premières minutes ?"
                      )
                    : onNavigate('chat')
                }
                className="mt-4 text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                {t('home.exploreTheme')}
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-rose-100 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 text-base">
                {t('home.flameHeading')}
              </h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                {t('home.flameDesc')}
              </p>
              <button
                onClick={() =>
                  onStartChatWithPrompt
                    ? onStartChatWithPrompt(
                        language === 'en'
                          ? 'With our busy daily routine, we have drifted apart. How can we rekindle emotional intimacy?'
                          : "Avec la routine quotidienne, nous nous sommes un peu éloignés. Comment retrouver notre intimité émotionnelle ?"
                      )
                    : onNavigate('chat')
                }
                className="mt-4 text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                {t('home.exploreTheme')}
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-rose-100 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 text-base">
                {t('home.mediationHeading')}
              </h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                {t('home.mediationDesc')}
              </p>
              <button
                onClick={() =>
                  onStartChatWithPrompt
                    ? onStartChatWithPrompt(
                        language === 'en'
                          ? 'I need to send a delicate message to my partner. Can you help me phrase it using Non-Violent Communication?'
                          : "J'ai un message délicat à envoyer à mon/ma partenaire. Peux-tu m'aider à le formuler en Communication Non-Violente ?"
                      )
                    : onNavigate('chat')
                }
                className="mt-4 text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                {t('home.exploreTheme')}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-purple-100 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-4">
                <Smile className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 text-base">
                {t('home.esteemHeading')}
              </h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                {t('home.esteemDesc')}
              </p>
              <button
                onClick={() =>
                  onStartChatWithPrompt
                    ? onStartChatWithPrompt(
                        language === 'en'
                          ? 'I tend to lose myself as soon as I meet someone I like. How can I stay grounded in self-worth?'
                          : "J'ai tendance à m'oublier dès que je rencontre quelqu'un qui me plaît. Comment garder mon ancrage et mon estime ?"
                      )
                    : onNavigate('chat')
                }
                className="mt-4 text-xs font-semibold text-purple-900 hover:text-purple-950 flex items-center gap-1"
              >
                {t('home.exploreTheme')}
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-rose-100 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 text-base">
                {t('home.breakupHeading')}
              </h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                {t('home.breakupDesc')}
              </p>
              <button
                onClick={() =>
                  onStartChatWithPrompt
                    ? onStartChatWithPrompt(
                        language === 'en'
                          ? 'I am going through a difficult breakup and constantly replaying the past. How can I soothe this pain?'
                          : "Je vis une rupture difficile et je rumine sans cesse le passé. Comment apaiser cette douleur émotionnelle ?"
                      )
                    : onNavigate('chat')
                }
                className="mt-4 text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                {t('home.exploreTheme')}
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-amber-100 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 text-base">
                {t('home.datingHeading')}
              </h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                {t('home.datingDesc')}
              </p>
              <button
                onClick={() =>
                  onStartChatWithPrompt
                    ? onStartChatWithPrompt(
                        language === 'en'
                          ? 'I feel like I always attract the same emotionally unavailable profile. How can I break this cycle?'
                          : "J'ai l'impression d'attirer toujours le même type de profil indisponible. Comment briser ce schéma ?"
                      )
                    : onNavigate('chat')
                }
                className="mt-4 text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                {t('home.exploreTheme')}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gradient-to-b from-purple-50/50 to-rose-50/30 px-4 sm:px-6 lg:px-8 border-t border-rose-100/60">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-900">
            {language === 'en' ? 'Stories & Testimonials' : 'Témoignages & Récits'}
          </span>
          <h2 className="font-serif text-3xl text-gray-900 mt-1">
            {t('home.testimonialsHeading')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="p-6 rounded-2xl bg-white/90 border border-rose-100 shadow-xs flex flex-col justify-between">
            <p className="text-sm text-stone-600 italic leading-relaxed">
              {language === 'en'
                ? '“When my partner closed up in silence, I was about to explode. INTIMA made me realize that his silence was an observable fact, but my belief that he despised me was only an assumption. I asked calmly, and he opened up.”'
                : '« Quand mon mari s’est enfermé dans le silence, j’étais prête à exploser. INTIMA m’a fait réaliser que son silence était un fait, mais que ma conviction qu’il me méprisait n’était qu’une supposition. J’ai formulé ma demande calmement, et il m’a enfin parlé. »'}
            </p>
            <div className="mt-4 pt-3 border-t border-rose-50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-200 text-rose-800 font-bold flex items-center justify-center text-xs">
                C
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-900">Camille, 34 {language === 'en' ? 'yo' : 'ans'}</p>
                <p className="text-[11px] text-stone-400">{language === 'en' ? 'In a couple for 7 years' : 'En couple depuis 7 ans'}</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/90 border border-purple-100 shadow-xs flex flex-col justify-between">
            <p className="text-sm text-stone-600 italic leading-relaxed">
              {language === 'en'
                ? '“After a painful breakup, I felt guilty burdening my friends repeatedly. The gentleness and non-judgmental clarity of INTIMA brought me a real daily breath of fresh air.”'
                : '« Après une rupture douloureuse, je n’osais pas confier mes ruminations à mes amis pour ne pas les lasser. La douceur et l’analyse sans jugement d’INTIMA m’ont apporté une bouffée d’oxygène quotidienne. »'}
            </p>
            <div className="mt-4 pt-3 border-t border-purple-50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-200 text-purple-800 font-bold flex items-center justify-center text-xs">
                M
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-900">Maxime, 29 {language === 'en' ? 'yo' : 'ans'}</p>
                <p className="text-[11px] text-stone-400">{language === 'en' ? 'Single' : 'Célibataire'}</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/90 border border-rose-100 shadow-xs flex flex-col justify-between">
            <p className="text-sm text-stone-600 italic leading-relaxed">
              {language === 'en'
                ? '“The audio playback feature in the evening is truly soothing. The voice is so calm that it helps me decompress before sleep instead of over-analyzing every word.”'
                : '« La fonction de lecture vocale est magique le soir. La voix est tellement posée qu’elle m’aide à décompresser avant d’aller me coucher et à arrêter de sur-analyser chaque phrase. »'}
            </p>
            <div className="mt-4 pt-3 border-t border-rose-50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-800 font-bold flex items-center justify-center text-xs">
                S
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-900">Salomé, 41 {language === 'en' ? 'yo' : 'ans'}</p>
                <p className="text-[11px] text-stone-400">{language === 'en' ? 'Married, 2 children' : 'Mariée, 2 enfants'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-rose-800 to-purple-950 p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <h3 className="font-serif text-3xl sm:text-4xl font-normal">
              {t('home.ctaHeading')}
            </h3>
            <p className="text-sm text-purple-100/90 leading-relaxed">
              {t('home.ctaDesc')}
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('chat')}
                className="px-8 py-3.5 rounded-full bg-white text-purple-950 font-semibold text-sm hover:bg-rose-50 shadow-md transition-all"
              >
                {t('home.ctaBtn')}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
