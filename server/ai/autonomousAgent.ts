import { orchestrator } from './orchestrator';
import { knowledgeBaseService } from './knowledgeBase';
import { IntimaBehaviorEngine } from './intimaBehavior';
import { ProviderRequest, ProviderResponse, AgentQualityAssessment, SearchSource, SupportedLanguage } from './types';

export class IntimaAutonomousAgent {
  // Evaluates whether real-world research, scientific studies, or lived couples' testimonies are beneficial
  private shouldTriggerWebResearch(lastMessageText: string, primaryRole: string): boolean {
    if (primaryRole === 'documented_expert') return true;

    const text = lastMessageText.toLowerCase();
    const researchKeywords = [
      'témoignage', 'temoignage', 'experience', 'histoire', 'vécu', 'cherche', 'étude', 'etude',
      'statistique', 'gottman', 'science', 'psychologie', 'pourcentage', 'd’autres couples', 'comment font les autres',
      'reconciliation', 'rupture', 'infidélité', 'trompé', 'avis', 'research', 'study', 'stories', 'testimonial',
      'real couples', 'scientific', 'attachment style', 'statistics', 'divorce rate'
    ];

    return researchKeywords.some((kw) => text.includes(kw));
  }

  // Autonomous self-evaluation of the synthesized response quality
  private evaluateResponseQuality(
    response: ProviderResponse,
    language: SupportedLanguage,
    safetyAlert: boolean
  ): AgentQualityAssessment {
    const text = response.content;
    const hasFacts = !!response.facts && response.facts.length > 5;
    const hasHypotheses = !!response.hypotheses && response.hypotheses.length > 5;
    const hasSuggestion = !!response.suggestedAction && response.suggestedAction.length > 5;

    // Empathy detection: checks presence of soothing, validating phrases
    const empathyMarkersFr = ['je comprends', 'ressens', 'douceur', 'cœur', 'espace', 'apaiser', 'légitime', 'prends le temps', 'respire'];
    const empathyMarkersEn = ['i hear', 'i feel', 'warmth', 'gentle', 'safe', 'soothe', 'valid', 'breathe', 'honor your'];
    const markers = language === 'en' ? empathyMarkersEn : empathyMarkersFr;
    const empathyHits = markers.filter((m) => text.toLowerCase().includes(m)).length;
    const empathyScore = Math.min(100, 70 + empathyHits * 7);

    // Fact vs assumption clarity: 100 if both separated, 80 if implicit
    const factAssumptionClarityScore = hasFacts && hasHypotheses ? 98 : hasFacts || hasHypotheses ? 85 : 75;

    // Non-judgment & anti-manipulation score:
    // Strictly forbid toxic suggestions (spying, revenge, coercion)
    const toxicMarkers = [
      'tu es toxique', 'c’est ta faute', 'tu as tort', 'fouille son portable', 'espionne', 'venge-toi',
      'fais-lui payer', 'ignore-le pour le punir', 'you are toxic', 'your fault', 'spy on', 'punish them'
    ];
    const hasToxic = toxicMarkers.some((w) => text.toLowerCase().includes(w));
    const nonJudgmentScore = hasToxic ? 40 : 99;

    // Actionability score: presence of ready-to-use "I" phrases
    const actionabilityScore = hasSuggestion ? 95 : text.includes('"') || text.includes('«') ? 85 : 75;

    // Emergency assistance bonus verification if safety alert
    let safetyScoreBonus = 0;
    if (safetyAlert) {
      const emergencyHelplineMentioned = /3919|3114|17|112|988|1-800-799-SAFE|helpline|urgence/i.test(text);
      if (emergencyHelplineMentioned) {
        safetyScoreBonus = 5;
      }
    }

    const overallScore = Math.min(
      100,
      Math.round(
        empathyScore * 0.3 + factAssumptionClarityScore * 0.3 + nonJudgmentScore * 0.2 + actionabilityScore * 0.2 + safetyScoreBonus
      )
    );

    const evaluationNotes = language === 'en'
      ? `Audit: Empathy ${empathyScore}%, Fact/Assumption distinction: ${factAssumptionClarityScore}%, Ethics: ${nonJudgmentScore}%, Actionability: ${actionabilityScore}%.`
      : `Audit: Empathie ${empathyScore}%, Distinction Faits/Suppositions: ${factAssumptionClarityScore}%, Éthique: ${nonJudgmentScore}%, Actionnabilité: ${actionabilityScore}%.`;

    return {
      empathyScore,
      factAssumptionClarityScore,
      nonJudgmentScore,
      actionabilityScore,
      overallScore,
      evaluationNotes,
    };
  }

  // Run the complete autonomous agent cycle
  async processCycle(request: ProviderRequest): Promise<ProviderResponse> {
    const lastUserMessage = [...request.messages].reverse().find((m) => m.role === 'user')?.content || '';
    const isEnglish = request.language === 'en';

    // Step 1: Detect specific relational role & intent
    const detectedIntent = IntimaBehaviorEngine.analyzeIntent(lastUserMessage, {
      ...request.userContext,
      language: request.language,
    });

    // Step 2: Query internal Knowledge Base for relevant psychological frameworks
    // Map detected role to primary knowledge category if appropriate
    let targetCategory = request.userContext?.topic;
    if (detectedIntent.primaryRole === 'couple_mediator') targetCategory = 'conflict_resolution';
    if (detectedIntent.primaryRole === 'dating_counselor') targetCategory = 'dating';
    if (detectedIntent.primaryRole === 'personal_coach') targetCategory = 'communication';

    const relevantKnowledge = knowledgeBaseService.searchKnowledge(lastUserMessage, targetCategory, 2);
    let enrichedContext = { ...request.userContext };

    if (relevantKnowledge.length > 0) {
      const kbSnippets = relevantKnowledge.map((k) => {
        const title = isEnglish ? k.titleEn : k.titleFr;
        const principles = isEnglish ? k.keyPrinciplesEn : k.keyPrinciplesFr;
        return `[Clinical Framework: ${title}]\n- Principles: ${principles.slice(0, 2).join(' | ')}`;
      });

      enrichedContext.memories = [
        ...(enrichedContext.memories || []),
        ...kbSnippets,
      ];
    }

    // Step 3: Autonomous Decision on Web Grounding / Testimonies
    const shouldSearchWeb = this.shouldTriggerWebResearch(lastUserMessage, detectedIntent.primaryRole) || !!request.enableWebResearch;

    const orchestratorRequest: ProviderRequest = {
      ...request,
      userContext: enrichedContext,
      enableWebResearch: shouldSearchWeb,
    };

    // Step 4: Synthesis through Orchestrator (with cascading model fallback)
    const rawResponse = await orchestrator.execute(orchestratorRequest);

    // Step 5: Autonomous Quality Assessment & Self-Reflection
    const qualityAssessment = this.evaluateResponseQuality(rawResponse, request.language, detectedIntent.safetyAlert);

    // Step 6: Augment sources with Knowledge Base references if helpful
    let combinedSources: SearchSource[] = [...(rawResponse.sources || [])];
    if (relevantKnowledge.length > 0 && combinedSources.length < 3) {
      for (const kb of relevantKnowledge) {
        if (!combinedSources.some((s) => s.title.includes(kb.titleFr) || s.title.includes(kb.titleEn))) {
          combinedSources.push({
            title: isEnglish ? kb.titleEn : kb.titleFr,
            url: '#knowledge-base',
            snippet: isEnglish ? kb.summaryEn : kb.summaryFr,
            sourceType: kb.sourceType === 'empirical_study' ? 'scientific_research' : 'expert_guide',
            attribution: kb.scientificReference || (isEnglish ? 'INTIMA Curated Relationship Science' : 'Science Relationnelle Certifiée INTIMA'),
            publishedDate: kb.updatedAt.split('T')[0],
          });
        }
      }
    }

    return {
      ...rawResponse,
      sources: combinedSources.length > 0 ? combinedSources.slice(0, 4) : undefined,
      qualityAssessment,
    };
  }
}

export const intimaAgent = new IntimaAutonomousAgent();
