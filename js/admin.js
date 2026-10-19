/* Velours : back-office (adresse séparée en production, double authentification obligatoire) */
(function (V) {
  'use strict';
  const { $, $$, i: I, esc } = V;
  const D = V.date;
  const A = V.ADMIN;
  V.L.adm = V.L.adm || { done: {}, mod: {}, rep: {}, log: [] };
  const st = V.L.adm;

  const NAV = [
    ['Pilotage', [['', 'layout', 'Vue d’ensemble'], ['stats', 'chart', 'Statistiques']]],
    ['Vérifier', [['candidatures', 'id-card', 'Candidatures'], ['moderation', 'shield', 'Modération'], ['signalements', 'flag', 'Signalements']]],
    ['Gérer', [['escortes', 'users', 'Escortes'], ['facturation', 'banknote', 'Facturation'], ['mises-en-avant', 'sparkles', 'Mises en avant'], ['referentiels', 'list', 'Référentiels']]],
    ['Contrôle', [['audit', 'history', 'Journal d’audit'], ['parametres', 'settings', 'Paramètres et équipe']]],
  ];
  const pend = () => ({ candidatures: A.candidates.filter((c) => !st.done[c.id]).length, moderation: A.moderation.filter((m) => !st.mod[m.id]).length, signalements: A.reports.filter((r) => r.st !== 'Résolu' && !st.rep[r.id]).length });
  const shell = (cur, inner) => {
    const pd = pend();
    return `<div class="wrap"><div class="app-shell">
      <aside class="side"><div class="who"><span class="avatar" style="width:46px;height:56px;border-radius:12px;background:var(--black);color:var(--gold-2)">AR</span><div><b>A. R.</b><span>Administrateur · 2FA active</span></div></div>
        <nav>${NAV.map(([g, items]) => `<div class="grp">${g}</div>${items.map(([k, ic, l]) => `<a href="#/admin${k ? '/' + k : ''}" class="${cur === k ? 'on' : ''}">${I(ic)}${l}${pd[k] ? `<span class="bdg">${pd[k]}</span>` : ''}</a>`).join('')}`).join('')}</nav></aside>
      <div><div class="subnav"><div class="chips scroll">${NAV.flatMap(([, it]) => it).map(([k, , l]) => `<a class="chip sm${cur === k ? ' on' : ''}" href="#/admin${k ? '/' + k : ''}">${l}${pd[k] ? ` · ${pd[k]}` : ''}</a>`).join('')}</div></div>${inner}</div>
    </div></div>`;
  };
  const log = (what) => { st.log.unshift({ ts: Date.now(), who: 'Admin · A. R.', what }); V.save(); };
  const visits = (() => { const s = []; for (let k = 0; k < 30; k++) { const d = D.addDays(k - 29).getDay(); s.push(Math.round(2100 + k * 22 + Math.abs(Math.sin(k * 3.1)) * 520 + (d === 5 || d === 6 ? 700 : 0))); } return s; })();
  const subs = () => {
    const by = {}; let mrr = 0, launch = 0;
    V.PROFILES.forEach((p) => { by[p.plan] = (by[p.plan] || 0) + 1; const pr = p.plan === 'duo' ? V.PLAN_DUO.price : (V.PLANS.find((x) => x.id === p.plan) || {}).price || 0; if (p.verif.id < -61) mrr += pr; else launch++; });
    return { by, mrr, launch };
  };
  const head = (eyebrow, title, right = '') => `<div class="dash-head"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1></div>${right}</div>`;

  /* =================================================================== VUE D'ENSEMBLE */
  V.route(/^\/admin$/, () => {
    const pd = pend(); const S = subs();
    const pub = V.PROFILES.filter((p) => V.visible(p)).length;
    const dn = V.donut(A.traffic.countries);
    const recent = [...st.log.map((l) => ({ d: 0, t: new Date(l.ts).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' }), who: l.who, what: l.what })), ...A.audit].slice(0, 5);
    return {
      title: 'Back-office',
      html: shell('', `${head('Back-office · démonstration', 'Vue d’ensemble', `<span class="mode-pill"><i></i>${new Date().toLocaleDateString('fr-CH', { weekday: 'long', day: 'numeric', month: 'long' })}</span>`)}
        <div class="kpis">
          <div class="kpi"><span class="l">${I('users', 'sm')}Profils publiés</span><span class="v">${pub}</span><span class="xs muted">${V.PROFILES.filter((p) => V.statusOf(p).t === 'now' && V.visible(p)).length} disponibles maintenant</span></div>
          <div class="kpi"><span class="l">${I('id-card', 'sm')}Candidatures</span><span class="v">${pd.candidatures}</span><span class="xs muted">délai moyen 31 h · objectif &lt; 48 h</span></div>
          <div class="kpi" style="border-color:color-mix(in srgb,var(--danger) 45%,transparent)"><span class="l">${I('flag', 'sm')}Signalements ouverts</span><span class="v">${pd.signalements}</span><span class="xs danger b">${A.reports.filter((r) => r.prio === 0 && !st.rep[r.id]).length} prioritaire</span></div>
          <div class="kpi dark"><span class="l">${I('banknote', 'sm')}Revenu récurrent</span><span class="v">${V.chf(S.mrr)}</span><span class="xs" style="color:#d2c6de">+ ${V.chf(870)} de mises en avant · ${S.launch} en offre de lancement</span></div>
        </div>
        <div class="grid-2" style="margin-top:14px">
          <div class="panel"><div class="row-b"><h3>Visites · 30 jours</h3><span class="small muted">${V.nf(A.traffic.visits7)} sur 7 jours · ${A.traffic.mobile} % mobile</span></div>${V.lineChart(visits, { h: 210, labels: [[0, 'J-29'], [29, 'Aujourd’hui']] })}</div>
          <div class="panel"><h3>Files d’attente</h3><div class="list-rows" style="margin-top:6px">
            <a href="#/admin/candidatures"><div class="sp"><b>Candidatures à traiter</b><div class="small muted">Entretiens, vérifications d’identité</div></div><span class="badge v">${pd.candidatures}</span></a>
            <a href="#/admin/moderation"><div class="sp"><b>Contenus à modérer</b><div class="small muted">Photos et textes avant publication</div></div><span class="badge g">${pd.moderation}</span></a>
            <a href="#/admin/signalements"><div class="sp"><b>Signalements</b><div class="small muted">Dont un prioritaire (traite suspectée)</div></div><span class="badge danger">${pd.signalements}</span></a></div></div>
        </div>
        <div class="grid-2" style="margin-top:14px">
          <div class="panel"><div class="row-b"><h3>Journal récent</h3><a class="link" href="#/admin/audit">Tout</a></div><div class="list-rows" style="margin-top:6px">${recent.map((l) => `<div><span class="xs muted num" style="width:44px">${l.t}</span><div class="sp small"><b>${esc(l.who)}</b> · ${esc(l.what)}</div></div>`).join('')}</div></div>
          <div class="panel"><h3>Provenance des visiteurs</h3><div class="row" style="margin-top:12px;gap:20px;flex-wrap:wrap">${dn.svg}<div class="legend" style="flex-direction:column;gap:8px">${dn.legend}</div></div></div>
        </div>`),
    };
  }, { mode: 'admin' });

  /* =================================================================== CANDIDATURES */
  V.route(/^\/admin\/candidatures$/, () => ({
    title: 'Candidatures',
    html: shell('candidatures', `${head('Vérifier avant toute publication', 'Candidatures')}
      <div class="panel"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Candidate</th><th>Reçue</th><th>Étape</th><th>Identité</th><th>Médias</th><th>Entretien</th><th></th></tr></thead><tbody>
      ${A.candidates.map((c) => `<tr><td><div class="who">${c.id === 'c1' ? `<img src="${V.img('daria', 's')}" alt="">` : `<span class="avatar" style="width:36px;height:44px;border-radius:9px">${c.name[0]}</span>`}<div><b>${esc(c.name)}</b><div class="xs muted">${c.cat} · ${c.age} ans</div></div></div></td><td class="small">${c.d === -1 ? 'hier' : `il y a ${-c.d} j`}</td><td>${st.done[c.id] ? `<span class="badge ${st.done[c.id] === 'Validée' ? 'ok' : st.done[c.id] === 'Refusée' ? 'danger' : 'warn'}">${st.done[c.id]}</span>` : `<span class="badge ${c.prio === 1 ? 'g' : ''}">${c.step}</span>`}</td><td class="small">${c.kyc}</td><td class="small">${c.media}</td><td class="small">${c.interview}</td><td class="r"><a class="btn xs dark" href="#/admin/candidature/${c.id}"><span class="roll"><span>Ouvrir</span><span aria-hidden="true">Ouvrir</span></span></a></td></tr>`).join('')}
      </tbody></table></div></div>
      <p class="hint" style="margin-top:12px">${I('lock', 'sm')} Chaque consultation de dossier est inscrite au journal d’audit.</p>`),
  }), { mode: 'admin' });

  V.route(/^\/admin\/candidature\/(\w+)$/, (m) => {
    const c = A.candidates.find((x) => x.id === m[1]) || A.candidates[0];
    const R = V.S.reg || {};
    if (!st.viewed || st.viewed !== c.id) { st.viewed = c.id; log(`A consulté le dossier de vérification de « ${c.name} »`); }
    const isD = c.id === 'c1';
    const days = Array.from({ length: 6 }, (_, k) => D.addDays(k + 1)).filter((d) => d.getDay() !== 0);
    const itw = isD && R.slot ? `${days[R.day || 0].toLocaleDateString('fr-CH', { weekday: 'long', day: 'numeric', month: 'long' })} à ${R.slot} · ${R.mode === 'visio' ? 'visio' : 'bureau'}` : c.interview;
    return {
      title: 'Dossier · ' + c.name,
      html: shell('candidatures', `<a class="txt-btn" href="#/admin/candidatures" style="margin-top:20px">${I('arrow-left', 'sm')}Candidatures</a>
        ${head(`${c.cat} · reçue ${c.d === -1 ? 'hier' : `il y a ${-c.d} jours`}`, `${esc(c.name)}, ${c.age} ans`, st.done[c.id] ? `<span class="badge ${st.done[c.id] === 'Validée' ? 'ok' : 'warn'}">${st.done[c.id]}</span>` : '')}
        <div class="grid-2">
          <div class="panel"><div class="row-b"><h3>1. Âge et identité</h3><span class="badge ${c.kyc === 'Vérifiée' ? 'ok' : 'warn'}">${c.kyc}</span></div>
            <dl class="kv" style="margin-top:12px"><dt>Prestataire</dt><dd>Partenaire suisse de vérification</dd><dt>Document</dt><dd>Carte d’identité · authentique</dd><dt>Date de naissance</dt><dd>${c.kyc === 'Vérifiée' ? '•• •• 1999 (conservée)' : 'en attente'}</dd><dt>Majorité</dt><dd>${c.kyc === 'Vérifiée' ? 'Confirmée' : 'En attente'}</dd><dt>Copie de la pièce</dt><dd>Non conservée par Velours</dd></dl></div>
          <div class="panel"><div class="row-b"><h3>2. Concordance des médias</h3><span class="badge ${isD ? 'ok' : 'warn'}">${isD ? '98 %' : 'À vérifier'}</span></div>
            ${isD ? `<div class="cmpface" style="margin-top:12px"><figure><img src="img/p/daria-selfie-s.webp" onerror="this.src='img/p/daria-s.webp'" alt=""><figcaption><span class="badge dark">Selfie vivant</span></figcaption></figure><figure><img src="${V.img('daria', 's')}" alt=""><figcaption><span class="badge dark">Photo proposée</span></figcaption></figure></div><div class="score" style="margin-top:10px">${I('check')}Même personne · 98 % · aucun doublon sur le web</div>` : `<div class="cmpface blur" style="margin-top:12px"><figure style="background:var(--bg-3)"></figure><figure style="background:var(--bg-3)"></figure></div><p class="hint">Photos visibles uniquement par l’équipe de modération.</p>`}</div>
        </div>
        <div class="grid-2" style="margin-top:14px">
          <div class="panel"><div class="row-b"><h3>3. Entretien d’indépendance</h3><span class="badge">${esc(itw)}</span></div>
            <div class="stack" style="margin-top:12px">${['Répond elle-même, sans tiers présent', 'Fixe seule ses tarifs et ses horaires', 'Perçoit elle-même ses revenus', 'Connaît ses droits et les associations'].map((t, k) => V.opt('itw' + k, '1', t, '', { box: true, on: isD && k < 2 })).join('')}</div>
            <div style="margin-top:12px">${V.field('Compte rendu (confidentiel)', { type: 'textarea', value: isD ? 'Échange fluide en français et en russe. Travaille seule depuis deux ans, connaît Aspasie.' : '', max: 600 })}</div></div>
          <div class="panel"><h3>Signaux de risque</h3>
            ${c.id === 'c2' ? `<div class="callout danger" style="margin-top:12px">${I('alert')}<span><b>Signalement prioritaire reçu ce matin</b> (contrainte suspectée). Profil masqué à titre conservatoire. Procédure d’escalade : entretien en personne, puis BTPI si nécessaire.</span></div>` : c.id === 'c4' ? `<div class="callout gold" style="margin-top:12px">${I('users')}<span>Duo : la seconde personne n’est pas encore vérifiée. Aucune publication avant les deux vérifications.</span></div>` : `<div class="callout ok" style="margin-top:12px">${I('check')}<span>Aucun signal : numéro unique, photos absentes du web, aucun tiers dans les échanges.</span></div>`}
            <h3 style="margin-top:20px">Décision</h3><p class="small muted" style="margin:4px 0 12px">Motivée, communiquée à la candidate, inscrite au journal.</p>
            <div class="row wrapr">${V.btn('Valider et publier', { act: 'adm-decide', id: c.id, attrs: 'data-d="Validée"', cls: 'sm', arrow: 'check' })}${V.btn('Demander une correction', { act: 'adm-decide', id: c.id, attrs: 'data-d="Correction demandée"', cls: 'sm ghost' })}${V.btn('Refuser', { act: 'adm-decide', id: c.id, attrs: 'data-d="Refusée"', cls: 'sm danger-ghost' })}</div></div>
        </div>`),
    };
  }, { mode: 'admin' });

  /* =================================================================== MODÉRATION */
  V.route(/^\/admin\/moderation$/, () => ({
    title: 'Modération',
    html: shell('moderation', `${head('Avant publication · aide automatique puis revue humaine', 'Modération')}
      <div class="stack">${A.moderation.map((mo) => { const p = V.byId(mo.who); const done = st.mod[mo.id]; return `<div class="panel" id="mod-${mo.id}" style="${done ? 'opacity:.55' : ''}"><div class="row wrapr" style="align-items:flex-start;gap:18px">
        <div class="row" style="gap:8px">${mo.text ? `<img class="avatar sq lg" src="${V.img(p.photos[0], 's')}" alt="">` : `<img src="${V.img(p.photos[0], 's')}" alt="" style="width:96px;height:120px;object-fit:cover;border-radius:14px"><img src="${V.img(p.photos[0], 's')}" alt="" style="width:96px;height:120px;object-fit:cover;object-position:center 15%;transform:scale(1);border-radius:14px">`}</div>
        <div class="sp" style="min-width:220px"><div class="row"><b class="serif" style="font-size:22px;font-weight:400">${esc(p.name)}</b><span class="badge ${mo.flag ? 'warn' : ''}">${mo.what}</span></div>
          ${mo.text ? `<p class="serif ink2" style="margin-top:8px;font-size:17px">« ${esc(mo.text)} »</p>` : ''}
          <ul class="svc" style="margin-top:8px">${mo.auto.map((a) => `<li class="${a.includes('1 résultat') ? 'no' : ''}">${I(a.includes('1 résultat') ? 'alert' : 'check')}${a}</li>`).join('')}</ul></div>
        <div class="stack" style="min-width:180px">${done ? `<span class="badge ${done === 'Approuvé' ? 'ok' : 'danger'}">${done}</span>` : `${V.btn('Approuver', { act: 'adm-mod', id: mo.id, attrs: 'data-d="Approuvé"', cls: 'sm block', arrow: 'check' })}${V.btn('Refuser', { act: 'adm-mod', id: mo.id, attrs: 'data-d="Refusé"', cls: 'sm danger-ghost block' })}`}</div>
      </div></div>`; }).join('')}</div>`),
  }), { mode: 'admin' });

  /* =================================================================== SIGNALEMENTS */
  V.route(/^\/admin\/signalements$/, () => ({
    title: 'Signalements',
    html: shell('signalements', `${head('Traités sous 24 h · immédiatement si graves', 'Signalements')}
      <div class="panel"><div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>Motif</th><th>Cible</th><th>Reçu</th><th>Par</th><th>État</th><th></th></tr></thead><tbody>
      ${A.reports.map((r) => { const s = st.rep[r.id] || r.st; const t = V.byId(r.target); return `<tr><td><span class="prio p${r.prio}"></span></td><td><b>${r.motif}</b></td><td class="small">${t ? `<div class="who"><img src="${V.img(t.photos[0], 's')}" alt=""><span>${esc(t.name)}</span></div>` : esc(r.target)}</td><td class="small">${r.d === 0 ? 'aujourd’hui' : `il y a ${-r.d} j`}</td><td class="small muted">${r.by}</td><td><span class="badge ${s === 'Résolu' || s.startsWith('Clos') ? 'ok' : r.prio === 0 ? 'danger' : 'warn'}">${s}</span></td><td class="r"><button class="btn xs dark" data-act="adm-rep" data-id="${r.id}"><span class="roll"><span>Traiter</span><span aria-hidden="true">Traiter</span></span></button></td></tr>`; }).join('')}
      </tbody></table></div></div>
      <div class="callout" style="margin-top:12px">${I('lock')}<span>Les signalements et décisions sont conservés pour répondre aux réquisitions des autorités. Jamais communiqués à la personne signalée.</span></div>`),
  }), { mode: 'admin' });

  /* =================================================================== ESCORTES */
  V.route(/^\/admin\/escortes$/, () => ({
    title: 'Escortes',
    html: shell('escortes', `${head(`${V.PROFILES.length} profils`, 'Escortes')}
      <div class="panel"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Profil</th><th>Catégorie</th><th>Statut</th><th>Formule</th><th>Contrôle médias</th><th>État</th><th></th></tr></thead><tbody>
      ${V.PROFILES.map((p) => { const due = p.verif.media + 90; return `<tr><td><div class="who"><img src="${V.img(p.photos[0], 's')}" alt=""><div><b>${esc(p.name)}</b><div class="xs muted">${V.communeTxt(p.commune)}</div></div></div></td><td class="small">${p.kind || (V.CATS.find((c) => c.id === p.cat) || {}).label}</td><td>${V.statusPill(p, true)}</td><td class="small">${p.plan === 'duo' ? 'Duo' : (V.PLANS.find((x) => x.id === p.plan) || {}).name}${p.verif.id >= -61 ? '<div class="xs gold">offre de lancement</div>' : ''}</td><td class="small ${due < 15 ? 'danger b' : ''}">dans ${due} j</td><td>${V.visible(p) ? '<span class="badge ok">Publiée</span>' : '<span class="badge">Masquée</span>'}</td><td class="r"><button class="icon-btn" data-act="open" data-id="${p.id}" aria-label="Voir">${I('eye')}</button></td></tr>`; }).join('')}
      </tbody></table></div></div>`),
  }), { mode: 'admin' });

  /* =================================================================== FACTURATION */
  V.route(/^\/admin\/facturation$/, () => {
    const S = subs();
    const tot = Object.values(S.by).reduce((a, b) => a + b, 0);
    return {
      title: 'Facturation',
      html: shell('facturation', `${head('Forfaits uniquement · aucune commission', 'Facturation')}
        <div class="kpis"><div class="kpi dark"><span class="l">Revenu récurrent mensuel</span><span class="v">${V.chf(S.mrr)}</span><span class="xs" style="color:#d2c6de">abonnements payants</span></div><div class="kpi"><span class="l">Offre de lancement</span><span class="v">${S.launch}</span><span class="xs muted">profils en mois offerts</span></div><div class="kpi"><span class="l">Mises en avant · mois</span><span class="v">${V.chf(870)}</span><span class="xs muted">30 jours vendus</span></div><div class="kpi"><span class="l">Échecs de paiement</span><span class="v">1</span><span class="xs muted">relance envoyée · 3 j de grâce</span></div></div>
        <div class="grid-2" style="margin-top:14px">
          <div class="panel"><h3>Abonnements par formule</h3><div class="bars" style="margin-top:14px">${[['Présence', S.by.essentiel], ['Visibilité', S.by.visibilite], ['Accompagnement', S.by.premium], ['Duo / couple', S.by.duo]].map(([l, n], k) => `<div class="bar-row"><span>${l}</span><span class="tr"><i class="${k % 2 ? 'g' : ''}" style="width:${(n / tot) * 100}%"></i></span><b class="r num">${n}</b></div>`).join('')}</div></div>
          <div class="panel"><h3>Codes promotionnels</h3><div class="tbl-wrap"><table class="tbl" style="min-width:420px;margin-top:8px"><thead><tr><th>Code</th><th>Avantage</th><th class="r">Utilisations</th></tr></thead><tbody>${A.promos.map((p) => `<tr><td class="num b">${p.code}</td><td class="small">${p.what}${p.until ? `<div class="xs muted">jusqu’au ${D.fmtShort(D.addDays(p.until))}</div>` : ''}</td><td class="r num">${p.used}${p.max ? ' / ' + p.max : ''}</td></tr>`).join('')}</tbody></table></div>${V.btn('Créer un code', { act: 'adm-promo', cls: 'sm ghost', arrow: 'plus' })}</div>
        </div>`),
    };
  }, { mode: 'admin' });

  /* =================================================================== MISES EN AVANT */
  V.route(/^\/admin\/mises-en-avant$/, () => {
    const cats = ['Femmes', 'Femmes trans', 'Hommes', 'Couples et duos'];
    const lvl = (r, k) => ['', 'f1', 'f2', 'f3'][(r * 7 + k * 3) % 4];
    return {
      title: 'Mises en avant',
      html: shell('mises-en-avant', `${head(`${V.FEATURED.slotsPerDay} emplacements par jour et par catégorie`, 'Mises en avant')}
        <div class="panel"><h3>Occupation · 14 jours</h3><div style="overflow-x:auto;margin-top:12px"><div class="occ" style="min-width:640px"><span></span>${Array.from({ length: 14 }, (_, k) => `<span class="h">${D.addDays(k).getDate()}</span>`).join('')}${cats.map((c, r) => `<span class="lbl">${c}</span>${Array.from({ length: 14 }, (_, k) => `<span class="c ${lvl(r, k)}"></span>`).join('')}`).join('')}</div></div>
          <div class="legend" style="margin-top:12px"><span><i style="background:var(--bg-3)"></i>Libre</span><span><i style="background:color-mix(in srgb,var(--violet) 35%,var(--bg-3))"></i>1–2 pris</span><span><i style="background:color-mix(in srgb,var(--violet) 65%,var(--bg-3))"></i>3–5 pris</span><span><i style="background:var(--violet)"></i>Complet</span></div></div>
        <div class="grid-2" style="margin-top:14px"><div class="panel"><h3>Tarifs</h3><dl class="kv" style="margin-top:12px"><dt>Jour</dt><dd>CHF ${V.FEATURED.perDay}</dd><dt>Semaine</dt><dd>CHF ${V.FEATURED.perWeek}</dd><dt>Inclus</dt><dd>2 j (Visibilité), 6 j (Accompagnement)</dd><dt>Règle</dt><dd>Étiquetée, rotation équitable, filtres respectés</dd></dl></div>
          <div class="panel"><h3>Distinctions non achetables</h3><ul class="svc" style="margin-top:10px">${['Nouvelle arrivée (moins de 14 jours)', 'Profil complet', 'Photos vérifiées récemment', 'Très demandée cette semaine (ajouts en sélection)'].map((x) => `<li>${I('check')}${x}</li>`).join('')}</ul></div></div>`),
    };
  }, { mode: 'admin' });

  /* =================================================================== RÉFÉRENTIELS */
  V.route(/^\/admin\/referentiels$/, () => ({
    title: 'Référentiels',
    html: shell('referentiels', `${head('Traduits une fois, identiques dans toutes les langues', 'Référentiels')}
      <div class="stack-lg">
        <div class="panel"><div class="row-b"><h3>Services (catalogue fermé)</h3><span class="small muted">${Object.keys(V.SERVICES).length} entrées · 8 langues</span></div><div class="chips" style="margin-top:12px" id="refSvc">${Object.values(V.SERVICES).map((s) => `<span class="chip sm x">${s}<button data-act="ref-del" aria-label="Retirer">${I('x', 'sm')}</button></span>`).join('')}</div><div class="row" style="margin-top:12px;max-width:520px"><div class="sp">${V.field('Nouveau service', { name: 'newsvc' })}</div>${V.btn('Ajouter', { act: 'ref-add', cls: 'sm' })}</div></div>
        <div class="grid-2"><div class="panel"><h3>Origines (auto-déclarées)</h3><div class="chips" style="margin-top:12px">${V.ORIGINS.map((o) => `<span class="chip sm">${o}</span>`).join('')}</div><p class="hint">Décision du 19.10 : affichée et filtrable, facultative, consentement distinct.</p></div>
        <div class="panel"><h3>Quartiers</h3><div class="chips" style="margin-top:12px">${V.COMMUNES.map((c) => `<span class="chip sm">${c.label}</span>`).join('')}</div></div></div>
        <div class="panel"><h3>Motifs de signalement</h3><div class="chips" style="margin-top:12px">${['Contrainte ou traite suspectée · P0', 'Personne qui semble mineure · P0', 'Faux profil · P1', 'Arnaque · P2', 'Comportement dangereux · P1', 'Autre · P2'].map((m) => `<span class="chip sm">${m}</span>`).join('')}</div></div>
      </div>`),
  }), { mode: 'admin' });

  /* =================================================================== STATISTIQUES */
  V.route(/^\/admin\/stats$/, () => {
    const dn = V.donut([['Mobile', 78], ['Ordinateur', 18], ['Tablette', 4]]);
    return {
      title: 'Statistiques',
      html: shell('stats', `${head('Mesure d’audience sans cookie, hébergée en Suisse', 'Statistiques')}
        <div class="kpis"><div class="kpi"><span class="l">Visites · 7 j</span><span class="v">${V.nf(A.traffic.visits7)}</span>${V.spark(visits.slice(-7))}</div><div class="kpi"><span class="l">Fiches ouvertes</span><span class="v">${V.nf(9412)}</span><span class="d">+11 %</span></div><div class="kpi"><span class="l">Comparaisons</span><span class="v">${V.nf(1206)}</span><span class="d">+27 %</span></div><div class="kpi"><span class="l">Clics de contact</span><span class="v">${V.nf(2318)}</span><span class="d">+9 %</span></div></div>
        <div class="grid-2" style="margin-top:14px">
          <div class="panel"><h3>Filtres les plus utilisés</h3><p class="small muted">Pour orienter le SEO et les offres.</p><div class="bars" style="margin-top:14px">${A.topFilters.map(([l, v], k) => `<div class="bar-row" style="grid-template-columns:170px 1fr 48px"><span class="small">${l}</span><span class="tr"><i class="${k % 2 ? 'g' : ''}" style="width:${v * 2}%"></i></span><b class="r num">${v} %</b></div>`).join('')}</div></div>
          <div class="panel"><h3>Appareils</h3><div class="row" style="margin-top:12px;gap:20px;flex-wrap:wrap">${dn.svg}<div class="legend" style="flex-direction:column;gap:8px">${dn.legend}</div></div>
            <h3 style="margin-top:18px">Parcours</h3><div class="funnel" style="margin-top:12px"><div><span>Visites</span><b>${V.nf(A.traffic.visits7)}</b></div><div><span>Fiches ouvertes</span><b>9’412</b></div><div><span>Ajouts en sélection</span><b>3’870</b></div><div><span>Contacts</span><b>2’318</b></div></div></div>
        </div>
        <div style="margin-top:14px">${V.btn('Exporter en CSV', { act: 'adm-csv', cls: 'sm ghost', arrow: 'download' })}</div>`),
    };
  }, { mode: 'admin' });

  /* =================================================================== JOURNAL D'AUDIT */
  V.route(/^\/admin\/audit$/, () => {
    const rows = [...st.log.map((l) => ({ d: 0, t: new Date(l.ts).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' }), who: l.who, what: l.what })), ...A.audit];
    return {
      title: 'Journal d’audit',
      html: shell('audit', `${head('Toutes les actions sensibles de l’équipe', 'Journal d’audit')}
        <div class="panel"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Date</th><th>Auteur</th><th>Action</th></tr></thead><tbody>${rows.map((r) => `<tr><td class="small num">${r.d === 0 ? 'Aujourd’hui' : 'Hier'} · ${r.t}</td><td class="small b">${esc(r.who)}</td><td class="small">${esc(r.what)}</td></tr>`).join('')}</tbody></table></div></div>`),
    };
  }, { mode: 'admin' });

  /* =================================================================== PARAMÈTRES */
  V.route(/^\/admin\/parametres$/, () => ({
    title: 'Paramètres',
    html: shell('parametres', `${head('Règles de la plateforme', 'Paramètres et équipe')}
      <div class="grid-2"><div class="panel stack-lg">
        ${V.field('Expiration de « Disponible maintenant »', { type: 'select', value: '3 h', options: ['2 h', '3 h', '4 h'] })}
        ${V.field('Contrôle médias', { type: 'select', value: 'Tous les 90 jours', options: ['Tous les 60 jours', 'Tous les 90 jours', 'Tous les 120 jours'] })}
        ${V.field('Entretien d’indépendance', { type: 'select', value: 'Tous les 6 mois', options: ['Tous les 3 mois', 'Tous les 6 mois', 'Tous les 12 mois'] })}
        ${V.field('Délai de grâce avant suspension', { type: 'select', value: '14 jours', options: ['7 jours', '14 jours', '30 jours'] })}
        ${V.field('Passages « Disponible maintenant » par jour', { type: 'select', value: '6', options: ['4', '6', '8'] })}
        ${V.field('Catégorie affichée par défaut', { type: 'select', value: 'Toutes', options: ['Toutes', 'Femmes', 'Femmes trans', 'Hommes', 'Couples et duos'] })}
      </div>
      <div class="panel"><h3>Équipe et rôles</h3><div class="list-rows" style="margin-top:8px">${[['A. R.', 'Administrateur', 'Tous les droits'], ['S. B.', 'Modératrice', 'Candidatures, médias, signalements'], ['L. M.', 'Support', 'Répond aux escortes, sans accès aux vérifications']].map(([n, r, d]) => `<div><span class="avatar">${n[0]}</span><div class="sp"><b>${n} · ${r}</b><div class="small muted">${d}</div></div><span class="badge ok">2FA</span></div>`).join('')}</div>${V.btn('Inviter un membre', { act: 'adm-invite', cls: 'sm ghost', arrow: 'plus' })}</div></div>`),
  }), { mode: 'admin' });

  /* ---------- Actions du back-office ---------- */
  V.admDecide = async (id, d) => {
    const c = A.candidates.find((x) => x.id === id);
    const ok = await V.confirm({ title: `${d} · ${c.name}`, text: d === 'Validée' ? 'Le profil sera publié immédiatement, avec la date des trois contrôles. La candidate reçoit une confirmation.' : 'La candidate reçoit un message motivé et peut corriger son dossier.', ok: d === 'Refusée' ? 'Refuser' : 'Confirmer', danger: d === 'Refusée' });
    if (!ok) return;
    st.done[id] = d; log(`${d} : candidature « ${c.name} »`);
    V.toast(`${c.name} · ${d.toLowerCase()}. Inscrit au journal d’audit.`, { icon: 'check' });
    V.render();
  };
  V.admMod = (id, d) => {
    const mo = A.moderation.find((x) => x.id === id);
    st.mod[id] = d; log(`${d} : ${mo.what} de « ${V.byId(mo.who).name} »`);
    const el = $('#mod-' + id); if (el) el.style.opacity = '.55';
    V.toast(`${d} · ${V.byId(mo.who).name}.`, { icon: d === 'Approuvé' ? 'check' : 'x' });
    setTimeout(V.render, 400);
  };
  V.admRep = (id) => {
    const r = A.reports.find((x) => x.id === id);
    const t = V.byId(r.target);
    const sh = V.sheet.open({
      title: r.motif,
      body: `<dl class="kv"><dt>Cible</dt><dd>${t ? esc(t.name) : esc(r.target)}</dd><dt>Reçu</dt><dd>${r.d === 0 ? 'aujourd’hui' : `il y a ${-r.d} jours`}</dd><dt>Par</dt><dd>${r.by}</dd><dt>Priorité</dt><dd>${['Absolue', 'Haute', 'Normale'][r.prio]}</dd><dt>État</dt><dd>${st.rep[r.id] || r.st}</dd></dl>
        <div class="stack" style="margin-top:16px">${V.opt('ract', 'mask', 'Masquer à titre conservatoire', 'Effet immédiat, réversible')}${V.opt('ract', 'contact', 'Contacter la personne', 'Message confidentiel de l’équipe')}${V.opt('ract', 'police', 'Transmettre à la police (BTPI)', 'Procédure d’escalade écrite', { cls: 'danger' })}${V.opt('ract', 'close', 'Clore le signalement', 'Avec motif, inscrit au journal')}</div>`,
      foot: V.btn('Appliquer', { cls: 'sm block', attrs: 'data-apply' }),
    });
    $('[data-apply]', sh).onclick = () => {
      const a = $('input[name="ract"]:checked', sh); if (!a) return V.toast('Choisissez une action.', { icon: 'info' });
      const lbl = { mask: 'Masqué à titre conservatoire', contact: 'Personne contactée', police: 'Transmis à la BTPI', close: 'Clos' }[a.value];
      st.rep[id] = lbl; log(`Signalement « ${r.motif} » : ${lbl.toLowerCase()}`);
      V.sheet.close(); V.toast(lbl + '. Inscrit au journal.', { icon: 'check' }); V.render();
    };
  };
})(window.V);
