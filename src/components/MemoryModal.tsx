import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MemoryItem } from '../types';
import {
  Brain,
  Plus,
  Trash2,
  X,
  ShieldCheck,
  Heart,
  MessageSquareHeart,
  Sparkles,
  AlertCircle,
  Tag,
} from 'lucide-react';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, updateUserProfile } = useAuth();
  const { t, language } = useLanguage();
  const [newText, setNewText] = useState('');
  const [category, setCategory] = useState<'partner' | 'communication' | 'boundary' | 'milestone' | 'general'>('partner');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const memories = userProfile?.memories || [];

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || loading) return;

    setLoading(true);
    try {
      const newItem: MemoryItem = {
        id: 'mem_' + Date.now(),
        text: newText.trim(),
        category,
        createdAt: new Date().toISOString(),
      };

      const updated = [newItem, ...memories];
      await updateUserProfile({ memories: updated });
      setNewText('');
    } catch (err) {
      console.error('Erreur ajout mémoire:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      const updated = memories.filter((m) => m.id !== id);
      await updateUserProfile({ memories: updated });
    } catch (err) {
      console.error('Erreur suppression mémoire:', err);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm(t('memory.clearAllConfirm'))) {
      try {
        await updateUserProfile({ memories: [] });
      } catch (err) {
        console.error('Erreur purge mémoire:', err);
      }
    }
  };

  const getCategoryLabel = (cat?: string) => {
    switch (cat) {
      case 'partner':
        return t('memory.catPartner');
      case 'communication':
        return t('memory.catCommunication');
      case 'boundary':
        return t('memory.catBoundary');
      case 'milestone':
        return t('memory.catMilestone');
      default:
        return t('memory.catGeneral');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#140a20] border border-purple-500/25 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in text-stone-100">
        {/* Header */}
        <div className="p-5 border-b border-purple-900/40 flex items-center justify-between shrink-0 bg-[#170c26]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-800 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-950/40">
              <Brain className="w-5 h-5 text-rose-200" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-medium text-white flex items-center gap-2">
                {t('memory.title')}
                <span className="text-[11px] font-sans px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-700/40">
                  {memories.length}
                </span>
              </h2>
              <p className="text-[11px] text-stone-400">
                {t('memory.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-purple-900/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Add Form */}
          <form onSubmit={handleAddMemory} className="p-3.5 rounded-2xl bg-[#1c0f2f] border border-purple-800/40 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-purple-200 font-medium">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                {t('memory.addBtn')}
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="bg-[#24133d] text-stone-200 text-[11px] rounded-lg px-2 py-1 border border-purple-700/50 focus:outline-hidden"
              >
                <option value="partner">{t('memory.catPartner')}</option>
                <option value="communication">{t('memory.catCommunication')}</option>
                <option value="boundary">{t('memory.catBoundary')}</option>
                <option value="milestone">{t('memory.catMilestone')}</option>
                <option value="general">{t('memory.catGeneral')}</option>
              </select>
            </div>

            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder={t('memory.addPlaceholder')}
              rows={2}
              className="w-full text-xs p-3 rounded-xl bg-[#140a20] border border-purple-900/60 text-white placeholder-stone-500 focus:outline-hidden focus:border-rose-400 resize-none"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newText.trim() || loading}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-700 hover:opacity-95 disabled:opacity-40 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('memory.addBtn')}</span>
              </button>
            </div>
          </form>

          {/* List of existing memories */}
          {memories.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-2 border border-dashed border-purple-900/40 rounded-2xl bg-purple-950/10">
              <Brain className="w-8 h-8 text-purple-400/50 mx-auto" />
              <p className="text-xs text-stone-300 font-medium">
                {t('memory.empty')}
              </p>
              <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
                {t('memory.emptySub')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {memories.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-[#1a0e2b] border border-purple-900/30 hover:border-purple-700/50 transition-all flex items-start justify-between gap-3 group"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-purple-900/50 text-rose-300 border border-purple-700/30">
                        {getCategoryLabel(m.category)}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        {new Date(m.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR')}
                      </span>
                    </div>
                    <p className="text-xs text-stone-200 leading-relaxed">
                      {m.text}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteMemory(m.id)}
                    title={t('memory.deleteConfirm')}
                    className="p-1.5 text-stone-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Privacy Note */}
          <div className="flex items-center gap-2 text-[11px] text-stone-400 p-3 rounded-xl bg-purple-950/30 border border-purple-900/30">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{t('memory.privacyNote')}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-purple-900/40 flex items-center justify-between shrink-0 bg-[#170c26]">
          {memories.length > 0 ? (
            <button
              onClick={handleClearAll}
              className="text-xs text-rose-400/80 hover:text-rose-300 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('memory.clearAll')}</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-stone-800 hover:bg-stone-700 text-white text-xs font-medium"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
