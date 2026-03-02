import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { buildSocialPrompt, buildEmailPrompt, buildAdsPrompt } from './prompts.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
app.use(express.static(join(__dirname, 'public')));

// GEMINI API caller
async function callGemini(prompt) {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('Cle API Gemini manquante. Verifie le fichier .env.');
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
    throw new Error('Gemini a retourne une reponse vide.');
  }

  return text;
}

function stripCodeFences(raw) {
  return String(raw || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

function extractFirstJsonObject(raw) {
  const text = stripCodeFences(raw);
  const firstBrace = text.indexOf('{');

  if (firstBrace === -1) return text;

  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let i = firstBrace; i < text.length; i += 1) {
    const ch = text[i];

    if (escaping) {
      escaping = false;
      continue;
    }

    if (ch === '\\') {
      escaping = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(firstBrace, i + 1);
      }
    }
  }

  return text;
}

function parseJsonLoose(raw) {
  const candidate = extractFirstJsonObject(raw);

  try {
    return JSON.parse(candidate);
  } catch (_) {
    const withoutTrailingCommas = candidate.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(withoutTrailingCommas);
  }
}

function pickFirst(obj, keys) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] != null) {
      return obj[key];
    }
  }
  return null;
}

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n|[;|]/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  return [];
}

function parseEmailJson(raw) {
  try {
    const parsed = parseJsonLoose(raw);
    const emailObj = parsed?.email && typeof parsed.email === 'object' ? parsed.email : parsed;

    const subject = String(pickFirst(emailObj, ['subject', 'objet']) || '').trim();
    const preview = String(pickFirst(emailObj, ['preview', 'preheader', 'apercu']) || '').trim();
    let body = String(pickFirst(emailObj, ['body', 'content', 'message']) || '').trim();

    if (!subject && !body) {
      throw new Error('Objet et corps absents dans la reponse email.');
    }

    body = body
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t');

    return { ok: true, data: { subject, preview, body } };
  } catch (e) {
    return { ok: false, error: e.message, raw };
  }
}

function parseAdsJson(raw) {
  try {
    const parsed = parseJsonLoose(raw);
    const adsObj = parsed?.ads && typeof parsed.ads === 'object' ? parsed.ads : parsed;

    const data = {
      placement: String(pickFirst(adsObj, ['placement', 'platform', 'placementName']) || 'Meta Ads'),
      primaryTexts: ensureArray(
        pickFirst(adsObj, ['primaryTexts', 'primaryText', 'primary_texts', 'textesPrincipaux'])
      ),
      headlines: ensureArray(
        pickFirst(adsObj, ['headlines', 'titles', 'titres'])
      ),
      descriptions: ensureArray(
        pickFirst(adsObj, ['descriptions', 'description', 'descs'])
      ),
      ctas: ensureArray(
        pickFirst(adsObj, ['ctas', 'cta', 'callToActions', 'buttons'])
      )
    };

    const required = ['primaryTexts', 'headlines', 'descriptions', 'ctas'];
    for (const key of required) {
      if (data[key].length === 0) {
        throw new Error(`Champ manquant ou vide : ${key}`);
      }
    }

    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e.message, raw };
  }
}

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

    const emailRaw = email.status === 'fulfilled' ? email.value : null;
    const emailParsed = emailRaw ? parseEmailJson(emailRaw) : null;

    const adsRaw = ads.status === 'fulfilled' ? ads.value : null;
    const adsParsed = adsRaw ? parseAdsJson(adsRaw) : null;

    return res.json({
      social: social.status === 'fulfilled' ? social.value : null,
      email: emailParsed?.ok ? emailParsed.data : null,
      emailRaw: !emailParsed?.ok && emailRaw ? emailRaw : null,
      ads: adsParsed?.ok ? adsParsed.data : null,
      adsRaw: !adsParsed?.ok && adsRaw ? adsRaw : null,
      errors: {
        social: social.status === 'rejected' ? social.reason?.message || 'Generation echouee.' : null,
        email:
          email.status === 'rejected'
            ? email.reason?.message || 'Generation echouee.'
            : !emailParsed?.ok
              ? `Erreur de parsing JSON email : ${emailParsed?.error}`
              : null,
        ads:
          ads.status === 'rejected'
            ? ads.reason?.message || 'Generation echouee.'
            : !adsParsed?.ok
              ? `Erreur de parsing JSON ads : ${adsParsed?.error}`
              : null
      }
    });
  } catch (error) {
    console.error('Erreur generation :', error);
    return res.status(500).json({ error: 'Une erreur est survenue. Reessayez.' });
  }
});

app.use((error, req, res, next) => {
  console.error('Erreur serveur non geree :', error);
  if (res.headersSent) return next(error);
  return res.status(500).json({ error: 'Erreur serveur inattendue.' });
});

// Export for Vercel (replaces app.listen)
export default app;
