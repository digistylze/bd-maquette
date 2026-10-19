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
    if (s.t === 'now' && Date.now() - since > 3 * 3600e3) return { t: 'request', since: since + 3 * 3600e3, expired: true };
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
      case 'today': return { cls: 'soon', label: `Aujourd’hui dès ${s.at}`, short: `Dès ${s.at}`, sub: V.agoTxt(s.since) };
      case 'tonight': return { cls: 'soon', label: `Ce soir à ${s.at}`, short: `Ce soir ${s.at}`, sub: V.agoTxt(s.since) };
      case 'tomorrow': return { cls: 'soon', label: `Demain dès ${s.at}`, short: `Demain ${s.at}`, sub: V.agoTxt(s.since) };
      case 'away': return { cls: 'away', label: `De retour le ${D.fmtD(D.addDays(s.day))}`, short: `Retour ${D.fmtD(D.addDays(s.day), { day: 'numeric', month: 'short' })}`, sub: V.agoTxt(s.since) };
      case 'arrive': return { cls: 'away', label: `Arrive à Genève le ${D.fmtD(D.addDays(s.day))}`, short: `Arrive le ${D.fmtD(D.addDays(s.day), { day: 'numeric', month: 'short' })}`, sub: V.agoTxt(s.since) };
      default: return { cls: 'req', label: 'Sur demande', short: 'Sur demande', sub: s.expired ? 'statut expiré automatiquement' : V.agoTxt(s.since) };
    }
  };
  V.statusRank = { now: 0, today: 1, tonight: 2, tomorrow: 3, request: 4, arrive: 5, away: 6 };
  V.statusPill = (p, flat, short) => { const s = V.statusInfo(p); return `<span class="status ${s.cls}${flat ? ' flat' : ''}"><i></i>${short ? s.short : s.label}</span>`; };

  V.ageTxt = (p) => (Array.isArray(p.age) ? p.age.join(' et ') + ' ans' : p.age + ' ans');
  V.ageShort = (p) => (Array.isArray(p.age) ? p.age.join(' · ') : p.age);
  V.modeTxt = (m) => ({ both: 'reçoit et se déplace', incall: 'reçoit', outcall: 'se déplace' }[m]);
  V.communeTxt = (id) => (V.COMMUNES.find((c) => c.id === id) || V.COMMUNES_GE.find((c) => c.id === id) || { label: id }).label;
  V.communeOf = (p) => (V.COMMUNES.find((c) => c.id === p.commune) || {}).c || p.commune;
  V.langTxt = (p, n = 3) => p.langs.slice(0, n).map(([l, lv]) => `${V.LANGS[l]} ${lv}`).join(' · ');
  V.visible = (p) => !p.cache && !(p.id === 'alma' && V.L.pro.hidden) && !(p.arrival && !V.S.chg.arrive.includes(p.id)) && !(p.members && p.members.includes('alma') && V.L.pro.hidden);

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
  V.card = (p, o = {}) => {
    const on = V.isSel(p.id);
    const seen = V.S.seen.includes(p.id) && !o.noSeen;
    const feat = o.feat;
    const chg = V.S.chg;
    const badges = [];
    if (p.duoVerified) badges.push('<span class="badge dark">Duo vérifié</span>');
    if (p.isNew || chg.arrive.includes(p.id)) badges.push('<span class="badge goldfill">Nouveau</span>');
    if (p.isUpd || chg.upd.includes(p.id)) badges.push('<span class="badge dark">Mis à jour</span>');
    if (p.faceHidden) badges.push('<span class="badge dark">Visage masqué</span>');
    return `<article class="card${feat ? ' feat' : ''}${seen ? ' seen' : ''}" data-id="${p.id}" style="animation-delay:${(o.i || 0) % 8 * 45}ms">
      <div class="ph protect" data-act="open" data-id="${p.id}">
        <img src="${V.img(p.photos[0], feat ? '' : 's')}" srcset="${V.img(p.photos[0], 's')} 360w, ${V.img(p.photos[0])} 900w" sizes="${feat ? '(min-width:1024px) 40vw, 100vw' : '(min-width:1024px) 22vw, 50vw'}" alt="Photo de ${V.esc(p.name)}" loading="lazy" decoding="async" draggable="false">
        <div class="tl">${V.statusPill(p, false, !feat)}</div>
        ${feat ? `<span class="badge goldfill feat-tag" title="Placement payant, affiché seulement s’il correspond à votre recherche">${V.i('sparkles', 'sm')}Sponsorisé</span>` : `<div class="bl">${badges.join('')}</div>`}
        <span class="wm">BD</span>
      </div>
      <button class="heart${on ? ' on' : ''}" data-act="fav" data-id="${p.id}" aria-label="${on ? 'Retirer de' : 'Ajouter à'} ma sélection" aria-pressed="${on}">${V.i('heart')}</button>
      <div class="body">
        <div class="nm" data-act="open" data-id="${p.id}">${V.esc(p.name)}<span class="age">${V.ageShort(p)}</span><span class="vf" title="Profil vérifié">${V.i('badge-check', 'sm')}</span></div>
        <div class="meta">${V.communeTxt(p.commune)} · ${V.langTxt(p, feat ? 4 : 2)}</div>
        <div class="price"><b>Dès ${p.from} CHF</b> · ${V.modeTxt(p.mode)}</div>
        ${o.noHide ? '' : `<div class="foot"><button class="hide-link" data-act="hide" data-id="${p.id}">${V.i('eye-off', 'sm')}Ne plus afficher</button></div>`}
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
