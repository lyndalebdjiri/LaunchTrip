// prompts.js — LaunchTrip
// All prompts follow the real Algerian travel
// agency market format extracted from 19+ posts.


import { ALGERIA_CONTEXT_FR, ALGERIA_CONTEXT_AR } from './public/Js/algeria-context.js';


// helpers HELPERS


function validateCriticalFields(ctx) {
  const errors = [];

  if (!ctx.destination || ctx.destination.trim() === '') {
    errors.push('destination');
  }

  if (!ctx.tripType || ctx.tripType.trim() === '') {
    errors.push('tripType');
  }

  return errors;
}

function getContext(language) {
  if (language === 'arabic') return ALGERIA_CONTEXT_AR;
  if (language === 'mix') return ALGERIA_CONTEXT_FR + '\n\n' + ALGERIA_CONTEXT_AR;
  return ALGERIA_CONTEXT_FR; // default: french
}

function formatPrice(price) {
  if (!price && price !== 0) return null;
  // Strip spaces, commas, dots used as thousand separators before parsing
  const cleaned = String(price).replace(/[\s,\.]/g, '');
  const num = parseInt(cleaned, 10);
  if (isNaN(num) || num <= 0) return null;
  // Algerian format: space as thousands separator
  return num.toLocaleString('fr-FR') + ' DA';
}

function buildAgencyInstruction(ctx) {
  const lines = [];

  if (ctx.agencyName)
    lines.push(`- Nom de l'agence : ${ctx.agencyName}`);

  if (ctx.agencyCity)
    lines.push(`- Ville principale de l'agence : ${ctx.agencyCity}`);

  if (ctx.agencyWhatsapp)
    lines.push(`- Numéro WhatsApp officiel : ${ctx.agencyWhatsapp}`);

  const toneInstructions = {
    promo: `
TON DE MARQUE — PROMOTION AGRESSIVE :
▸ Accroches fortes
▸ Urgence maximale
▸ Prix mis en avant dès le début
▸ Emojis dynamiques 🔥⚡`,
    premium: `
TON DE MARQUE — PREMIUM / LUXE :
▸ Élégant, raffiné
▸ Moins d'emojis
▸ Accent sur confort, exclusivité
▸ Prix intégré subtilement`,
    family: `
TON DE MARQUE — FAMILIAL :
▸ Ton rassurant et chaleureux
▸ Mettre en avant sécurité, confort enfants
▸ Emojis doux 😊🏖️`,
    religious: `
TON DE MARQUE — RESPECTUEUX & SPIRITUEL :
▸ Ton formel et respectueux
▸ Pas d'exagération commerciale`,
    corporate: `
TON DE MARQUE — PROFESSIONNEL :
▸ Structuré
▸ Informatif
▸ Direct et clair`
  };

  if (ctx.brandTone && toneInstructions[ctx.brandTone]) {
    lines.push(toneInstructions[ctx.brandTone]);
  }

  if (lines.length === 0) return '';

  return `
════════════════════════════════════════════════
IDENTITÉ DE L'AGENCE
════════════════════════════════════════════════
${lines.join('\n')}

${ctx.agencyName ? '▸ Toujours inclure le nom de l\'agence à la fin du contenu.' : ''}
${ctx.agencyWhatsapp ? '▸ Toujours inclure le numéro WhatsApp fourni.' : ''}
`;
}


function buildTripDetails(ctx) {
  const lines = [];
  const prohibitions = [];

  if (ctx.tripType) lines.push(`- Type de voyage : ${ctx.tripType}`);
  if (ctx.destination) lines.push(`- Destination : ${ctx.destination}`);

  if (ctx.departureCity) {
    lines.push(`- Ville de départ : ${ctx.departureCity}`);
  } else {
    prohibitions.push(`- NE PAS inventer ni mentionner de ville de départ — information non fournie.`);
  }

  if (ctx.airline) {
    lines.push(`- Moyen de transport : ${ctx.airline}`);
  } else {
    prohibitions.push(`- NE PAS inventer ni mentionner de compagnie aérienne ou moyen de transport — information non fournie.`);
  }

  if (ctx.departureDate) {
    lines.push(`- Date de départ : ${ctx.departureDate}`);
  } else {
    prohibitions.push(`- NE PAS inventer ni mentionner de date de départ — information non fournie.`);
  }

  if (ctx.returnDate) {
    lines.push(`- Date de retour : ${ctx.returnDate}`);
  } else {
    prohibitions.push(`- NE PAS inventer ni mentionner de date de retour — information non fournie.`);
  }

  if (ctx.duration) {
    lines.push(`- Durée : ${ctx.duration}`);
  } else {
    prohibitions.push(`- NE PAS inventer ni mentionner de durée (nuits/jours) — information non fournie.`);
  }

  if (ctx.hotel) {
    lines.push(`- Hôtel : ${ctx.hotel}`);
  } else {
    prohibitions.push(`- NE PAS inventer ni mentionner de nom d'hôtel — information non fournie.`);
  }

  if (ctx.hotelStars) {
    lines.push(`- Classement hôtel : ${ctx.hotelStars} étoiles`);
  } else {
    prohibitions.push(`- NE PAS inventer de classement d'hôtel (étoiles) — information non fournie.`);
  }

  if (ctx.mealPlan) {
    lines.push(`- Formule hébergement : ${ctx.mealPlan}`);
  } else {
    prohibitions.push(`- NE PAS inventer de formule hébergement — information non fournie.`);
  }

  if (ctx.audience) lines.push(`- Public cible : ${ctx.audience}`);
  if (ctx.offer) lines.push(`- Offre spéciale : ${ctx.offer}`);

  const price = formatPrice(ctx.price);
  if (price) {
    lines.push(`- Prix de départ EXACT à utiliser : ${price} par personne — utiliser CE PRIX EXACTEMENT, ne pas en inventer un autre.`);
  } else {
    prohibitions.push(`- AUCUN prix n'a été fourni — NE PAS inventer ni mentionner de prix. Omets complètement toute mention de prix dans le contenu.`);
  }

  if (ctx.includesVisa === 'oui') lines.push(`- Visa : inclus dans le prix (argument de vente fort)`);
  if (ctx.includesVisa === 'non') lines.push(`- Visa : frais de visa à régler sur place (mentionner le montant approximatif en USD)`);

  if (ctx.extraInfo) lines.push(`- Informations supplémentaires : ${ctx.extraInfo}`);

  let output = lines.join('\n');

  if (prohibitions.length > 0) {
    output += '\n\n⚠️ CHAMPS NON FOURNIS — INTERDICTIONS ABSOLUES :\n' + prohibitions.join('\n');
  }

  return output.trim() ? output : 'Aucun détail spécifique fourni. Génère une structure standard SANS inventer de prix, dates, hôtels ou villes.';
}


// trip type specific instructions 


function buildTripTypeInstruction(tripType) {
  const instructions = {
    'omra': `
TYPE DE VOYAGE — OMRA / HAJJ :
▸ Applique OBLIGATOIREMENT le ton respectueux et spirituel. Pas de langage commercial agressif.
▸ Arguments clés : organisation parfaite, sécurité, encadrement de bout en bout, tranquillité d'esprit.
▸ Terminer OBLIGATOIREMENT par : "Que Allah accepte votre Omra et vous ramène sains et saufs 🤲"`,

    'domestique': `
TYPE DE VOYAGE — TOURISME DOMESTIQUE (Algérie) :
▸ Ton familial, chaleureux et authentique.
▸ Mettre en avant : activités locales, soirée traditionnelle, cuisine du terroir, ambiance locale.
▸ Si transport par bus/van : utiliser 🚍 pour les dates de départ.
▸ Si livret de famille requis pour le transport : mentionner "🚨 LIVRET DE FAMILLE OBLIGATOIRE".`,

    'romantique': `
TYPE DE VOYAGE — SÉJOUR ROMANTIQUE :
▸ Commencer OBLIGATOIREMENT par une phrase poétique et émotionnelle AVANT tout détail technique.
  Exemple : "L'amour véritable ne se promet pas, il se vit ✨❤️"
▸ Enchaîner ensuite avec la structure standard.
▸ Ton doux, élégant, émotionnel tout au long du texte.`,

    'famille': `
TYPE DE VOYAGE — FAMILLE :
▸ Détailler OBLIGATOIREMENT les prix enfants avec les tranches d'âge exactes.
▸ Si transport terrestre : mentionner "🚨 LIVRET DE FAMILLE OBLIGATOIRE".
▸ Ton rassurant, pratique et chaleureux.
▸ Structure prix obligatoire : adulte en double/triple / supplément single / enfant gratuit (âge max) / 2ème enfant (prix).`,

    'longue-duree': `
TYPE DE VOYAGE — VOYAGE ORGANISÉ LONGUE DURÉE (Chine, Japon, USA, Égypte, Corée...) :
▸ Programme jour par jour OBLIGATOIRE — génère un programme réaliste basé sur la destination.
▸ Section dossier visa OBLIGATOIRE.
▸ Mentionner "Guide francophone" comme argument de vente clé.
▸ Terminer par : "⚠️ Délai d'inscription dès que possible pour les procédures visa."`,

    'billets': `
TYPE DE VOYAGE — BILLETS D'AVION SEULS :
▸ Format liste par destination, une ligne par route :
  "✈️ Alger → [Destination] | à partir de X DA"
▸ Mentionner les compagnies disponibles.
▸ Structure simple, directe et lisible.`,

    'promo': `
TYPE DE VOYAGE — PROMO / BON PLAN :
▸ Prix EN AVANT dès la première ligne — c'est le premier argument de vente.
▸ Urgence forte et immédiate dès l'accroche.
▸ Accroche obligatoire du type : "🔥 OFFRE EXCLUSIVE – [DESTINATION] À PARTIR DE [PRIX] DA 🔥"
▸ Ton direct, percutant, sans fioritures.`
  };

  return instructions[tripType] || `
TYPE DE VOYAGE — VOYAGE ORGANISÉ :
▸ Applique la structure standard complète du marché algérien.
▸ Programme détaillé, prix clairs avec type de chambre.
▸ Inclure contact WhatsApp si fourni.`;
}


// social media prompt


export function buildSocialPrompt(ctx) {
  const criticalErrors = validateCriticalFields(ctx);

  if (criticalErrors.length > 0) {
    return `
ERREUR INTERNE — DONNÉES INSUFFISANTES :
Impossible de générer le contenu car les champs suivants sont manquants :
${criticalErrors.join(', ')}

Merci de compléter ces informations avant génération.
`;
  }
  const context = getContext(ctx.language);

  const platformGuide = {
    instagram: `Tu rédiges une publication Instagram longue et structurée, exactement comme les vraies agences algériennes sur Instagram et Facebook. Maximum 2 200 caractères. Sauts de ligne pour la lisibilité. Respecte STRICTEMENT la structure obligatoire du contexte.`,
    facebook: `Tu rédiges une publication Facebook longue et structurée, exactement comme les vraies agences algériennes. C'est le canal principal. Peut aller jusqu'à 500 mots — le marché algérien lit les posts longs et détaillés. Respecte STRICTEMENT la structure obligatoire du contexte.`,
    tiktok: `Tu rédiges une légende TikTok pour une agence de voyage algérienne. 3 à 5 lignes maximum. Accroche forte en première ligne. Terminer par une phrase d'urgence et le contact WhatsApp. Hashtags à la fin (8 à 12 max). Même ton que les publications Facebook algériennes mais condensé.`,
    whatsapp: `Tu rédiges un message broadcast WhatsApp pour une agence de voyage algérienne. Court, chaleureux, direct — comme un message d'un contact de confiance. Pas de hashtags. Inclure : accroche, prix en DA, et numéro avec (Viber / WhatsApp). Maximum 6 lignes.`
  };

  const langGuide = {
    french: `LANGUE : Rédige ENTIÈREMENT en français. Français naturel et moderne tel qu'utilisé en Algérie.`,
    arabic: `LANGUE : Rédige ENTIÈREMENT en arabe standard moderne (فصحى مبسطة). Clair, moderne, professionnel. Applique les mêmes règles de structure mais en arabe.`,
    mix: `LANGUE : Rédige DEUX versions complètes et séparées :
Première : version française complète — commence directement par le contenu, sans étiquette ni titre de langue.
Deuxième : version arabe complète (arabe standard moderne) — séparée par "---", commence directement par le contenu arabe, sans étiquette ni titre de langue.
Les deux doivent être complètes, indépendantes et naturellement rédigées dans chaque langue.`
  };

  const hashtagInstruction = (ctx.platform !== 'whatsapp')
    ? `
HASHTAGS — OBLIGATOIRES SANS EXCEPTION :
▸ Tu DOIS terminer le post par les hashtags — ne jamais les omettre
▸ Placement : UNIQUEMENT à la fin, après tout le contenu
▸ Nombre : ${parseInt(ctx.hashtags) > 0 ? parseInt(ctx.hashtags) : 12} hashtags
▸ Toujours inclure : #voyage #tourisme #agencedevoyage #vacances #algerie #dz #dzair
▸ Ajouter : hashtags liés à la destination et au type de voyage
▸ Si le contenu est long, les hashtags viennent QUAND MÊME à la fin`
    : '';

  const lengthInstruction = (() => {
    const w = Number.isInteger(ctx.wordCount) ? ctx.wordCount : 200;
    if (w <= 80) return `LONGUEUR CIBLE : Court — environ ${w} mots. Accroche + prix + contact uniquement. Idéal TikTok / WhatsApp.`;
    if (w === 200) return `LONGUEUR CIBLE : Standard — environ ${w} mots. Structure complète mais concise.`;
    if (w === 400) return `LONGUEUR CIBLE : Long — environ ${w} mots. Structure complète avec tous les détails du marché algérien.`;
    return `LONGUEUR CIBLE : Très long — environ ${w} mots. Programme complet, tous les détails, jour par jour si applicable.`;
  })();

  return `${context}

════════════════════════════════════════════════
INSTRUCTION DE GÉNÉRATION — PUBLICATION ${(ctx.platform || 'FACEBOOK').toUpperCase()}
════════════════════════════════════════════════

${platformGuide[ctx.platform] || platformGuide.facebook}

${langGuide[ctx.language] || langGuide.french}

${lengthInstruction}

DÉTAILS DU VOYAGE À INTÉGRER :
${buildTripDetails(ctx)}

${buildTripTypeInstruction(ctx.tripType)}

${hashtagInstruction}

${buildAgencyInstruction(ctx)}

RÈGLE ABSOLUE : Génère UNIQUEMENT le contenu prêt à publier. Aucun préambule, aucune explication, aucun "Voici votre publication :". Commence directement par l'accroche.

RÈGLE DE MISE EN FORME STRICTE :
▸ N'utilise JAMAIS de lignes de séparation avec des caractères répétés (════, ────, ====, -----)
▸ N'utilise pas de Markdown (#, ##, *, **) sauf pour mettre du texte en **gras**
▸ Les sections sont séparées par une simple ligne vide
▸ Les listes utilisent uniquement des emojis fonctionnels comme puces (✅ ❌ 📣 etc.)
▸ Pas de bullets (*) ni de tirets (-) en début de ligne`;
}


// email prompt EMAIL PROMPT

export function buildEmailPrompt(ctx) {
  const criticalErrors = validateCriticalFields(ctx);

  if (criticalErrors.length > 0) {
    return `
ERREUR INTERNE — DONNÉES INSUFFISANTES :
Impossible de générer l'email car les champs suivants sont manquants :
${criticalErrors.join(', ')}

Merci de compléter ces informations avant génération.
`;
  }

  const context = getContext(ctx.language);
  const price = formatPrice(ctx.price);
  const isArabic = ctx.language === 'arabic';

  const langNote = isArabic
    ? 'LANGUE : Rédige TOUTES les valeurs en arabe standard moderne (فصحى مبسطة) — subject, preview et body.'
    : 'LANGUE : Rédige entièrement en français, comme utilisé en Algérie.';

  return `${context}

Tu rédiges un email promotionnel pour une agence de voyage algérienne.
Ton chaleureux et professionnel. Même structure que les publications Facebook algériennes, adaptée au format email.

${langNote}

DÉTAILS DU VOYAGE :
${buildTripDetails(ctx)}

${buildTripTypeInstruction(ctx.tripType)}

${buildAgencyInstruction(ctx)}

RÈGLES DE CONTENU :
▸ Prix toujours en DA${price ? ` — utiliser CE PRIX EXACTEMENT : ${price}` : ` — AUCUN prix fourni, NE PAS inventer`}
▸ Jamais "cliquez sur le lien" ou "réservez en ligne" — toujours WhatsApp ou téléphone
▸ Urgence obligatoire avant la signature
▸ Corps : salutation → accroche prix → détails séjour → liste inclus (✅) → urgence → CTA WhatsApp → signature agence
▸ Dans le body, utiliser \\n pour les sauts de ligne (un \\n = nouvelle ligne, deux \\n\\n = paragraphe)
▸ N'utilise JAMAIS de lignes de séparation avec des caractères répétés (════, ────, ===)
▸ Les listes utilisent des emojis fonctionnels (✅ ❌ 📣 etc.), pas de bullets (*) ou tirets (-)

RÈGLE ABSOLUE : Réponds UNIQUEMENT avec un objet JSON valide. Zéro texte avant ou après. Zéro backtick. Zéro markdown. Format exact :

{
  "subject": "${isArabic ? 'موضوع جذاب — 60 حرفاً كحد أقصى، يتضمن الوجهة والسعر' : 'Objet accrocheur — max 60 caractères, destination + prix'}",
  "preview": "${isArabic ? 'نص المعاينة — 90 حرفاً كحد أقصى' : 'Texte aperçu — max 90 caractères, complète l objet'}",
  "body": "${isArabic ? 'نص البريد الكامل مع \\\\n للأسطر الجديدة' : 'Corps complet avec \\\\n pour les sauts de ligne'}"
}`;
}

// ─────────────────────────────────────────────
// META ADS PROMPT
// ─────────────────────────────────────────────

export function buildAdsPrompt(ctx) {
  const criticalErrors = validateCriticalFields(ctx);

  if (criticalErrors.length > 0) {
    return `
ERREUR INTERNE — DONNÉES INSUFFISANTES :
Impossible de générer les publicités car les champs suivants sont manquants :
${criticalErrors.join(', ')}

Merci de compléter ces informations avant génération.
`;
  }
  const context = getContext(ctx.language);
  const price = formatPrice(ctx.price);

  const langNote = ctx.language === 'arabic'
    ? 'LANGUE : Rédige TOUTES les valeurs en arabe standard moderne.'
    : ctx.language === 'mix'
      ? 'LANGUE : Rédige TOUTES les valeurs en français uniquement (version arabe non applicable pour Meta Ads).'
      : 'LANGUE : Rédige en français.';

  // ── Platform-specific Meta placement guidance ──
  const platform = ctx.platform || 'facebook';

  const placementGuides = {
    facebook: {
      name: 'Facebook Feed & Marketplace',
      primaryTextTip: 'Ton informatif et direct. Structure : accroche prix → avantage clé → urgence. Le texte principal est lu en entier sur Facebook — utilise les 125 caractères. Terminer par une action de contact (WhatsApp ou message privé).',
      headlineTip: 'Titre percutant avec prix ou destination. Style : "TUNISIE 4★ dès 45 000 DA ✈️".',
      ctaOptions: ['Envoyer un message', 'Contacter', 'En savoir plus', 'S\'abonner'],
      ctaNote: 'Sur Facebook, "Envoyer un message" ouvre Messenger — privilégier si l\'agence utilise Messenger pour les réservations.'
    },
    instagram: {
      name: 'Instagram Feed & Stories',
      primaryTextTip: 'Ton aspirationnel mais concis. Sur Instagram, les gens voient surtout l\'image — le texte doit accrocher en 1-2 lignes. Emojis visuels bienvenus. Pas de numéro de téléphone dans le texte principal (Instagram préfère les CTA boutons). Utiliser le nom de l\'agence si fourni.',
      headlineTip: 'Court, accrocheur, une seule idée forte. Style : "Istanbul vous attend 🌙" ou "Offre Tunisie limitée 🔥".',
      ctaOptions: ['En savoir plus', 'Envoyer un message', 'Contacter', 'S\'abonner'],
      ctaNote: 'Sur Instagram, "En savoir plus" et "Envoyer un message" (DM Instagram) sont les plus efficaces. Éviter les CTAs orientés achat direct.'
    },
    whatsapp: {
      name: 'WhatsApp Click-to-Chat Ads',
      primaryTextTip: 'Ton chaleureux et personnel — comme un message d\'un ami de confiance. Court, direct. Inclure le prix et une phrase d\'urgence. Terminer par une invitation à contacter via WhatsApp. Ces ads ouvrent directement une conversation WhatsApp.',
      headlineTip: 'Titre court comme un titre de message. Style : "Offre Tunisie — Répondez vite !" ou "45 000 DA ✈️ — Places limitées".',
      ctaOptions: ['Envoyer un message', 'Contacter'],
      ctaNote: 'Pour WhatsApp Ads, UNIQUEMENT "Envoyer un message" — cela ouvre une conversation WhatsApp directe. C\'est le CTA natif de ce placement.'
    },
    tiktok: {
      name: 'Meta Ads diffusés sur audience TikTok-style (Reels & Stories)',
      primaryTextTip: 'Texte ultra-court et percutant — ces ads apparaissent en overlay sur vidéos courtes. Maximum 2 lignes. Accroche forte en premier mot. Pas de détails techniques — juste l\'émotion + le prix + l\'urgence.',
      headlineTip: 'Titre choc, une seule idée. Style : "ISTANBUL — 89 900 DA ⚡" ou "Omra mars 2026 🕋".',
      ctaOptions: ['En savoir plus', 'Contacter', 'S\'abonner'],
      ctaNote: 'Pour les Reels et formats vidéo courts, "En savoir plus" est le CTA Meta standard. "Contacter" si l\'objectif est la génération de leads.'
    }
  };

  const placement = placementGuides[platform] || placementGuides.facebook;

  return `${context}

Tu rédiges le copy pour des publicités Meta Ads pour une agence de voyage algérienne.
Placement cible : ${placement.name}.
Copy percutant, adapté au marché algérien ET au placement Meta spécifié, respectant strictement les contraintes de caractères.

${langNote}

DÉTAILS DU VOYAGE :
${buildTripDetails(ctx)}

${buildTripTypeInstruction(ctx.tripType)}

${buildAgencyInstruction(ctx)}

CONTRAINTES STRICTES PAR CHAMP META — PLACEMENT : ${placement.name.toUpperCase()} :

- primaryTexts : 3 variations. Chacune entre 50 et 125 caractères.
  Style requis : ${placement.primaryTextTip}
  ${price ? `Prix EXACT à utiliser : ${price} — ne pas changer.` : `NE PAS inventer de prix.`}
  Emojis fonctionnels autorisés.

- headlines : 5 variations. Maximum 40 caractères chacun.
  Style requis : ${placement.headlineTip}
  ${price ? `Inclure ce prix exact dans au moins 2 titres : ${price}` : `NE PAS inventer de prix dans les titres.`}

- descriptions : 3 variations. Maximum 30 caractères chacune.
  Complément court du titre. Renforce l'urgence ou la valeur.

- ctas : Choisir 3 parmi ces options valides pour ce placement : ${placement.ctaOptions.map(c => `"${c}"`).join(', ')}.
  Note placement : ${placement.ctaNote}
  JAMAIS : "Acheter maintenant", "Réserver en ligne", "Commander", ou tout CTA e-commerce.

RÈGLE ABSOLUE : Réponds UNIQUEMENT avec un objet JSON valide. Aucun texte avant ou après. Aucun backtick. Aucun markdown. Exactement ce format :

{
  "placement": "${placement.name}",
  "primaryTexts": ["variation 1", "variation 2", "variation 3"],
  "headlines": ["titre 1", "titre 2", "titre 3", "titre 4", "titre 5"],
  "descriptions": ["desc 1", "desc 2", "desc 3"],
  "ctas": ["option 1", "option 2", "option 3"]
}`;
}
