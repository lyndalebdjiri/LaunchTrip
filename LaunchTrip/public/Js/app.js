import {
  getCampaignContext,
  renderLoading,
  renderOutput,
  renderAdsOutput,
  renderError
} from './campaign.js';

// SERVER CALL


async function generateFromServer(ctx) {
  const response = await fetch('/api/generate', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(ctx)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Erreur serveur (${response.status})`);
  }

  return response.json(); // { social, email, ads, errors }
}


// COPY ALL


function copyAll() {
  const ids  = ['socialContent', 'emailContent', 'adsContent'];
  const text = ids
    .map(id => document.getElementById(id)?.querySelector('.output-card')?._rawContent || '')
    .filter(Boolean)
    .join('\n\n---\n\n');

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copyAllBtn');
    btn.textContent = 'Copié !';
    setTimeout(() => (btn.textContent = 'Tout copier'), 2000);
  });
}


// MAIN GENERATE

async function generateCampaign() {
  const ctx = getCampaignContext();
  const btn = document.getElementById('generateBtn');

  // Validate
  if (!ctx.destination) {
    alert('Veuillez renseigner la destination.');
    return;
  }

  btn.textContent = 'Génération en cours…';
  btn.disabled    = true;
  document.getElementById('outputActions').style.display = 'flex';

  const platformLabels = {
    facebook:  'Facebook',
    instagram: 'Instagram',
    tiktok:    'TikTok',
    whatsapp:  'WhatsApp'
  };

  const platformIcons = {
    facebook:  '<img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg" style="width:15px;height:15px;vertical-align:middle;margin-right:5px;filter:invert(30%) sepia(50%) saturate(500%) hue-rotate(340deg);">',
    instagram: '<img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg" style="width:15px;height:15px;vertical-align:middle;margin-right:5px;filter:invert(30%) sepia(50%) saturate(500%) hue-rotate(340deg);">',
    tiktok:    '<img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/tiktok.svg" style="width:15px;height:15px;vertical-align:middle;margin-right:5px;filter:invert(30%) sepia(50%) saturate(500%) hue-rotate(340deg);">',
    whatsapp:  '<img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/whatsapp.svg" style="width:15px;height:15px;vertical-align:middle;margin-right:5px;filter:invert(30%) sepia(50%) saturate(500%) hue-rotate(340deg);">'
  };

  const platformLabel = platformLabels[ctx.platform] || 'Publication';
  const platformIcon  = platformIcons[ctx.platform]  || '📱';

  // Show loading in all 3 tabs
  renderLoading('socialContent', `publication ${platformLabel}`);
  renderLoading('emailContent',  'email promotionnel');
  renderLoading('adsContent',    'copy Meta Ads');

  try {
    const result = await generateFromServer(ctx);

    result.social
      ? renderOutput('socialContent', `Publication ${platformLabel}`, result.social, platformIcon)
      : renderError ('socialContent', result.errors?.social || 'Génération échouée.');

    result.email
      ? renderOutput('emailContent',  'Email Promotionnel', result.email, '✉️')
      : renderError ('emailContent',  result.errors?.email  || 'Génération échouée.');

    // Ads: use structured renderer if JSON parsed, fallback to raw text
    if (result.ads && typeof result.ads === 'object') {
      renderAdsOutput('adsContent', result.ads);
    } else if (result.adsRaw) {
      renderOutput('adsContent', 'Copy Meta Ads', result.adsRaw, '📣');
    } else {
      renderError('adsContent', result.errors?.ads || 'Génération échouée.');
    }

  } catch (err) {
    ['socialContent', 'emailContent', 'adsContent']
      .forEach(id => renderError(id, err.message));
  }

  btn.textContent = '✦ Générer le contenu';
  btn.disabled    = false;
}


// expose to window (called from HTML onclick)


window.generateCampaign = generateCampaign;
window.copyAll          = copyAll;
