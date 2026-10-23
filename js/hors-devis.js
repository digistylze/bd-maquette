/* BD : fonctions HORS DEVIS, intégrées à la maquette pour en discuter avec BD.
   Elles ont l'allure normale du site ; seule une étiquette « Hors devis » les signale.
   Aucune ne faisait partie du devis initial. */
(function (V) {
  'use strict';
  const { $, $$, i: I, esc } = V;
  V.hdTag = (code) => `<span class="hd-tag" title="Fonction hors devis initial${code ? ' · ' + code : ''}, montrée pour en discuter">Hors devis</span>`;
  /* Carte de fiche (f-card) ou panneau (espace pro, back-office), avec l'étiquette dans l'en-tête */
  const card = (code, ic, title, inner) => `<section class="f-card"><div class="f-h-row"><h3 class="f-h">${I(ic)}${title}</h3>${V.hdTag(code)}</div>${inner}</section>`;
  const panel = (code, title, inner) => `<div class="panel"><div class="row-b"><h3>${title}</h3>${V.hdTag(code)}</div>${inner}</div>`;
  const MIC = '<svg class="ico sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';

  /* ID03 · Grille de tarifs */
  const COLS = [['n', 'Profil'], ['q', 'Quartier'], ['h1', '1 h · reçoit'], ['h1o', '1 h · se déplace'], ['h2', '2 heures'], ['s', 'Soirée (4 h)'], ['nu', 'Nuit']];
  V.route(/^\/tarifs$/, (m, q) => {
    const L = V.PROFILES.filter((p) => V.visible(p));
    const val = (p, k) => ({ n: p.name, q: V.communeTxt(p.commune), h1: p.rates[0][1], h1o: p.rates[0][2], h2: p.rates[1][1] || p.rates[1][2], s: p.rates[2][1], nu: p.rates[3][1] }[k]);
    const k = q.tri || 'h1', dir = q.dir === 'desc' ? -1 : 1;
    const rows = L.slice().sort((a, b) => { const x = val(a, k), y = val(b, k); if (x == null) return 1; if (y == null) return -1; return (typeof x === 'string' ? x.localeCompare(y, 'fr') : x - y) * dir; });
    const cell = (v) => (v == null ? '<span class="muted">non renseigné</span>' : typeof v === 'number' ? `<b class="num">${V.chf(v)}</b>` : esc(v));
    return {
      title: 'Grille de tarifs',
      html: `<div class="wrap"><div class="page-hero" style="max-width:860px"><div class="row wrapr" style="gap:10px"><span class="eyebrow">Genève · tarifs déclarés</span>${V.hdTag('ID03')}</div><h1 class="h1" style="margin-top:12px">Grille de tarifs</h1>
        <p class="lead">Tous les tarifs côte à côte. Cliquez sur une colonne pour trier. Les tarifs restent fixés librement par chaque professionnelle.</p></div>
        <div class="panel" style="margin-top:20px"><div class="tbl-wrap"><table class="tbl tf-table"><thead><tr>${COLS.map(([c, l]) => `<th><a href="#/tarifs?tri=${c}&dir=${k === c && dir === 1 ? 'desc' : 'asc'}" class="${k === c ? 'on' : ''}">${l}${k === c ? (dir === 1 ? ' ↑' : ' ↓') : ''}</a></th>`).join('')}</tr></thead>
        <tbody>${rows.map((p) => `<tr data-act="open" data-id="${p.id}" style="cursor:pointer"><td><div class="row" style="gap:10px"><img class="avatar sq" src="${V.img(p.photos[0], 's')}" alt="" style="width:36px;height:44px;border-radius:8px">${esc(p.name)}</div></td><td class="small">${esc(val(p, 'q'))}</td>${['h1', 'h1o', 'h2', 's', 'nu'].map((c) => `<td>${cell(val(p, c))}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
        <div style="margin-top:16px">${V.btn('Retour aux profils', { href: '#/profils', cls: 'sm ghost', arrow: 'arrow-left' })}</div>
      </div>${V.footer()}`,
    };
  });

  /* ID04 · ID05 · Espaces dédiés */
  const ESP = {
    duos: { t: 'Espace duos et couples', s: 'Pour les couples qui cherchent une rencontre à trois, et les duos vérifiés. Une page à part, avec ses propres filtres et son ton.', f: (p) => p.clients && p.clients.couple === 'oui', code: 'ID04' },
    bdsm: { t: 'Espace BDSM et domination', s: 'Domination, jeux de rôle, limites claires. Un espace à part, avec un vocabulaire encadré et des consignes de sécurité.', f: (p) => V.fts && (V.fts('domination', p).ok || V.fts('jeu de role', p).ok), code: 'ID05' },
  };
  V.route(/^\/espace\/(duos|bdsm)$/, (m) => {
    const e = ESP[m[1]]; const L = V.PROFILES.filter((p) => V.visible(p) && e.f(p));
    return {
      title: e.t,
      html: `<section class="esp-hero esp-${m[1]}"><div class="wrap">${V.hdTag(e.code)}<h1>${e.t}</h1><p>${e.s}</p><div class="row wrapr" style="gap:14px;margin-top:18px">${V.btn('Tous les profils', { href: '#/profils', cls: 'ghost', attrs: 'style="--bf:#fff;--bh:#fff;--bhf:#17131a;box-shadow:inset 0 0 0 1px rgba(255,255,255,.45)"' })}<a class="link" href="#/espace/${m[1] === 'duos' ? 'bdsm' : 'duos'}" style="color:#fff">${m[1] === 'duos' ? 'Espace BDSM' : 'Espace duos et couples'}</a></div></div></section>
        <div class="wrap section-sm"><p class="muted" style="margin-bottom:16px">${L.length} profil${L.length > 1 ? 's' : ''}.</p>
          <div class="gallery">${L.map((p, k) => V.card(p, { i: k, noHide: true })).join('')}</div></div>${V.footer()}`,
    };
  });
  /* Entrée sur l'accueil vers les espaces dédiés */
  V.hdSpaces = () => `<section class="section-sm"><div class="wrap">
      <div class="sec-head"><div><h2 class="h2">Des espaces à part ${V.hdTag('ID04 · ID05')}</h2><p class="sec-note">Une page dédiée, avec son ton et ses filtres.</p></div></div>
      <div class="esp-cards"><a class="esp-card esp-duos" href="#/espace/duos"><b>Duos et couples</b><span>Rencontres à trois, duos vérifiés</span>${I('arrow-right')}</a><a class="esp-card esp-bdsm" href="#/espace/bdsm"><b>BDSM et domination</b><span>Jeux de rôle, limites claires</span>${I('arrow-right')}</a></div>
    </div></section>`;

  /* ID01 · Recherche visuelle : profils qui ressemblent (fiche) */
  V.hdSimilar = (p) => {
    const score = (x) => (x.attrs.Cheveux === p.attrs.Cheveux ? 2 : 0) + (x.attrs.Silhouette === p.attrs.Silhouette ? 2 : 0) + (x.origin === p.origin ? 1 : 0) + (Math.abs((+x.age || 0) - (+p.age || 0)) <= 3 ? 1 : 0) + x.langs.filter(([l]) => p.langs.some(([m]) => m === l)).length * 0.3;
    const L = V.PROFILES.filter((x) => V.visible(x) && x.id !== p.id).sort((a, b) => score(b) - score(a)).slice(0, 4);
    return card('ID01', 'image', 'Profils qui ressemblent', `<div class="hd-sim">${L.map((x) => `<button type="button" data-act="goto" data-id="${x.id}"><img src="${V.img(x.photos[0], 's')}" alt=""><span>${esc(x.name)}</span></button>`).join('')}</div>
      <button type="button" class="soc-b" data-act="hd-photo">${I('camera', 'sm')}Chercher avec une photo</button>`);
  };
  /* Synchronisation des webcams (fiche) */
  V.hdWebcam = (p) => {
    if (!p.links || !p.links.some((l) => l.k === 'webcam')) return '';
    const min = 8 + (p.id.length * 7) % 40;
    return card('', 'video', 'En direct sur sa webcam', `<div class="wc-live"><span class="wc-dot"></span><div class="sp"><b>${esc(p.name.split(' ')[0])} est en direct</b><small>depuis ${min} min · statut mis à jour automatiquement</small></div>${V.btn('Regarder', { cls: 'sm', attrs: 'data-act="hd-cam"', arrow: 'arrow-up-right' })}</div>`);
  };
  /* ID02 · Demande au micro (recherche) */
  V.hdMic = () => `<div class="hd-mic-row"><button type="button" class="mic-btn" data-hd-mic>${MIC}<span>Dicter ma recherche</span></button>${V.hdTag('ID02')}</div>`;
  V.hdListen = async (inp, run, btn) => {
    if (btn) { btn.classList.add('on'); btn.querySelector('span').textContent = 'Je vous écoute…'; }
    await V.wait(1300);
    const phrase = 'Une blonde qui parle anglais';
    inp.value = ''; for (const ch of phrase) { inp.value += ch; await V.wait(28); }
    if (btn) { btn.classList.remove('on'); btn.querySelector('span').textContent = 'Dicter ma recherche'; }
    inp.dispatchEvent(new Event('input', { bubbles: true })); if (run) run();
  };
  /* Créneaux et agenda des duos (espace pro) */
  V.hdDuoAgenda = () => {
    const days = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'], slots = ['14 h', '17 h', '20 h', '22 h'];
    const st = (d, s) => { const v = (d * 5 + s * 3) % 7; return v === 0 ? 'booked' : v < 3 ? 'both' : v < 5 ? 'one' : ''; };
    const L = { both: 'Libres toutes les deux', one: 'Une seule libre', booked: 'Créneau réservé à deux', '': 'Indisponibles' };
    return panel('', 'Agenda du duo', `<p class="small ink2" style="margin-top:4px">Alma et Jade voient leurs disponibilités communes et se proposent des créneaux.</p>
      <div class="duo-ag"><span></span>${days.map((d) => `<b>${d}</b>`).join('')}${slots.map((s, si) => `<b>${s}</b>${days.map((_, di) => `<i class="${st(di, si)}" title="${L[st(di, si)]}"></i>`).join('')}`).join('')}</div>
      <div class="legend" style="margin-top:10px">${['both', 'one', 'booked'].map((k) => `<span><i class="duo-l ${k}"></i>${L[k]}</span>`).join('')}</div>
      <div style="margin-top:12px">${V.btn('Proposer un créneau à Jade', { cls: 'sm ghost', attrs: 'data-act="hd-duo"', arrow: 'calendar' })}</div>`);
  };
  /* Dictionnaire formel des statistiques (back-office) */
  const DICT = [
    ['fiche_ouverte', 'Ouverture d’une fiche', 'Affichage de la fiche à plus de 50 %', 'Une par visite et par fiche, sur 30 min', 'Robots, équipe, aperçus'],
    ['clic_contact', 'Clic sur Appeler, WhatsApp, SMS ou Telegram', 'Clic sur le bouton du canal', 'Total et visites uniques, par canal', 'Double clic en moins de 3 s'],
    ['ajout_favori', 'Ajout à la sélection', 'Cœur activé', 'Ajouts moins retraits sur la période', 'Ajout puis retrait en moins de 10 s'],
    ['comparaison', 'Ouverture du comparateur', 'Comparateur affiché avec 2 profils ou plus', 'Une par visite', 'Robots, équipe'],
    ['recherche_vide', 'Recherche sans résultat', 'Filtres ou mot-clé donnant 0 profil', 'Une par combinaison et par visite', 'Saisie en cours (moins de 2 s)'],
    ['abandon_fiche', 'Fiche quittée sans contact', 'Sortie d’une fiche ouverte depuis plus de 10 s, sans clic de contact', 'Fiches quittées / fiches ouvertes', 'Retour vers une autre fiche'],
    ['encart_vu', 'Encart payant affiché', 'Encart visible à plus de 50 % pendant 1 s', 'Total et visites uniques, par zone', 'Robots, équipe, onglet masqué'],
    ['rdv_declare', 'Rendez-vous déclaré', 'Saisie par la professionnelle dans son espace', 'Déclaratif, jamais déduit d’un clic', '—'],
  ];
  V.hdStatsDict = () => panel('', 'Dictionnaire des statistiques', `<p class="small muted" style="margin-top:4px">Chaque mesure a une définition écrite, partagée avec BD.</p>
    <div class="tbl-wrap" style="margin-top:10px"><table class="tbl"><thead><tr><th>Nom technique</th><th>Mesure</th><th>Déclencheur</th><th>Règle de calcul</th><th>Exclusions</th></tr></thead><tbody>${DICT.map((r) => `<tr><td><code class="adm-hash">${r[0]}</code></td>${r.slice(1).map((c) => `<td class="small">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);

  /* Actions de démonstration */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act="hd-photo"], [data-act="hd-cam"], [data-act="hd-duo"]'); if (!a) return;
    e.preventDefault(); e.stopPropagation();
    const msg = { 'hd-photo': 'Démonstration : la photo serait comparée aux profils par intelligence artificielle.', 'hd-cam': 'Démonstration : ouvrirait la webcam en direct sur le site externe.', 'hd-duo': 'Démonstration : Jade recevrait la proposition et confirmerait depuis son espace.' }[a.dataset.act];
    V.toast(msg, { icon: 'info', ms: 4000 });
  }, true);
})(window.V);
