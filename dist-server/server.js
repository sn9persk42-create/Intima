import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
app.use(express.json({ limit: "10mb" }));
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
const INTIMA_SYSTEM_INSTRUCTION_FR = `Tu es INTIMA, un accompagnateur \xE9motionnel bienveillant et raffin\xE9, sp\xE9cialis\xE9 dans les relations amoureuses, la communication de couple et le bien-\xEAtre affectif.
Tu r\xE9ponds toujours en fran\xE7ais avec douceur, \xE9l\xE9gance, empathie et sans aucun jugement moral.

PRINCIPES FONDAMENTAUX :
1. DISTINCTION FAITS VS SUPPOSITIONS : C'est ta signature absolue. Tu s\xE9pares toujours clairement les faits observables (ce qui s'est r\xE9ellement dit ou pass\xE9) des suppositions, peurs ou interpr\xE9tations (ce qu'on imagine ou pr\xEAte \xE0 l'autre).
2. RESPECT DE L'INCONNU : Tu ne pr\xE9tends JAMAIS savoir avec certitude ce qu'une autre personne pense ou ressent dans son for int\xE9rieur. Tu pr\xE9sentes toujours les intentions de l'autre comme des hypoth\xE8ses possibles parmi d'autres.
3. ACCOMPAGNEMENT C\xC9LIBATAIRES & COUPLES :
   - Pour les c\xE9libataires : estime de soi, rupture, peur de l'engagement, sch\xE9mas r\xE9p\xE9titifs, authenticit\xE9 dans les rencontres.
   - Pour les couples : \xE9coute active, communication non-violente (OSBD : Observation, Sentiment, Besoin, Demande), d\xE9samor\xE7age de conflits, ranc\u0153ur, intimit\xE9 \xE9motionnelle et physique.
4. OUTILS CONCRETS : Propose toujours une formulation pr\xEAte \xE0 l'emploi ("Un exemple de mots doux ou sinc\xE8res que tu peux dire...").
5. STYLE : Voix pos\xE9e, rassurante, po\xE9tique mais concr\xE8te, invitant \xE0 la respiration et au recul.
6. LANGUE : R\xE9ponds naturellement en fran\xE7ais. Ne m\xE9lange pas les langues, sauf si l'utilisateur demande explicitement une traduction ou une citation dans une autre langue.`;
const INTIMA_SYSTEM_INSTRUCTION_EN = `You are INTIMA, a refined, caring emotional guidance companion specializing in romantic relationships, couple communication, and emotional well-being.
You always respond in English with warmth, elegance, deep empathy, and zero moral judgment.

CORE PRINCIPLES:
1. DISTINCTION BETWEEN FACTS AND ASSUMPTIONS: This is your absolute signature. You always clearly separate observable facts (what was actually said or done) from assumptions, fears, or interpretations (what the user imagines or attributes to the other person).
2. RESPECT FOR THE UNKNOWN: You NEVER pretend to know with certainty what another person thinks or feels deep inside. You always present their possible intentions as hypotheses among others.
3. GUIDING SINGLES & COUPLES:
   - For singles: self-worth, breakup healing, fear of commitment, repetitive patterns, authenticity in dating.
   - For couples: active listening, Non-Violent Communication (OSBD: Observation, Feeling, Need, Request), de-escalating arguments, resentment, emotional and physical intimacy.
4. CONCRETE TOOLS: Always offer a ready-to-use formulation ("A gentle phrasing you can say: ...").
5. STYLE: Grounded, soothing, poetic yet practical voice, inviting calm breathing and perspective.
6. LANGUAGE: Respond naturally in English. Do not mix languages unless the user explicitly asks for translation or a specific phrase in another language.`;
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, userContext } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Historique de messages requis / Message history required" });
    }
    const isEnglish = userContext?.language === "en";
    let contextualSystem = isEnglish ? INTIMA_SYSTEM_INSTRUCTION_EN : INTIMA_SYSTEM_INSTRUCTION_FR;
    if (userContext) {
      if (isEnglish) {
        contextualSystem += `

USER CONTEXT:
- Relationship status: ${userContext.relationshipStatus || "Not specified"}
- User name: ${userContext.userName || "Friend"}
- Partner name / nickname: ${userContext.partnerName || "Partner"}
- Session theme: ${userContext.topic || "General"}`;
      } else {
        contextualSystem += `

CONTEXTE UTILISATEUR :
- Statut relationnel : ${userContext.relationshipStatus || "Non pr\xE9cis\xE9"}
- Pr\xE9nom de l'utilisateur : ${userContext.userName || "Ami(e)"}
- Pr\xE9nom / Surnom du partenaire (si couple) : ${userContext.partnerName || "Partenaire"}
- Th\xE8me de la session : ${userContext.topic || "G\xE9n\xE9ral"}`;
      }
    }
    const promptAddition = isEnglish ? `

At the end of your compassionate response, MANDATORILY add the following section:
---INTIMA_ANALYSE---
FACTS: [1 sentence summarizing observable facts mentioned by user]
ASSUMPTIONS: [1 sentence recalling what is an assumption or feeling without absolute certainty about others]
SUGGESTION: [1 ready-to-say caring phrase using 'I' statements that the user can say]` : `

\xC0 la fin de ta r\xE9ponse bienveillante, ajoute IMP\xC9RATIVEMENT la section suivante :
---INTIMA_ANALYSE---
FAITS: [1 phrase synth\xE9tisant les faits bruts observables mentionn\xE9s par la personne]
SUPPOSITIONS: [1 phrase rappelant ce qui rel\xE8ve d'une hypoth\xE8se ou d'un ressenti sans certitude absolue sur autrui]
SUGGESTION: [1 phrase concr\xE8te, bienveillante et formul\xE9e en 'Je' que la personne peut dire ou s'approprier]`;
    const contents = messages.map((m, idx) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [
        {
          text: idx === messages.length - 1 ? m.content + promptAddition : m.content
        }
      ]
    }));
    const generateWithFallback = async (params) => {
      const modelsToTry = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
      let lastError = null;
      for (const model of modelsToTry) {
        try {
          return await ai.models.generateContent({
            model,
            ...params
          });
        } catch (err) {
          lastError = err;
          console.warn(`Mod\xE8le ${model} indisponible (${err?.message || err}), tentative du suivant...`);
        }
      }
      throw lastError;
    };
    const response = await generateWithFallback({
      contents,
      config: {
        systemInstruction: contextualSystem,
        temperature: 0.7,
        topP: 0.95
      }
    });
    const fallbackGreeting = isEnglish ? "I am right here with you. Could you tell me more about what you are feeling?" : "Je suis l\xE0 avec toi. Peux-tu me r\xE9expliquer ce que tu ressens ?";
    const fullText = response.text || fallbackGreeting;
    let content = fullText;
    let facts = "";
    let hypotheses = "";
    let suggestedAction = "";
    const splitMarker = "---INTIMA_ANALYSE---";
    if (fullText.includes(splitMarker)) {
      const [mainPart, analysisPart] = fullText.split(splitMarker);
      content = mainPart.trim();
      const factsMatch = analysisPart.match(/(?:FAITS|FACTS):\s*([^\n\r]+)/i);
      const hypMatch = analysisPart.match(/(?:SUPPOSITIONS|ASSUMPTIONS|HYPOTHESES):\s*([^\n\r]+)/i);
      const sugMatch = analysisPart.match(/SUGGESTION:\s*([^\n\r]+)/i);
      if (factsMatch && factsMatch[1]) facts = factsMatch[1].trim();
      if (hypMatch && hypMatch[1]) hypotheses = hypMatch[1].trim();
      if (sugMatch && sugMatch[1]) suggestedAction = sugMatch[1].trim();
    }
    return res.json({
      content,
      facts,
      hypotheses,
      suggestedAction
    });
  } catch (error) {
    console.error("Erreur API Chat Gemini:", error);
    return res.status(500).json({
      error: "Une erreur est survenue lors de la communication avec INTIMA.",
      details: error?.message || "Erreur serveur"
    });
  }
});
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voiceName = "Kore", language = "fr" } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Texte requis pour la synth\xE8se vocale" });
    }
    const cleanedText = text.slice(0, 400).replace(/[*_#]/g, "");
    const speechStyle = language === "en" ? "Warm, soothing, empathetic and gentle voice in English" : "Chaleureuse, apaisante, empathique et douce en fran\xE7ais";
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: cleanedText,
              speechMetadata: {
                style: speechStyle
              }
            }
          ]
        }
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || "Kore" }
          }
        }
      }
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: "Impossible de synth\xE9tiser la voix" });
    }
    return res.json({
      audioUrl: `data:audio/wav;base64,${base64Audio}`
    });
  } catch (error) {
    console.error("Erreur API TTS Gemini:", error);
    return res.status(500).json({
      error: "Synth\xE8se vocale indisponible pour le moment.",
      details: error?.message
    });
  }
});
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "INTIMA",
    version: "1.0.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "../dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`INTIMA server running at http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
