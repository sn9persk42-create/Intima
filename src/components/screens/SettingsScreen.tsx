import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { chatService } from '../../services/chatService';
import { ScreenType, Language } from '../../types';
import {
  Settings as SettingsIcon,
  Volume2,
  Bell,
  Smartphone,
  Check,
  Play,
  Globe,
  ShieldCheck,
} from 'lucide-react';

interface SettingsScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate }) => {
  const { userProfile, updateUserProfile } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [selectedVoice, setSelectedVoice] = useState(userProfile?.preferredVoice || 'Kore');
  const [selectedLang, setSelectedLang] = useState<Language>(userProfile?.language || language || 'fr');
  const [dailyReminder, setDailyReminder] = useState(true);
  const [coupleRitual, setCoupleRitual] = useState(false);
  const [testingVoice, setTestingVoice] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleVoiceTest = async (voiceName: string) => {
    setTestingVoice(true);
    try {
      const testSentences: Record<Language, string> = {
        fr: "Bonjour, je suis la voix d'INTIMA. Je suis là pour vous écouter avec douceur et bienveillance.",
        en: "Hello, I am INTIMA's voice. I am here to listen with tenderness and warmth.",
        de: "Hallo, ich bin die Stimme von INTIMA. Ich bin hier, um Ihnen mit Sanftheit und Wohlwollen zuzuhören.",
        es: "Hola, soy la voz de INTIMA. Estoy aquí para escucharte con dulzura y empatía.",
        pt: "Olá, sou a voz de INTIMA. Estou aqui para te ouvir com carinho e acolhimento.",
        la: "Salve, sum vox INTIMA. Hic sum ut te clementer et aequo animo audiam.",
      };
      const testSentence = testSentences[selectedLang] || testSentences.fr;

      const audioUrl = await chatService.synthesizeSpeech(
        testSentence,
        voiceName,
        selectedLang
      );
      const audio = new Audio(audioUrl);
      audio.onended = () => setTestingVoice(false);
      audio.onerror = () => setTestingVoice(false);
      await audio.play();
    } catch {
      setTestingVoice(false);
    }
  };

  const handleSave = async () => {
    await setLanguage(selectedLang);
    await updateUserProfile({
      preferredVoice: selectedVoice,
      language: selectedLang,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0c0714] py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 text-stone-100">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-semibold uppercase tracking-wider mb-1">
          <SettingsIcon className="w-4 h-4 text-rose-500" />
          <span>{language === 'en' ? 'General Preferences' : 'Préférences Générales'}</span>
        </div>
        <h1 className="font-serif text-3xl text-white font-normal">
          {t('settings.title')}
        </h1>
        <p className="text-xs sm:text-sm text-stone-400 mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Language Selection Card */}
      <div className="p-6 rounded-3xl bg-[#140a20] border border-purple-900/40 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-purple-900/40">
          <Globe className="w-5 h-5 text-rose-400" />
          <h3 className="font-semibold text-white text-base">
            {t('settings.langSection')}
          </h3>
        </div>

        <p className="text-xs text-stone-400">
          {t('settings.langDesc')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {/* 1. Français */}
          <button
            type="button"
            onClick={() => setSelectedLang('fr')}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
              selectedLang === 'fr'
                ? 'border-rose-500 bg-rose-950/40 shadow-xs'
                : 'border-purple-900/40 bg-[#1b0d2b] hover:bg-purple-950/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇫🇷</span>
              <div>
                <p className="font-semibold text-xs text-white">Français 🇫🇷</p>
                <p className="text-[11px] text-stone-400">Interface & réponses en français</p>
              </div>
            </div>
            {selectedLang === 'fr' && (
              <span className="w-3 h-3 rounded-full bg-rose-400 shrink-0 ml-2" />
            )}
          </button>

          {/* 2. English */}
          <button
            type="button"
            onClick={() => setSelectedLang('en')}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
              selectedLang === 'en'
                ? 'border-rose-500 bg-rose-950/40 shadow-xs'
                : 'border-purple-900/40 bg-[#1b0d2b] hover:bg-purple-950/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇬🇧</span>
              <div>
                <p className="font-semibold text-xs text-white">English 🇬🇧</p>
                <p className="text-[11px] text-stone-400">Interface & AI answers in English</p>
              </div>
            </div>
            {selectedLang === 'en' && (
              <span className="w-3 h-3 rounded-full bg-rose-400 shrink-0 ml-2" />
            )}
          </button>

          {/* 3. Deutsch */}
          <button
            type="button"
            onClick={() => setSelectedLang('de')}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
              selectedLang === 'de'
                ? 'border-rose-500 bg-rose-950/40 shadow-xs'
                : 'border-purple-900/40 bg-[#1b0d2b] hover:bg-purple-950/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇩🇪</span>
              <div>
                <p className="font-semibold text-xs text-white">Deutsch 🇩🇪</p>
                <p className="text-[11px] text-stone-400">Benutzeroberfläche & KI auf Deutsch</p>
              </div>
            </div>
            {selectedLang === 'de' && (
              <span className="w-3 h-3 rounded-full bg-rose-400 shrink-0 ml-2" />
            )}
          </button>

          {/* 4. Español */}
          <button
            type="button"
            onClick={() => setSelectedLang('es')}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
              selectedLang === 'es'
                ? 'border-rose-500 bg-rose-950/40 shadow-xs'
                : 'border-purple-900/40 bg-[#1b0d2b] hover:bg-purple-950/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇪🇸</span>
              <div>
                <p className="font-semibold text-xs text-white">Español 🇪🇸</p>
                <p className="text-[11px] text-stone-400">Interfaz y respuestas en español</p>
              </div>
            </div>
            {selectedLang === 'es' && (
              <span className="w-3 h-3 rounded-full bg-rose-400 shrink-0 ml-2" />
            )}
          </button>

          {/* 5. Português */}
          <button
            type="button"
            onClick={() => setSelectedLang('pt')}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
              selectedLang === 'pt'
                ? 'border-rose-500 bg-rose-950/40 shadow-xs'
                : 'border-purple-900/40 bg-[#1b0d2b] hover:bg-purple-950/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇵🇹</span>
              <div>
                <p className="font-semibold text-xs text-white">Português 🇵🇹</p>
                <p className="text-[11px] text-stone-400">Interface e respostas em português</p>
              </div>
            </div>
            {selectedLang === 'pt' && (
              <span className="w-3 h-3 rounded-full bg-rose-400 shrink-0 ml-2" />
            )}
          </button>

          {/* 6. Latina (Classica) */}
          <button
            type="button"
            onClick={() => setSelectedLang('la')}
            className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
              selectedLang === 'la'
                ? 'border-amber-500 bg-amber-950/40 shadow-xs'
                : 'border-purple-900/40 bg-[#1b0d2b] hover:bg-purple-950/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏛️</span>
              <div>
                <p className="font-semibold text-xs text-amber-200">Latina (Classica) 🏛️</p>
                <p className="text-[11px] text-stone-400">Sapientia & oratio scripta classica</p>
              </div>
            </div>
            {selectedLang === 'la' && (
              <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0 ml-2" />
            )}
          </button>
        </div>

        {/* Note informative pour le Latin si sélectionné ou affichée discrètement */}
        {selectedLang === 'la' && (
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-600/30 flex items-start gap-3 text-xs text-amber-200/90 leading-relaxed">
            <span className="text-base shrink-0">🏛️</span>
            <div>
              <p className="font-medium text-amber-300 mb-0.5">Particularités de la langue latine :</p>
              <p>
                Le latin est une langue écrite d’une grande profondeur philosophique (stoïcisme, bienveillance et maîtrise de soi). 
                La reconnaissance vocale directe du navigateur n’est pas disponible pour le latin classique, mais vous pouvez enregistrer une note vocale audio ou dialoguer par écrit en toute fluidité.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Voice selection */}
      <div className="p-6 rounded-3xl bg-[#140a20] border border-purple-900/40 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-purple-900/40">
          <Volume2 className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-white text-base">
            {t('settings.voiceSection')}
          </h3>
        </div>

        <p className="text-xs text-stone-400">
          {t('settings.voiceDesc')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: 'Kore',
              name: 'Kore',
              desc: selectedLang === 'en' ? 'Warm, enveloping and gentle' : 'Chaleureuse, enveloppante et douce',
            },
            {
              id: 'Puck',
              name: 'Puck',
              desc: selectedLang === 'en' ? 'Calm, clear and reassuring' : 'Calme, claire et rassurante',
            },
            {
              id: 'Zephyr',
              name: 'Zephyr',
              desc: selectedLang === 'en' ? 'Steady, poised and meditative' : 'Posée, apaisante et méditative',
            },
          ].map((v) => (
            <div
              key={v.id}
              onClick={() => setSelectedVoice(v.id)}
              className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                selectedVoice === v.id
                  ? 'border-purple-500 bg-purple-950/60 shadow-xs'
                  : 'border-purple-900/40 bg-[#1b0d2b] hover:bg-purple-950/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-white">{v.name}</span>
                  {selectedVoice === v.id && (
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                  )}
                </div>
                <p className="text-[11px] text-stone-400">{v.desc}</p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleVoiceTest(v.id);
                }}
                disabled={testingVoice}
                className="mt-3 px-2 py-1 rounded-lg bg-[#25133c] border border-purple-700/50 text-[11px] text-rose-300 font-medium flex items-center gap-1 hover:bg-[#301a4e]"
              >
                <Play className="w-3 h-3 text-rose-400 fill-rose-400" />
                <span>{t('settings.testVoice')}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Gentle Reminders */}
      <div className="p-6 rounded-3xl bg-[#140a20] border border-purple-900/40 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-purple-900/40">
          <Bell className="w-5 h-5 text-rose-400" />
          <h3 className="font-semibold text-white text-base">
            {t('settings.remindersSection')}
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1b0d2b] border border-purple-900/30">
            <div>
              <p className="text-xs font-semibold text-white">
                {t('settings.eveningPause')}
              </p>
              <p className="text-[11px] text-stone-400">
                {t('settings.eveningDesc')}
              </p>
            </div>
            <input
              type="checkbox"
              checked={dailyReminder}
              onChange={(e) => setDailyReminder(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded-sm border-purple-700 bg-purple-950"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1b0d2b] border border-purple-900/30">
            <div>
              <p className="text-xs font-semibold text-white">
                {t('settings.gratitudeRitual')}
              </p>
              <p className="text-[11px] text-stone-400">
                {t('settings.gratitudeDesc')}
              </p>
            </div>
            <input
              type="checkbox"
              checked={coupleRitual}
              onChange={(e) => setCoupleRitual(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded-sm border-purple-700 bg-purple-950"
            />
          </div>
        </div>
      </div>

      {/* Android Native Architecture Information */}
      <div className="p-6 rounded-3xl bg-[#140a20] border border-purple-900/40 shadow-xl space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-purple-900/40">
          <Smartphone className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-white text-base">
            {t('settings.androidSection')}
          </h3>
        </div>

        <p className="text-xs text-stone-300 leading-relaxed">
          {t('settings.androidDesc')}
        </p>

        <div className="p-3 rounded-xl bg-[#1b0d2b] text-[11px] text-stone-400 border border-purple-800/40">
          <span className="font-semibold text-rose-300">
            {selectedLang === 'en' ? 'Android Ready:' : 'Prêt pour Android :'}
          </span>{' '}
          {selectedLang === 'en'
            ? 'Client-side security compliant, thumb-friendly navigation, notifications support, bilingual resource files ready for strings.xml.'
            : 'Sécurité client-side conforme, ergonomie adaptée aux pouces, support des notifications et dictionnaires prêts pour strings.xml.'}
        </div>
      </div>

      {/* AI Oversight & Sovereign Lab Access */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#170a24] to-[#12081d] border border-rose-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-rose-400" />
            <h3 className="font-semibold text-white text-base">
              {selectedLang === 'en' ? 'AI Governance & Autonomous Lab' : 'Supervision & Gouvernance IA'}
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-semibold uppercase">
            Lab
          </span>
        </div>

        <p className="text-xs text-stone-300 leading-relaxed">
          {selectedLang === 'en'
            ? 'Monitor model latencies, test backup providers, browse the curated clinical knowledge base, and manage behavioral rule versioning.'
            : 'Surveillez les latences des modèles, testez les fournisseurs de secours, explorez la base de connaissances cliniques et gérez les versions de règles.'}
        </p>

        <button
          type="button"
          onClick={() => onNavigate('admin')}
          className="px-4 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700/50 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <span>{selectedLang === 'en' ? 'Open AI Oversight Dashboard →' : 'Ouvrir le Tableau de Bord IA →'}</span>
        </button>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-2">
        {saveSuccess ? (
          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
            <Check className="w-4 h-4" />
            {t('common.saved')}
          </span>
        ) : (
          <span className="text-xs text-stone-500">
            {selectedLang === 'en'
              ? 'Changes apply instantly across all screens and AI prompts.'
              : 'Les réglages s’appliquent immédiatement à vos conversations.'}
          </span>
        )}

        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-purple-700 hover:opacity-95 text-white font-medium text-xs shadow-md transition-all"
        >
          {t('settings.saveSettings')}
        </button>
      </div>
    </div>
  );
};
