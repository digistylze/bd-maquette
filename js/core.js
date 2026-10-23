/* BD : noyau : état, stockage, composants, routeur */
(function (V) {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  V.$ = $; V.$$ = $$;
  V.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  V.i = (n, cls = '') => `<svg class="ico ${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  V.img = (n, size) => `img/p/${n}${size === 's' ? '-s' : ''}.webp`;
  V.wait = (ms) => new Promise((r) => setTimeout(r, ms));
  V.chf = (n) => 'CHF ' + Number(n).toLocaleString('fr-CH').replace(/ |\s/g, '’');
  V.nf = (n) => Number(n).toLocaleString('fr-CH').replace(/ |\s/g, '’');

  /* ---------- Stockage : la sélection anonyme vit dans sessionStorage (effacée à la fermeture) ---------- */
  const read = (store, k, d) => { try { return JSON.parse(store.getItem(k)) ?? d; } catch (e) { return d; } };
  const write = (store, k, v) => { try { store.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible : on continue en mémoire */ } };
  const S0 = { start: Date.now(), sel: [], hidden: [], seen: [], ev: [], chg: { arrive: [], dispo: [], upd: [] } };
  const L0 = { theme: null, ageOk: 0, account: null, searches: [], alerts: {}, prefs: { city: 'Genève', lang: 'fr', discreet: false, freq: 'immediate' }, recent: [], pro: { statuses: {}, hidden: false, plan: 'visibilite', absences: [], featDays: [] }, reports: 0 };
  V.S = Object.assign({}, S0, read(sessionStorage, 'vl.session', {}));
  V.L = Object.assign({}, L0, read(localStorage, 'vl.local', {}));
  V.L.pro = Object.assign({}, L0.pro, V.L.pro || {});
  V.save = () => { write(sessionStorage, 'vl.session', V.S); write(localStorage, 'vl.local', V.L); };
  if (!read(sessionStorage, 'vl.session', null)) V.save();

  /* Sélection : compte connecté = synchronisée (localStorage), sinon session du navigateur */
  V.sel = () => (V.L.account ? V.L.account.sel : V.S.sel);
  V.hidden = () => (V.L.account ? V.L.account.hidden : V.S.hidden);
  V.isSel = (id) => V.sel().includes(id);

  /* ---------- Statuts de disponibilité (horodatés, expirent seuls) ---------- */
  V.statusOf = (p) => {
    const o = (V.S.ov && V.S.ov[p.id]) || V.L.pro.statuses[p.id];
    const s = o || p.status;
    const since = s.since || Date.now();
    if (s.t === 'now' && Date.now() - since > 60 * 60e3) return { t: 'request', since: since + 60 * 60e3, expired: true };
    if (s.t === 'busy' && Date.now() - since > 2 * 3600e3) return { t: 'request', since: since + 2 * 3600e3, expired: true };
    return s;
  };
  V.agoTxt = (ts) => {
    const m = Math.max(1, Math.round((Date.now() - ts) / 60e3));
    if (m < 60) return `il y a ${m} min`;
    const h = Math.round(m / 60);
    return h < 24 ? `il y a ${h} h` : `il y a ${Math.round(h / 24)} j`;
  };
  V.statusInfo = (p) => {
    const s = V.statusOf(p);
    const D = V.date;
    switch (s.t) {
      case 'now': return { cls: 'now', label: 'Disponible maintenant', short: 'Disponible', sub: V.agoTxt(s.since) };
      case 'busy': return { cls: 'busy', label: 'Occupée', short: 'Occupée', sub: V.agoTxt(s.since) };
      case 'today': return { cls: 'soon', label: `Aujourd’hui dès ${s.at}`, short: `Dès ${s.at}`, sub: V.agoTxt(s.since) };
      case 'tonight': return { cls: 'soon', label: `Ce soir à ${s.at}`, short: `Ce soir ${s.at}`, sub: V.agoTxt(s.since) };
      case 'tomorrow': return { cls: 'soon', label: `Demain dès ${s.at}`, short: `Demain ${s.at}`, sub: V.agoTxt(s.since) };
      case 'away': return { cls: 'away', label: `De retour le ${D.fmtD(D.addDays(s.day))}`, short: `Retour ${D.fmtD(D.addDays(s.day), { day: 'numeric', month: 'short' })}`, sub: V.agoTxt(s.since) };
      case 'arrive': return { cls: 'away', label: `Arrive à Genève le ${D.fmtD(D.addDays(s.day))}`, short: `Arrive le ${D.fmtD(D.addDays(s.day), { day: 'numeric', month: 'short' })}`, sub: V.agoTxt(s.since) };
      default: return { cls: 'req', label: 'Sur demande', short: 'Sur demande', sub: s.expired ? 'statut expiré automatiquement' : V.agoTxt(s.since) };
    }
  };
  V.statusRank = { now: 0, today: 1, tonight: 2, tomorrow: 3, busy: 4, request: 5, arrive: 6, away: 7 };
  V.statusPill = (p, flat, short) => { const s = V.statusInfo(p); return `<span class="status ${s.cls}${flat ? ' flat' : ''}"><i></i>${short ? s.short : s.label}</span>`; };

  V.ageTxt = (p) => (Array.isArray(p.age) ? p.age.join(' et ') + ' ans' : p.age + ' ans');
  V.ageShort = (p) => (Array.isArray(p.age) ? p.age.join(' · ') : p.age);
  V.modeTxt = (m) => ({ both: 'reçoit et se déplace', incall: 'reçoit', outcall: 'se déplace' }[m]);
  V.communeTxt = (id) => (V.COMMUNES.find((c) => c.id === id) || V.COMMUNES_GE.find((c) => c.id === id) || { label: id }).label;
  V.communeOf = (p) => (V.COMMUNES.find((c) => c.id === p.commune) || {}).c || p.commune;
  V.langTxt = (p, n = 3) => p.langs.slice(0, n).map(([l, lv]) => `${V.LANGS[l]} ${lv}`).join(' · ');
  /* Mode « profils fictifs » (?fictifs dans l'adresse) : pour les captures de la vidéo, on montre les profils
     fictifs à la place des 12 vrais profils. Sans ce paramètre, la maquette du client reste inchangée. */
  V.FICTIFS = /[?&]fictifs\b/.test(location.search);
  if (V.FICTIFS) {
    V.PROFILES.forEach((p) => { p.cache = !!p.importe; });
    V.STORIES = ['valentina', 'alma', 'nora', 'maya', 'camille', 'luna', 'lina', 'jade', 'sofia', 'adrien', 'clara-hugo', 'zoe'];
    V.SPONSORED = [{ pid: 'valentina', zone: 'canton', from: -2, to: 4 }, { pid: 'nora', zone: 'canton', from: -3, to: 3 }, { pid: 'camille', zone: 'vieille-ville', from: -1, to: 5 }, { pid: 'maya', zone: 'champel', from: 0, to: 2 }, { pid: 'alma', zone: 'eaux-vives', from: -1, to: 6 }];
    const CLF = ['oui', 'discuter', 'non'];
    V.PROFILES.filter((p) => !p.importe).forEach((p, k) => { p.clients = p.clients || { solo: 'oui', couple: CLF[k % 3], multi: CLF[(k + 2) % 3], pro: CLF[(k + 1) % 3] }; });
    const set = (id, o) => { const p = V.PROFILES.find((x) => x.id === id); if (p) Object.assign(p, o); };
    set('valentina', { online: true, links: [{ k: 'instagram', h: '@valentina.geneve' }, { k: 'onlyfans', h: 'valentina_ge' }] });
    set('nora', { links: [{ k: 'webcam', h: 'Nora en direct' }, { k: 'onlyfans', h: 'nora.swiss' }] });
    set('maya', { newPhoto: true, links: [{ k: 'onlyfans', h: 'maya_champel' }] });
    set('zoe', { tourLeft: 2 }); set('lina', { newPhoto: true }); ['alma', 'luna', 'jade'].forEach((id) => set(id, { online: true }));
  }
  V.visible = (p) => !p.cache &&!(p.id === 'alma' && V.L.pro.hidden) && !(p.arrival && !V.S.chg.arrive.includes(p.id)) && !(p.members && p.members.includes('alma') && V.L.pro.hidden);

  /* ---------- Typographie française : espace insécable avant : ; ! ? et dans les guillemets ---------- */
  V.typo = (root) => {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let t = w.nextNode(); t; t = w.nextNode()) {
      if (t.parentElement && t.parentElement.closest('script, style, textarea')) continue;
      const v = t.nodeValue;
      const n = v.replace(/ ([;!?])/g, '\u202F$1').replace(/ :/g, '\u00A0:').replace(/« /g, '«\u00A0').replace(/ »/g, '\u00A0»');
      if (n !== v) t.nodeValue = n;
    }
  };
  /* Libellés des boutons découpés en lettres pour qu'elles roulent l'une après l'autre au survol */
  V.splitRoll = (root) => root.querySelectorAll('.roll > span:not([data-s])').forEach((s) => {
    if (s.children.length) return;
    s.dataset.s = '1';
    if (/[\u0590-\u08ff]/.test(s.textContent)) return; // arabe, hébreu : les lettres doivent rester liées
    s.innerHTML = [...s.textContent].map((ch, k) => `<i style="--i:${k}">${V.esc(ch)}</i>`).join('');
  });
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) { V.typo(n); V.splitRoll(n); } else if (n.nodeType === 3 && n.parentElement) V.typo(n.parentElement); })))
    .observe(document.documentElement, { childList: true, subtree: true });

  /* ---------- Carte profil ---------- */
  /* Placements sponsorisés (C02, P08) : campagnes en cours, compatibles avec la recherche, jamais en double */
  V.sponsoredNow = () => (V.SPONSORED || []).filter((c) => c.from <= 0 && c.to >= 0).map((c) => Object.assign({}, c, { p: V.byId(c.pid) })).filter((c) => c.p && V.visible(c.p) && !V.hidden().includes(c.p.id));
  // « canton » : visible dans toutes les recherches ; quartier : seulement quand la recherche porte sur ce quartier
  V.sponsoredFor = (q, L) => { const ids = new Set(L.map((p) => p.id)); const com = (q.commune || '').split(',').filter(Boolean); const seen = new Set(); return V.sponsoredNow().filter((c) => ids.has(c.pid) && (c.zone === 'canton' || com.includes(c.zone)) && !seen.has(c.pid) && seen.add(c.pid)).map((c) => c.p); };
  // un placement sponsorisé en tête de chaque lot de 8 ; le profil n'apparaît plus à sa place organique
  V.arrangeSponsored = (L, sp, per = 8) => { const s = new Set(sp.map((p) => p.id)); const org = L.filter((p) => !s.has(p.id)); const out = []; let i = 0, k = 0; while (i < org.length || k < sp.length) { if (k < sp.length) out.push(sp[k++]); for (let j = 0; j < per - 1 && i < org.length; j++) out.push(org[i++]); } return out; };
  V.FLAGS = {
    fr: '<rect width="30" height="20" fill="#ED2939"/><rect width="20" height="20" fill="#fff"/><rect width="10" height="20" fill="#002395"/>',
    it: '<rect width="30" height="20" fill="#CE2B37"/><rect width="20" height="20" fill="#fff"/><rect width="10" height="20" fill="#009246"/>',
    de: '<rect width="30" height="20" fill="#FFCE00"/><rect width="30" height="13.33" fill="#DD0000"/><rect width="30" height="6.67" fill="#000"/>',
    es: '<rect width="30" height="20" fill="#AA151B"/><rect y="5" width="30" height="10" fill="#F1BF00"/>',
    ru: '<rect width="30" height="20" fill="#D52B1E"/><rect width="30" height="13.33" fill="#0039A6"/><rect width="30" height="6.67" fill="#fff"/>',
    pt: '<rect width="30" height="20" fill="#FF0000"/><rect width="12" height="20" fill="#006600"/><circle cx="12" cy="10" r="4" fill="#FFCC00"/>',
    en: '<rect width="30" height="20" fill="#012169"/><path d="M0 0 30 20M30 0 0 20" stroke="#fff" stroke-width="4"/><path d="M0 0 30 20M30 0 0 20" stroke="#C8102E" stroke-width="1.6"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="6"/><path d="M15 0v20M0 10h30" stroke="#C8102E" stroke-width="3.6"/>',
    uk: '<rect width="30" height="20" fill="#FFD700"/><rect width="30" height="10" fill="#0057B7"/>',
    sv: '<rect width="30" height="20" fill="#006AA7"/><rect x="9" width="4" height="20" fill="#FECC00"/><rect y="8" width="30" height="4" fill="#FECC00"/>',
    zh: '<rect width="30" height="20" fill="#DE2910"/><path d="M5 2.5l1.2 3.6h3.8L6.9 8.3l1.2 3.6L5 9.7l-3.1 2.2 1.2-3.6L0 6.1h3.8z" fill="#FFDE00"/>',
    th: '<rect width="30" height="20" fill="#A51931"/><rect y="3.33" width="30" height="13.33" fill="#F4F5F8"/><rect y="6.67" width="30" height="6.67" fill="#2D2A4A"/>',
    ca: '<rect width="30" height="20" fill="#FCDD09"/><g fill="#DA121A"><rect y="2.2" width="30" height="2.2"/><rect y="6.7" width="30" height="2.2"/><rect y="11.1" width="30" height="2.2"/><rect y="15.6" width="30" height="2.2"/></g>',
    ln: '<rect width="30" height="20" fill="#007FFF"/><path d="M0 17 25 0h5v3L5 20H0Z" fill="#F7D618"/><path d="M0 18.5 27.5 0H30v1.5L2.5 20H0Z" fill="#CE1021"/>',
    ar: '<rect width="30" height="20" fill="#1f6f47"/><text x="15" y="15" font-size="12" text-anchor="middle" fill="#fff" font-family="serif">ع</text>',
  };
  V.flag = (l) => `<svg class="flag" viewBox="0 0 30 20" aria-hidden="true">${V.FLAGS[l] || `<rect width="30" height="20" fill="#2a2430"/><text x="15" y="14" font-size="9" font-weight="700" text-anchor="middle" fill="#e2c68d" font-family="sans-serif">${l.toUpperCase()}</text>`}</svg>`;
  /* Carte profil commune à tout le site : photo avec statut, badges et nom, puis localisation, langues, repères, prix et accès à la fiche */
  /* Libellé des encarts payants : choisi par BD, réglable dans Back-office › Paramètres */
  V.sponLabel = () => ((V.L.adm2 && V.L.adm2.params && V.L.adm2.params.sponLabel) || 'Mise en avant');
  /* Tarif de départ : « non renseigné » reste distinct de zéro */
  V.fromTxt = (p) => (p.from ? `dès ${p.from}.–` : 'tarif non renseigné');
  /* Zone approximative sur la carte : 100, 150 ou 200 m de rayon, jamais centrée sur l'adresse */
  V.zoneR = (p) => { if (p.id === 'alma' && V.L.pro && V.L.pro.priv && V.L.pro.priv.zoneR) return V.L.pro.priv.zoneR; let h = 0; for (const c of p.id) h = (h * 31 + c.charCodeAt(0)) >>> 0; return [100, 150, 200][h % 3]; };
  const MODE_TAG = { incall: 'Reçoit', outcall: 'Se déplace', both: 'Reçoit · déplace' };
  V.card = (p, o = {}) => {
    const on = V.isSel(p.id);
    const seen = V.S.seen.includes(p.id) && !o.noSeen;
    const feat = o.feat;
    const mos = feat && p.photos.length > 1; // carte sponsorisée : deux ou trois photos verticales côte à côte
    const chg = V.S.chg;
    const badges = [];
    if (p.duoVerified) badges.push('<span class="badge dark">Duo vérifié</span>');
    if (p.isNew || chg.arrive.includes(p.id)) badges.push('<span class="badge goldfill">Nouveau</span>');
    if (p.isUpd || chg.upd.includes(p.id)) badges.push('<span class="badge dark">Mis à jour</span>');
    if (p.faceHidden) badges.push('<span class="badge dark">Visage masqué</span>');
    if (p.tourLeft) badges.push(`<span class="badge pst-tour">Plus que ${p.tourLeft} jour${p.tourLeft > 1 ? 's' : ''}</span>`);
    if (p.newPhoto) badges.push('<span class="badge pst-photo">Nouvelle photo</span>');
    if (p.online) badges.push('<span class="badge pst-online"><i></i>En ligne</span>');
    const langs = p.langs.slice(0, 3).map(([l]) => `<i class="lang">${V.flag(l)}${l.toUpperCase()}</i>`).join('');
    const tags = [p.attrs && p.attrs.Silhouette, MODE_TAG[p.mode]].filter(Boolean).map((t) => `<i class="ptag">${V.esc(t)}</i>`).join('');
    return `<article class="card p-card${feat ? ' feat' : ''}${seen ? ' seen' : ''}" data-id="${p.id}" style="animation-delay:${(o.i || 0) % 8 * 45}ms">
      <div class="p-ph protect" data-act="open" data-id="${p.id}">
        ${mos ? `<div class="p-mos">${p.photos.slice(0, 3).map((ph, k) => `<span><img src="${V.img(ph, 's')}" srcset="${V.img(ph, 's')} 360w, ${V.img(ph)} 900w" sizes="(min-width:640px) 16vw, 50vw" alt="${k ? '' : 'Photos de ' + V.esc(p.name)}" loading="lazy" draggable="false"></span>`).join('')}</div>`
          : `<img src="${V.img(p.photos[0], 's')}" srcset="${V.img(p.photos[0], 's')} 360w, ${V.img(p.photos[0])} 900w" sizes="${feat ? '(min-width:1024px) 40vw, 100vw' : '(min-width:1024px) 22vw, 50vw'}" alt="Photo de ${V.esc(p.name)}" loading="lazy" draggable="false">`}
        ${V.statusPill(p, false, true)}
        ${feat ? `<span class="p-spon" title="Placement payant, affiché seulement s’il correspond à votre recherche">${V.i('sparkles', 'sm')}${V.esc(V.sponLabel())}</span>` : ''}
        ${badges.length ? `<div class="p-badges">${badges.join('')}</div>` : ''}
        <span class="p-grad"></span>
        <b class="p-name">${V.esc(p.name)} <span>${V.ageShort(p)}</span>${V.i('badge-check', 'sm')}</b>
        ${seen ? '<span class="p-seen">Déjà vu</span>' : '<span class="wm">BD</span>'}
      </div>
      <button class="heart${on ? ' on' : ''}" data-act="fav" data-id="${p.id}" aria-label="${on ? 'Retirer de' : 'Ajouter à'} ma sélection" aria-pressed="${on}">${V.i('heart')}</button>
      <div class="p-body">
        <div class="p-line">${V.i('map-pin', 'sm')}<span>${V.communeTxt(p.commune)}</span></div>
        <div class="p-line p-langs">${V.i('languages', 'sm')}<span>${langs}</span></div>
        <div class="p-tags">${tags}</div>
        ${o.ago ? `<div class="p-line p-agoline">${V.i('clock', 'sm')}<span>Statut publié ${V.agoTxt(V.statusOf(p).since)}</span></div>` : ''}
        <div class="p-foot"><span class="p-price">${p.from ? `<small>dès</small> <b>${p.from}.–</b>` : '<small>Tarif</small> <b class="nr">non renseigné</b>'}</span>${V.btn('Voir le profil', { href: '#/profil/' + p.id, cls: 'sm dark', arrow: true })}</div>
        ${o.noHide ? '' : `<button class="hide-link" data-act="hide" data-id="${p.id}">${V.i('eye-off', 'sm')}Ne plus afficher</button>`}
      </div>
    </article>`;
  };
  V.skel = (n) => Array.from({ length: n }, () => '<div class="card skel"><div class="ph"></div><div class="ln" style="width:70%"></div><div class="ln" style="width:50%"></div></div>').join('');

  /* ---------- Toasts ---------- */
  V.toast = (msg, o = {}) => {
    const box = $('#toasts');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `${V.i(o.icon || 'check')}<span class="sp">${msg}</span>${o.action ? `<button>${o.action}</button>` : ''}`;
    if (o.action) t.querySelector('button').onclick = () => { o.fn && o.fn(); close(); };
    box.appendChild(t);
    const close = () => { t.classList.add('out'); setTimeout(() => t.remove(), 360); };
    setTimeout(close, o.ms || 3600);
    if (box.children.length > 3) box.firstElementChild.remove();
    return t;
  };

  /* ---------- Feuilles (bottom sheet / modale centrée sur grand écran) ---------- */
  V.sheet = {
    el: null,
    open(o) {
      this.close(true);
      const scrim = document.createElement('div'); scrim.className = 'scrim';
      const sh = document.createElement('section');
      sh.className = 'sheet' + (o.side ? ' sheet-side' : '');
      sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true');
      sh.innerHTML = `<div class="grab"></div><header class="sh-head"><h3>${o.title || ''}</h3><button class="icon-btn" data-close aria-label="Fermer">${V.i('x')}</button></header>
        <div class="sh-body">${o.body || ''}</div>${o.foot ? `<footer class="sh-foot">${o.foot}</footer>` : ''}`;
      document.body.append(scrim, sh);
      document.body.classList.add('lock');
      void sh.offsetWidth; scrim.classList.add('on'); sh.classList.add('on');
      scrim.onclick = () => this.close();
      sh.querySelector('[data-close]').onclick = () => this.close();
      this.el = sh; this.scrim = scrim; this.onClose = o.onClose;
      V.ui.enhance(sh);
      o.onOpen && o.onOpen(sh);
      let y0 = null;
      sh.querySelector('.grab').addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
      sh.querySelector('.grab').addEventListener('touchend', (e) => { if (y0 !== null && e.changedTouches[0].clientY - y0 > 60) this.close(); y0 = null; });
      return sh;
    },
    close(instant) {
      if (!this.el) return;
      const sh = this.el, sc = this.scrim, cb = this.onClose;
      this.el = null; this.scrim = null; this.onClose = null;
      if (!$('.ov.on') && !document.body.classList.contains('menu-open')) document.body.classList.remove('lock');
      if (instant) { sh.remove(); sc.remove(); } else { sh.classList.remove('on'); sc.classList.remove('on'); setTimeout(() => { sh.remove(); sc.remove(); }, 520); }
      cb && cb();
    },
  };
  V.confirm = (o) => new Promise((res) => {
    let done = false;
    const sh = V.sheet.open({
      title: o.title, body: `<p class="ink2">${o.text}</p>`,
      foot: `<button class="btn ghost sm" data-no style="flex:1">${o.cancel || 'Annuler'}</button><button class="btn ${o.danger ? 'danger' : ''} sm" data-yes style="flex:1">${o.ok || 'Confirmer'}</button>`,
      onClose: () => { if (!done) res(false); },
    });
    sh.querySelector('[data-no]').onclick = () => { done = true; res(false); V.sheet.close(); };
    sh.querySelector('[data-yes]').onclick = () => { done = true; res(true); V.sheet.close(); };
  });

  /* ---------- Petits composants ---------- */
  V.btn = (label, o = {}) => {
    const tag = o.span ? 'span' : o.href ? 'a' : 'button'; // span : bouton dessiné dans une carte déjà cliquable
    const attrs = [tag === 'a' ? `href="${o.href}"` : tag === 'button' ? 'type="button"' : '', o.act ? `data-act="${o.act}"` : '', o.id ? `data-id="${o.id}"` : '', o.attrs || ''].join(' ');
    const ic = o.arrow ? V.i(o.arrow === true ? 'arrow-right' : o.arrow, 'sm') : '';
    return `<${tag} class="btn ${o.cls || ''}" ${attrs}><span class="roll"><span>${label}</span><span aria-hidden="true">${label}</span></span>${ic ? `<span class="arr">${ic}${ic}</span>` : ''}</${tag}>`;
  };
  /* Carrousel : piste à défilement aimanté, points de pagination et flèches (initialisé par V.ui.carousels) */
  V.carousel = (items, cls = '') => `<div class="car" data-car><div class="car-track ${cls} rv-st">${items}</div><div class="car-foot"><div class="car-dots"></div><div class="car-nav d-only"><button type="button" data-car-prev aria-label="Précédent">${V.i('chevron-left', 'sm')}</button><button type="button" data-car-next aria-label="Suivant">${V.i('chevron-right', 'sm')}</button></div></div></div>`;
  V.seg = (name, items, cur, cls = '') => `<div class="seg ${cls}" data-seg="${name}">${items.map(([v, l]) => `<button type="button" data-v="${v}" class="${v === cur ? 'on' : ''}">${l}</button>`).join('')}<span class="thumb"></span></div>`;
  V.sw = (name, on, label, sub) => `<label class="switch-row"><span class="t"><b>${label}</b>${sub ? `<span>${sub}</span>` : ''}</span><span class="switch"><input type="checkbox" name="${name}" ${on ? 'checked' : ''}><span></span></span></label>`;
  V.field = (label, o = {}) => {
    const id = 'f' + Math.random().toString(36).slice(2, 8);
    if (o.type === 'select') return `<div class="field ${o.cls || ''}"><select id="${id}" name="${o.name || ''}">${o.options.map((x) => { const [v, l] = Array.isArray(x) ? x : [x, x]; return `<option value="${v}" ${v === o.value ? 'selected' : ''}>${l}</option>`; }).join('')}</select><label for="${id}">${label}</label><span class="chev">${V.i('chevron-down', 'sm')}</span></div>`;
    if (o.type === 'textarea') return `<div class="field ${o.cls || ''}"><textarea id="${id}" name="${o.name || ''}" placeholder=" " maxlength="${o.max || 600}" ${o.attrs || ''}>${o.value || ''}</textarea><label for="${id}">${label}</label><span class="bar"></span>${o.max ? `<span class="counter">${(o.value || '').length} / ${o.max}</span>` : ''}</div>`;
    return `<div class="field ${o.cls || ''}"><input id="${id}" name="${o.name || ''}" type="${o.type || 'text'}" placeholder=" " value="${V.esc(o.value || '')}" ${o.attrs || ''}><label for="${id}">${label}</label><span class="bar"></span>${o.suffix ? `<span class="suffix">${o.suffix}</span>` : ''}${o.state ? `<span class="state">${o.state}</span>` : ''}</div>`;
  };
  V.opt = (name, val, title, sub, o = {}) => `<label class="opt ${o.box ? 'box' : ''} ${o.on ? 'on' : ''} ${o.cls || ''}"><input type="${o.box ? 'checkbox' : 'radio'}" name="${name}" value="${val}" ${o.on ? 'checked' : ''}><span class="mark"></span><span class="t"><b>${title}</b>${sub ? `<span>${sub}</span>` : ''}</span>${o.right || ''}</label>`;
  V.empty = (icon, title, text, cta) => `<div class="empty">${V.i(icon, 'xl gold')}<h3 class="h3">${title}</h3><p class="muted">${text}</p>${cta ? `<div style="margin-top:18px">${cta}</div>` : ''}</div>`;

  /* Courbe SVG (statistiques) */
  V.lineChart = (series, o = {}) => {
    const W = 640, H = o.h || 220, P = 28;
    const max = Math.max(...series, ...(o.avg || [])) * 1.12;
    const x = (i) => P + (i * (W - P * 2)) / (series.length - 1);
    const y = (v) => H - P - (v / max) * (H - P * 2);
    const pts = series.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const area = `M${x(0)},${H - P} L${pts.replace(/ /g, ' L')} L${x(series.length - 1)},${H - P} Z`;
    const grid = [0, .25, .5, .75, 1].map((f) => `<line class="gridl" x1="${P}" x2="${W - P}" y1="${y(max * f / 1.12)}" y2="${y(max * f / 1.12)}"/>`).join('');
    const avg = o.avg ? `<polyline class="lineA" points="${o.avg.map((v, i) => `${x(i)},${y(v)}`).join(' ')}"/>` : '';
    const labels = (o.labels || []).map(([i, t]) => `<text class="axis" x="${x(i)}" y="${H - 8}" text-anchor="middle">${t}</text>`).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.aria || 'Graphique'}">${grid}<path class="area" d="${area}"/>${avg}<polyline class="lineP" points="${pts}"/>${labels}</svg>`;
  };
  V.spark = (series, color = 'var(--violet)') => {
    const W = 120, H = 34, max = Math.max(...series), min = Math.min(...series);
    const pts = series.map((v, i) => `${(i * W / (series.length - 1)).toFixed(1)},${(H - 3 - ((v - min) / (max - min || 1)) * (H - 6)).toFixed(1)}`).join(' ');
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  };
  V.donut = (parts) => {
    const colors = ['var(--violet)', 'var(--gold)', 'var(--violet-2)', '#c9a8ec', 'var(--line-2)'];
    let acc = 0; const C = 2 * Math.PI * 52;
    const segs = parts.map(([, v], i) => { const len = (v / 100) * C; const s = `<circle r="52" cx="75" cy="75" fill="none" stroke="${colors[i % 5]}" stroke-width="20" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-acc}" transform="rotate(-90 75 75)"/>`; acc += len; return s; }).join('');
    return { svg: `<svg class="donut" viewBox="0 0 150 150">${segs}</svg>`, legend: parts.map(([l, v], i) => `<span><i style="background:${colors[i % 5]}"></i>${l} ${v} %</span>`).join('') };
  };

  /* ---------- Routeur (hash) ---------- */
  V.routes = [];
  V.route = (re, fn, o = {}) => V.routes.push({ re, fn, o });
  V.parse = () => {
    const h = location.hash.replace(/^#/, '') || '/';
    const [route, anchor] = h.split('#');
    const [path, qs] = route.split('?');
    return { path: path || '/', q: Object.fromEntries(new URLSearchParams(qs || '')), anchor };
  };
  V.qs = (q) => { const s = new URLSearchParams(Object.entries(q).filter(([, v]) => v !== '' && v != null && v !== 'all')).toString(); return s ? '?' + s : ''; };
  V.go = (h) => { if (location.hash === h) V.render(); else location.hash = h; };
  V.mode = 'public';
  V.basePath = null;
  V.render = async () => {
    const { path, q } = V.parse();
    let hit = null, m = null;
    for (const r of V.routes) { if (r.o.notFound) continue; m = path.match(r.re); if (m) { hit = r; break; } }
    if (!hit) { hit = V.routes.find((r) => r.o.notFound); m = []; }
    if (hit.o.overlay) {
      if (!V.basePath) await V.renderBase('/profils', {}, V.routes.find((r) => r.re.test('/profils')), ['/profils']);
      return hit.fn(m, q);
    }
    // retour depuis une surcouche vers la même vue : on ferme sans recharger (la position est conservée)
    if (V.overlay.any() && V.basePath === path + V.qs(q)) { V.overlay.closeAll(); V.ui.chrome(path, V.mode); return; }
    V.overlay.closeAll(true);
    return V.renderBase(path, q, hit, m);
  };
  V.renderBase = async (path, q, hit, m) => {
    const newMode = hit.o.mode || 'public';
    const sameView = V.basePath && V.basePath.split('?')[0] === path && hit.o.keepScroll;
    if (newMode !== V.mode && V.booted) await V.ui.wipe();
    V.mode = newMode;
    document.documentElement.dataset.mode = newMode;
    const out = await hit.fn(m, q) || {};
    const view = $('#view');
    view.className = sameView ? '' : 'view-in';
    view.innerHTML = out.html || '';
    document.title = (out.title ? out.title + ' · ' : '') + 'BD · Genève (maquette)';
    V.basePath = path + V.qs(q);
    V.ui.chrome(path, newMode);
    V.ui.enhance(view);
    V.ui.carousels(view);
    V.ui.reveal(view);
    if (!sameView) window.scrollTo(0, 0);
    const a = V.parse().anchor; // ancre dans la page, ex. #/rejoindre#tarifs
    if (a && document.getElementById(a)) document.getElementById(a).scrollIntoView();
    out.after && out.after(view);
  };
})(window.V);
