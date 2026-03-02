import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { buildSocialPrompt, buildEmailPrompt, buildAdsPrompt } from './prompts.js';

dotenv.config();

const app = express();

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.GOOGLE_API_KEY ||
    ''
  ).trim();
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// GEMINI API CALLER

async function callGemini(prompt) {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('Clé API Gemini manquante. Vérifie le fichier .env.');
  }

  const safePrompt = typeof prompt === 'string' ? prompt.trim() : '';
  if (!safePrompt) {
    throw new Error('Le prompt est vide.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: safePrompt }] }],
        generationConfig: {
          maxOutputTokens: 8000,
          temperature: 0.75
        }
      })
    });
  } catch (error) {
    throw new Error(`Impossible de contacter l'API Gemini : ${error.message}`);
  }

  if (!response.ok) {
    const errPayload = await response.json().catch(() => ({}));
    throw new Error(errPayload?.error?.message || `Erreur Gemini (${response.status})`);
  }

  const data = await response.json().catch(() => ({}));
  const text = data?.candidates?.[0]?.content?.parts
    ?.map(part => part?.text || '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini a retourné une réponse vide.');
  }

  return text;
}

// PARSE ADS JSON

function parseAdsJson(raw) {
  try {
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    const required = ['primaryTexts', 'headlines', 'descriptions', 'ctas'];
    for (const key of required) {
      if (!Array.isArray(parsed[key]) || parsed[key].length === 0) {
        throw new Error(`Champ manquant ou vide : ${key}`);
      }
    }

    if (!parsed.placement) parsed.placement = 'Meta Ads';

    return { ok: true, data: parsed };
  } catch (e) {
    return { ok: false, error: e.message, raw };
  }
}

// GENERATE ENDPOINT

app.post('/api/generate', async (req, res) => {
  try {
    const ctx = req.body;

    if (!ctx || !ctx.destination) {
      return res.status(400).json({ error: 'Destination manquante.' });
    }

    const [social, email, ads] = await Promise.allSettled([
      callGemini(buildSocialPrompt(ctx)),
      callGemini(buildEmailPrompt(ctx)),
      callGemini(buildAdsPrompt(ctx))
    ]);

    const adsRaw = ads.status === 'fulfilled' ? ads.value : null;
    const adsParsed = adsRaw ? parseAdsJson(adsRaw) : null;

    return res.json({
      social: social.status === 'fulfilled' ? social.value : null,
      email:  email.status  === 'fulfilled' ? email.value  : null,
      ads:    adsParsed?.ok ? adsParsed.data : null,
      adsRaw: (!adsParsed?.ok && adsRaw) ? adsRaw : null,
      errors: {
        social: social.status === 'rejected' ? social.reason?.message || 'Génération échouée.' : null,
        email:  email.status  === 'rejected' ? email.reason?.message  || 'Génération échouée.' : null,
        ads:    ads.status    === 'rejected' ? ads.reason?.message    || 'Génération échouée.'
               : (!adsParsed?.ok) ? `Erreur de parsing JSON : ${adsParsed?.error}` : null
      }
    });

  } catch (error) {
    console.error('Erreur génération :', error);
    return res.status(500).json({ error: 'Une erreur est survenue. Réessayez.' });
  }
});

// ERROR HANDLER

app.use((error, req, res, next) => {
  console.error('Erreur serveur non gérée :', error);
  if (res.headersSent) return next(error);
  return res.status(500).json({ error: 'Erreur serveur inattendue.' });
});

// Export for Vercel (replaces app.listen)
export default app;
