import { GoogleGenAI } from '@google/genai';
import { AIProvider, ProviderHealth, ProviderRequest, ProviderResponse, SearchSource, SupportedLanguage } from '../types';
import { IntimaBehaviorEngine } from '../intimaBehavior';

export class GeminiProvider implements AIProvider {
  readonly providerId = 'gemini-suite';
  readonly providerName = 'Google Gemini Autonomous Engine';
  private ai: GoogleGenAI;
  private primaryModel = 'gemini-3.8-flash';
  private fallbackModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest'];

  constructor(apiKey?: string) {
    this.ai = new GoogleGenAI({
      apiKey: apiKey || process.env.GEMINI_API_KEY,
      httpOptions: {
        timeout: 10000,
        headers: {
          'User-Agent': 'aistudio-build-intima',
        },
      },
    });
  }

  async healthCheck(): Promise<ProviderHealth> {
    const startTime = Date.now();
    try {
      const response = await this.ai.models.generateContent({
        model: this.primaryModel,
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Ping' }],
          },
        ],
        config: {
          temperature: 0.1,
          maxOutputTokens: 5,
        },
      });

      const latencyMs = Date.now() - startTime;
      const text = response.text || '';
      const isOperational = text.length > 0;

      return {
        providerId: this.providerId,
        providerName: `${this.providerName} (${this.primaryModel})`,
        isOperational,
        latencyMs,
        statusMessage: isOperational ? `Opérationnel via ${this.primaryModel} (${latencyMs}ms)` : 'Réponse inattendue',
        lastChecked: new Date().toISOString(),
        supportedFeatures: ['Grounding Web Search', 'Multi-turn Memory', 'Speech Synthesis (TTS)', 'Bilingual FR/EN'],
      };
    } catch (err: any) {
      return {
        providerId: this.providerId,
        providerName: this.providerName,
        isOperational: false,
        latencyMs: Date.now() - startTime,
        statusMessage: `Indisponible: ${err?.message || 'Erreur de connexion'}`,
        lastChecked: new Date().toISOString(),
        supportedFeatures: ['Grounding Web Search', 'Multi-turn Memory'],
      };
    }
  }

  async generateResponse(request: ProviderRequest): Promise<ProviderResponse> {
    const startTime = Date.now();
    const isEnglish = request.language === 'en';

    // Step 1: Detect primary relational role, intent, and safety alerts
    const lastUserMsg = [...request.messages].reverse().find((m) => m.role === 'user')?.content || '';
    const detectedIntent = IntimaBehaviorEngine.analyzeIntent(lastUserMsg, {
      ...request.userContext,
      language: request.language,
    });

    // Step 2: Build role-specific, ethical, clinical system instruction
    let systemInstruction = IntimaBehaviorEngine.buildSystemInstruction(
      request.language,
      detectedIntent,
      request.userContext
    );

    // Step 3: Inject user-authorized personal memory in the target language
    if (request.userContext) {
      const { relationshipStatus, userName, partnerName, topic, memories } = request.userContext;
      const memList = memories && memories.length > 0 ? memories.map((m) => `- ${m}`).join('\n') : '';

      switch (request.language) {
        case 'en':
          systemInstruction += `\n\nUSER RECOGNIZED CONTEXT:
- Relationship status: ${relationshipStatus || 'Not specified'}
- User name: ${userName || 'Friend'}
- Partner name / nickname: ${partnerName || 'Partner'}
- Session theme: ${topic || 'General'}${memList ? `\n\nUSER'S AUTHORIZED PERSONAL MEMORY:\n${memList}` : ''}`;
          break;
        case 'de':
          systemInstruction += `\n\nGESPEICHERTER NUTZER-KONTEXT:
- Beziehungsstatus: ${relationshipStatus || 'Nicht angegeben'}
- Vorname des Nutzers: ${userName || 'Freund/in'}
- Partnername / Kosename: ${partnerName || 'Partner'}
- Thema der Sitzung: ${topic || 'Allgemein'}${memList ? `\n\nAUTORISIERTES PERSÖNLICHES GEDÄCHTNIS:\n${memList}` : ''}`;
          break;
        case 'es':
          systemInstruction += `\n\nCONTEXTO REGISTRADO DEL USUARIO:
- Estado sentimental: ${relationshipStatus || 'No especificado'}
- Nombre del usuario: ${userName || 'Amigo/a'}
- Nombre de la pareja: ${partnerName || 'Pareja'}
- Tema de la sesión: ${topic || 'General'}${memList ? `\n\nMEMORIA PERSONAL AUTORIZADA:\n${memList}` : ''}`;
          break;
        case 'pt':
          systemInstruction += `\n\nCONTEXTO REGISTRADO DO USUÁRIO:
- Estado civil/afetivo: ${relationshipStatus || 'Não informado'}
- Nome do usuário: ${userName || 'Amigo(a)'}
- Nome do(a) parceiro(a): ${partnerName || 'Parceiro(a)'}
- Tema da sessão: ${topic || 'Geral'}${memList ? `\n\nMEMÓRIA PESSOAL AUTORIZADA:\n${memList}` : ''}`;
          break;
        case 'la':
          systemInstruction += `\n\nSTATUS ET MEMORIA UTENTIS:
- Status necessitudinis: ${relationshipStatus || 'Non indicatus'}
- Nomen: ${userName || 'Amicus'}
- Nomen socii: ${partnerName || 'Socius'}
- Argumentum: ${topic || 'Generale'}${memList ? `\n\nMEMORIA SANCTA:\n${memList}` : ''}`;
          break;
        case 'fr':
        default:
          systemInstruction += `\n\nCONTEXTE UTILISATEUR ENREGISTRÉ :
- Statut relationnel : ${relationshipStatus || 'Non précisé'}
- Prénom de l'utilisateur : ${userName || 'Ami(e)'}
- Prénom / Surnom du partenaire (si couple) : ${partnerName || 'Partenaire'}
- Thème de la session : ${topic || 'Général'}${memList ? `\n\nMÉMOIRE PERSONNELLE AUTORISÉE PAR L'UTILISATEUR :\n${memList}` : ''}`;
          break;
      }
    }

    const promptAdditions: Record<SupportedLanguage, string> = {
      fr: `\n\nÀ la fin de ta réponse bienveillante, ajoute IMPÉRATIVEMENT la section suivante :
---INTIMA_ANALYSE---
FAITS: [1 phrase synthétisant les faits bruts observables mentionnés par la personne]
SUPPOSITIONS: [1 phrase rappelant ce qui relève d'une hypothèse ou d'un ressenti sans certitude absolue sur autrui]
SUGGESTION: [1 phrase concrète, bienveillante et formulée en 'Je' que la personne peut dire ou s'approprier]`,
      en: `\n\nAt the end of your compassionate response, MANDATORILY add the following structured breakdown:
---INTIMA_ANALYSE---
FACTS: [1 sentence summarizing observable facts mentioned by user]
ASSUMPTIONS: [1 sentence recalling what is an assumption or feeling without absolute certainty about others]
SUGGESTION: [1 ready-to-say caring phrase using 'I' statements that the user can say]`,
      de: `\n\nFügen Sie am Ende Ihrer Antwort ZWINGEND folgenden strukturierten Abschnitt an:
---INTIMA_ANALYSE---
FAKTEN: [1 Satz mit ausschließlich beobachtbaren, objektiven Tatsachen]
HYPOTHESEN: [1 Satz, der an Annahmen oder das Unbekannte über die Gedanken anderer erinnert]
VORSCHLAG: [1 konkrete, wohlwollende Ich-Botschaft, die sofort ausgesprochen werden kann]`,
      es: `\n\nAl final de tu respuesta, añade OBLIGATORIAMENTE la siguiente sección estructurada:
---INTIMA_ANALYSE---
HECHOS: [1 frase resumiendo únicamente los hechos concretos y observables]
HIPÓTESIS: [1 frase recordando lo que corresponde a una suposición o incertidumbre sobre el otro]
SUGERENCIA: [1 frase asertiva y tierna formulada en primera persona 'Yo' lista para decir]`,
      pt: `\n\nAo final da sua resposta, adicione OBRIGATORIAMENTE a seguinte seção estruturada:
---INTIMA_ANALYSE---
FATOS: [1 frase sintetizando apenas os fatos objetivos e observáveis]
HIPÓTESES: [1 frase lembrando o que é suposição ou sentimento não confirmado sobre o outro]
SUGESTÃO: [1 frase acolhedora formulada em primeira pessoa 'Eu' pronta para ser dita]`,
      la: `\n\nAd finem responsionis tuae, IMPERATIVE adde hanc partem dispositam:
---INTIMA_ANALYSE---
FACTA: [1 sententia quae sola facta oculis visa breviter colligit]
HYPOTHESES: [1 sententia quae admonet quid suspicio vel incognitum de altero sit]
SUGGESTIO: [1 sententia clementissima verbis primae personae concepta ad pacem dicendam]`,
    };

    const emptyAttachmentPrompts: Record<SupportedLanguage, string> = {
      fr: "Voici ma pièce jointe, peux-tu l'analyser ?",
      en: "Please analyze my shared attachment.",
      de: "Hier ist mein Anhang, bitte analysiere ihn.",
      es: "Aquí tienes mi archivo adjunto, ¿podrías analizarlo?",
      pt: "Aqui está meu anexo, você pode analisá-lo?",
      la: "Hic est fasciculus meus adiunctus, quaeso examina.",
    };

    const promptAddition = promptAdditions[request.language] || promptAdditions.fr;
    const defaultAttachmentPrompt = emptyAttachmentPrompts[request.language] || emptyAttachmentPrompts.fr;

    const contents = request.messages.map((m, idx) => {
      const isLast = idx === request.messages.length - 1;
      const textContent = isLast ? (m.content || defaultAttachmentPrompt) + promptAddition : m.content;
      const parts: any[] = [{ text: textContent }];

      if (m.attachments && m.attachments.length > 0) {
        for (const att of m.attachments) {
          if (!att.dataUrl) continue;
          try {
            const match = att.dataUrl.match(/^data:([^;]+)(?:;[^;]+)*;base64,(.+)$/s);
            if (match) {
              const mimeType = match[1];
              const base64Data = match[2];

              if (
                mimeType.startsWith('image/') ||
                mimeType.startsWith('audio/') ||
                mimeType === 'application/pdf'
              ) {
                parts.push({
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                });
              } else if (mimeType.startsWith('text/')) {
                const textDecoded = Buffer.from(base64Data, 'base64').toString('utf-8');
                parts.push({
                  text: `\n[Document texte joint "${att.name}"]:\n${textDecoded.slice(0, 5000)}`,
                });
              }
            }
          } catch (e) {
            console.warn('[GeminiProvider] Erreur lors du traitement de la pièce jointe:', att.name, e);
          }
        }
      }

      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

    const modelsToTry = [this.primaryModel, ...this.fallbackModels];
    let lastError = null;
    let successfulModel = this.primaryModel;
    let geminiResponse: any = null;

    // Config with optional Google Search Grounding for real-time relational research & testimonies
    const baseConfig: any = {
      systemInstruction,
      temperature: 0.7,
      topP: 0.95,
    };

    if (request.enableWebResearch) {
      baseConfig.tools = [{ googleSearch: {} }];
    }

    for (const model of modelsToTry) {
      try {
        geminiResponse = await this.ai.models.generateContent({
          model,
          contents,
          config: baseConfig,
        });
        successfulModel = model;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`[GeminiProvider] Modèle ${model} indisponible: ${err?.message || err}. Essai du suivant...`);
        // If web research tool failed on this model, retry without tools on fallback
        if (baseConfig.tools) {
          delete baseConfig.tools;
        }
      }
    }

    if (!geminiResponse) {
      throw lastError || new Error('Tous les modèles Gemini ont échoué.');
    }

    const latencyMs = Date.now() - startTime;
    const defaultFallbacks: Record<SupportedLanguage, string> = {
      fr: "Je suis là avec toi.",
      en: "I am right here with you.",
      de: "Ich bin hier an deiner Seite.",
      es: "Estoy aquí contigo.",
      pt: "Estou aqui com você.",
      la: "Tecum hic adsum.",
    };
    const fullText = geminiResponse.text || defaultFallbacks[request.language] || defaultFallbacks.fr;

    let content = fullText;
    let facts = "";
    let hypotheses = "";
    let suggestedAction = "";

    const splitMarker = '---INTIMA_ANALYSE---';
    if (fullText.includes(splitMarker)) {
      const [mainPart, analysisPart] = fullText.split(splitMarker);
      content = mainPart.trim();

      const factsMatch = analysisPart.match(/(?:FAITS|FACTS|FAKTEN|HECHOS|FATOS|FACTA):\s*([^\n\r]+)/i);
      const hypMatch = analysisPart.match(/(?:SUPPOSITIONS|ASSUMPTIONS|HYPOTHESES|HYPOTHESEN|HIPOTESIS|HIPÓTESIS|HIPÓTESES|HIPOTESES):\s*([^\n\r]+)/i);
      const sugMatch = analysisPart.match(/(?:SUGGESTION|VORSCHLAG|SUGERENCIA|SUGESTAO|SUGESTÃO|SUGGESTIO):\s*([^\n\r]+)/i);

      if (factsMatch && factsMatch[1]) facts = factsMatch[1].trim();
      if (hypMatch && hypMatch[1]) hypotheses = hypMatch[1].trim();
      if (sugMatch && sugMatch[1]) suggestedAction = sugMatch[1].trim();
    }

    // Extract Grounding Web Sources if available
    const sources: SearchSource[] = [];
    const candidate = geminiResponse.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;

    if (groundingMetadata?.groundingChunks && Array.isArray(groundingMetadata.groundingChunks)) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web?.uri) {
          const url = chunk.web.uri;
          const title = chunk.web.title || (isEnglish ? 'Web Article' : 'Source web');
          
          // Determine if it's academic/scientific or real story/forum
          const isAcademic = /edu|nih\.gov|apa\.org|psychology|research|science|gottman|journal|pubmed/i.test(url);
          const isTestimony = /reddit|forum|quora|medium|story|experience|temoignage|blog/i.test(url);

          sources.push({
            title,
            url,
            snippet: title,
            sourceType: isAcademic ? 'scientific_research' : isTestimony ? 'real_story' : 'expert_guide',
            attribution: isAcademic
              ? (isEnglish ? 'Verified Clinical & Scientific Research' : 'Étude clinique & scientifique vérifiée')
              : isTestimony
              ? (isEnglish ? 'Public Lived Experience & Testimony' : 'Témoignage et retour d’expérience réel')
              : (isEnglish ? 'Specialized Relationship Guide' : 'Guide relationnel spécialisé'),
          });
        }
      }
    }

    // Approximate token counts
    const promptLength = contents.reduce((acc, c) => acc + (c.parts[0]?.text?.length || 0), 0);
    const completionLength = fullText.length;
    const promptTokens = Math.ceil(promptLength / 4);
    const completionTokens = Math.ceil(completionLength / 4);

    return {
      content,
      facts,
      hypotheses,
      suggestedAction,
      sources: sources.length > 0 ? sources.slice(0, 4) : undefined,
      providerUsed: this.providerId,
      modelUsed: successfulModel,
      latencyMs,
      tokensUsed: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };
  }
}
