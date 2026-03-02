export let selectedPlatform = 'facebook';
export let selectedLang = 'french';
export let selectedTripType = 'voyage-organise';
export let selectedVisa = '';
export let selectedWords = 200;


//trip type selector TRIP TYPE SELECTOR


document.querySelectorAll('.trip-type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.trip-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedTripType = btn.dataset.type;
  });
});


// platfrom selector PLATFORM SELECTOR

document.querySelectorAll('.platform-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedPlatform = btn.dataset.platform;
  });
});


// langauge selector  

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedLang = btn.dataset.lang;
  });
});


// visa toggle VISA TOGGLE


document.querySelectorAll('.toggle-btn[data-val]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.toggle-btn[data-val]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedVisa = btn.dataset.val;
  });
});


// hashtag slider HASHTAG SLIDER


document.getElementById('hashtagSlider').addEventListener('input', function () {
  document.getElementById('hashtagCount').textContent = this.value;
});


// length selector 


const lengthHints = {
  80: "Environ 80 mots — idéal pour TikTok / WhatsApp",
  200: "Environ 200 mots — publication Facebook / Instagram standard",
  400: "Environ 400 mots — post long style agence algérienne",
  600: "Environ 600 mots — programme complet (Omra, Chine, longue durée...)"
};

document.querySelectorAll('.length-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.length-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedWords = parseInt(btn.dataset.words);
    document.getElementById('lengthHint').textContent = lengthHints[selectedWords];
  });
});


// price formatter 


const priceInput = document.getElementById('startingPrice');
if (priceInput) {
  priceInput.addEventListener('blur', function () {
    const raw = this.value.replace(/\s/g, '');
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num > 0) {
      // Format with spaces: 45000 → 45 000
      this.value = num.toLocaleString('fr-FR');
    }
  });
  priceInput.addEventListener('focus', function () {
    // Strip formatting on focus so user can edit cleanly
    this.value = this.value.replace(/\s/g, '');
  });
}


// date auto-calculation


function calculateDuration() {
  const dep = document.getElementById('departureDate').value;
  const ret = document.getElementById('returnDate').value;
  if (!dep || !ret) return;

  const depDate = new Date(dep);
  const retDate = new Date(ret);
  if (retDate <= depDate) return;

  const nights = Math.floor((retDate - depDate) / (1000 * 60 * 60 * 24));
  const days = nights + 1;
  const field = document.getElementById('duration');

  if (!field._manuallyEdited) {
    field.value = `${nights} nuit${nights > 1 ? 's' : ''} / ${days} jour${days > 1 ? 's' : ''}`;
  }
}

// Reset manual flag when either date changes so auto-calc takes back over
function onDateChange() {
  document.getElementById('duration')._manuallyEdited = false;
  calculateDuration();
}

document.getElementById('departureDate').addEventListener('change', onDateChange);
document.getElementById('returnDate').addEventListener('change', onDateChange);

// Track manual edits to duration
document.getElementById('duration').addEventListener('input', function () {
  this._manuallyEdited = true;
});


// context collector



window.addEventListener('load', () => {
  try {
    const saved = JSON.parse(localStorage.getItem('agencyProfile'));
    if (!saved) return;

    document.getElementById('agencyName').value = saved.agencyName || '';
    document.getElementById('agencyWhatsapp').value = saved.agencyWhatsapp || '';
    document.getElementById('agencyCity').value = saved.agencyCity || '';
    document.getElementById('brandTone').value = saved.brandTone || 'promo';
  } catch (e) {
    console.warn('Invalid agencyProfile in localStorage');
  }
});

function saveAgencyProfile() {
  const profile = {
    agencyName: document.getElementById('agencyName').value,
    agencyWhatsapp: document.getElementById('agencyWhatsapp').value,
    agencyCity: document.getElementById('agencyCity').value,
    brandTone: document.getElementById('brandTone').value
  };

  localStorage.setItem('agencyProfile', JSON.stringify(profile));
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#agencyName, #agencyWhatsapp, #agencyCity, #brandTone')
    .forEach(el => {
      if (el) el.addEventListener('change', saveAgencyProfile);
    });
});

function formatDateFR(isoDate) {
  if (!isoDate || isoDate.length < 10) return '';
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
}

export function getCampaignContext() {
  return {
    agencyName: document.getElementById('agencyName').value.trim(),
    agencyWhatsapp: document.getElementById('agencyWhatsapp').value.trim(),
    agencyCity: document.getElementById('agencyCity').value.trim(),
    brandTone: document.getElementById('brandTone').value,
    tripType: selectedTripType,
    destination: document.getElementById('destination').value.trim(),
    departureCity: document.getElementById('departureCity').value
      ? `Au départ de ${document.getElementById('departureCity').value}`
      : '',
    departureDate: formatDateFR(document.getElementById('departureDate').value),
    returnDate: formatDateFR(document.getElementById('returnDate').value),
    duration: document.getElementById('duration').value.trim(),
    airline: document.getElementById('airline').value,
    hotel: document.getElementById('hotel').value.trim(),
    hotelStars: document.getElementById('hotelStars').value,
    mealPlan: document.getElementById('mealPlan').value,
    price: document.getElementById('startingPrice').value.replace(/\s/g, '').trim(),
    includesVisa: selectedVisa,
    audience: document.getElementById('audience').value,
    offer: document.getElementById('offer').value.trim(),
    extraInfo: document.getElementById('extraInfo').value.trim(),
    platform: selectedPlatform,
    language: selectedLang,
    hashtags: document.getElementById('hashtagSlider').value,
    wordCount: selectedWords,
  };
}


// render helpers 

export function renderLoading(id, label) {
  document.getElementById(id).innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Génération de ${label} en cours…</p>
    </div>`;
}

export function renderOutput(id, title, content, icon) {
  // Strip markdown code fences
  let cleaned = content
    .replace(/^```[\w]*\n?/gm, '')
    .replace(/```$/gm, '')
    .trim();

  // Clean up AI structural artifacts
  // Remove ════ divider lines (replace with blank line)
  cleaned = cleaned.replace(/[═]{3,}/g, '');
  // Remove * bullet points at line start (keep content)
  cleaned = cleaned.replace(/^\*\s+/gm, '• ');
  // Remove trailing whitespace per line
  cleaned = cleaned.replace(/[ \t]+$/gm, '');
  // Collapse 3+ blank lines to 2
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  const arabicPattern = /[\u0600-\u06FF]/;

  // Detect mixed FR+AR (separated by ---)
  const parts = cleaned.split(/\n-{3,}\n/);
  const isMixed = parts.length === 2;

  let formatted, dirAttr = '', rtlClass = '';

  // LTR renderer: bold only, keep pre-wrap
  function renderLTR(text) {
    return text.trim()
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  // RTL renderer: bold + \n→<br> + fix bracket bidi reversal
  function renderRTL(text) {
    return text.trim()
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Wrap every parenthesized group in a bidi-isolated LTR span.
      // This forces the browser to treat the ( ) and their content as LTR
      // regardless of surrounding RTL direction — fixing reversed brackets.
      // The span uses dir="ltr" + unicode-bidi:isolate so it doesn't bleed
      // into surrounding Arabic text direction.
      .replace(/\(([^)]*)\)/g, '<span dir="ltr" style="unicode-bidi:isolate;display:inline">($1)</span>')
      .replace(/\n/g, '<br>');
  }

  if (isMixed) {
    const [frPart, arPart] = parts;
    formatted = `
      <div class="mix-section ltr-section">${renderLTR(frPart)}</div>
      <div class="mix-divider"></div>
      <div class="mix-section rtl-section" dir="rtl">${renderRTL(arPart)}</div>`;
  } else {
    const isArabic = arabicPattern.test(cleaned.slice(0, 200));
    if (isArabic) {
      dirAttr = 'dir="rtl"';
      rtlClass = ' rtl-content';
      formatted = renderRTL(cleaned);
    } else {
      formatted = renderLTR(cleaned);
    }
  }

  const cardId = `card-${id}`;
  const bodyId = `body-${id}`;

  document.getElementById(id).innerHTML = `
    <div class="output-card" id="${cardId}">
      <div class="output-card-header">
        <h6>${icon} ${title}</h6>
        <div class="card-actions">
          <button class="edit-btn">✏️ Modifier</button>
          <button class="save-btn" style="display:none;">💾 Sauvegarder</button>
          <button class="copy-btn">Copier</button>
        </div>
      </div>
      <div class="output-body${rtlClass}" id="${bodyId}" ${dirAttr}>${formatted}</div>
    </div>`;

  const card = document.getElementById(cardId);
  const body = document.getElementById(bodyId);
  const editBtn = card.querySelector('.edit-btn');
  const saveBtn = card.querySelector('.save-btn');
  const copyBtn = card.querySelector('.copy-btn');

  card._rawContent = cleaned;

  editBtn.addEventListener('click', function () {
    body.contentEditable = 'true';
    body.classList.add('edit-mode');
    body.focus();
    editBtn.style.display = 'none';
    saveBtn.style.display = 'inline-block';
  });

  saveBtn.addEventListener('click', function () {
    body.contentEditable = 'false';
    body.classList.remove('edit-mode');
    editBtn.style.display = 'inline-block';
    saveBtn.style.display = 'none';
    card._rawContent = body.innerText;
  });

  copyBtn.addEventListener('click', function () {
    const textToCopy = body.contentEditable === 'true'
      ? body.innerText
      : card._rawContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
      this.textContent = 'Copié !';
      setTimeout(() => (this.textContent = 'Copier'), 2000);
    });
  });
}

export function renderError(id, message) {
  document.getElementById(id).innerHTML = `
    <div class="error-state">
      <span>⚠️</span>
      <p>${message}</p>
    </div>`;
}


// META ADS STRUCTURED RENDERER

export function renderAdsOutput(id, data) {
  // data = { primaryTexts, headlines, descriptions, ctas }

  function variantCards(items, maxLen) {
    return items.map((text, i) => {
      const len = [...text].length; // unicode-safe char count
      const overLimit = maxLen && len > maxLen;
      const badge = maxLen
        ? `<span class="ads-char-count ${overLimit ? 'over' : ''}">${len}/${maxLen}</span>`
        : `<span class="ads-char-count">${len}</span>`;
      return `
        <div class="ads-variant">
          <div class="ads-variant-top">
            <span class="ads-variant-label">Option ${String.fromCharCode(65 + i)}</span>
            ${badge}
          </div>
          <div class="ads-variant-text">${text}</div>
          <button class="ads-copy-btn" data-text="${text.replace(/"/g, '&quot;')}">Copier</button>
        </div>`;
    }).join('');
  }

  function ctaButtons(ctas) {
    return ctas.map(cta => `
      <div class="ads-cta-chip">
        <span class="ads-cta-icon">↗</span>
        <span>${cta}</span>
      </div>`).join('');
  }

  const placementIcons = {
    'Facebook Feed & Marketplace': '<img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;filter:invert(40%) sepia(50%) saturate(500%) hue-rotate(340deg);">',
    'Instagram Feed & Stories': '<img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;filter:invert(40%) sepia(50%) saturate(500%) hue-rotate(340deg);">',
    'WhatsApp Click-to-Chat Ads': '<img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/whatsapp.svg" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;filter:invert(40%) sepia(50%) saturate(500%) hue-rotate(340deg);">',
  };
  const placementIcon = placementIcons[data.placement] || '📣';
  const placementLabel = data.placement || 'Meta Ads';
  const rawLines = [
    '— TEXTES PRINCIPAUX —',
    ...data.primaryTexts.map((t, i) => `Option ${String.fromCharCode(65+i)}: ${t}`),
    '',
    '— TITRES —',
    ...data.headlines.map((t, i) => `${i+1}. ${t}`),
    '',
    '— DESCRIPTIONS —',
    ...data.descriptions.map((t, i) => `Option ${String.fromCharCode(65+i)}: ${t}`),
    '',
    '— CTA —',
    ...data.ctas
  ];
  const rawContent = rawLines.join('\n');

  const cardId = `card-${id}`;

  document.getElementById(id).innerHTML = `
    <div class="output-card ads-structured-card" id="${cardId}">
      <div class="output-card-header">
        <h6>
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
          Meta Ads
          <span class="ads-placement-badge">${placementIcon}${placementLabel}</span>
        </h6>
        <div class="card-actions">
          <button class="copy-btn" id="copyAllAds">Tout copier</button>
        </div>
      </div>

      <div class="ads-sections">

        <div class="ads-section">
          <div class="ads-section-header">
            <span class="ads-section-title">Texte principal</span>
            <span class="ads-section-meta">3 variations · max 125 car.</span>
          </div>
          <div class="ads-variants-grid">
            ${variantCards(data.primaryTexts, 125)}
          </div>
        </div>

        <div class="ads-section">
          <div class="ads-section-header">
            <span class="ads-section-title">Titres</span>
            <span class="ads-section-meta">5 variations · max 40 car.</span>
          </div>
          <div class="ads-variants-grid ads-headlines-grid">
            ${variantCards(data.headlines, 40)}
          </div>
        </div>

        <div class="ads-section">
          <div class="ads-section-header">
            <span class="ads-section-title">Descriptions</span>
            <span class="ads-section-meta">3 variations · max 30 car.</span>
          </div>
          <div class="ads-variants-grid ads-headlines-grid">
            ${variantCards(data.descriptions, 30)}
          </div>
        </div>

        <div class="ads-section">
          <div class="ads-section-header">
            <span class="ads-section-title">Boutons CTA</span>
            <span class="ads-section-meta">Options recommandées</span>
          </div>
          <div class="ads-cta-row">
            ${ctaButtons(data.ctas)}
          </div>
        </div>

      </div>
    </div>`;

  const card = document.getElementById(cardId);
  card._rawContent = rawContent;

  // Copy all button
  document.getElementById('copyAllAds').addEventListener('click', function () {
    navigator.clipboard.writeText(rawContent).then(() => {
      this.textContent = 'Copié !';
      setTimeout(() => (this.textContent = 'Tout copier'), 2000);
    });
  });

  // Individual copy buttons
  card.querySelectorAll('.ads-copy-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      navigator.clipboard.writeText(this.dataset.text).then(() => {
        this.textContent = 'Copié !';
        setTimeout(() => (this.textContent = 'Copier'), 2000);
      });
    });
  });
}
