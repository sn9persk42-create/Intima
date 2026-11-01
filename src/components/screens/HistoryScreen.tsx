import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { chatService } from '../../services/chatService';
import { Conversation, RelationshipTopic, ScreenType } from '../../types';
import {
  History as HistoryIcon,
  Search,
  Pin,
  Trash2,
  MessageCircle,
  Clock,
  Filter,
  ArrowRight,
} from 'lucide-react';

interface HistoryScreenProps {
  onNavigate: (screen: ScreenType) => void;
  onOpenConversation: (conv: Conversation) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onNavigate,
  onOpenConversation,
}) => {
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = chatService.subscribeConversations(currentUser.uid, (list) => {
      setConversations(list);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.lastMessageSnippet &&
        conv.lastMessageSnippet.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTopic = filterTopic === 'all' || conv.topic === filterTopic;
    return matchesSearch && matchesTopic;
  });

  const handleTogglePin = async (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    await chatService.togglePin(conv.id, !!conv.pinned);
  };

  const handleDelete = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    await chatService.deleteConversation(convId);
    setDeleteConfirmId(null);
  };

  const getTopicBadge = (topic: RelationshipTopic) => {
    switch (topic) {
      case 'conflict_resolution':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-950/60 text-rose-300 border border-rose-800/40">{t('history.conflicts')}</span>;
      case 'intimacy_rekindling':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-950/60 text-purple-300 border border-purple-800/40">{t('history.intimacy')}</span>;
      case 'dating_advice':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800/40">{t('history.dating')}</span>;
      case 'communication':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-950/60 text-blue-300 border border-blue-800/40">{t('history.cnv')}</span>;
      case 'breakup_healing':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-900 text-stone-300 border border-stone-700/50">{language === 'en' ? 'Breakup' : 'Rupture'}</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-900/40 text-purple-200 border border-purple-800/40">{language === 'en' ? 'General' : 'Écoute'}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0714] py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-stone-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-semibold uppercase tracking-wider mb-1">
            <HistoryIcon className="w-4 h-4 text-rose-500" />
            <span>{language === 'en' ? 'Relational Memory' : 'Mémoire Relationnelle'}</span>
          </div>
          <h1 className="font-serif text-3xl text-white font-normal">
            {t('history.title')}
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            {t('history.subtitle')}
          </p>
        </div>

        <button
          onClick={() => onNavigate('chat')}
          className="self-start sm:self-auto px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-purple-700 text-white font-medium text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{t('chat.newChat')}</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#140a20] p-4 rounded-2xl border border-purple-900/40 shadow-xs mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('history.searchPlaceholder')}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0e0717] border border-purple-800/40 text-xs text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-rose-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-stone-500 shrink-0" />
          <span className="text-[11px] text-stone-500 shrink-0">{t('history.filter')}</span>
          {[
            { id: 'all', label: t('history.all') },
            { id: 'conflict_resolution', label: t('history.conflicts') },
            { id: 'communication', label: t('history.cnv') },
            { id: 'intimacy_rekindling', label: t('history.intimacy') },
            { id: 'dating_advice', label: t('history.dating') },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterTopic(item.id)}
              className={`px-3 py-1 rounded-full text-xs transition-all shrink-0 ${
                filterTopic === item.id
                  ? 'bg-gradient-to-r from-rose-500 to-purple-700 text-white font-medium shadow-xs'
                  : 'bg-[#1b0d2b] text-stone-400 hover:text-white border border-purple-900/40'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Cards List */}
      {filteredConversations.length === 0 ? (
        <div className="bg-[#140a20] rounded-3xl p-12 text-center border border-purple-900/40 shadow-xs max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-950/60 border border-purple-800/40 text-rose-400 flex items-center justify-center mx-auto">
            <HistoryIcon className="w-7 h-7" />
          </div>
          <h3 className="font-serif text-xl text-white">
            {t('history.emptySearch')}
          </h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
            {conversations.length === 0
              ? t('history.emptyDesc')
              : language === 'en'
              ? 'No conversation matches your search criteria.'
              : 'Aucune conversation ne correspond à vos critères de recherche.'}
          </p>
          <button
            onClick={() => onNavigate('chat')}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-purple-700 hover:opacity-95 text-white text-xs font-semibold shadow-xs"
          >
            {t('history.startChat')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onOpenConversation(conv)}
              className="group p-4 sm:p-5 rounded-2xl bg-[#140a20] border border-purple-900/40 hover:border-rose-400/50 hover:bg-[#180d28] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {conv.pinned && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-700/50">
                      ★ {t('history.pinned')}
                    </span>
                  )}
                  {getTopicBadge(conv.topic)}
                  <h3 className="font-semibold text-sm sm:text-base text-white group-hover:text-rose-300 transition-colors">
                    {conv.title}
                  </h3>
                </div>

                {conv.lastMessageSnippet && (
                  <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
                    « {conv.lastMessageSnippet} »
                  </p>
                )}

                <div className="flex items-center gap-4 text-[11px] text-stone-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(conv.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span>ID : {conv.id.slice(0, 10)}...</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={(e) => handleTogglePin(e, conv)}
                  title={conv.pinned ? (language === 'en' ? 'Unpin' : 'Détacher') : (language === 'en' ? 'Pin' : 'Épingler')}
                  className={`p-2 rounded-xl transition-colors ${
                    conv.pinned
                      ? 'text-amber-400 bg-amber-950/50'
                      : 'text-stone-500 hover:text-amber-400 hover:bg-purple-950/50'
                  }`}
                >
                  <Pin className="w-4 h-4" />
                </button>

                {deleteConfirmId === conv.id ? (
                  <div className="flex items-center gap-1 bg-rose-950/60 border border-rose-800/40 p-1 rounded-xl">
                    <button
                      onClick={(e) => handleDelete(e, conv.id)}
                      className="px-2 py-1 bg-rose-600 text-white text-[11px] font-bold rounded-lg hover:bg-rose-700"
                    >
                      {t('history.confirm')}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(null);
                      }}
                      className="px-2 py-1 text-stone-400 text-[11px] hover:text-white"
                    >
                      {t('history.cancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(conv.id);
                    }}
                    title={language === 'en' ? 'Delete conversation' : 'Supprimer la conversation'}
                    className="p-2 text-stone-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="p-2 text-stone-600 group-hover:text-rose-400 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
