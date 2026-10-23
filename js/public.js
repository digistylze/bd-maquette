/* BD : écrans publics */
(function (V) {
  'use strict';
  const { $, $$, i: I, esc } = V;
  const D = V.date;
  const P = V.PROFILES;
  const vis = () => P.filter((p) => V.visible(p) && !V.hidden().includes(p.id));

  /* =================================================================== ACCUEIL */
  /* Briques de l'accueil */
  const storyItem = (p) => `<a class="st-item${(V.S.stSeen || []).includes(p.id) ? ' seen' : ''}" href="#/story/${p.id}"><span class="st-ph"><img src="${V.img(p.photos[0], 's')}" alt="Photo de ${esc(p.name)}" loading="lazy" draggable="false">${V.statusOf(p).t === 'now' ? '<i class="st-on" title="En ligne"></i>' : ''}</span><b>${esc(p.name)}</b><span>${V.communeTxt(p.commune)}</span></a>`;
  const MODE_TXT = { incall: 'Reçoit', outcall: 'Se déplace', both: 'Reçoit · déplace' };
  const statusCard = (p) => V.card(p, { ago: true, noHide: true });
  const CTRL = {
    media: ['Selfie de contrôle validé', 'Comparé aux photos publiées. Le prochain aura lieu dans 90 jours au plus tard.'],
    id: ['Âge et identité vérifiés', 'Pièce d’identité et selfie vivant, chez un prestataire suisse.'],
    indep: ['Indépendance confirmée', 'Entretien avec l’équipe, renouvelé tous les six mois.'],
  };
  const dayTxt = (d) => (d >= 0 ? 'aujourd’hui' : d === -1 ? 'hier' : `il y a ${-d} jours`);
  const controls = (L, n) => {
    const seen = new Set();
    return L.flatMap((p) => ['media', 'id', 'indep'].map((k) => ({ p, k, d: p.verif[k] }))).sort((a, b) => b.d - a.d).filter((x) => !seen.has(x.p.id) && seen.add(x.p.id)).slice(0, n);
  };
  const ctrlCard = ({ p, k, d }) => `<article class="c-card"><div class="who" data-act="open" data-id="${p.id}"><img src="${V.img(p.photos[0], 's')}" alt=""><div><b>${esc(p.name)}</b><span>${V.communeTxt(p.commune)} · ${dayTxt(d)}</span></div></div><div class="what">${CTRL[k][0]}</div><p>${CTRL[k][1]}</p></article>`;
  // armoiries des communes : Genève d'abord, puis celles qui ont des profils, puis l'ordre alphabétique
  const communeList = (skip) => {
    const L = vis();
    const list = V.COMMUNES_GE.filter((c) => c.id !== skip).map((c) => ({ ...c, n: L.filter((p) => V.communeOf(p) === c.id).length }));
    return list.sort((a, b) => (b.id === 'geneve') - (a.id === 'geneve') || b.n - a.n || a.label.localeCompare(b.label, 'fr'));
  };
  const communeTile = (c, dup) => `<a class="c-tile" href="#/geneve/${c.id}"${dup ? ' aria-hidden="true" tabindex="-1"' : ''}><img src="img/armoiries/${c.id}.webp" alt="" loading="lazy" draggable="false" width="96" height="112"><b>${c.label}</b><span>${c.n ? `${c.n} profil${c.n > 1 ? 's' : ''}` : ''}</span></a>`;
  const communeTiles = (skip) => communeList(skip).map((c) => communeTile(c)).join('');
  // deux rangées en boucle (contenu doublé pour un défilement sans couture), sens opposés
  const communeMarquee = () => V.carousel(communeList().map((c) => communeTile(c)).join(''), 'shields');
  // mur de profils du hero : trois colonnes en boucle (contenu doublé), décor cliquable à la souris
  const wallCard = (p) => { const s = V.statusInfo(p); return `<a class="wcard" href="#/profil/${p.id}" tabindex="-1"><img src="${V.img(p.photos[0], 's')}" srcset="${V.img(p.photos[0], 's')} 360w, ${V.img(p.photos[0])} 900w" sizes="(min-width:1024px) 18vw, 34vw" alt="" draggable="false"><span class="wc-st ${s.cls}"><i></i>${s.short}</span><b>${esc(p.name)} <span>${V.ageShort(p)}</span></b><small>${V.communeTxt(p.commune)}</small></a>`; };
  const profileWall = (L) => {
    let src = L; while (src.length && src.length < 12) src = src.concat(L); // peu de profils (démo importée) : le mur se remplit quand même
    const cols = [[], [], []]; src.forEach((p, k) => cols[k % 3].push(p));
    return `<div class="h3-wall" aria-hidden="true">${cols.map((c, k) => `<div class="h3-col${k === 1 ? ' dn' : ''}" style="--d:${[46, 54, 50][k]}s">${c.map(wallCard).join('')}${c.map(wallCard).join('')}</div>`).join('')}</div>`;
  };
  // compteurs « en ligne » (chiffres fictifs de la maquette) : montée au chargement, puis petites variations
  const liveCounters = (v) => {
    const els = $$('[data-count]', v);
    const tween = (el, to) => {
      const from = +el.dataset.val || 0; el.dataset.val = to; const t0 = performance.now();
      const step = (t) => { const k = Math.min(1, (t - t0) / 1200); el.textContent = V.nf(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    els.forEach((el) => tween(el, +el.dataset.count));
    clearInterval(V.liveTimer);
    V.liveTimer = setInterval(() => {
      if (!els[0].isConnected) return clearInterval(V.liveTimer);
      const [m, u] = els;
      tween(m, Math.min(21, Math.max(15, +m.dataset.val + Math.round(Math.random() * 2 - 1))));
      if (u) tween(u, Math.min(1480, Math.max(1120, +u.dataset.val + Math.round(Math.random() * 60 - 26)))); // compteur de visiteurs : seulement s'il est réel
    }, 4000);
  };
  const H2 = (t) => `<h2 class="h2 rv-h"><span class="ln"><span>${t}</span></span></h2>`;
  const WHITE_GHOST = 'style="--bf:#fff;--bh:#fff;--bhf:#17131a;box-shadow:inset 0 0 0 1px rgba(255,255,255,.45)"';

  /* =================================================================== ACCUEIL
     Ordre : hero visuel avec compteurs, stories, derniers statuts, communes, à la une (collée),
     derniers contrôles (glisse par-dessus), nouvelles arrivées, partenaires, texte en onglets. */
  V.route(/^\/$/, () => {
    const L = vis();
    const nowList = L.filter((p) => V.statusOf(p).t === 'now');
    const news = L.filter((p) => p.isNew || V.S.chg.arrive.includes(p.id));
    const stories = V.STORIES.map(V.byId).filter((p) => p && L.includes(p));
    const recent = L.slice().sort((a, b) => V.statusOf(b).since - V.statusOf(a).since).slice(0, 8);
    let feats = ['valentina', 'alma', 'nina-sasha', 'maya'].map(V.byId).filter((p) => p && V.visible(p));
    if (feats.length < 2) feats = [...L.filter((p) => p.feat), ...L].filter((p, k, a) => a.indexOf(p) === k).slice(0, 4); // profils importés seuls
    const f0 = feats[0], f1 = feats[1] || feats[0];
    // À la une : uniquement les placements sponsorisés en cours (P08), pas de classement par popularité (A04)
    const hot = V.sponsoredNow().map((c) => c.p).filter((p, k, a) => a.indexOf(p) === k).slice(0, 7);
    return {
      title: 'Accueil',
      html: `
      <section class="hero3" aria-label="Accueil">
        ${profileWall(L)}
        <div class="h3-shade"></div>
        <div class="wrap h3-in">
          <div class="h2-live"><i class="dot-live"></i>Genève · profils vérifiés</div>
          <h1 class="h2-title">Escortes vérifiées à Genève, <em>disponibles ce soir.</em></h1>
          <p class="h2-sub">Profils contrôlés, disponibilités en temps réel et contact direct. Sans compte, sans intermédiaire, en toute discrétion.</p>
          <div class="h2-cta">${V.btn('Voir qui est disponible', { href: '#/profils?dispo=now', cls: 'gold lg', arrow: true })}${V.btn('Publier mon profil', { href: '#/rejoindre', cls: 'ghost lg d-only', attrs: WHITE_GHOST })}<a class="h3-pro m-only" href="#/rejoindre">Escorte à Genève ? Publiez votre profil</a></div>
          <div class="h2-stats">
            <div class="h2-stat"><span class="avs">${nowList.slice(0, 4).map((p) => `<img src="${V.img(p.photos[0], 's')}" alt="">`).join('')}</span><span><b data-count="18">18</b><small>disponibles en ce moment</small></span></div>
            ${Number.isFinite(V.LIVE_VISITORS) ? `<div class="h2-stat"><i class="dot-live"></i><span><b data-count="${V.LIVE_VISITORS}">${V.nf(V.LIVE_VISITORS)}</b><small>visiteurs en ce moment</small></span></div>` : ''}
          </div>
        </div>
      </section>

      <section class="stories" aria-label="Stories"><div class="wrap">${V.carousel(stories.map(storyItem).join(''), 'stories')}</div></section>

      <section class="section-sm"><div class="wrap">
        <div class="sec-head"><div>${H2('Nouveaux visages')}<p class="sec-note">Arrivées sur BD ces deux dernières semaines, toutes vérifiées.</p></div><a class="link d-only" href="#/profils?tri=new">Tout voir</a></div>
        ${V.carousel(news.map((p, k) => V.card(p, { i: k, noHide: true })).join(''))}
      </div></section>

      ${quickFilters(L)}

      <section class="section-sm"><div class="wrap">
        <div class="sec-head"><div>${H2('En ce moment')}<p class="sec-note">Les derniers statuts publiés : qui est libre maintenant, ce soir ou demain.</p></div><a class="link d-only" href="#/profils?tri=dispo">Tout voir</a></div>
        ${V.carousel(recent.map(statusCard).join(''))}
      </div></section>

      <section class="section-sm"><div class="wrap">
        <div class="sec-head"><div>${H2('Près de chez vous')}<p class="sec-note">Les 45 communes du canton. Chaque profil indique son quartier, jamais son adresse.</p></div></div>
        ${communeMarquee()}
      </div></section>

      ${coverflow(hot, nowList.length)}

      <section class="section-sm"><div class="wrap"><div class="fb-band">
        <div class="fb-ic">${I('shield')}</div>
        <div class="sp"><h2 class="fb-t">Un rendez-vous à raconter ? <em>Dites-le à BD, en privé.</em></h2><p>Pas d’avis publics ni de notes : votre retour, positif ou non, va uniquement à l’équipe BD. Il aide à vérifier les profils et à protéger tout le monde.</p></div>
        ${V.btn('Laisser un retour privé', { cls: 'gold', act: 'feedback', arrow: true })}
      </div></div></section>

      <section class="section-sm"><div class="wrap">
        <div class="sec-head"><div>${H2('Nos partenaires')}<p class="sec-note">Des adresses de confiance à Genève. Emplacements de démonstration, au forfait mensuel.</p></div><a class="link d-only" href="#/rejoindre">Devenir partenaire</a></div>
        <div class="partners rv-st">${[['Hôtel partenaire', 'Chambres à la journée, entrée discrète'], ['Studio photo', 'Séances pour profils vérifiés'], ['Prévention et santé', 'Dépistage anonyme et conseils'], ['Emplacement libre', 'Votre encart ici']].map(([t, d]) => `<a class="partner" href="#/rejoindre"><b>${t}</b><span>${d}</span></a>`).join('')}</div>
      </div></section>

      <section class="section-sm"><div class="wrap">
        ${V.seg('seo', [['desc', 'Description'], ['faq', 'Questions']], 'desc')}
        <div class="seo-pane on" data-pane="desc"><div class="seo-text">
          <h3>BD, escortes indépendantes à Genève</h3>
          <p>BD réunit des escortes indépendantes qui travaillent à Genève. Les couples et les duos ont leur propre catégorie. Chaque profil est vérifié avant sa mise en ligne. L’âge affiché est l’âge réel, lu sur la pièce d’identité, et les photos sont comparées à un selfie de contrôle tous les 90 jours.</p>
          <h3>Par commune, jamais par adresse</h3>
          <p>Les profils sont classés par commune et, en ville, par quartier : des <a class="link" href="#/geneve/paquis">Pâquis</a> à <a class="link" href="#/geneve/carouge">Carouge</a>, en passant par les <a class="link" href="#/geneve/eaux-vives">Eaux-Vives</a> et <a class="link" href="#/geneve/champel">Champel</a>. La fiche dit si la personne reçoit ou se déplace. Elle ne donne jamais d’adresse.</p>
          <h3>Un contact direct</h3>
          <p>Vous écrivez ou vous appelez directement, sur les canaux que la personne accepte. BD ne lit pas les échanges et ne prend rien sur les rendez-vous : les escortes paient un abonnement fixe.</p>
          <h3>Ce que nous ne faisons pas</h3>
          <p>BD ne réserve pas à votre place et ne note pas les personnes. Un doute sur un profil ? Le lien « Signaler » est sur chaque fiche, avec ou sans compte.</p>
          <h3>Discret par défaut</h3>
          <p>Pas besoin de compte pour regarder. La sélection faite avec le cœur s’efface à la fermeture du navigateur ; un compte discret, avec un pseudonyme, permet de la garder d’un appareil à l’autre.</p>
        </div></div>
        <div class="seo-pane" data-pane="faq"><div style="max-width:860px">
          ${[['Les photos sont-elles récentes ?', 'Elles sont comparées à un selfie de contrôle au moins tous les 90 jours. La date du dernier contrôle est en bas de chaque fiche.'],
            ['Faut-il créer un compte ?', 'Non. Un compte sert seulement à garder votre sélection d’un appareil à l’autre et à recevoir des alertes de retour.'],
            ['Comment savoir si quelqu’un est libre ?', 'Le statut est déclaré par la personne et horodaté. Sans mise à jour, il s’efface au bout de trois heures.'],
            ['BD prend-il une commission ?', 'Non. Les escortes paient un abonnement fixe ; ce qu’elles gagnent ne passe pas par nous.'],
            ['Que faire en cas de problème ?', 'Signalez-le depuis la fiche. Un signalement grave masque le profil tout de suite. En cas d’urgence, appelez le 117.']].map(([t, d]) => `<details class="acc"><summary>${t}<span class="pm">${I('plus', 'sm')}</span></summary><div class="acc-b">${d}</div></details>`).join('')}
        </div></div>
      </div></section>
      ${V.footer()}`,
      after: (v) => {
        heroLoop(v, feats);
        liveCounters(v);
        quickFiltersAfter(v);
        coverflowAfter(v);
        V.ui.marquees(v);
        $('[data-seg="seo"]', v).addEventListener('seg', (e) => $$('.seo-pane', v).forEach((x) => x.classList.toggle('on', x.dataset.pane === e.detail)));
      },
    };
  });

  /* ---------- À la une : coverflow 3D (port de slider-carrousel-studio « coverflow ») + photo floutée en fond ---------- */
  const coverflow = (list, nowN) => {
    if (!list.length) return '';
    const f = list[0];
    return `<section class="cf-hero" id="cfHero" aria-label="À la une" aria-roledescription="carrousel">
      <div class="cf-bgs" aria-hidden="true">${list.map((p, k) => `<div class="cf-bg${k ? '' : ' on'}" style="background-image:url('${V.img(p.photos[0])}')"></div>`).join('')}</div>
      <div class="cf-shade" aria-hidden="true"></div>
      <div class="wrap cf-in">
        <div class="cf-head"><div class="eyebrow">${I('sparkles', 'sm')}Cette semaine sur BD</div><h2 class="cf-title">Les profils <em>à la une</em></h2></div>
        <div class="cf-stage" tabindex="0">
          <div class="cf-track">${list.map((p, k) => `<article class="cf-card" data-i="${k}" data-id="${p.id}" data-act="open"><div class="cf-ph"><img src="${V.img(p.photos[0])}" alt="Photo de ${esc(p.name)}" draggable="false"><span class="cf-hot">${I('sparkles', 'sm')}${esc(V.sponLabel())}</span>${V.statusPill(p, false, true)}<span class="cf-grad"></span><div class="cf-cap"><b>${esc(p.name)} <span>${V.ageShort(p)}</span>${I('badge-check', 'sm')}</b><small>${I('map-pin', 'sm')}${V.communeTxt(p.commune)} · ${V.fromTxt(p)}</small></div></div></article>`).join('')}</div>
          <button type="button" class="cf-nav prev" aria-label="Profil précédent">${I('chevron-left')}</button><button type="button" class="cf-nav next" aria-label="Profil suivant">${I('chevron-right')}</button>
        </div>
        <div class="cf-info">
          <div class="cf-legend" id="cfLegend" aria-live="polite"></div>
          <div class="cf-dots">${list.map((p, k) => `<button type="button" aria-label="${esc(p.name)}"${k ? '' : ' class="on"'}><i></i></button>`).join('')}</div>
          <div class="cf-cta"><a class="btn light" id="cfCta" href="#/profil/${f.id}"><span class="roll"><span>Voir son profil</span><span aria-hidden="true">Voir son profil</span></span></a>${V.btn(`Disponibles maintenant · ${nowN}`, { href: '#/profils?dispo=now', cls: 'ghost', attrs: WHITE_GHOST })}</div>
        </div>
      </div>
    </section>`;
  };
  function coverflowAfter(v) {
    const root = $('#cfHero', v); if (!root) return;
    const stage = $('.cf-stage', root), cards = $$('.cf-card', root), bgs = $$('.cf-bg', root), dots = $$('.cf-dots button', root);
    const N = cards.length; if (!N) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let pos = 0, target = 0, active = -1, raf = 0, last = 0, cw = 288, holdUntil = 0;
    const mod = (n) => ((n % N) + N) % N;
    const near = (j) => { let d = mod(j - Math.round(target)); if (d > N / 2) d -= N; return Math.round(target) + d; };
    const measure = () => { cw = cards[0].offsetWidth || 288; };
    const setActive = (k) => {
      bgs.forEach((b, j) => b.classList.toggle('on', j === k));
      dots.forEach((b, j) => b.classList.toggle('on', j === k));
      cards.forEach((c, j) => c.classList.toggle('cur', j === k));
      const p = V.byId(cards[k].dataset.id);
      $('#cfLegend', root).innerHTML = `<b>${esc(p.name)}, ${V.ageShort(p)} ans</b><span>${esc(p.type || V.modeTxt(p.mode))} · ${V.communeTxt(p.commune)} · ${V.fromTxt(p)}</span>`;
      $('#cfCta', root).href = '#/profil/' + p.id;
    };
    const place = () => {
      const mob = innerWidth <= 767, side = mob ? 0.5 : 0.62, restK = mob ? 0.2 : 0.3, ang = mob ? 40 : 50;
      cards.forEach((c, j) => {
        let d = mod(j - pos); if (d > N / 2) d -= N;
        const a = Math.max(-1, Math.min(1, d)), rest = d - a, ad = Math.abs(d);
        const x = (a * side + rest * restK) * cw, z = -Math.abs(a) * cw * 0.4 - Math.abs(rest) * cw * 0.06;
        c.style.transform = `translate3d(${x.toFixed(1)}px,0,${z.toFixed(1)}px) rotateY(${(-a * ang).toFixed(2)}deg)`;
        c.style.zIndex = String(100 - Math.round(ad * 10));
        c.style.opacity = String(Math.max(0, Math.min(1, 4 - ad)) * Math.max(0, Math.min(1, N - 2 * ad)));
        const vis = ad < 1.5; c.inert = !vis; c.setAttribute('aria-hidden', String(!vis));
      });
      const k = mod(Math.round(pos));
      if (k !== active) { active = k; setActive(k); }
    };
    const tick = (t) => {
      const dt = last ? Math.min(64, t - last) : 16.67; last = t;
      pos += (target - pos) * (1 - Math.pow(1 - 0.08, dt / 16.67));
      if (Math.abs(target - pos) < 0.0005) { pos = target; place(); raf = 0; last = 0; return; }
      place(); raf = requestAnimationFrame(tick);
    };
    const go = (t) => { target = t; if (reduce) { pos = target; place(); return; } if (!raf) raf = requestAnimationFrame(tick); };
    const hold = () => { holdUntil = Date.now() + 9000; };
    $('.cf-nav.prev', root).addEventListener('click', () => { go(Math.round(target) - 1); hold(); });
    $('.cf-nav.next', root).addEventListener('click', () => { go(Math.round(target) + 1); hold(); });
    dots.forEach((b, j) => b.addEventListener('click', () => { go(near(j)); hold(); }));
    stage.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') { go(Math.round(target) - 1); hold(); } else if (e.key === 'ArrowRight') { go(Math.round(target) + 1); hold(); } });
    // glisser (souris ou doigt), avec élan au lâcher
    let drag = null, moved = false;
    stage.addEventListener('pointerdown', (e) => { if (e.button || e.target.closest('.cf-nav')) return; drag = { x: e.clientX, y: e.clientY, p0: target, lx: e.clientX, t: e.timeStamp, v: 0, on: false, id: e.pointerId }; moved = false; });
    stage.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.on) { if (Math.abs(dx) < 6) return; if (Math.abs(dy) > Math.abs(dx)) { drag = null; return; } drag.on = true; moved = true; stage.setPointerCapture(drag.id); stage.classList.add('grab'); }
      const inst = (e.clientX - drag.lx) / Math.max(1, e.timeStamp - drag.t);
      drag.v = 0.8 * inst + 0.2 * drag.v; drag.lx = e.clientX; drag.t = e.timeStamp;
      go(drag.p0 - dx / (cw * 0.55)); hold();
    });
    const end = (e) => { if (!drag) return; if (drag.on) { const v2 = e.timeStamp - drag.t > 80 ? 0 : drag.v; go(Math.round(target - (v2 * 160) / (cw * 0.55))); } drag = null; stage.classList.remove('grab'); };
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
    // clic : une carte de côté vient au centre, la carte centrale ouvre la fiche
    stage.addEventListener('click', (e) => {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; return; }
      const c = e.target.closest('.cf-card'); if (!c) return;
      if (+c.dataset.i !== active) { e.preventDefault(); e.stopPropagation(); go(near(+c.dataset.i)); hold(); }
    }, true);
    addEventListener('resize', () => { if (root.isConnected) { measure(); place(); } }, { passive: true });
    // défilement automatique doux : un cran toutes les 5 s, suspendu 9 s après une action
    clearInterval(V.cfTimer);
    V.cfTimer = setInterval(() => {
      if (!document.body.contains(root)) { clearInterval(V.cfTimer); return; }
      if (document.hidden || Date.now() < holdUntil || drag) return;
      go(Math.round(target) + 1);
    }, 5000);
    measure(); place();
  }
  function heroLoop(v, feats) {
    const hero = $('#hero', v);
    if (!hero || feats.length < 2) return;
    let k = 0, busy = false;
    const step = () => {
      if (busy || !document.body.contains(hero)) return;
      busy = true;
      const cur = hero.querySelector('.slide.cur'), nxt = hero.querySelector('.slide.next');
      nxt.classList.add('grow');
      k = (k + 1) % feats.length;
      const p = feats[k];
      setTimeout(() => {
        const name = $('#heroName', hero);
        name.innerHTML = `<small>${V.communeTxt(p.commune)} · ${V.ageTxt(p)}</small><span>${esc(p.name)}</span>`;
        $('#heroSt', hero).textContent = V.statusInfo(p).label;
        $$('.prog i', hero).forEach((b, j) => { b.classList.remove('on'); if (j === k) { void b.offsetWidth; b.classList.add('on'); } });
      }, 450);
      setTimeout(() => {
        cur.remove();
        nxt.classList.remove('next', 'grow'); nxt.classList.add('cur');
        nxt.dataset.act = 'open'; nxt.dataset.id = p.id; nxt.querySelector('img').classList.add('protect');
        const n2 = feats[(k + 1) % feats.length];
        nxt.insertAdjacentHTML('afterend', `<div class="slide next" data-act="hero-next"><img src="${V.img(n2.photos[0])}" alt="" draggable="false"></div>`);
        busy = false;
      }, 1450);
    };
    V.heroStep = step;
    clearInterval(V.heroTimer);
    V.heroTimer = setInterval(() => { if (!document.hidden && $('#hero')) step(); else if (!$('#hero')) clearInterval(V.heroTimer); }, 5500);
  }

  /* ---------- Accueil : filtres en direct, la sélection se met à jour juste en dessous ---------- */
  const QF_MAIN = [
    ['dispo', 'Disponibilité', [['', 'Toutes'], ['now', 'Maintenant'], ['today', 'Aujourd’hui'], ['tomorrow', 'Demain']]],
    ['mode', 'Rendez-vous', [['', 'Indifférent'], ['incall', 'Reçoit'], ['outcall', 'Se déplace']]],
  ];
  const QF_ADV = [
    ['sil', 'Silhouette', [['', 'Toutes'], ['mince', 'Mince'], ['sportive', 'Sportive'], ['pulpeuse', 'Pulpeuse']]],
    ['hair', 'Cheveux', [['', 'Tous'], ['brun', 'Brun'], ['blond', 'Blond'], ['châtain', 'Châtain'], ['roux', 'Roux'], ['noir', 'Noir']]],
  ];
  const QF_SVC = ['s7', 'p2', 'p4', 'p14', 'p20', 'p23', 'p24', 's3', 's1'];
  const QF_LANG = ['fr', 'en', 'de', 'it', 'es', 'pt', 'ru', 'ar'];
  const CLIENTS = [['solo', 'Seul ou seule'], ['couple', 'Couple'], ['multi', 'Plusieurs clients'], ['pro', 'Avec une autre professionnelle']];
  const CLV = (v) => (v === 'oui' ? '<span class="yes">Accepté</span>' : v === 'non' ? '<span class="no">Refusé</span>' : v === 'discuter' ? '<span class="tbd">À discuter</span>' : 'non renseigné');
  const qfChips = (k, opts) => `<div class="qf-chips" data-qk="${k}">${opts.map(([v, l]) => `<button type="button" class="qf-c${v ? '' : ' on'}" data-qv="${v}">${l}</button>`).join('')}</div>`;
  const qfGroup = (label, inner) => `<div class="qf-g"><span class="qf-l">${label}</span>${inner}</div>`;
  const quickFilters = (L) => {
    const communes = [...new Set(L.map((p) => p.commune))].map((id) => ({ id, label: V.communeTxt(id) })).sort((a, b) => a.label.localeCompare(b.label, 'fr'));
    return `<section class="section-sm qf" id="qf"><div class="wrap">
        <div class="sec-head"><div>${H2('Selon vos envies')}<p class="sec-note">Quartier, langue, budget, disponibilité : choisissez, la sélection s’affiche juste en dessous.</p></div><a class="link" href="#/carte">${I('map-pin', 'sm')} Voir sur la carte</a></div>
        <div class="qf-box">
        <div class="qf-panel">
          <div class="qf-top">
            ${qfGroup('Catégorie', qfChips('cat', [['', 'Toutes'], ['femme', 'Femmes'], ['trans', 'Trans'], ['homme', 'Hommes'], ['masseuse', 'Masseuses'], ['bdsm', 'BDSM'], ['duo', 'Duos et couples']]))}
            ${QF_MAIN.map(([k, l, o]) => qfGroup(l, qfChips(k, o))).join('')}
            ${qfGroup('Budget pour 1 h', `<div class="qf-range">${V.rangeHTML('prix', 200, 1000, 200, 1000, ' CHF', { step: 50, gap: 50, plus: 1 })}</div><div class="qf-chips"><button type="button" class="qf-c" data-qt="prixnr">Inclure « tarif non renseigné »</button></div>`)}
            ${qfGroup('Quartier', `<label class="qf-sel">${I('map-pin', 'sm')}<select data-qs="commune" aria-label="Quartier"><option value="">Tout Genève</option>${communes.map((c) => `<option value="${c.id}">${esc(c.label)}</option>`).join('')}</select>${I('chevron-down', 'sm')}</label>`)}
            ${qfGroup('Langue', `<div class="qf-chips" data-qm="lang">${QF_LANG.map((l) => `<button type="button" class="qf-c" data-qv="${l}">${flag(l)}${l.toUpperCase()}</button>`).join('')}</div>`)}
          </div>
          <div class="qf-adv" hidden>
            ${qfGroup('Âge (vérifié)', `<div class="qf-range">${V.rangeHTML('age', 18, 60, 18, 60, ' ans', { plus: 1, gap: 2 })}</div>`)}
            ${QF_ADV.map(([k, l, o]) => qfGroup(l, qfChips(k, o))).join('')}
            ${qfGroup('Clientèle et composition', `<div class="qf-chips" data-qm="cl">${CLIENTS.map(([k, l]) => `<button type="button" class="qf-c" data-qv="${k}">${l}</button>`).join('')}</div><div class="qf-chips"><button type="button" class="qf-c" data-qt="cld">Inclure « à discuter »</button></div>`)}
            ${qfGroup('Pratiques', `<div class="qf-chips" data-qm="svc">${QF_SVC.map((s) => `<button type="button" class="qf-c" data-qv="${s}">${V.SERVICES[s]}</button>`).join('')}</div>`)}
            ${qfGroup('Options', `<div class="qf-chips">${[['nosmoke', 'Non-fumeuse'], ['acc', 'Accepte les couples'], ['video', 'Avec vidéo'], ['face', 'Visage visible']].map(([k, l]) => `<button type="button" class="qf-c" data-qt="${k}">${l}</button>`).join('')}</div>`)}
          </div>
          <div class="qf-acts">
            <button type="button" class="txt-btn" data-qf-reset>Réinitialiser</button>
            <button type="button" class="qf-adv-btn" data-qf-adv aria-expanded="false">${I('filter', 'sm')}Paramètres avancés<span class="qf-n" hidden></span>${I('chevron-down', 'sm')}</button>
          </div>
        </div>
        <div class="qf-res" aria-live="polite">
          <div class="qf-foot">
            <span class="qf-count" id="qfCount"></span>
            <span class="sp"></span>
            <label class="qf-sel">${I('sort', 'sm')}<select data-qs="tri" aria-label="Trier">${TRI.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></label>
          </div>
          <div class="qf-grid" id="qfGrid"></div>
          <div class="qf-more" id="qfMore"></div>
        </div>
        </div>
      </div></section>`;
  };
  function quickFiltersAfter(v) {
    const box = $('#qf', v); if (!box) return;
    const q = {}, multi = { lang: new Set(), svc: new Set(), cl: new Set() }, tog = new Set();
    const grid = $('#qfGrid', box), count = $('#qfCount', box), more = $('#qfMore', box);
    const build = () => {
      const qq = { ...q };
      if (multi.lang.size) qq.lang = [...multi.lang].join(',');
      if (multi.svc.size) qq.svc = [...multi.svc].join(',');
      if (multi.cl.size) qq.cl = [...multi.cl].join(',');
      tog.forEach((t) => { qq[t] = t === 'acc' ? 'Couples' : '1'; });
      return qq;
    };
    const render = () => {
      const qq = build();
      const L = V.filterList(qq); // ici, que des cartes simples : les placements sponsorisés restent sur la page Profils
      count.innerHTML = `<i class="dot-live"></i><span><b>${L.length}</b> profil${L.length > 1 ? 's' : ''} ${L.length > 1 ? 'correspondent' : 'correspond'} à vos critères</span>`;
      grid.innerHTML = L.length ? L.slice(0, 8).map((p, k) => V.card(p, { i: k, noHide: true })).join('') : V.empty('search', 'Aucun profil pour ces critères', 'Retirez un critère pour élargir la sélection.', '');
      const qs = new URLSearchParams(Object.entries(qq).filter(([, x]) => x)).toString();
      more.innerHTML = L.length > 4 ? V.btn(`Voir les ${L.length} profils`, { href: '#/profils' + (qs ? '?' + qs : ''), cls: 'ghost', arrow: true }) : '';
      more.classList.toggle('m-only', L.length <= 8); // sur mobile on n'affiche que 4 cartes
      const nAdv = ['age', 'sil', 'hair'].filter((k) => q[k]).length + multi.svc.size + multi.cl.size + [...tog].filter((t) => !['prixnr'].includes(t)).length;
      const nb = $('.qf-n', box); nb.hidden = !nAdv; nb.textContent = nAdv;
      grid.classList.remove('flash'); void grid.offsetWidth; grid.classList.add('flash');
    };
    box.addEventListener('click', (e) => {
      const c = e.target.closest('.qf-c');
      if (c) {
        const g = c.parentElement;
        if (g.dataset.qk) { $$('.qf-c', g).forEach((x) => x.classList.toggle('on', x === c)); q[g.dataset.qk] = c.dataset.qv; }
        else if (g.dataset.qm) { const s = multi[g.dataset.qm]; if (c.classList.toggle('on')) s.add(c.dataset.qv); else s.delete(c.dataset.qv); }
        else if (c.dataset.qt) { if (c.classList.toggle('on')) tog.add(c.dataset.qt); else tog.delete(c.dataset.qt); }
        render(); return;
      }
      const adv = e.target.closest('[data-qf-adv]');
      if (adv) { const pane = $('.qf-adv', box); pane.hidden = !pane.hidden; adv.setAttribute('aria-expanded', String(!pane.hidden)); adv.classList.toggle('on', !pane.hidden); return; }
      if (e.target.closest('[data-qf-reset]')) {
        Object.keys(q).forEach((k) => delete q[k]); multi.lang.clear(); multi.svc.clear(); multi.cl.clear(); tog.clear();
        $$('.range', box).forEach((r) => { const [a, b] = $$('input', r); a.value = a.min; b.value = b.max; V.ui.range(r); });
        $$('.qf-chips', box).forEach((g) => $$('.qf-c', g).forEach((x, j) => x.classList.toggle('on', !!g.dataset.qk && j === 0)));
        $$('select[data-qs]', box).forEach((s) => { s.selectedIndex = 0; });
        render();
      }
    });
    $$('select[data-qs]', box).forEach((s) => s.addEventListener('change', () => { q[s.dataset.qs] = s.value; render(); }));
    box.addEventListener('range', (e) => { const r = e.target.closest('.range'); const [a, b] = $$('input', r); const k = r.dataset.name; const full = +a.value === +a.min && +b.value === +b.max; q[k] = full ? '' : `${a.value}-${b.value}`; render(); });
    render();
  }

  V.footer = () => `<footer class="footer"><div class="wrap">
    <div class="cols">
      <div class="f-brand">${V.ui.brand()}<p>BD met en relation des adultes à Genève. Les profils sont vérifiés, les contacts se font directement, sans intermédiaire ni commission.</p>
        <div class="f-langs">${V.LANG8.map(([c, l], k) => `<button type="button" class="${k ? '' : 'on'}" data-act="lang-set" data-l="${c}"${c === 'ar' ? ' lang="ar" dir="rtl"' : ''}>${l}</button>`).join('')}</div>
        <div class="row">${V.btn('Créer mon profil', { href: '#/pro/inscription/1', cls: 'gold sm', arrow: true })}${V.btn('Espace pro', { href: '#/pro', cls: 'ghost sm', attrs: WHITE_GHOST })}</div></div>
      <div><h5>Liens rapides</h5><ul><li><a href="#/profils">Tous les profils</a></li><li><a href="#/profils?dispo=now">Disponibles maintenant</a></li><li><a href="#/profils?tri=new">Nouvelles arrivées</a></li><li><a href="#/profils?cat=duo">Duos et couples</a></li><li><a href="#/masques">Profils masqués</a></li></ul></div>
      <div><h5>Quartiers</h5><ul>${V.COMMUNES.slice(0, 6).map((c) => `<li><a href="#/geneve/${c.id}">${c.label}</a></li>`).join('')}</ul><h5 style="margin-top:18px">Bientôt</h5><ul><li><a href="#/ville/lausanne">Lausanne</a></li><li><a href="#/ville/zurich">Zurich</a></li></ul></div>
      <div><h5>À propos</h5><ul><li><a href="#/verifications">Comment nous vérifions</a></li><li><a href="#/securite">Sécurité et signalement</a></li><li><a href="#/rejoindre">Nous rejoindre</a></li><li><a href="#/legal/cg-visiteurs">Conditions d’utilisation</a></li><li><a href="#/legal/confidentialite">Confidentialité</a></li><li><a href="#/legal/mentions">Mentions légales</a></li></ul></div>
    </div>
    <div class="legal"><span>© ${new Date().getFullYear()} BD · maquette, profils fictifs</span><span class="swiss"><i></i>Données hébergées en Suisse</span><span>Police 117 · Urgences 144</span></div>
  </div></footer>`;

  /* =================================================================== GALERIE */
  const FKEYS = ['cat', 'dispo', 'lang', 'mode', 'svc', 'commune', 'origin', 'hair', 'sil', 'acc', 'cl', 'cld', 'age', 'prix', 'prixnr', 'nosmoke', 'recent', 'video', 'face', 'q', 'tri', 'chg'];
  /* Recherche plein texte : présentations, pratiques et attributs, en 8 langues, tolérante aux fautes de frappe */
  const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\u0400-\u04ff\u0600-\u06ff]+/g, ' ').trim();
  const SYN = [
    ['massage', 'massaggio', 'masaje', 'massagem', 'massagen', 'массаж', 'تدليك'], ['tantra', 'tantrique', 'tantrico', 'tantrisch', 'тантра'],
    ['domination', 'dominatrice', 'dominazione', 'dominacion', 'dominacao', 'dominanz', 'bdsm', 'доминирование'], ['couple', 'couples', 'coppia', 'pareja', 'casal', 'paar', 'пара'],
    ['embrasser', 'bisous', 'baiser', 'kiss', 'kissing', 'kuss', 'bacio', 'beso', 'beijo', 'поцелуй'], ['petite amie', 'gfe', 'girlfriend', 'fidanzata', 'novia', 'namorada', 'freundin'],
    ['lingerie', 'dessous', 'lenceria', 'intimo', 'unterwasche', 'белье'], ['anglais', 'english', 'englisch', 'inglese', 'ingles', 'английский'], ['francais', 'french', 'franzosisch', 'francese', 'frances', 'французский'],
    ['allemand', 'german', 'deutsch', 'tedesco', 'aleman', 'alemao', 'немецкий'], ['italien', 'italian', 'italienisch', 'italiano'], ['espagnol', 'spanish', 'spanisch', 'spagnolo', 'espanol', 'испанский'],
    ['portugais', 'portuguese', 'portugiesisch', 'portoghese', 'portugues'], ['russe', 'russian', 'russisch', 'russo', 'ruso', 'русский'], ['arabe', 'arabic', 'arabisch', 'arabo', 'العربية'],
    ['blonde', 'blond', 'bionda', 'rubia', 'loira', 'блондинка'], ['brune', 'brun', 'brunette', 'morena', 'bruna', 'брюнетка'], ['rousse', 'roux', 'redhead', 'rossa', 'pelirroja', 'ruiva', 'рыжая'],
    ['hotel', 'albergo', 'отель'], ['diner', 'dinner', 'abendessen', 'cena', 'jantar', 'ужин'], ['soiree', 'evening', 'abend', 'sera', 'noche', 'noite', 'вечер'], ['nuit', 'night', 'nacht', 'notte', 'ночь'],
    ['deplace', 'outcall', 'hausbesuch', 'trasferta'], ['recoit', 'incall', 'appartement', 'apartment', 'wohnung'], ['jeu de role', 'roleplay', 'rollenspiel', 'gioco di ruolo', 'juego de rol'],
    ['douche', 'shower', 'dusche', 'doccia', 'ducha', 'banho'], ['discretion', 'discrete', 'discreet', 'diskret', 'discreta', 'discreto'],
  ].map((g) => g.map(norm));
  const lev = (a, b) => { if (Math.abs(a.length - b.length) > 2) return 9; const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) { d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); } return d[a.length][b.length]; };
  const tol = (w) => (w.length >= 8 ? 2 : w.length >= 4 ? 1 : 0);
  const docOf = (p) => { if (p._doc) return p._doc; const f = { nom: [p.name, p.type], presentation: [p.bio, ...(p.desc || [])], pratiques: (p.services || []).map((x) => V.SERVICES[x]), langues: (p.langs || []).map(([l]) => V.LANGS[l]), profil: [...Object.values(p.attrs || {}), V.communeTxt(p.commune), V.modeTxt(p.mode), ...(p.interests || [])] }; p._doc = Object.fromEntries(Object.entries(f).map(([k, v]) => { const t = norm(v.filter(Boolean).join(' ')); return [k, { t, w: [...new Set(t.split(' '))] }]; })); return p._doc; };
  V.fts = (query, p) => {
    const nq = norm(query); if (!nq) return { ok: true, where: [], fixes: [] };
    const phrases = SYN.flat().filter((v) => v.includes(' ') && nq.includes(v));
    const toks = nq.split(' ').filter((t) => t.length > 1 && !phrases.some((ph) => ph.split(' ').includes(t)));
    const terms = [...phrases.map((ph) => [ph]), ...toks.map((t) => [t])].map(([t]) => { const g = SYN.find((gr) => gr.includes(t)) || SYN.find((gr) => gr.some((v) => !v.includes(' ') && v.length >= 4 && lev(t, v) <= tol(v))); return { t, alts: g ? [...new Set([t, ...g])] : [t] }; });
    const doc = docOf(p), where = new Set(), fixes = [];
    const ok = terms.every(({ t, alts }) => Object.entries(doc).some(([k, f]) => {
      for (const a of alts) {
        if (a.includes(' ') ? f.t.includes(a) : f.w.some((w) => w === a || (a.length >= 3 && w.startsWith(a)))) { where.add(k); if (a !== t && !SYN.some((g) => g.includes(t))) fixes.push([t, a]); return true; }
      }
      for (const a of alts) { if (a.includes(' ')) continue; const w = f.w.find((x) => x.length >= 4 && lev(a, x) <= tol(x)); if (w) { where.add(k); fixes.push([t, w]); return true; } }
      return false;
    }));
    return { ok, where: [...where], fixes };
  };
  const isPhone = (s) => /^[+\d][\d\s.]{2,}$/.test(s.trim());
  V.filterList = (q, base) => {
    let L = (base || vis()).slice();
    const has = (v) => v !== undefined && v !== '' && v !== 'all';
    if (has(q.cat)) L = L.filter((p) => p.cat === q.cat);
    if (has(q.dispo)) L = L.filter((p) => { const t = V.statusOf(p).t; return q.dispo === 'now' ? t === 'now' : q.dispo === 'today' ? ['now', 'today', 'tonight'].includes(t) : q.dispo === 'tomorrow' ? t === 'tomorrow' : q.dispo === 'request' ? t === 'request' : true; });
    if (has(q.lang)) L = L.filter((p) => p.langs.some(([l]) => q.lang.split(',').includes(l)));
    if (has(q.mode)) L = L.filter((p) => p.mode === 'both' || p.mode === q.mode);
    if (has(q.svc)) L = L.filter((p) => q.svc.split(',').every((s) => p.services.includes(s)));
    if (has(q.commune)) L = L.filter((p) => q.commune.split(',').includes(p.commune));
    if (has(q.origin)) L = L.filter((p) => q.origin.split(',').some((o) => p.origin.includes(o)));
    if (has(q.hair)) L = L.filter((p) => q.hair.split(',').some((h) => (p.attrs.Cheveux || '').toLowerCase().includes(h)));
    if (has(q.sil)) L = L.filter((p) => q.sil.split(',').some((h) => (p.attrs.Silhouette || '').toLowerCase().includes(h)));
    if (has(q.acc)) L = L.filter((p) => q.acc.split(',').every((a) => p.accepts.includes(a)));
    if (has(q.cl)) L = L.filter((p) => p.clients && q.cl.split(',').every((k) => p.clients[k] === 'oui' || (q.cld && p.clients[k] === 'discuter')));
    if (has(q.age)) { const [a, b] = q.age.split('-').map(Number); L = L.filter((p) => { const ag = Array.isArray(p.age) ? Math.min(...p.age) : p.age; return ag >= a && ag <= b; }); }
    if (has(q.prix)) { const [a, b] = q.prix.split('-').map(Number); L = L.filter((p) => (p.from == null ? !!q.prixnr : p.from >= a && (b >= 1000 || p.from <= b))); }
    if (q.nosmoke) L = L.filter((p) => p.attrs.Tabac === 'Non');
    if (q.recent) L = L.filter((p) => p.photosRecent || -p.verif.media <= 30);
    if (q.video) L = L.filter((p) => p.video);
    if (q.face) L = L.filter((p) => !p.faceHidden);
    if (has(q.q)) { if (isPhone(q.q)) { const s = q.q.replace(/\s|\./g, ''); L = L.filter((p) => p.tel.replace(/\s|•/g, '').includes(s.replace(/^0/, '+41'))); } else L = L.filter((p) => V.fts(q.q, p).ok); }
    if (q.chg) { const c = V.S.chg; const ids = [...c.arrive, ...c.dispo, ...c.upd]; L = L.filter((p) => ids.includes(p.id)); }
    const tri = q.tri || 'maj';
    const idx = (p) => P.indexOf(p);
    const sorters = {
      maj: (a, b) => ((b.isUpd ? 1 : 0) + (b.isNew ? 1 : 0)) - ((a.isUpd ? 1 : 0) + (a.isNew ? 1 : 0)) || idx(a) - idx(b),
      dispo: (a, b) => V.statusRank[V.statusOf(a).t] - V.statusRank[V.statusOf(b).t] || V.statusOf(b).since - V.statusOf(a).since,
      new: (a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || b.verif.id - a.verif.id,
      'prix-asc': (a, b) => (a.from == null) - (b.from == null) || a.from - b.from, 'prix-desc': (a, b) => (a.from == null) - (b.from == null) || b.from - a.from,
      age: (a, b) => [].concat(a.age)[0] - [].concat(b.age)[0],
    };
    return L.sort(sorters[tri] || sorters.maj);
  };
  /* Ordre stable pendant la session : l'ordre calculé au premier affichage ne bouge plus (GAL-03) */
  const stableOrder = (q, list) => {
    const key = FKEYS.filter((k) => k !== 'chg').map((k) => q[k] || '').join('|');
    V.S.order = V.S.order || {};
    if (!V.S.order[key]) { V.S.order[key] = list.map((p) => p.id); V.save(); return list; }
    const known = V.S.order[key];
    const knownSet = new Set(known);
    const inList = new Set(list.map((p) => p.id));
    const ordered = known.filter((id) => inList.has(id));
    // les profils présents dans la liste mais absents de l'ordre mémorisé (ex. profils ajoutés après coup) sont ajoutés à la fin
    const extras = list.filter((p) => !knownSet.has(p.id)).map((p) => p.id);
    if (extras.length) { V.S.order[key] = [...known, ...extras]; V.save(); }
    return [...ordered, ...extras].map(V.byId);
  };
  const activeCount = (q) => FKEYS.filter((k) => !['cat', 'tri', 'q', 'chg'].includes(k) && q[k]).length;
  const DISPO = [['all', 'Toutes'], ['now', 'Disponibles maintenant'], ['today', 'Aujourd’hui'], ['tomorrow', 'Demain'], ['request', 'Sur demande']];
  const TRI = [['maj', 'Mis à jour récemment'], ['dispo', 'Disponibles d’abord'], ['new', 'Nouvelles arrivées'], ['prix-asc', 'Tarif croissant'], ['prix-desc', 'Tarif décroissant'], ['age', 'Âge']];
  const LANGQ = ['fr', 'en', 'es', 'pt', 'ru', 'it', 'de', 'ar'];

  V.route(/^\/profils$/, (m, q) => {
    const L0 = V.filterList(q);
    const L1 = q.chg ? L0 : stableOrder(q, L0);
    const sp = q.chg ? [] : V.sponsoredFor(q, L1);
    const L = V.arrangeSponsored(L1, sp);
    const spSet = new Set(sp.map((p) => p.id));
    V.lastOrder = L.map((p) => p.id);
    const catLbl = (V.CATS.find((c) => c.id === (q.cat || 'all')) || V.CATS[0]).label;
    const ac = activeCount(q);
    const chipsActive = pillsFor(q);
    return {
      title: 'Profils', keepScroll: true,
      html: `<div class="wrap">
        <div class="g-head"><div class="eyebrow">Genève · ${P.filter((p) => V.visible(p)).length} profils vérifiés</div>
          <h1 style="margin-top:10px">${q.cat && q.cat !== 'all' ? `${catLbl}, à Genève.` : q.dispo === 'now' ? 'Disponibles, maintenant.' : 'Tous les profils, à Genève.'}</h1></div>
        <div class="g-tools" id="gTools">
          ${V.seg('cat', V.CATS.map((c) => [c.id, c.label]), q.cat || 'all')}
          <div class="row2"><div class="chips scroll">
            <button class="chip filter${ac ? ' has' : ''}" data-act="filters">${I('filter', 'sm')}Filtres${ac ? ` · ${ac}` : ''}</button>
            <button class="chip filter${q.q ? ' has' : ''}" data-act="search">${I('search', 'sm')}${q.q ? esc(q.q) : 'Mot-clé ou numéro'}</button>
            <button class="chip filter${q.dispo ? ' has' : ''}" data-act="filters" data-g="dispo">Disponibilité${I('chevron-down', 'sm')}</button>
            <button class="chip filter${q.lang ? ' has' : ''}" data-act="filters" data-g="lang">Langue${I('chevron-down', 'sm')}</button>
            <button class="chip filter${q.mode ? ' has' : ''}" data-act="filters" data-g="mode">Modalité${I('chevron-down', 'sm')}</button>
            <button class="chip filter${q.svc ? ' has' : ''}" data-act="filters" data-g="svc">Service${I('chevron-down', 'sm')}</button>
            <button class="chip filter${q.origin ? ' has' : ''}" data-act="filters" data-g="origin">Origine${I('chevron-down', 'sm')}</button>
            <button class="chip filter" data-act="sort">${I('sort', 'sm')}${(TRI.find((t) => t[0] === (q.tri || 'maj')) || TRI[0])[1]}</button>
            ${V.L.account ? `<button class="chip filter" data-act="save-search">${I('bookmark', 'sm')}Enregistrer</button>` : ''}
          </div></div>
          ${chipsActive ? `<div class="chips" style="margin-top:10px">${chipsActive}<button class="txt-btn" data-act="clear-filters">Tout effacer</button></div>` : ''}
        </div>
        <div class="g-layout with-aside">
          <div>
            <div id="news"></div>
            ${q.chg ? `<div class="mode-changes"><span>Vous voyez uniquement ce qui a changé depuis le début de votre visite.</span><button data-act="exit-changes">Revenir à ma liste</button></div>` : ''}
            <div class="row-b" style="margin-bottom:14px"><span class="g-count" id="gCount">${L.length} profil${L.length > 1 ? 's' : ''}${sp.length ? ` · dont ${sp.length} « ${esc(V.sponLabel())} »` : ''}</span><a class="txt-btn" href="#/masques">${I('eye-off', 'sm')}Masqués (${V.hidden().length})</a></div>
            ${L.length ? '<div class="gallery" id="gallery"></div><div class="sentinel" id="sentinel"></div><div class="load-more" id="loadMore"></div>' : V.empty('search', 'Aucun profil ne correspond', 'Élargissez votre recherche : retirez un filtre pour voir plus de profils.', `<div class="chips" style="justify-content:center">${pillsFor(q)}</div>`)}
          </div>
          <aside class="aside-session"><div class="session-box" data-live></div></aside>
        </div>
      </div>${V.footer()}`,
      after: (v) => {
        V.ui.newsBanner();
        V.ui.renderSession();
        $('[data-seg="cat"]', v).addEventListener('seg', (e) => setQ({ cat: e.detail === 'all' ? '' : e.detail }));
        if (L.length) infinite(v, L, spSet);
        const tools = $('#gTools');
        const obs = new IntersectionObserver(([e]) => tools.classList.toggle('stuck', e.intersectionRatio < 1), { threshold: [1], rootMargin: `-${parseInt(getComputedStyle(document.documentElement).getPropertyValue('--top-h')) + 1}px 0px 0px 0px` });
        obs.observe(tools);
      },
    };
  }, { keepScroll: true });

  function pillsFor(q) {
    const out = [];
    const x = (k, label, v) => out.push(`<button class="chip sm x on" data-act="unfilter" data-k="${k}" ${v ? `data-v="${v}"` : ''}>${label}${I('x', 'sm')}</button>`);
    if (q.dispo) x('dispo', DISPO.find((d) => d[0] === q.dispo)[1]);
    (q.lang || '').split(',').filter(Boolean).forEach((l) => x('lang', V.LANGS[l], l));
    if (q.mode) x('mode', q.mode === 'incall' ? 'Reçoit' : 'Se déplace');
    (q.svc || '').split(',').filter(Boolean).forEach((s) => x('svc', V.SERVICES[s], s));
    (q.commune || '').split(',').filter(Boolean).forEach((c) => x('commune', V.communeTxt(c), c));
    (q.origin || '').split(',').filter(Boolean).forEach((o) => x('origin', o, o));
    (q.hair || '').split(',').filter(Boolean).forEach((h) => x('hair', 'Cheveux : ' + h, h));
    (q.sil || '').split(',').filter(Boolean).forEach((h) => x('sil', h, h));
    (q.acc || '').split(',').filter(Boolean).forEach((h) => x('acc', 'Accepte : ' + h.toLowerCase(), h));
    (q.cl || '').split(',').filter(Boolean).forEach((h) => x('cl', (CLIENTS.find(([k]) => k === h) || [, h])[1], h));
    if (q.cld) x('cld', 'Avec « à discuter »');
    if (q.prixnr) x('prixnr', 'Avec « tarif non renseigné »');
    if (q.age) x('age', 'Âge : ' + q.age.replace('-', ' à ') + ' ans');
    if (q.prix) x('prix', 'Tarif : ' + q.prix.replace('-', ' à ') + ' CHF');
    if (q.nosmoke) x('nosmoke', 'Non-fumeur·se');
    if (q.recent) x('recent', 'Photos récentes');
    if (q.video) x('video', 'Avec vidéo');
    if (q.face) x('face', 'Visage visible');
    if (q.q) x('q', '« ' + esc(q.q) + ' »');
    return out.join('');
  }
  const setQ = (patch, replace = true) => {
    const { path, q } = V.parse();
    const nq = Object.assign({}, q, patch);
    Object.keys(nq).forEach((k) => { if (nq[k] === '' || nq[k] == null || nq[k] === false) delete nq[k]; });
    const h = '#' + (path === '/profils' ? path : '/profils') + V.qs(nq);
    if (replace) location.replace(h); else location.hash = h;
  };
  V.setQ = setQ;

  function infinite(v, L, spSet = new Set()) {
    const g = $('#gallery', v); const sent = $('#sentinel', v); const more = $('#loadMore', v);
    let n = 0;
    const chg = !!V.parse().q.chg;
    const batch = () => {
      const chunk = L.slice(n, n + 8);
      let html = '';
      // placement sponsorisé : carte agrandie et étiquetée, en tête de lot, seulement s'il correspond aux filtres (P08)
      chunk.forEach((p, k) => { html += V.card(p, { i: k, feat: spSet.has(p.id) && !chg }); });
      g.insertAdjacentHTML('beforeend', html);
      n += chunk.length;
      more.innerHTML = n < L.length ? '' : `<span class="muted small">${L.length} profils · fin de la liste</span>`;
    };
    batch();
    V.ui.refreshCount = () => { const c = $('#gCount'); if (c) { const k = $$('#gallery .card:not(.out)').length, s = $$('#gallery .card.feat:not(.out)').length; c.textContent = `${k} profil${k > 1 ? 's' : ''}${s ? ` · dont ${s} « ${V.sponLabel()} »` : ''}`; } };
    const io = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting || n >= L.length || g.dataset.loading) return;
      g.dataset.loading = 1;
      g.insertAdjacentHTML('beforeend', V.skel(Math.min(4, L.length - n)));
      setTimeout(() => { $$('.skel', g).forEach((s) => s.remove()); batch(); delete g.dataset.loading; }, 650);
    }, { rootMargin: '400px 0px' });
    io.observe(sent);
  }

  /* Feuille « Tous les filtres » : brouillon + compteur en direct */
  V.openFilters = (group) => {
    const { q } = V.parse();
    const d = Object.assign({}, q);
    const tog = (k, v) => { const a = (d[k] || '').split(',').filter(Boolean); const i = a.indexOf(v); i >= 0 ? a.splice(i, 1) : a.push(v); d[k] = a.join(','); };
    const ch = (k, v, l) => `<button class="chip sm${(d[k] || '').split(',').includes(v) ? ' on' : ''}" data-fk="${k}" data-fv="${v}"><span class="ck">${I('check', 'sm')}</span>${l}</button>`;
    const one = (k, v, l) => `<button class="chip sm${(d[k] || '') === v || (!d[k] && v === 'all') ? ' on' : ''}" data-fk1="${k}" data-fv="${v}"><span class="ck">${I('check', 'sm')}</span>${l}</button>`;
    const grp = (id, title, body, open) => `<details class="acc filter" ${open || group === id ? 'open' : ''} id="fg-${id}"><summary>${title}<span class="cnt" data-cnt="${id}"></span><span class="pm">${I('plus', 'sm')}</span></summary><div class="acc-b" style="max-width:none">${body}</div></details>`;
    const [a0, a1] = (d.age || '18-60').split('-'); const [p0, p1] = (d.prix || '200-1000').split('-');
    const body = `
      ${grp('cat', 'Catégorie', `<div class="chips">${V.CATS.map((c) => one('cat', c.id, c.label)).join('')}</div>`, true)}
      ${grp('dispo', 'Disponibilité', `<div class="chips">${DISPO.map(([v, l]) => one('dispo', v, l)).join('')}</div><p class="hint">Les statuts sont déclarés par les professionnelles et expirent automatiquement.</p>`)}
      ${grp('commune', 'Lieu', `<div class="chips">${V.COMMUNES.map((c) => ch('commune', c.id, c.label)).join('')}</div>`)}
      ${grp('mode', 'Rendez-vous', `<div class="chips">${one('mode', 'all', 'Peu importe')}${one('mode', 'incall', 'Reçoit')}${one('mode', 'outcall', 'Se déplace')}</div>`)}
      ${grp('age', 'Âge (vérifié)', V.rangeHTML('age', 18, 60, a0, a1, ' ans', { plus: 1, gap: 2 }))}
      ${grp('prix', 'Tarif de départ', `${V.rangeHTML('prix', 200, 1000, p0, p1, ' CHF', { step: 50, gap: 50, plus: 1 })}${V.sw('prixnr', !!d.prixnr, 'Inclure les tarifs non renseignés', 'Un tarif absent n’est jamais compté comme zéro')}`)}
      ${grp('lang', 'Langues parlées', `<div class="chips">${LANGQ.map((l) => ch('lang', l, V.LANGS[l])).join('')}</div>`)}
      ${grp('origin', 'Origine (déclarée par la personne)', `<div class="chips">${V.ORIGINS.filter((o) => o !== 'Non précisée').map((o) => ch('origin', o, o)).join('')}</div><p class="hint">Information facultative, renseignée uniquement par les personnes qui le souhaitent.</p>`)}
      ${grp('svc', 'Services', `<div class="chips">${Object.entries(V.SERVICES).map(([k, l]) => ch('svc', k, l)).join('')}</div>`)}
      ${grp('phys', 'Physique', `<p class="small b" style="margin-bottom:8px">Cheveux</p><div class="chips">${['blond', 'brun', 'noir', 'roux', 'châtain'].map((h) => ch('hair', h, h[0].toUpperCase() + h.slice(1))).join('')}</div><p class="small b" style="margin:14px 0 8px">Silhouette</p><div class="chips">${['mince', 'sportive', 'normale', 'pulpeuse', 'petite'].map((h) => ch('sil', h, h[0].toUpperCase() + h.slice(1))).join('')}</div>`)}
      ${grp('acc', 'Accepte', `<div class="chips">${['Hommes', 'Femmes', 'Couples'].map((a) => ch('acc', a, a)).join('')}</div>`)}
      ${grp('cl', 'Clientèle et composition', `<div class="chips">${CLIENTS.map(([k, l]) => ch('cl', k, l)).join('')}</div>${V.sw('cld', !!d.cld, 'Inclure « à discuter »', 'Sinon, seulement les profils qui acceptent clairement')}`)}
      ${grp('more', 'Autres critères', `${V.sw('nosmoke', !!d.nosmoke, 'Non-fumeur·se')}${V.sw('recent', !!d.recent, 'Photos vérifiées il y a moins de 30 jours')}${V.sw('video', !!d.video, 'Avec vidéo de présentation')}${V.sw('face', !!d.face, 'Visage visible sur les photos')}`)}`;
    const sh = V.sheet.open({ title: 'Filtres', side: matchMedia('(min-width:1024px)').matches, body, foot: `<button class="btn ghost sm" data-clear style="flex:1">Tout effacer</button><button class="btn sm" data-apply style="flex:2"><span class="roll"><span id="fcount">Voir</span><span aria-hidden="true">Appliquer</span></span></button>` });
    const upd = () => {
      const n = V.filterList(d).length;
      $('#fcount', sh).textContent = `Voir ${n} profil${n > 1 ? 's' : ''}`;
      $('#fcount', sh).nextElementSibling.textContent = `Voir ${n} profil${n > 1 ? 's' : ''}`;
      $('[data-apply]', sh).classList.toggle('is-disabled', !n);
      $$('[data-cnt]', sh).forEach((c) => { const k = c.dataset.cnt; const v = k === 'phys' ? [d.hair, d.sil].filter(Boolean).join(',') : k === 'more' ? ['nosmoke', 'recent', 'video', 'face'].filter((x) => d[x]).join(',') : d[k]; c.textContent = v && v !== 'all' ? (k === 'age' || k === 'prix' ? '· ' + v.replace('-', ' à ') : '· ' + v.split(',').length) : ''; });
    };
    sh.addEventListener('click', (e) => {
      const c = e.target.closest('[data-fk]'); const o = e.target.closest('[data-fk1]');
      if (c) { tog(c.dataset.fk, c.dataset.fv); c.classList.toggle('on'); upd(); }
      if (o) { const k = o.dataset.fk1; d[k] = o.dataset.fv === 'all' ? '' : o.dataset.fv; $$(`[data-fk1="${k}"]`, sh).forEach((b) => b.classList.toggle('on', b === o)); upd(); }
    });
    sh.addEventListener('change', (e) => { if (e.target.type === 'checkbox' && e.target.name) { d[e.target.name] = e.target.checked ? '1' : ''; upd(); } });
    sh.addEventListener('range', (e) => { const r = e.target.closest('.range'); const [a, b] = $$('input', r); const k = r.dataset.name; const full = k === 'age' ? (+a.value === 18 && +b.value === 60) : (+a.value === 200 && +b.value === 1000); d[k] = full ? '' : `${a.value}-${b.value}`; upd(); });
    $('[data-clear]', sh).onclick = () => { FKEYS.forEach((k) => { if (k !== 'tri') delete d[k]; }); V.sheet.close(); setQ(Object.fromEntries(FKEYS.filter((k) => k !== 'tri').map((k) => [k, '']))); };
    $('[data-apply]', sh).onclick = () => { V.sheet.close(); const patch = {}; FKEYS.forEach((k) => { patch[k] = d[k] || ''; }); setQ(patch); };
    if (group) setTimeout(() => { const g = $('#fg-' + group, sh); if (g) g.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 350);
    upd();
  };
  V.openSort = () => {
    const { q } = V.parse();
    const sh = V.sheet.open({ title: 'Ordre d’affichage', body: `<div class="stack">${TRI.map(([v, l]) => V.opt('tri', v, l, v === 'maj' ? 'Par défaut. Aucun classement payant, sauf les encarts étiquetés.' : '', { on: (q.tri || 'maj') === v })).join('')}</div><p class="hint" style="margin-top:14px">L’ordre reste stable pendant votre visite : les nouveautés sont signalées à part, rien ne bouge sous vos yeux.</p>` });
    sh.addEventListener('change', (e) => { if (e.target.name === 'tri') { setTimeout(() => { V.sheet.close(); setQ({ tri: e.target.value === 'maj' ? '' : e.target.value }); }, 220); } });
  };
  V.openSearch = () => {
    const sh = V.sheet.open({ title: 'Rechercher', body: `${V.field('Mot-clé, pseudo ou numéro', { name: 'q', attrs: 'autocomplete="off" inputmode="search"' })}<p class="hint">Cherche dans les présentations et les pratiques, en 8 langues, même avec une faute : « massge », « english », « bacio ». Un numéro vérifie qu’il appartient à un profil vérifié (ex. 079 412).</p><div class="list-rows" id="sres" style="margin-top:10px"></div>` });
    const inp = $('input', sh); setTimeout(() => inp.focus(), 300);
    const run = () => {
      const s = inp.value.trim();
      const res = s ? V.filterList({ q: s }, P.filter(V.visible)) : [];
      $('#sres', sh).innerHTML = s ? (res.length ? res.map((p) => `<div style="cursor:pointer" data-act="open" data-id="${p.id}"><img class="avatar sq" src="${V.img(p.photos[0], 's')}" alt=""><div class="sp"><b class="serif" style="font-size:19px;font-weight:400">${esc(p.name)}, ${V.ageShort(p)}</b><div class="small muted">${p.tel} · ${V.communeTxt(p.commune)}</div></div>${I('badge-check', 'gold')}</div>`).join('') : `<div class="callout danger"><span>Aucun profil vérifié ne correspond à « ${esc(s)} ». Méfiez-vous des numéros qui ne figurent pas sur BD.</span></div>`) : '';
    };
    inp.addEventListener('input', run);
    $('.sh-body', sh).insertAdjacentHTML('beforeend', `<div class="row" style="margin-top:16px">${V.btn('Filtrer la galerie', { cls: 'sm dark', act: 'search-apply' })}</div>`);
    $('[data-act="search-apply"]', sh).onclick = (e) => { e.stopPropagation(); V.sheet.close(); setQ({ q: inp.value.trim() }); };
  };

  /* =================================================================== FICHE (surcouche) */
  V.route(/^\/profil\/([\w-]+)$/, (m) => {
    const p = V.byId(m[1]);
    if (!p || !V.visible(p)) { location.replace('#/indisponible'); return; }
    if (!V.S.seen.includes(p.id)) { V.S.seen.push(p.id); V.save(); }
    if (V.L.account) { V.L.recent = [p.id, ...V.L.recent.filter((x) => x !== p.id)].slice(0, 30); V.save(); }
    $$(`.card[data-id="${p.id}"]`).forEach((c) => c.classList.add('seen'));
    V.overlay.open('fiche', ficheHTML(p), (ov) => ficheAfter(ov, p));
  }, { overlay: true });

  const slidesFor = (p) => {
    const s = p.photos.map((ph) => ({ src: V.img(ph), pos: 'center 25%' }));
    // une seule photo : la maquette propose deux cadrages supplémentaires
    if (s.length === 1) s.push({ src: s[0].src, pos: 'center 12%', zoom: 1.35 }, { src: s[0].src, pos: 'center 70%', zoom: 1.2 });
    else s.push({ src: s[0].src, pos: 'center 15%', zoom: 1.3 });
    return s;
  };
  /* ---------- Fiche : aides d'affichage (drapeaux en SVG car Windows n'affiche pas les émojis drapeaux) ---------- */
  const flag = (l) => V.flag(l); // drapeaux SVG : voir core.js
  const LV_TXT = { C2: 'Parfait', C1: 'Courant', B2: 'Très bien', B1: 'Bien', A2: 'Notions', A1: 'Débutant' };
  const LV_N = { C2: 5, C1: 4, B2: 3, B1: 3, A2: 2, A1: 1 };
  const starsRow = (n, max) => Array.from({ length: max }, (_, j) => `<i class="${j < n ? 'on' : ''}">${I('star', 'sm')}</i>`).join('');
  const PAY = { chf: ['banknote', 'Espèces (CHF)'], eur: ['euro', 'Euros'], twint: ['smartphone', 'Twint'], card: ['card', 'Carte bancaire'] };
  const ABOUT = [['Taille', 'ruler'], ['Silhouette', 'user'], ['Cheveux', 'palette'], ['Yeux', 'eye'], ['Poitrine', 'target'], ['Épilation', 'scissors'], ['Tatouage', 'brush'], ['Piercing', 'gem'], ['Tabac', 'cigarette']];
  const nf = (n) => Number(n || 0).toLocaleString('fr-CH');
  function ficheHTML(p) {
    const st = V.statusInfo(p);
    const on = V.isSel(p.id);
    const slides = slidesFor(p);
    const order = V.lastOrder && V.lastOrder.includes(p.id) ? V.lastOrder : vis().map((x) => x.id);
    const k = order.indexOf(p.id);
    const prev = V.byId(order[(k - 1 + order.length) % order.length]), next = V.byId(order[(k + 1) % order.length]);
    const v = p.verif;
    const persons = p.persons ? p.persons.map((x) => { const ref = x.ref && V.byId(x.ref); const at = ref ? ref.attrs : x.attrs || {}; return `<div class="panel soft" style="padding:16px"><div class="row" style="margin-bottom:10px">${ref ? `<img class="avatar" src="${V.img(ref.photos[0], 's')}" alt="">` : `<span class="avatar">${x.name[0]}</span>`}<div><b class="serif" style="font-size:20px;font-weight:400">${esc(x.name)}, ${x.age} ans</b><div class="xs muted">Âge vérifié · identité contrôlée</div></div></div><div class="attrs">${Object.entries(at).slice(0, 6).map(([kk, vv]) => `<div class="attr"><span>${kk}</span><b>${vv}</b></div>`).join('')}</div></div>`; }).join('') : '';
    const first = p.name.split(' ')[0];
    const pron = p.cat === 'homme' ? 'Il' : p.cat === 'duo' ? 'Ils' : 'Elle';
    const comm = V.COMMUNES.find((c) => c.id === p.commune);
    const shield = comm && comm.c ? comm.c : p.commune;
    const placeTxt = V.communeTxt(p.commune) + (comm && comm.c === 'geneve' ? ' (Genève)' : '');
    const incall = p.mode !== 'outcall', outcall = p.mode !== 'incall';
    const modeShort = { both: 'Reçoit et se déplace', incall: 'Reçoit', outcall: 'Se déplace' }[p.mode] || '';
    const offered = new Set(p.services);
    const groups = (V.SVC_GROUPS || []).map(([g, ids]) => [g, ids.filter((s) => offered.has(s))]).filter(([, ids]) => ids.length);
    const inGroups = new Set(groups.flatMap(([, ids]) => ids));
    const others = p.services.filter((s) => !inGroups.has(s) && V.SERVICES[s]);
    if (others.length) groups.push(['Autres', others]);
    const price = (r, ix, ok) => (ok && r[ix] ? `<b>${V.chf(r[ix])}</b>` : ok && !p.from ? '<span class="muted">non renseigné</span>' : '<span class="muted">—</span>');
    const typeTxt = p.type || p.kind || ((V.CATS.find((c) => c.id === p.cat) || {}).label || '').replace(/s$/, '');
    const aboutRows = [
      ['map-pin', 'Quartier', placeTxt], ['flag', 'Origine', p.origin], ['cake', 'Âge', V.ageTxt(p)], ['briefcase', 'Profil', typeTxt],
      ...ABOUT.filter(([k2]) => p.attrs[k2]).map(([k2, ic]) => [ic, k2 === 'Tabac' ? (p.cat === 'homme' ? 'Fumeur' : 'Fumeuse') : k2, p.attrs[k2]]),
      ...Object.entries(p.attrs).filter(([k2]) => !ABOUT.some(([a]) => a === k2)).map(([k2, v2]) => ['info', k2, v2]),
      ['users', 'Accepte', p.accepts.join(', ')],
    ];
    const contacts = { tel: ['phone', 'Appeler'], wa: ['wa', 'WhatsApp'], sms: ['sms', 'SMS'], tg: ['tg', 'Telegram'] };
    const cs = p.contacts.slice(0, 3); // seulement les canaux acceptés par la personne
    const duoP = p.duo ? V.byId(p.duo) : null;
    return `<article class="fiche" tabindex="-1">
      <div class="f-top"><button class="icon-btn" data-act="close-ov" aria-label="Fermer">${I('arrow-left')}</button><div class="ttl">${esc(p.name)}, ${V.ageShort(p)}</div><span class="sp"></span>
        <button class="icon-btn" data-act="share" data-id="${p.id}" aria-label="Partager">${I('share')}</button>
        <button class="icon-btn" data-act="fav" data-id="${p.id}" aria-label="Sélection"><span style="color:${on ? 'var(--violet)' : 'inherit'}">${I('heart')}</span></button>
        <button class="icon-btn" data-act="close-ov" aria-label="Fermer la fiche (Échap)">${I('x')}</button></div>
      <div class="f-grid">
        <div class="f-media protect">
          <div class="f-track" id="fTrack">${slides.map((s, j) => `<div class="f-slide"><img src="${s.src}" alt="Photo ${j + 1} de ${esc(p.name)}" style="object-position:${s.pos};${s.zoom ? `transform:scale(${s.zoom});transform-origin:${s.pos}` : ''}" draggable="false"><span class="wm">BD · photo vérifiée</span></div>`).join('')}</div>
          <div class="f-dots">${slides.map((_, j) => `<i class="${j ? '' : 'on'}"></i>`).join('')}</div>
          <div class="navs d-only"><button data-act="slide" data-d="-1" aria-label="Photo précédente">${I('chevron-left')}</button><button data-act="slide" data-d="1" aria-label="Photo suivante">${I('chevron-right')}</button></div>
          <button class="icon-btn zoom" style="background:rgba(255,255,255,.88);color:#120d18" data-act="zoom" aria-label="Agrandir">${I('maximize')}</button>
        </div>
        <div class="f-body">
          <div class="eyebrow">${esc(typeTxt)} · ${V.communeTxt(p.commune)}</div>
          <h2 class="f-name" style="margin-top:10px">${esc(p.name)}<span class="age">${V.ageTxt(p)}</span></h2>
          <div class="f-sub">${V.statusPill(p, true)}<span class="xs muted">${st.sub}</span>${(p.likes || 0) > 2500 ? `<span class="f-hot">${I('flame', 'sm')}Très demandée</span>` : ''}${p.tourLeft ? `<span class="badge pst-tour">Plus que ${p.tourLeft} jours à Genève</span>` : ''}${p.newPhoto ? '<span class="badge pst-photo">Nouvelle photo</span>' : ''}${p.online ? '<span class="badge pst-online"><i></i>En ligne</span>' : ''}</div>
          <p class="f-ver">${I('badge-check', 'sm')}<span><b>Profil vérifié</b> · âge réel contrôlé${p.photosRecent || -v.media <= 30 ? ' · photos de moins de 30 jours' : ''}${p.duoVerified ? ' · duo vérifié' : ''}${p.video ? ' · vidéo de présentation' : ''}</span></p>
          <div class="f-actions">
            <button class="f-act${on ? ' on' : ''}" data-act="fav" data-id="${p.id}">${I('heart')}<span class="lbl">${on ? 'Ajoutée' : 'Ajouter'}</span></button>
            <button class="f-act" data-act="compare-with" data-id="${p.id}">${I('columns')}<span>Comparer</span></button>
            <button class="f-act" data-act="hide-close" data-id="${p.id}">${I('eye-off')}<span>Masquer</span></button>
            <button class="f-act" data-act="report" data-id="${p.id}">${I('flag')}<span>Signaler</span></button>
          </div>
          <div class="f-priv"><button type="button" class="soc-b${(V.S.likes || []).includes(p.id) ? ' on' : ''}" data-f="like">${I('thumbs-up', 'sm')}J’aime</button><button type="button" class="soc-b${(V.S.follows || []).includes(p.id) ? ' on' : ''}" data-f="follow">${I('bell', 'sm')}Suivre</button><span class="xs muted">${I('lock', 'sm')}Privé : aucun compteur public, ${esc(first)} ne voit pas qui aime ou suit.</span></div>
          <div class="f-keys">
            <div class="fk">${I('map-pin')}<span><small>Quartier</small><b>${V.communeTxt(p.commune)}</b></span></div>
            <div class="fk">${I('banknote')}<span><small>À partir de</small><b>${p.from ? V.chf(p.from) : 'Non renseigné'}</b></span></div>
            <div class="fk">${I(incall ? 'home' : 'car')}<span><small>Rendez-vous</small><b>${modeShort}</b></span></div>
            <div class="fk">${I('languages')}<span><small>Langues</small><b class="fk-flags">${p.langs.slice(0, 4).map(([l]) => flag(l)).join('')}</b></span></div>
          </div>
          ${p.bio ? `<p class="f-quote">« ${esc(p.bio)} »</p>` : ''}

          <section class="f-card"><h3 class="f-h">${I('user')}${persons ? 'Les deux personnes' : `À propos de ${esc(first)}`}</h3>
            ${persons ? `<div class="stack">${persons}</div>` : `<div class="ab-grid">${aboutRows.map(([ic, k2, v2]) => `<div class="ab"><span class="ab-i">${I(ic)}</span><span><small>${k2}</small><b>${esc(String(v2))}</b></span></div>`).join('')}</div>`}
          </section>

          <section class="f-card"><h3 class="f-h">${I('quote')}Description</h3>
            <div class="f-desc">${(p.desc || [p.bio]).filter(Boolean).map((t) => `<p>${esc(t)}</p>`).join('')}</div>
            <div class="callout gold" style="margin-top:14px"><span><b>Consignes de ${esc(first)}</b><br>${esc(p.rules)}</span></div>
            ${p.interests && p.interests.length ? `<div class="f-int"><small>Centres d’intérêt</small><div class="chips">${p.interests.map((t) => `<span class="chip sm" style="pointer-events:none">${esc(t)}</span>`).join('')}</div></div>` : ''}
          </section>

          <section class="f-card"><div class="f-h-row"><h3 class="f-h">${I('flame')}Pratiques</h3><span class="f-count">${p.services.length} pratiques</span></div>
            <div class="svc-groups">${groups.map(([g, ids]) => `<div class="svc-g"><span class="svc-gt">${g}</span><div class="svc-chips">${ids.map((s) => `<span class="svc-c">${I('check', 'sm')}${V.SERVICES[s]}</span>`).join('')}</div></div>`).join('')}${p.limits.length ? `<div class="svc-g"><span class="svc-gt">Ne pratique pas</span><div class="svc-chips">${p.limits.map((l) => `<span class="svc-c no">${I('x', 'sm')}${V.LIMITS[l]}</span>`).join('')}</div></div>` : ''}</div>
          </section>

          ${p.clients ? `<section class="f-card"><h3 class="f-h">${I('users')}Clientèle et composition</h3>
            <div class="cl-grid">${CLIENTS.map(([k, l]) => `<div class="cl-i ${p.clients[k]}"><span>${l}</span>${CLV(p.clients[k])}</div>`).join('')}</div>
            <p class="hint">Déclaré par ${esc(first)}. « À discuter » : à préciser avec elle avant le rendez-vous.</p></section>` : ''}

          <section class="f-card"><h3 class="f-h">${I('map-pin')}Localisation</h3>
            <p class="f-p">${esc(first)} travaille dans le secteur <b>${placeTxt}</b>. ${incall && outcall ? `${pron} reçoit et se déplace dans tout le canton.` : incall ? `${pron} reçoit uniquement.` : `${pron} se déplace uniquement, dans tout le canton.`}</p>
            <div class="loc-modes"><span class="${incall ? 'ok' : 'no'}">${I(incall ? 'check' : 'x', 'sm')}Je reçois</span><span class="${outcall ? 'ok' : 'no'}">${I(outcall ? 'check' : 'x', 'sm')}Je me déplace</span></div>
            <div class="loc-map" aria-hidden="true"><span class="loc-lake"></span><span class="loc-zone"></span><span class="loc-pin">${I('map-pin')}</span><span class="loc-lbl"><img src="img/armoiries/${shield}.webp" alt="" width="16" height="19">${V.communeTxt(p.commune)}</span></div>
            <p class="hint">Zone approximative. L’adresse exacte n’est jamais publiée : ${esc(first)} la communique au moment du rendez-vous.</p>
          </section>

          <section class="f-card"><h3 class="f-h">${I('languages')}Langues parlées</h3>
            <div class="lg-list">${p.langs.map(([l, lv], j) => `<div class="lg">${flag(l)}<span class="lg-n">${V.LANGS[l] || l}<small>${j === 0 && lv === 'C2' ? 'Langue maternelle' : LV_TXT[lv] || lv}</small></span><span class="lg-s" title="Niveau ${lv}">${starsRow(LV_N[lv] || 1, 5)}</span></div>`).join('')}</div>
          </section>

          <section class="f-card"><h3 class="f-h">${I('calendar')}Disponibilités</h3>
            <div class="week">${['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((dd, j) => `<div class="${p.week[j] ? 'on' : 'off'}"><b>${dd}</b>${p.week[j] ? 'Oui' : 'Repos'}</div>`).join('')}</div>
            <div class="f-line">${I('clock', 'sm')}<span>Horaires habituels : <b>${p.hours}</b></span></div>
            <p class="hint">Horaires indicatifs déclarés par ${esc(first)}. Le statut du jour fait foi.</p>
          </section>

          <section class="f-card"><h3 class="f-h">${I('banknote')}Tarifs</h3>
            <div class="rt"><div class="rt-h"><span>Durée</span><span>${I('home', 'sm')}Reçoit</span><span>${I('car', 'sm')}Se déplace</span></div>${p.rates.map((r) => `<div class="rt-r"><span>${I('clock', 'sm')}${r[0]}</span><span>${price(r, 1, incall)}</span><span>${price(r, 2, outcall)}</span></div>`).join('')}</div>
            <h4 class="f-h4">Moyens de paiement</h4>
            <div class="pay">${(p.pay || ['chf']).filter((k2) => PAY[k2]).map((k2) => `<span class="pay-i">${I(PAY[k2][0], 'sm')}${PAY[k2][1]}</span>`).join('')}</div>
            <p class="hint">Tarifs fixés librement par ${esc(first)}. BD ne perçoit aucune commission sur les rendez-vous.</p>
          </section>

          ${p.links && p.links.length ? `<section class="f-card"><h3 class="f-h">${I('link')}Ailleurs sur le web</h3>
            <div class="ext-links">${p.links.map((l) => `<a class="ext-l" href="#" data-act="ext-link" data-k="${l.k}" data-h="${esc(l.h)}" rel="nofollow noopener">${I(l.k === 'webcam' ? 'video' : l.k === 'instagram' ? 'camera' : 'star', 'sm')}<span><b>${{ webcam: 'Webcam', onlyfans: 'OnlyFans', instagram: 'Instagram' }[l.k]}</b><small>${esc(l.h)}</small></span>${I('arrow-up-right', 'sm')}</a>`).join('')}</div>
            <p class="hint">Simples liens, ajoutés par ${esc(first)}. BD n’intègre ni ne vérifie le contenu de ces sites.</p></section>` : ''}

          <section class="f-card"><h3 class="f-h">${I('shield')}Un retour sur ${esc(first)} ?</h3>
            <p class="f-p">Après un contact ou un rendez-vous, dites à l’équipe BD comment ça s’est passé. Votre retour reste <b>privé</b> : il n’est ni publié ni noté, et ${esc(first)} ne le voit pas.</p>
            <div class="fr-actions"><button type="button" class="soc-b" data-act="feedback" data-id="${p.id}">${I('edit', 'sm')}Laisser un retour privé</button><button type="button" class="soc-b danger" data-act="report" data-id="${p.id}">${I('alert', 'sm')}Signaler le profil</button></div>
          </section>

          ${duoP && V.visible(duoP) ? `<section class="f-card"><h3 class="f-h">${I('users')}Aussi en duo</h3><div class="duo-link" data-act="open" data-id="${duoP.id}"><img src="${V.img(duoP.photos[0], 's')}" alt=""><div class="sp"><b class="serif" style="font-size:21px;font-weight:400">${esc(duoP.name)}</b><div class="small muted">Duo réel · deux profils vérifiés et liés</div></div>${I('chevron-right')}</div></section>` : ''}
          ${p.members ? `<section class="f-card"><h3 class="f-h">${I('users')}Profils individuels</h3><div class="stack">${p.members.map(V.byId).map((x) => `<div class="duo-link" data-act="open" data-id="${x.id}"><img src="${V.img(x.photos[0], 's')}" alt=""><div class="sp"><b class="serif" style="font-size:21px;font-weight:400">${esc(x.name)}, ${x.age}</b><div class="small muted">${V.statusInfo(x).label}</div></div>${I('chevron-right')}</div>`).join('')}</div></section>` : ''}

          <section class="f-card"><h3 class="f-h">${I('shield')}Contrôles et dates</h3>
            <div class="checks">
              <div class="chk"><span class="chk-i">${I('badge-check')}</span><div><b>Âge réel et identité vérifiés le ${D.fmtShort(D.addDays(v.id))}</b><span>Pièce d’identité et selfie vivant, prestataire suisse. L’âge affiché est l’âge réel.</span></div></div>
              <div class="chk"><span class="chk-i">${I('badge-check')}</span><div><b>Médias concordants le ${D.fmtShort(D.addDays(v.media))}</b><span>Selfie de contrôle comparé aux photos publiées. Prochain contrôle avant le ${D.fmtShort(D.addDays(v.media + 90))}.</span></div></div>
              <div class="chk"><span class="chk-i">${I('badge-check')}</span><div><b>Indépendance confirmée le ${D.fmtShort(D.addDays(v.indep))}</b><span>Entretien direct avec notre équipe${p.persons ? ', pour chacune des deux personnes' : ''}. Renouvelé tous les 6 mois.</span></div></div>
            </div>
            <p class="hint">Portée exacte et date toujours visibles. Vérifié ne veut pas dire garanti : en cas de doute, <button class="link" data-act="report" data-id="${p.id}">signalez-le</button>.</p>
          </section>
          <div class="f-next">
            <button data-act="goto" data-id="${prev.id}"><img src="${V.img(prev.photos[0], 's')}" alt=""><span><small>Précédent</small><b>${esc(prev.name)}</b></span></button>
            <button class="r" data-act="goto" data-id="${next.id}"><img src="${V.img(next.photos[0], 's')}" alt=""><span><small>Suivant</small><b>${esc(next.name)}</b></span></button>
          </div>
          <div class="f-contact" style="grid-template-columns:repeat(${cs.length},1fr)">${cs.map((c, j) => V.btn(contacts[c][1], { cls: (j === 0 ? '' : 'ghost') + ' sm', act: 'contact', id: p.id, attrs: `data-ch="${c}"` })).join('')}</div>
        </div>
      </div>
    </article>`;
  }
  function ficheAfter(ov, p) {
    const f = $('.fiche', ov);
    const top = $('.f-top', ov);
    f.focus({ preventScroll: true });
    f.addEventListener('scroll', () => top.classList.toggle('show', f.scrollTop > 260), { passive: true });
    const tr = $('#fTrack', ov);
    tr.addEventListener('scroll', () => { const k = Math.round(tr.scrollLeft / tr.clientWidth); $$('.f-dots i', ov).forEach((d, j) => d.classList.toggle('on', j === k)); }, { passive: true });
    // glisser vers le bas pour fermer (mobile)
    let y0 = null;
    f.addEventListener('touchstart', (e) => { y0 = f.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
    f.addEventListener('touchmove', (e) => { if (y0 === null) return; const dy = e.touches[0].clientY - y0; if (dy > 0) f.style.transform = `translateY(${dy * .6}px)`; }, { passive: true });
    f.addEventListener('touchend', (e) => { if (y0 === null) return; const dy = e.changedTouches[0].clientY - y0; f.style.transform = ''; if (dy > 120) V.overlay.back(); y0 = null; });
    f.addEventListener('contextmenu', (e) => { if (e.target.tagName === 'IMG') e.preventDefault(); });
    // J'aime et Suivre : actions privées, sans compteur public
    const first = p.name.split(' ')[0];
    const priv = (k, b, on1, off1) => { const a = (V.S[k] = V.S[k] || []); const on = !a.includes(p.id); if (on) a.push(p.id); else a.splice(a.indexOf(p.id), 1); V.save(); b.classList.toggle('on', on); V.toast(on ? on1 : off1, { icon: k === 'likes' ? 'thumbs-up' : 'bell' }); };
    const likeB = $('[data-f="like"]', ov), folB = $('[data-f="follow"]', ov);
    if (likeB) likeB.onclick = () => priv('likes', likeB, `Vous aimez le profil de ${first}. C’est privé : aucun compteur public.`, 'J’aime retiré.');
    if (folB) folB.onclick = () => priv('follows', folB, `Vous suivez ${first} : ses nouveaux statuts vous seront signalés.`, `Vous ne suivez plus ${first}.`);
    // glisser à gauche ou à droite sur le texte de la fiche : profil suivant ou précédent
    let sx = null, sy = null;
    const body = $('.f-body', ov);
    body.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    body.addEventListener('touchend', (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null; if (Math.abs(dx) > 80 && Math.abs(dx) > 2 * Math.abs(dy)) { const b = $$('.f-next [data-act="goto"]', ov)[dx < 0 ? 1 : 0]; if (b) b.click(); } });
  }
  /* Flèches gauche et droite : fiche précédente ou suivante */
  document.addEventListener('keydown', (e) => {
    const t = e.target instanceof Element ? e.target : document.body;
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key) || V.sheet.el || t.closest('input, textarea, select, [contenteditable]')) return;
    const ov = $('#ov-fiche.on'); if (!ov || t.closest('.f-track')) return;
    const b = $$('.f-next [data-act="goto"]', ov)[e.key === 'ArrowRight' ? 1 : 0]; if (b) { e.preventDefault(); b.click(); }
  });
  /* Contact direct (hors plateforme) */
  V.openContact = (id, ch) => {
    const p = V.byId(id);
    const first = p.name.split(' ')[0];
    const labels = { tel: 'Appeler', wa: 'WhatsApp', sms: 'SMS', tg: 'Telegram' };
    V.S.clicks = (V.S.clicks || 0) + 1; V.save();
    const msg = `Bonjour ${first}, je vous contacte via BD. Seriez-vous disponible ${V.statusOf(p).t === 'now' ? 'ce soir' : 'prochainement'} ?`;
    const sh = V.sheet.open({
      title: `Contacter ${esc(first)}`,
      body: `<div class="row" style="margin-bottom:16px"><img class="avatar lg sq" src="${V.img(p.photos[0], 's')}" alt=""><div><b class="serif" style="font-size:22px;font-weight:400">${esc(p.name)}</b><div class="small">${V.statusPill(p, true)}</div></div></div>
        <div class="panel soft" style="padding:16px"><div class="xs muted">Numéro professionnel (fictif dans la maquette)</div><div class="row-b"><b style="font-size:22px;letter-spacing:.02em" class="num">${p.tel}</b><button class="txt-btn" data-copy>${I('copy', 'sm')}Copier</button></div></div>
        ${ch !== 'tel' ? `<div style="margin-top:14px">${V.field('Message pré-rempli (modifiable)', { type: 'textarea', value: msg, max: 300 })}</div>` : ''}
        <div class="callout gold" style="margin-top:14px"><span><b>Consignes :</b> ${esc(p.rules)}</span></div>
        <p class="hint" style="margin-top:14px">Le contact se fait directement, hors plateforme. BD ne lit ni ne conserve vos échanges, et ne prend aucune commission.</p>`,
      foot: `<button class="btn ghost sm" data-close2 style="flex:1">Fermer</button>${V.btn('Ouvrir ' + labels[ch], { cls: 'sm', attrs: 'data-go style="flex:2"', arrow: 'arrow-up-right' })}`,
    });
    $('[data-copy]', sh).onclick = () => V.toast('Numéro copié (fictif).', { icon: 'copy' });
    $('[data-close2]', sh).onclick = () => V.sheet.close();
    $('[data-go]', sh).onclick = () => { V.sheet.close(); V.toast(`Démo : ${labels[ch]} s’ouvrirait ici${ch !== 'tel' ? ' avec votre message' : ''}. Clic compté dans les statistiques de ${first}.`, { icon: ch === 'tel' ? 'phone' : 'sms', ms: 4200 }); };
  };

  /* Signalement (ouvert à tous, avec ou sans compte) */
  V.openReport = (id) => {
    const p = id ? V.byId(id) : null;
    const motifs = [['traite', 'Contrainte ou traite suspectée', 'Priorité absolue : profil masqué immédiatement à titre conservatoire', 'danger'], ['mineur', 'Personne qui semble mineure', 'Priorité absolue : profil masqué immédiatement', 'danger'], ['faux', 'Faux profil ou photos non conformes', 'Les photos ne correspondent pas à la personne'], ['arnaque', 'Arnaque', 'Demande d’argent, faux rendez-vous, chantage'], ['danger', 'Comportement dangereux', 'Violence, menaces, non-respect des limites'], ['autre', 'Autre', '']];
    const sh = V.sheet.open({
      title: p ? `Signaler · ${esc(p.name)}` : 'Signaler un problème',
      body: `<p class="ink2" style="margin-bottom:14px">Avec ou sans compte. Votre signalement est traité sous 24 h, immédiatement s’il est grave. En cas d’urgence, appelez le <b>117</b>.</p>
        <div class="stack" id="motifs">${motifs.map(([v, t, s, c]) => V.opt('motif', v, t, s, { cls: c || '' })).join('')}</div>
        <div style="margin-top:14px">${V.field('Ce qui s’est passé', { type: 'textarea', max: 800 })}</div>
        <label class="opt box" style="margin-top:12px"><input type="checkbox" name="cap"><span class="mark"></span><span class="t"><b>Joindre une capture d’écran</b><span>Facultatif · les métadonnées sont supprimées</span></span></label>
        <div style="margin-top:12px">${V.field('E-mail pour la réponse (facultatif)', { type: 'email' })}</div>`,
      foot: `${V.btn('Envoyer le signalement', { cls: 'sm block', attrs: 'data-send' })}`,
    });
    $('[data-send]', sh).onclick = async (e) => {
      const m = $('input[name="motif"]:checked', sh);
      if (!m) return V.toast('Choisissez un motif.', { icon: 'info' });
      const b = e.currentTarget; b.classList.add('loading');
      await V.wait(1100);
      const ref = 'VL-SIG-' + (1400 + Math.floor(Math.random() * 500));
      const grave = ['traite', 'mineur'].includes(m.value);
      V.L.reports++; V.save();
      $('.sh-body', sh).innerHTML = `<div class="success"><div class="ring">${I('check')}</div><h3 class="h3">Signalement reçu</h3><p class="muted" style="margin-top:8px">Référence <b class="num">${ref}</b>. ${grave ? 'Le profil est masqué à titre conservatoire et l’équipe est alertée immédiatement. Si nécessaire, la police est informée.' : 'Notre équipe le traite sous 24 h.'}</p><p class="hint">Merci. Les signalements ne sont jamais transmis à la personne concernée.</p></div>`;
      $('.sh-foot', sh).innerHTML = `<button class="btn sm block" data-close3><span class="roll"><span>Fermer</span><span aria-hidden="true">Fermer</span></span></button>`;
      $('[data-close3]', sh).onclick = () => V.sheet.close();
    };
  };

  /* =================================================================== STORIES (surcouche) */
  V.route(/^\/story\/([\w-]+)$/, (m) => {
    const p = V.byId(m[1]);
    if (!p || !V.visible(p)) { location.replace('#/'); return; }
    V.S.stSeen = V.S.stSeen || [];
    if (!V.S.stSeen.includes(p.id)) { V.S.stSeen.push(p.id); V.save(); }
    $$(`.st-item[href="#/story/${p.id}"]`).forEach((a) => a.classList.add('seen'));
    V.overlay.open('story', storyHTML(p), (ov) => storyAfter(ov, p));
  }, { overlay: true });
  function storyHTML(p) {
    const slides = slidesFor(p);
    return `<section class="story" role="dialog" aria-label="Story de ${esc(p.name)}">
      <div class="st-media">${slides.map((x, j) => `<img src="${x.src}" alt="" class="${j ? '' : 'on'}" style="object-position:${x.pos};${x.zoom ? `transform:scale(${x.zoom});transform-origin:${x.pos}` : ''}" draggable="false">`).join('')}</div>
      <div class="st-bars">${slides.map((_, j) => `<i class="${j ? '' : 'cur'}"><b></b></i>`).join('')}</div>
      <header class="st-head"><img src="${V.img(p.photos[0], 's')}" alt=""><div><b>${esc(p.name)}</b><span>${V.communeTxt(p.commune)} · ${V.agoTxt(V.statusOf(p).since)}</span></div><button class="icon-btn" data-act="close-ov" aria-label="Fermer">${I('x')}</button></header>
      <div class="st-tap"><button type="button" data-st="-1" aria-label="Photo précédente"></button><button type="button" data-st="1" aria-label="Photo suivante"></button></div>
      <footer class="st-foot">${V.statusPill(p)}${V.NOTES[p.id] ? `<p>« ${esc(V.NOTES[p.id])} »</p>` : ''}${V.btn('Voir la fiche', { href: '#/profil/' + p.id, cls: 'light sm', arrow: true, attrs: 'data-st-open' })}<span class="st-tag">Mise en avant · story de 24 h</span></footer>
    </section>`;
  }
  function storyAfter(ov, p) {
    const box = $('.story', ov), imgs = $$('.st-media img', ov), bars = $$('.st-bars i', ov);
    const order = V.STORIES.filter((id) => { const x = V.byId(id); return x && V.visible(x) && !V.hidden().includes(id); });
    let k = 0;
    const show = (n) => {
      k = n;
      imgs.forEach((im, j) => im.classList.toggle('on', j === k));
      bars.forEach((b, j) => { b.className = j < k ? 'done' : j === k ? 'cur' : ''; });
    };
    const go = (d) => {
      if (k + d < 0) return show(0);
      if (k + d < imgs.length) return show(k + d);
      const nx = order[order.indexOf(p.id) + 1];
      if (nx) location.replace('#/story/' + nx); else V.overlay.back();
    };
    bars.forEach((b) => b.firstElementChild.addEventListener('animationend', () => { if (b.classList.contains('cur')) go(1); }));
    ov.onclick = (e) => { const t = e.target.closest('[data-st]'); if (t) go(+t.dataset.st); };
    const tap = $('.st-tap', ov);
    tap.addEventListener('pointerdown', () => box.classList.add('paused'));
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => tap.addEventListener(ev, () => box.classList.remove('paused')));
    let y0 = null;
    box.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
    box.addEventListener('touchend', (e) => { if (y0 !== null && e.changedTouches[0].clientY - y0 > 110) V.overlay.back(); y0 = null; });
    // « Voir la fiche » remplace la story dans l'historique : le retour ramène à l'accueil
    $('[data-st-open]', ov).onclick = (e) => { e.preventDefault(); ov.classList.remove('on'); setTimeout(() => ov.remove(), 450); location.replace('#/profil/' + p.id); };
  }

  /* =================================================================== COMPARATEUR (surcouche) */
  V.route(/^\/comparer$/, () => {
    V.cmpOut = V.cmpOut || [];
    V.overlay.open('cmp', `<section class="cmp" role="dialog" aria-label="Comparateur"></section>`, (ov) => renderCmp(ov));
  }, { overlay: true });
  function renderCmp(ov) {
    const all = V.sel().map(V.byId).filter(Boolean);
    const pages = Math.max(1, Math.ceil(all.length / 6));
    V.cmpPage = Math.min(Math.max(0, V.cmpPage || 0), pages - 1);
    const list = all.slice(V.cmpPage * 6, V.cmpPage * 6 + 6);
    const box = $('.cmp', ov);
    const onlyDiff = V.cmpDiff !== false;
    const grp = V.cmpGrp || 'all';
    if (all.length < 2) {
      box.innerHTML = `<div class="cmp-head"><div class="row-b"><h2 class="h2">Comparer</h2><button class="icon-btn" data-act="close-ov" aria-label="Fermer">${I('x')}</button></div></div>
        <div class="cmp-empty">${V.empty('columns', 'Ajoutez au moins deux profils', 'Utilisez le cœur sur les cartes ou les fiches : votre sélection apparaît ici, prête à être comparée.', V.btn('Parcourir les profils', { href: '#/profils', arrow: true }))}</div>`;
      return;
    }
    const active = list.filter((p) => !V.cmpOut.includes(p.id));
    const svcU = [...new Set(list.flatMap((p) => p.services))];
    const rows = [
      ['ess', 'En bref', 'Disponibilité', (p) => V.statusInfo(p).label],
      ['ess', 'En bref', 'Langues', (p) => p.langs.map(([l, lv]) => `${V.LANGS[l]} ${lv}`).join(', ')],
      ['ess', 'En bref', 'Tarif de départ', (p) => (p.from ? `Dès ${p.from} CHF` : 'Non renseigné')],
      ['ess', 'En bref', 'Modalité', (p) => V.modeTxt(p.mode)],
      ['ess', 'En bref', 'Quartier', (p) => V.communeTxt(p.commune)],
      ['rdv', 'Rendez-vous', 'Horaires habituels', (p) => p.hours],
      ['rdv', 'Rendez-vous', 'Accepte', (p) => p.accepts.join(', ')],
      ['rdv', 'Rendez-vous', 'Consignes', (p) => p.rules],
      ['tar', 'Tarifs', '1 heure · reçoit', (p) => (p.rates[0][1] ? V.chf(p.rates[0][1]) : p.from ? 'non' : 'non renseigné')],
      ['tar', 'Tarifs', '1 heure · se déplace', (p) => (p.rates[0][2] ? V.chf(p.rates[0][2]) : p.from ? 'non' : 'non renseigné')],
      ['tar', 'Tarifs', '2 heures', (p) => (p.rates[1][1] || p.rates[1][2] ? V.chf(p.rates[1][1] || p.rates[1][2]) : 'non renseigné')],
      ['tar', 'Tarifs', 'Soirée (4 h)', (p) => (p.rates[2][1] ? V.chf(p.rates[2][1]) : 'non renseigné')],
      ['tar', 'Tarifs', 'Nuit', (p) => (p.rates[3][1] ? V.chf(p.rates[3][1]) : 'non renseigné')],
      ...CLIENTS.map(([k, l]) => ['rdv', 'Clientèle', l, (p) => CLV(p.clients && p.clients[k])]),
      ...svcU.map((s) => ['svc', 'Services', V.SERVICES[s], (p) => (p.services.includes(s) ? '<span class="yes">Oui</span>' : '<span class="no">non</span>')]),
      ['pro', 'Profil', 'Âge (vérifié)', (p) => V.ageTxt(p)],
      ['pro', 'Profil', 'Taille', (p) => p.attrs.Taille || 'non précisé'],
      ['pro', 'Profil', 'Silhouette', (p) => p.attrs.Silhouette || 'non précisé'],
      ['pro', 'Profil', 'Cheveux', (p) => p.attrs.Cheveux || 'non précisé'],
      ['pro', 'Profil', 'Yeux', (p) => p.attrs.Yeux || 'non précisé'],
      ['pro', 'Profil', 'Origine (déclarée)', (p) => p.origin],
      ['pro', 'Profil', 'Tabac', (p) => p.attrs.Tabac || 'non précisé'],
    ];
    let hiddenSame = 0;
    const body = rows.filter((r) => grp === 'all' || r[0] === grp).map((r) => {
      const vals = active.map((p) => String(r[3](p)));
      const same = vals.every((x) => x === vals[0]);
      if (onlyDiff && same) { hiddenSame++; return ''; }
      return `<tr class="${same ? 'same' : 'diff'}"><td class="crit">${r[2]}<small>${r[1]}</small></td>${list.map((p) => `<td class="${V.cmpOut.includes(p.id) ? 'out' : ''}">${r[3](p)}</td>`).join('')}</tr>`;
    }).join('');
    box.innerHTML = `<div class="cmp-head">
        <div class="row-b"><h2 class="h2">Comparer ${all.length} profils</h2><button class="icon-btn" data-act="close-ov" style="flex:none" aria-label="Fermer">${I('x')}</button></div>
        ${pages > 1 ? `<div class="cmp-pages"><button class="icon-btn" data-cmp-p="-1" aria-label="Page précédente" ${V.cmpPage ? '' : 'disabled'}>${I('chevron-left')}</button><span><b>${V.cmpPage * 6 + 1}–${V.cmpPage * 6 + list.length}</b> sur ${all.length} · page ${V.cmpPage + 1} / ${pages}</span><button class="icon-btn" data-cmp-p="1" aria-label="Page suivante" ${V.cmpPage < pages - 1 ? '' : 'disabled'}>${I('chevron-right')}</button><span class="xs muted">6 profils par page, toute la sélection est comparée</span></div>` : ''}
        <p class="muted small" style="margin-top:6px">Les critères identiques restent discrets. Chaque profil peut être écarté sans être supprimé de votre sélection.</p>
        <div class="cmp-tools"><label class="row small b" style="gap:10px"><span class="switch"><input type="checkbox" id="cmpDiff" ${onlyDiff ? 'checked' : ''}><span></span></span>Uniquement les différences</label>
        ${V.seg('cmpgrp', [['all', 'Tout'], ['ess', 'En bref'], ['rdv', 'Rendez-vous'], ['tar', 'Tarifs'], ['svc', 'Services'], ['pro', 'Profil']], grp, 'violet')}</div>
      </div>
      <div class="cmp-scroll"><table class="cmp-table"><thead><tr><th class="crit">Critère</th>${list.map((p) => `<th class="${V.cmpOut.includes(p.id) ? 'out' : ''}"><div class="cmp-col"><img src="${V.img(p.photos[0], 's')}" alt="" data-act="open" data-id="${p.id}" style="cursor:pointer"><b>${esc(p.name)}, ${V.ageShort(p)}</b>${V.statusPill(p, true)}<div class="row" style="gap:6px">${V.cmpOut.includes(p.id) ? `<button class="btn xs ghost" data-act="cmp-in" data-id="${p.id}"><span class="roll"><span>Réintégrer</span><span aria-hidden="true">Réintégrer</span></span></button>` : `<button class="btn xs ghost" data-act="cmp-out" data-id="${p.id}"><span class="roll"><span>Écarter</span><span aria-hidden="true">Écarter</span></span></button><button class="btn xs" data-act="contact" data-id="${p.id}" data-ch="${p.contacts[0]}"><span class="roll"><span>Contacter</span><span aria-hidden="true">Contacter</span></span></button>`}</div></div></th>`).join('')}</tr></thead>
      <tbody>${body}</tbody></table>
      ${hiddenSame ? `<p class="muted small" style="padding:16px">${hiddenSame} critère${hiddenSame > 1 ? 's' : ''} identique${hiddenSame > 1 ? 's' : ''} masqué${hiddenSame > 1 ? 's' : ''}. <button class="link" data-act="cmp-all">Tout afficher</button></p>` : ''}</div>`;
    V.ui.enhance(box);
    $('#cmpDiff', box).onchange = (e) => { V.cmpDiff = e.target.checked; renderCmp(ov); };
    $$('[data-cmp-p]', box).forEach((b) => { b.onclick = () => { V.cmpPage += +b.dataset.cmpP; renderCmp(ov); }; });
    $('[data-seg="cmpgrp"]', box).addEventListener('seg', (e) => { V.cmpGrp = e.detail; renderCmp(ov); });
  }
  V.renderCmp = () => { const ov = $('#ov-cmp'); if (ov) renderCmp(ov); };

  /* =================================================================== PROFILS MASQUÉS */
  V.route(/^\/masques$/, () => {
    const L = V.hidden().map(V.byId).filter(Boolean);
    return {
      title: 'Profils masqués',
      html: `<div class="wrap" style="max-width:820px"><div class="page-hero"><div class="eyebrow">Liste privée</div><h1 class="h1" style="margin-top:10px">Profils masqués</h1>
        <p class="lead">Masquer un profil ne le signale pas et ne le pénalise pas : vous ne le voyez simplement plus. ${V.L.account ? 'Cette liste est enregistrée dans votre compte.' : 'Cette liste s’efface à la fermeture du navigateur.'}</p></div>
        <div class="panel" style="margin-top:20px">${L.length ? `<div class="list-rows">${L.map((p) => `<div><img class="avatar sq lg" src="${V.img(p.photos[0], 's')}" alt=""><div class="sp"><b class="serif" style="font-size:21px;font-weight:400">${esc(p.name)}, ${V.ageShort(p)}</b><div class="small muted">${V.communeTxt(p.commune)}</div></div><button class="btn sm ghost" data-act="unhide" data-id="${p.id}"><span class="roll"><span>Rétablir</span><span aria-hidden="true">Rétablir</span></span></button></div>`).join('')}</div>` : V.empty('eye-off', 'Aucun profil masqué', 'Utilisez « Ne plus afficher » sur une carte pour retirer un profil de votre galerie.', V.btn('Retour aux profils', { href: '#/profils', cls: 'sm' }))}</div>
      </div>${V.footer()}`,
    };
  });

  /* =================================================================== VÉRIFICATIONS */
  V.route(/^\/verifications$/, () => ({
    title: 'Comment nous vérifions',
    html: `<div class="wrap"><div class="page-hero" style="max-width:860px"><div class="eyebrow">Vérifications</div><h1 class="h1" style="margin-top:12px">Comment nous vérifions</h1>
      <p class="lead">Aucun profil n’est publié « en attente de vérification ». Chaque contrôle est daté en fin de fiche, avec sa portée exacte. Nous vérifions un profil, pas ce qui se passe derrière une porte.</p></div>
      <div class="ctrl-list" style="margin-top:36px">
        ${[['Âge réel et identité', 'Pièce d’identité et selfie vivant chez un prestataire suisse spécialisé. L’âge affiché est calculé depuis la date de naissance : la personne ne peut pas le modifier. Nous ne gardons aucune copie de la pièce.', 'À l’inscription'],
          ['Concordance des photos', 'Un selfie de contrôle est comparé aux photos publiées. Chaque nouvelle photo passe en modération avant d’être en ligne, et ses métadonnées sont supprimées.', 'Tous les 90 jours'],
          ['Indépendance', 'Un entretien direct, en personne à Genève ou en visio, pour s’assurer que la personne travaille pour elle-même. Pour un duo ou un couple, chacune des deux personnes passe l’entretien.', 'Tous les 6 mois']].map(([t, d, f]) => `
        <div class="ctrl"><h3>${t}</h3><p>${d}</p><span class="when">${f}</span></div>`).join('')}
      </div>
      <div class="grid-2" style="margin-top:40px">
        <div class="panel gold"><h3>Ce que nous ne garantissons pas</h3><p class="ink2" style="margin-top:8px">Que la personne au rendez-vous soit celle du profil, ni le déroulement d’une rencontre. En cas de doute, signalez-le : un indice de risque déclenche un contrôle renforcé.</p><div style="margin-top:16px">${V.btn('Signaler un problème', { cls: 'sm dark', act: 'report' })}</div></div>
        <div class="panel soft"><h3>Ce qui déclenche un contrôle renforcé</h3><ul class="svc" style="margin-top:10px;grid-template-columns:1fr"><li>Le même numéro ou les mêmes photos sur plusieurs profils</li><li>Des photos retrouvées ailleurs sous un autre nom</li><li>Un tiers qui répond à la place de la personne</li><li>Une présence annoncée dans une autre ville</li></ul></div>
      </div>
      <section class="section-sm"><div class="eyebrow">Exemple : la fin de fiche d’Alma</div><div class="panel" style="margin-top:14px;max-width:760px">${(() => { const p = V.byId('alma'); const v = p.verif; return `<div class="row" style="margin-bottom:16px"><img class="avatar lg sq" src="${V.img('alma', 's')}" alt=""><b class="serif" style="font-size:24px;font-weight:400">Alma, 29 ans</b></div><div class="timeline"><div class="tl-i ok"><b>Âge réel et identité vérifiés</b><span>${D.fmtShort(D.addDays(v.id))} · prestataire suisse</span></div><div class="tl-i ok"><b>Indépendance confirmée en entretien</b><span>${D.fmtShort(D.addDays(v.indep))} · en personne, à Genève</span></div><div class="tl-i ok"><b>Médias concordants</b><span>${D.fmtShort(D.addDays(v.media))} · selfie de contrôle</span></div><div class="tl-i cur"><b>Prochain contrôle des photos</b><span>avant le ${D.fmtShort(D.addDays(v.media + 90))}</span></div></div>`; })()}</div></section>
    </div>${V.footer()}`,
  }));

  /* =================================================================== SÉCURITÉ */
  V.route(/^\/securite$/, () => ({
    title: 'Sécurité',
    html: `<div class="wrap"><div class="page-hero" style="max-width:860px"><div class="eyebrow">Sécurité</div><h1 class="h1" style="margin-top:12px">Signaler, avec ou sans compte</h1>
      <p class="lead">Cela prend une minute. Un signalement grave masque le profil tout de suite, le temps que l’équipe vérifie.</p></div>
      <div class="nums" style="margin-top:30px">
        ${[['117', 'Police, danger immédiat'], ['144', 'Urgences sanitaires'], ['Aspasie', 'Association genevoise de soutien aux travailleuses et travailleurs du sexe'], ['BTPI', 'Police genevoise, traite des êtres humains']].map(([n, t]) => `<div><b>${n}</b><span>${t}</span></div>`).join('')}
      </div>
      <div class="grid-2" style="margin-top:28px">
        <div class="panel"><h3>Faire un signalement</h3><p class="ink2" style="margin:8px 0 16px">Faux profil, personne qui semble mineure, contrainte, arnaque, comportement dangereux. Réponse sous 24 h, immédiate si c’est grave.</p>${V.btn('Signaler un problème', { act: 'report' })}<p class="hint">${V.L.reports ? `${V.L.reports} signalement${V.L.reports > 1 ? 's' : ''} envoyé${V.L.reports > 1 ? 's' : ''} depuis cet appareil.` : 'Aucun signalement envoyé depuis cet appareil.'}</p></div>
        <div class="panel ink"><h3>Discrétion par défaut</h3><ul class="svc" style="margin-top:10px;grid-template-columns:1fr">${['Aucun compte obligatoire pour naviguer', 'Sélection effacée à la fermeture du navigateur', 'Aucun traceur publicitaire, mesure d’audience sans cookie', 'Toutes les données hébergées en Suisse', 'Sortie rapide : deux fois la touche Échap'].map((x) => `<li style="border-color:rgba(255,255,255,.12)">${x}</li>`).join('')}</ul></div>
      </div>
      <section class="section-sm"><div class="grid-2">
        <div><div class="eyebrow">Pour les visiteurs</div><div style="margin-top:8px">${['Cherchez le numéro dans la recherche : s’il ne correspond à aucun profil vérifié, méfiez-vous.', 'Ne versez jamais d’acompte à quelqu’un que vous ne connaissez pas.', 'Les consignes et les limites indiquées sur la fiche ne se négocient pas sur place.'].map((t, k) => `<details class="acc"><summary>${['Vérifier un numéro', 'Arnaques à l’acompte', 'Consentement et limites'][k]}<span class="pm">${I('plus', 'sm')}</span></summary><div class="acc-b">${t}</div></details>`).join('')}</div></div>
        <div><div class="eyebrow">Pour les escortes</div><div style="margin-top:8px">${['Depuis l’espace pro, votre profil disparaît du site en moins d’une minute.', 'Vos photos sont filigranées, sans métadonnées, et nous les cherchons sur le web.', 'L’équipe peut vous mettre en contact avec Aspasie ou la police, sans que votre nom circule.'].map((t, k) => `<details class="acc"><summary>${['Masquage immédiat', 'Protection des photos', 'Être accompagnée'][k]}<span class="pm">${I('plus', 'sm')}</span></summary><div class="acc-b">${t}</div></details>`).join('')}</div></div>
      </div></section>
    </div>${V.footer()}`,
  }));

  /* =================================================================== NOUS REJOINDRE (tarifs) */
  /* Une formule = une ligne de la liste de prix (aussi utilisée dans l'espace pro) */
  V.planRow = (pl, o = {}) => `<div class="plan${o.cur === pl.id ? ' on' : ''}">
    <div><h3>${pl.name}</h3><p class="pitch">${pl.pitch}</p>${pl.reco && !o.cur ? '<span class="note">La plus équilibrée, à notre avis</span>' : ''}</div>
    <ul>${pl.feats.map((x) => `<li>${x}</li>`).join('')}</ul>
    <div class="pp"><div class="price"><b>${pl.price}</b><span>CHF / mois</span></div>${o.btn ? o.btn(pl) : ''}</div>
  </div>`;

  /* Nous rejoindre : contenu enrichi des offres (éléments clés en gras) */
  const PLAN_RICH = {
    essentiel: { ico: 'badge-check', feats: ['<b>Profil vérifié</b> : âge, identité, photos et indépendance', '<b>8 photos</b> filigranées', '<b>Statut express</b> en un geste', '<b>Statistiques</b> de base', '<b>Masquage immédiat</b> à tout moment'] },
    visibilite: { ico: 'trending', feats: ['<b>Tout Présence</b>, et en plus :', '<b>20 photos</b> et <b>1 vidéo</b> de présentation', '<b>6 crédits de mise en avant</b> offerts par mois', '<b>Statistiques détaillées</b> et conseils', 'Traduction relue en <b>5 langues</b>', '<b>Alertes</b> si vos photos apparaissent ailleurs'] },
    premium: { ico: 'star', feats: ['<b>Tout Visibilité</b>, et en plus :', '<b>18 crédits de mise en avant</b> offerts par mois', '<b>Shooting photo annuel offert</b> (valeur CHF 450)', '<b>Rédaction du profil</b> par notre équipe', 'Assistance WhatsApp <b>prioritaire 7 j/7</b>'] },
  };
  const planCard = (pl) => {
    const r = PLAN_RICH[pl.id] || { ico: 'check', feats: pl.feats };
    return `<article class="pc${pl.reco ? ' reco' : ''}">
      ${pl.reco ? `<span class="pc-tag">${I('flame', 'sm')}La plus choisie</span>` : ''}
      <div class="pc-top"><span class="pc-ic">${I(r.ico)}</span><h3>${pl.name}</h3><p>${pl.pitch}</p></div>
      <div class="pc-price"><b>${pl.price}</b><span>CHF<br>par mois</span></div>
      <p class="pc-offer">${I('gift', 'sm')}<span><b>2 mois offerts</b> avec le code LANCEMENT2M</span></p>
      <ul class="pc-feats">${r.feats.map((f) => `<li>${I('check', 'sm')}<span>${f}</span></li>`).join('')}</ul>
      <div class="pc-cta">${V.btn('Choisir ' + pl.name, { href: '#/pro/inscription/1?plan=' + pl.id, cls: (pl.reco ? 'gold' : 'dark') + ' block', arrow: true })}</div>
    </article>`;
  };
  V.route(/^\/rejoindre$/, () => {
    const L = vis();
    return {
      title: 'Nous rejoindre',
      html: `<section class="rj-hero"><div class="rj-bg" aria-hidden="true">${L.slice(0, 6).map((p) => `<img src="${V.img(p.photos[0], 's')}" alt="">`).join('')}</div><div class="wrap rj-in">
        <div class="eyebrow">Escortes indépendantes à Genève</div>
        <h1 class="rj-title">Vos tarifs. Votre agenda.<br><em>Zéro commission.</em></h1>
        <p class="lead rj-lead">Un forfait mensuel sans engagement, et c’est tout. Ce que vous gagnez avec vos clients ne nous regarde pas. <b>Deux mois offerts</b> au lancement, sans carte bancaire.</p>
        <div class="row wrapr" style="margin-top:28px">${V.L.reg ? V.btn('Reprendre mon brouillon', { href: '#/pro/inscription/1', cls: 'gold lg', arrow: true }) : V.btn('Commencer ma candidature', { href: '#/pro/inscription/1', cls: 'gold lg', arrow: true })}${V.btn('Voir les offres', { href: '#/rejoindre', act: 'scroll-tarifs', cls: 'ghost lg', attrs: WHITE_GHOST })}</div>
        <div class="rj-proof"><span class="avs">${L.slice(0, 5).map((p) => `<img src="${V.img(p.photos[0], 's')}" alt="">`).join('')}</span><span><b>${L.length} escortes vérifiées</b> sont déjà en ligne</span></div>
        <div class="rj-stats">${[['0 %', 'de commission sur vos rendez-vous'], ['2 mois', 'offerts au lancement'], ['24 h', 'pour être en ligne après vérification'], ['100 %', 'des données hébergées en Suisse']].map(([n, l]) => `<div><b>${n}</b><span>${l}</span></div>`).join('')}</div>
      </div></section>

      <section class="section"><div class="wrap">
        <div class="sec-head"><div>${H2('Ce que BD fait pour vous')}<p class="sec-note">Tout ce qu’il faut pour être trouvée, contactée et protégée.</p></div></div>
        <div class="rj-why">${[
          ['grid', 'Une galerie sans page 12', 'Pas de pagination, un ordre stable et des <b>filtres précis</b> : quelqu’un qui cherche une escorte parlant portugais à Carouge vous trouve.'],
          ['zap', 'Le statut en un geste', '<b>« Disponible maintenant »</b> ou « ce soir à 21 h », depuis l’écran d’accueil du téléphone. Il expire seul au bout de trois heures.'],
          ['eye-off', 'Masquée en moins d’une minute', 'Depuis l’espace pro, à tout moment. Photos <b>filigranées et surveillées</b> sur le web ; votre adresse n’apparaît jamais.'],
          ['chart', 'Des chiffres lisibles', 'Vues, ajouts en sélection, <b>clics par canal de contact</b>, comparés à la moyenne de votre catégorie.'],
          ['heart', 'Suivie, sans compteur public', 'Vos clients peuvent vous <b>suivre</b> et sont prévenus de vos nouveaux statuts. Aucun avis ni chiffre public : les retours restent privés.'],
          ['shield', 'Vérifiée, donc crédible', 'Âge, identité et photos <b>contrôlés</b> : le badge vérifié rassure et fait la différence dans la galerie.'],
        ].map(([ic, t, d]) => `<article class="rj-card"><span class="rj-ic">${I(ic)}</span><h3>${t}</h3><p>${d}</p></article>`).join('')}</div>
      </div></section>

      <section class="section-sm" id="tarifs"><div class="wrap">
        <div class="sec-head" style="flex-wrap:wrap"><div><div class="eyebrow">CHF par mois, sans engagement</div><h2 class="h2" style="margin-top:10px">Nos offres</h2></div>
          <p class="offer-line">${I('gift', 'sm')} <b>Deux mois offerts</b> avec le code LANCEMENT2M, sans carte bancaire.</p></div>
        <div class="pcs">${V.PLANS.map(planCard).join('')}</div>
        <article class="pc-duo"><span class="pc-ic">${I('users')}</span><div class="sp"><h3>Duo ou couple</h3><p>${V.PLAN_DUO.note} <b>Les deux personnes sont vérifiées</b> et chacune garde son profil individuel.</p></div><div class="pc-price sm"><b>${V.PLAN_DUO.price}</b><span>CHF<br>par mois</span></div>${V.btn('Créer un duo', { href: '#/pro/duo', cls: 'ghost', arrow: true })}</article>
        <h3 class="h3" style="margin:44px 0 14px">Options à l’unité</h3>
        <div class="rj-addons">${V.ADDONS.map((a) => `<article class="rj-addon${a.soon ? ' soon' : ''}"><span class="rj-ic">${I(a.ico || 'plus')}</span><div><b>${a.name}</b><span class="p">${a.price} <small>${a.unit}</small></span><p>${a.desc}</p></div></article>`).join('')}</div>
      </div></section>

      <section class="section"><div class="wrap">
        <div class="sec-head"><div>${H2('En ligne en trois étapes')}<p class="sec-note">Comptez cinq minutes pour la candidature, le reste est fait pour vous.</p></div></div>
        <ol class="rj-steps">${[['Votre candidature', 'Prénom de travail, photos, tarifs et disponibilités. <b>5 minutes</b>, depuis votre téléphone.'], ['La vérification', 'Pièce d’identité et <b>selfie vivant</b> chez un prestataire suisse, puis un court entretien avec notre équipe.'], ['Vous êtes en ligne', 'Votre profil apparaît dans la galerie avec le <b>badge vérifié</b>. Vous gérez tout depuis l’espace pro.']].map(([t, d], k) => `<li><span class="rj-n">${k + 1}</span><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol>
      </div></section>

      <section class="section"><div class="wrap" style="max-width:860px">
        <h2 class="h2">Questions fréquentes</h2><div style="margin-top:18px">
        ${[['Prenez-vous une commission sur mes rendez-vous ?', 'Non, jamais. Vous payez un forfait mensuel et, si vous le voulez, des options. Vos rendez-vous, vos tarifs et vos clients ne regardent que vous.'],
          ['Mes absences sont-elles facturées ?', 'Oui. L’abonnement continue pendant une absence : votre profil reste visible avec « De retour le … », ou masqué si vous préférez. Pour arrêter de payer, vous résiliez en un clic, avec effet à la fin du mois en cours.'],
          ['Mon âge est-il affiché ?', 'Oui, votre âge réel, issu de la vérification d’identité. Vous ne pouvez pas le modifier, et il change à votre anniversaire. C’est ce qui rend le filtre d’âge fiable.'],
          ['Dois-je indiquer mon origine ?', 'Non. C’est facultatif, vous choisissez la mention et vous pouvez la retirer quand vous voulez.'],
          ['Où sont stockées mes données ?', 'En Suisse, sans exception. Votre pièce d’identité reste chez le prestataire de vérification : nous ne gardons que le résultat et votre date de naissance.'],
          ['Puis-je proposer un duo ?', 'Oui. Vous invitez votre partenaire depuis l’espace pro, elle accepte, et vos deux profils sont liés. Chacune est vérifiée.']].map(([t, d]) => `<details class="acc"><summary>${t}<span class="pm">${I('plus', 'sm')}</span></summary><div class="acc-b">${d}</div></details>`).join('')}
        </div><div style="margin-top:30px">${V.btn('Commencer ma candidature', { href: '#/pro/inscription/1', arrow: true, cls: 'gold lg' })}</div>
      </div></section>${V.footer()}`,
    };
  });

  /* =================================================================== PAGE COMMUNE OU QUARTIER (SEO) */
  V.route(/^\/geneve\/([\w-]+)$/, (m) => {
    const com = V.COMMUNES_GE.find((x) => x.id === m[1]);
    const c = com || V.COMMUNES.find((x) => x.id === m[1]) || V.COMMUNES_GE[0];
    const L = vis().filter((p) => (com ? V.communeOf(p) === c.id : p.commune === c.id));
    const near = vis().filter((p) => !L.includes(p) && p.mode !== 'incall').slice(0, 4);
    const quartiers = c.id === 'geneve' ? V.COMMUNES.filter((x) => x.c === 'geneve') : [];
    const n = L.length;
    return {
      title: `Profils vérifiés · ${c.label}`,
      html: `<div class="wrap"><div class="page-hero">${com ? `<img class="c-hero" src="img/armoiries/${c.id}.webp" alt="Armoiries de ${c.label}" width="96" height="112">` : `<span class="q-hero">${I('q-' + c.id)}</span>`}<div class="eyebrow">${com ? 'Canton de Genève' : 'Ville de Genève'} · ${c.label}</div><h1 class="h1" style="margin-top:10px">Profils vérifiés à ${c.label}</h1>
        <p class="lead">${n ? `${n} profil${n > 1 ? 's' : ''} vérifié${n > 1 ? 's' : ''} à ${c.label}. Disponibilités déclarées et horodatées, contacts directs, aucun intermédiaire.` : `Personne ne reçoit à ${c.label} pour le moment. Les escortes ci-dessous se déplacent dans tout le canton.`}</p></div>
        ${quartiers.length ? `<div class="communes" style="margin-top:22px">${quartiers.map((x) => `<a class="commune" href="#/geneve/${x.id}">${x.label}<small>${vis().filter((p) => p.commune === x.id).length}</small></a>`).join('')}</div>` : ''}
        ${n ? `<div class="gallery" style="margin-top:24px">${L.map((p, k) => V.card(p, { i: k })).join('')}</div>` : ''}
        ${near.length ? `<h2 class="h3" style="margin:40px 0 14px">Se déplacent aussi à ${c.label}</h2><div class="rail">${near.map((p, k) => V.card(p, { i: k, noHide: true })).join('')}</div>` : ''}
        <h2 class="h3" style="margin:44px 0 14px">Les autres communes</h2>
        <div class="c-tiles">${communeTiles(c.id)}</div>
      </div>${V.footer()}`,
    };
  });

  /* =================================================================== PAGES LÉGALES */
  const LEGAL = {
    'cg-visiteurs': ['Conditions d’utilisation · visiteurs', ['Accès réservé aux personnes majeures. L’avertissement d’âge doit être confirmé à l’entrée.', 'BD met en relation des adultes. Les contacts se font directement entre le visiteur et la personne, hors plateforme.', 'Le respect des consignes, des limites et du consentement est une condition d’utilisation. Tout manquement peut être signalé et entraîner une suspension.', 'Droit suisse applicable, for à Genève.']],
    'cg-escortes': ['Conditions d’utilisation · escortes', ['Publication réservée aux personnes majeures, vérifiées et indépendantes.', 'Le modèle repose exclusivement sur des forfaits : aucune commission, aucun pourcentage sur les rendez-vous.', 'L’abonnement est mensuel, sans engagement, et continue pendant les absences. La résiliation prend effet à la fin de la période en cours.', 'Le consentement à la publication de chaque photo et de chaque information est révocable à tout moment.']],
    confidentialite: ['Politique de confidentialité', ['Données hébergées en Suisse. Traitement conforme à la nLPD ; analyse d’impact réalisée avant l’ouverture.', 'Visiteurs : aucune donnée obligatoire. La sélection anonyme s’efface à la fermeture du navigateur.', 'Escortes : la pièce d’identité reste chez le prestataire de vérification ; seuls le résultat et la date de naissance sont conservés.', 'Droits d’accès, de rectification et d’effacement en libre-service. Effacement effectif sous 30 jours.']],
    contenu: ['Politique de contenu', ['Photos suggestives autorisées, contenu pornographique interdit.', 'Aucune nudité explicite dans les zones publiques ou indexées.', 'Catalogue fermé de services, sans texte libre sur les pratiques.', 'Toute nouvelle photo est modérée avant publication.']],
    mentions: ['Mentions légales', ['BD, maquette de démonstration, profils fictifs.', 'Éditeur : à compléter (société, adresse à Genève, numéro IDE).', 'Hébergement : prestataire suisse, à confirmer.', 'Réalisation : Digistylze, Genève.']],
  };
  V.route(/^\/legal\/([\w-]+)$/, (m) => {
    const [t, items] = LEGAL[m[1]] || LEGAL.mentions;
    return { title: t, html: `<div class="wrap" style="max-width:820px"><div class="page-hero"><div class="eyebrow">Informations légales · version de démonstration</div><h1 class="h2" style="margin-top:10px">${t}</h1></div><div class="panel" style="margin-top:20px"><ol style="list-style:decimal;padding-left:20px" class="stack">${items.map((x) => `<li class="ink2">${x}</li>`).join('')}</ol><p class="hint" style="margin-top:20px">Textes définitifs à rédiger par un avocat genevois (question ouverte Q15 du cahier des charges).</p></div></div>${V.footer()}` };
  });

  /* =================================================================== INDISPONIBLE / 404 */
  V.route(/^\/indisponible$/, () => ({
    title: 'Profil indisponible',
    html: `<div class="wrap" style="max-width:760px"><div class="page-hero">${V.empty('eye-off', 'Ce profil n’est plus en ligne', 'La personne a masqué ou supprimé son profil. Aucune information n’est conservée ici.', V.btn('Voir des profils similaires', { href: '#/profils?dispo=now', arrow: true }))}</div></div>`,
  }));
  V.route(/^.*$/, () => ({ title: 'Page introuvable', html: `<div class="wrap" style="max-width:760px"><div class="page-hero">${V.empty('search', 'Page introuvable', 'Le lien est peut-être incomplet.', V.btn('Retour à l’accueil', { href: '#/' }))}</div></div>` }), { notFound: true });
})(window.V);
