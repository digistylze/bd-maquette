/* BD : fonctions HORS DEVIS, montrées pour en discuter avec BD. Chacune porte l'étiquette « Hors devis »
   et se retrouve sur la page #/hors-devis. Rien de tout cela ne faisait partie du devis initial. */
(function (V) {
  'use strict';
  const { $, $$, i: I, esc } = V;
  V.hdTag = (t = 'Hors devis') => `<span class="hd-tag" title="Fonction hors devis initial, montrée pour en discuter">${I('alert', 'sm')}${t}</span>`;
  const box = (code, title, inner, cls = '') => `<section class="hd-box ${cls}"><div class="hd-head">${V.hdTag()}<b>${code ? `${code} · ` : ''}${title}</b></div>${inner}</section>`;
  const MIC = '<svg class="ico sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';

  /* Liste des fonctions hors devis (page récapitulative) */
  V.HD = [
    { code: '', t: 'Créneaux et agenda des duos', d: 'Les deux personnes d’un duo partagent un agenda : créneaux libres à deux, proposition et confirmation par chacune.', where: [['#/pro/duo', 'Espace pro › Duo']] },
    { code: '', t: 'Dictionnaire formel des statistiques', d: 'Définition écrite de chaque mesure : nom technique, déclencheur, règle de calcul, exclusions et durée de conservation.', where: [['#/admin/stats', 'Back-office › Statistiques (en bas)']] },
    { code: '', t: 'Synchronisation des webcams', d: 'Le statut « en direct » de la webcam remonte tout seul sur la fiche. Dans le devis, la webcam reste un simple lien.', where: [['#/profil/imp-lana', 'Fiche de Lana']] },
    { code: 'ID01', t: 'Recherche visuelle', d: 'Trouver des profils qui ressemblent à un profil ou à une photo.', where: [['#/profil/imp-nina', 'Fiche de Nina (en bas)']] },
    { code: 'ID02', t: 'Demande au micro', d: 'Dicter sa recherche : « une blonde qui parle anglais ». La phrase est transformée en filtres.', where: [['#/profils', 'Profils › Mot-clé ou numéro › Dicter']] },
    { code: 'ID03', t: 'Grille de tarifs', d: 'Tous les tarifs côte à côte, par durée et par mode, triables.', where: [['#/tarifs', 'Grille de tarifs']] },
    { code: 'ID04 · ID05', t: 'Espaces dédiés', d: 'Des espaces à part, avec leur propre page d’accueil et leur ton : par exemple duos et couples, ou BDSM.', where: [['#/espace/duos', 'Espace duos'], ['#/espace/bdsm', 'Espace BDSM']] },
  ];
  const OPTIONS = [
    ['O01', 'Planning futur avancé, absences, retours et rappels', [['#/pro/absences', 'Absences'], ['#/pro/statut', 'Aujourd’hui, ce soir, demain']]],
    ['O02', 'Traduction automatique des descriptions', [['#/pro/profil', 'Éditeur › Traduction automatique']]],
    ['O03', 'Extensions russe et arabe (droite à gauche)', [['#/ar', 'Page en arabe']]],
    ['O04', 'Vérification d’identité automatisée', [['#/pro/inscription/2', 'Inscription › Contrôles']]],
    ['O06', 'Alertes et statistiques avancées, sélection enrichie', [['#/compte/alertes', 'Compte › Alertes'], ['#/pro/stats', 'Statistiques pro']]],
    ['O07', 'Demande de séance photo', [['#/rejoindre', 'Nous rejoindre › Shooting photo']]],
    ['O08', 'Parrainage, crédits promotionnels et version installable', [['#/pro/parrainage', 'Parrainage'], ['#/pro/visibilite', 'Crédits'], ['#/pro/statut', 'Installer l’app']]],
  ];
  const SOON = [['Réceptionniste (prise de rendez-vous au forfait)', 'affiché « bientôt »', '#/rejoindre'], ['Vérification des clients signalés', 'affiché « V2 »', '#/pro/securite']];

  V.route(/^\/hors-devis$/, () => ({
    title: 'Hors devis',
    html: `<div class="wrap"><div class="page-hero" style="max-width:860px"><div class="eyebrow">Pour la discussion avec BD</div><h1 class="h1" style="margin-top:12px">Fonctions hors devis</h1>
      <p class="lead">Ces fonctions ne faisaient pas partie du devis initial. Elles sont maquettées pour être vues et discutées, et portent partout l’étiquette ${V.hdTag()}. Chacune peut être chiffrée séparément.</p></div>
      <div class="hd-grid">${V.HD.map((h) => `<article class="hd-card"><div class="row-b">${V.hdTag()}${h.code ? `<span class="badge">${h.code}</span>` : ''}</div><h3>${h.t}</h3><p>${h.d}</p><div class="hd-links">${h.where.map(([href, l]) => `<a class="link" href="${href}">${l} ${I('arrow-right', 'sm')}</a>`).join('')}</div></article>`).join('')}</div>
      <section class="section-sm"><h2 class="h3">Options du cahier des charges déjà visibles dans la maquette</h2><p class="muted" style="margin:6px 0 14px;max-width:70ch">Le cahier des charges les classe « à chiffrer séparément ». Elles sont montrées sans étiquette : à vérifier dans le devis.</p>
        <div class="panel"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Code</th><th>Option</th><th>Où la voir</th></tr></thead><tbody>${OPTIONS.map(([c, t, w]) => `<tr><td class="num b">${c}</td><td>${t}</td><td>${w.map(([h, l]) => `<a class="link small" href="${h}">${l}</a>`).join(' · ')}</td></tr>`).join('')}</tbody></table></div></div></section>
      <section class="section-sm" style="padding-top:0"><h2 class="h3">Annoncés pour plus tard</h2><div class="panel" style="margin-top:12px"><div class="list-rows">${SOON.map(([t, s, h]) => `<a href="${h}"><div class="sp"><b>${t}</b><div class="small muted">${s}</div></div>${I('chevron-right')}</a>`).join('')}</div></div></section>
    </div>${V.footer()}`,
  }));

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
      html: `<div class="wrap"><div class="page-hero" style="max-width:860px"><div class="row wrapr" style="gap:10px">${V.hdTag()}<span class="badge">ID03</span></div><h1 class="h1" style="margin-top:12px">Grille de tarifs</h1>
        <p class="lead">Tous les tarifs déclarés, côte à côte. Cliquez sur une colonne pour trier. Les tarifs restent fixés librement par chaque professionnelle.</p></div>
        <div class="panel hd-outline" style="margin-top:20px"><div class="tbl-wrap"><table class="tbl tf-table"><thead><tr>${COLS.map(([c, l]) => `<th><a href="#/tarifs?tri=${c}&dir=${k === c && dir === 1 ? 'desc' : 'asc'}" class="${k === c ? 'on' : ''}">${l}${k === c ? (dir === 1 ? ' ↑' : ' ↓') : ''}</a></th>`).join('')}</tr></thead>
        <tbody>${rows.map((p) => `<tr data-act="open" data-id="${p.id}" style="cursor:pointer"><td><div class="row" style="gap:10px"><img class="avatar sq" src="${V.img(p.photos[0], 's')}" alt="" style="width:36px;height:44px;border-radius:8px">${esc(p.name)}</div></td><td class="small">${esc(val(p, 'q'))}</td>${['h1', 'h1o', 'h2', 's', 'nu'].map((c) => `<td>${cell(val(p, c))}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
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
      html: `<section class="esp-hero esp-${m[1]}"><div class="wrap"><div class="row wrapr" style="gap:10px">${V.hdTag()}<span class="badge dark">ID04 · ID05</span></div><h1>${e.t}</h1><p>${e.s}</p><div class="row wrapr" style="gap:10px;margin-top:18px">${V.btn('Retour au site', { href: '#/', cls: 'ghost', attrs: 'style="--bf:#fff;--bh:#fff;--bhf:#17131a;box-shadow:inset 0 0 0 1px rgba(255,255,255,.45)"' })}<a class="link" href="#/espace/${m[1] === 'duos' ? 'bdsm' : 'duos'}" style="color:#fff">Voir l’autre espace</a></div></div></section>
        <div class="wrap section-sm"><p class="muted" style="margin-bottom:16px">${L.length} profil${L.length > 1 ? 's' : ''} de la maquette correspondent. Dans la version complète : page d’accueil propre, filtres dédiés, mise en avant séparée.</p>
          <div class="gallery">${L.map((p, k) => V.card(p, { i: k, noHide: true })).join('')}</div></div>${V.footer()}`,
    };
  });

  /* ID01 · Recherche visuelle : profils qui ressemblent (fiche) */
  V.hdSimilar = (p) => {
    const score = (x) => (x.attrs.Cheveux === p.attrs.Cheveux ? 2 : 0) + (x.attrs.Silhouette === p.attrs.Silhouette ? 2 : 0) + (x.origin === p.origin ? 1 : 0) + (Math.abs((+x.age || 0) - (+p.age || 0)) <= 3 ? 1 : 0) + x.langs.filter(([l]) => p.langs.some(([m]) => m === l)).length * 0.3;
    const L = V.PROFILES.filter((x) => V.visible(x) && x.id !== p.id).sort((a, b) => score(b) - score(a)).slice(0, 4);
    return box('ID01', 'Recherche visuelle', `<p class="small ink2">Profils qui ressemblent à ${esc(p.name)} (cheveux, silhouette, style des photos).</p>
      <div class="hd-sim">${L.map((x) => `<button type="button" data-act="goto" data-id="${x.id}"><img src="${V.img(x.photos[0], 's')}" alt=""><span>${esc(x.name)}</span></button>`).join('')}</div>
      <button type="button" class="soc-b" data-act="hd-photo">${I('camera', 'sm')}Chercher avec une photo</button>`, 'in-fiche');
  };
  /* Synchronisation des webcams (fiche) */
  V.hdWebcam = (p) => {
    if (!p.links || !p.links.some((l) => l.k === 'webcam')) return '';
    const min = 8 + (p.id.length * 7) % 40;
    return box('', 'Synchronisation de la webcam', `<div class="wc-live"><span class="wc-dot"></span><div class="sp"><b>${esc(p.name.split(' ')[0])} est en direct sur sa webcam</b><small>depuis ${min} min · statut récupéré automatiquement</small></div>${V.btn('Regarder', { cls: 'sm', attrs: 'data-act="hd-cam"', arrow: 'arrow-up-right' })}</div><p class="hint">Dans le devis, la webcam reste un simple lien : rien n’est synchronisé.</p>`, 'in-fiche');
  };
  /* ID02 · Demande au micro (recherche) */
  V.hdMic = () => `<div class="hd-mic-row">${V.hdTag()}<button type="button" class="mic-btn" data-hd-mic>${MIC}<span>Dicter ma recherche</span></button><span class="xs muted">ID02</span></div>`;
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
    return box('', 'Agenda et créneaux du duo', `<p class="small ink2">Alma et Jade voient leurs disponibilités communes et se proposent des créneaux.</p>
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
  V.hdStatsDict = () => box('', 'Dictionnaire formel des statistiques', `<p class="small ink2">Chaque mesure a une définition écrite, partagée avec BD et la fiduciaire.</p>
    <div class="tbl-wrap" style="margin-top:10px"><table class="tbl"><thead><tr><th>Nom technique</th><th>Mesure</th><th>Déclencheur</th><th>Règle de calcul</th><th>Exclusions</th></tr></thead><tbody>${DICT.map((r) => `<tr><td><code class="adm-hash">${r[0]}</code></td>${r.slice(1).map((c) => `<td class="small">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`, 'in-adm');

  /* Actions de démonstration */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act="hd-photo"], [data-act="hd-cam"], [data-act="hd-duo"]'); if (!a) return;
    e.preventDefault(); e.stopPropagation();
    const msg = { 'hd-photo': 'Hors devis : comparaison de photos par intelligence artificielle, à chiffrer.', 'hd-cam': 'Hors devis : ouvrirait la webcam en direct sur le site externe.', 'hd-duo': 'Hors devis : Jade recevrait la proposition et confirmerait depuis son espace.' }[a.dataset.act];
    V.toast(msg, { icon: 'info', ms: 4000 });
  }, true);
})(window.V);
