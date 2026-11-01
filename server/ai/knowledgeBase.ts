import { KnowledgeItem } from './types';

export class KnowledgeBaseService {
  private knowledgeItems: KnowledgeItem[] = [
    {
      id: 'kb_gottman_four_horsemen',
      titleFr: 'Les 4 Cavaliers de l’Apocalypse (Dr. John Gottman)',
      titleEn: 'The 4 Horsemen of the Apocalypse (Dr. John Gottman)',
      category: 'conflict_resolution',
      summaryFr: 'Identifier et désamorcer la critique, le mépris, la défensive et la dérobade (stonewalling) lors des désaccords.',
      summaryEn: 'Identify and de-escalate criticism, contempt, defensiveness, and stonewalling during disagreements.',
      keyPrinciplesFr: [
        'Remplacer la critique globale par une plainte douce débutant par "Je ressent... quand..."',
        'Le mépris (sarcasme, soupirs) est le prédicteur #1 de rupture : le remplacer par la reconnaissance et l’appréciation',
        'La défensive bloque l’écoute : accepter une part de responsabilité même minime apaise le système nerveux',
        'La dérobade signale une surchauffe physiologique (battements > 100 bpm) : faire une pause bienveillante de 20 minutes',
      ],
      keyPrinciplesEn: [
        'Replace global criticism with a gentle startup starting with "I feel... when..."',
        'Contempt (sarcasm, eye-rolling) is the #1 predictor of breakup: replace with appreciation and culture of fondness',
        'Defensiveness blocks listening: taking even 5% responsibility immediately calms the partner nervous system',
        'Stonewalling signals physiological flooding (> 100 bpm): take a respectful 20-minute de-escalation break',
      ],
      recommendedPhrasesFr: [
        'Je me sens inquiet(e) quand nous n’arrivons pas à nous parler calmement. Peux-tu m’aider à comprendre ?',
        'Tu as raison sur ce point, j’aurais pu te prévenir plus tôt.',
        'Mon cœur bat trop fort en ce moment. J’ai besoin de 15 minutes de marche pour pouvoir t’écouter avec tout mon amour.',
      ],
      recommendedPhrasesEn: [
        'I feel overwhelmed when we struggle to talk calmly. Can you help me understand your perspective?',
        'You are right about that point; I could have let you know sooner.',
        'My heart is racing right now. I need 15 minutes of quiet so I can return and listen to you with open presence.',
      ],
      scientificReference: 'Gottman, J. M., & Silver, N. (2015). The Seven Principles for Making Marriage Work.',
      confidenceScore: 0.98,
      sourceType: 'empirical_study',
      updatedAt: '2026-03-01T10:00:00Z',
    },
    {
      id: 'kb_attachment_styles',
      titleFr: 'Théorie de l’Attachement : La Danse Anxieux-Évitant',
      titleEn: 'Attachment Theory: The Anxious-Avoidant Dance',
      category: 'attachment',
      summaryFr: 'Comprendre pourquoi la distance de l’un déclenche la panique de l’autre, créant une spirale d’incompréhension.',
      summaryEn: 'Understanding why one partner withdrawal triggers the other panic, creating an escalating spiral.',
      keyPrinciplesFr: [
        'Le partenaire à attachement anxieux cherche la réassurance rapide pour apaiser la peur du rejet',
        'Le partenaire évitant perçoit la pression émotionnelle intense comme une menace pour son autonomie et se replie',
        'Ce ne sont pas des défauts moraux, mais des stratégies de survie apprises durant l’enfance',
        'La désescalade nécessite que l’anxieux s’auto-apaise et que l’évitant offre un signal explicite de présence',
      ],
      keyPrinciplesEn: [
        'The anxiously attached partner seeks immediate reassurance to soothe fear of abandonment',
        'The avoidant partner perceives emotional intensity as a threat to autonomy and pulls back to regulate',
        'These are not character flaws, but learned nervous system survival strategies',
        'De-escalation requires the anxious partner to practice self-soothing and the avoidant partner to provide explicit presence signals',
      ],
      recommendedPhrasesFr: [
        'J’ai un moment d’inquiétude et besoin d’un câlin, mais je sais que nous sommes solides.',
        'J’ai besoin de silence pendant 30 minutes, mais je t’aime et je reviens vers toi pour le dîner.',
      ],
      recommendedPhrasesEn: [
        'I feel a flash of worry and could use a warm hug, but I know our connection is solid.',
        'I need 30 minutes of quiet to recharge, but I love you and will come right back to you for dinner.',
      ],
      scientificReference: 'Levine, A., & Heller, R. (2010). Attached: The New Science of Adult Attachment.',
      confidenceScore: 0.95,
      sourceType: 'clinical_framework',
      updatedAt: '2026-03-01T10:00:00Z',
    },
    {
      id: 'kb_cnv_osbd',
      titleFr: 'Communication Non-Violente (OSBD - Marshall Rosenberg)',
      titleEn: 'Nonviolent Communication (OFNR - Marshall Rosenberg)',
      category: 'communication',
      summaryFr: 'Exprimer ses besoins profonds sans accuser ni déclencher l’agressivité défensive chez l’autre.',
      summaryEn: 'Expressing vulnerable needs without triggering defensiveness or weaponized accusations.',
      keyPrinciplesFr: [
        'Observation : Décrire les faits sans évaluation ("Hier, le message est resté sans réponse" au lieu de "Tu m’ignores")',
        'Sentiment : Nommer son ressenti réel ("Je me suis senti triste") plutôt qu’un jugement déguisé ("Je me suis senti trahi")',
        'Besoin : Identifier le besoin universel sous-jacent (sécurité, partage, reconnaissance, clarté)',
        'Demande : Formuler une requête concrète, positive, négociable dans le présent',
      ],
      keyPrinciplesEn: [
        'Observation: State factual observations without judgment ("Yesterday the text had no reply" vs "You always ignore me")',
        'Feeling: Express authentic bodily feelings ("I felt sad and lonely") rather than masked thoughts ("I felt disrespected")',
        'Need: Uncover the universal underlying need (connection, safety, clarity, mutuality)',
        'Request: Make a clear, actionable, positive, and negotiable request in the present moment',
      ],
      recommendedPhrasesFr: [
        'Quand nous nous disputons devant des amis, je me sens vulnérable parce que j’ai besoin d’un espace de confiance. Serais-tu d’accord pour que nous en discutions en privé à la maison ?',
      ],
      recommendedPhrasesEn: [
        'When we argue in public, I feel anxious because I value mutual safety. Would you be willing to pause and discuss this privately at home?',
      ],
      scientificReference: 'Rosenberg, M. B. (2003). Nonviolent Communication: A Language of Life.',
      confidenceScore: 0.99,
      sourceType: 'clinical_framework',
      updatedAt: '2026-03-01T10:00:00Z',
    },
    {
      id: 'kb_breakup_neurobiology',
      titleFr: 'Neurobiologie du Chagrin d’Amour et Sevrage Affectif',
      titleEn: 'Neurobiology of Heartbreak and Emotional Withdrawal',
      category: 'breakup',
      summaryFr: 'Comprendre pourquoi une rupture amoureuse active les mêmes circuits cérébraux que la douleur physique et le sevrage d’addiction.',
      summaryEn: 'Understanding why heartbreak stimulates identical brain pathways as physical pain and chemical withdrawal.',
      keyPrinciplesFr: [
        'L’IRM fonctionnelle montre que le rejet amoureux active le cortex insulaire et cingulaire antérieur (douleur corporelle réelle)',
        'La chute brutale de dopamine et d’ocytocine crée une fringale obsessionnelle (vouloir vérifier le profil ou envoyer un message)',
        'Le contact "zéro" n’est pas une punition contre l’autre, mais une cure de désintoxication neurochimique nécessaire au cerveau',
        'La reconstruction s’accélère par de nouvelles sources de dopamine saine : activité physique, projets créatifs, liens amicaux bienveillants',
      ],
      keyPrinciplesEn: [
        'fMRI studies show romantic rejection lights up the dorsal anterior cingulate cortex (genuine physical pain networks)',
        'Sudden plummeting of dopamine and oxytocin triggers addictive craving loops (compulsion to check socials or text)',
        'No-contact is not a cruel punishment against the ex, but essential neural detox to allow neuroreceptors to stabilize',
        'Healing accelerates through novel healthy dopamine: regular cardiovascular exercise, creative projects, loyal friendships',
      ],
      recommendedPhrasesFr: [
        'Je reconnais que mon envie de lui écrire est un pic de manque neurochimique. Je respire et j’attends 24 heures avant tout geste.',
      ],
      recommendedPhrasesEn: [
        'I recognize that this urge to reach out is a neurochemical craving wave. I pause, breathe, and honor my dignity for 24 hours.',
      ],
      scientificReference: 'Fisher, H. E., et al. (2010). Reward, Addiction, and Emotion Regulation Systems Associated with Rejection in Love. Journal of Neurophysiology.',
      confidenceScore: 0.94,
      sourceType: 'empirical_study',
      updatedAt: '2026-03-01T10:00:00Z',
    },
    {
      id: 'kb_emotional_attunement_eft',
      titleFr: 'Accordage Émotionnel & Thérapie de Couple (Sue Johnson)',
      titleEn: 'Emotional Attunement & Couple Therapy (Sue Johnson / EFT)',
      category: 'intimacy',
      summaryFr: 'Sortir des reproches superficiels pour toucher la vulnérabilité primaire et reconnecter le lien d’attachement.',
      summaryEn: 'Shifting from surface complaints to primary emotional vulnerability and restoring secure attachment.',
      keyPrinciplesFr: [
        'Derrière la colère se cache presque toujours la peur de ne pas compter pour l’autre ou d’être abandonné(e)',
        'Quand un partenaire exprime sa vulnérabilité nue ("J’ai eu peur que tu ne m’aimes plus"), la défense de l’autre s’effondre instantanément',
        'La question fondamentale du couple selon Sue Johnson : "Es-tu là pour moi si j’ai besoin de toi ?" (A.R.E: Accessible, Responsive, Engaged)',
      ],
      keyPrinciplesEn: [
        'Behind surface anger usually lies profound fear of not mattering to the partner or being cast aside',
        'When one partner shares unarmored vulnerability ("I felt frightened you no longer love me"), defensive armor melts',
        'The foundational couple question according to Sue Johnson: "Are you there for me?" (A.R.E: Accessible, Responsive, Engaged)',
      ],
      recommendedPhrasesFr: [
        'Quand tu es rentré tard sans prévenir, je n’étais pas seulement agacé(e), j’ai eu peur de ne plus être ta priorité.',
      ],
      recommendedPhrasesEn: [
        'When you arrived late without sending word, I wasn’t just annoyed—I felt a deep ache that maybe I wasn’t a priority to you.',
      ],
      scientificReference: 'Johnson, S. (2008). Hold Me Tight: Seven Conversations for a Lifetime of Love.',
      confidenceScore: 0.97,
      sourceType: 'clinical_framework',
      updatedAt: '2026-03-01T10:00:00Z',
    },
    {
      id: 'kb_boundaries_tawwab',
      titleFr: 'Poser des Limites Claires sans Culpabilité (Nedra Glover Tawwab)',
      titleEn: 'Setting Healthy Boundaries without Guilt (Nedra Glover Tawwab)',
      category: 'communication',
      summaryFr: 'Les limites ne sont pas des punitions contre l’autre, mais des ponts qui préservent l’amour et empêchent le ressentiment.',
      summaryEn: 'Boundaries are not walls or punishments, but guidelines that preserve love and prevent silent resentment.',
      keyPrinciplesFr: [
        'Une limite saine s’exprime calmement, sans justification excessive ni agressivité',
        'Le ressentiment intérieur est le premier signal qu’une limite personnelle a été franchie sans être formulée',
        'Être direct avec douceur évite la manipulation passive-agressive',
        'Respecter les limites du partenaire est la condition absolue d’une sécurité affective durable',
      ],
      keyPrinciplesEn: [
        'A healthy boundary is communicated clearly, calmly, without over-explaining or defensive hostility',
        'Inner resentment is the earliest warning sign that an unspoken boundary was breached',
        'Gentle directness prevents passive-aggressive erosion of trust',
        'Honoring a partner boundaries is the foundational prerequisite of emotional security',
      ],
      recommendedPhrasesFr: [
        'Je tiens énormément à nous, mais j’ai besoin que nous ne discutions pas de ce sujet sensible quand nous sommes épuisés.',
        'Je suis là pour t’écouter, mais je ne peux pas accepter que tu élèves la voix contre moi.',
      ],
      recommendedPhrasesEn: [
        'I care deeply about us, but I need us to pause this conversation when we are exhausted and revisit it tomorrow.',
        'I am here with you, but I need us to speak without shouting.',
      ],
      scientificReference: 'Tawwab, N. G. (2021). Set Boundaries, Find Peace: A Guide to Reclaiming Yourself.',
      confidenceScore: 0.96,
      sourceType: 'clinical_framework',
      updatedAt: '2026-03-01T10:00:00Z',
    },
    {
      id: 'kb_somatic_regulation',
      titleFr: 'Fenêtre de Tolérance & Régulation Somatique (Dr. Dan Siegel)',
      titleEn: 'Window of Tolerance & Somatic Regulation (Dr. Dan Siegel)',
      category: 'science',
      summaryFr: 'Réguler le système nerveux avant de chercher à résoudre un désaccord pour éviter l’escalade ou la sidération.',
      summaryEn: 'Down-regulating autonomic nervous arousal before attempting to solve conflicts to prevent fight-or-flight flooding.',
      keyPrinciplesFr: [
        'En hyper-activation (colère, anxiété aiguë), le cortex préfrontal rationnel est temporairement déconnecté',
        'La technique somatique 5-4-3-2-1 et le double soupir physiologique réactivent le nerf vague et le calme corporel en 2 minutes',
        'Aucune décision de rupture ou d’accord de couple ne doit être prise en état de surcharge émotionnelle',
      ],
      keyPrinciplesEn: [
        'During hyper-arousal (acute rage or panic), the rational prefrontal cortex is neurologically offline',
        'The 5-4-3-2-1 sensory grounding and physiological sigh re-engage the vagus nerve and physical safety within minutes',
        'Never make permanent relationship decisions during temporary nervous system flooding',
      ],
      recommendedPhrasesFr: [
        'Mon système nerveux est en surchauffe en ce moment. Respirons 3 minutes ensemble avant de reprendre.',
      ],
      recommendedPhrasesEn: [
        'My body is overwhelmed right now. Let’s breathe together for two minutes before we talk further.',
      ],
      scientificReference: 'Siegel, D. J. (2012). The Developing Mind: Toward a Neurobiology of Interpersonal Experience.',
      confidenceScore: 0.98,
      sourceType: 'clinical_framework',
      updatedAt: '2026-03-01T10:00:00Z',
    },
    {
      id: 'kb_text_negativity_bias',
      titleFr: 'Biais de Négativité dans les Messages Écrits (Mehrabian / Pillemer)',
      titleEn: 'Text Messaging Negativity Bias (Mehrabian / Pillemer)',
      category: 'dating',
      summaryFr: 'Comprendre pourquoi les messages écrits courts sont naturellement interprétés comme froids ou hostiles par le cerveau.',
      summaryEn: 'Understanding why ambiguous or brief texts are inherently misinterpreted as cold or hostile by the human brain.',
      keyPrinciplesFr: [
        'À l’écrit, 93% des indices de communication (regard, intonation, micro-expressions) sont absents',
        'Le cerveau anxieux comble automatiquement l’ambiguïté par le pire scénario possible',
        'Toujours vérifier l’intention réelle par un appel ou de vive voix plutôt que par une surenchère de SMS',
      ],
      keyPrinciplesEn: [
        'In text messaging, 93% of non-verbal cues (vocal warmth, micro-smiles, body presence) are absent',
        'An anxious brain instinctively fills ambiguous silence with rejection scenarios',
        'Always clarify real intentions in person or over phone instead of escalating via text',
      ],
      recommendedPhrasesFr: [
        'J’ai un doute sur la façon de lire ton message, préfères-tu qu’on s’appelle 2 minutes ce soir ?',
      ],
      recommendedPhrasesEn: [
        'I want to make sure I am reading your message in the spirit you intended. Would you like a quick 2-minute call tonight?',
      ],
      scientificReference: 'Kruger, J., et al. (2005). Egocentrism over the wire: Can people communicate through email? JPSP.',
      confidenceScore: 0.95,
      sourceType: 'empirical_study',
      updatedAt: '2026-03-01T10:00:00Z',
    },
  ];

  // Retrieve relevant knowledge articles based on query keywords or category
  searchKnowledge(query: string, category?: string, limit: number = 3): KnowledgeItem[] {
    const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    
    let scored = this.knowledgeItems.map(item => {
      let score = 0;
      if (category && item.category === category) score += 5;

      const searchableText = `${item.titleFr} ${item.titleEn} ${item.summaryFr} ${item.summaryEn} ${item.keyPrinciplesFr.join(' ')} ${item.keyPrinciplesEn.join(' ')}`.toLowerCase();

      for (const token of tokens) {
        if (searchableText.includes(token)) score += 2;
      }

      return { item, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.filter(s => s.score > 0).slice(0, limit).map(s => s.item);
  }

  getAllItems(): KnowledgeItem[] {
    return [...this.knowledgeItems];
  }

  getItemById(id: string): KnowledgeItem | undefined {
    return this.knowledgeItems.find(k => k.id === id);
  }

  addItem(item: KnowledgeItem): void {
    // Check if ID exists, if so update, else prepend
    const existingIndex = this.knowledgeItems.findIndex(k => k.id === item.id);
    if (existingIndex >= 0) {
      this.knowledgeItems[existingIndex] = item;
    } else {
      this.knowledgeItems.unshift(item);
    }
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
