/* ══════════════════════════════════════════
   Le Comptoir des Belles Saveurs — app.js
   Partagé par toutes les pages.
   ══════════════════════════════════════════ */
'use strict';

/* ── Helpers ── */
const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fm    = n => Number(n).toLocaleString('fr-FR') + '\u00a0FCFA';
const today = () => new Date().toISOString().slice(0, 10);

/* ── Config & produits (exposés globalement) ── */
let CFG = {}, PRODS = [];

/* ── Emojis et labels catégories ── */
const CAT_EM    = { sucres: '🍩', sales: '🥟', fatayas: '🥠', jus: '🥤' };
const CAT_LABEL = { sucres: 'Beignets sucrés', sales: 'Beignets salés', fatayas: 'Fatayas', jus: 'Jus naturels' };

/* ── Panier ── */
let cart = {};
try { cart = JSON.parse(localStorage.getItem('cbs-cart') || '{}'); } catch (_) {}

function saveCart() {
  try { localStorage.setItem('cbs-cart', JSON.stringify(cart)); } catch (_) {}
  const badge = document.getElementById('cart-count');
  if (badge) {
    const total = Object.values(cart).reduce((a, b) => a + b, 0);
    badge.textContent = total || 0;
  }
}

/* ── WhatsApp ── */
function waUrl(txt) {
  if (!CFG.wa) return '';
  return 'https://wa.me/' + String(CFG.wa).replace(/\D/g, '')
    + '?text=' + encodeURIComponent(txt);
}
function waDefault() {
  return waUrl('Bonjour Le Comptoir des Belles Saveurs, je souhaite passer une commande. Merci de me confirmer la disponibilité, le prix et les modalités.');
}
function setupWaFloat() {
  const el = document.getElementById('wa-float');
  if (!el) return;
  const u = waDefault();
  if (u) { el.href = u; el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer'); }
  else   { el.href = '/contact'; }
}

/* ── Prix ── */
function priceLabel(p) {
  if (p.price == null) return '<em style="color:var(--tx2)">Prix à confirmer</em>';
  return `<strong>${fm(p.price)}</strong> / ${esc(p.unit)}`;
}

/* ── Carte produit ── */
function productCard(p) {
  const garnLabel = p.cat === 'fatayas' ? 'Variante' : 'Garniture';
  const waBtn = CFG.wa
    ? `<a class="btn btn-w btn-sm" href="#" data-wa-prod="${p.id}" target="_blank" rel="noopener" aria-label="Commander par WhatsApp">💬</a>`
    : '';
  return `
<article class="prod-card">
  <div class="prod-img">
    ${p.img
      ? `<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy" decoding="async">`
      : `<div class="prod-img-ph"><span>${CAT_EM[p.cat] || '🍽'}</span><small>Photo à venir</small></div>`}
  </div>
  <div class="prod-body">
    <h3>${esc(p.name)}</h3>
    <p>${esc(p.desc || '')}</p>
    ${p.garniture ? `<p class="prod-meta">${garnLabel} : ${esc(p.garniture)}</p>` : ''}
    <div class="prod-price">${priceLabel(p)}</div>
    <div class="prod-meta">
      ${p.min ? `Min. ${p.min} pièce${p.min > 1 ? 's' : ''} &nbsp;·&nbsp; ` : ''}${p.delay ? esc(p.delay) : 'Délai à confirmer'}
    </div>
    <div class="prod-actions">
      <button class="btn btn-sm" data-add="${p.id}">🛒 Commander</button>
      ${waBtn}
    </div>
  </div>
</article>`;
}

/* ── Récapitulatif panier ── */
function renderRecap() {
  const box = document.getElementById('recap-wrap');
  if (!box) return;
  const ids = Object.keys(cart).filter(id => PRODS.find(p => p.id === id));
  if (!ids.length) {
    box.innerHTML = '<p style="color:var(--tx2);font-style:italic;margin:8px 0">Aucun produit sélectionné — ajoutez-en depuis le catalogue ou décrivez-les ci-dessous.</p>';
    return;
  }
  let total = 0, hasUnknown = false;
  const rows = ids.map(id => {
    const p = PRODS.find(x => x.id === id);
    if (!p) return '';
    const q = cart[id];
    let lineTotal = 'Prix à confirmer';
    if (p.price != null) { total += q * p.price; lineTotal = fm(q * p.price); }
    else { hasUnknown = true; }
    return `
<div class="recap-row">
  <span>${esc(p.name)}</span>
  <span style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
    <input class="qty-input" type="number" min="${p.min || 1}" max="100000"
      value="${q}" data-q="${id}" aria-label="Quantité pour ${esc(p.name)}">
    × ${priceLabel(p)} = <strong>${lineTotal}</strong>
    <button type="button" class="btn btn-ol btn-sm" data-rm="${id}"
      aria-label="Retirer ${esc(p.name)}" style="padding:3px 10px;min-height:28px">✕</button>
  </span>
</div>`;
  }).join('');
  const frais = CFG.livraison
    ? `<p class="recap-note">Frais de livraison séparés : <strong>${CFG.frais ? fm(+CFG.frais) : 'à confirmer'}</strong></p>`
    : '';
  box.innerHTML = `
<div class="recap-box">
  ${rows}
  <div class="recap-row recap-total">
    <span>Total estimatif</span>
    <span>${total ? fm(total) : '—'}${hasUnknown ? ' + éléments à confirmer' : ''}</span>
  </div>
  ${frais}
  <p class="recap-note">Montant estimatif — disponibilité et prix final confirmés par l'entreprise.</p>
</div>`;
}

/* ── Formulaire commande / devis événement ── */
function setupOrderForm(isEvent) {
  const form = document.getElementById('order-form');
  if (!form) return;

  /* Remplir le sélecteur de produits */
  const ps = document.getElementById('ps');
  if (ps) {
    ps.innerHTML = '<option value="">Choisir un produit…</option>'
      + PRODS.map(p =>
        `<option value="${p.id}">${esc(p.name)} — ${p.price == null ? 'Prix à confirmer' : fm(p.price) + ' / ' + esc(p.unit)}</option>`
      ).join('');
  }

  renderRecap();

  /* Date minimale = aujourd'hui */
  const fd = document.getElementById('f-date');
  if (fd) fd.min = today();

  /* Bouton "Ajouter au panier" */
  const addBtn = document.getElementById('add-prod-btn');
  if (addBtn) {
    addBtn.onclick = () => {
      const id = ps && ps.value;
      if (!id) return;
      const p = PRODS.find(x => x.id === id);
      if (!p) return;
      const pq = document.getElementById('pq');
      const qty = Math.max(Math.floor(+(pq && pq.value) || 1), p.min || 1);
      cart[id] = qty;
      saveCart();
      renderRecap();
    };
  }

  /* Soumission du formulaire */
  form.onsubmit = async e => {
    e.preventDefault();
    const f = form;

    /* Honeypot anti-spam */
    if (f.website && f.website.value) return;

    /* Validation */
    const errs = {};
    if (!f.nom || f.nom.value.trim().length < 2) errs.nom = 'Nom et prénom requis.';
    if (!f.tel || !/^\+?[\d\s().\-]{8,16}$/.test(f.tel.value.trim())) errs.tel = 'Numéro invalide (8–16 chiffres).';
    if (f.mail && f.mail.value && !/^\S+@\S+\.\S+$/.test(f.mail.value)) errs.mail = 'E-mail invalide.';
    if (isEvent && f.type && !f.type.value) errs.type = 'Type d\'événement requis.';
    if (!f.date || !f.date.value || f.date.value < today()) errs.date = 'Veuillez indiquer une date future.';

    /* Afficher les erreurs dans les champs */
    ['nom', 'tel', 'mail', 'type', 'date'].forEach(field => {
      const errEl = f.querySelector(`[id="e2${field}"]`) || f.querySelector(`[id="e-${field}"]`);
      const inpEl = f.querySelector(`[name="${field}"]`);
      if (errEl) errEl.textContent = errs[field] || '';
      if (inpEl) inpEl.classList.toggle('f-err', !!errs[field]);
    });

    const resEl = document.getElementById('form-result');
    if (Object.keys(errs).length) {
      resEl.innerHTML = '<div class="note note-err">Veuillez corriger les champs indiqués.</div>';
      const firstErr = f.querySelector('.f-err');
      if (firstErr) firstErr.focus();
      return;
    }

    const lines = Object.keys(cart).map(id => ({ id, qty: cart[id] }));
    const extra = f.extra ? f.extra.value.trim() : '';
    if (!lines.length && !extra) {
      resEl.innerHTML = '<div class="note note-err">Sélectionnez ou décrivez au moins un produit.</div>';
      return;
    }

    /* Envoi */
    const btn = document.getElementById('submit-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Envoi en cours…'; }
    resEl.innerHTML = '';

    try {
      const resp = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind:   isEvent ? 'evenement' : 'commande',
          nom:    f.nom  ? f.nom.value.trim()  : '',
          tel:    f.tel  ? f.tel.value.trim()  : '',
          mail:   f.mail ? f.mail.value.trim() : '',
          lines,
          extra,
          date:   f.date  ? f.date.value  : '',
          heure:  f.heure ? f.heure.value : '',
          type:   isEvent && f.type ? f.type.value : '',
          nb:     isEvent && f.nb   ? f.nb.value   : '',
          budget: isEvent && f.bud  ? f.bud.value  : '',
          mode:   f.mode ? f.mode.value : '',
          adr:    f.adr  ? f.adr.value  : '',
          msg:    f.msg  ? f.msg.value  : '',
          website: f.website ? f.website.value : ''
        })
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || 'Erreur serveur');

      /* Construction du message WhatsApp post-envoi */
      const waLines = [
        'Bonjour Le Comptoir des Belles Saveurs,',
        'je souhaite ' + (isEvent ? 'un devis pour un événement.' : 'passer une commande.'),
        '',
        'Produits :'
      ];
      Object.keys(cart).forEach(id => {
        const p = PRODS.find(x => x.id === id);
        if (p) waLines.push(`- ${p.name} × ${cart[id]}`);
      });
      if (extra) waLines.push(`- ${extra}`);
      if (isEvent && f.type && f.type.value) {
        waLines.push('', `Événement : ${f.type.value}${f.nb && f.nb.value ? ' (' + f.nb.value + ' pers.)' : ''}`);
      }
      waLines.push(
        '',
        `Date souhaitée : ${f.date ? f.date.value : ''}`,
        `Heure : ${f.heure && f.heure.value ? f.heure.value : 'à convenir'}`,
        '',
        `Nom : ${f.nom ? f.nom.value : ''}`,
        `Tél. : ${f.tel ? f.tel.value : ''}`,
        '',
        'Merci de confirmer disponibilité, prix final et modalités.'
      );
      const waLink = waUrl(waLines.join('\n'));

      resEl.innerHTML = `
<div class="note note-ok" role="alert">
  <strong>✅ Demande transmise — réf. ${esc(data.ref)}</strong>
  <p>Votre demande a bien été reçue. Ce n'est <strong>pas encore une commande confirmée</strong>.</p>
  <p>L'entreprise examinera votre demande et vous confirmera : disponibilité, prix final, délai et modalités de paiement.</p>
  ${waLink ? `<p style="margin-top:10px"><a class="btn btn-w btn-sm" href="${waLink}" target="_blank" rel="noopener">💬 Confirmer aussi par WhatsApp</a></p>` : ''}
</div>`;
      cart = {};
      saveCart();
      renderRecap();
      form.reset();
    } catch (err) {
      resEl.innerHTML = `<div class="note note-err">❌ ${esc(err.message || 'Envoi impossible. Contactez-nous directement.')}</div>`;
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = isEvent ? '📋 Demander un devis' : '📨 Envoyer ma demande'; }
    }
  };
}

/* ── Boutons WhatsApp sur les fiches produit ── */
function setupWaProductBtns() {
  document.querySelectorAll('[data-wa-prod]').forEach(a => {
    const p = PRODS.find(x => String(x.id) === String(a.dataset.waProd));
    if (!p) return;
    const u = waUrl(`Bonjour Le Comptoir des Belles Saveurs, je souhaite commander :\n- ${p.name} × 1\nMerci de confirmer disponibilité, prix et modalités.`);
    if (u) { a.href = u; }
    else   { a.href = '/contact'; a.removeAttribute('target'); }
  });
}

/* ── Clics globaux : "Commander" + retirer du panier ── */
function setupAddToCart() {
  document.addEventListener('click', e => {
    const addEl = e.target.closest('[data-add]');
    if (addEl) {
      const p = PRODS.find(x => String(x.id) === String(addEl.dataset.add));
      if (p) {
        cart[p.id] = (cart[p.id] || 0) + (p.min || 1);
        saveCart();
        window.location.href = '/contact';
      }
      return;
    }
    const rmEl = e.target.closest('[data-rm]');
    if (rmEl) {
      delete cart[rmEl.dataset.rm];
      saveCart();
      renderRecap();
    }
  });
  document.addEventListener('change', e => {
    if (e.target.dataset.q) {
      cart[e.target.dataset.q] = Math.max(1, +e.target.value || 1);
      saveCart();
      renderRecap();
    }
  });
}

/* ── Menu mobile ── */
function setupMobileMenu() {
  const btn = document.getElementById('menu-btn');
  const nav = document.getElementById('nav-mobile');
  if (!btn || !nav) return;
  btn.onclick = () => {
    const isOpen = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
  };
  /* Fermer en cliquant en dehors */
  document.addEventListener('click', e => {
    if (!btn.contains(e.target) && !nav.contains(e.target)) {
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ── Footer : coordonnées et réseaux sociaux ── */
function renderFooterInfo() {
  const el = document.getElementById('footer-contact-info');
  if (el) {
    const lines = [
      CFG.ville    && `📍 ${esc(CFG.ville)}`,
      CFG.tel      && `📞 ${esc(CFG.tel)}`,
      CFG.mail     && `✉️ <a href="mailto:${esc(CFG.mail)}" style="color:#f9c98a">${esc(CFG.mail)}</a>`,
      CFG.horaires && `🕐 ${esc(CFG.horaires)}`
    ].filter(Boolean);
    el.innerHTML = lines.join('<br>') || '<em style="opacity:.6">Coordonnées à compléter</em>';
  }

  const social = document.getElementById('footer-social');
  if (social) {
    const btns = [['facebook', '📘'], ['instagram', '📷'], ['tiktok', '🎵']]
      .filter(([k]) => CFG[k])
      .map(([k, icon]) => `<a class="social-btn" href="${esc(CFG[k])}" target="_blank" rel="noopener" aria-label="${k}">${icon}</a>`);
    social.innerHTML = btns.join('');
  }

  /* Logo dans le header — remplace le texte quand disponible */
  if (CFG.logo) {
    document.querySelectorAll('.logo-img-slot').forEach(slot => {
      if (!slot.querySelector('img')) {
        slot.innerHTML = `<img src="${esc(CFG.logo)}" alt="Logo CBS — Le Comptoir des Belles Saveurs" style="height:44px;width:auto;border-radius:6px;object-fit:contain">`;
      }
      /* Cache le texte à côté du logo */
      const txt = slot.parentElement && slot.parentElement.querySelector('.logo-txt');
      if (txt) txt.style.display = 'none';
    });

    /* Logo dans le footer — s'insère avant le nom de l'entreprise */
    document.querySelectorAll('.footer-brand').forEach(brand => {
      if (!brand.querySelector('.footer-logo-img')) {
        const img = document.createElement('img');
        img.src = CFG.logo;
        img.alt = 'Logo CBS';
        img.className = 'footer-logo-img';
        img.style.cssText = 'height:52px;width:auto;border-radius:8px;object-fit:contain;margin-bottom:10px;display:block';
        brand.insertBefore(img, brand.firstChild);
      }
    });
  }
}

/* ── Année dans le footer ── */
document.querySelectorAll('.yr').forEach(el => { el.textContent = new Date().getFullYear(); });

/* ════════════════════════════════════
   BOOTSTRAP — point d'entrée principal
   ════════════════════════════════════ */
function initPage() {
  setupMobileMenu();
  saveCart();

  const path = window.location.pathname;

  fetch('/api/public')
    .then(r => r.json())
    .then(d => {
      CFG   = d.cfg;
      PRODS = d.products;
      /* Exposer globalement pour les scripts inline */
      window.CFG   = CFG;
      window.PRODS = PRODS;

      renderFooterInfo();
      setupWaFloat();

      /* ── Textes dynamiques (slogan, hero, annonce) ── */
      const heroSlogan = document.getElementById('hero-slogan');
      if (heroSlogan && CFG.slogan) heroSlogan.textContent = CFG.slogan;
      const heroTexte = document.getElementById('hero-texte');
      if (heroTexte && CFG.hero_texte) heroTexte.textContent = CFG.hero_texte;
      const annonceBar = document.getElementById('annonce-bar');
      if (annonceBar && CFG.annonce) annonceBar.innerHTML = CFG.annonce;

      /* ─ Pages catalogue ─ */
      const cat = path.includes('sucres') ? 'sucres'
                : path.includes('sales')  ? 'sales'
                : path.includes('fatayas') ? 'fatayas'
                : path.includes('jus')     ? 'jus'
                : null;

      if (cat) {
        const catProds = PRODS.filter(p => p.cat === cat);
        const grid = document.getElementById('prod-grid');
        if (grid) {
          grid.innerHTML = catProds.length
            ? catProds.map(productCard).join('')
            : `<div class="note" style="grid-column:1/-1">
                Cette catégorie sera complétée prochainement.
                <a href="/contact" style="color:var(--o)">Contactez-nous</a> pour connaître nos disponibilités.
               </div>`;
        }
        /* Barre de recherche */
        const search = document.getElementById('cat-search');
        if (search) {
          const sw = document.getElementById('search-wrap');
          if (sw && catProds.length > 5) sw.style.display = 'block';
          search.addEventListener('input', () => {
            const v = search.value.toLowerCase();
            document.querySelectorAll('#prod-grid .prod-card').forEach(c => {
              c.style.display = c.textContent.toLowerCase().includes(v) ? '' : 'none';
            });
          });
        }
        setupAddToCart();
        setupWaProductBtns();
        /* Bouton WA catégorie */
        const waCatBtn = document.getElementById('wa-cat-btn');
        if (waCatBtn && CFG.wa) {
          waCatBtn.href = waUrl(`Bonjour Le Comptoir des Belles Saveurs, je souhaite commander : ${CAT_LABEL[cat] || cat}.`);
          waCatBtn.style.display = 'inline-flex';
        }
      }

      /* ─ Page d'accueil ─ */
      const homeGrid = document.getElementById('home-prod-grid');
      if (homeGrid) {
        homeGrid.innerHTML = PRODS.length
          ? PRODS.slice(0, 6).map(productCard).join('')
          : `<div style="grid-column:1/-1;text-align:center;color:var(--tx2);padding:20px">
               Les produits seront bientôt disponibles. <a href="/contact" style="color:var(--o)">Contactez-nous</a>.
             </div>`;
        setupAddToCart();
        setupWaProductBtns();
        /* Bouton WA événements accueil */
        const waEvBtnHome = document.getElementById('wa-ev-btn');
        if (waEvBtnHome && CFG.wa) { waEvBtnHome.href = waUrl('Bonjour Le Comptoir des Belles Saveurs, je souhaite un devis pour un événement.'); waEvBtnHome.style.display = 'inline-flex'; }
        /* Bouton WA accueil */
        const waHomeBtn = document.getElementById('wa-home-btn');
        if (waHomeBtn && CFG.wa) { waHomeBtn.href = waDefault(); waHomeBtn.style.display = 'inline-flex'; }
        /* Hero image */
        if (CFG.hero) {
          const hi = document.getElementById('hero-img-wrap');
          if (hi) hi.innerHTML = `<img src="${esc(CFG.hero)}" alt="Beignets et fatayas du Comptoir des Belles Saveurs" style="width:100%;border-radius:20px;display:block">`;
        }
        /* Image de la première photo de chaque catégorie */
        ['sucres', 'sales', 'fatayas', 'jus'].forEach(k => {
          const first = PRODS.find(p => p.cat === k && p.img);
          const box = document.getElementById('cat-img-' + k);
          if (box && first) {
            box.innerHTML = `<img src="${esc(first.img)}" alt="${esc(k)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`;
          }
        });
      }

      /* ─ Page contact ─ */
      if (path.includes('contact')) {
        const waContactBtn = document.getElementById('wa-contact-btn');
        if (waContactBtn && CFG.wa) { waContactBtn.href = waDefault(); waContactBtn.style.display = 'inline-flex'; }
        /* Remplir les boîtes de contact */
        {
          const fillContact = (id, val, href) => {
            const elc = document.getElementById(id); if (!elc) return;
            if (val) {
              elc.style.fontStyle = 'normal'; elc.style.color = 'var(--txt-main)';
              elc.innerHTML = href ? `<a href="${href}" style="color:var(--o)">${val}</a>` : val;
            }
          };
          fillContact('contact-wa-num', CFG.wa);
          fillContact('contact-tel', CFG.tel);
          fillContact('contact-mail', CFG.mail, CFG.mail ? 'mailto:' + CFG.mail : null);
          fillContact('contact-ville', CFG.ville ? CFG.ville + (CFG.retrait ? '<br><small>Retrait : ' + CFG.retrait + '</small>' : '') : null);
          fillContact('contact-horaires', CFG.horaires);
          fillContact('contact-retrait', CFG.retrait);
        }
        if (CFG.livraison) { const mwC = document.getElementById('mode-wrap'); if (mwC) mwC.style.display = 'block'; }
        setupOrderForm(false);
        setupAddToCart();
      }

      /* ─ Page événements ─ */
      if (path.includes('evenements')) {
        const waEvBtn = document.getElementById('wa-ev-btn');
        if (waEvBtn && CFG.wa) { waEvBtn.href = waUrl('Bonjour Le Comptoir des Belles Saveurs, je souhaite un devis pour un événement.'); waEvBtn.style.display = 'inline-flex'; }
        if (CFG.livraison) {
          const mwE = document.getElementById('mode-wrap');
          if (mwE) mwE.style.display = 'block';
        }
        setupOrderForm(true);
        setupAddToCart();
      }

      /* ─ Page à propos ─ */
      if (path.includes('apropos')) {
        [
          ['ap-presentation', 'a_presentation'],
          ['ap-histoire',     'a_histoire'],
          ['ap-activite',     'a_activite'],
          ['ap-valeurs',      'a_valeurs'],
          ['ap-demarche',     'a_demarche'],
          ['ap-engagement',   'a_engagement']
        ].forEach(([elId, key]) => {
          const elAp = document.getElementById(elId);
          if (elAp) {
            elAp.innerHTML = CFG[key]
              ? `<p style="white-space:pre-line">${esc(CFG[key])}</p>`
              : `<p style="color:var(--tx2);font-style:italic">À compléter dans l'espace d'administration.</p>`;
          }
        });
      }

      /* ─ Page mentions légales ─ */
      if (path.includes('legal')) {
        const fillLegal = (id, key, fallback) => {
          const elL = document.getElementById(id);
          if (elL) elL.innerHTML = CFG[key] ? esc(CFG[key]) : `<em style="color:var(--tx2)">${fallback || 'À compléter'}</em>`;
        };
        fillLegal('leg-nom',           'legal_nom');
        fillLegal('leg-resp',          'legal_resp');
        fillLegal('leg-adresse',       'legal_adresse');
        fillLegal('leg-id',            'legal_id',   'À compléter — ne pas inventer');
        fillLegal('leg-contact',       'mail',        CFG.tel || 'À compléter');
        fillLegal('leg-hebergeur',     'hebergeur');
        fillLegal('leg-conservation',  'conservation','À définir par la responsable');
        fillLegal('leg-droits-contact','mail',         CFG.tel || 'À compléter');
      }
    })
    .catch(() => {
      /* Serveur inaccessible */
      const offlineEl = document.getElementById('offline-msg');
      if (offlineEl) offlineEl.style.display = 'block';
      /* Sur la page contact : désactiver le formulaire et expliquer */
      const form = document.getElementById('order-form');
      if (form) {
        const res = document.getElementById('form-result');
        if (res) res.innerHTML = `
<div class="note note-err">
  Le serveur n'est pas accessible. Pour envoyer une commande, lancez :
  <code style="display:block;margin:8px 0;padding:6px 10px;background:rgba(0,0,0,.06);border-radius:6px">node --no-warnings --experimental-sqlite server.js</code>
  Puis ouvrez <strong>http://localhost:3000/contact</strong>
</div>`;
        form.querySelectorAll('button[type=submit]').forEach(b => b.disabled = true);
      }
    });
}

/* Démarrage */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPage);
} else {
  initPage();
}
