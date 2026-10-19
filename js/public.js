/* Velours : écrans publics */
(function (V) {
  'use strict';
  const { $, $$, i: I, esc } = V;
  const D = V.date;
  const P = V.PROFILES;
  const vis = () => P.filter((p) => V.visible(p) && !V.hidden().includes(p.id));

  /* =================================================================== ACCUEIL */
  /* Briques de l'accueil */
  const storyItem = (p) => `<a class="st-item${(V.S.stSeen || []).includes(p.id) ? ' seen' : ''}" href="#/story/${p.id}"><span class="st-ph"><img src="${V.img(p.photos[0], 's')}" alt="" loading="lazy" draggable="false"></span><b>${esc(p.name)}</b><span>${V.communeTxt(p.commune)}</span></a>`;
  const statusCard = (p) => `<article class="s-card"><div class="ph protect" data-act="open" data-id="${p.id}"><img src="${V.img(p.photos[0], 's')}" alt="Photo de ${esc(p.name)}" loading="lazy" draggable="false">${V.statusPill(p, false, true)}<span class="ago">${V.agoTxt(V.statusOf(p).since)}</span></div><div class="nm">${esc(p.name)} <span>${V.ageShort(p)}</span></div><div class="where">${V.communeTxt(p.commune)}</div>${V.NOTES[p.id] ? `<p class="note">« ${esc(V.NOTES[p.id])} »</p>` : ''}</article>`;
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
  const communeMarquee = () => {
    const list = communeList(); const half = Math.ceil(list.length / 2);
    const row = (part, dir) => `<div class="c-row" data-dir="${dir}"><div class="c-track">${part.map((c) => communeTile(c)).join('')}${part.map((c) => communeTile(c, true)).join('')}</div></div>`;
    return `<div class="c-marq rv" data-marq>${row(list.slice(0, half), 1)}${row(list.slice(half), -1)}</div>`;
  };
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
      tween(u, Math.min(1480, Math.max(1120, +u.dataset.val + Math.round(Math.random() * 60 - 26))));
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
    return {
      title: 'Accueil',
      html: `
      <section class="hero3" aria-label="Accueil">
        ${profileWall(L)}
        <div class="h3-shade"></div>
        <div class="wrap h3-in">
          <div class="h2-live"><i class="dot-live"></i>Annonces d’escortes à Genève</div>
          <h1 class="h2-title">Escortes indépendantes vérifiées à Genève</h1>
          <p class="h2-sub">Des femmes, des hommes et des couples qui reçoivent ou se déplacent à Genève. Photos contrôlées et contact direct, sans compte.</p>
          <div class="h2-cta">${V.btn('Voir les profils en ligne', { href: '#/profils?dispo=now', cls: 'gold lg', arrow: true })}${V.btn('Je suis escorte', { href: '#/rejoindre', cls: 'ghost lg d-only', attrs: WHITE_GHOST })}<a class="h3-pro m-only" href="#/rejoindre">Vous êtes escorte ? Créer votre profil</a></div>
          <div class="h2-stats">
            <div class="h2-stat"><span class="avs">${nowList.slice(0, 4).map((p) => `<img src="${V.img(p.photos[0], 's')}" alt="">`).join('')}</span><span><b data-count="18">18</b><small>modèles en ligne</small></span></div>
            <div class="h2-stat"><i class="dot-live"></i><span><b data-count="1284">1’284</b><small>visiteurs en ligne</small></span></div>
          </div>
        </div>
      </section>

      <section class="stories" aria-label="Stories"><div class="wrap"><div class="st-rail">${stories.map(storyItem).join('')}</div></div></section>

      <section class="section-sm"><div class="wrap">
        <div class="sec-head"><div>${H2('Derniers statuts')}<p class="sec-note">Ce que les escortes ont publié ces dernières heures.</p></div><a class="link d-only" href="#/profils?tri=dispo">Tout voir</a></div>
        ${V.carousel(recent.map(statusCard).join(''))}
      </div></section>

      <section class="section-sm"><div class="wrap">
        <div class="sec-head"><div>${H2('Par commune')}<p class="sec-note">Les 45 communes du canton, à faire glisser. Chaque profil indique où il reçoit, jamais l’adresse.</p></div></div>
        ${communeMarquee()}
      </div></section>

      <div class="stack-wrap">
        <div class="stack"><section class="hero" id="hero" data-i="0">
          <div class="slide cur" data-act="open" data-id="${f0.id}"><img src="${V.img(f0.photos[0])}" alt="${esc(f0.name)}" class="protect" draggable="false"></div>
          <div class="slide next" data-act="hero-next"><img src="${V.img(f1.photos[0])}" alt="" draggable="false"></div>
          <div class="shade"></div>
          <div class="top"><div><div class="eyebrow">À la une · mise en avant</div><div class="small" style="color:#e2dae6;margin-top:6px" id="heroSt">${V.statusInfo(f0).label}</div></div></div>
          <h2 class="name" id="heroName"><small id="heroSub">${V.communeTxt(f0.commune)} · ${V.ageTxt(f0)}</small><span>${esc(f0.name)}</span></h2>
          <div class="cta">${V.btn('Voir la fiche', { act: 'hero-open', cls: 'light', arrow: true })}${V.btn(`Disponibles maintenant · ${nowList.length}`, { href: '#/profils?dispo=now', cls: 'ghost', attrs: WHITE_GHOST })}</div>
          <div class="prog">${feats.map((_, k) => `<i class="${k === 0 ? 'on' : ''}"></i>`).join('')}</div>
        </section></div>
        <div class="stack-gap" aria-hidden="true"></div>
        <section class="over section"><div class="wrap">
          <div class="sec-head"><div>${H2('Derniers contrôles')}<p class="sec-note">Ce que l’équipe a vérifié récemment, profil par profil.</p></div><a class="link d-only" href="#/verifications">Nos vérifications</a></div>
          ${V.carousel(controls(L, 9).map(ctrlCard).join(''), 'wide')}
        </div></section>
      </div>

      <section class="section-sm"><div class="wrap">
        <div class="sec-head"><div>${H2('Nouvelles arrivées')}<p class="sec-note">Inscrites depuis moins de quatorze jours.</p></div><a class="link d-only" href="#/profils?tri=new">Tout voir</a></div>
        ${V.carousel(news.map((p, k) => V.card(p, { i: k, noHide: true })).join(''))}
      </div></section>

      <section class="section-sm"><div class="wrap">
        <div class="sec-head"><div>${H2('Partenaires')}<p class="sec-note">Emplacements de démonstration : un encart sur l’accueil, au forfait mensuel.</p></div><a class="link d-only" href="#/rejoindre">Devenir partenaire</a></div>
        <div class="partners rv-st">${[['Hôtel partenaire', 'Chambres à la journée, entrée discrète'], ['Studio photo', 'Séances pour profils vérifiés'], ['Prévention et santé', 'Dépistage anonyme et conseils'], ['Emplacement libre', 'Votre encart ici']].map(([t, d]) => `<a class="partner" href="#/rejoindre"><b>${t}</b><span>${d}</span></a>`).join('')}</div>
      </div></section>

      <section class="section-sm"><div class="wrap">
        ${V.seg('seo', [['desc', 'Description'], ['faq', 'Questions']], 'desc')}
        <div class="seo-pane on" data-pane="desc"><div class="seo-text">
          <h3>Velours, escortes indépendantes à Genève</h3>
          <p>Velours réunit des escortes indépendantes qui travaillent à Genève. Les couples et les duos ont leur propre catégorie. Chaque profil est vérifié avant sa mise en ligne. L’âge affiché est l’âge réel, lu sur la pièce d’identité, et les photos sont comparées à un selfie de contrôle tous les 90 jours.</p>
          <h3>Par commune, jamais par adresse</h3>
          <p>Les profils sont classés par commune et, en ville, par quartier : des <a class="link" href="#/geneve/paquis">Pâquis</a> à <a class="link" href="#/geneve/carouge">Carouge</a>, en passant par les <a class="link" href="#/geneve/eaux-vives">Eaux-Vives</a> et <a class="link" href="#/geneve/champel">Champel</a>. La fiche dit si la personne reçoit ou se déplace. Elle ne donne jamais d’adresse.</p>
          <h3>Un contact direct</h3>
          <p>Vous écrivez ou vous appelez directement, sur les canaux que la personne accepte. Velours ne lit pas les échanges et ne prend rien sur les rendez-vous : les escortes paient un abonnement fixe.</p>
          <h3>Ce que nous ne faisons pas</h3>
          <p>Velours ne réserve pas à votre place et ne note pas les personnes. Un doute sur un profil ? Le lien « Signaler » est sur chaque fiche, avec ou sans compte.</p>
          <h3>Discret par défaut</h3>
          <p>Pas besoin de compte pour regarder. La sélection faite avec le cœur s’efface à la fermeture du navigateur ; un compte discret, avec un pseudonyme, permet de la garder d’un appareil à l’autre.</p>
        </div></div>
        <div class="seo-pane" data-pane="faq"><div style="max-width:860px">
          ${[['Les photos sont-elles récentes ?', 'Elles sont comparées à un selfie de contrôle au moins tous les 90 jours. La date du dernier contrôle est en bas de chaque fiche.'],
            ['Faut-il créer un compte ?', 'Non. Un compte sert seulement à garder votre sélection d’un appareil à l’autre et à recevoir des alertes de retour.'],
            ['Comment savoir si quelqu’un est libre ?', 'Le statut est déclaré par la personne et horodaté. Sans mise à jour, il s’efface au bout de trois heures.'],
            ['Velours prend-il une commission ?', 'Non. Les escortes paient un abonnement fixe ; ce qu’elles gagnent ne passe pas par nous.'],
            ['Que faire en cas de problème ?', 'Signalez-le depuis la fiche. Un signalement grave masque le profil tout de suite. En cas d’urgence, appelez le 117.']].map(([t, d]) => `<details class="acc"><summary>${t}<span class="pm">${I('plus', 'sm')}</span></summary><div class="acc-b">${d}</div></details>`).join('')}
        </div></div>
      </div></section>
      ${V.footer()}`,
      after: (v) => {
        heroLoop(v, feats);
        liveCounters(v);
        V.ui.marquees(v);
        $('[data-seg="seo"]', v).addEventListener('seg', (e) => $$('.seo-pane', v).forEach((x) => x.classList.toggle('on', x.dataset.pane === e.detail)));
      },
    };
  });

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

  V.footer = () => `<footer class="footer"><div class="wrap">
    <div class="cols">
      <div class="f-brand">${V.ui.brand()}<p>Velours met en relation des adultes à Genève. Les profils sont vérifiés, les contacts se font directement, sans intermédiaire ni commission.</p>
        <div class="f-langs">${['Français', 'English', 'Español', 'Português', 'Русский'].map((l, k) => `<button type="button" class="${k ? '' : 'on'}" data-act="lang">${l}</button>`).join('')}</div>
        <div class="row">${V.btn('Créer mon profil', { href: '#/pro/inscription/1', cls: 'gold sm', arrow: true })}${V.btn('Espace pro', { href: '#/pro', cls: 'ghost sm', attrs: WHITE_GHOST })}</div></div>
      <div><h5>Liens rapides</h5><ul><li><a href="#/profils">Tous les profils</a></li><li><a href="#/profils?dispo=now">Disponibles maintenant</a></li><li><a href="#/profils?tri=new">Nouvelles arrivées</a></li><li><a href="#/profils?cat=duo">Couples et duos</a></li><li><a href="#/masques">Profils masqués</a></li></ul></div>
      <div><h5>Quartiers</h5><ul>${V.COMMUNES.slice(0, 6).map((c) => `<li><a href="#/geneve/${c.id}">${c.label}</a></li>`).join('')}</ul></div>
      <div><h5>À propos</h5><ul><li><a href="#/verifications">Comment nous vérifions</a></li><li><a href="#/securite">Sécurité et signalement</a></li><li><a href="#/rejoindre">Nous rejoindre</a></li><li><a href="#/legal/cg-visiteurs">Conditions d’utilisation</a></li><li><a href="#/legal/confidentialite">Confidentialité</a></li><li><a href="#/legal/mentions">Mentions légales</a></li></ul></div>
    </div>
    <div class="legal"><span>© ${new Date().getFullYear()} Velours (nom de travail) · maquette, profils fictifs</span><span class="swiss"><i></i>Données hébergées en Suisse</span><span>Police 117 · Urgences 144</span></div>
  </div></footer>`;

  /* =================================================================== GALERIE */
  const FKEYS = ['cat', 'dispo', 'lang', 'mode', 'svc', 'commune', 'origin', 'hair', 'sil', 'acc', 'age', 'prix', 'nosmoke', 'recent', 'video', 'face', 'q', 'tri', 'chg'];
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
    if (has(q.age)) { const [a, b] = q.age.split('-').map(Number); L = L.filter((p) => { const ag = Array.isArray(p.age) ? Math.min(...p.age) : p.age; return ag >= a && ag <= b; }); }
    if (has(q.prix)) { const [a, b] = q.prix.split('-').map(Number); L = L.filter((p) => p.from >= a && (b >= 1000 || p.from <= b)); }
    if (q.nosmoke) L = L.filter((p) => p.attrs.Tabac === 'Non');
    if (q.recent) L = L.filter((p) => p.photosRecent || -p.verif.media <= 30);
    if (q.video) L = L.filter((p) => p.video);
    if (q.face) L = L.filter((p) => !p.faceHidden);
    if (has(q.q)) { const s = q.q.toLowerCase().replace(/\s/g, ''); L = L.filter((p) => p.name.toLowerCase().includes(s) || p.tel.replace(/\s|•/g, '').includes(s.replace(/^0/, '+41'))); }
    if (q.chg) { const c = V.S.chg; const ids = [...c.arrive, ...c.dispo, ...c.upd]; L = L.filter((p) => ids.includes(p.id)); }
    const tri = q.tri || 'maj';
    const idx = (p) => P.indexOf(p);
    const sorters = {
      maj: (a, b) => ((b.isUpd ? 1 : 0) + (b.isNew ? 1 : 0)) - ((a.isUpd ? 1 : 0) + (a.isNew ? 1 : 0)) || idx(a) - idx(b),
      dispo: (a, b) => V.statusRank[V.statusOf(a).t] - V.statusRank[V.statusOf(b).t] || V.statusOf(b).since - V.statusOf(a).since,
      new: (a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || b.verif.id - a.verif.id,
      'prix-asc': (a, b) => a.from - b.from, 'prix-desc': (a, b) => b.from - a.from,
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
    const inList = new Set(list.map((p) => p.id));
    return known.filter((id) => inList.has(id)).map(V.byId);
  };
  const activeCount = (q) => FKEYS.filter((k) => !['cat', 'tri', 'q', 'chg'].includes(k) && q[k]).length;
  const DISPO = [['all', 'Toutes'], ['now', 'Disponibles maintenant'], ['today', 'Aujourd’hui'], ['tomorrow', 'Demain'], ['request', 'Sur demande']];
  const TRI = [['maj', 'Mis à jour récemment'], ['dispo', 'Disponibles d’abord'], ['new', 'Nouvelles arrivées'], ['prix-asc', 'Tarif croissant'], ['prix-desc', 'Tarif décroissant'], ['age', 'Âge']];
  const LANGQ = ['fr', 'en', 'es', 'pt', 'ru', 'it', 'de', 'ar'];

  V.route(/^\/profils$/, (m, q) => {
    const L0 = V.filterList(q);
    const L = q.chg ? L0 : stableOrder(q, L0);
    V.lastOrder = L.map((p) => p.id);
    const catLbl = (V.CATS.find((c) => c.id === (q.cat || 'all')) || V.CATS[0]).label;
    const ac = activeCount(q);
    const chipsActive = pillsFor(q);
    return {
      title: 'Profils', keepScroll: true,
      html: `<div class="wrap">
        <div class="g-head"><div class="eyebrow">Genève · ${P.filter((p) => V.visible(p)).length} profils vérifiés</div>
          <h1 style="margin-top:10px">${q.cat && q.cat !== 'all' ? `${catLbl}, à Genève.` : q.dispo === 'now' ? 'Disponibles, maintenant.' : 'Les profils, dès l’ouverture.'}</h1></div>
        <div class="g-tools" id="gTools">
          ${V.seg('cat', V.CATS.map((c) => [c.id, c.label]), q.cat || 'all')}
          <div class="row2"><div class="chips scroll">
            <button class="chip filter${ac ? ' has' : ''}" data-act="filters">${I('filter', 'sm')}Filtres${ac ? ` · ${ac}` : ''}</button>
            <button class="chip filter${q.q ? ' has' : ''}" data-act="search">${I('search', 'sm')}${q.q ? esc(q.q) : 'Nom ou numéro'}</button>
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
            <div class="row-b" style="margin-bottom:14px"><span class="g-count" id="gCount">${L.length} profil${L.length > 1 ? 's' : ''}</span><a class="txt-btn" href="#/masques">${I('eye-off', 'sm')}Masqués (${V.hidden().length})</a></div>
            ${L.length ? '<div class="gallery" id="gallery"></div><div class="sentinel" id="sentinel"></div><div class="load-more" id="loadMore"></div>' : V.empty('search', 'Aucun profil ne correspond', 'Élargissez votre recherche : retirez un filtre pour voir plus de profils.', `<div class="chips" style="justify-content:center">${pillsFor(q)}</div>`)}
          </div>
          <aside class="aside-session"><div class="session-box" data-live></div></aside>
        </div>
      </div>${V.footer()}`,
      after: (v) => {
        V.ui.newsBanner();
        V.ui.renderSession();
        $('[data-seg="cat"]', v).addEventListener('seg', (e) => setQ({ cat: e.detail === 'all' ? '' : e.detail }));
        if (L.length) infinite(v, L);
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

  function infinite(v, L) {
    const g = $('#gallery', v); const sent = $('#sentinel', v); const more = $('#loadMore', v);
    let n = 0;
    const chg = !!V.parse().q.chg;
    const batch = () => {
      const chunk = L.slice(n, n + 8);
      let html = '';
      // la mise en avant agrandit la carte du profil à sa place (MEA-01), au plus une par lot de 8, seulement si elle correspond aux filtres
      let featInBatch = 0;
      chunk.forEach((p, k) => { const feat = p.feat && !chg && featInBatch < 1; if (feat) featInBatch++; html += V.card(p, { i: k, feat }); });
      g.insertAdjacentHTML('beforeend', html);
      n += chunk.length;
      more.innerHTML = n < L.length ? '' : `<span class="muted small">${L.length} profils · fin de la liste</span>`;
    };
    batch();
    V.ui.refreshCount = () => { const c = $('#gCount'); if (c) { const k = $$('#gallery .card:not(.feat):not(.out)').length; c.textContent = `${k} profil${k > 1 ? 's' : ''}`; } };
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
      ${grp('prix', 'Tarif de départ', V.rangeHTML('prix', 200, 1000, p0, p1, ' CHF', { step: 50, gap: 50, plus: 1 }))}
      ${grp('lang', 'Langues parlées', `<div class="chips">${LANGQ.map((l) => ch('lang', l, V.LANGS[l])).join('')}</div>`)}
      ${grp('origin', 'Origine (déclarée par la personne)', `<div class="chips">${V.ORIGINS.filter((o) => o !== 'Non précisée').map((o) => ch('origin', o, o)).join('')}</div><p class="hint">Information facultative, renseignée uniquement par les personnes qui le souhaitent.</p>`)}
      ${grp('svc', 'Services', `<div class="chips">${Object.entries(V.SERVICES).map(([k, l]) => ch('svc', k, l)).join('')}</div>`)}
      ${grp('phys', 'Physique', `<p class="small b" style="margin-bottom:8px">Cheveux</p><div class="chips">${['blond', 'brun', 'noir', 'roux', 'châtain'].map((h) => ch('hair', h, h[0].toUpperCase() + h.slice(1))).join('')}</div><p class="small b" style="margin:14px 0 8px">Silhouette</p><div class="chips">${['mince', 'sportive', 'normale', 'pulpeuse', 'petite'].map((h) => ch('sil', h, h[0].toUpperCase() + h.slice(1))).join('')}</div>`)}
      ${grp('acc', 'Accepte', `<div class="chips">${['Hommes', 'Femmes', 'Couples'].map((a) => ch('acc', a, a)).join('')}</div>`)}
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
    const sh = V.sheet.open({ title: 'Rechercher', body: `${V.field('Pseudo ou numéro de téléphone', { name: 'q', attrs: 'autocomplete="off" inputmode="search"' })}<p class="hint">Vérifiez qu’un numéro reçu appartient bien à un profil vérifié. Exemple : 079 412.</p><div class="list-rows" id="sres" style="margin-top:10px"></div>` });
    const inp = $('input', sh); setTimeout(() => inp.focus(), 300);
    const run = () => {
      const s = inp.value.trim();
      const res = s ? V.filterList({ q: s }, P.filter(V.visible)) : [];
      $('#sres', sh).innerHTML = s ? (res.length ? res.map((p) => `<div style="cursor:pointer" data-act="open" data-id="${p.id}"><img class="avatar sq" src="${V.img(p.photos[0], 's')}" alt=""><div class="sp"><b class="serif" style="font-size:19px;font-weight:400">${esc(p.name)}, ${V.ageShort(p)}</b><div class="small muted">${p.tel} · ${V.communeTxt(p.commune)}</div></div>${I('badge-check', 'gold')}</div>`).join('') : `<div class="callout danger"><span>Aucun profil vérifié ne correspond à « ${esc(s)} ». Méfiez-vous des numéros qui ne figurent pas sur Velours.</span></div>`) : '';
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
  function ficheHTML(p) {
    const st = V.statusInfo(p);
    const on = V.isSel(p.id);
    const slides = slidesFor(p);
    const order = V.lastOrder && V.lastOrder.includes(p.id) ? V.lastOrder : vis().map((x) => x.id);
    const k = order.indexOf(p.id);
    const prev = V.byId(order[(k - 1 + order.length) % order.length]), next = V.byId(order[(k + 1) % order.length]);
    const v = p.verif;
    const persons = p.persons ? p.persons.map((x) => { const ref = x.ref && V.byId(x.ref); const at = ref ? ref.attrs : x.attrs || {}; return `<div class="panel soft" style="padding:16px"><div class="row" style="margin-bottom:10px">${ref ? `<img class="avatar" src="${V.img(ref.photos[0], 's')}" alt="">` : `<span class="avatar">${x.name[0]}</span>`}<div><b class="serif" style="font-size:20px;font-weight:400">${esc(x.name)}, ${x.age} ans</b><div class="xs muted">Âge vérifié · identité contrôlée</div></div></div><div class="attrs">${Object.entries(at).slice(0, 6).map(([kk, vv]) => `<div class="attr"><span>${kk}</span><b>${vv}</b></div>`).join('')}</div></div>`; }).join('') : '';
    const rate = (r, ix) => (r[ix] ? `<b>${V.chf(r[ix])}</b>` : '<span class="muted">non</span>');
    const contacts = { tel: ['phone', 'Appeler'], wa: ['wa', 'WhatsApp'], sms: ['sms', 'SMS'], tg: ['tg', 'Telegram'] };
    const cs = p.contacts.slice(0, 3); // seulement les canaux acceptés par la personne
    const duoP = p.duo ? V.byId(p.duo) : null;
    return `<article class="fiche" tabindex="-1">
      <div class="f-top"><button class="icon-btn" data-act="close-ov" aria-label="Fermer">${I('arrow-left')}</button><div class="ttl">${esc(p.name)}, ${V.ageShort(p)}</div><span class="sp"></span>
        <button class="icon-btn" data-act="share" data-id="${p.id}" aria-label="Partager">${I('share')}</button>
        <button class="icon-btn" data-act="fav" data-id="${p.id}" aria-label="Sélection"><span style="color:${on ? 'var(--violet)' : 'inherit'}">${I('heart')}</span></button></div>
      <div class="f-grid">
        <div class="f-media protect">
          <div class="f-track" id="fTrack">${slides.map((s, j) => `<div class="f-slide"><img src="${s.src}" alt="Photo ${j + 1} de ${esc(p.name)}" style="object-position:${s.pos};${s.zoom ? `transform:scale(${s.zoom});transform-origin:${s.pos}` : ''}" draggable="false"><span class="wm">velours · photo vérifiée</span></div>`).join('')}</div>
          <div class="f-dots">${slides.map((_, j) => `<i class="${j ? '' : 'on'}"></i>`).join('')}</div>
          <div class="navs d-only"><button data-act="slide" data-d="-1" aria-label="Photo précédente">${I('chevron-left')}</button><button data-act="slide" data-d="1" aria-label="Photo suivante">${I('chevron-right')}</button></div>
          <button class="icon-btn zoom" style="background:rgba(255,255,255,.88);color:#120d18" data-act="zoom" aria-label="Agrandir">${I('maximize')}</button>
        </div>
        <div class="f-body">
          <div class="eyebrow">${p.kind || (V.CATS.find((c) => c.id === p.cat) || {}).label?.replace(/s$/, '') || ''} · ${V.communeTxt(p.commune)}</div>
          <h2 class="f-name" style="margin-top:10px">${esc(p.name)}<span class="age">${V.ageTxt(p)}</span></h2>
          <div class="f-sub">${V.statusPill(p, true)}<span class="xs muted">${st.sub}</span></div>
          <p class="f-ver"><b>Profil vérifié</b> · âge réel contrôlé${p.photosRecent || -v.media <= 30 ? ' · photos de moins de 30 jours' : ''}${p.duoVerified ? ' · duo vérifié' : ''}${p.video ? ' · vidéo de présentation' : ''}</p>
          <div class="f-actions">
            <button class="f-act${on ? ' on' : ''}" data-act="fav" data-id="${p.id}">${I('heart')}<span class="lbl">${on ? 'Ajoutée' : 'Ajouter'}</span></button>
            <button class="f-act" data-act="compare-with" data-id="${p.id}">${I('columns')}<span>Comparer</span></button>
            <button class="f-act" data-act="hide-close" data-id="${p.id}">${I('eye-off')}<span>Masquer</span></button>
            <button class="f-act" data-act="report" data-id="${p.id}">${I('flag')}<span>Signaler</span></button>
          </div>
          <p class="serif" style="font-size:21px;line-height:1.45;margin-top:18px;color:var(--ink)">« ${esc(p.bio)} »</p>
          <div class="callout gold" style="margin-top:16px"><span><b>Consignes de ${esc(p.name.split(' ')[0])}</b><br>${esc(p.rules)}</span></div>
          ${persons ? `<section class="f-sec"><span class="eyebrow">Les deux personnes</span><div class="stack">${persons}</div></section>` : `<section class="f-sec"><span class="eyebrow">À propos</span><div class="attrs">${Object.entries(p.attrs).map(([kk, vv]) => `<div class="attr"><span>${kk}</span><b>${vv}</b></div>`).join('')}<div class="attr"><span>Origine (déclarée)</span><b>${p.origin}</b></div></div></section>`}
          <section class="f-sec"><span class="eyebrow">Langues</span><div class="langs">${p.langs.map(([l, lv]) => `<span class="lang">${V.LANGS[l]}<span class="lv">${lv}</span></span>`).join('')}</div></section>
          <section class="f-sec"><span class="eyebrow">Rendez-vous</span>
            <div class="attrs" style="margin-bottom:14px"><div class="attr"><span>Modalité</span><b>${V.modeTxt(p.mode).replace(/^./, (c) => c.toUpperCase())}</b></div><div class="attr"><span>Secteur</span><b>${V.communeTxt(p.commune)}${p.mode !== 'incall' ? ' et canton' : ''}</b></div><div class="attr"><span>Horaires habituels</span><b>${p.hours}</b></div></div>
            <div class="week">${['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((dd, j) => `<div class="${p.week[j] ? 'on' : 'off'}"><b>${dd}</b>${p.week[j] ? 'Oui' : 'Repos'}</div>`).join('')}</div>
            <p class="hint">Horaires indicatifs déclarés par ${esc(p.name.split(' ')[0])}. Le statut du jour fait foi.</p></section>
          <section class="f-sec"><span class="eyebrow">Accepte</span><p>${p.accepts.map((a, k) => (k ? a.toLowerCase() : a)).join(', ')}</p></section>
          <section class="f-sec"><span class="eyebrow">Services proposés</span><ul class="svc">${p.services.map((s) => `<li>${V.SERVICES[s]}</li>`).join('')}</ul>
            <span class="eyebrow" style="display:block;margin:20px 0 8px">Limites</span><ul class="svc">${p.limits.map((l) => `<li class="no">${V.LIMITS[l]}</li>`).join('')}</ul></section>
          <section class="f-sec"><div class="row-b" style="margin-bottom:6px"><span class="eyebrow">Tarifs publiés</span></div>
            <table class="rates"><thead><tr><th>Durée</th><th>Reçoit</th><th>Se déplace</th></tr></thead><tbody>${p.rates.map((r) => `<tr><td>${r[0]}</td><td>${rate(r, 1)}</td><td>${rate(r, 2)}</td></tr>`).join('')}</tbody></table>
            <p class="hint">Tarifs fixés librement par ${esc(p.name.split(' ')[0])}. Velours ne perçoit aucune commission sur les rendez-vous.</p></section>
          <section class="f-sec"><span class="eyebrow">Centres d’intérêt</span><div class="chips">${p.interests.map((t) => `<span class="chip sm" style="pointer-events:none">${t}</span>`).join('')}</div></section>
          ${duoP && V.visible(duoP) ? `<section class="f-sec"><span class="eyebrow">Aussi en duo</span><div class="duo-link" data-act="open" data-id="${duoP.id}"><img src="${V.img(duoP.photos[0], 's')}" alt=""><div class="sp"><b class="serif" style="font-size:21px;font-weight:400">${esc(duoP.name)}</b><div class="small muted">Duo réel · deux profils vérifiés et liés</div></div>${I('chevron-right')}</div></section>` : ''}
          ${p.members ? `<section class="f-sec"><span class="eyebrow">Profils individuels</span><div class="stack">${p.members.map(V.byId).map((x) => `<div class="duo-link" data-act="open" data-id="${x.id}"><img src="${V.img(x.photos[0], 's')}" alt=""><div class="sp"><b class="serif" style="font-size:21px;font-weight:400">${esc(x.name)}, ${x.age}</b><div class="small muted">${V.statusInfo(x).label}</div></div>${I('chevron-right')}</div>`).join('')}</div></section>` : ''}
          <section class="f-sec"><span class="eyebrow">Contrôles et dates</span>
            <div class="checks">
              <div class="chk"><div><b>Âge réel et identité vérifiés le ${D.fmtShort(D.addDays(v.id))}</b><span>Pièce d’identité et selfie vivant, prestataire suisse. L’âge affiché est l’âge réel.</span></div></div>
              <div class="chk"><div><b>Médias concordants le ${D.fmtShort(D.addDays(v.media))}</b><span>Selfie de contrôle comparé aux photos publiées. Prochain contrôle avant le ${D.fmtShort(D.addDays(v.media + 90))}.</span></div></div>
              <div class="chk"><div><b>Indépendance confirmée le ${D.fmtShort(D.addDays(v.indep))}</b><span>Entretien direct avec notre équipe${p.persons ? ', pour chacune des deux personnes' : ''}. Renouvelé tous les 6 mois.</span></div></div>
            </div>
            <p class="hint">Portée exacte et date toujours visibles. Vérifié ne veut pas dire garanti : en cas de doute, <button class="link" data-act="report" data-id="${p.id}">signalez-le</button>.</p></section>
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
  }

  /* Contact direct (hors plateforme) */
  V.openContact = (id, ch) => {
    const p = V.byId(id);
    const first = p.name.split(' ')[0];
    const labels = { tel: 'Appeler', wa: 'WhatsApp', sms: 'SMS', tg: 'Telegram' };
    V.S.clicks = (V.S.clicks || 0) + 1; V.save();
    const msg = `Bonjour ${first}, je vous contacte via Velours. Seriez-vous disponible ${V.statusOf(p).t === 'now' ? 'ce soir' : 'prochainement'} ?`;
    const sh = V.sheet.open({
      title: `Contacter ${esc(first)}`,
      body: `<div class="row" style="margin-bottom:16px"><img class="avatar lg sq" src="${V.img(p.photos[0], 's')}" alt=""><div><b class="serif" style="font-size:22px;font-weight:400">${esc(p.name)}</b><div class="small">${V.statusPill(p, true)}</div></div></div>
        <div class="panel soft" style="padding:16px"><div class="xs muted">Numéro professionnel (fictif dans la maquette)</div><div class="row-b"><b style="font-size:22px;letter-spacing:.02em" class="num">${p.tel}</b><button class="txt-btn" data-copy>${I('copy', 'sm')}Copier</button></div></div>
        ${ch !== 'tel' ? `<div style="margin-top:14px">${V.field('Message pré-rempli (modifiable)', { type: 'textarea', value: msg, max: 300 })}</div>` : ''}
        <div class="callout gold" style="margin-top:14px"><span><b>Consignes :</b> ${esc(p.rules)}</span></div>
        <p class="hint" style="margin-top:14px">Le contact se fait directement, hors plateforme. Velours ne lit ni ne conserve vos échanges, et ne prend aucune commission.</p>`,
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
    const list = V.sel().map(V.byId).filter(Boolean).slice(0, 6);
    const box = $('.cmp', ov);
    const onlyDiff = V.cmpDiff !== false;
    const grp = V.cmpGrp || 'all';
    if (list.length < 2) {
      box.innerHTML = `<div class="cmp-head"><div class="row-b"><h2 class="h2">Comparer</h2><button class="icon-btn" data-act="close-ov" aria-label="Fermer">${I('x')}</button></div></div>
        <div class="cmp-empty">${V.empty('columns', 'Ajoutez au moins deux profils', 'Utilisez le cœur sur les cartes ou les fiches : votre sélection apparaît ici, prête à être comparée.', V.btn('Parcourir les profils', { href: '#/profils', arrow: true }))}</div>`;
      return;
    }
    const active = list.filter((p) => !V.cmpOut.includes(p.id));
    const svcU = [...new Set(list.flatMap((p) => p.services))];
    const rows = [
      ['ess', 'En bref', 'Disponibilité', (p) => V.statusInfo(p).label],
      ['ess', 'En bref', 'Langues', (p) => p.langs.map(([l, lv]) => `${V.LANGS[l]} ${lv}`).join(', ')],
      ['ess', 'En bref', 'Tarif de départ', (p) => `Dès ${p.from} CHF`],
      ['ess', 'En bref', 'Modalité', (p) => V.modeTxt(p.mode)],
      ['ess', 'En bref', 'Quartier', (p) => V.communeTxt(p.commune)],
      ['rdv', 'Rendez-vous', 'Horaires habituels', (p) => p.hours],
      ['rdv', 'Rendez-vous', 'Accepte', (p) => p.accepts.join(', ')],
      ['rdv', 'Rendez-vous', 'Consignes', (p) => p.rules],
      ['tar', 'Tarifs', '1 heure · reçoit', (p) => (p.rates[0][1] ? V.chf(p.rates[0][1]) : 'non')],
      ['tar', 'Tarifs', '1 heure · se déplace', (p) => (p.rates[0][2] ? V.chf(p.rates[0][2]) : 'non')],
      ['tar', 'Tarifs', '2 heures', (p) => V.chf(p.rates[1][1] || p.rates[1][2])],
      ['tar', 'Tarifs', 'Soirée (4 h)', (p) => V.chf(p.rates[2][1])],
      ['tar', 'Tarifs', 'Nuit', (p) => V.chf(p.rates[3][1])],
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
        <div class="row-b"><h2 class="h2">Comparer ${list.length} profils</h2><button class="icon-btn" data-act="close-ov" style="flex:none" aria-label="Fermer">${I('x')}</button></div>
        <p class="muted small" style="margin-top:6px">Les critères identiques restent discrets. Chaque profil peut être écarté sans être supprimé de votre sélection.</p>
        <div class="cmp-tools"><label class="row small b" style="gap:10px"><span class="switch"><input type="checkbox" id="cmpDiff" ${onlyDiff ? 'checked' : ''}><span></span></span>Uniquement les différences</label>
        ${V.seg('cmpgrp', [['all', 'Tout'], ['ess', 'En bref'], ['rdv', 'Rendez-vous'], ['tar', 'Tarifs'], ['svc', 'Services'], ['pro', 'Profil']], grp, 'violet')}</div>
      </div>
      <div class="cmp-scroll"><table class="cmp-table"><thead><tr><th class="crit">Critère</th>${list.map((p) => `<th class="${V.cmpOut.includes(p.id) ? 'out' : ''}"><div class="cmp-col"><img src="${V.img(p.photos[0], 's')}" alt="" data-act="open" data-id="${p.id}" style="cursor:pointer"><b>${esc(p.name)}, ${V.ageShort(p)}</b>${V.statusPill(p, true)}<div class="row" style="gap:6px">${V.cmpOut.includes(p.id) ? `<button class="btn xs ghost" data-act="cmp-in" data-id="${p.id}"><span class="roll"><span>Réintégrer</span><span aria-hidden="true">Réintégrer</span></span></button>` : `<button class="btn xs ghost" data-act="cmp-out" data-id="${p.id}"><span class="roll"><span>Écarter</span><span aria-hidden="true">Écarter</span></span></button><button class="btn xs" data-act="contact" data-id="${p.id}" data-ch="${p.contacts[0]}"><span class="roll"><span>Contacter</span><span aria-hidden="true">Contacter</span></span></button>`}</div></div></th>`).join('')}</tr></thead>
      <tbody>${body}</tbody></table>
      ${hiddenSame ? `<p class="muted small" style="padding:16px">${hiddenSame} critère${hiddenSame > 1 ? 's' : ''} identique${hiddenSame > 1 ? 's' : ''} masqué${hiddenSame > 1 ? 's' : ''}. <button class="link" data-act="cmp-all">Tout afficher</button></p>` : ''}</div>`;
    V.ui.enhance(box);
    $('#cmpDiff', box).onchange = (e) => { V.cmpDiff = e.target.checked; renderCmp(ov); };
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

  V.route(/^\/rejoindre$/, () => ({
    title: 'Nous rejoindre',
    html: `<section class="dark-band section"><div class="wrap">
        <div class="eyebrow">Escortes indépendantes à Genève</div>
        <h1 class="h1" style="margin-top:14px;max-width:20ch">149 francs par mois. Rien sur vos rendez-vous.</h1>
        <p class="lead" style="margin-top:18px">Vous payez un forfait, sans engagement. Ce que vous gagnez avec vos clients ne nous regarde pas. Deux mois offerts au lancement, sans carte bancaire.</p>
        <div class="row wrapr" style="margin-top:28px">${V.btn('Commencer ma candidature', { href: '#/pro/inscription/1', cls: 'gold lg', arrow: true })}${V.btn('Voir les tarifs', { href: '#/rejoindre', act: 'scroll-tarifs', cls: 'ghost lg', attrs: WHITE_GHOST })}</div>
      </div></section>
      <section class="section"><div class="wrap">
        <div class="sec-head"><h2 class="h2">Ce que le forfait vous donne</h2></div>
        <div class="ed-list">
          <div><b>Une galerie sans page 12</b><p>Pas de pagination, un ordre qui ne bouge pas pendant la visite et des filtres précis. Quelqu’un qui cherche une escorte parlant portugais à Carouge vous trouve.</p></div>
          <div><b>Le statut en un geste</b><p>« Disponible maintenant » ou « ce soir à 21 h », depuis l’écran d’accueil du téléphone. Sans mise à jour, il expire au bout de trois heures.</p></div>
          <div><b>Un profil masqué en moins d’une minute</b><p>Depuis l’espace pro, à tout moment. Vos photos sont filigranées et surveillées sur le web ; votre adresse exacte n’apparaît jamais.</p></div>
          <div><b>Des chiffres lisibles</b><p>Vues, ajouts en sélection, clics par canal de contact, comparés à la moyenne des profils de votre catégorie.</p></div>
        </div>
      </div></section>
      <section class="section-sm" id="tarifs"><div class="wrap">
        <div class="sec-head" style="flex-wrap:wrap"><div><div class="eyebrow">CHF par mois, sans engagement</div><h2 class="h2" style="margin-top:10px">Tarifs</h2></div>
          <p class="offer-line"><b>Deux mois offerts</b> avec le code LANCEMENT2M, sans carte bancaire.</p></div>
        <div class="plans">${V.PLANS.map((pl) => V.planRow(pl, { btn: (x) => V.btn('Choisir ' + x.name, { href: '#/pro/inscription/1?plan=' + x.id, cls: x.reco ? 'sm' : 'sm ghost', arrow: true }) })).join('')}
          <div class="plan"><div><h3>Duo ou couple</h3><p class="pitch">${V.PLAN_DUO.note}</p></div><p class="ink2" style="font-size:14.5px">Les deux personnes sont vérifiées, et chacune garde son profil individuel.</p><div class="pp"><div class="price"><b>${V.PLAN_DUO.price}</b><span>CHF / mois</span></div>${V.btn('Créer un duo', { href: '#/pro/duo', cls: 'sm ghost' })}</div></div>
        </div>
        <h3 class="h3" style="margin:44px 0 14px">Options à l’unité</h3>
        <div class="addons">${V.ADDONS.map((a) => `<div class="addon${a.soon ? ' soon' : ''}"><b>${a.name}</b><span class="p">${a.price}<small>${a.unit}</small></span><p class="small ink2">${a.desc}</p></div>`).join('')}</div>
      </div></section>
      <section class="section"><div class="wrap" style="max-width:860px">
        <h2 class="h2">Questions fréquentes</h2><div style="margin-top:18px">
        ${[['Prenez-vous une commission sur mes rendez-vous ?', 'Non, jamais. Vous payez un forfait mensuel et, si vous le voulez, des options. Vos rendez-vous, vos tarifs et vos clients ne regardent que vous.'],
          ['Mes absences sont-elles facturées ?', 'Oui. L’abonnement continue pendant une absence : votre profil reste visible avec « De retour le … », ou masqué si vous préférez. Pour arrêter de payer, vous résiliez en un clic, avec effet à la fin du mois en cours.'],
          ['Mon âge est-il affiché ?', 'Oui, votre âge réel, issu de la vérification d’identité. Vous ne pouvez pas le modifier, et il change à votre anniversaire. C’est ce qui rend le filtre d’âge fiable.'],
          ['Dois-je indiquer mon origine ?', 'Non. C’est facultatif, vous choisissez la mention et vous pouvez la retirer quand vous voulez.'],
          ['Où sont stockées mes données ?', 'En Suisse, sans exception. Votre pièce d’identité reste chez le prestataire de vérification : nous ne gardons que le résultat et votre date de naissance.'],
          ['Puis-je proposer un duo ?', 'Oui. Vous invitez votre partenaire depuis l’espace pro, elle accepte, et vos deux profils sont liés. Chacune est vérifiée.']].map(([t, d]) => `<details class="acc"><summary>${t}<span class="pm">${I('plus', 'sm')}</span></summary><div class="acc-b">${d}</div></details>`).join('')}
        </div><div style="margin-top:30px">${V.btn('Commencer ma candidature', { href: '#/pro/inscription/1', arrow: true, cls: 'lg' })}</div>
      </div></section>${V.footer()}`,
  }));

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
    'cg-visiteurs': ['Conditions d’utilisation · visiteurs', ['Accès réservé aux personnes majeures. L’avertissement d’âge doit être confirmé à l’entrée.', 'Velours met en relation des adultes. Les contacts se font directement entre le visiteur et la personne, hors plateforme.', 'Le respect des consignes, des limites et du consentement est une condition d’utilisation. Tout manquement peut être signalé et entraîner une suspension.', 'Droit suisse applicable, for à Genève.']],
    'cg-escortes': ['Conditions d’utilisation · escortes', ['Publication réservée aux personnes majeures, vérifiées et indépendantes.', 'Le modèle repose exclusivement sur des forfaits : aucune commission, aucun pourcentage sur les rendez-vous.', 'L’abonnement est mensuel, sans engagement, et continue pendant les absences. La résiliation prend effet à la fin de la période en cours.', 'Le consentement à la publication de chaque photo et de chaque information est révocable à tout moment.']],
    confidentialite: ['Politique de confidentialité', ['Données hébergées en Suisse. Traitement conforme à la nLPD ; analyse d’impact réalisée avant l’ouverture.', 'Visiteurs : aucune donnée obligatoire. La sélection anonyme s’efface à la fermeture du navigateur.', 'Escortes : la pièce d’identité reste chez le prestataire de vérification ; seuls le résultat et la date de naissance sont conservés.', 'Droits d’accès, de rectification et d’effacement en libre-service. Effacement effectif sous 30 jours.']],
    contenu: ['Politique de contenu', ['Photos suggestives autorisées, contenu pornographique interdit.', 'Aucune nudité explicite dans les zones publiques ou indexées.', 'Catalogue fermé de services, sans texte libre sur les pratiques.', 'Toute nouvelle photo est modérée avant publication.']],
    mentions: ['Mentions légales', ['Velours (nom de travail), maquette de démonstration, profils fictifs.', 'Éditeur : à compléter (société, adresse à Genève, numéro IDE).', 'Hébergement : prestataire suisse, à confirmer.', 'Réalisation : Digistylze, Genève.']],
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
