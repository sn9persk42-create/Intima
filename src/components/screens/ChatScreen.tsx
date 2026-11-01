import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { chatService } from '../../services/chatService';
import { Conversation, Message, RelationshipTopic, Attachment, ScreenType, Language } from '../../types';
import { IntimaLogo } from '../IntimaLogo';
import { ChatHeader } from '../ChatHeader';
import {
  Send,
  Plus,
  Paperclip,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  Share2,
  RefreshCw,
  Heart,
  HelpCircle,
  CheckCircle2,
  X,
  FileText,
  ShieldCheck,
  MoreHorizontal,
  Flag,
  Download,
  Trash2,
  AlertTriangle,
  Mic,
  MicOff,
  Sparkles,
  ArrowUp,
  CornerDownRight,
  BookOpen,
  GraduationCap,
  Quote,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Music,
  Square,
  Play,
  Pause,
  Loader2,
} from 'lucide-react';

interface ChatScreenProps {
  initialPrompt?: string;
  initialTopic?: RelationshipTopic;
  selectedConversationId?: string | null;
  onSelectConversationId?: (id: string | null) => void;
  onNavigate: (screen: ScreenType) => void;
  onOpenMemory: () => void;
}

// Resilient message merger: preserves in-flight and local messages without duplicate IDs
const mergeMessages = (existing: Message[], incoming: Message[]): Message[] => {
  const map = new Map<string, Message>();
  for (const m of existing) {
    if (m && m.id) map.set(m.id, m);
  }
  for (const m of incoming) {
    if (m && m.id) {
      const prev = map.get(m.id);
      map.set(m.id, {
        ...prev,
        ...m,
        status: m.status || (prev?.status === 'error' ? 'error' : 'sent'),
      });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
};

export const ChatScreen: React.FC<ChatScreenProps> = ({
  initialPrompt,
  initialTopic = 'general',
  selectedConversationId,
  onSelectConversationId,
  onNavigate,
  onOpenMemory,
}) => {
  const { currentUser, userProfile, signInAsGuest } = useAuth();
  const { t, language } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingReply, setLoadingReply] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [shareModalMessage, setShareModalMessage] = useState<Message | null>(null);

  // Voice speech-to-text dictation & Audio Recording states
  type MicStatus = 'idle' | 'listening' | 'processing' | 'error' | 'denied' | 'unsupported' | 'recording_audio';
  const [micStatus, setMicStatus] = useState<MicStatus>('idle');
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [isReadingFiles, setIsReadingFiles] = useState<boolean>(false);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);
  const [playingUserAudioUrl, setPlayingUserAudioUrl] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const userAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Backward compatibility convenience for UI rendering
  const isListeningMic = micStatus === 'listening' || micStatus === 'recording_audio';

  // Action bar & feedback states
  const [dislikeModalMessage, setDislikeModalMessage] = useState<Message | null>(null);
  const [selectedDislikeReason, setSelectedDislikeReason] = useState<string>('');
  const [dislikeReasonText, setDislikeReasonText] = useState<string>('');
  const [reportModalMessage, setReportModalMessage] = useState<Message | null>(null);
  const [reportReasonText, setReportReasonText] = useState<string>('');
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);
  const [confirmDeleteMsg, setConfirmDeleteMsg] = useState<Message | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [expandedSourcesMsgId, setExpandedSourcesMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const showToast = (message: string) => {
    setFeedbackToast(message);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 3000);
  };

  // Close popup menu on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.msg-action-menu-container')) {
        setActiveMenuMsgId(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingReply]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [inputText]);

  // Sync selectedConversationId from props
  useEffect(() => {
    if (!selectedConversationId) return;
    if (activeConversation?.id === selectedConversationId) return;

    const found = conversations.find((c) => c.id === selectedConversationId);
    if (found) {
      setActiveConversation(found);
    } else {
      const placeholder: Conversation = {
        id: selectedConversationId,
        userId: currentUser?.uid || localStorage.getItem('intima_guest_uid') || 'guest',
        title: language === 'en' ? 'Conversation' : 'Échange',
        topic: 'general',
        messageCount: 0,
        createdAt: new Date().toISOString(),
      };
      setActiveConversation(placeholder);
    }
  }, [selectedConversationId, conversations]);

  // Subscribe to user conversations with safe hydration
  useEffect(() => {
    const uid = currentUser?.uid;
    if (!uid) {
      const guestKey = 'intima_convs_guest';
      try {
        const raw = localStorage.getItem(guestKey);
        if (raw) {
          const list: Conversation[] = JSON.parse(raw);
          setConversations(list);
          if (!activeConversation && list.length > 0 && !selectedConversationId) {
            setActiveConversation(list[0]);
            onSelectConversationId?.(list[0].id);
          }
        }
      } catch {
        // ignore
      }
      return;
    }

    const unsubscribe = chatService.subscribeConversations(uid, (list) => {
      setConversations(list);
      setActiveConversation((current) => {
        if (!current && list.length > 0) {
          const toSelect = selectedConversationId
            ? list.find((c) => c.id === selectedConversationId) || list[0]
            : list[0];
          onSelectConversationId?.(toSelect.id);
          return toSelect;
        }
        return current;
      });
    });

    return () => unsubscribe();
  }, [currentUser, selectedConversationId]);

  // Subscribe to messages of active conversation without wiping in-flight messages
  useEffect(() => {
    if (!activeConversation) return;

    const convId = activeConversation.id;

    // 1. Instant local hydration from cache
    try {
      const raw = localStorage.getItem(`intima_msgs_${convId}`);
      if (raw) {
        const cached: Message[] = JSON.parse(raw);
        if (Array.isArray(cached) && cached.length > 0) {
          setMessages((prev) => mergeMessages(prev, cached));
        }
      }
    } catch {
      // ignore
    }

    // 2. Real-time Firestore synchronization
    const unsubscribe = chatService.subscribeMessages(convId, (incomingList) => {
      if (incomingList && incomingList.length > 0) {
        setMessages((prev) => mergeMessages(prev, incomingList));
      }
    });

    return () => unsubscribe();
  }, [activeConversation?.id]);

  // Automatically sync state to localStorage whenever messages change
  useEffect(() => {
    if (activeConversation?.id && messages.length > 0) {
      try {
        localStorage.setItem(`intima_msgs_${activeConversation.id}`, JSON.stringify(messages));
      } catch {
        // ignore
      }
    }
  }, [messages, activeConversation?.id]);

  // Handle initial prompt from props
  useEffect(() => {
    if (initialPrompt && currentUser) {
      handleCreateNewChat(initialTopic, initialPrompt);
    }
  }, [initialPrompt]);

  // Start a new conversation
  const handleCreateNewChat = async (topic: RelationshipTopic = 'general', firstPrompt?: string) => {
    let uid = currentUser?.uid;
    if (!uid) {
      try {
        await signInAsGuest();
        uid = currentUser?.uid;
      } catch {
        // Guest mode fallback
      }
    }
    if (!uid) {
      uid = localStorage.getItem('intima_guest_uid') || ('guest_' + Date.now());
      localStorage.setItem('intima_guest_uid', uid);
    }

    const defaultTitle = language === 'en'
      ? (topic === 'conflict_resolution'
          ? 'De-escalating a tension'
          : topic === 'dating_advice'
          ? 'Dating & Advice'
          : topic === 'intimacy_rekindling'
          ? 'Rekindling intimacy'
          : topic === 'breakup_healing'
          ? 'Healing after a breakup'
          : 'Conversation with INTIMA')
      : (topic === 'conflict_resolution'
          ? 'Désamorcer une tension'
          : topic === 'dating_advice'
          ? 'Conseils & Rencontres'
          : topic === 'intimacy_rekindling'
          ? 'Retrouver la complicité'
          : topic === 'breakup_healing'
          ? 'Apaiser une rupture'
          : 'Échange avec INTIMA');

    const newConv = await chatService.createConversation(uid, defaultTitle, topic);
    setActiveConversation(newConv);
    onSelectConversationId?.(newConv.id);

    if (firstPrompt) {
      await sendMessageDirect(newConv.id, firstPrompt);
    }
  };

  // Reset to new clean chat view
  const handleResetToNewChat = () => {
    setActiveConversation(null);
    onSelectConversationId?.(null);
    setMessages([]);
    setInputText('');
  };

  // Helper to format bytes to human-readable size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  // Helper to format duration in seconds to MM:SS
  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Start native audio recording via MediaRecorder as audio note fallback
  const startAudioRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicStatus('unsupported');
      showToast(t('chat.micUnsupported'));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/ogg';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size > 0) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
            const audioAttachment: Attachment = {
              name: `${t('chat.voiceNote')} ${new Date().toLocaleTimeString().slice(0, 5)}.${ext}`,
              size: audioBlob.size,
              type: mimeType,
              previewUrl: URL.createObjectURL(audioBlob),
              dataUrl,
            };
            setAttachments((prev) => [...prev, audioAttachment]);
            showToast(t('chat.micAudioAttached'));
          };
          reader.readAsDataURL(audioBlob);
        }

        // Release stream tracks
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setRecordingDuration(0);
        setMicStatus('idle');
      };

      mediaRecorder.start(250);
      setMicStatus('recording_audio');
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Audio recording start error:', err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setMicStatus('denied');
        showToast(t('chat.micPermissionDenied'));
      } else {
        setMicStatus('error');
        showToast(t('chat.micError'));
      }
    }
  };

  // Stop active audio recording
  const stopAudioRecording = (cancel: boolean = false) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (cancel) {
        audioChunksRef.current = [];
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setRecordingDuration(0);
        setMicStatus('idle');
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      } else {
        setMicStatus('processing');
        mediaRecorderRef.current.stop();
      }
    }
  };

  // Robust Speech-to-Text & Audio Recording Handler
  const handleToggleMic = async () => {
    // 1. If currently listening, stop dictation cleanly
    if (micStatus === 'listening') {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        console.warn('Error stopping speech recognition:', e);
      }
      setMicStatus('idle');
      showToast(t('chat.micStopped'));
      return;
    }

    // 2. If currently recording an audio memo, stop and attach
    if (micStatus === 'recording_audio') {
      stopAudioRecording(false);
      return;
    }

    // 3. Check Web Speech Recognition API
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        // Request microphone permission explicitly first for Android & desktop compatibility
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            tempStream.getTracks().forEach((track) => track.stop());
          } catch (permErr: any) {
            console.warn('Microphone permission check returned error:', permErr);
            if (permErr?.name === 'NotAllowedError' || permErr?.name === 'PermissionDeniedError') {
              setMicStatus('denied');
              showToast(t('chat.micPermissionDenied'));
              return;
            }
          }
        }

        if (language === 'la') {
          // Web Speech API does not support Latin. Seamlessly activate audio memo recording!
          showToast(t('chat.micUnsupported'));
          await startAudioRecording();
          return;
        }

        const recognition = new SpeechRec();
        const speechLangMap: Record<Language, string> = {
          fr: 'fr-FR',
          en: 'en-US',
          de: 'de-DE',
          es: 'es-ES',
          pt: 'pt-BR',
          la: 'fr-FR', // Fallback, not reached due to above check
        };
        recognition.lang = speechLangMap[language] || 'fr-FR';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        const baseInputText = inputText ? (inputText.endsWith(' ') ? inputText : inputText + ' ') : '';
        let localTranscript = '';

        recognition.onstart = () => {
          setMicStatus('listening');
          showToast(t('chat.micListening'));
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const piece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += piece;
            } else {
              interimTranscript += piece;
            }
          }
          if (finalTranscript) {
            localTranscript += finalTranscript + ' ';
            setInputText(baseInputText + localTranscript);
          } else if (interimTranscript) {
            setInputText(baseInputText + localTranscript + interimTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            setMicStatus('denied');
            showToast(t('chat.micPermissionDenied'));
          } else if (event.error === 'no-speech') {
            setMicStatus('idle');
          } else {
            setMicStatus('error');
            showToast(t('chat.micError'));
          }
        };

        recognition.onend = () => {
          setMicStatus((prev) => (prev === 'listening' ? 'idle' : prev));
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn('Speech recognition initialization failed, switching to audio note recorder:', err);
        startAudioRecording();
      }
    } else {
      // Browser does not support Web Speech Recognition (e.g. Firefox Android / WebView)
      // Provide audio note recording fallback
      showToast(t('chat.micUnsupported'));
      startAudioRecording();
    }
  };

  // Send message implementation with attachments, multimodal data, optimistic updates, and persistent storage
  const sendMessageDirect = async (convId: string, text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText && attachments.length === 0) return;

    let uid = currentUser?.uid;
    if (!uid) {
      uid = localStorage.getItem('intima_guest_uid') || ('guest_' + Date.now());
      localStorage.setItem('intima_guest_uid', uid);
    }

    const currentAttachments = [...attachments];
    const defaultAttachmentPrompt = language === 'en'
      ? "I have shared an attachment with you. Please review and analyze it with care."
      : "Je te partage cette pièce jointe. Peux-tu l'examiner et me donner ton regard bienveillant ?";

    const messageContent = trimmedText || defaultAttachmentPrompt;

    const userMsgId = 'msg_u_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const userMessage: Message = {
      id: userMsgId,
      conversationId: convId,
      userId: uid,
      sender: 'user',
      content: messageContent,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      status: 'sending',
      createdAt: new Date().toISOString(),
    };

    // Optimistically add user message and persist locally
    setMessages((prev) => mergeMessages(prev, [userMessage]));
    setInputText('');
    setAttachments([]);
    setLoadingReply(true);

    // Save user message to database (strip heavy dataUrl to stay safely under Firestore 1MB document limit)
    try {
      const sanitizedUserMsg: Message = {
        ...userMessage,
        attachments: userMessage.attachments?.map((a) => ({
          name: a.name,
          size: a.size,
          type: a.type,
          previewUrl: a.previewUrl,
        })),
      };
      await chatService.saveMessage(sanitizedUserMsg);
      setMessages((prev) =>
        prev.map((m) => (m.id === userMsgId ? { ...m, status: 'sent' } : m))
      );
    } catch (saveErr) {
      console.warn('Sauvegarde message utilisateur en mode local/hors-ligne:', saveErr);
      setMessages((prev) =>
        prev.map((m) => (m.id === userMsgId ? { ...m, status: 'error' } : m))
      );
    }

    try {
      // Build conversation history including the new user message WITH full attachments payload
      const conversationHistory = [...messages, userMessage].map((m) => ({
        role: m.sender as 'user' | 'assistant',
        content: m.content,
        attachments: m.id === userMsgId && currentAttachments.length > 0
          ? currentAttachments.map((a) => ({
              name: a.name,
              type: a.type,
              size: a.size,
              dataUrl: a.dataUrl,
            }))
          : m.attachments?.map((a) => ({
              name: a.name,
              type: a.type,
              size: a.size,
              dataUrl: a.dataUrl,
            })),
      }));

      const memoryStrings = userProfile?.memories?.map((m) => m.text) || [];

      // Call server-side Gemini
      const geminiResponse = await chatService.sendToGemini(conversationHistory, {
        relationshipStatus: userProfile?.relationshipStatus || (language === 'en' ? 'unspecified' : 'non précisé'),
        partnerName: userProfile?.partnerName,
        userName: userProfile?.displayName,
        topic: activeConversation?.topic || 'general',
        language: language,
        memories: memoryStrings,
      });

      // Construct AI message with unique ID
      const aiMsgId = 'msg_ai_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const aiMessage: Message = {
        id: aiMsgId,
        conversationId: convId,
        userId: uid,
        sender: 'assistant',
        content: geminiResponse.content,
        facts: geminiResponse.facts || undefined,
        hypotheses: geminiResponse.hypotheses || undefined,
        suggestedAction: geminiResponse.suggestedAction || undefined,
        sources: geminiResponse.sources || undefined,
        providerUsed: geminiResponse.providerUsed,
        modelUsed: geminiResponse.modelUsed,
        latencyMs: geminiResponse.latencyMs,
        qualityAssessment: geminiResponse.qualityAssessment,
        status: 'sending',
        createdAt: new Date().toISOString(),
      };

      // Add AI response to local state immediately
      setMessages((prev) => mergeMessages(prev, [aiMessage]));

      // Save AI message to database
      try {
        await chatService.saveMessage(aiMessage);
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, status: 'sent' } : m))
        );
      } catch (aiSaveErr) {
        console.warn('Sauvegarde réponse IA en local/hors-ligne:', aiSaveErr);
        // Retain message in state with error status, NEVER remove it!
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, status: 'error' } : m))
        );
      }
    } catch (err: any) {
      console.error('Erreur lors de l’envoi:', err);
      const fallbackMap: Record<Language, string> = {
        fr: "Je vous écoute de tout cœur. Un petit ralentissement réseau vient de se produire, mais je suis là avec vous. Pouvez-vous me répéter votre pensée ?",
        en: "I am listening with all my heart. A momentary network slowdown occurred, but I am right here with you. Could you share your thought once again?",
        de: "Ich höre Ihnen von ganzem Herzen zu. Es gab eine kurze Netzwerkverzögerung, aber ich bin hier an Ihrer Seite. Können Sie Ihre Gedanken noch einmal mitteilen?",
        es: "Te escucho con todo mi corazón. Hubo una breve demora de red, pero sigo aquí a tu lado. ¿Podrías compartirme nuevamente tu pensamiento?",
        pt: "Estou te ouvindo de todo coração. Ocorreu uma breve lentidão de rede, mas permaneço aqui ao seu lado. Poderia compartilhar seu pensamento mais uma vez?",
        la: "Ex toto corde te audio. Parva mora accidit, sed tecum maneo. Potesne sententiam tuam iterum exponere?",
      };
      const fallbackAiMsg: Message = {
        id: 'msg_err_' + Date.now(),
        conversationId: convId,
        userId: uid,
        sender: 'assistant',
        content: fallbackMap[language] || fallbackMap.fr,
        status: 'error',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => mergeMessages(prev, [fallbackAiMsg]));
    } finally {
      setLoadingReply(false);
    }
  };

  // Retry sending or saving a message
  const handleRetryMessage = async (msg: Message) => {
    if (!activeConversation) return;

    if (msg.sender === 'user') {
      try {
        await chatService.saveMessage(msg);
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, status: 'sent' } : m))
        );
        showToast(language === 'en' ? 'Message saved successfully' : 'Message synchronisé');
      } catch {
        showToast(language === 'en' ? 'Retry failed' : 'Échec de synchronisation');
      }
    } else {
      try {
        await chatService.saveMessage(msg);
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, status: 'sent' } : m))
        );
        showToast(language === 'en' ? 'Response synchronized' : 'Réponse synchronisée');
      } catch {
        // If error persists, trigger regeneration
        const idx = messages.findIndex((m) => m.id === msg.id);
        if (idx >= 0) {
          handleRegenerate(idx);
        }
      }
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && attachments.length === 0) return;

    if (!activeConversation) {
      await handleCreateNewChat('general', inputText);
    } else {
      await sendMessageDirect(activeConversation.id, inputText);
    }
  };

  // 1. Action: Copy text
  const handleCopy = (msg: Message) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedId(msg.id);
    showToast(t('chat.copied'));
    setTimeout(() => setCopiedId(null), 2500);
  };

  // 2. Action: Like
  const handleLike = async (msg: Message) => {
    if (!activeConversation) return;
    const isNowLiked = !msg.liked;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id ? { ...m, liked: isNowLiked, disliked: false, dislikeReason: undefined } : m
      )
    );
    await chatService.updateFeedback(activeConversation.id, msg.id, {
      liked: isNowLiked,
      disliked: false,
      dislikeReason: undefined,
    });
    if (isNowLiked) {
      showToast(t('chat.liked'));
    }
  };

  // 3. Action: Dislike
  const handleDislike = async (msg: Message) => {
    if (!activeConversation) return;
    if (msg.disliked) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, disliked: false, dislikeReason: undefined } : m
        )
      );
      await chatService.updateFeedback(activeConversation.id, msg.id, {
        disliked: false,
        dislikeReason: undefined,
      });
    } else {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, disliked: true, liked: false } : m
        )
      );
      await chatService.updateFeedback(activeConversation.id, msg.id, {
        disliked: true,
        liked: false,
      });
      setSelectedDislikeReason('');
      setDislikeReasonText('');
      setDislikeModalMessage(msg);
    }
  };

  const handleSubmitDislikeReason = async () => {
    if (!activeConversation || !dislikeModalMessage) return;
    const finalReason = [selectedDislikeReason, dislikeReasonText.trim()]
      .filter(Boolean)
      .join(' — ');

    setMessages((prev) =>
      prev.map((m) =>
        m.id === dislikeModalMessage.id ? { ...m, dislikeReason: finalReason } : m
      )
    );

    await chatService.updateFeedback(activeConversation.id, dislikeModalMessage.id, {
      disliked: true,
      dislikeReason: finalReason || undefined,
    });

    setDislikeModalMessage(null);
    showToast(t('chat.feedbackSent'));
  };

  // 4. Action: Read Aloud
  const handleReadAloud = async (msg: Message) => {
    if (playingAudioId === msg.id) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingAudioId(null);
      return;
    }

    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setPlayingAudioId(msg.id);

    try {
      const audioUrl = await chatService.synthesizeSpeech(
        msg.content,
        userProfile?.preferredVoice || 'Kore',
        language
      );
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;

      audio.onended = () => {
        setPlayingAudioId(null);
      };
      audio.onerror = () => {
        fallbackWebSpeech(msg.content, msg.id);
      };

      await audio.play();
    } catch {
      fallbackWebSpeech(msg.content, msg.id);
    }
  };

  const fallbackWebSpeech = (text: string, msgId: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 500));
      utterance.lang = language === 'en' ? 'en-US' : 'fr-FR';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setPlayingAudioId(null);
      utterance.onerror = () => setPlayingAudioId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingAudioId(null);
    }
  };

  // 5. Action: Share
  const handleShare = (msg: Message) => {
    const shareTitle = language === 'en' ? 'INTIMA Caring Advice' : 'Conseil bienveillant INTIMA';
    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: `« ${msg.content.slice(0, 280)}... » — INTIMA`,
        url: window.location.href,
      }).catch(() => {
        setShareModalMessage(msg);
      });
    } else {
      setShareModalMessage(msg);
    }
  };

  // 6. Action: Regenerate (without deleting previous message from history)
  const handleRegenerate = async (msgIndex: number) => {
    if (!activeConversation || loadingReply) return;

    const priorUserMsg = messages
      .slice(0, msgIndex)
      .reverse()
      .find((m) => m.sender === 'user');

    if (!priorUserMsg) return;

    setLoadingReply(true);
    try {
      const historyUntilPrompt = messages.slice(0, msgIndex).map((m) => ({
        role: m.sender as 'user' | 'assistant',
        content: m.content,
      }));

      const regenPrompt = language === 'en'
        ? "Could you formulate another complementary perspective, deepening Non-Violent Communication and emotional clarity?"
        : "Peux-tu me proposer un autre regard complémentaire, en approfondissant la Communication Non-Violente et la douceur émotionnelle ?";

      historyUntilPrompt.push({
        role: 'user',
        content: regenPrompt,
      });

      const response = await chatService.sendToGemini(historyUntilPrompt, {
        relationshipStatus: userProfile?.relationshipStatus,
        partnerName: userProfile?.partnerName,
        userName: userProfile?.displayName,
        topic: activeConversation.topic,
        language: language,
        memories: userProfile?.memories?.map((m) => m.text),
      });

      const newAiMsg: Message = {
        id: 'msg_regen_' + Date.now(),
        conversationId: activeConversation.id,
        userId: currentUser?.uid || '',
        sender: 'assistant',
        content: response.content,
        facts: response.facts,
        hypotheses: response.hypotheses,
        suggestedAction: response.suggestedAction,
        sources: response.sources || undefined,
        providerUsed: response.providerUsed,
        modelUsed: response.modelUsed,
        latencyMs: response.latencyMs,
        qualityAssessment: response.qualityAssessment,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newAiMsg]);
      await chatService.saveMessage(newAiMsg);
    } catch (err) {
      console.error('Erreur régénération:', err);
    } finally {
      setLoadingReply(false);
    }
  };

  // 7. Action: Export Advice (.txt)
  const handleExportAdvice = (msg: Message) => {
    const headerTitle = language === 'en' ? 'INTIMA • EMOTIONAL CLARITY & ADVICE' : 'INTIMA • CONSEIL ET CLARTÉ ÉMOTIONNELLE';
    const dateStr = new Date(msg.createdAt).toLocaleString(language === 'en' ? 'en-US' : 'fr-FR');
    const topicLabel = t(`chat.topics.${activeConversation?.topic || 'general'}`);

    let fileBody = `==========================================================\n`;
    fileBody += `${headerTitle}\n`;
    fileBody += `Date : ${dateStr}\n`;
    fileBody += `Thème : ${topicLabel}\n`;
    fileBody += `==========================================================\n\n`;
    fileBody += `${msg.content}\n\n`;

    if (msg.facts) {
      fileBody += `--- ${t('chat.factsObserved')} ---\n${msg.facts}\n\n`;
    }
    if (msg.hypotheses) {
      fileBody += `--- ${t('chat.hypothesesLabel')} ---\n${msg.hypotheses}\n\n`;
    }
    if (msg.suggestedAction) {
      fileBody += `--- ${t('chat.suggestedWords')} ---\n« ${msg.suggestedAction} »\n\n`;
    }

    fileBody += `==========================================================\n`;
    fileBody += `INTIMA • www.intima.app • Confidentialité absolue\n`;
    fileBody += `==========================================================\n`;

    const blob = new Blob([fileBody], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `intima-conseil-${Date.now().toString().slice(-6)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setActiveMenuMsgId(null);
    showToast(t('common.saved'));
  };

  // 8. Action: Report Message
  const handleReportMessage = (msg: Message) => {
    setActiveMenuMsgId(null);
    setReportReasonText('');
    setReportModalMessage(msg);
  };

  const handleSubmitReport = async () => {
    if (!activeConversation || !reportModalMessage) return;
    const reason = reportReasonText.trim() || (language === 'en' ? 'Content flagged by user' : 'Contenu signalé par l’utilisateur');

    setMessages((prev) =>
      prev.map((m) =>
        m.id === reportModalMessage.id ? { ...m, reported: true, reportReason: reason } : m
      )
    );

    await chatService.updateFeedback(activeConversation.id, reportModalMessage.id, {
      reported: true,
      reportReason: reason,
    });

    setReportModalMessage(null);
    showToast(t('chat.reported'));
  };

  // 9. Action: Delete single message
  const handleDeleteMessage = async () => {
    if (!activeConversation || !confirmDeleteMsg) return;
    const targetId = confirmDeleteMsg.id;
    setMessages((prev) => prev.filter((m) => m.id !== targetId));
    await chatService.deleteMessage(activeConversation.id, targetId);
    setConfirmDeleteMsg(null);
    showToast(t('common.delete'));
  };

  // Attachment upload handler supporting multiple files, images, audio, PDF, and text documents
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setIsReadingFiles(true);

    const allowedMimePrefixes = ['image/', 'audio/', 'application/pdf', 'text/'];

    for (const file of fileList) {
      // 10MB limit check
      if (file.size > 10 * 1024 * 1024) {
        showToast(t('chat.fileTooLarge'));
        continue;
      }

      const isAllowed =
        allowedMimePrefixes.some((pref) => file.type?.startsWith(pref)) ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.pdf') ||
        file.name.endsWith('.mp3') ||
        file.name.endsWith('.wav') ||
        file.name.endsWith('.m4a');

      if (!isAllowed) {
        showToast(t('chat.unsupportedFileType'));
        continue;
      }

      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const newAttachment: Attachment = {
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            previewUrl: file.type.startsWith('image/') || file.type.startsWith('audio/') ? URL.createObjectURL(file) : undefined,
            dataUrl,
          };
          setAttachments((prev) => [...prev, newAttachment]);
          resolve();
        };
        reader.onerror = () => {
          showToast(t('chat.micError'));
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }

    setIsReadingFiles(false);
    showToast(t('chat.fileAttached'));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Minimal suggestions for the empty landing state
  const minimalPrompts = [
    { label: t('chat.quickPrompt1'), text: language === 'en' ? "We just had an argument. How can I express my hurt feelings without triggering defensive behavior?" : "Nous venons d'avoir un accrochage. Comment exprimer mon ressenti sans déclencher de défensive ?" },
    { label: t('chat.quickPrompt2'), text: language === 'en' ? "My partner has become silent and emotionally distant. What is the kindest way to reach out?" : "Mon/ma partenaire s'est renfermé(e) dans le silence. Quelle est la manière la plus douce de renouer le dialogue ?" },
    { label: t('chat.quickPrompt3'), text: language === 'en' ? "I need to set an important boundary with someone I love without hurting them. Can you help me phrase it?" : "J'ai besoin de poser une limite importante envers quelqu'un que j'aime sans le blesser. Peux-tu m'aider à la formuler ?" },
    { label: t('chat.quickPrompt4'), text: language === 'en' ? "I feel insecure in my recent dating journey. How can I tell facts apart from my fear of rejection?" : "Je ressens des doutes dans mes rencontres actuelles. Comment séparer les faits de ma peur du rejet ?" },
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-[#0c0714] text-stone-100 overflow-hidden relative">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed top-16 right-4 sm:right-8 z-50 bg-[#1e0f2f] text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-rose-500/30 text-xs flex items-center gap-2 animate-fade-in backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Modern Compact Top Bar */}
      <ChatHeader
        onNewChat={handleResetToNewChat}
        onNavigate={onNavigate}
        onOpenMemory={onOpenMemory}
        conversations={conversations}
        activeConversationId={activeConversation?.id}
        onSelectConversation={(conv) => setActiveConversation(conv)}
      />

      {/* Main Conversation Stream Viewport */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 flex flex-col justify-between">
        <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col">
          {messages.length === 0 ? (
            /* Spacious Minimalist Welcome State (ChatGPT style) */
            <div className="my-auto py-8 sm:py-16 text-center space-y-6 animate-fade-in flex flex-col items-center justify-center">
              {/* Centered Logo with subtle warm halo */}
              <div className="relative inline-flex items-center justify-center">
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-rose-500/20 rounded-full blur-xl pointer-events-none" />
                <IntimaLogo size="md" />
              </div>

              {/* Warm Welcoming Headline requested by user */}
              <div className="space-y-2 max-w-lg mx-auto">
                <h1 className="font-serif text-2xl sm:text-3xl text-white font-normal leading-snug">
                  {t('chat.minimalGreeting')}
                </h1>
                <p className="text-xs sm:text-sm text-stone-400 leading-relaxed max-w-md mx-auto">
                  {t('chat.minimalSub')}
                </p>
              </div>

              {/* Minimal suggestions pills */}
              <div className="w-full max-w-xl pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {minimalPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputText(item.text);
                    }}
                    className="p-3.5 rounded-2xl bg-[#140a20]/90 border border-purple-900/40 hover:border-rose-400/50 hover:bg-[#1b0d2c] transition-all text-xs group text-stone-300 shadow-xs flex items-center justify-between"
                  >
                    <span className="font-medium group-hover:text-white transition-colors">
                      {item.label}
                    </span>
                    <CornerDownRight className="w-3.5 h-3.5 text-rose-400/50 group-hover:text-rose-400 transition-colors shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Message History */
            <div className="space-y-6 pb-6 pt-2">
              {messages.map((msg, index) => {
                const isAssistant = msg.sender === 'assistant';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-3xl ${
                      isAssistant ? 'mr-auto w-full' : 'ml-auto flex-row-reverse max-w-[85%] sm:max-w-[75%]'
                    }`}
                  >
                    {/* Compact Avatar for Assistant */}
                    {isAssistant && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-800 to-rose-600 text-white flex items-center justify-center shrink-0 text-xs font-serif shadow-xs font-bold mt-1">
                        I
                      </div>
                    )}

                    <div className="flex-1 space-y-1.5 min-w-0">
                      {/* Message Bubble */}
                      <div
                        className={`text-sm leading-relaxed ${
                          isAssistant
                            ? 'text-stone-100 p-0 sm:p-1'
                            : 'bg-gradient-to-r from-purple-950/80 to-[#1f0b33] text-stone-100 border border-purple-800/40 rounded-2xl p-3.5 sm:p-4 shadow-sm'
                        }`}
                      >
                        {/* Attachments preview if any */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mb-2 pb-2 border-b border-purple-800/40 space-y-2">
                            {msg.attachments.map((att, i) => {
                              const isImg = att.type?.startsWith('image/') || (!att.type?.startsWith('audio/') && att.name.match(/\.(jpg|jpeg|png|webp|gif)$/i));
                              const isAud = att.type?.startsWith('audio/') || att.name.match(/\.(mp3|wav|ogg|webm|m4a)$/i);

                              if (isImg && (att.previewUrl || att.dataUrl)) {
                                return (
                                  <div key={i} className="rounded-xl overflow-hidden border border-purple-800/50 max-w-xs">
                                    <img
                                      src={att.previewUrl || att.dataUrl}
                                      alt={att.name}
                                      onClick={() => setPreviewModalImage(att.previewUrl || att.dataUrl || null)}
                                      className="max-h-48 w-auto rounded-xl object-contain bg-black/40 cursor-pointer hover:opacity-90 transition-opacity"
                                    />
                                    <div className="p-1.5 bg-[#140a20]/90 text-[11px] text-stone-300 flex items-center justify-between">
                                      <span className="truncate max-w-[180px]">{att.name}</span>
                                      <span className="text-[10px] text-stone-400 font-mono">{formatFileSize(att.size)}</span>
                                    </div>
                                  </div>
                                );
                              }

                              if (isAud && (att.previewUrl || att.dataUrl)) {
                                return (
                                  <div key={i} className="p-2.5 rounded-xl bg-purple-950/70 border border-purple-800/50 space-y-1.5 max-w-xs">
                                    <div className="flex items-center gap-2 text-xs text-rose-300 font-medium">
                                      <Music className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                      <span className="truncate">{att.name}</span>
                                    </div>
                                    <audio
                                      controls
                                      src={att.previewUrl || att.dataUrl}
                                      className="w-full h-8 rounded-lg accent-rose-500"
                                    />
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={i}
                                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-purple-900/40 border border-purple-800/40 text-xs text-purple-200"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="w-4 h-4 text-rose-300 shrink-0" />
                                    <span className="truncate">{att.name}</span>
                                  </div>
                                  <span className="text-[10px] text-purple-300/70 font-mono shrink-0">{formatFileSize(att.size)}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Content text */}
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </div>

                        {/* Signature Facts vs Hypotheses Box */}
                        {isAssistant && (msg.facts || msg.hypotheses || msg.suggestedAction) && (
                          <div className="mt-3 space-y-2 bg-[#140a20] border border-purple-900/40 p-3.5 rounded-2xl text-xs">
                            {msg.facts && (
                              <div className="flex items-start gap-2 text-purple-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-semibold text-purple-300">{t('chat.factsObserved')} </span>
                                  <span className="text-stone-300">{msg.facts}</span>
                                </div>
                              </div>
                            )}

                            {msg.hypotheses && (
                              <div className="flex items-start gap-2 text-rose-200">
                                <HelpCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                                <div>
                                  <span className="font-semibold text-rose-300">{t('chat.hypothesesLabel')} </span>
                                  <span className="text-stone-300">{msg.hypotheses}</span>
                                </div>
                              </div>
                            )}

                            {msg.suggestedAction && (
                              <div className="mt-1.5 p-2.5 rounded-xl bg-rose-950/30 text-rose-200 border border-rose-800/30 font-medium">
                                <span className="font-bold text-rose-300">{t('chat.suggestedWords')} </span>
                                « {msg.suggestedAction} »
                              </div>
                            )}
                          </div>
                        )}

                        {/* Grounded Real-world Stories & Scientific Research Citations */}
                        {isAssistant && msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-purple-900/40 text-xs">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedSourcesMsgId(
                                  expandedSourcesMsgId === msg.id ? null : msg.id
                                )
                              }
                              className="w-full flex items-center justify-between text-left p-1.5 rounded-xl hover:bg-purple-950/40 text-[11px] text-rose-300 transition-colors cursor-pointer"
                            >
                              <span className="flex items-center gap-1.5 font-medium">
                                <BookOpen className="w-3.5 h-3.5 text-rose-400" />
                                <span>{t('agent.researchSources')} ({msg.sources.length})</span>
                              </span>
                              {expandedSourcesMsgId === msg.id ? (
                                <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                              )}
                            </button>

                            {expandedSourcesMsgId === msg.id && (
                              <div className="mt-2 space-y-2 animate-fade-in">
                                {msg.sources.map((src, sIdx) => {
                                  const isSci = src.sourceType === 'scientific_research';
                                  const isStory = src.sourceType === 'real_story';

                                  return (
                                    <div
                                      key={sIdx}
                                      className="p-2.5 rounded-xl bg-[#0e0717] border border-purple-900/40 space-y-1"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                            isSci
                                              ? 'bg-purple-950 text-purple-200 border border-purple-800/50'
                                              : isStory
                                              ? 'bg-rose-950 text-rose-200 border border-rose-800/50'
                                              : 'bg-stone-900 text-stone-300 border border-stone-800'
                                          }`}
                                        >
                                          {isSci ? (
                                            <GraduationCap className="w-3 h-3 text-purple-300" />
                                          ) : isStory ? (
                                            <Quote className="w-3 h-3 text-rose-300" />
                                          ) : (
                                            <BookOpen className="w-3 h-3 text-stone-400" />
                                          )}
                                          <span>
                                            {isSci
                                              ? t('agent.scientificResearch')
                                              : isStory
                                              ? t('agent.realStory')
                                              : t('agent.expertGuide')}
                                          </span>
                                        </span>

                                        {src.url && src.url.startsWith('http') && (
                                          <a
                                            href={src.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] text-stone-400 hover:text-white flex items-center gap-1"
                                          >
                                            <span>{t('agent.viewSource')}</span>
                                            <ExternalLink className="w-2.5 h-2.5 text-rose-400" />
                                          </a>
                                        )}
                                      </div>

                                      <p className="text-[11px] font-medium text-stone-200">
                                        {src.title}
                                      </p>
                                      <p className="text-[10px] text-stone-400 italic">
                                        {src.attribution}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Autonomous Quality Assessment Badge */}
                        {isAssistant && msg.qualityAssessment && (
                          <div className="mt-2 pt-1 flex items-center justify-between text-[10px] text-stone-400">
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              <span>{t('agent.qualityAudit')} : <strong className="text-emerald-300 font-mono">{msg.qualityAssessment.overallScore}%</strong></span>
                            </span>
                            {msg.latencyMs && (
                              <span className="text-stone-500 font-mono text-[9px]">{msg.latencyMs}ms</span>
                            )}
                          </div>
                        )}

                        {/* Reported badge */}
                        {isAssistant && msg.reported && (
                          <div className="mt-2 text-[10px] text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-amber-700/40">
                            <Flag className="w-3 h-3 text-amber-400" />
                            <span>{t('chat.reported')}</span>
                          </div>
                        )}

                        {/* Offline / Error Sync status with explicit retry */}
                        {msg.status === 'error' && (
                          <div className="mt-2.5 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-rose-950/50 border border-rose-800/50 text-[11px] text-rose-300">
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              <span>{language === 'en' ? 'Preserved locally (pending cloud sync)' : 'Conservé en local (en attente de synchronisation)'}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRetryMessage(msg)}
                              className="px-2.5 py-1 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-white font-medium flex items-center gap-1 transition-all shrink-0 cursor-pointer shadow-xs"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>{language === 'en' ? 'Retry' : 'Réessayer'}</span>
                            </button>
                          </div>
                        )}

                        {msg.status === 'sending' && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-stone-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                            <span>{language === 'en' ? 'Synchronizing...' : 'Synchronisation...'}</span>
                          </div>
                        )}
                      </div>

                      {/* ChatGPT-style Action Bar under AI messages */}
                      {isAssistant && (
                        <div className="flex flex-wrap items-center gap-1 text-stone-400 pt-1">
                          {/* Copier */}
                          <button
                            type="button"
                            onClick={() => handleCopy(msg)}
                            title={copiedId === msg.id ? t('chat.copied') : t('chat.copy')}
                            aria-label={t('chat.copy')}
                            className={`h-7 px-2 rounded-lg text-xs flex items-center gap-1 transition-all ${
                              copiedId === msg.id
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/40'
                                : 'text-stone-400 hover:text-white hover:bg-purple-950/40'
                            }`}
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[11px]">{t('chat.copied')}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[11px] hidden sm:inline">{t('chat.copy')}</span>
                              </>
                            )}
                          </button>

                          {/* J'aime / Utile */}
                          <button
                            type="button"
                            onClick={() => handleLike(msg)}
                            title={msg.liked ? t('chat.liked') : t('chat.like')}
                            aria-label={t('chat.like')}
                            className={`h-7 px-2 rounded-lg text-xs flex items-center gap-1 transition-all ${
                              msg.liked
                                ? 'bg-rose-950/60 text-rose-300 border border-rose-700/40 font-medium'
                                : 'text-stone-400 hover:text-white hover:bg-purple-950/40'
                            }`}
                          >
                            <ThumbsUp className={`w-3.5 h-3.5 ${msg.liked ? 'fill-rose-400 text-rose-400' : ''}`} />
                            <span className="text-[11px] hidden sm:inline">{t('chat.like')}</span>
                          </button>

                          {/* Je n'aime pas / Pas utile */}
                          <button
                            type="button"
                            onClick={() => handleDislike(msg)}
                            title={msg.disliked ? t('chat.disliked') : t('chat.dislike')}
                            aria-label={t('chat.dislike')}
                            className={`h-7 px-2 rounded-lg text-xs flex items-center gap-1 transition-all ${
                              msg.disliked
                                ? 'bg-purple-900/60 text-purple-200 border border-purple-600/40 font-medium'
                                : 'text-stone-400 hover:text-white hover:bg-purple-950/40'
                            }`}
                          >
                            <ThumbsDown className={`w-3.5 h-3.5 ${msg.disliked ? 'fill-purple-400 text-purple-400' : ''}`} />
                            <span className="text-[11px] hidden sm:inline">{t('chat.dislike')}</span>
                          </button>

                          {/* Écouter / Arrêter */}
                          <button
                            type="button"
                            onClick={() => handleReadAloud(msg)}
                            title={playingAudioId === msg.id ? t('chat.stopListen') : t('chat.listen')}
                            aria-label={t('chat.listen')}
                            className={`h-7 px-2 rounded-lg text-xs flex items-center gap-1 transition-all ${
                              playingAudioId === msg.id
                                ? 'bg-rose-950/60 text-rose-300 border border-rose-700/40 font-medium'
                                : 'text-stone-400 hover:text-white hover:bg-purple-950/40'
                            }`}
                          >
                            {playingAudioId === msg.id ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                                <span className="text-[11px] text-rose-300">{t('chat.stopListen')}</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5" />
                                <span className="text-[11px] hidden sm:inline">{t('chat.listen')}</span>
                              </>
                            )}
                          </button>

                          {/* Partager */}
                          <button
                            type="button"
                            onClick={() => handleShare(msg)}
                            title={t('chat.share')}
                            aria-label={t('chat.share')}
                            className="h-7 px-2 rounded-lg text-stone-400 hover:text-white hover:bg-purple-950/40 text-xs flex items-center gap-1 transition-all"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span className="text-[11px] hidden sm:inline">{t('chat.share')}</span>
                          </button>

                          {/* Régénérer */}
                          <button
                            type="button"
                            disabled={loadingReply}
                            onClick={() => handleRegenerate(index)}
                            title={t('chat.regenerate')}
                            aria-label={t('chat.regenerate')}
                            className={`h-7 px-2 rounded-lg text-xs flex items-center gap-1 transition-all ${
                              loadingReply
                                ? 'text-stone-600 cursor-not-allowed'
                                : 'text-stone-400 hover:text-white hover:bg-purple-950/40'
                            }`}
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingReply ? 'animate-spin' : ''}`} />
                            <span className="text-[11px] hidden sm:inline">{t('chat.regenerate')}</span>
                          </button>

                          {/* Plus d'options (...) */}
                          <div className="relative msg-action-menu-container ml-auto">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuMsgId(activeMenuMsgId === msg.id ? null : msg.id);
                              }}
                              title={t('chat.moreOptions')}
                              aria-label={t('chat.moreOptions')}
                              className={`h-7 w-7 rounded-lg text-stone-400 hover:text-white hover:bg-purple-950/40 flex items-center justify-center transition-all ${
                                activeMenuMsgId === msg.id ? 'bg-purple-900/50 text-white' : ''
                              }`}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuMsgId === msg.id && (
                              <div className="absolute right-0 bottom-full mb-1.5 w-52 bg-[#180d26] rounded-2xl shadow-2xl border border-purple-800/50 py-1.5 z-40 animate-fade-in text-xs text-stone-200">
                                <button
                                  type="button"
                                  onClick={() => handleExportAdvice(msg)}
                                  className="w-full text-left px-3 py-2 hover:bg-purple-900/40 hover:text-white flex items-center gap-2 transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5 text-stone-400" />
                                  <span>{t('chat.exportAdvice')}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleReportMessage(msg)}
                                  className="w-full text-left px-3 py-2 hover:bg-purple-900/40 hover:text-white flex items-center gap-2 transition-colors"
                                >
                                  <Flag className="w-3.5 h-3.5 text-amber-400" />
                                  <span>{t('chat.report')}</span>
                                </button>

                                <div className="border-t border-purple-900/40 my-1" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuMsgId(null);
                                    setConfirmDeleteMsg(msg);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-rose-950/40 text-rose-400 flex items-center gap-2 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                  <span>{t('chat.deleteMessage')}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Loading Indicator */}
              {loadingReply && (
                <div className="flex gap-3 max-w-xl mr-auto">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-800 to-rose-600 text-white flex items-center justify-center text-xs font-serif shadow-xs font-bold mt-1">
                    I
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#140a20] border border-purple-900/40 shadow-xs flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs text-stone-400 italic">
                      {t('chat.analyzing')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Selected Attachments Pill Preview Bar */}
      {(attachments.length > 0 || isReadingFiles) && (
        <div className="max-w-3xl w-full mx-auto px-4 py-2 flex flex-wrap gap-2 items-center">
          {attachments.map((att, idx) => {
            const isImg = att.type?.startsWith('image/') || (!att.type?.startsWith('audio/') && att.name.match(/\.(jpg|jpeg|png|webp|gif)$/i));
            const isAud = att.type?.startsWith('audio/') || att.name.match(/\.(mp3|wav|ogg|webm|m4a)$/i);

            return (
              <div
                key={idx}
                className="flex items-center gap-2 bg-[#1b0d2b] pl-2 pr-3 py-1.5 rounded-2xl text-xs text-stone-200 border border-purple-800/50 shadow-md group animate-fade-in"
              >
                {isImg && (att.previewUrl || att.dataUrl) ? (
                  <img
                    src={att.previewUrl || att.dataUrl}
                    alt={att.name}
                    className="w-8 h-8 rounded-lg object-cover border border-purple-700/50 cursor-pointer"
                    onClick={() => setPreviewModalImage(att.previewUrl || att.dataUrl || null)}
                  />
                ) : isAud ? (
                  <div className="w-8 h-8 rounded-lg bg-rose-950/50 flex items-center justify-center text-rose-400">
                    <Music className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-purple-950/50 flex items-center justify-center text-purple-300">
                    <FileText className="w-4 h-4" />
                  </div>
                )}

                <div className="flex flex-col min-w-0 max-w-[140px] sm:max-w-[200px]">
                  <span className="truncate font-medium text-stone-100">{att.name}</span>
                  <span className="text-[10px] text-stone-400 font-mono">{formatFileSize(att.size)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                  title={t('chat.removeAttachment')}
                  aria-label={t('chat.removeAttachment')}
                  className="p-1 rounded-full text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors ml-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {isReadingFiles && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/40 border border-purple-800/40 text-xs text-stone-300 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
              <span>{t('chat.fileReading')}</span>
            </div>
          )}
        </div>
      )}

      {/* Fixed Modern Bottom Input Area (ChatGPT Style) */}
      <footer className="sticky bottom-0 bg-gradient-to-t from-[#0c0714] via-[#0c0714] to-transparent pt-2 pb-3 sm:pb-4 px-3 sm:px-6 w-full z-20">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Active Voice / Microphone Dynamic Status Banners */}
          {micStatus === 'listening' && (
            <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-950/80 to-purple-950/80 border border-rose-500/40 shadow-lg animate-fade-in text-xs text-stone-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                </span>
                <span className="font-medium text-rose-200 truncate">{t('chat.micListening')}</span>
                <span className="hidden sm:inline text-stone-400 text-[11px]">({t('chat.micListeningNotice')})</span>
              </div>
              <button
                type="button"
                onClick={handleToggleMic}
                className="px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>{language === 'en' ? 'Stop' : 'Arrêter'}</span>
              </button>
            </div>
          )}

          {micStatus === 'recording_audio' && (
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-950/90 to-[#1e0a2d] border border-purple-500/50 shadow-xl animate-fade-in text-xs text-stone-200">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                </span>
                <span className="font-mono font-bold text-rose-300 text-sm tracking-wider">
                  {formatDuration(recordingDuration)}
                </span>
                <span className="hidden sm:inline text-stone-300 text-xs">{t('chat.micRecordingAudio')}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => stopAudioRecording(true)}
                  className="px-3 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs flex items-center gap-1 transition-all cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>{t('chat.micCancelRecording')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => stopAudioRecording(false)}
                  className="px-3.5 py-1 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 hover:opacity-95 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('chat.micStopRecording')}</span>
                </button>
              </div>
            </div>
          )}

          {micStatus === 'denied' && (
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-amber-950/60 border border-amber-600/50 text-xs text-amber-200 animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{t('chat.micPermissionDenied')}</span>
              </div>
              <button
                type="button"
                onClick={() => setMicStatus('idle')}
                className="p-1 rounded-full hover:bg-amber-900/40 text-amber-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {micStatus === 'processing' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs text-stone-300">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>{t('chat.micProcessing')}</span>
            </div>
          )}

          <form
            onSubmit={handleSendMessage}
            className="relative bg-[#160b24] border border-purple-800/40 hover:border-purple-600/50 focus-within:border-rose-400/50 focus-within:ring-1 focus-within:ring-rose-400/20 rounded-3xl p-1.5 sm:p-2 flex items-end gap-1.5 shadow-2xl transition-all"
          >
            {/* 1. Attachment Button (+) */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,audio/mp3,audio/wav,audio/m4a,audio/webm,audio/ogg"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title={t('chat.attachFile')}
              aria-label={t('chat.attachFile')}
              className="p-2 sm:p-2.5 rounded-full text-stone-400 hover:text-white hover:bg-purple-900/40 transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-5 h-5 text-rose-300" />
            </button>

            {/* 2. Textarea */}
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder={
                  micStatus === 'listening'
                    ? t('chat.micListening')
                    : micStatus === 'recording_audio'
                    ? t('chat.micRecordingAudio')
                    : t('chat.placeholder')
                }
                className="w-full resize-none bg-transparent py-2.5 px-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden max-h-36"
              />
            </div>

            {/* 3. Microphone Button (Speech Recognition & Voice Notes) */}
            <button
              type="button"
              onClick={handleToggleMic}
              title={
                micStatus === 'listening'
                  ? 'Arrêter la dictée'
                  : micStatus === 'recording_audio'
                  ? 'Arrêter l’enregistrement'
                  : micStatus === 'denied'
                  ? t('chat.micPermissionDenied')
                  : 'Dictée vocale & Note audio'
              }
              aria-label="Dictée vocale et note audio"
              className={`p-2 sm:p-2.5 rounded-full transition-all shrink-0 cursor-pointer ${
                micStatus === 'listening'
                  ? 'bg-rose-500/25 text-rose-400 border border-rose-500/60 animate-pulse shadow-md shadow-rose-950/40'
                  : micStatus === 'recording_audio'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/60 animate-pulse'
                  : micStatus === 'denied'
                  ? 'text-amber-400 hover:bg-amber-950/40 border border-amber-600/40'
                  : 'text-stone-400 hover:text-white hover:bg-purple-900/40'
              }`}
            >
              {micStatus === 'listening' ? (
                <MicOff className="w-5 h-5 text-rose-400" />
              ) : micStatus === 'recording_audio' ? (
                <Square className="w-5 h-5 text-rose-300 fill-current" />
              ) : micStatus === 'processing' ? (
                <Loader2 className="w-5 h-5 animate-spin text-purple-300" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            {/* 4. Send Button */}
            <button
              type="submit"
              disabled={(!inputText.trim() && attachments.length === 0) || loadingReply}
              aria-label="Envoyer"
              className={`p-2 sm:p-2.5 rounded-full text-white transition-all shrink-0 ${
                (inputText.trim() || attachments.length > 0) && !loadingReply
                  ? 'bg-gradient-to-r from-rose-500 to-purple-700 hover:opacity-95 shadow-md shadow-rose-950/40 active:scale-95 cursor-pointer'
                  : 'bg-purple-950/40 text-stone-600 cursor-not-allowed'
              }`}
            >
              <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </form>

          {/* Subtitle notice */}
          <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1.5 px-3">
            <span>{t('chat.dataNotice')}</span>
            <span className="hidden sm:inline">{t('chat.enterNotice')}</span>
          </div>
        </div>
      </footer>

      {/* MODAL 1: Dislike Feedback */}
      {dislikeModalMessage && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#140a20] border border-purple-800/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in text-stone-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-300 font-serif font-medium">
                <ThumbsDown className="w-4 h-4" />
                <h3 className="text-base">{t('chat.feedbackTitle')}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDislikeModalMessage(null)}
                className="p-1 rounded-full text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-400">
              {t('chat.feedbackSubtitle')}
            </p>

            <div className="space-y-1.5">
              {[
                t('chat.reasonTooDirect'),
                t('chat.reasonInaccurate'),
                t('chat.reasonNotRelevant'),
                t('chat.reasonRepetitive'),
                t('chat.reasonOther'),
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedDislikeReason(reason)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs border transition-all ${
                    selectedDislikeReason === reason
                      ? 'border-rose-500 bg-rose-950/30 text-rose-200 font-medium'
                      : 'border-purple-900/40 text-stone-300 hover:bg-purple-950/30'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <textarea
              value={dislikeReasonText}
              onChange={(e) => setDislikeReasonText(e.target.value)}
              placeholder={t('chat.feedbackPlaceholder')}
              rows={2}
              className="w-full text-xs p-3 rounded-xl bg-[#1b0d2b] border border-purple-800/40 text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-rose-400 resize-none"
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDislikeModalMessage(null)}
                className="px-4 py-2 text-xs text-stone-400 hover:text-white"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmitDislikeReason}
                className="px-5 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs"
              >
                {t('chat.submitFeedback')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Report Message Modal */}
      {reportModalMessage && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#140a20] border border-purple-800/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in text-stone-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-300 font-serif font-medium">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base">{t('chat.reportTitle')}</h3>
              </div>
              <button
                type="button"
                onClick={() => setReportModalMessage(null)}
                className="p-1 rounded-full text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-400">
              {t('chat.reportDesc')}
            </p>

            <textarea
              value={reportReasonText}
              onChange={(e) => setReportReasonText(e.target.value)}
              placeholder={t('chat.reportReasonPlaceholder')}
              rows={3}
              className="w-full text-xs p-3 rounded-xl bg-[#1b0d2b] border border-purple-800/40 text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-rose-400 resize-none"
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setReportModalMessage(null)}
                className="px-4 py-2 text-xs text-stone-400 hover:text-white"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs"
              >
                {t('chat.submitReport')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Message Modal */}
      {confirmDeleteMsg && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#140a20] border border-purple-800/40 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-fade-in text-stone-100">
            <h3 className="font-serif text-base text-white font-medium">
              {t('chat.deleteMessage')}
            </h3>
            <p className="text-xs text-stone-400">
              {t('chat.confirmDeleteMsg')}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteMsg(null)}
                className="px-4 py-2 text-xs text-stone-400 hover:text-white"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteMessage}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Share Modal Fallback */}
      {shareModalMessage && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#140a20] border border-purple-800/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in text-stone-100">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-white">
                {t('chat.shareModalTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setShareModalMessage(null)}
                className="p-1 rounded-full text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#1c0d2f] border border-purple-800/40 text-xs text-stone-200 leading-relaxed italic max-h-48 overflow-y-auto">
              « {shareModalMessage.content} »
            </div>

            <p className="text-xs text-stone-400">
              {t('chat.shareModalDesc')}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleExportAdvice(shareModalMessage)}
                className="px-4 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-stone-300 text-xs font-medium border border-purple-800/40"
              >
                {t('chat.exportAdvice')}
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(shareModalMessage.content);
                  showToast(t('chat.copied'));
                  setShareModalMessage(null);
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-700 text-white text-xs font-semibold shadow-xs"
              >
                {t('chat.copyClipboard')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Image Preview Modal */}
      {previewModalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewModalImage(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewModalImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-stone-900/80 text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewModalImage}
              alt="Aperçu agrandi"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-purple-800/40"
            />
          </div>
        </div>
      )}
    </div>
  );
};
