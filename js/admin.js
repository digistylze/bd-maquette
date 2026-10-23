/* BD : back-office complet de la maquette (adresse séparée et double authentification en production).
   Données fictives : js/admin-data.js. Toutes les dates sont affichées à l'heure de Genève. Chaque liste s'exporte en CSV. */
(function (V) {
  'use strict';
  const { $, $$, i: I, esc } = V;
  const A = V.ADM, G = V.gva;
  const DAY = 864e5;
  V.L.adm2 = V.L.adm2 || {};
  const st = V.L.adm2;
  ['log', 'vault'].forEach((k) => { if (!Array.isArray(st[k])) st[k] = []; });
  ['notes', 'masked', 'cand', 'mod', 'rep', 'ctl', 'params', 'pro', 'acc', 'tab', 'bank', 'inv'].forEach((k) => { if (!st[k] || typeof st[k] !== 'object') st[k] = {}; });
  st.period = st.period || '30';
  const ME = { n: 'A. R.', role: 'Administration' };
  const save = () => V.save();

  /* ---------------------------------------------------------------- outils */
  const chf = V.chf, nf = V.nf;
  const inDays = (d) => Math.round((d - Date.now()) / DAY);
  const dueTxt = (d) => { const n = inDays(d); return n < 0 ? `en retard de ${-n} j` : n === 0 ? 'aujourd’hui' : `dans ${n} j`; };
  const pct = (a, b) => (b ? Math.round(((a - b) / b) * 100) : null);
  const initials = (n) => n.replace(/[«»"]/g, '').split(/[\s&]+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const av = (p, cls = '') => { const src = A.photo(p); return src ? `<img class="adm-av ${cls}" src="${src}" alt="" loading="lazy">` : `<span class="adm-av ini ${cls}">${esc(initials(p.name || '?'))}</span>`; };
  const who = (p, sub) => `<div class="adm-who">${av(p)}<div><b>${esc(p.name)}</b>${sub ? `<div class="xs muted">${sub}</div>` : ''}</div></div>`;
  const badge = (cls, l) => `<span class="badge ${cls}">${l}</span>`;
  const kpi = (l, v, sub = '', cls = '') => `<div class="kpi ${cls}"><span class="l">${l}</span><span class="v">${v}</span>${sub}</div>`;
  const delta = (d, inverse) => (d == null ? '<span class="xs muted">pas de période précédente</span>' : `<span class="d${(inverse ? d > 0 : d < 0) ? ' dn' : ''}">${d > 0 ? '+' : ''}${d} % <span class="muted" style="font-weight:500">vs période précédente</span></span>`);
  const bars = (items, o = {}) => { const max = Math.max(...items.map((x) => x[1]), 1); return `<div class="bars">${items.map(([l, v, sfx], k) => `<div class="bar-row" style="grid-template-columns:${o.w || 150}px 1fr 64px"><span class="small">${l}</span><span class="tr"><i class="${k % 2 ? 'g' : ''}" style="width:${(v / max) * 100}%"></i></span><b class="r num small">${sfx === undefined ? nf(v) : sfx}</b></div>`).join('')}</div>`; };
  const STB = { actif: ['ok', 'Actif'], pause: ['', 'En pause'], attente: ['warn', 'En attente'], suspendu: ['danger', 'Suspendu'] };
  const PAYB = { 'à jour': ['ok', 'À jour'], facture: ['v', 'Sur facture'], lancement: ['g', 'Offre de lancement'], impayé: ['danger', 'Impayé'] };
  const proSt = (p) => st.pro[p.id] || p.status;
  const candSt = (c) => (st.cand[c.id] || {}).status || c.status;
  const modSt = (m) => (st.mod[m.id] || {}).state || m.state;
  const modDec = (m) => (st.mod[m.id] || {}).decision || m.decision;
  const repSt = (r) => (st.rep[r.id] || {}).status || r.status;
  const repSan = (r) => (st.rep[r.id] || {}).sanction || r.sanction;
  const repHist = (r) => [...r.history, ...((st.rep[r.id] || {}).hist || []).map((h) => ({ ...h, at: new Date(h.at) }))];
  const ctlOf = (id) => { const s = st.ctl[id]; if (s) return { ...s, when: new Date(s.when), from: s.from ? new Date(s.from) : null }; return A.PLANNED.find((x) => x.id === id) || null; };
  const name = (id) => (A.byId(id) || {}).name || id;

  /* Journal d'audit : en ajout seul, empreinte chaînée */
  const audit = () => {
    let prev = A.AUDIT[0] ? A.AUDIT[0].h : '00000000';
    const mine = st.log.map((l, k) => ({ ...l, at: new Date(l.at), n: 4100 + A.AUDIT.length + k })).map((l) => { const h = A.hash(prev + l.who + l.what + l.obj + l.at.getTime()); prev = h; return { ...l, h }; });
    return [...mine.reverse(), ...A.AUDIT];
  };
  const log = (what, obj = '') => { st.log.push({ at: Date.now(), who: ME.n, role: ME.role, what, obj }); save(); };

  /* ---------------------------------------------------------------- listes : filtres, recherche, export CSV */
  const list = (o) => {
    const rows = o.rows;
    const fl = o.filters ? `<div class="chips al-f">${o.filters.map(([v, l], k) => `<button type="button" class="chip sm${k ? '' : ' on'}" data-a="flt" data-v="${v}">${l} <span class="n">${v ? rows.filter((r) => (r._f || '').split('|').includes(v)).length : rows.length}</span></button>`).join('')}</div>` : '';
    return `<section class="panel adm-list" data-list="${o.id}" data-title="${esc(o.title)}">
      <div class="al-head"><div><h3>${o.title} <span class="al-n">${rows.length}</span></h3>${o.sub ? `<p class="small muted">${o.sub}</p>` : ''}</div>
        <div class="al-tools">${o.search ? `<label class="al-search">${I('search', 'sm')}<input type="search" placeholder="${o.search}" data-q aria-label="${o.search}"></label>` : ''}${o.tools || ''}<button type="button" class="al-csv" data-a="csv" title="Exporter la liste affichée en CSV">${I('download', 'sm')}CSV</button></div></div>
      ${fl}
      <div class="tbl-wrap"><table class="tbl"><thead><tr>${o.cols.map((c) => `<th class="${c.cls || ''}${c.nocsv ? ' nocsv' : ''}">${c.l}</th>`).join('')}</tr></thead><tbody>
      ${rows.map((r) => `<tr data-f="${esc(r._f || '')}"${r._href ? ` data-href="${r._href}" class="link-row"` : ''}>${o.cols.map((c) => {
        const html = c.r ? c.r(r) : esc(String(r[c.k] == null ? '' : r[c.k]));
        const csv = c.c ? c.c(r) : null;
        return `<td class="${c.cls || ''}${c.nocsv ? ' nocsv' : ''}"${csv != null ? ` data-c="${esc(String(csv))}"` : ''}>${html}</td>`;
      }).join('')}</tr>`).join('')}
      </tbody></table></div>
      <p class="al-empty small muted"${rows.length ? ' hidden' : ''}>Aucune ligne pour ce filtre.</p>
      ${o.note ? `<p class="hint">${o.note}</p>` : ''}
    </section>`;
  };
  const applyFilter = (sec) => {
    const v = sec.dataset.fv || '', q = (sec.dataset.q || '').toLowerCase().trim();
    let n = 0;
    $$('tbody tr', sec).forEach((tr) => { const ok = (!v || (tr.dataset.f || '').split('|').includes(v)) && (!q || tr.textContent.toLowerCase().includes(q)); tr.hidden = !ok; if (ok) n++; });
    $('.al-empty', sec).hidden = n > 0; $('.al-n', sec).textContent = n;
  };
  const cell = (s) => { s = String(s).replace(/\s+/g, ' ').trim(); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const download = (fname, content) => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' })); a.download = fname; document.body.appendChild(a); a.click(); a.remove();
  };
  const exportCsv = (sec) => {
    const tbl = $('table', sec); const ths = [...tbl.tHead.rows[0].cells]; const keep = ths.map((th) => !th.classList.contains('nocsv'));
    const head = ths.filter((_, k) => keep[k]).map((th) => cell(th.textContent));
    const rows = [...tbl.tBodies[0].rows].filter((tr) => !tr.hidden).map((tr) => [...tr.cells].filter((_, k) => keep[k]).map((td) => cell(td.dataset.c != null ? td.dataset.c : td.textContent)));
    const fname = `bd-${sec.dataset.list}-${G.dayKey(new Date())}.csv`;
    download(fname, '﻿' + [head, ...rows].map((r) => r.join(';')).join('\r\n'));
    log('Export CSV', `${sec.dataset.title} · ${rows.length} ligne${rows.length > 1 ? 's' : ''}`);
    V.toast(`« ${fname} » téléchargé (${rows.length} lignes). Export inscrit au journal.`, { icon: 'download', ms: 3500 });
  };

  /* Onglets dans une page */
  const tabs = (k, items) => {
    const cur = items.some(([v]) => v === st.tab[k]) ? st.tab[k] : items[0][0];
    return { cur, bar: `<div class="adm-tabs" role="tablist">${items.map(([v, l, n]) => `<button type="button" role="tab" data-a="tab" data-k="${k}" data-v="${v}" class="${v === cur ? 'on' : ''}">${l}${n != null ? ` <span class="n">${n}</span>` : ''}</button>`).join('')}</div>`, pane: (v, html) => `<div class="adm-pane" data-pane="${k}:${v}"${v === cur ? '' : ' hidden'}>${html}</div>` };
  };

  /* ---------------------------------------------------------------- coque : menu latéral, sous-menu mobile, horloge de Genève */
  const NAV = [
    ['Pilotage', [['', 'layout', 'Tableau de bord'], ['stats', 'chart', 'Statistiques'], ['retours', 'quote', 'Retours privés']]],
    ['Admission', [['candidatures', 'id-card', 'Candidatures'], ['import', 'upload', 'Profils préparés']]],
    ['Professionnelles', [['pros', 'users', 'Professionnelles'], ['comptes', 'user', 'Comptes']]],
    ['Contrôle', [['moderation', 'shield', 'Modération'], ['signalements', 'flag', 'Signalements'], ['coffre', 'lock', 'Coffre des justificatifs']]],
    ['Argent', [['facturation', 'banknote', 'Facturation'], ['mises-en-avant', 'sparkles', 'Mises en avant et parrainage']]],
    ['Plateforme', [['referentiels', 'list', 'Référentiels et villes'], ['messages', 'mail', 'Messages'], ['parametres', 'settings', 'Paramètres'], ['roles', 'key', 'Rôles et journal']]],
  ];
  const OPEN = ['reçu', 'à compléter', 'en vérification'];
  const pend = () => ({
    candidatures: A.CAND.filter((c) => OPEN.includes(candSt(c))).length,
    moderation: A.MOD.filter((m) => modSt(m) === 'à revoir').length,
    signalements: A.REP.filter((r) => !['Clos'].includes(repSt(r)) && repSt(r) !== 'Sanction appliquée').length,
  });
  const shell = (cur, inner) => {
    const pd = pend();
    return `<div class="wrap adm"><div class="app-shell">
      <aside class="side adm-side"><div class="who"><span class="avatar" style="width:46px;height:56px;border-radius:12px;background:var(--black);color:var(--gold-2)">AR</span><div><b>A. R.</b><span>Administration · 2FA active</span></div></div>
        <nav>${NAV.map(([g, items]) => `<div class="grp">${g}</div>${items.map(([k, ic, l]) => `<a href="#/admin${k ? '/' + k : ''}" class="${cur === k ? 'on' : ''}">${I(ic)}<span>${l}</span>${pd[k] ? `<span class="bdg">${pd[k]}</span>` : ''}</a>`).join('')}`).join('')}</nav>
        <p class="hint adm-side-note">${I('lock', 'sm')}Données fictives de démonstration. Heures de Genève.</p></aside>
      <div class="adm-main"><div class="subnav"><div class="chips scroll">${NAV.flatMap(([, it]) => it).map(([k, , l]) => `<a class="chip sm${cur === k ? ' on' : ''}" href="#/admin${k ? '/' + k : ''}">${l}${pd[k] ? ` · ${pd[k]}` : ''}</a>`).join('')}</div></div>${inner}</div>
    </div></div>`;
  };
  const head = (eyebrow, title, right = '') => `<div class="dash-head"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1></div><div class="row wrapr adm-hr">${right}<span class="mode-pill adm-tz" title="Fuseau Europe/Zurich">${I('clock', 'sm')}Genève · <b data-clock>${G.now()}</b></span></div></div>`;
  const back = (href, l) => `<a class="txt-btn adm-back" href="${href}">${I('arrow-left', 'sm')}${l}</a>`;
  const route = (re, fn) => V.route(re, fn, { mode: 'admin', keepScroll: true });
  setInterval(() => $$('[data-clock]').forEach((el) => { el.textContent = G.now(); }), 20000);

  /* ================================================================ TABLEAU DE BORD (Q42-Q45) */
  const PERIODS = [['7', '7 jours'], ['30', '30 jours'], ['90', 'Trimestre'], ['365', '12 mois']];
  const sumS = (k, from, to) => A.SERIES.filter((x) => x.d >= from && x.d < to).reduce((a, x) => a + x[k], 0);
  const periodSel = () => `<div class="adm-period" role="group" aria-label="Période">${PERIODS.map(([v, l]) => `<button type="button" data-a="period" data-v="${v}" class="${st.period === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  route(/^\/admin$/, () => {
    const N = +st.period;
    const P = A.PROS.map((p) => ({ ...p, s: proSt(p) }));
    const n = (s) => P.filter((p) => p.s === s).length;
    const cur = (k) => sumS(k, 0, N), prev = (k) => sumS(k, N, 2 * N);
    const subsN = P.filter((p) => p.s === 'actif' && p.pay !== 'lancement').length;
    const mrr = P.filter((p) => ['actif', 'pause'].includes(p.s) && p.pay !== 'lancement').reduce((a, p) => a + p.price, 0);
    const unpaid = P.filter((p) => p.pay === 'impayé');
    const camp = A.CAMP.filter((c) => c.state === 'En cours');
    const step = N <= 30 ? 1 : N <= 90 ? 3 : 7;
    const ser = (from) => { const out = []; for (let d = from + N - 1; d >= from; d -= step) { let v = 0; for (let j = 0; j < step; j++) { const x = A.SERIES.find((s) => s.d === d - j); v += x ? x.rev : 0; } out.push(v); } return out; };
    const curS = ser(0), prevS = ser(N);
    const queue = [
      ['#/admin/candidatures', 'Candidatures à traiter', 'Reçues, à compléter, en vérification', pend().candidatures, 'v'],
      ['#/admin/moderation', 'Contenus à modérer', `Dont ${A.MOD.filter((m) => m.prio && modSt(m) === 'à revoir').length} alertes prioritaires de l’IA`, pend().moderation, 'g'],
      ['#/admin/signalements', 'Signalements ouverts', `${A.REP.filter((r) => r.u === 0 && repSt(r) !== 'Clos').length} urgents · file privée`, pend().signalements, 'danger'],
      ['#/admin/pros', 'Contrôles à confirmer', 'Dates proposées ou reportées', A.PROS.map((p) => ctlOf(p.id)).filter((c) => c && c.state !== 'confirmé').length, 'warn'],
      ['#/admin/facturation', 'Impayés', `${chf(unpaid.reduce((a, p) => a + p.price, 0))} · relances en cours`, unpaid.length, 'danger'],
    ];
    const masks = [...Object.entries(st.masked).filter(([, m]) => m).map(([id, m]) => ({ at: new Date(m.at), name: name(id), why: m.why, by: m.by })), { at: G.ago(44), name: 'Mélodie (dossier)', why: 'Signalement urgent S-2026-0214', by: 'A. R.' }, { at: G.ago(1500), name: 'Leïla', why: 'Photos non conformes (S-2026-0212)', by: 'S. B.' }].sort((a, b) => b.at - a.at);
    return {
      title: 'Back-office',
      html: shell('', `${head('Back-office · démonstration', 'Tableau de bord', periodSel())}
        <h2 class="adm-h2">Profils</h2>
        <div class="kpis">
          ${kpi('Profils actifs', n('actif'), `<span class="xs muted">${P.filter((p) => p.s === 'actif' && p.city === 'Genève').length} à Genève · ${n('suspendu')} suspendus</span>`)}
          ${kpi('En pause', n('pause'), '<span class="xs muted">absences annoncées par les professionnelles</span>')}
          ${kpi('En attente', n('attente'), '<span class="xs muted">validation de la professionnelle ou ville pas encore ouverte</span>')}
          ${kpi('Disponibles maintenant', P.filter((p) => p.now && p.s === 'actif').length, '<span class="xs muted">statut valable 60 min</span>', 'dark')}
        </div>
        <h2 class="adm-h2">Mouvements · ${PERIODS.find(([v]) => v === st.period)[1]}</h2>
        <div class="kpis">
          ${kpi('Inscriptions', cur('signups'), delta(pct(cur('signups'), prev('signups'))))}
          ${kpi('Validations', cur('valid'), delta(pct(cur('valid'), prev('valid'))))}
          ${kpi('Suspensions', cur('susp'), delta(pct(cur('susp'), prev('susp')), true))}
          ${kpi('Visites', nf(cur('visits')), delta(pct(cur('visits'), prev('visits'))))}
        </div>
        <h2 class="adm-h2">Argent · ${PERIODS.find(([v]) => v === st.period)[1]}</h2>
        <div class="kpis">
          ${kpi('Abonnements payants', subsN, `<span class="xs muted">${chf(mrr)} par mois · ${P.filter((p) => p.pay === 'lancement').length} en offre de lancement</span>`)}
          ${kpi('Recettes', chf(cur('rev')), delta(pct(cur('rev'), prev('rev'))), 'dark')}
          ${kpi('Impayés', chf(unpaid.reduce((a, p) => a + p.price, 0)), `<span class="xs danger b">${unpaid.length} professionnelles · relances en cours</span>`)}
          ${kpi('Campagnes en cours', camp.length, `<span class="xs muted">${A.CAMP.filter((c) => c.state === 'Programmée').length} programmées · ${nf(camp.reduce((a, c) => a + c.credits, 0))} crédits</span>`)}
        </div>
        <div class="grid-2" style="margin-top:14px">
          <div class="panel"><h3>Recettes</h3><div class="legend" style="margin:6px 0 4px"><span><i style="background:var(--violet)"></i>Période choisie</span><span><i style="background:var(--gold)"></i>Période précédente</span></div>${V.lineChart(curS, { h: 220, avg: prevS, labels: [[0, `il y a ${N} j`], [curS.length - 1, 'Aujourd’hui']], aria: 'Recettes de la période comparées à la période précédente' })}</div>
          <div class="panel"><h3>À traiter</h3><div class="list-rows" style="margin-top:6px">${queue.map(([h, t, s, nb, c]) => `<a href="${h}"><div class="sp"><b>${t}</b><div class="small muted">${s}</div></div><span class="badge ${c}">${nb}</span></a>`).join('')}</div></div>
        </div>
        <div class="stack" style="margin-top:14px">
          ${list({ id: 'alertes-masquage', title: 'Alertes de masquage', sub: 'Chaque masquage déclenche une alerte à l’équipe et à la professionnelle.', cols: [{ l: 'Date', r: (r) => `<span class="small num">${G.rel(r.at)}</span>`, c: (r) => G.dt(r.at) }, { l: 'Profil', k: 'name', cls: 'b' }, { l: 'Motif', k: 'why', cls: 'small' }, { l: 'Par', k: 'by', cls: 'small muted' }], rows: masks })}
          ${list({ id: 'journal-recent', title: 'Journal récent', tools: '<a class="link small" href="#/admin/roles">Tout le journal</a>', cols: [{ l: 'Heure', r: (r) => `<span class="small num">${G.rel(r.at)}</span>`, c: (r) => G.dt(r.at) }, { l: 'Qui', r: (r) => `<b class="small">${esc(r.who)}</b>`, c: (r) => r.who }, { l: 'Action', r: (r) => `<span class="small">${esc(r.what)} · <span class="muted">${esc(r.obj)}</span></span>`, c: (r) => `${r.what} · ${r.obj}` }], rows: audit().slice(0, 7) })}
        </div>`),
    };
  });

  /* ================================================================ CANDIDATURES ET ADMISSION (Q05-Q08, Q15) */
  const CST = { reçu: ['', 'Reçu'], 'à compléter': ['warn', 'À compléter'], 'en vérification': ['v', 'En vérification'], accepté: ['ok', 'Accepté'], refusé: ['danger', 'Refusé'] };
  const candStep = (c) => { const s = st.cand[c.id]; return s && s.status === 'accepté' ? Math.max(c.step, 2) : c.step; };
  const stepper = (c, full) => `<ol class="adm-steps${full ? ' full' : ''}">${A.STEPS.map((l, k) => { const s = candStep(c), refused = candSt(c) === 'refusé'; const cls = refused && k === s ? 'ko' : k < s || (k === s && candSt(c) === 'accepté' && k === 4) ? 'done' : k === s ? 'cur' : ''; return `<li class="${cls}" title="${l}"><i></i>${full ? `<span>${l}</span>` : ''}</li>`; }).join('')}</ol>`;
  route(/^\/admin\/candidatures$/, () => {
    const rows = A.CAND.map((c) => ({ ...c, s: candSt(c), _f: candSt(c), _href: `#/admin/candidature/${c.id}` }));
    const byStep = A.STEPS.map((_, k) => rows.filter((c) => candStep(c) === k && c.s !== 'refusé').length);
    return {
      title: 'Candidatures',
      html: shell('candidatures', `${head('Admission manuelle · aucune publication automatique', 'Candidatures')}
        <div class="panel adm-flow"><div class="row-b"><h3>Le parcours complet</h3><span class="small muted">Création du compte, contrôle d’identité et paiement restent trois opérations distinctes.</span></div>
          <ol class="adm-flow-steps">${A.STEPS.map((l, k) => `<li><b>${k + 1}. ${l}</b><span>${['Pièces, photos, coordonnées privées', 'Identité chez le prestataire, médias, entretien', 'Formule proposée selon le profil', 'Carte, TWINT ou facture', 'Mise en ligne après les trois contrôles'][k]}</span><em>${byStep[k]} dossier${byStep[k] > 1 ? 's' : ''}</em></li>`).join('')}</ol></div>
        ${list({
          id: 'candidatures', title: 'File des dossiers', search: 'Nom, référence…',
          filters: [['', 'Tous'], ['reçu', 'Reçus'], ['à compléter', 'À compléter'], ['en vérification', 'En vérification'], ['accepté', 'Acceptés'], ['refusé', 'Refusés']],
          cols: [
            { l: 'Réf.', k: 'ref', cls: 'num small' },
            { l: 'Candidate', r: (c) => `<div class="adm-who">${c.img ? `<img class="adm-av" src="${V.img(c.img, 's')}" alt="">` : `<span class="adm-av ini">${esc(initials(c.name))}</span>`}<div><b>${esc(c.name)}</b><div class="xs muted">${c.cat} · ${c.age}${typeof c.age === 'number' ? ' ans' : ''}</div></div></div>`, c: (c) => `${c.name} (${c.cat}, ${c.age})` },
            { l: 'Reçu le', r: (c) => `<span class="small num">${G.rel(c.received)}</span>`, c: (c) => G.dt(c.received) },
            { l: 'Statut', r: (c) => badge(...CST[c.s]), c: (c) => CST[c.s][1] },
            { l: 'Parcours', r: (c) => stepper(c), c: (c) => `${A.STEPS[candStep(c)]} (${candStep(c) + 1}/5)` },
            { l: 'Identité', k: 'kyc', cls: 'small' }, { l: 'Médias', k: 'media', cls: 'small' }, { l: 'Entretien', k: 'itw', cls: 'small' },
            { l: 'Responsable', k: 'owner', cls: 'small muted' },
            { l: '', nocsv: true, cls: 'r', r: (c) => `<a class="btn xs dark" href="#/admin/candidature/${c.id}"><span class="roll"><span>Ouvrir</span><span aria-hidden="true">Ouvrir</span></span></a>` },
          ], rows, note: `${I('lock', 'sm')} Chaque ouverture de dossier est inscrite au journal d’audit.`,
        })}`),
    };
  });

  route(/^\/admin\/candidature\/(\w+)$/, (m) => {
    const c = A.CAND.find((x) => x.id === m[1]) || A.CAND[0];
    const s = candSt(c), R2 = V.S.reg || {};
    if (st.viewed !== c.id) { st.viewed = c.id; log('Dossier ouvert', `${c.name} (${c.ref})`); }
    const days = Array.from({ length: 6 }, (_, k) => G.at(k + 1, 10, 30)).filter((d) => d.getDay() !== 0);
    const itw = c.id === 'c1' && R2.slot ? `${G.long(days[R2.day || 0])} à ${R2.slot} · ${R2.mode === 'visio' ? 'visio' : 'bureau'}` : c.id === 'c1' ? `${G.long(G.at(1, 10, 30))} à 10:30 · visio` : c.itw;
    const dates = [c.received, new Date(c.received.getTime() + 0.6 * DAY), new Date(c.received.getTime() + 1.2 * DAY), new Date(c.received.getTime() + 1.6 * DAY), new Date(c.received.getTime() + 2.1 * DAY)];
    const isD = c.id === 'c1';
    const ov = st.cand[c.id] || {};
    return {
      title: 'Dossier · ' + c.name,
      html: shell('candidatures', `${back('#/admin/candidatures', 'Candidatures')}
        ${head(`${c.ref} · ${c.cat} · reçu ${G.rel(c.received).toLowerCase()}`, `${esc(c.name)}${typeof c.age === 'number' ? `, ${c.age} ans` : ''}`, badge(...CST[s]))}
        <div class="panel"><h3>Parcours</h3>
          <ol class="adm-track">${A.STEPS.map((l, k) => { const cs = candStep(c); const done = k < cs || (s === 'accepté' && k <= cs); const cls = s === 'refusé' && k === cs ? 'ko' : done ? 'done' : k === cs ? 'cur' : ''; return `<li class="${cls}"><i>${cls === 'done' ? I('check', 'sm') : cls === 'ko' ? I('x', 'sm') : k + 1}</i><div><b>${l}</b><span class="xs muted">${cls === 'done' ? G.dt(dates[k]) : cls === 'cur' ? 'En cours' : cls === 'ko' ? 'Arrêté' : 'À venir'}</span></div></li>`; }).join('')}</ol>
          ${ov.msg ? `<div class="callout" style="margin-top:14px">${I('mail')}<span><b>Dernier message envoyé à la candidate</b> (${G.rel(new Date(ov.at))}) : « ${esc(ov.msg)} »</span></div>` : ''}
          ${c.missing.length && s === 'à compléter' ? `<div class="callout gold" style="margin-top:14px">${I('alert')}<span><b>À compléter :</b> ${c.missing.map(esc).join(' · ')}</span></div>` : ''}
          ${c.why && s === 'refusé' ? `<div class="callout danger" style="margin-top:14px">${I('x')}<span><b>Motif du refus :</b> ${esc(c.why)}</span></div>` : ''}</div>
        <div class="grid-2" style="margin-top:14px">
          <div class="panel"><div class="row-b"><h3>Identité et âge</h3>${badge(c.kyc === 'Vérifiée' ? 'ok' : 'warn', c.kyc)}</div>
            <dl class="kv" style="margin-top:12px"><dt>Prestataire</dt><dd>Partenaire suisse de vérification</dd><dt>Résultat</dt><dd>${c.kyc === 'Vérifiée' ? 'Document authentique · personne majeure' : c.kyc}</dd><dt>Année de naissance</dt><dd>${c.kyc === 'Vérifiée' ? '•••• (non affichée)' : '—'}</dd><dt>Pièce d’identité</dt><dd>Reste chez le prestataire : seul le résultat s’affiche ici</dd></dl></div>
          <div class="panel"><div class="row-b"><h3>Médias</h3>${badge(c.media.startsWith('Concordants') ? 'ok' : 'warn', esc(c.media))}</div>
            ${isD ? `<div class="cmpface" style="margin-top:12px"><figure><img src="img/p/daria-selfie-s.webp" onerror="this.src='img/p/daria-s.webp'" alt=""><figcaption><span class="badge dark">Selfie vivant</span></figcaption></figure><figure><img src="${V.img('daria', 's')}" alt=""><figcaption><span class="badge dark">Photo proposée</span></figcaption></figure></div><div class="score" style="margin-top:10px">${I('check')}Même personne · 96 % · aucun doublon sur le web</div>` : `<div class="adm-ph-ph" style="margin-top:12px">${I('image')}<span>Photos visibles uniquement par l’équipe d’admission</span></div>`}</div>
        </div>
        <div class="grid-2" style="margin-top:14px">
          <div class="panel"><div class="row-b"><h3>Entretien d’indépendance</h3>${badge('', esc(itw))}</div>
            <div class="stack" style="margin-top:12px">${['Répond elle-même, sans tiers présent', 'Fixe seule ses tarifs et ses horaires', 'Perçoit elle-même ses revenus', 'Connaît ses droits et les associations'].map((t, k) => V.opt('itw' + k, '1', t, '', { box: true, on: c.step >= 1 && k < (isD ? 2 : 4) && c.itw !== 'À planifier' && c.itw !== '—' })).join('')}</div></div>
          <div class="panel"><h3>Offre, paiement et publication</h3>
            <dl class="kv" style="margin-top:12px"><dt>Formule proposée</dt><dd>${c.plan}</dd><dt>Paiement</dt><dd>${c.billing}</dd><dt>Publication</dt><dd>${s === 'accepté' && c.step >= 4 ? 'En ligne' : s === 'accepté' ? 'Après paiement ou facture' : 'Après validation'}</dd><dt>Responsable</dt><dd>${c.owner}</dd></dl>
            ${c.id === 'c2' ? `<div class="callout danger" style="margin-top:14px">${I('alert')}<span><b>Signalement urgent S-2026-0214</b> (contrainte suspectée). Dossier gelé : entretien en personne avant toute suite.</span></div>` : ''}
            <h3 style="margin-top:18px">Décision</h3><p class="small muted" style="margin:4px 0 12px">Motivée, communiquée à la candidate, inscrite au journal.</p>
            <div class="row wrapr">${V.btn('Accepter', { cls: 'sm', arrow: 'check', attrs: `data-a="cand" data-id="${c.id}" data-d="accepté"` })}${V.btn('Demander un complément', { cls: 'sm ghost', attrs: `data-a="cand" data-id="${c.id}" data-d="à compléter"` })}${V.btn('Refuser', { cls: 'sm danger-ghost', attrs: `data-a="cand" data-id="${c.id}" data-d="refusé"` })}</div></div>
        </div>`),
    };
  });

  /* ================================================================ PROFILS PRÉPARÉS PAR L'ÉQUIPE (import des 40 premières) */
  const PREP = { validé: ['ok', 'Validé par la professionnelle'], envoyé: ['warn', 'En attente de sa validation'], corrections: ['danger', 'Corrections demandées'] };
  route(/^\/admin\/import$/, () => {
    const rows = A.PROS.map((p) => ({ ...p, pr: (st.pro['prep-' + p.id]) || p.prepared, _f: (st.pro['prep-' + p.id]) || p.prepared }));
    const ok = rows.filter((r) => r.pr === 'validé').length;
    return {
      title: 'Profils préparés',
      html: shell('import', `${head('Lancement · les 40 premières professionnelles', 'Profils préparés par l’équipe', V.btn('Importer un fichier', { cls: 'sm ghost', arrow: 'upload', attrs: 'data-a="import"' }))}
        <div class="panel adm-flow"><div class="row-b"><h3>Comment ça marche</h3><span class="small muted"><b>${ok}</b> sur ${rows.length} validés</span></div>
          <div class="adm-progress"><i style="width:${(ok / rows.length) * 100}%"></i></div>
          <ol class="adm-flow-steps">${[['Import', 'Fichier préparé avec chaque professionnelle (prénom, quartier, langues, tarifs)'], ['Préparation', 'L’équipe met en forme textes, photos et pratiques'], ['Envoi', 'Lien sécurisé envoyé à la professionnelle'], ['Validation', 'Elle relit, corrige ou valide elle-même'], ['Publication', 'Seulement après sa validation et les contrôles']].map(([t, d], k) => `<li><b>${k + 1}. ${t}</b><span>${d}</span></li>`).join('')}</ol></div>
        ${list({
          id: 'profils-prepares', title: 'Profils importés', search: 'Prénom, quartier…',
          filters: [['', 'Tous'], ['validé', 'Validés'], ['envoyé', 'En attente'], ['corrections', 'Corrections demandées']],
          cols: [
            { l: 'Profil', r: (p) => who(p, `${p.catLabel} · ${V.communeTxt(p.commune)}`), c: (p) => p.name },
            { l: 'Préparé par', r: (p) => `<span class="small">${p.preparedBy}</span>`, c: (p) => p.preparedBy },
            { l: 'Envoyé le', r: (p) => `<span class="small num">${G.d(new Date(p.joined.getTime() - 2 * DAY))}</span>`, c: (p) => G.d(new Date(p.joined.getTime() - 2 * DAY)) },
            { l: 'Validation', r: (p) => `${badge(...PREP[p.pr])}${p.pr === 'validé' ? `<div class="xs muted">le ${G.d(new Date(p.joined.getTime() - DAY))}</div>` : p.pr === 'corrections' ? '<div class="xs muted">« Retirer la photo 3, changer le quartier »</div>' : ''}`, c: (p) => PREP[p.pr][1] },
            { l: 'Publication', r: (p) => (p.pr === 'validé' ? badge(...STB[proSt(p)]) : '<span class="small muted">—</span>'), c: (p) => (p.pr === 'validé' ? STB[proSt(p)][1] : '—') },
            { l: '', nocsv: true, cls: 'r', r: (p) => (p.pr === 'validé' ? `<a class="txt-btn" href="#/admin/pro/${p.id}">Fiche ${I('chevron-right', 'sm')}</a>` : V.btn('Relancer', { cls: 'xs ghost', attrs: `data-a="prep-remind" data-id="${p.id}"` })) },
          ], rows,
        })}`),
    };
  });

  /* ================================================================ PROFESSIONNELLES (liste) */
  const CTL = { proposé: ['warn', 'Proposé par BD'], confirmé: ['ok', 'Confirmé'], reporté: ['danger', 'Reporté'] };
  route(/^\/admin\/pros$/, () => {
    const rows = A.PROS.map((p) => { const s = proSt(p); return { ...p, s, _f: [s, p.pay === 'impayé' ? 'impayé' : '', p.now && s === 'actif' ? 'now' : '', p.cat === 'duo' ? 'duo' : '', p.importe ? 'maquette' : ''].join('|'), _href: `#/admin/pro/${p.id}` }; });
    const ctl = A.PROS.map((p) => ({ p, c: ctlOf(p.id) })).filter((x) => x.c).sort((a, b) => a.c.when - b.c.when).map((x) => ({ ...x, _f: x.c.state }));
    const due = A.PROS.flatMap((p) => [{ p, k: 'Contrôle médias', d: p.mediaNext }, { p, k: 'Entretien d’indépendance', d: p.itwNext }]).filter((x) => proSt(x.p) !== 'attente' && inDays(x.d) <= 30).sort((a, b) => a.d - b.d).map((x) => ({ ...x, _f: inDays(x.d) < 0 ? 'retard' : 'bientot' }));
    const T = tabs('pros', [['all', 'Toutes', rows.length], ['ctl', 'Contrôles planifiés', ctl.length], ['due', 'Échéances à 30 jours', due.length]]);
    return {
      title: 'Professionnelles',
      html: shell('pros', `${head(`${rows.length} profils · ${rows.filter((r) => r.importe).length} de la maquette publique`, 'Professionnelles')}${T.bar}
        ${T.pane('all', list({
          id: 'professionnelles', title: 'Toutes les professionnelles', search: 'Prénom, quartier, formule…',
          filters: [['', 'Toutes'], ['actif', 'Actives'], ['pause', 'En pause'], ['attente', 'En attente'], ['suspendu', 'Suspendues'], ['impayé', 'Impayés'], ['now', 'Disponibles maintenant'], ['duo', 'Duos'], ['maquette', 'Les 12 du site']],
          cols: [
            { l: 'Profil', r: (p) => who(p, `${p.catLabel}${typeof p.age === 'number' ? ` · ${p.age} ans` : ''}`), c: (p) => p.name },
            { l: 'Ville · quartier', r: (p) => `<span class="small">${p.city} · ${V.communeTxt(p.commune)}</span>`, c: (p) => `${p.city} · ${V.communeTxt(p.commune)}` },
            { l: 'Statut', r: (p) => `${badge(...STB[p.s])}${st.masked[p.id] ? ' ' + badge('danger', 'Masqué') : ''}${p.now && p.s === 'actif' ? '<div class="xs" style="color:var(--ok)">● disponible maintenant</div>' : ''}`, c: (p) => STB[p.s][1] + (st.masked[p.id] ? ' (masqué)' : '') },
            { l: 'Formule', r: (p) => `<span class="small">${p.planName}</span><div class="xs muted">${chf(p.price)} / mois</div>`, c: (p) => `${p.planName} (${p.price})` },
            { l: 'Paiement', r: (p) => `${badge(...PAYB[p.pay])}${p.late ? `<div class="xs danger">J+${p.late}</div>` : ''}`, c: (p) => PAYB[p.pay][1] + (p.late ? ` J+${p.late}` : '') },
            { l: 'Contrôle médias', r: (p) => `<span class="small ${p.mediaDue < 0 ? 'danger b' : p.mediaDue < 10 ? 'warn-t b' : ''}">${dueTxt(p.mediaNext)}</span>`, c: (p) => G.d(p.mediaNext) },
            { l: 'Entretien', r: (p) => `<span class="small">${dueTxt(p.itwNext)}</span>`, c: (p) => G.d(p.itwNext) },
            { l: 'Inscrite le', r: (p) => `<span class="small num">${G.d(p.joined)}</span>`, c: (p) => G.d(p.joined) },
            { l: '', nocsv: true, cls: 'r', r: (p) => `<a class="txt-btn" href="#/admin/pro/${p.id}">Fiche ${I('chevron-right', 'sm')}</a>` },
          ], rows,
        }))}
        ${T.pane('ctl', list({
          id: 'controles-planifies', title: 'Contrôles planifiés', sub: 'BD propose une date ; la professionnelle confirme ou reporte depuis son espace.',
          filters: [['', 'Tous'], ['proposé', 'Proposés'], ['confirmé', 'Confirmés'], ['reporté', 'Reportés']],
          cols: [
            { l: 'Professionnelle', r: (x) => who(x.p, x.p.catLabel), c: (x) => x.p.name },
            { l: 'Contrôle', r: (x) => `<span class="small">${x.c.kind}</span>`, c: (x) => x.c.kind },
            { l: 'Date', r: (x) => `<b class="small">${G.long(x.c.when)}</b><div class="xs muted">${G.t(x.c.when)} · ${x.c.mode}</div>`, c: (x) => G.dt(x.c.when) },
            { l: 'État', r: (x) => `${badge(...CTL[x.c.state])}${x.c.from ? `<div class="xs muted">au lieu du ${G.d(x.c.from)}</div>` : ''}`, c: (x) => CTL[x.c.state][1] },
            { l: 'Dernier mot', r: (x) => `<span class="small muted">${x.c.by}</span>`, c: (x) => x.c.by },
            { l: '', nocsv: true, cls: 'r', r: (x) => (x.c.state === 'proposé' ? `<div class="row" style="justify-content:flex-end;gap:6px">${V.btn('Elle confirme', { cls: 'xs', attrs: `data-a="ctl-answer" data-id="${x.p.id}" data-v="confirmé"` })}${V.btn('Elle reporte', { cls: 'xs ghost', attrs: `data-a="ctl-answer" data-id="${x.p.id}" data-v="reporté"` })}</div>` : V.btn('Nouvelle date', { cls: 'xs ghost', attrs: `data-a="ctl-plan" data-id="${x.p.id}"` })) },
          ], rows: ctl, note: 'Démonstration : les boutons « Elle confirme / Elle reporte » simulent la réponse de la professionnelle.',
        }))}
        ${T.pane('due', list({
          id: 'echeances-controles', title: 'Échéances à 30 jours', sub: 'Contrôle médias tous les 90 jours, entretien d’indépendance tous les 6 mois.',
          filters: [['', 'Toutes'], ['retard', 'En retard'], ['bientot', 'À venir']],
          cols: [
            { l: 'Professionnelle', r: (x) => who(x.p, x.p.catLabel), c: (x) => x.p.name },
            { l: 'Contrôle', k: 'k', cls: 'small' },
            { l: 'Échéance', r: (x) => `<span class="small num">${G.d(x.d)}</span>`, c: (x) => G.d(x.d) },
            { l: 'Délai', r: (x) => `<span class="small ${inDays(x.d) < 0 ? 'danger b' : ''}">${dueTxt(x.d)}</span>`, c: (x) => dueTxt(x.d) },
            { l: 'Planifié', r: (x) => { const c = ctlOf(x.p.id); return c ? badge(...CTL[c.state]) : '<span class="small muted">Non</span>'; }, c: (x) => (ctlOf(x.p.id) ? CTL[ctlOf(x.p.id).state][1] : 'Non') },
            { l: '', nocsv: true, cls: 'r', r: (x) => V.btn('Proposer une date', { cls: 'xs ghost', attrs: `data-a="ctl-plan" data-id="${x.p.id}"` }) },
          ], rows: due,
        }))}`),
    };
  });

  /* ================================================================ FICHE D'UNE PROFESSIONNELLE (Q12, Q52-Q53, Q59-Q61) */
  const SEED_NOTES = { 'imp-nina': [['S. B.', 1900, 'Souhaite des photos professionnelles au printemps : lui proposer le shooting partenaire.']], bianca: [['A. R.', 4800, 'Pause demandée pour raisons familiales. Ne pas relancer avant le 1er du mois.']], kiara: [['C. D.', 700, 'A promis le virement pour vendredi.']], alexia: [['A. R.', 2400, 'Suspension levée dès réception du paiement, pas avant.']] };
  route(/^\/admin\/pro\/([\w-]+)$/, (m) => {
    const p = A.byId(m[1]) || A.PROS[0];
    const s = proSt(p), site = p.site, mk = st.masked[p.id];
    const c = ctlOf(p.id);
    const inv = A.INV.filter((x) => x.who === p.id).map((x) => ({ ...x, _f: x.status }));
    const reps = A.REP.filter((r) => r.target === p.id).map((r) => ({ ...r, _href: `#/admin/signalement/${r.id}` }));
    const hist = [
      ...st.log.filter((l) => (l.obj || '').includes(p.name)).map((l) => ({ at: new Date(l.at), who: l.who, what: `${l.what}${l.obj ? ' · ' + l.obj : ''}` })),
      { at: G.ago(90 + p.i * 7), who: 'La professionnelle', what: p.importe && V.statusOf(site).t === 'now' ? 'Statut « Disponible maintenant » activé (60 min)' : 'Disponibilité mise à jour' },
      { at: G.ago(2000 + p.i * 31), who: 'La professionnelle', what: p.importe ? `Tarifs modifiés : 1 h ${(p.from || 300) - 50}.– → ${p.from || 300}.–` : 'Tarifs modifiés' },
      { at: p.mediaLast, who: 'Modération · J. P.', what: 'Contrôle médias validé (selfie de comparaison)' },
      { at: new Date(p.joined.getTime() + 2 * 36e5), who: 'Système', what: 'Profil publié' },
      { at: new Date(p.joined.getTime() - DAY), who: 'La professionnelle', what: 'Profil préparé par l’équipe : validé' },
      { at: new Date(p.joined.getTime() - 2 * DAY), who: `Admission · ${p.preparedBy}`, what: 'Profil préparé par l’équipe (import des premières professionnelles)' },
    ].sort((a, b) => b.at - a.at);
    const notes = [...(st.notes[p.id] || []).map((n) => ({ ...n, at: new Date(n.at) })), ...(SEED_NOTES[p.id] || []).map(([w, mi, t]) => ({ who: w, at: G.ago(mi), t }))].sort((a, b) => b.at - a.at);
    const T = tabs('fiche-' + p.id, [['ov', 'Aperçu'], ['hist', 'Historique', hist.length], ['pay', 'Paiements', inv.length], ['rep', 'Signalements', reps.length], ['notes', 'Notes internes', notes.length]]);
    const credits = p.credits;
    return {
      title: p.name,
      html: shell('pros', `${back('#/admin/pros', 'Professionnelles')}
        <div class="adm-pro-head">
          ${A.photo(p) ? `<img class="adm-pro-ph" src="${A.photo(p)}" alt="">` : `<span class="adm-pro-ph ini">${esc(initials(p.name))}</span>`}
          <div class="sp">
            <div class="eyebrow">${p.catLabel} · ${p.city} · ${V.communeTxt(p.commune)}${p.importe ? ' · profil de la maquette' : ''}</div>
            <h1 class="adm-pro-name">${esc(p.name)}${typeof p.age === 'number' ? `, ${p.age} ans` : ''}</h1>
            <div class="row wrapr" style="gap:8px;margin-top:8px">${badge(...STB[s])}${mk ? badge('danger', 'Masqué') : ''}${badge(...PAYB[p.pay])}${site ? V.statusPill(site, true) : ''}${p.from ? `<span class="badge">dès ${p.from}.–</span>` : ''}${p.langs ? `<span class="adm-flags">${p.langs.slice(0, 4).map(([l]) => V.flag(l)).join('')}</span>` : ''}</div>
          </div>
          <div class="row wrapr adm-pro-acts">
            ${p.importe ? V.btn('Fiche publique', { cls: 'sm ghost', href: `#/profil/${p.id}`, arrow: 'eye' }) : ''}
            ${V.btn(mk ? 'Réafficher' : 'Masquer', { cls: 'sm ' + (mk ? '' : 'ghost'), attrs: `data-a="mask" data-id="${p.id}"`, arrow: mk ? 'eye' : 'eye-off' })}
            ${V.btn(s === 'suspendu' ? 'Lever la suspension' : 'Suspendre', { cls: 'sm danger-ghost', attrs: `data-a="suspend" data-id="${p.id}"` })}
          </div>
        </div>
        ${mk ? `<div class="callout danger adm-alert">${I('alert')}<span><b>Profil masqué le ${G.dt(new Date(mk.at))} par ${mk.by}</b> · ${esc(mk.why)}. Alerte envoyée à l’équipe et à la professionnelle (e-mail et SMS, objet discret).</span></div>` : ''}
        ${T.bar}
        ${T.pane('ov', `<div class="grid-2">
          <div class="panel"><h3>Formule</h3><dl class="kv" style="margin-top:12px"><dt>Formule</dt><dd>${p.planName} · ${chf(p.price)} / mois</dd><dt>Paiement</dt><dd>${p.method}${p.late ? ` · <span class="danger b">impayé J+${p.late}</span>` : ''}</dd><dt>Prochaine échéance</dt><dd>${G.d(G.at(31 - (p.i % 20), 6, 0))}</dd><dt>Crédits</dt><dd>${credits} crédit${credits > 1 ? 's' : ''}</dd>${p.pay === 'lancement' ? `<dt>Offre de lancement</dt><dd>2 mois offerts, jusqu’au ${G.d(new Date(p.joined.getTime() + 61 * DAY))}</dd>` : ''}<dt>Inscrite le</dt><dd>${G.dt(p.joined)}</dd></dl></div>
          <div class="panel"><h3>Badges</h3>${p.badges.length ? `<ul class="adm-badges">${p.badges.map((b) => `<li>${I('badge-check', 'sm')}<b>${b.k}</b><span class="small muted">depuis le ${G.d(b.d)}${b.until ? ` · jusqu’au ${G.d(b.until)}` : ''}</span></li>`).join('')}</ul>` : '<p class="small muted" style="margin-top:10px">Aucun badge avant la validation.</p>'}</div>
        </div>
        <div class="grid-2" style="margin-top:14px">
          <div class="panel"><h3>Contrôles</h3>
            <div class="tbl-wrap"><table class="tbl" style="min-width:0;margin-top:8px"><thead><tr><th>Contrôle</th><th>Dernier</th><th>Prochain</th></tr></thead><tbody>
              <tr><td class="small">Identité (prestataire)</td><td class="small num">${p.badges[0] ? G.d(p.badges[0].d) : '—'}</td><td class="small muted">une seule fois</td></tr>
              <tr><td class="small">Médias · 90 jours</td><td class="small num">${G.d(p.mediaLast)}</td><td class="small ${p.mediaDue < 0 ? 'danger b' : ''}">${G.d(p.mediaNext)} · ${dueTxt(p.mediaNext)}</td></tr>
              <tr><td class="small">Entretien · 6 mois</td><td class="small num">${G.d(p.itwLast)}</td><td class="small">${G.d(p.itwNext)} · ${dueTxt(p.itwNext)}</td></tr>
            </tbody></table></div></div>
          <div class="panel"><div class="row-b"><h3>Contrôle planifié</h3>${c ? badge(...CTL[c.state]) : ''}</div>
            ${c ? `<div class="adm-ctl"><span class="adm-ctl-d"><b>${G.wd(c.when)}</b><small>${G.t(c.when)}</small></span><div><b>${c.kind}</b><div class="small muted">${G.long(c.when)} à ${G.t(c.when)} · ${c.mode}</div>${c.from ? `<div class="xs muted">Reporté par la professionnelle (date initiale : ${G.dt(c.from)})</div>` : ''}<div class="xs muted">Dernier mot : ${c.by}</div></div></div>` : '<p class="small muted" style="margin-top:10px">Aucun contrôle planifié.</p>'}
            <div class="row wrapr" style="margin-top:12px">${V.btn(c ? 'Proposer une autre date' : 'Proposer une date', { cls: 'sm ghost', arrow: 'calendar', attrs: `data-a="ctl-plan" data-id="${p.id}"` })}${c && c.state === 'proposé' ? V.btn('Simuler : elle confirme', { cls: 'sm', attrs: `data-a="ctl-answer" data-id="${p.id}" data-v="confirmé"` }) + V.btn('Simuler : elle reporte', { cls: 'sm ghost', attrs: `data-a="ctl-answer" data-id="${p.id}" data-v="reporté"` }) : ''}</div>
            <p class="hint">BD propose la date ; la professionnelle confirme ou reporte depuis son espace. Un message discret part à chaque étape.</p></div>
        </div>
        <div class="grid-2" style="margin-top:14px">
          <div class="panel"><h3>30 derniers jours</h3><div class="kpis" style="grid-template-columns:repeat(2,1fr);margin-top:10px">${kpi('Vues de la fiche', nf(p.views))}${kpi('Clics de contact', nf(p.contacts))}</div></div>
          <div class="panel"><h3>Préparation du profil</h3><dl class="kv" style="margin-top:12px"><dt>Préparé par</dt><dd>${p.preparedBy} (équipe BD)</dd><dt>Validation</dt><dd>${PREP[p.prepared][1]}</dd><dt>Justificatifs</dt><dd><a class="link" href="#/admin/coffre">Coffre des justificatifs</a> · accès avec motif</dd></dl>
            ${p.photos && p.photos.length > 1 ? `<div class="adm-gal">${p.photos.slice(0, 6).map((ph) => `<img src="${V.img(ph, 's')}" alt="" loading="lazy">`).join('')}</div>` : ''}</div>
        </div>`)}
        ${T.pane('hist', list({ id: `historique-${p.id}`, title: 'Historique des modifications', cols: [{ l: 'Date', r: (h) => `<span class="small num">${G.rel(h.at)}</span>`, c: (h) => G.dt(h.at) }, { l: 'Par', k: 'who', cls: 'small b' }, { l: 'Modification', k: 'what', cls: 'small' }], rows: hist }))}
        ${T.pane('pay', list({ id: `paiements-${p.id}`, title: 'Factures et paiements', filters: [['', 'Toutes'], ['Payée', 'Payées'], ['En retard', 'En retard'], ['Offerte (lancement)', 'Offertes']], cols: [{ l: 'N°', k: 'n', cls: 'num small' }, { l: 'Objet', k: 'what', cls: 'small' }, { l: 'Montant', cls: 'r', r: (x) => `<b class="num">${chf(x.amount)}</b>`, c: (x) => x.amount }, { l: 'Émise', r: (x) => `<span class="small num">${G.d(x.issued)}</span>`, c: (x) => G.d(x.issued) }, { l: 'Mode', k: 'method', cls: 'small' }, { l: 'État', r: (x) => invBadge(x), c: (x) => x.status }], rows: inv }))}
        ${T.pane('rep', reps.length ? list({ id: `signalements-${p.id}`, title: 'Signalements', cols: [{ l: 'Dossier', k: 'ref', cls: 'num small' }, { l: 'Motif', k: 'motif', cls: 'b small' }, { l: 'Reçu', r: (r) => `<span class="small num">${G.rel(r.rec)}</span>`, c: (r) => G.dt(r.rec) }, { l: 'État', r: (r) => badge(repSt(r) === 'Clos' ? 'ok' : 'warn', repSt(r)), c: (r) => repSt(r) }, { l: 'Sanction', r: (r) => `<span class="small">${repSan(r) || '—'}</span>`, c: (r) => repSan(r) || '—' }], rows: reps }) : `<div class="panel">${V.empty('flag', 'Aucun signalement', 'Rien n’a été signalé pour ce profil.', '')}</div>`)}
        ${T.pane('notes', `<div class="panel"><h3>Notes internes</h3><p class="small muted">Visibles par l’équipe seulement. Jamais par la professionnelle, jamais publiques.</p>
          <div class="row" style="margin-top:12px;align-items:flex-end"><div class="sp">${V.field('Nouvelle note', { type: 'textarea', name: 'note', max: 400 })}</div>${V.btn('Ajouter', { cls: 'sm', attrs: `data-a="note" data-id="${p.id}"` })}</div>
          ${list({ id: `notes-${p.id}`, title: 'Notes', cols: [{ l: 'Date', r: (n) => `<span class="small num">${G.rel(n.at)}</span>`, c: (n) => G.dt(n.at) }, { l: 'Par', k: 'who', cls: 'small b' }, { l: 'Note', k: 't', cls: 'small' }], rows: notes })}</div>`)}`),
    };
  });

  /* ================================================================ COMPTES (Q09-Q10) */
  const accSt = (k) => st.acc[k.id] || k.status;
  route(/^\/admin\/comptes$/, () => {
    const pros = A.PROS.map((p) => ({ ...p, _f: proSt(p) }));
    const cl = A.CLIENTS.map((k) => ({ ...k, s: accSt(k), _f: accSt(k) }));
    const T = tabs('comptes', [['pro', 'Comptes professionnels', pros.length], ['cli', 'Comptes clients', cl.length]]);
    return {
      title: 'Comptes',
      html: shell('comptes', `${head('Recherche interne sans données sensibles superflues', 'Comptes')}${T.bar}
        ${T.pane('pro', list({ id: 'comptes-pros', title: 'Comptes professionnels', search: 'Prénom ou e-mail…', filters: [['', 'Tous'], ['actif', 'Actifs'], ['suspendu', 'Suspendus'], ['attente', 'En attente']], cols: [
          { l: 'Compte', r: (p) => who(p, p.catLabel), c: (p) => p.name }, { l: 'E-mail', k: 'email', cls: 'small num' },
          { l: 'Double authentification', r: () => badge('ok', 'Active'), c: () => 'Active' },
          { l: 'Dernière connexion', r: (p) => `<span class="small num">${G.rel(p.lastLogin)}</span>`, c: (p) => G.dt(p.lastLogin) },
          { l: 'Statut', r: (p) => badge(...STB[proSt(p)]), c: (p) => STB[proSt(p)][1] },
          { l: '', nocsv: true, cls: 'r', r: (p) => `<a class="txt-btn" href="#/admin/pro/${p.id}">Fiche ${I('chevron-right', 'sm')}</a>` },
        ], rows: pros }))}
        ${T.pane('cli', `${list({ id: 'comptes-clients', title: 'Comptes clients', sub: 'Le compte client est facultatif. Il n’est jamais public : ni profil, ni avis signé, ni liste.', search: 'Pseudo ou e-mail…', filters: [['', 'Tous'], ['Actif', 'Actifs'], ['Averti', 'Avertis'], ['Banni', 'Bannis'], ['Suspendu', 'Suspendus'], ['Suppression demandée', 'Suppression demandée']], cols: [
          { l: 'Pseudo', r: (k) => `<b>${esc(k.pseudo)}</b>`, c: (k) => k.pseudo }, { l: 'E-mail', k: 'email', cls: 'small num' },
          { l: 'Créé le', r: (k) => `<span class="small num">${G.d(k.created)}</span>`, c: (k) => G.d(k.created) },
          { l: 'Dernière visite', r: (k) => `<span class="small num">${G.rel(k.seen)}</span>`, c: (k) => G.dt(k.seen) },
          { l: 'Favoris', k: 'favs', cls: 'num small' }, { l: 'Alertes', k: 'alerts', cls: 'num small' }, { l: 'Langue', k: 'lang', cls: 'small' },
          { l: 'Statut', r: (k) => badge(k.s === 'Actif' ? 'ok' : k.s === 'Averti' ? 'warn' : k.s === 'Suppression demandée' ? '' : 'danger', k.s), c: (k) => k.s },
          { l: '', nocsv: true, cls: 'r', r: (k) => V.btn('Voir', { cls: 'xs dark', attrs: `data-a="client" data-id="${k.id}"` }) },
        ], rows: cl })}`)}`),
    };
  });

  /* ================================================================ MODÉRATION (Q13, Q32, Q75) */
  const MST = { 'à revoir': ['warn', 'À revoir'], validé: ['ok', 'Validé'], refusé: ['danger', 'Refusé'], bloqué: ['dark', 'Bloqué'] };
  const thumb = (mo, big) => (mo.type === 'texte' ? `<span class="adm-txt${big ? ' big' : ''}">${I('edit', 'sm')}« ${esc((mo.text || '').slice(0, big ? 200 : 60))}${(mo.text || '').length > (big ? 200 : 60) ? '…' : ''} »</span>` : mo.img && !mo.prio ? `<span class="adm-th${big ? ' big' : ''}"><img src="${mo.img}" alt="" loading="lazy">${mo.type === 'vidéo' ? `<b>${I('video', 'sm')}${mo.dur}</b>` : ''}</span>` : `<span class="adm-th blur${big ? ' big' : ''}"><i></i>${mo.type === 'vidéo' ? `<b>${I('video', 'sm')}${mo.dur}</b>` : ''}<em>Aperçu flouté</em></span>`);
  const threshold = () => +(st.params.ai || 0.8);
  route(/^\/admin\/moderation$/, () => {
    const rows = A.MOD.map((m) => ({ ...m, s: modSt(m), dec: modDec(m), p: A.byId(m.who), _f: [modSt(m), m.type].join('|') }));
    const alerts = rows.filter((m) => m.prio && m.s === 'à revoir');
    return {
      title: 'Modération',
      html: shell('moderation', `${head('Aide de l’IA, décision humaine · aucune sanction automatique', 'Modération')}
        <section class="panel adm-prio"><div class="row-b"><h3>${I('alert', 'sm')} Alertes prioritaires <span class="al-n">${alerts.length}</span></h3><span class="small muted">Score de l’IA au-dessus du seuil (${String(threshold()).replace('.', ',')}) ou signal sensible</span></div>
          ${alerts.length ? `<div class="adm-prio-grid">${alerts.map((m) => `<article class="adm-prio-it">${thumb(m)}<div class="sp"><b>${esc(m.p.name)}</b> <span class="xs muted">· ${m.type} · ${G.rel(m.sent)}</span><ul class="adm-flags-l">${m.flags.map((f) => `<li>${I('alert', 'sm')}${esc(f)}</li>`).join('')}</ul><div class="adm-score"><span style="width:${m.score * 100}%"></span></div><div class="row-b"><span class="xs muted">IA : ${Math.round(m.score * 100)} %</span>${V.btn('Examiner', { cls: 'xs dark', attrs: `data-a="mod" data-id="${m.id}"` })}</div></div></article>`).join('')}</div>` : '<p class="small muted" style="margin-top:10px">Aucune alerte prioritaire en attente.</p>'}</section>
        ${list({
          id: 'moderation', title: 'File complète', sub: 'Photos, vidéos et textes avant publication, avec leurs versions et la décision prise.', search: 'Prénom, motif…',
          filters: [['', 'Tous'], ['à revoir', 'À revoir'], ['validé', 'Validés'], ['refusé', 'Refusés'], ['bloqué', 'Bloqués'], ['photo', 'Photos'], ['vidéo', 'Vidéos'], ['texte', 'Textes']],
          cols: [
            { l: 'Contenu', nocsv: false, r: (m) => thumb(m), c: (m) => (m.type === 'texte' ? m.text : `${m.type} ${m.id}`) },
            { l: 'Professionnelle', r: (m) => `<b class="small">${esc(m.p.name)}</b><div class="xs muted">${m.p.catLabel}</div>`, c: (m) => m.p.name },
            { l: 'Type', k: 'type', cls: 'small' },
            { l: 'Envoyé', r: (m) => `<span class="small num">${G.rel(m.sent)}</span>`, c: (m) => G.dt(m.sent) },
            { l: 'Versions', r: (m) => `<span class="small">v${m.versions.length}${m.versions.length > 1 ? ` · ${m.versions.length} versions` : ''}</span>`, c: (m) => m.versions.length },
            { l: 'Résultat de l’IA', r: (m) => `<span class="small num ${m.score >= threshold() ? 'danger b' : ''}">${Math.round(m.score * 100)} %</span>${m.flags.length ? `<div class="xs muted">${esc(m.flags[0])}</div>` : '<div class="xs muted">Rien à signaler</div>'}`, c: (m) => `${Math.round(m.score * 100)} % ${m.flags.join(', ')}` },
            { l: 'État', r: (m) => badge(...MST[m.s]), c: (m) => MST[m.s][1] },
            { l: 'Décision', r: (m) => (m.dec ? `<span class="small">${esc(m.dec.motif)}</span><div class="xs muted">${esc(m.dec.by)} · ${G.rel(new Date(m.dec.at))}</div>` : '<span class="small muted">—</span>'), c: (m) => (m.dec ? `${m.dec.motif} · ${m.dec.by} · ${G.dt(new Date(m.dec.at))}` : '') },
            { l: '', nocsv: true, cls: 'r', r: (m) => V.btn('Examiner', { cls: 'xs dark', attrs: `data-a="mod" data-id="${m.id}"` }) },
          ], rows,
        })}`),
    };
  });

  /* ================================================================ SIGNALEMENTS (Q36) */
  const RST = { Nouveau: 'danger', 'En cours': 'warn', 'Sanction appliquée': 'v', Contesté: 'g', Clos: 'ok' };
  const target = (r) => (r.t ? r.t.name : r.target === 'c2' ? 'Mélodie (candidature)' : r.target);
  route(/^\/admin\/signalements$/, () => {
    const rows = A.REP.map((r) => ({ ...r, s: repSt(r), san: repSan(r), _href: `#/admin/signalement/${r.id}`, _f: [repSt(r) === 'Clos' ? 'clos' : 'ouvert', r.u === 0 ? 'urgent' : '', repSan(r) ? 'sanction' : '', r.contest || (st.rep[r.id] || {}).contest ? 'conteste' : ''].join('|') })).sort((a, b) => (a.s === 'Clos') - (b.s === 'Clos') || a.u - b.u || b.rec - a.rec);
    return {
      title: 'Signalements',
      html: shell('signalements', `${head('File privée · numéro de dossier · accusé de réception', 'Signalements')}
        <div class="kpis">${A.URG.map((u, k) => kpi(`Urgence ${u.toLowerCase()}`, rows.filter((r) => r.u === k && r.s !== 'Clos').length, `<span class="xs muted">${['traitement immédiat, astreinte', 'sous 24 h', 'sous 72 h', 'sous 7 jours'][k]}</span>`, k === 0 ? 'dark' : '')).join('')}</div>
        <div style="margin-top:14px">${list({
          id: 'signalements', title: 'File des signalements', sub: 'Triée par urgence puis par date. Jamais communiquée à la personne signalée.', search: 'Dossier, motif…',
          filters: [['', 'Tous'], ['ouvert', 'Ouverts'], ['urgent', 'Urgents'], ['sanction', 'Avec sanction'], ['conteste', 'Contestés'], ['clos', 'Clos']],
          cols: [
            { l: 'Dossier', k: 'ref', cls: 'num small b' },
            { l: 'Urgence', r: (r) => `<span class="prio p${Math.min(r.u, 2)}"></span> <span class="small">${r.urg}</span>`, c: (r) => r.urg },
            { l: 'Motif', k: 'motif', cls: 'small b' },
            { l: 'Concerne', r: (r) => (r.t ? who(r.t, r.t.catLabel) : `<span class="small">${esc(target(r))}</span>`), c: (r) => target(r) },
            { l: 'Reçu', r: (r) => `<span class="small num">${G.rel(r.rec)}</span>`, c: (r) => G.dt(r.rec) },
            { l: 'Par', k: 'by', cls: 'small muted' },
            { l: 'État', r: (r) => badge(RST[r.s] || '', r.s), c: (r) => r.s },
            { l: 'Sanction', r: (r) => `<span class="small">${r.san || '—'}</span>`, c: (r) => r.san || '' },
            { l: 'Responsable', k: 'owner', cls: 'small muted' },
            { l: '', nocsv: true, cls: 'r', r: (r) => `<a class="btn xs dark" href="#/admin/signalement/${r.id}"><span class="roll"><span>Ouvrir</span><span aria-hidden="true">Ouvrir</span></span></a>` },
          ], rows,
        })}</div>
        <div class="callout" style="margin-top:12px">${I('lock')}<span>Aucune sanction automatique sur un signalement isolé. Chaque décision a un motif, peut être contestée, et l’historique est conservé pour les autorités.</span></div>`),
    };
  });
  route(/^\/admin\/signalement\/(\w+)$/, (m) => {
    const r = A.REP.find((x) => x.id === m[1]) || A.REP[0];
    const s = repSt(r), san = repSan(r), ct = (st.rep[r.id] || {}).contest || r.contest;
    const h = repHist(r).sort((a, b) => b.at - a.at);
    return {
      title: r.ref,
      html: shell('signalements', `${back('#/admin/signalements', 'Signalements')}
        ${head(`Urgence ${r.urg.toLowerCase()} · reçu ${G.rel(r.rec).toLowerCase()}`, `${r.ref} · ${esc(r.motif)}`, badge(RST[s] || '', s))}
        <div class="grid-2">
          <div class="panel"><h3>Dossier</h3><dl class="kv" style="margin-top:12px"><dt>Concerne</dt><dd>${r.t ? `<a class="link" href="#/admin/pro/${r.t.id}">${esc(r.t.name)}</a>` : esc(target(r))}</dd><dt>Motif</dt><dd>${esc(r.motif)}</dd><dt>Signalé par</dt><dd>${r.by}</dd><dt>Moyen de réponse</dt><dd>${r.by === 'Visiteur anonyme' ? 'Non fourni (facultatif)' : 'Messagerie BD'}</dd><dt>Reçu le</dt><dd>${G.dt(r.rec)}</dd><dt>Responsable</dt><dd>${r.owner}</dd><dt>Sanction</dt><dd>${san || 'Aucune'}</dd></dl></div>
          <div class="panel"><h3>Décision</h3><p class="small muted" style="margin:4px 0 12px">Motif obligatoire, communiqué à la personne concernée, inscrit au journal.</p>
            <div class="stack">${[['mask', 'Masquer à titre conservatoire', 'Effet immédiat, réversible, alerte envoyée'], ['warn', 'Avertissement', 'Message motivé, sans effet sur la publication'], ['susp', 'Suspension', '7, 14 ou 30 jours, publication retirée'], ['ban', 'Bannissement', 'Compte fermé, numéro et appareil bloqués', { cls: 'danger' }], ['close', 'Clore sans suite', 'Vérifié, rien à reprocher']].map(([v, t, sub, o]) => V.opt('rdec', v, t, sub, o || {})).join('')}</div>
            <div style="margin-top:12px">${V.field('Motif communiqué', { type: 'textarea', name: 'rmotif', max: 400 })}</div>
            <div style="margin-top:12px">${V.btn('Appliquer la décision', { cls: 'sm block', attrs: `data-a="rep-apply" data-id="${r.id}"` })}</div></div>
        </div>
        <div class="grid-2" style="margin-top:14px">
          <div class="panel"><div class="row-b"><h3>Contestation</h3>${ct ? badge(ct.state === 'Acceptée' ? 'ok' : ct.state === 'Rejetée' ? 'danger' : 'warn', ct.state) : ''}</div>
            ${ct ? `<blockquote class="adm-quote">« ${esc(ct.text)} »</blockquote>${ct.state === 'En examen' ? `<div class="row wrapr" style="margin-top:12px">${V.btn('Accepter la contestation', { cls: 'sm', attrs: `data-a="contest" data-id="${r.id}" data-v="Acceptée"` })}${V.btn('Rejeter', { cls: 'sm ghost', attrs: `data-a="contest" data-id="${r.id}" data-v="Rejetée"` })}</div>` : ''}` : `<p class="small muted" style="margin-top:10px">La personne concernée peut contester toute décision pendant 30 jours, depuis son espace ou par e-mail. Une rectification est toujours possible.</p>`}</div>
          ${list({ id: `historique-${r.ref}`, title: 'Historique conservé', sub: 'En ajout seul, conservé pour répondre aux réquisitions des autorités.', cols: [{ l: 'Date', r: (x) => `<span class="small num">${G.dt(x.at)}</span>`, c: (x) => G.dt(x.at) }, { l: 'Qui', k: 'who', cls: 'small b' }, { l: 'Action', k: 'what', cls: 'small' }], rows: h })}
        </div>`),
    };
  });

  /* ================================================================ COFFRE DES JUSTIFICATIFS (Q11-Q12) */
  route(/^\/admin\/coffre$/, () => {
    const logRows = [...st.vault.map((x) => ({ ...x, at: new Date(x.at) })), ...A.VAULT_LOG].sort((a, b) => b.at - a.at);
    const T = tabs('coffre', [['docs', 'Dossiers', A.VAULT.length], ['log', 'Journal des consultations', logRows.length], ['keep', 'Conservation et suppression'], ['auth', 'Remises aux autorités', A.HANDOVER.length]]);
    return {
      title: 'Coffre des justificatifs',
      html: shell('coffre', `${head('Accès réservé · chaque consultation est journalisée', 'Coffre des justificatifs', `<span class="badge v">${I('key', 'sm')} Votre rôle : ${ME.role}</span>`)}
        <div class="callout gold">${I('lock')}<span><b>Accès réservé aux rôles Administration et Admission.</b> Un motif est demandé à chaque ouverture et inscrit au journal. La pièce d’identité reste chez le prestataire de vérification : BD ne conserve que le résultat.</span></div>
        <div class="kpis" style="margin-top:14px">${kpi('Dossiers', A.VAULT.length, '<span class="xs muted">pièces chiffrées, hébergées en Suisse</span>')}${kpi('Consultations · 30 j', logRows.filter((x) => Date.now() - x.at < 30 * DAY).length, '<span class="xs muted">toutes avec motif</span>')}${kpi('Remises aux autorités', A.HANDOVER.length, '<span class="xs muted">double validation</span>')}${kpi('Suppressions planifiées', A.PURGE.length, `<span class="xs muted">prochaine le ${G.d(A.PURGE[0].when)}</span>`, 'dark')}</div>
        <div style="margin-top:14px">${T.bar}</div>
        ${T.pane('docs', list({ id: 'coffre-dossiers', title: 'Dossiers', search: 'Prénom, référence…', cols: [
          { l: 'Professionnelle', r: (v) => who(A.byId(v.who), `${v.docs} pièces`), c: (v) => v.name },
          { l: 'Identité', r: () => `${badge('ok', 'Authentique · majeure')}`, c: () => 'Authentique · majeure' },
          { l: 'Réf. prestataire', k: 'kyc', cls: 'num small' },
          { l: 'Vérifiée le', r: (v) => `<span class="small num">${G.d(v.checked)}</span>`, c: (v) => G.d(v.checked) },
          { l: 'Dernière consultation', r: (v) => { const l = st.vault.filter((x) => x.name === v.name).sort((a, b) => b.at - a.at)[0]; return `<span class="small num">${G.rel(l ? new Date(l.at) : v.last)}</span>`; }, c: (v) => G.dt(v.last) },
          { l: 'Fin de conservation', r: (v) => `<span class="small">${v.end ? G.d(v.end) : 'Durée du compte + délais'}</span>`, c: (v) => (v.end ? G.d(v.end) : 'Durée du compte') },
          { l: '', nocsv: true, cls: 'r', r: (v) => V.btn('Consulter', { cls: 'xs dark', arrow: 'lock', attrs: `data-a="vault" data-id="${v.id}"` }) },
        ], rows: A.VAULT }))}
        ${T.pane('log', list({ id: 'coffre-journal', title: 'Journal des consultations', cols: [{ l: 'Date', r: (x) => `<span class="small num">${G.dt(x.at)}</span>`, c: (x) => G.dt(x.at) }, { l: 'Qui', k: 'who', cls: 'small b' }, { l: 'Rôle', k: 'role', cls: 'small' }, { l: 'Dossier', k: 'name', cls: 'small' }, { l: 'Pièce', k: 'doc', cls: 'small' }, { l: 'Motif', k: 'why', cls: 'small muted' }], rows: logRows }))}
        ${T.pane('keep', `${list({ id: 'coffre-durees', title: 'Durées de conservation', sub: 'Proposition à valider avec le conseil juridique de BD.', cols: [{ l: 'Pièce', r: (d) => `<b class="small">${d[0]}</b>`, c: (d) => d[0] }, { l: 'Ce qui est conservé', r: (d) => `<span class="small">${d[1]}</span>`, c: (d) => d[1] }, { l: 'Durée', r: (d) => `<span class="small">${d[2]}</span>`, c: (d) => d[2] }], rows: A.VAULT_DOCS })}
          <div style="margin-top:14px">${list({ id: 'coffre-suppressions', title: 'Suppressions planifiées', cols: [{ l: 'Contenu', k: 'what', cls: 'small b' }, { l: 'Date prévue', r: (x) => `<span class="small num">${G.dt(x.when)}</span>`, c: (x) => G.dt(x.when) }, { l: 'Délai', r: (x) => `<span class="small">${dueTxt(x.when)}</span>`, c: (x) => dueTxt(x.when) }, { l: '', nocsv: true, cls: 'r', r: (x) => V.btn('Supprimer maintenant', { cls: 'xs danger-ghost', attrs: `data-a="purge" data-v="${esc(x.what)}"` }) }], rows: A.PURGE })}</div>`)}
        ${T.pane('auth', list({ id: 'coffre-remises', title: 'Remises aux autorités', sub: 'Uniquement sur réquisition écrite, avec double validation. Chaque remise est tracée.', tools: V.btn('Enregistrer une remise', { cls: 'xs ghost', arrow: 'plus', attrs: 'data-a="handover"' }), cols: [{ l: 'Date', r: (x) => `<span class="small num">${G.dt(x.at)}</span>`, c: (x) => G.dt(x.at) }, { l: 'Autorité', k: 'auth', cls: 'small b' }, { l: 'Référence', k: 'ref', cls: 'num small' }, { l: 'Pièces remises', k: 'what', cls: 'small' }, { l: 'Par', k: 'by', cls: 'small' }, { l: 'Mode', k: 'how', cls: 'small muted' }], rows: A.HANDOVER }))}`),
    };
  });

  /* ================================================================ FACTURATION (Q55) */
  const invSt = (x) => st.inv[x.n] || x.status;
  const invBadge = (x) => { const s = invSt(x); return badge(s === 'Payée' ? 'ok' : s === 'En retard' ? 'danger' : s === 'En attente' ? 'warn' : s.startsWith('Offerte') ? 'g' : '', s) + (x.late && s === 'En retard' ? `<div class="xs danger">J+${x.late}</div>` : ''); };
  const TVA = 0.081;
  route(/^\/admin\/facturation$/, () => {
    const inv = A.INV.map((x) => ({ ...x, s: invSt(x), _f: invSt(x) })).sort((a, b) => b.issued - a.issued);
    const oct = inv.filter((x) => x.n.includes('-10-'));
    const bank = A.BANK.map((b, k) => ({ ...b, ok: b.ok || !!st.bank[k], inv: b.inv || st.bank[k] || '', k, _f: b.ok || st.bank[k] ? 'ok' : 'todo' }));
    const credits = A.PROS.filter((p) => p.status !== 'attente').map((p) => ({ p, bal: p.credits, bought: p.bought, used: p.used, inc: p.plan === 'premium' ? 18 : p.plan === 'visibilite' ? 6 : 0 })).filter((x) => x.bal || x.bought || x.used);
    const journal = oct.filter((x) => x.amount > 0 && x.s !== 'Offerte (lancement)').flatMap((x) => { const ht = +(x.amount / (1 + TVA)).toFixed(2), tva = +(x.amount - ht).toFixed(2); const acc = x.what.startsWith('Pack') ? '3210 Ventes de mises en avant' : '3200 Ventes d’abonnements'; return [[x.issued, x.n, '1100 Débiteurs', `${x.name} · ${x.what}`, x.amount.toFixed(2), ''], [x.issued, x.n, acc, `${x.name} · ${x.what}`, '', ht.toFixed(2)], [x.issued, x.n, '2200 TVA due 8,1 %', `${x.name} · ${x.what}`, '', tva.toFixed(2)]]; });
    const plans = [['Présence', 149, 'essentiel'], ['Visibilité', 249, 'visibilite'], ['Accompagnement', 399, 'premium'], ['Duo / couple', 299, 'duo']].map(([n, pr, id]) => ({ n, pr, nb: A.PROS.filter((p) => p.plan === id && p.status !== 'attente').length, inc: id === 'visibilite' ? '6 crédits / mois' : id === 'premium' ? '18 crédits / mois, shooting annuel' : id === 'duo' ? '2 profils liés' : '—' }));
    const T = tabs('fact', [['inv', 'Factures', inv.length], ['pay', 'Paiements et rapprochement', bank.filter((b) => !b.ok).length || null], ['dun', 'Relances', A.DUNNING.length], ['av', 'Avoirs et remboursements', A.CREDIT_NOTES.length], ['cr', 'Crédits'], ['offers', 'Formules et codes promo'], ['exp', 'Export comptable']]);
    return {
      title: 'Facturation',
      html: shell('facturation', `${head('Forfaits et crédits · aucune commission sur les rendez-vous', 'Facturation')}
        <div class="kpis">${kpi('Encaissé en octobre', chf(oct.filter((x) => x.s === 'Payée').reduce((a, x) => a + x.amount, 0)), `<span class="xs muted">TVA 8,1 % comprise · ${oct.filter((x) => x.s === 'Payée').length} factures</span>`, 'dark')}${kpi('Impayés', chf(inv.filter((x) => x.s === 'En retard').reduce((a, x) => a + x.amount, 0)), `<span class="xs danger b">${inv.filter((x) => x.s === 'En retard').length} factures en retard</span>`)}${kpi('En attente (factures)', chf(inv.filter((x) => x.s === 'En attente').reduce((a, x) => a + x.amount, 0)), '<span class="xs muted">payables à 10 jours</span>')}${kpi('À rapprocher', bank.filter((b) => !b.ok).length, '<span class="xs muted">paiements sans facture reconnue</span>')}</div>
        <div style="margin-top:14px">${T.bar}</div>
        ${T.pane('inv', list({ id: 'factures', title: 'Factures', search: 'N°, prénom…', filters: [['', 'Toutes'], ['Payée', 'Payées'], ['En attente', 'En attente'], ['En retard', 'En retard'], ['Offerte (lancement)', 'Offertes']], cols: [
          { l: 'N°', k: 'n', cls: 'num small b' }, { l: 'Professionnelle', r: (x) => `<a class="small link" href="#/admin/pro/${x.who}">${esc(x.name)}</a>`, c: (x) => x.name }, { l: 'Objet', k: 'what', cls: 'small' },
          { l: 'Montant TTC', cls: 'r', r: (x) => `<b class="num">${chf(x.amount)}</b>`, c: (x) => x.amount.toFixed(2) },
          { l: 'Émise', r: (x) => `<span class="small num">${G.d(x.issued)}</span>`, c: (x) => G.d(x.issued) }, { l: 'Échéance', r: (x) => `<span class="small num">${G.d(x.due)}</span>`, c: (x) => G.d(x.due) },
          { l: 'Mode', k: 'method', cls: 'small' }, { l: 'État', r: (x) => invBadge(x), c: (x) => invSt(x) },
        ], rows: inv }))}
        ${T.pane('pay', list({ id: 'paiements', title: 'Paiements reçus', sub: 'Prestataire de paiement, TWINT et virements, rapprochés des factures.', filters: [['', 'Tous'], ['ok', 'Rapprochés'], ['todo', 'À rapprocher']], cols: [
          { l: 'Date', r: (b) => `<span class="small num">${G.dt(b.at)}</span>`, c: (b) => G.dt(b.at) }, { l: 'Source', k: 'src', cls: 'small' }, { l: 'Référence', k: 'ref', cls: 'num small' },
          { l: 'Montant', cls: 'r', r: (b) => `<b class="num">${chf(b.amount)}</b>`, c: (b) => b.amount.toFixed(2) }, { l: 'Facture', r: (b) => `<span class="small num">${b.inv || '—'}</span>`, c: (b) => b.inv },
          { l: 'État', r: (b) => (b.ok ? badge('ok', 'Rapproché') : badge('warn', 'À rapprocher')), c: (b) => (b.ok ? 'Rapproché' : 'À rapprocher') },
          { l: '', nocsv: true, cls: 'r', r: (b) => (b.ok ? '' : V.btn('Rapprocher', { cls: 'xs dark', attrs: `data-a="match" data-k="${b.k}"` })) },
        ], rows: bank }))}
        ${T.pane('dun', list({ id: 'relances', title: 'Relances', sub: 'Rappel aimable à J+3, deuxième rappel à J+10, suspension de la publication à J+20. Jamais de mot explicite dans l’objet.', cols: [
          { l: 'Professionnelle', r: (d) => who(A.byId(d.who), `${chf(d.amount)} · J+${d.late}`), c: (d) => d.name },
          ...[0, 1, 2].map((k) => ({ l: ['J+3', 'J+10', 'J+20'][k], r: (d) => (d.steps[k].done ? `${badge(k === 2 ? 'danger' : 'ok', k === 2 ? 'Suspendue' : 'Envoyé')}<div class="xs muted">${G.d(d.steps[k].at)}</div>` : `<span class="small muted">prévu le ${G.d(d.steps[k].at)}</span>`), c: (d) => (d.steps[k].done ? `${d.steps[k].l} le ${G.d(d.steps[k].at)}` : `prévu le ${G.d(d.steps[k].at)}`) })),
          { l: '', nocsv: true, cls: 'r', r: (d) => V.btn('Relancer maintenant', { cls: 'xs ghost', attrs: `data-a="dun" data-id="${d.who}"` }) },
        ], rows: A.DUNNING }))}
        ${T.pane('av', list({ id: 'avoirs', title: 'Avoirs et remboursements', tools: V.btn('Émettre un avoir', { cls: 'xs ghost', arrow: 'plus', attrs: 'data-a="credit-note"' }), cols: [
          { l: 'N°', k: 'n', cls: 'num small b' }, { l: 'Professionnelle', k: 'name', cls: 'small' }, { l: 'Montant', cls: 'r', r: (x) => `<b class="num">${chf(x.amount)}</b>`, c: (x) => x.amount.toFixed(2) },
          { l: 'Date', r: (x) => `<span class="small num">${G.d(x.at)}</span>`, c: (x) => G.d(x.at) }, { l: 'Motif', k: 'why', cls: 'small' }, { l: 'Facture', k: 'inv', cls: 'num small' }, { l: 'Suite', k: 'state', cls: 'small' },
        ], rows: A.CREDIT_NOTES }))}
        ${T.pane('cr', list({ id: 'credits', title: 'Crédits de mise en avant', sub: `Packs ${(V.CREDITS ? V.CREDITS.packs : []).map((k) => `${k.n} crédits ${chf(k.price)}`).join(' · ')}. Crédits inclus selon la formule.`, cols: [
          { l: 'Professionnelle', r: (x) => who(x.p, x.p.planName), c: (x) => x.p.name }, { l: 'Inclus / mois', k: 'inc', cls: 'num small' }, { l: 'Achetés', k: 'bought', cls: 'num small' }, { l: 'Utilisés', k: 'used', cls: 'num small' }, { l: 'Solde', r: (x) => `<b class="num">${x.bal}</b>`, c: (x) => x.bal },
        ], rows: credits }))}
        ${T.pane('offers', `<div class="grid-2">${list({ id: 'formules', title: 'Formules', cols: [{ l: 'Formule', k: 'n', cls: 'b small' }, { l: 'Prix / mois', cls: 'r', r: (x) => `<span class="num">${chf(x.pr)}</span>`, c: (x) => x.pr }, { l: 'Inclus', k: 'inc', cls: 'small' }, { l: 'Abonnées', k: 'nb', cls: 'num small r' }], rows: plans })}
          ${list({ id: 'codes-promo', title: 'Codes promo', tools: V.btn('Créer un code', { cls: 'xs ghost', arrow: 'plus', attrs: 'data-a="promo"' }), cols: [{ l: 'Code', k: 'code', cls: 'num small b' }, { l: 'Avantage', k: 'what', cls: 'small' }, { l: 'Utilisations', r: (x) => `<span class="num small">${x.used}${x.max ? ' / ' + x.max : ''}</span>`, c: (x) => `${x.used}${x.max ? '/' + x.max : ''}` }, { l: 'Fin', r: (x) => `<span class="small num">${x.until ? G.d(x.until) : '—'}</span>`, c: (x) => (x.until ? G.d(x.until) : '') }, { l: 'État', r: (x) => badge(x.state === 'Actif' ? 'ok' : '', x.state), c: (x) => x.state }], rows: [...A.PROMOS, ...(st.promos || []).map((x) => ({ ...x, until: x.until ? new Date(x.until) : null }))] })}</div>
          <div style="margin-top:14px">${list({ id: 'mois-offerts', title: 'Mois offerts', cols: [{ l: 'Professionnelle', r: (x) => who(A.byId(x.who), ''), c: (x) => x.name }, { l: 'Raison', k: 'why', cls: 'small' }, { l: 'Mois', k: 'months', cls: 'num small' }, { l: 'Jusqu’au', r: (x) => `<span class="small num">${G.d(x.until)}</span>`, c: (x) => G.d(x.until) }], rows: A.FREE })}</div>`)}
        ${T.pane('exp', list({ id: 'export-comptable', title: 'Export comptable · octobre', sub: 'Écritures prêtes pour la fiduciaire : débiteurs, ventes hors taxe et TVA due séparées. Le bouton CSV télécharge ce journal.', cols: [{ l: 'Date', r: (x) => `<span class="small num">${G.d(x[0])}</span>`, c: (x) => G.d(x[0]) }, { l: 'Pièce', r: (x) => `<span class="num small">${x[1]}</span>`, c: (x) => x[1] }, { l: 'Compte', r: (x) => `<span class="small">${x[2]}</span>`, c: (x) => x[2] }, { l: 'Libellé', r: (x) => `<span class="small">${esc(x[3])}</span>`, c: (x) => x[3] }, { l: 'Débit', cls: 'r', r: (x) => `<span class="num small">${x[4]}</span>`, c: (x) => x[4] }, { l: 'Crédit', cls: 'r', r: (x) => `<span class="num small">${x[5]}</span>`, c: (x) => x[5] }], rows: journal }))}`),
    };
  });

  /* ================================================================ MISES EN AVANT ET PARRAINAGE (Q55-Q58, Q101) */
  route(/^\/admin\/mises-en-avant$/, () => {
    const days = Array.from({ length: 14 }, (_, k) => G.at(k, 12, 0));
    const occ = A.OCC.map((o) => ({ ...o }));
    const camp = A.CAMP.map((c) => ({ ...c, _f: c.state, lift: c.views[1] && c.views[0] ? pct(c.views[1] / Math.max(1, Math.min(c.days, 7)), c.views[0] / 7) : null }));
    const T = tabs('mea', [['cal', 'Calendrier des encarts'], ['camp', 'Campagnes et effet', camp.length], ['ref', 'Parrainage', A.REFERRALS.length]]);
    const fin = camp.filter((c) => c.state !== 'Programmée' && c.lift != null);
    return {
      title: 'Mises en avant',
      html: shell('mises-en-avant', `${head('Encarts étiquetés « Sponsorisé », limités par zone', 'Mises en avant et parrainage')}${T.bar}
        ${T.pane('cal', `<section class="panel adm-list" data-list="calendrier-encarts" data-title="Calendrier des encarts"><div class="al-head"><div><h3>Occupation · 14 jours</h3><p class="small muted">Places prises sur places disponibles, par zone et par jour.</p></div><div class="al-tools"><button type="button" class="al-csv" data-a="csv">${I('download', 'sm')}CSV</button></div></div>
            <div class="tbl-wrap"><table class="tbl adm-occ"><thead><tr><th>Zone</th>${days.map((d) => `<th class="c">${G.wd(d)}</th>`).join('')}</tr></thead><tbody>${occ.map((o) => `<tr><td class="b small">${o.z} <span class="xs muted">· ${o.max} places</span></td>${o.days.map((n) => `<td class="c" data-c="${n}/${o.max}"><span class="occ-c l${n === 0 ? 0 : n >= o.max ? 3 : n / o.max > .5 ? 2 : 1}">${n}/${o.max}</span></td>`).join('')}</tr>`).join('')}</tbody></table></div>
            <div class="legend" style="margin-top:12px"><span><i class="occ-c l0"></i>Libre</span><span><i class="occ-c l1"></i>Quelques places prises</span><span><i class="occ-c l2"></i>Presque complet</span><span><i class="occ-c l3"></i>Complet</span></div></section>
          <div class="grid-2" style="margin-top:14px"><div class="panel"><h3>Règles des encarts</h3><dl class="kv" style="margin-top:12px"><dt>Places</dt><dd>${st.params.slotsZone || 3} par quartier et par jour, ${st.params.slotsCanton || 6} pour le canton</dd><dt>Durée</dt><dd>1 à 14 jours</dd><dt>Prix</dt><dd>${V.CREDITS ? V.CREDITS.cost.zone : 3} crédits / jour (quartier), ${V.CREDITS ? V.CREDITS.cost.canton : 5} (canton)</dd><dt>Étiquette</dt><dd>Toujours « Sponsorisé », visible</dd><dt>Libellé</dt><dd>Choisi par BD : ${A.LABELS.map((l) => `« ${l} »`).join(', ')}</dd><dt>Ordre</dt><dd>Rotation équitable, filtres de recherche respectés</dd></dl></div>
            <div class="panel"><h3>Distinctions non achetables</h3><ul class="svc" style="margin-top:10px">${['Nouvelle arrivée (moins de 14 jours)', 'Profil complet', 'Photos vérifiées récemment', 'Très demandée cette semaine'].map((x) => `<li>${I('check')}${x}</li>`).join('')}</ul></div></div>`)}
        ${T.pane('camp', `<div class="kpis">${kpi('Campagnes en cours', camp.filter((c) => c.state === 'En cours').length)}${kpi('Programmées', camp.filter((c) => c.state === 'Programmée').length)}${kpi('Effet moyen sur les vues', fin.length ? `+${Math.round(fin.reduce((a, c) => a + c.lift, 0) / fin.length)} %` : '—', '<span class="xs muted">pendant la campagne, vs 7 jours avant</span>', 'dark')}${kpi('Crédits engagés', nf(camp.reduce((a, c) => a + c.credits, 0)))}</div>
          <div style="margin-top:14px">${list({ id: 'campagnes', title: 'Campagnes', sub: 'Vues et contacts sur 7 jours avant, pendant la campagne, et 7 jours après.', filters: [['', 'Toutes'], ['En cours', 'En cours'], ['Programmée', 'Programmées'], ['Terminée', 'Terminées']], cols: [
            { l: 'Professionnelle', r: (c) => who(A.byId(c.who), c.label), c: (c) => c.name }, { l: 'Zone', k: 'zone', cls: 'small' },
            { l: 'Période', r: (c) => `<span class="small num">${G.d(c.start)} → ${G.d(c.end)}</span><div class="xs muted">${c.days} jours</div>`, c: (c) => `${G.d(c.start)} - ${G.d(c.end)}` },
            { l: 'Prix', r: (c) => `<span class="small num">${c.credits} crédits</span><div class="xs muted">≈ ${chf(c.chf)}</div>`, c: (c) => c.credits },
            { l: 'Libellé BD', k: 'label', cls: 'small' }, { l: 'État', r: (c) => badge(c.state === 'En cours' ? 'ok' : c.state === 'Programmée' ? 'v' : '', c.state), c: (c) => c.state },
            { l: 'Vues avant · pendant · après', r: (c) => `<span class="num small">${nf(c.views[0])} · ${c.views[1] ? nf(c.views[1]) : '—'} · ${c.views[2] ? nf(c.views[2]) : '—'}</span>`, c: (c) => c.views.join(' / ') },
            { l: 'Contacts avant · pendant · après', r: (c) => `<span class="num small">${c.contacts[0]} · ${c.contacts[1] || '—'} · ${c.contacts[2] || '—'}</span>`, c: (c) => c.contacts.join(' / ') },
            { l: 'Effet', r: (c) => (c.lift != null ? `<b class="small" style="color:var(--ok)">+${c.lift} %</b>` : '<span class="small muted">—</span>'), c: (c) => (c.lift != null ? c.lift + ' %' : '') },
          ], rows: camp })}</div>`)}
        ${T.pane('ref', `<div class="panel"><h3>Règles du parrainage</h3><dl class="kv" style="margin-top:12px"><dt>Récompense</dt><dd>${st.params.refReward || '1 mois offert'} à la marraine</dd><dt>Condition</dt><dd>${st.params.refCond || 'Après 2 mois payés par la filleule'}</dd><dt>Plafond</dt><dd>${st.params.refMax || '6'} mois par an</dd><dt>Filleule</dt><dd>Même admission que tout le monde, aucun passe-droit</dd></dl></div>
          <div style="margin-top:14px">${list({ id: 'parrainages', title: 'Parrainages', cols: [
            { l: 'Marraine', r: (x) => who(A.byId(x.who), ''), c: (x) => x.name }, { l: 'Code', k: 'code', cls: 'num small b' },
            { l: 'Filleules', r: (x) => (x.kids.length ? x.kids.map(([n, s2, ok]) => `<div class="small">${esc(n)} <span class="xs ${ok ? '' : 'muted'}" style="${ok ? 'color:var(--ok)' : ''}">· ${s2}</span></div>`).join('') : '<span class="small muted">Aucune pour l’instant</span>'), c: (x) => x.kids.map(([n, s2]) => `${n} (${s2})`).join(', ') },
            { l: 'Mois gagnés', r: (x) => `<b class="num">${x.won}</b>`, c: (x) => x.won },
          ], rows: A.REFERRALS })}</div>`)}`),
    };
  });

  /* ================================================================ STATISTIQUES (Q42-Q45, Q73-Q76) */
  route(/^\/admin\/stats$/, () => {
    const N = +st.period, S = A.STATS, k = N / 30;
    const sc = (v) => Math.round(v * k);
    const P = A.PROS.map((p) => ({ ...p, s: proSt(p) }));
    const grp = (f) => Object.entries(P.reduce((a, p) => { const g = f(p); a[g] = (a[g] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]);
    const byStatus = grp((p) => STB[p.s][1]), byCat = grp((p) => p.catLabel), byCity = grp((p) => p.city);
    const dn = V.donut(S.devices);
    const prof = [...byStatus.map(([l, v]) => ({ g: 'Statut', l, v })), ...byCat.map(([l, v]) => ({ g: 'Catégorie', l, v })), ...byCity.map(([l, v]) => ({ g: 'Ville', l, v }))];
    const tr = S.traffic.map(([l, t, v, cv]) => ({ l, t, v: sc(v), cv, _f: t }));
    return {
      title: 'Statistiques',
      html: shell('stats', `${head('Mesure d’audience sans cookie, hébergée en Suisse', 'Statistiques', periodSel())}
        <div class="kpis">${kpi('Vues de fiches', nf(sc(S.use.views)))}${kpi('Ajouts en favoris', nf(sc(S.use.favs)))}${kpi('Comparaisons', nf(sc(S.use.cmp)))}${kpi('Abandons', `${S.use.abandon} %`, '<span class="xs muted">fiche ouverte puis quittée sans contact</span>', 'dark')}</div>
        <h2 class="adm-h2">Profils</h2>
        <div class="grid-3 adm-g3"><div class="panel"><h3>Par statut</h3><div style="margin-top:12px">${bars(byStatus, { w: 100 })}</div></div><div class="panel"><h3>Par catégorie</h3><div style="margin-top:12px">${bars(byCat, { w: 110 })}</div></div><div class="panel"><h3>Par ville</h3><div style="margin-top:12px">${bars(byCity, { w: 90 })}</div></div></div>
        <div style="margin-top:14px">${list({ id: 'profils-repartition', title: 'Profils par statut, catégorie et ville', cols: [{ l: 'Regroupement', k: 'g', cls: 'small muted' }, { l: 'Valeur', k: 'l', cls: 'small b' }, { l: 'Profils', k: 'v', cls: 'num r' }], rows: prof })}</div>
        <h2 class="adm-h2">Recherche</h2>
        <div class="grid-2">${list({ id: 'filtres-utilises', title: 'Filtres utilisés', sub: 'Part des recherches qui utilisent ce filtre.', cols: [{ l: 'Filtre', r: (x) => `<span class="small">${x[0]}</span>`, c: (x) => x[0] }, { l: 'Part', r: (x) => `<div class="adm-mini"><i style="width:${x[1] * 2}%"></i></div>`, c: (x) => x[1] + ' %', nocsv: false }, { l: '%', cls: 'r', r: (x) => `<b class="num small">${x[1]} %</b>`, c: (x) => x[1] }], rows: S.filters })}
          ${list({ id: 'recherches-sans-resultat', title: 'Recherches sans résultat', sub: 'Pour décider des prochaines villes, catégories et langues.', cols: [{ l: 'Recherche', r: (x) => `<b class="small">${x[0]}</b>`, c: (x) => x[0] }, { l: 'Fois', cls: 'r', r: (x) => `<span class="num small">${sc(x[1])}</span>`, c: (x) => sc(x[1]) }, { l: 'Piste', r: (x) => `<span class="small muted">${x[2]}</span>`, c: (x) => x[2] }], rows: S.zero })}</div>
        <h2 class="adm-h2">Contacts</h2>
        <div class="grid-2"><div class="panel"><h3>Contacts par canal</h3><div style="margin-top:12px">${bars(S.channels.map(([l, v]) => [l, v, v + ' %']), { w: 100 })}</div><p class="hint">${nf(sc(S.use.contacts))} clics de contact sur la période.</p></div>
          <div class="panel"><h3>Clics, messages et rendez-vous</h3><p class="small muted">Comptés à part : un clic n’est ni un message, ni un rendez-vous.</p><div class="adm-sep3">${[['Clics de contact', sc(S.declared.clicks), 'mesurés sur le site'], ['Messages', sc(S.declared.msgs), 'déclarés par les professionnelles'], ['Rendez-vous', sc(S.declared.rdv), 'déclarés par les professionnelles']].map(([l, v, s2]) => `<div><b class="num">${nf(v)}</b><span>${l}</span><small>${s2}</small></div>`).join('')}</div></div></div>
        <h2 class="adm-h2">Audience</h2>
        <div class="grid-3 adm-g3"><div class="panel"><h3>Appareils</h3><div class="row" style="margin-top:12px;gap:16px;flex-wrap:wrap">${dn.svg}<div class="legend" style="flex-direction:column;gap:8px">${dn.legend}</div></div></div><div class="panel"><h3>Langues</h3><div style="margin-top:12px">${bars(S.langs.map(([l, v]) => [l, v, v + ' %']), { w: 80 })}</div></div><div class="panel"><h3>Origine</h3><div style="margin-top:12px">${bars(S.origin.map(([l, v]) => [l, v, v + ' %']), { w: 100 })}</div></div></div>
        <div style="margin-top:14px">${list({ id: 'trafic', title: 'Trafic naturel et trafic payant', sub: 'Séparés pour mesurer ce que rapportent les campagnes.', filters: [['', 'Tout'], ['naturel', 'Naturel'], ['payant', 'Payant']], cols: [{ l: 'Source', k: 'l', cls: 'small b' }, { l: 'Type', r: (x) => badge(x.t === 'payant' ? 'g' : 'v', x.t === 'payant' ? 'Payant' : 'Naturel'), c: (x) => x.t }, { l: 'Visites', cls: 'r', r: (x) => `<span class="num small">${nf(x.v)}</span>`, c: (x) => x.v }, { l: 'Taux de contact', cls: 'r', r: (x) => `<span class="num small">${String(x.cv).replace('.', ',')} %</span>`, c: (x) => x.cv }], rows: tr })}</div>
        <div class="callout" style="margin-top:14px">${I('shield')}<span><b>Robots et tests exclus</b> : ${nf(sc(S.excluded.bots))} requêtes de robots et ${sc(S.excluded.tests)} visites de l’équipe retirées de la période. Aucune identité, aucun numéro de téléphone, aucune adresse IP complète dans les statistiques.</span></div>`),
    };
  });

  /* ================================================================ RETOURS PRIVÉS (Q105) */
  route(/^\/admin\/retours$/, () => {
    const rows = A.FEEDBACK.map((f) => ({ ...f, _f: [f.kind, f.from === 'BD' ? 'bd' : 'pro'].join('|') }));
    const n = (k) => rows.filter((r) => r.kind === k).length;
    return {
      title: 'Retours privés',
      html: shell('retours', `${head('Entre BD et les professionnelles · jamais publiés', 'Retours privés')}
        <div class="kpis">${kpi('Positifs', n('Positif'))}${kpi('Négatifs', n('Négatif'))}${kpi('Sans réponse', n('Sans réponse'))}${kpi('Suites données', rows.filter((r) => !r.next.startsWith('Aucune')).length, '<span class="xs muted">décision humaine à chaque fois</span>', 'dark')}</div>
        <div style="margin-top:14px">${list({
          id: 'retours-prives', title: 'Retours', sub: 'Retours des professionnelles après un contact, et retours de l’équipe BD. Aucune note publique, aucun registre de clients.', search: 'Prénom, contact…',
          filters: [['', 'Tous'], ['Positif', 'Positifs'], ['Négatif', 'Négatifs'], ['Sans réponse', 'Sans réponse'], ['pro', 'Des professionnelles'], ['bd', 'De BD']],
          cols: [
            { l: 'Date', r: (f) => `<span class="small num">${G.rel(f.at)}</span>`, c: (f) => G.dt(f.at) },
            { l: 'De', r: (f) => (f.from === 'BD' ? '<b class="small">Équipe BD</b>' : who(A.byId(f.from), '')), c: (f) => f.fromName },
            { l: 'À propos de', k: 'about', cls: 'small' },
            { l: 'Retour', r: (f) => badge(f.kind === 'Positif' ? 'ok' : f.kind === 'Négatif' ? 'danger' : '', f.kind), c: (f) => f.kind },
            { l: 'Commentaire', k: 'text', cls: 'small' }, { l: 'Suite donnée', k: 'next', cls: 'small muted' },
          ], rows,
        })}</div>`),
    };
  });

  /* ================================================================ RÉFÉRENTIELS ET VILLES (Q88-Q89, Q18-Q20) */
  const CITY = { Ouverte: 'ok', 'Ouverture prochainement': 'g', Fermée: '' };
  const PG = { ok: ['ok', 'Publié'], rev: ['warn', 'À relire'], miss: ['danger', 'Manquant'] };
  route(/^\/admin\/referentiels$/, () => {
    const cats = [['Escortes', ['femme'], 'Active', 'Silhouette, cheveux, yeux, langues, pratiques'], ['Escortes trans', ['trans'], 'Active', 'Mêmes critères, catégorie distincte'], ['Escorts hommes', ['homme'], 'Active', 'Mêmes critères, catégorie distincte'], ['Masseuses', ['masseuse'], 'Active', 'Types de massage, sans pratiques sexuelles affichées'], ['BDSM', ['bdsm'], 'Active', 'Rôles, pratiques et limites, lexique encadré'], ['Duos', ['duo'], 'Active', 'Deux personnes vérifiées, profils liés']].map(([l, ids, s2, cr]) => ({ l, n: A.PROS.filter((p) => ids.includes(p.cat)).length, s2, cr }));
    const crit = [['Silhouette', ['Mince', 'Sportive', 'Pulpeuse', 'Ronde'], 'Non', 'Oui'], ['Cheveux', ['Blond', 'Châtain', 'Brun', 'Noir', 'Roux'], 'Non', 'Oui'], ['Yeux', ['Bleu', 'Vert', 'Noisette', 'Marron'], 'Non', 'Non'], ['Langues', ['A1 à C2', '8 langues d’interface'], 'Oui', 'Oui'], ['Rendez-vous', ['Reçoit', 'Se déplace', 'Les deux'], 'Oui', 'Oui'], ['Origine', V.ORIGINS || [], 'Non', 'Oui'], ['Pratiques', [`${Object.keys(V.SERVICES || {}).length} pratiques (catalogue fermé)`], 'Non', 'Oui']].map(([l, vals, req, f]) => ({ l, vals, req, f }));
    const com = (V.COMMUNES || []).map((c) => ({ l: c.label, n: A.PROS.filter((p) => p.commune === c.id).length }));
    const cities = A.CITIES.map((c) => ({ ...c, s2: (st.cities || {})[c.name] || c.state, _f: (st.cities || {})[c.name] || c.state }));
    const T = tabs('ref', [['cat', 'Catégories et critères'], ['com', 'Communes', com.length], ['city', 'Villes', cities.length], ['pages', 'Pages et FAQ']]);
    return {
      title: 'Référentiels',
      html: shell('referentiels', `${head('Traduits une fois, identiques dans toutes les langues', 'Référentiels et villes')}${T.bar}
        ${T.pane('cat', `${list({ id: 'categories', title: 'Catégories', cols: [{ l: 'Catégorie', k: 'l', cls: 'b small' }, { l: 'Profils', k: 'n', cls: 'num small' }, { l: 'État', r: (x) => badge('ok', x.s2), c: (x) => x.s2 }, { l: 'Critères propres', k: 'cr', cls: 'small muted' }], rows: cats })}
          <div style="margin-top:14px">${list({ id: 'criteres', title: 'Critères et valeurs', cols: [{ l: 'Critère', k: 'l', cls: 'b small' }, { l: 'Valeurs', r: (x) => `<div class="chips">${x.vals.map((v) => `<span class="chip sm">${esc(v)}</span>`).join('')}</div>`, c: (x) => x.vals.join(', ') }, { l: 'Obligatoire', k: 'req', cls: 'small' }, { l: 'Filtrable', k: 'f', cls: 'small' }], rows: crit })}</div>`)}
        ${T.pane('com', list({ id: 'communes', title: 'Communes et quartiers', sub: 'Chaque profil indique son quartier, jamais son adresse.', search: 'Commune…', cols: [{ l: 'Commune', k: 'l', cls: 'b small' }, { l: 'Profils', k: 'n', cls: 'num small' }, { l: 'Filtre public', r: () => badge('ok', 'Visible'), c: () => 'Visible' }], rows: com }))}
        ${T.pane('city', `${list({ id: 'villes', title: 'Villes', sub: 'Une ville « ouverture prochainement » accepte les préinscriptions, sans publication.', filters: [['', 'Toutes'], ['Ouverte', 'Ouvertes'], ['Ouverture prochainement', 'Bientôt'], ['Fermée', 'Fermées']], cols: [
            { l: 'Ville', k: 'name', cls: 'b small' }, { l: 'Statut', r: (c) => `<label class="qf-sel adm-sel"><select data-a2="city" data-id="${esc(c.name)}" aria-label="Statut de ${esc(c.name)}">${Object.keys(CITY).map((k2) => `<option${k2 === c.s2 ? ' selected' : ''}>${k2}</option>`).join('')}</select>${I('chevron-down', 'sm')}</label>`, c: (c) => c.s2 },
            { l: 'Ouverture', r: (c) => `<span class="small num">${c.since ? G.d(c.since) : '—'}</span>`, c: (c) => (c.since ? G.d(c.since) : '') }, { l: 'Profils', k: 'pros', cls: 'num small' }, { l: 'Préinscriptions', k: 'pre', cls: 'num small' },
          ], rows: cities })}
          <div style="margin-top:14px">${list({ id: 'preinscriptions', title: 'Préinscriptions', filters: [['', 'Toutes'], ['Lausanne', 'Lausanne'], ['Montreux · Vevey', 'Montreux · Vevey']], cols: [{ l: 'Prénom', k: 'name', cls: 'b small' }, { l: 'Ville', k: 'city', cls: 'small' }, { l: 'Catégorie', k: 'cat', cls: 'small' }, { l: 'Date', r: (x) => `<span class="small num">${G.d(x.at)}</span>`, c: (x) => G.d(x.at) }, { l: 'Source', k: 'src', cls: 'small muted' }], rows: A.PRE.map((x) => ({ ...x, _f: x.city })) })}</div>`)}
        ${T.pane('pages', list({ id: 'pages-faq', title: 'Pages et FAQ dans les 8 langues', sub: 'État de chaque traduction. Le français fait référence.', cols: [{ l: 'Page', k: 't', cls: 'b small' }, ...A.LANGS.map((l, k) => ({ l: `${V.flag(l)} ${l.toUpperCase()}`, cls: 'c', r: (x) => `<span class="adm-pg ${x.st[k]}" title="${PG[x.st[k]][1]}">${x.st[k] === 'ok' ? I('check', 'sm') : x.st[k] === 'rev' ? '…' : '—'}</span>`, c: (x) => PG[x.st[k]][1] }))], rows: A.PAGES, note: `<span class="adm-pg ok">${I('check', 'sm')}</span> Publié · <span class="adm-pg rev">…</span> À relire · <span class="adm-pg miss">—</span> Manquant` }))}`),
    };
  });

  /* ================================================================ MESSAGES (Q53) */
  route(/^\/admin\/messages$/, () => {
    const rows = A.MSG.map((x) => ({ ...x, _f: [x.channel, x.state === 'Échec' ? 'echec' : ''].join('|') }));
    const T = tabs('msg', [['log', 'Journal des envois', rows.length], ['tpl', 'Modèles', A.TPL.length]]);
    return {
      title: 'Messages',
      html: shell('messages', `${head('E-mails et SMS · objet toujours discret', 'Messages')}
        <div class="kpis">${kpi('Envoyés · 7 j', rows.length)}${kpi('Délivrés', `${Math.round((rows.filter((r) => r.state !== 'Échec').length / rows.length) * 100)} %`)}${kpi('En échec', rows.filter((r) => r.state === 'Échec').length, '<span class="xs danger b">à vérifier</span>')}${kpi('Langues', '8', '<span class="xs muted">modèles traduits</span>', 'dark')}</div>
        <div style="margin-top:14px">${T.bar}</div>
        ${T.pane('log', list({ id: 'messages', title: 'Journal des envois', search: 'Destinataire, déclencheur…', filters: [['', 'Tous'], ['E-mail', 'E-mails'], ['SMS', 'SMS'], ['Notification', 'Notifications'], ['echec', 'En échec']], cols: [
          { l: 'Date', r: (x) => `<span class="small num">${G.rel(x.at)}</span>`, c: (x) => G.dt(x.at) }, { l: 'Déclencheur', k: 'trg', cls: 'small b' },
          { l: 'Destinataire', r: (x) => `<span class="small">${esc(x.toName)}</span><div class="xs muted num">${esc(x.to)}</div>`, c: (x) => `${x.toName} ${x.to}` },
          { l: 'Canal', k: 'channel', cls: 'small' }, { l: 'Langue', k: 'lang', cls: 'small' }, { l: 'Objet', r: (x) => `<span class="small">« ${esc(x.subj)} »</span>`, c: (x) => x.subj },
          { l: 'État', r: (x) => `${badge(x.state === 'Échec' ? 'danger' : 'ok', x.state)}${x.fail ? `<div class="xs danger">${x.fail}</div>` : ''}`, c: (x) => x.state + (x.fail ? ` (${x.fail})` : '') },
          { l: '', nocsv: true, cls: 'r', r: (x) => (x.state === 'Échec' ? V.btn('Renvoyer', { cls: 'xs ghost', attrs: `data-a="resend" data-id="${x.id}"` }) : '') },
        ], rows }))}
        ${T.pane('tpl', list({ id: 'modeles', title: 'Modèles', sub: 'Explicites, testables et traduisibles. Aucune donnée privée ni mot explicite dans l’objet.', cols: [{ l: 'Déclencheur', r: (t) => `<b class="small">${t[0]}</b>`, c: (t) => t[0] }, { l: 'Canal', r: (t) => `<span class="small">${t[1]}</span>`, c: (t) => t[1] }, { l: 'Objet discret', r: (t) => `<span class="small">« ${t[2]} »</span>`, c: (t) => t[2] }, { l: 'Langues', r: () => `<span class="adm-flags">${A.LANGS.map((l) => V.flag(l)).join('')}</span>`, c: () => A.LANGS.join(' ').toUpperCase() }, { l: '', nocsv: true, cls: 'r', r: (t) => V.btn('Envoyer un test', { cls: 'xs ghost', attrs: `data-a="tpl-test" data-v="${esc(t[0])}"` }) }], rows: A.TPL }))}`),
    };
  });

  /* ================================================================ PARAMÈTRES */
  const PARAMS = [
    ['expire', 'Expiration du statut « Disponible maintenant »', ['30 min', '60 min', '90 min', '2 h'], '60 min', 'Statut et contrôles'],
    ['media', 'Contrôle médias (selfie de comparaison)', ['Tous les 60 jours', 'Tous les 90 jours', 'Tous les 120 jours'], 'Tous les 90 jours', 'Statut et contrôles'],
    ['itw', 'Entretien d’indépendance', ['Tous les 3 mois', 'Tous les 6 mois', 'Tous les 12 mois'], 'Tous les 6 mois', 'Statut et contrôles'],
    ['ai', 'Seuil de l’IA pour une alerte prioritaire', [['0.7', '0,70'], ['0.75', '0,75'], ['0.8', '0,80'], ['0.85', '0,85'], ['0.9', '0,90']], '0.8', 'Modération'],
    ['slotsZone', 'Encarts sponsorisés par quartier et par jour', ['2', '3', '4', '5'], '3', 'Encarts'],
    ['slotsCanton', 'Encarts sponsorisés pour le canton, par jour', ['4', '6', '8'], '6', 'Encarts'],
    ['refReward', 'Récompense de la marraine', ['1 mois offert', '2 mois offerts', '30 crédits'], '1 mois offert', 'Parrainage'],
    ['refCond', 'Condition', ['Après 1 mois payé par la filleule', 'Après 2 mois payés par la filleule', 'Après 3 mois payés par la filleule'], 'Après 2 mois payés par la filleule', 'Parrainage'],
    ['refMax', 'Plafond par an', ['3', '6', '12'], '6', 'Parrainage'],
    ['susp', 'Suspension de la publication après impayé', ['J+14', 'J+20', 'J+30'], 'J+20', 'Facturation'],
  ];
  const pval = (k, d) => st.params[k] || d;
  route(/^\/admin\/parametres$/, () => {
    const groups = [...new Set(PARAMS.map((x) => x[4]))];
    return {
      title: 'Paramètres',
      html: shell('parametres', `${head('Règles de la plateforme · chaque changement est journalisé', 'Paramètres', V.btn('Enregistrer', { cls: 'sm', arrow: 'check', attrs: 'data-a="params"' }))}
        <div class="adm-params">${groups.map((g) => `<div class="panel"><h3>${g}</h3><div class="stack" style="margin-top:14px">${PARAMS.filter((x) => x[4] === g).map(([k, l, opts, d]) => V.field(l, { type: 'select', name: 'p-' + k, value: pval(k, d), options: opts })).join('')}</div>${g === 'Modération' ? '<p class="hint">Au-dessus du seuil : alerte prioritaire pour l’équipe. Jamais de refus automatique.</p>' : g === 'Encarts' ? '<p class="hint">Les encarts restent étiquetés et ne remplacent jamais les résultats de recherche.</p>' : ''}</div>`).join('')}</div>`),
    };
  });

  /* ================================================================ RÔLES ET JOURNAL */
  const ROLEB = { Tout: 'ok', Lecture: 'v', '—': '', 'Avec motif': 'g', 'Sans données sensibles': 'warn', 'Formule et paiements': 'warn', Créer: 'v' };
  const rolesPage = () => {
    const aud = audit().map((a) => ({ ...a, _f: a.role === '—' ? 'Système' : a.role }));
    const team = A.TEAM.map((t) => ({ ...t, role: (st.roles || {})[t.n] || t.role }));
    const T = tabs('roles', [['roles', 'Rôles'], ['team', 'Équipe', team.length], ['audit', 'Journal d’audit', aud.length]]);
    return {
      title: 'Rôles et journal',
      html: shell('roles', `${head('Chaque rôle n’accède qu’à ce dont il a besoin', 'Rôles et journal')}${T.bar}
        ${T.pane('roles', list({ id: 'roles', title: 'Droits par rôle', sub: 'Double authentification obligatoire pour tous les rôles.', cols: [{ l: 'Espace', r: (x) => `<b class="small">${x[0]}</b>`, c: (x) => x[0] }, ...A.ROLES.map((r, k) => ({ l: r, cls: 'c', r: (x) => (x[1][k] === '—' ? '<span class="muted">—</span>' : badge(ROLEB[x[1][k]] || '', x[1][k])), c: (x) => x[1][k] }))], rows: A.AREAS }))}
        ${T.pane('team', list({ id: 'equipe', title: 'Équipe', tools: V.btn('Inviter un membre', { cls: 'xs ghost', arrow: 'plus', attrs: 'data-a="invite"' }), cols: [{ l: 'Membre', r: (t) => `<div class="adm-who"><span class="adm-av ini">${t.n.replace(/\W/g, '')}</span><b>${t.n}</b></div>`, c: (t) => t.n }, { l: 'Rôle', k: 'role', cls: 'small' }, { l: 'Double authentification', r: (t) => `${badge('ok', 'Active')} <span class="xs muted">${t.mfa}</span>`, c: (t) => t.mfa }, { l: 'Dernière connexion', r: (t) => `<span class="small num">${G.rel(t.last)}</span>`, c: (t) => G.dt(t.last) }, { l: '', nocsv: true, cls: 'r', r: (t) => (t.n === ME.n ? '<span class="xs muted">Vous</span>' : V.btn('Changer le rôle', { cls: 'xs ghost', attrs: `data-a="role" data-id="${t.n}"` })) }], rows: team }))}
        ${T.pane('audit', `<div class="callout ok" style="margin-bottom:14px">${I('shield')}<span><b>Journal en ajout seul.</b> Aucune ligne ne peut être modifiée ni supprimée, même par l’administration. Chaque ligne porte l’empreinte de la précédente : toute altération se voit. Aucune pièce brute n’y figure.</span>${V.btn('Vérifier l’intégrité', { cls: 'xs ghost', attrs: 'data-a="verify"' })}</div>
          ${list({ id: 'journal-audit', title: 'Journal d’audit', search: 'Qui, action, objet…', filters: [['', 'Tout'], ['Administration', 'Administration'], ['Admission', 'Admission'], ['Modération', 'Modération'], ['Support', 'Support'], ['Finances', 'Finances'], ['Système', 'Système']], cols: [{ l: 'N°', k: 'n', cls: 'num small muted' }, { l: 'Date', r: (a) => `<span class="small num">${G.dt(a.at)}</span>`, c: (a) => G.dt(a.at) }, { l: 'Qui', k: 'who', cls: 'small b' }, { l: 'Rôle', k: 'role', cls: 'small' }, { l: 'Action', k: 'what', cls: 'small' }, { l: 'Objet', k: 'obj', cls: 'small muted' }, { l: 'Empreinte', r: (a) => `<code class="adm-hash">${a.h}</code>`, c: (a) => a.h }], rows: aud })}`)}`),
    };
  };
  route(/^\/admin\/roles$/, rolesPage);
  route(/^\/admin\/audit$/, () => { st.tab.roles = 'audit'; return rolesPage(); });
  route(/^\/admin\/escortes$/, () => { location.replace('#/admin/pros'); return { html: '' }; });
  route(/^\/admin\/referentiel$/, () => { location.replace('#/admin/referentiels'); return { html: '' }; });

  /* ================================================================ ACTIONS */
  const sheetOk = (sh, fn) => { $('[data-ok]', sh).onclick = fn; };
  const done = (msg, icon = 'check') => { V.toast(msg, { icon, ms: 3200 }); V.render(); };
  const ACT = {
    csv: (el) => exportCsv(el.closest('[data-list]')),
    flt: (el) => { const sec = el.closest('[data-list]'); $$('.al-f .chip', sec).forEach((c) => c.classList.toggle('on', c === el)); sec.dataset.fv = el.dataset.v; applyFilter(sec); },
    tab: (el) => { st.tab[el.dataset.k] = el.dataset.v; save(); const root = el.closest('.adm-main'); $$(`.adm-tabs [data-k="${el.dataset.k}"]`, root).forEach((b) => b.classList.toggle('on', b === el)); $$('[data-pane]', root).forEach((p) => { if (p.dataset.pane.startsWith(el.dataset.k + ':')) p.hidden = p.dataset.pane !== `${el.dataset.k}:${el.dataset.v}`; }); },
    period: (el) => { st.period = el.dataset.v; save(); V.render(); },
    cand: (el) => {
      const c = A.CAND.find((x) => x.id === el.dataset.id), d = el.dataset.d;
      const def = { accepté: 'Votre dossier est accepté. Choisissez votre formule pour la mise en ligne.', 'à compléter': c.missing.length ? `Il manque : ${c.missing.join(', ')}.` : 'Merci de compléter votre dossier.', refusé: 'Nous ne pouvons pas accepter votre dossier pour le moment.' }[d];
      const sh = V.sheet.open({ title: `${CST[d][1]} · ${c.name}`, body: `<p class="small muted">Message envoyé à la candidate (e-mail, objet « Votre dossier BD »), inscrit au journal.</p><div style="margin-top:12px">${V.field('Message', { type: 'textarea', name: 'cmsg', value: def, max: 500 })}</div>`, foot: V.btn('Confirmer', { cls: 'sm block' + (d === 'refusé' ? ' danger' : ''), attrs: 'data-ok' }) });
      sheetOk(sh, () => { st.cand[c.id] = { status: d, msg: $('textarea', sh).value.trim(), at: Date.now() }; log(`Candidature : ${CST[d][1].toLowerCase()}`, `${c.name} (${c.ref})`); V.sheet.close(); done(`${c.name} · ${CST[d][1].toLowerCase()}. Message envoyé, inscrit au journal.`); });
    },
    'prep-remind': (el) => { const p = A.byId(el.dataset.id); log('Relance de validation envoyée', p.name); V.toast(`Relance envoyée à ${p.name} (lien sécurisé, objet « Votre compte BD »).`, { icon: 'mail' }); },
    import: () => { const sh = V.sheet.open({ title: 'Importer des profils préparés', body: `<p class="small muted">Fichier CSV ou tableur préparé avec chaque professionnelle : prénom, catégorie, quartier, langues, tarifs, dossier de photos. Âge 18 ans et plus obligatoire, sinon la ligne est refusée.</p><div class="adm-drop" style="margin-top:12px">${I('upload')}<b>Déposez le fichier ici</b><span class="small muted">profils-premieres.csv · 40 lignes maximum</span></div>`, foot: V.btn('Importer (démonstration)', { cls: 'sm block', attrs: 'data-ok' }) }); sheetOk(sh, () => { V.sheet.close(); log('Import de profils préparés (démonstration)', '0 ligne'); V.toast('Démonstration : aucun fichier importé. En production, chaque ligne devient un profil à faire valider par la professionnelle.', { icon: 'info', ms: 5000 }); }); },
    'ctl-plan': (el) => {
      const p = A.byId(el.dataset.id); const opts = Array.from({ length: 6 }, (_, k) => G.at(k + 2, [10, 14, 16][k % 3], k % 2 ? 30 : 0)).filter((d) => d.getDay() !== 0);
      const sh = V.sheet.open({ title: `Proposer un contrôle · ${p.name}`, body: `<div class="stack">${V.field('Contrôle', { type: 'select', name: 'kind', value: 'Contrôle médias (selfie)', options: ['Contrôle médias (selfie)', 'Entretien d’indépendance'] })}${V.field('Date proposée (heure de Genève)', { type: 'select', name: 'when', value: String(opts[0].getTime()), options: opts.map((d) => [String(d.getTime()), `${G.long(d)} à ${G.t(d)}`]) })}${V.field('Mode', { type: 'select', name: 'mode', value: 'Visio', options: ['Visio', 'Bureau'] })}</div><p class="hint">La professionnelle reçoit un message discret et confirme ou reporte depuis son espace.</p>`, foot: V.btn('Proposer cette date', { cls: 'sm block', attrs: 'data-ok' }) });
      sheetOk(sh, () => { const when = +$('[name="when"]', sh).value; st.ctl[p.id] = { id: p.id, when, state: 'proposé', mode: $('[name="mode"]', sh).value, kind: $('[name="kind"]', sh).value, from: null, by: 'BD' }; log('Contrôle proposé', `${p.name} · ${G.dt(new Date(when))}`); V.sheet.close(); done(`Date proposée à ${p.name} : ${G.long(new Date(when))} à ${G.t(new Date(when))}.`, 'calendar'); });
    },
    'ctl-answer': (el) => {
      const p = A.byId(el.dataset.id), c = ctlOf(p.id), v = el.dataset.v;
      const nw = v === 'reporté' ? c.when.getTime() + 2 * DAY : c.when.getTime();
      st.ctl[p.id] = { id: p.id, when: nw, state: v, mode: c.mode, kind: c.kind, from: v === 'reporté' ? c.when.getTime() : null, by: 'La professionnelle' };
      log(v === 'confirmé' ? 'Contrôle confirmé par la professionnelle' : 'Contrôle reporté par la professionnelle', `${p.name} · ${G.dt(new Date(nw))}`);
      done(v === 'confirmé' ? `${p.name} confirme le ${G.long(new Date(nw))} à ${G.t(new Date(nw))}.` : `${p.name} reporte au ${G.long(new Date(nw))} à ${G.t(new Date(nw))}. L’équipe est prévenue.`, 'calendar');
    },
    mask: (el) => {
      const p = A.byId(el.dataset.id);
      if (st.masked[p.id]) { st.masked[p.id] = null; log('Profil réaffiché', p.name); return done(`${p.name} est de nouveau visible. La professionnelle est prévenue.`, 'eye'); }
      const sh = V.sheet.open({ title: `Masquer ${p.name}`, body: `<p class="small muted">Le profil disparaît immédiatement du site. Une alerte part à l’équipe et à la professionnelle (e-mail et SMS, objet discret).</p><div style="margin-top:12px">${V.field('Motif', { type: 'select', name: 'why', value: 'Signalement en cours d’examen', options: ['Signalement en cours d’examen', 'Contrôle médias en retard', 'Demande de la professionnelle', 'Photos à remplacer', 'Impayé'] })}</div>`, foot: V.btn('Masquer et alerter', { cls: 'sm block danger', attrs: 'data-ok' }) });
      sheetOk(sh, () => { const why = $('select', sh).value; st.masked[p.id] = { at: Date.now(), why, by: ME.n }; log('Profil masqué, alerte envoyée', `${p.name} · ${why}`); V.sheet.close(); done(`${p.name} masqué. Alerte envoyée à l’équipe et à la professionnelle.`, 'bell'); });
    },
    suspend: async (el) => {
      const p = A.byId(el.dataset.id);
      if (proSt(p) === 'suspendu') { if (!(await V.confirm({ title: `Lever la suspension de ${p.name}`, text: 'La publication reprend immédiatement. La professionnelle est prévenue.', ok: 'Lever' }))) return; st.pro[p.id] = 'actif'; log('Suspension levée', p.name); return done(`Suspension levée pour ${p.name}.`); }
      const sh = V.sheet.open({ title: `Suspendre ${p.name}`, body: `<div class="stack">${V.field('Durée', { type: 'select', name: 'dur', value: '7 jours', options: ['7 jours', '14 jours', '30 jours', 'Jusqu’à nouvel ordre'] })}${V.field('Motif communiqué', { type: 'textarea', name: 'why', max: 300 })}</div><p class="hint">Motif obligatoire. La professionnelle peut contester pendant 30 jours.</p>`, foot: V.btn('Suspendre', { cls: 'sm block danger', attrs: 'data-ok' }) });
      sheetOk(sh, () => { const why = $('textarea', sh).value.trim(); if (!why) return V.toast('Indiquez un motif.', { icon: 'info' }); st.pro[p.id] = 'suspendu'; log(`Suspension ${$('select', sh).value}`, `${p.name} · ${why}`); V.sheet.close(); done(`${p.name} suspendue. Motif envoyé, inscrit au journal.`); });
    },
    note: (el) => { const ta = $('textarea[name="note"]'); const t = (ta.value || '').trim(); if (!t) return V.toast('Écrivez la note.', { icon: 'info' }); (st.notes[el.dataset.id] = st.notes[el.dataset.id] || []).push({ who: ME.n, at: Date.now(), t }); log('Note interne ajoutée', A.byId(el.dataset.id).name); done('Note ajoutée. Visible par l’équipe seulement.'); },
    client: (el) => {
      const k = A.CLIENTS.find((x) => x.id === el.dataset.id); const s = accSt(k);
      log('Compte client consulté', k.pseudo);
      const sh = V.sheet.open({ title: `Compte client · ${k.pseudo}`, side: true, body: `<div class="adm-views"><div><h4>${I('key', 'sm')} Ce que voit l’administration</h4><dl class="kv"><dt>Pseudo</dt><dd>${esc(k.pseudo)}</dd><dt>E-mail</dt><dd class="num">${k.email}</dd><dt>Créé le</dt><dd>${G.dt(k.created)}</dd><dt>Dernière visite</dt><dd>${G.dt(k.seen)}</dd><dt>Favoris · masqués</dt><dd>${k.favs} · ${k.hidden}</dd><dt>Alertes</dt><dd>${k.alerts}</dd><dt>Signalements le concernant</dt><dd>${k.reports}</dd><dt>Signalements faits</dt><dd>${k.made}</dd><dt>Statut</dt><dd>${s}</dd></dl></div>
        <div><h4>${I('user', 'sm')} Ce que voit le support</h4><dl class="kv"><dt>Pseudo</dt><dd>${esc(k.pseudo)}</dd><dt>E-mail</dt><dd class="muted">masqué</dd><dt>Langue · appareil</dt><dd>${k.lang} · ${k.device}</dd><dt>Dernière visite</dt><dd>${G.d(k.seen)}</dd><dt>Statut</dt><dd>${s}</dd><dt>Favoris, signalements</dt><dd class="muted">non visibles</dd></dl></div></div>
        <div class="callout" style="margin-top:14px">${I('eye-off')}<span><b>Jamais public.</b> Aucun profil client, aucun avis signé, aucune liste. Les favoris restent privés.</span></div>`, foot: `${V.btn(s === 'Suspendu' ? 'Réactiver' : 'Suspendre le compte', { cls: 'sm ' + (s === 'Suspendu' ? '' : 'danger-ghost'), attrs: 'data-ok' })}` });
      sheetOk(sh, () => { st.acc[k.id] = s === 'Suspendu' ? 'Actif' : 'Suspendu'; log(s === 'Suspendu' ? 'Compte client réactivé' : 'Compte client suspendu', k.pseudo); V.sheet.close(); done(`Compte « ${k.pseudo} » ${s === 'Suspendu' ? 'réactivé' : 'suspendu'}.`); });
    },
    mod: (el) => {
      const m = A.MOD.find((x) => x.id === el.dataset.id), p = A.byId(m.who), s = modSt(m), dec = modDec(m);
      const sh = V.sheet.open({ title: `${m.type[0].toUpperCase() + m.type.slice(1)} · ${p.name}`, side: true, body: `
        <div class="adm-vers">${m.versions.map((v) => `<figure>${thumb(m, true)}<figcaption><b>v${v.v}</b> · ${G.rel(v.d)}<br><span class="xs muted">${v.note}</span></figcaption></figure>`).join('')}</div>
        <h4 class="adm-h4">Résultat de l’IA</h4><div class="adm-score big"><span style="width:${m.score * 100}%"></span><i style="left:${threshold() * 100}%" title="Seuil"></i></div><p class="small"><b>${Math.round(m.score * 100)} %</b> · seuil ${Math.round(threshold() * 100)} % ${m.score >= threshold() ? '· <span class="danger b">au-dessus du seuil</span>' : ''}</p>
        <ul class="adm-flags-l">${m.flags.length ? m.flags.map((f) => `<li>${I('alert', 'sm')}${esc(f)}</li>`).join('') : `<li class="ok">${I('check', 'sm')}Rien à signaler</li>`}</ul>
        <h4 class="adm-h4">Décision</h4>${dec ? `<p class="small">${badge(...MST[s])} ${esc(dec.motif)}<br><span class="xs muted">${esc(dec.by)} · ${G.dt(new Date(dec.at))}</span>${dec.msg ? `<br><span class="xs muted">${esc(dec.msg)}</span>` : ''}</p>` : '<p class="small muted">En attente d’une décision humaine.</p>'}
        <div class="stack" style="margin-top:12px">${V.field('Motif', { type: 'select', name: 'motif', value: 'Conforme', options: ['Conforme', 'Coordonnées dans le texte', 'Image provenant d’un autre site', 'Nudité explicite', 'Qualité insuffisante', 'Personne non vérifiée sur la photo'] })}${V.field('Message à la professionnelle (en cas de refus)', { type: 'textarea', name: 'msg', max: 300 })}</div>
        <p class="hint">Aucune sanction automatique : bloquer un contenu ne suspend pas le profil.</p>`,
        foot: `${V.btn('Valider', { cls: 'sm', attrs: 'data-d="validé"' })}${V.btn('Refuser avec message', { cls: 'sm ghost', attrs: 'data-d="refusé"' })}${s === 'bloqué' ? V.btn('Débloquer', { cls: 'sm ghost', attrs: 'data-d="à revoir"' }) : V.btn('Bloquer', { cls: 'sm danger-ghost', attrs: 'data-d="bloqué"' })}` });
      $$('[data-d]', sh).forEach((b) => { b.onclick = () => {
        const d = b.dataset.d, motif = $('[name="motif"]', sh).value, msg = $('[name="msg"]', sh).value.trim();
        if (d === 'refusé' && !msg) return V.toast('Écrivez le message à la professionnelle.', { icon: 'info' });
        st.mod[m.id] = { state: d, decision: d === 'à revoir' ? null : { by: `Admin · ${ME.n}`, at: Date.now(), motif: d === 'validé' ? 'Conforme' : motif, msg } };
        log(d === 'validé' ? 'Contenu validé' : d === 'refusé' ? 'Contenu refusé avec message' : d === 'bloqué' ? 'Contenu bloqué' : 'Contenu débloqué', `${p.name} · ${m.type} ${m.id}`);
        V.sheet.close(); done(`${p.name} · ${m.type} ${d === 'à revoir' ? 'débloqué, à revoir' : d}. Inscrit au journal.`);
      }; });
    },
    'rep-apply': (el) => {
      const r = A.REP.find((x) => x.id === el.dataset.id); const a = $('input[name="rdec"]:checked'); const why = ($('textarea[name="rmotif"]').value || '').trim();
      if (!a) return V.toast('Choisissez une décision.', { icon: 'info' });
      if (!why && a.value !== 'close') return V.toast('Le motif est obligatoire.', { icon: 'info' });
      const L = { mask: ['Masqué à titre conservatoire', 'En cours', null], warn: ['Avertissement', 'Sanction appliquée', 'Avertissement'], susp: ['Suspension 7 jours', 'Sanction appliquée', 'Suspension 7 jours'], ban: ['Bannissement', 'Sanction appliquée', 'Bannissement'], close: ['Clos sans suite', 'Clos', null] }[a.value];
      const cur = st.rep[r.id] || {}; cur.status = L[1]; if (L[2]) cur.sanction = L[2]; cur.hist = [...(cur.hist || []), { at: Date.now(), who: `Admin · ${ME.n}`, what: `${L[0]}${why ? ' · motif : ' + why : ''}` }]; st.rep[r.id] = cur;
      if (a.value === 'mask' && r.t) st.masked[r.t.id] = { at: Date.now(), why: `Signalement ${r.ref}`, by: ME.n };
      log(L[0], `${r.ref} · ${target(r)}`); done(`${r.ref} : ${L[0].toLowerCase()}. Inscrit au journal et à l’historique.`);
    },
    contest: (el) => { const r = A.REP.find((x) => x.id === el.dataset.id); const v = el.dataset.v; const cur = st.rep[r.id] || {}; cur.contest = { ...(r.contest || {}), state: v }; if (v === 'Acceptée') { cur.sanction = null; cur.status = 'Clos'; } cur.hist = [...(cur.hist || []), { at: Date.now(), who: `Admin · ${ME.n}`, what: `Contestation ${v.toLowerCase()}${v === 'Acceptée' ? ', sanction levée' : ''}` }]; st.rep[r.id] = cur; log(`Contestation ${v.toLowerCase()}`, r.ref); done(`Contestation ${v.toLowerCase()}. La personne concernée est prévenue.`); },
    vault: (el) => {
      const v = A.VAULT.find((x) => x.id === el.dataset.id);
      const sh = V.sheet.open({ title: `Coffre · ${v.name}`, body: `<p class="small muted">Accès réservé. Indiquez pourquoi vous ouvrez ce dossier : le motif est inscrit au journal avec votre nom et l’heure.</p><div class="stack" style="margin-top:12px">${V.field('Pièce', { type: 'select', name: 'doc', value: A.VAULT_DOCS[0][0], options: A.VAULT_DOCS.map((d) => d[0]) })}${V.field('Motif de la consultation', { type: 'select', name: 'why', value: 'Contrôle périodique', options: ['Contrôle périodique', 'Signalement en cours', 'Contestation', 'Réquisition d’une autorité', 'Demande de la professionnelle'] })}</div>`, foot: V.btn('Ouvrir le dossier', { cls: 'sm block', arrow: 'lock', attrs: 'data-ok' }) });
      sheetOk(sh, () => {
        const doc = $('[name="doc"]', sh).value, why = $('[name="why"]', sh).value;
        st.vault.push({ at: Date.now(), who: ME.n, role: ME.role, name: v.name, doc, why }); log('Consultation du coffre', `${v.name} · ${doc} · ${why}`);
        V.sheet.close();
        V.sheet.open({ title: `${v.name} · ${doc}`, body: `<dl class="kv"><dt>Prestataire</dt><dd>Partenaire suisse de vérification</dd><dt>Référence</dt><dd class="num">${v.kyc}</dd><dt>Résultat</dt><dd>${doc.startsWith('Vérification') ? 'Document authentique · personne majeure (18 ans et plus)' : doc.startsWith('Concordance') ? 'Même personne · 96 %' : doc.startsWith('Entretien') ? 'Indépendance confirmée' : 'Signé électroniquement'}</dd><dt>Date</dt><dd>${G.dt(v.checked)}</dd></dl><div class="callout gold" style="margin-top:14px">${I('lock')}<span>La pièce d’identité reste chez le prestataire. BD n’en garde ni copie ni photo : seul ce résultat s’affiche.</span></div><p class="hint">Consultation inscrite au journal : ${ME.n} · ${G.dt(new Date())} · ${esc(why)}.</p>` });
        if (st.tab.coffre === 'log') V.render();
      });
    },
    purge: async (el) => { if (!(await V.confirm({ title: 'Supprimer maintenant', text: `« ${el.dataset.v} » sera supprimé définitivement. La suppression est inscrite au journal (sans le contenu).`, ok: 'Supprimer', danger: true }))) return; log('Suppression de justificatifs', el.dataset.v); V.toast('Démonstration : suppression inscrite au journal.', { icon: 'trash' }); },
    handover: () => { const sh = V.sheet.open({ title: 'Enregistrer une remise aux autorités', body: `<div class="stack">${V.field('Autorité', { value: 'Police judiciaire de Genève' })}${V.field('Référence de la réquisition', { value: 'PJ-GE-2026-' })}${V.field('Pièces remises', { type: 'textarea', name: 'what', max: 300 })}${V.field('Seconde validation', { type: 'select', value: 'S. B.', options: ['S. B.', 'J. P.'] })}</div><p class="hint">Uniquement sur réquisition écrite. La seconde personne confirme depuis son propre compte.</p>`, foot: V.btn('Enregistrer', { cls: 'sm block', attrs: 'data-ok' }) }); sheetOk(sh, () => { log('Remise aux autorités enregistrée (en attente de seconde validation)', $$('input', sh)[1].value); V.sheet.close(); V.toast('Remise enregistrée, en attente de la seconde validation.', { icon: 'shield', ms: 3500 }); }); },
    match: (el) => {
      const b = A.BANK[+el.dataset.k]; const open = A.INV.filter((x) => ['En retard', 'En attente'].includes(invSt(x)));
      const sh = V.sheet.open({ title: `Rapprocher ${chf(b.amount)} · ${b.src}`, body: `<p class="small muted">Référence : ${esc(b.ref)} · ${G.dt(b.at)}</p><div class="stack" style="margin-top:12px">${open.map((x, k) => V.opt('minv', x.n, `${x.n} · ${esc(x.name)} · ${chf(x.amount)}`, `${x.what} · ${invSt(x)}`, { on: k === 0 && x.amount === b.amount })).join('')}</div>`, foot: V.btn('Rapprocher', { cls: 'sm block', attrs: 'data-ok' }) });
      sheetOk(sh, () => { const a = $('input[name="minv"]:checked', sh); if (!a) return V.toast('Choisissez une facture.', { icon: 'info' }); st.bank[el.dataset.k] = a.value; st.inv[a.value] = 'Payée'; log('Paiement rapproché manuellement', `${a.value} · ${chf(b.amount)}`); V.sheet.close(); done(`Paiement rapproché de ${a.value}. Facture marquée payée.`); });
    },
    dun: (el) => { const p = A.byId(el.dataset.id); log('Rappel de paiement envoyé', p.name); V.toast(`Rappel envoyé à ${p.name} (e-mail et SMS, objet « Rappel BD »).`, { icon: 'mail' }); },
    'credit-note': () => { const sh = V.sheet.open({ title: 'Émettre un avoir', body: `<div class="stack">${V.field('Professionnelle', { type: 'select', value: 'Rosa', options: A.PROS.filter((p) => p.status !== 'attente').map((p) => p.name) })}${V.field('Montant (CHF)', { type: 'number', value: '50' })}${V.field('Motif', { type: 'select', value: 'Geste commercial', options: ['Geste commercial', 'Double prélèvement', 'Pause au prorata', 'Mise en avant interrompue'] })}${V.field('Suite', { type: 'select', value: 'Imputé sur la prochaine facture', options: ['Imputé sur la prochaine facture', 'Remboursé sur la carte', 'Rendu en crédits'] })}</div>`, foot: V.btn('Émettre', { cls: 'sm block', attrs: 'data-ok' }) }); sheetOk(sh, () => { log('Avoir émis (démonstration)', $('select', sh).value); V.sheet.close(); V.toast('Avoir AV-2026-0008 émis (démonstration). Inscrit au journal.', { icon: 'check' }); }); },
    promo: () => { const sh = V.sheet.open({ title: 'Nouveau code promo', body: `<div class="stack">${V.field('Code', { name: 'code', value: 'NOEL2026' })}${V.field('Avantage', { type: 'select', name: 'what', value: '1 mois offert', options: ['1 mois offert', '2 mois offerts', '-20 % pendant 3 mois', '10 crédits offerts'] })}${V.field('Utilisations maximum', { type: 'number', name: 'max', value: '40' })}</div>`, foot: V.btn('Créer', { cls: 'sm block', attrs: 'data-ok' }) }); sheetOk(sh, () => { const code = ($('[name="code"]', sh).value || 'CODE').toUpperCase().replace(/\s/g, ''); st.promos = [...(st.promos || []), { code, what: $('[name="what"]', sh).value, used: 0, max: +$('[name="max"]', sh).value || null, until: G.at(60, 23, 59).getTime(), state: 'Actif' }]; log('Code promo créé', code); V.sheet.close(); done(`Code ${code} créé.`, 'gift'); }); },
    resend: (el) => { const x = A.MSG.find((y) => y.id === el.dataset.id); log('Message renvoyé', `${x.trg} · ${x.toName}`); V.toast(`Renvoyé à ${x.toName}. Si l’échec persiste, le support vérifie les coordonnées.`, { icon: 'mail' }); },
    'tpl-test': (el) => { log('Envoi de test d’un modèle', el.dataset.v); V.toast(`Test « ${el.dataset.v} » envoyé à votre adresse, dans les 8 langues.`, { icon: 'mail' }); },
    params: () => {
      const ch = [];
      PARAMS.forEach(([k, l, opts, d]) => { const el = $(`select[name="p-${k}"]`); if (!el) return; const old = pval(k, d); if (el.value !== old) { const lab = (v) => { const o = opts.find((x) => (Array.isArray(x) ? x[0] : x) === v); return Array.isArray(o) ? o[1] : v; }; ch.push(`${l} : ${lab(old)} → ${lab(el.value)}`); st.params[k] = el.value; } });
      if (!ch.length) return V.toast('Aucun changement.', { icon: 'info' });
      ch.forEach((c) => log('Paramètre modifié', c)); done(`${ch.length} paramètre${ch.length > 1 ? 's' : ''} enregistré${ch.length > 1 ? 's' : ''}. Inscrit au journal.`);
    },
    role: (el) => { const n = el.dataset.id; const sh = V.sheet.open({ title: `Rôle de ${n}`, body: `${V.field('Rôle', { type: 'select', name: 'role', value: 'Modération', options: [...A.ROLES, 'Admission · Modération'] })}<p class="hint">Le changement prend effet à la prochaine connexion, double authentification comprise.</p>`, foot: V.btn('Changer le rôle', { cls: 'sm block', attrs: 'data-ok' }) }); sheetOk(sh, () => { const r = $('select', sh).value; st.roles = { ...(st.roles || {}), [n]: r }; log('Rôle modifié', `${n} → ${r}`); V.sheet.close(); done(`${n} : ${r}.`); }); },
    invite: () => V.toast('Démonstration : invitation envoyée, double authentification exigée à la première connexion.', { icon: 'mail', ms: 4000 }),
    verify: () => { const a = audit(); let ok = true; for (let k = 0; k < a.length - 1; k++) if (!a[k].h || a[k].h.length !== 8) ok = false; V.toast(ok ? `Chaîne d’empreintes vérifiée : ${a.length} lignes, aucune anomalie.` : 'Anomalie détectée dans le journal.', { icon: ok ? 'shield' : 'alert', ms: 3500 }); },
  };
  document.addEventListener('click', (e) => {
    if (!location.hash.startsWith('#/admin')) return;
    const el = e.target.closest('[data-a]');
    if (el && ACT[el.dataset.a]) { e.preventDefault(); ACT[el.dataset.a](el, e); return; }
    const tr = e.target.closest('.adm tr[data-href]');
    if (tr && !e.target.closest('a, button, input, select, label')) location.hash = tr.dataset.href;
  });
  document.addEventListener('input', (e) => { const q = e.target.closest('.adm [data-q]'); if (q) { const sec = q.closest('[data-list]'); sec.dataset.q = q.value; applyFilter(sec); } });
  document.addEventListener('change', (e) => {
    const s = e.target.closest('.adm [data-a2="city"]'); if (!s) return;
    st.cities = { ...(st.cities || {}), [s.dataset.id]: s.value }; log('Statut de ville modifié', `${s.dataset.id} → ${s.value}`); V.toast(`${s.dataset.id} : ${s.value.toLowerCase()}.`, { icon: 'map-pin' });
  });
})(window.V);
