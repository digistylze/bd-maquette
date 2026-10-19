/* BD : interface : chrome, menu, thème, sélection, surcouches, nouveautés de session */
(function (V) {
  'use strict';
  const { $, $$ } = V;
  const ui = V.ui = {};

  ui.brand = (href = '#/') => `<a class="brand" href="${href}" aria-label="BD, accueil"><img class="brand-mark" src="img/logo-b-s.webp" alt="" width="101" height="112"><span>BD</span></a>`;

  /* ---------- Barre du haut + onglets selon le mode (public / pro / admin) ---------- */
  const NAV = {
    public: [['#/profils', 'Profils', '/profils'], ['#/profils?dispo=now', 'Disponibles', '/x'], ['#/carte', 'Carte', '/carte'], ['#/verifications', 'Vérifications', '/verifications'], ['#/securite', 'Sécurité', '/securite'], ['#/rejoindre', 'Nous rejoindre', '/rejoindre']],
    pro: [['#/pro', 'Tableau de bord', '/pro'], ['#/pro/statut', 'Statut', '/pro/statut'], ['#/pro/profil', 'Mon profil', '/pro/profil'], ['#/pro/stats', 'Statistiques', '/pro/stats'], ['#/pro/abonnement', 'Abonnement', '/pro/abonnement']],
    admin: [['#/admin', 'Vue d’ensemble', '/admin'], ['#/admin/candidatures', 'Candidatures', '/admin/candidatures'], ['#/admin/moderation', 'Modération', '/admin/moderation'], ['#/admin/signalements', 'Signalements', '/admin/signalements'], ['#/admin/facturation', 'Facturation', '/admin/facturation']],
  };
  const TABS = {
    public: [['#/', 'home', 'Accueil', (p) => p === '/'], ['#/profils', 'grid', 'Profils', (p) => p.startsWith('/profils') || p.startsWith('/geneve')], ['session'], ['#/compte', 'user', 'Compte', (p) => p.startsWith('/compte')], ['menu', 'menu', 'Menu']],
    pro: [['#/pro', 'layout', 'Tableau', (p) => p === '/pro'], ['#/pro/statut', 'zap', 'Statut', (p) => p === '/pro/statut'], ['#/pro/stats', 'chart', 'Stats', (p) => p === '/pro/stats'], ['#/pro/profil', 'user', 'Profil', (p) => p.startsWith('/pro/profil') || p === '/pro/photos'], ['menu', 'menu', 'Menu']],
    admin: [['#/admin', 'layout', 'Vue', (p) => p === '/admin'], ['#/admin/candidatures', 'id-card', 'Dossiers', (p) => p.startsWith('/admin/candidature')], ['#/admin/moderation', 'shield', 'Modérer', (p) => p === '/admin/moderation'], ['#/admin/signalements', 'flag', 'Signaux', (p) => p === '/admin/signalements'], ['menu', 'menu', 'Menu']],
  };
  let lastMode = null;
  ui.chrome = (path, mode) => {
    const top = $('#topbar .wrap');
    if (mode !== lastMode) {
      const pill = mode === 'pro' ? '<span class="mode-pill d-only"><i></i>Espace pro · Alma</span>' : mode === 'admin' ? '<span class="mode-pill d-only"><i></i>Back-office · démonstration</span>' : '';
      top.innerHTML = `${ui.brand(mode === 'pro' ? '#/pro' : mode === 'admin' ? '#/admin' : '#/')}${pill}
        <nav class="nav-d" aria-label="Navigation principale">${NAV[mode].map(([h, l]) => `<a href="${h}"><span class="roll"><span>${l}</span><span aria-hidden="true">${l}</span></span></a>`).join('')}<span class="pill"></span></nav>
        <span class="sp"></span>
        <button class="icon-btn d-only" data-act="theme" aria-label="Changer de thème">${V.i('moon')}</button>
        ${mode === 'public' ? `<a class="icon-btn" href="#/profils" data-act="focus-search" aria-label="Rechercher">${V.i('search')}</a>
        <button class="icon-btn" data-act="session" aria-label="Ma session">${V.i('heart')}<span class="count" id="selCount">0</span></button>
        <a class="icon-btn d-only" href="#/compte" aria-label="Mon compte">${V.i('user')}</a>
        <a class="btn sm dark d-only" href="#/pro" style="margin-left:6px"><span class="roll"><span>Espace pro</span><span aria-hidden="true">Espace pro</span></span></a>`
        : `<a class="btn sm ghost d-only" href="#/"><span class="roll"><span>Voir le site</span><span aria-hidden="true">Voir le site</span></span></a>`}
        <button class="menu-toggle" data-act="menu" aria-label="Ouvrir le menu" aria-expanded="false"><span class="lines"><i></i><i></i><i></i></span></button>`;
      $('#tabbar').innerHTML = TABS[mode].map((t) => {
        if (t[0] === 'session') return `<button class="tab" data-act="session">${V.i('heart')}<span>Ma session</span><span class="count" id="fabCount">0</span></button>`;
        if (t[0] === 'menu') return `<button class="tab" data-act="menu">${V.i('menu')}<span>Menu</span></button>`;
        return `<a class="tab" href="${t[0]}" data-tab="${t[0]}">${V.i(t[1])}<span>${t[2]}</span></a>`;
      }).join('') + '<span class="tab-ind"></span>';
      lastMode = mode;
      ui.themeIcon();
    }
    // lien actif + pastille glissante (desktop)
    const full = location.hash || '#/';
    const links = $$('.nav-d a');
    let on = links.find((a) => a.getAttribute('href') === full) || links.find((a) => { const h = a.getAttribute('href').replace('#', ''); return !h.includes('?') && h !== '/' && (path === h || (h.length > 4 && path.startsWith(h + '/'))); });
    links.forEach((a) => a.classList.toggle('on', a === on));
    const pill = $('.nav-d .pill');
    if (pill) { if (on) { pill.style.opacity = 1; pill.style.left = on.offsetLeft + 'px'; pill.style.width = on.offsetWidth + 'px'; } else pill.style.opacity = 0; }
    // onglet actif + bulle violette qui glisse dessous
    const tabs = $$('#tabbar .tab[data-tab]');
    let tOn = null;
    TABS[mode].forEach((t, i) => { if (t[3] && t[3](path)) tOn = $$('#tabbar > *')[i]; });
    tabs.forEach((t) => t.classList.toggle('on', t === tOn));
    const ind = $('#tabbar .tab-ind');
    if (ind) { if (tOn) { ind.style.opacity = 1; ind.style.left = (tOn.offsetLeft + 3) + 'px'; ind.style.width = (tOn.offsetWidth - 6) + 'px'; } else ind.style.opacity = 0; }
    ui.counts();
    ui.menuActive(path);
  };

  /* ---------- Compteurs de sélection ---------- */
  ui.counts = (bump) => {
    const n = V.sel().length;
    ['#selCount', '#fabCount'].forEach((s) => { const el = $(s); if (!el) return; el.textContent = n; el.classList.toggle('on', n > 0); if (s === '#fabCount') el.style.display = n ? '' : 'none'; if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); } });
    ui.renderSession();
  };

  /* ---------- Thème clair / sombre (révélation circulaire, View Transitions) ---------- */
  ui.applyTheme = (t) => { document.documentElement.dataset.theme = t; $('meta[name="theme-color"]').setAttribute('content', t === 'dark' ? '#0b0810' : '#ffffff'); ui.themeIcon(); };
  ui.themeIcon = () => { const d = document.documentElement.dataset.theme === 'dark'; $$('[data-act="theme"]').forEach((b) => { if (b.classList.contains('icon-btn')) b.innerHTML = V.i(d ? 'sun' : 'moon'); }); $$('[data-theme-label]').forEach((el) => { el.textContent = d ? 'Thème clair' : 'Thème sombre'; }); };
  ui.toggleTheme = (btn) => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    V.L.theme = next; V.save();
    const r = btn ? btn.getBoundingClientRect() : { left: innerWidth / 2, top: 0, width: 0, height: 0 };
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return ui.applyTheme(next);
    const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const t = document.startViewTransition(() => ui.applyTheme(next));
    t.ready.then(() => document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] }, { duration: 750, easing: 'cubic-bezier(.76,0,.24,1)', pseudoElement: '::view-transition-new(root)' }));
  };

  /* ---------- Menu plein écran (Awwwards Nav #18 : rideaux en cascade, panneau qui se déroule ; liste à points Nav #9) ---------- */
  ui.menuHTML = () => `
    <div class="m-bg"></div><div class="m-bg"></div><div class="m-bg"></div><div class="m-bg"></div>
    <div class="menu-inner"><div class="m-cols">
      <div class="m-main"><div class="m-eyebrow">BD · Genève</div>
        <ul class="m-links">
          <li><a href="#/profils" data-m="/profils"><span class="n">01</span><span class="t">Tous les profils</span><span class="dot"></span></a></li>
          <li><a href="#/profils?dispo=now" data-m="now"><span class="n">02</span><span class="t">Disponibles maintenant</span><span class="dot"></span></a></li>
          <li><a href="#/carte" data-m="/carte"><span class="n">03</span><span class="t">Autour de moi, sur la carte</span><span class="dot"></span></a></li>
          <li><a href="#/profils?tri=new" data-m="new"><span class="n">04</span><span class="t">Nouvelles arrivées</span><span class="dot"></span></a></li>
          <li><a href="#/profils?cat=duo" data-m="duo"><span class="n">05</span><span class="t">Couples et duos</span><span class="dot"></span></a></li>
          <li><a href="#/verifications" data-m="/verifications"><span class="n">06</span><span class="t">Comment nous vérifions</span><span class="dot"></span></a></li>
          <li><a href="#/securite" data-m="/securite"><span class="n">07</span><span class="t">Sécurité et signalement</span><span class="dot"></span></a></li>
          <li><a href="#/rejoindre" data-m="/rejoindre"><span class="n">08</span><span class="t">Nous rejoindre</span><span class="dot"></span></a></li>
        </ul></div>
      <div class="m-side m-fade">
        <div class="m-grid">
          <a class="m-tile" href="#/compte"><b>Mon compte</b><span>Facultatif, sans mot de passe</span></a>
          <a class="m-tile" href="#/pro"><b>Espace pro</b><span>Démo : connectée en tant qu’Alma</span></a>
          <a class="m-tile" href="#/pro/inscription/1"><b>Inscription escorte</b><span>Quatre étapes, vérification simulée</span></a>
          <a class="m-tile" href="#/admin"><b>Back-office</b><span>Adresse séparée en production</span></a>
        </div>
        <div class="m-foot">
          <button class="m-chip" data-act="theme">${V.i('moon', 'sm')}<span data-theme-label>Thème sombre</span></button>
          <button class="m-chip" data-act="lang">${V.i('globe', 'sm')}FR · EN · ES · PT · RU</button>
          <button class="m-chip" data-act="demo-news">${V.i('zap', 'sm')}Démo : simuler une nouveauté</button>
          <button class="m-chip" data-act="panic">${V.i('door', 'sm')}Sortie rapide</button>
        </div>
      </div>
    </div></div>`;
  ui.menuActive = (path) => {
    const q = V.parse().q;
    $$('#menu .m-links a').forEach((a) => {
      const k = a.dataset.m;
      const on = (k === 'now' && q.dispo === 'now') || (k === 'new' && q.tri === 'new') || (k === 'duo' && q.cat === 'duo') || (k === path && !q.dispo && !q.tri && !q.cat);
      a.classList.toggle('on', on);
    });
  };
  ui.menu = (open) => {
    const body = document.body;
    const isOpen = body.classList.contains('menu-open');
    if (open === undefined) open = !isOpen;
    if (open === isOpen) return;
    body.classList.toggle('menu-open', open);
    body.classList.toggle('lock', open || !!$('.ov.on'));
    $('#topbar .menu-toggle').setAttribute('aria-expanded', open);
    ui.themeIcon();
    ui.menuActive(V.parse().path);
  };

  /* ---------- Transition « vague violette » entre les espaces (Page Transitions #5) ---------- */
  ui.wipe = () => new Promise((res) => {
    const w = $('#wipe');
    w.classList.remove('run'); void w.offsetWidth; w.classList.add('run');
    setTimeout(res, 520);
    setTimeout(() => w.classList.remove('run'), 1250);
  });

  /* ---------- Apparitions au défilement (transitions de section) ---------- */
  const AUTO = '.page-hero, .sec-head, .ctrl-list, .plans, .addons, .ed-list, .nums, .grid-2 > .panel, .timeline, .communes';
  ui.io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); ui.io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.1 }) : null;
  ui.reveal = (root) => {
    if (V.mode === 'public') $$(AUTO, root).forEach((el) => { if (!/\brv/.test(el.className) && !el.querySelector('.rv-h')) el.classList.add('rv'); });
    $$('.rv, .rv-h, .rv-st, .rv-img', root).forEach((el) => {
      if (el.classList.contains('rv-st')) [...el.children].forEach((c, k) => c.style.setProperty('--i', Math.min(k, 8)));
      if (ui.io) ui.io.observe(el); else el.classList.add('in');
    });
  };
  /* ---------- Carrousels : points de pagination et flèches ---------- */
  ui.carousels = (root) => $$('[data-car]', root).forEach((c) => {
    const tr = $('.car-track', c), dots = $('.car-dots', c), prev = $('[data-car-prev]', c), next = $('[data-car-next]', c);
    const upd = () => {
      const max = tr.scrollWidth - tr.clientWidth;
      const n = max > 4 ? Math.ceil(tr.scrollWidth / tr.clientWidth - .05) : 1;
      if (dots.children.length !== n) dots.innerHTML = '<i></i>'.repeat(n);
      const k = max > 4 ? Math.round((tr.scrollLeft / max) * (n - 1)) : 0;
      [...dots.children].forEach((d, j) => d.classList.toggle('on', j === k));
      prev.disabled = tr.scrollLeft < 4; next.disabled = tr.scrollLeft > max - 4;
      c.classList.toggle('fixe', n < 2);
    };
    tr.addEventListener('scroll', upd, { passive: true });
    prev.onclick = () => tr.scrollBy({ left: -tr.clientWidth, behavior: 'smooth' });
    next.onclick = () => tr.scrollBy({ left: tr.clientWidth, behavior: 'smooth' });
    requestAnimationFrame(upd); upd();
  });
  /* ---------- Rangées qui défilent seules et se font glisser (souris ou doigt), avec élan au lâcher ---------- */
  ui.marquees = (root) => $$('[data-marq] .c-row', root).forEach((row) => {
    const tr = row.firstElementChild, dir = +row.dataset.dir || 1;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let x = 0, v = 0, drag = null, moved = 0, hover = false, last = performance.now();
    const loop = () => tr.scrollWidth / 2;
    const tick = (t) => {
      if (!row.isConnected) return;
      const dt = Math.min(64, t - last) / 1000; last = t;
      if (!drag) {
        if (Math.abs(v) > 8) { x += v * dt; v *= Math.pow(0.05, dt); }
        else if (!hover && !still) x -= 24 * dir * dt;
      }
      const h = loop();
      if (h) { while (x <= -h) x += h; while (x > 0) x -= h; }
      tr.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
      requestAnimationFrame(tick);
    };
    row.addEventListener('pointerdown', (e) => { if (e.button) return; drag = { x0: e.clientX, xs: x, lx: e.clientX, t: e.timeStamp, id: e.pointerId }; moved = 0; v = 0; });
    row.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x0;
      if (moved < 6 && Math.abs(dx) >= 6) { row.setPointerCapture(drag.id); row.classList.add('grab'); }
      moved = Math.max(moved, Math.abs(dx));
      x = drag.xs + dx;
      const dtm = Math.max(8, e.timeStamp - drag.t); v = ((e.clientX - drag.lx) / dtm) * 1000; drag.lx = e.clientX; drag.t = e.timeStamp;
    });
    const end = () => { drag = null; row.classList.remove('grab'); };
    row.addEventListener('pointerup', end); row.addEventListener('pointercancel', end);
    row.addEventListener('click', (e) => { if (moved >= 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    row.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hover = true; });
    row.addEventListener('pointerleave', () => { hover = false; });
    if (dir < 0) x = -loop() / 2;
    requestAnimationFrame(tick);
  });

  /* ---------- Boutons « flair » : le remplissage entre par où arrive le pointeur et repart par où il sort ---------- */
  const flair = (e, on) => {
    const host = e.target.closest && e.target.closest('.btn');
    if (!host || (e.relatedTarget && host.contains(e.relatedTarget))) return;
    const b = host.classList.contains('btn') ? host : host.querySelector('.btn');
    if (!b) return;
    const r = b.getBoundingClientRect();
    b.style.setProperty('--x', `${Math.min(r.width, Math.max(0, e.clientX - r.left))}px`);
    b.style.setProperty('--y', `${Math.min(r.height, Math.max(0, e.clientY - r.top))}px`);
    b.classList.toggle('fl', on);
  };
  document.addEventListener('pointerover', (e) => flair(e, true));
  document.addEventListener('pointerout', (e) => flair(e, false));

  /* ---------- Améliorations des contrôles (segmentés, curseurs, compteurs, options) ---------- */
  ui.segThumb = (seg) => {
    const on = seg.querySelector('button.on') || seg.querySelector('button');
    const th = seg.querySelector('.thumb');
    if (on && th) { th.style.left = on.offsetLeft + 'px'; th.style.width = on.offsetWidth + 'px'; }
  };
  ui.enhance = (root) => {
    $$('.seg', root).forEach((s) => { ui.segThumb(s); requestAnimationFrame(() => ui.segThumb(s)); });
    $$('.range', root).forEach(ui.range);
    $$('.field textarea[maxlength]', root).forEach((t) => { const c = t.parentElement.querySelector('.counter'); if (c) t.addEventListener('input', () => { c.textContent = `${t.value.length} / ${t.maxLength}`; }); });
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.seg button');
    if (b) { const seg = b.parentElement; seg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); ui.segThumb(seg); seg.dispatchEvent(new CustomEvent('seg', { detail: b.dataset.v, bubbles: true })); }
  });
  document.addEventListener('change', (e) => {
    const inp = e.target;
    if (inp.closest('.opt')) {
      if (inp.type === 'radio') $$(`input[name="${inp.name}"]`, inp.form || document).forEach((x) => x.closest('.opt') && x.closest('.opt').classList.toggle('on', x.checked));
      else inp.closest('.opt').classList.toggle('on', inp.checked);
    }
  });
  ui.range = (el) => {
    const [a, b] = $$('input', el);
    const fill = el.querySelector('.fill');
    const vals = el.parentElement.querySelector('.range-vals');
    const unit = el.dataset.unit || '';
    const upd = () => {
      let lo = +a.value, hi = +b.value;
      if (lo > hi - (+el.dataset.gap || 0)) { if (document.activeElement === a) a.value = lo = hi - (+el.dataset.gap || 0); else b.value = hi = lo + (+el.dataset.gap || 0); }
      const min = +a.min, max = +a.max;
      fill.style.left = ((lo - min) / (max - min)) * 100 + '%';
      fill.style.right = (100 - ((hi - min) / (max - min)) * 100) + '%';
      if (vals) vals.innerHTML = `<span>${lo}${unit}</span><span>${hi}${+hi === max && el.dataset.plus ? '+' : ''}${unit}</span>`;
    };
    a.oninput = b.oninput = () => { upd(); el.dispatchEvent(new CustomEvent('range', { bubbles: true })); };
    upd();
  };
  V.rangeHTML = (name, min, max, lo, hi, unit, o = {}) => `<div class="range-vals"></div><div class="range" data-name="${name}" data-unit="${unit}" data-gap="${o.gap || 1}" ${o.plus ? 'data-plus="1"' : ''}><div class="track"></div><div class="fill"></div><input type="range" min="${min}" max="${max}" step="${o.step || 1}" value="${lo}" aria-label="${name} minimum"><input type="range" min="${min}" max="${max}" step="${o.step || 1}" value="${hi}" aria-label="${name} maximum"></div>`;

  /* ---------- Sélection (cœur) et masquage ---------- */
  ui.fav = (id, btn) => {
    const list = V.sel();
    const i = list.indexOf(id);
    const p = V.byId(id);
    if (i >= 0) list.splice(i, 1);
    else { if (list.length >= (V.L.account ? 100 : 30)) return V.toast('Limite atteinte : 30 favoris par session.', { icon: 'info' }); list.push(id); }
    V.save();
    const on = i < 0;
    $$(`.heart[data-id="${id}"], .f-act[data-act="fav"][data-id="${id}"]`).forEach((h) => {
      h.classList.toggle('on', on); h.setAttribute('aria-pressed', on);
      if (on) { h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop'); ui.burst(h); }
      const lbl = h.querySelector('.lbl'); if (lbl) lbl.textContent = on ? 'Ajoutée' : 'Ajouter';
    });
    ui.counts(true);
    if (on) ui.cartOpen(id);
    else V.toast(`${p.name} retirée de la sélection.`, { icon: 'heart', action: 'Annuler', fn: () => ui.fav(id) });
  };
  ui.burst = (el) => {
    const b = document.createElement('span'); b.className = 'burst';
    b.innerHTML = Array.from({ length: 8 }, (_, k) => `<i style="--a:${k * 45}deg"></i>`).join('');
    el.appendChild(b); setTimeout(() => b.remove(), 750);
  };
  ui.hide = (id) => {
    const p = V.byId(id);
    const h = V.hidden();
    if (!h.includes(id)) h.push(id);
    const s = V.sel(); const k = s.indexOf(id); if (k >= 0) s.splice(k, 1);
    V.save();
    const c = $(`.card[data-id="${id}"]`);
    if (c) { c.classList.add('out'); setTimeout(() => { c.remove(); V.ui.refreshCount && V.ui.refreshCount(); }, 450); }
    ui.counts();
    V.toast(`${p.name} n’apparaîtra plus${V.L.account ? '' : ' pendant cette session'}. Ce n’est pas un signalement.`, { icon: 'eye-off', action: 'Annuler', ms: 5000, fn: () => { V.hidden().splice(V.hidden().indexOf(id), 1); V.save(); V.render(); } });
  };

  /* ---------- Panneau « Ma session » (aside permanent ≥1280 px, tiroir sinon) ---------- */
  ui.sessTab = 'fav';
  ui.sessionLists = () => {
    const ch = V.S.chg;
    return {
      fav: V.sel().map(V.byId).filter(Boolean),
      new: [...new Set([...ch.arrive, ...ch.dispo])].map(V.byId).filter(Boolean),
      upd: ch.upd.map(V.byId).filter(Boolean),
    };
  };
  ui.sessionHTML = (o = {}) => {
    const L = ui.sessionLists();
    const cur = L[ui.sessTab];
    const rows = cur.map((p) => {
      const s = V.statusInfo(p);
      const chg = ui.sessTab === 'fav' && (V.S.chg.upd.includes(p.id) || V.S.chg.dispo.includes(p.id));
      return `<div class="s-item${chg ? ' chg' : ''}${o.added === p.id && ui.sessTab === 'fav' ? ' just' : ''}" data-id="${p.id}">
        ${ui.sessTab === 'fav' ? `<span class="grip" title="Glisser pour réordonner">${V.i('grip', 'sm')}</span>` : ''}
        <img src="${V.img(p.photos[0], 's')}" alt="">
        <div class="t" data-act="open" data-id="${p.id}"><b>${V.esc(p.name)}, ${V.ageShort(p)}</b><span><i class="${s.cls}"></i>${s.short}${chg ? ' · <span style="color:var(--gold-2)">changé</span>' : ''}${o.drawer ? ` · dès ${p.from}.–` : ''}</span></div>
        ${ui.sessTab === 'fav' ? `<button class="x" data-act="fav" data-id="${p.id}" aria-label="Retirer">${V.i('x', 'sm')}</button>` : `<button class="x" data-act="fav" data-id="${p.id}" aria-label="Ajouter">${V.i(V.isSel(p.id) ? 'check' : 'plus', 'sm')}</button>`}
      </div>`;
    }).join('');
    const empty = { fav: 'Ajoutez des profils avec le cœur. Ils resteront ici pendant votre visite.', new: 'Aucune nouvelle arrivée ni nouvelle disponibilité depuis le début de votre visite.', upd: 'Aucun profil modifié depuis le début de votre visite.' }[ui.sessTab];
    const n = L.fav.length;
    const added = o.drawer && o.added && V.isSel(o.added) ? V.byId(o.added) : null;
    return `<h3>${o.drawer ? 'Ma sélection' : 'Ma session'}</h3>
      ${added ? `<div class="s-added">${V.i('check', 'sm')}<span><b>${V.esc(added.name)}</b> est ajoutée à votre sélection.</span></div>` : ''}
      <div class="s-tabs">
        <button class="${ui.sessTab === 'fav' ? 'on' : ''}" data-act="stab" data-v="fav">Favoris <span class="c">${L.fav.length}</span></button>
        <button class="${ui.sessTab === 'new' ? 'on' : ''}" data-act="stab" data-v="new">Nouveaux <span class="c">${L.new.length}</span></button>
        <button class="${ui.sessTab === 'upd' ? 'on' : ''}" data-act="stab" data-v="upd">Modifiés <span class="c">${L.upd.length}</span></button>
      </div>
      <p class="s-note">${V.L.account ? `Synchronisée avec votre compte <b>${V.esc(V.L.account.pseudo)}</b> sur tous vos appareils.` : 'Votre sélection reste visible tant que le navigateur est ouvert. Elle s’efface à sa fermeture.'}</p>
      <div class="s-list" id="sList">${rows || `<div class="s-empty">${empty}</div>`}</div>
      <button class="btn ${n >= 2 ? 'light' : 'light is-disabled'} block" data-act="compare"><span class="roll"><span>Comparer ma sélection${n >= 2 ? ` (${Math.min(n, 6)})` : ''}</span><span aria-hidden="true">Comparer ma sélection${n >= 2 ? ` (${Math.min(n, 6)})` : ''}</span></span></button>
      ${o.drawer ? V.btn('Continuer mes recherches', { cls: 'ghost block s-continue', attrs: 'data-s-close' }) : ''}
      ${V.L.account ? '' : '<p class="keep">Pour la garder : <a href="#/compte/connexion">créer un compte discret</a></p>'}`;
  };
  ui.renderSession = () => {
    $$('.session-box[data-live]').forEach((b) => { b.innerHTML = ui.sessionHTML({ drawer: b.dataset.drawer === '1', added: b.dataset.added }); ui.dragList(b); });
  };
  /* Sélection façon panier : l'ajout ouvre le tiroir (sauf si le panneau latéral est déjà visible) */
  const asideOn = () => { const a = $('.aside-session'); return !!a && getComputedStyle(a).display !== 'none'; };
  ui.cartOpen = (id) => {
    ui.sessTab = 'fav';
    const box = V.sheet.el && V.sheet.el.querySelector('.session-box[data-drawer]');
    if (box) { box.dataset.added = id; ui.renderSession(); return; }
    if (asideOn()) { ui.renderSession(); const a = $('.aside-session .session-box'); if (a) { a.classList.remove('flash'); void a.offsetWidth; a.classList.add('flash'); } return; }
    ui.openSession(id);
  };
  ui.openSession = (added) => {
    if (typeof added !== 'string') added = '';
    V.sheet.open({ title: '', side: true, body: `<div class="session-box" data-live data-drawer="1"${added ? ` data-added="${added}"` : ''} style="min-height:calc(100dvh - 120px)"></div>`, onOpen: (sh) => {
      sh.addEventListener('click', (e) => { if (e.target.closest('[data-s-close]')) V.sheet.close(); }); sh.classList.add('sheet-dark'); sh.querySelector('.sh-head').style.display = 'none'; ui.renderSession(); const x = document.createElement('button'); x.className = 'icon-btn'; x.style.cssText = 'position:absolute;right:14px;top:14px;color:#fff;z-index:2'; x.innerHTML = V.i('x'); x.onclick = () => V.sheet.close(); sh.querySelector('.sh-body').style.position = 'relative'; sh.querySelector('.sh-body').appendChild(x); } });
  };
  /* Réordonner la sélection par glisser (souris et tactile) */
  ui.dragList = (box) => {
    const list = box.querySelector('#sList');
    if (!list || ui.sessTab !== 'fav') return;
    $$('.grip', list).forEach((g) => {
      g.onpointerdown = (e) => {
        e.preventDefault();
        const item = g.closest('.s-item');
        item.style.opacity = '.6';
        const move = (ev) => {
          const over = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.s-item');
          if (over && over !== item && over.parentElement === list) {
            const r = over.getBoundingClientRect();
            list.insertBefore(item, ev.clientY < r.top + r.height / 2 ? over : over.nextSibling);
          }
        };
        const up = () => {
          item.style.opacity = '';
          document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up);
          const order = $$('.s-item', list).map((x) => x.dataset.id);
          const s = V.sel(); s.splice(0, s.length, ...order); V.save();
        };
        document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
      };
    });
  };

  /* ---------- Surcouches (fiche, comparateur) ---------- */
  V.overlay = {
    any: () => !!$('.ov.on'),
    open(kind, html, after) {
      let ov = $(`#ov-${kind}`);
      const fresh = !ov;
      if (fresh) {
        ov = document.createElement('div'); ov.className = 'ov'; ov.id = `ov-${kind}`;
        document.body.appendChild(ov);
      }
      ov.innerHTML = `<div class="scrim d-only"></div>${html}`;
      document.body.classList.add('lock');
      void ov.offsetWidth; ov.classList.add('on'); { const s2 = ov.querySelector('.scrim'); if (s2) s2.classList.add('on'); }
      const sc = ov.querySelector('.scrim'); if (sc) sc.onclick = () => V.overlay.back();
      ui.enhance(ov);
      after && after(ov);
      return ov;
    },
    closeAll(instant) {
      $$('.ov').forEach((ov) => {
        ov.classList.remove('on');
        const sc = ov.querySelector('.scrim'); if (sc) sc.classList.remove('on');
        setTimeout(() => { if (!ov.classList.contains('on')) ov.remove(); }, instant ? 0 : 620);
      });
      if (!document.body.classList.contains('menu-open') && !V.sheet.el) document.body.classList.remove('lock');
    },
    back() { if (V.navDepth > 0) history.back(); else location.hash = V.basePath ? '#' + V.basePath : '#/profils'; },
  };

  /* ---------- Nouveautés de la session (simulées) ---------- */
  const EVENTS = [
    { at: 14e3, id: 'luna', kind: 'dispo', apply: () => { V.S.ov = V.S.ov || {}; V.S.ov.luna = { t: 'now', since: Date.now() }; }, msg: 'Luna est disponible maintenant' },
    { at: 32e3, id: 'camille', kind: 'upd', apply: () => {}, msg: 'Camille a mis à jour ses photos et ses tarifs' },
    { at: 52e3, id: 'kiara', kind: 'arrive', apply: () => {}, msg: 'Nouvelle arrivée : Kiara' },
  ];
  ui.fireEvent = (ev) => {
    if (V.S.ev.includes(ev.id)) return;
    V.S.ev.push(ev.id);
    ev.apply();
    V.S.chg[ev.kind].push(ev.id);
    V.save();
    // le profil ne bouge pas dans la galerie : on met seulement à jour son statut et ses badges
    const card = $(`.card[data-id="${ev.id}"]`);
    if (card) { const p = V.byId(ev.id); card.querySelector('.tl').innerHTML = V.statusPill(p, false, !card.classList.contains('feat')); const bl = card.querySelector('.bl'); if (bl && ev.kind === 'upd') bl.insertAdjacentHTML('beforeend', '<span class="badge dark">Mis à jour</span>'); }
    ui.newsBanner();
    ui.renderSession();
  };
  ui.startEvents = () => {
    const t0 = V.S.start;
    EVENTS.forEach((ev) => {
      if (V.S.ev.includes(ev.id)) return;
      const left = t0 + ev.at - Date.now();
      setTimeout(() => ui.fireEvent(ev), Math.max(800, left));
    });
  };
  ui.demoNews = () => { const ev = EVENTS.find((e) => !V.S.ev.includes(e.id)); if (!ev) return V.toast('Toutes les nouveautés simulées ont déjà eu lieu.', { icon: 'info' }); ui.fireEvent(ev); V.toast(ev.msg, { icon: 'sparkles' }); };
  ui.newsBanner = () => {
    const el = $('#news');
    if (!el) return;
    const ch = V.S.chg;
    const n = ch.arrive.length + ch.dispo.length + ch.upd.length;
    if (!n) { el.innerHTML = ''; return; }
    const parts = [];
    if (ch.arrive.length) parts.push(`${ch.arrive.length} nouvelle${ch.arrive.length > 1 ? 's' : ''} arrivée${ch.arrive.length > 1 ? 's' : ''}`);
    if (ch.dispo.length) parts.push(`${ch.dispo.length} disponibilité${ch.dispo.length > 1 ? 's' : ''} ajoutée${ch.dispo.length > 1 ? 's' : ''}`);
    if (ch.upd.length) parts.push(`${ch.upd.length} profil${ch.upd.length > 1 ? 's' : ''} mis à jour`);
    el.innerHTML = `<div class="news"><div class="t"><b>Nouveautés de cette session</b><div class="items">${parts.map((x) => `<span>${x}</span>`).join('')}</div></div>
      <button class="btn sm dark" data-act="only-changes"><span class="roll"><span>Voir uniquement les changements</span><span aria-hidden="true">Voir uniquement les changements</span></span></button></div>`;
  };
})(window.V);
