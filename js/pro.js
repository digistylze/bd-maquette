/* BD : espace pro (démo : connectée en tant qu'Alma) + inscription en 4 étapes */
(function (V) {
  'use strict';
  const { $, $$, i: I, esc } = V;
  const D = V.date;
  const ME = () => V.byId('alma');
  const PRO = V.PRO;

  /* Contrôle médias refait pendant la démo : la date se reporte sur la fiche publique */
  if (V.L.pro.mediaDone) ME().verif.media = -Math.floor((Date.now() - V.L.pro.mediaDone) / D.DAY);

  const NAV = [
    ['Pilotage', [['', 'layout', 'Tableau de bord'], ['statut', 'zap', 'Statut express'], ['stats', 'chart', 'Statistiques'], ['messages', 'mail', 'Messages']]],
    ['Mon profil', [['profil', 'edit', 'Profil'], ['photos', 'image', 'Photos'], ['absences', 'calendar', 'Absences'], ['duo', 'users', 'Duo']]],
    ['Visibilité', [['visibilite', 'sparkles', 'Mise en avant'], ['abonnement', 'card', 'Abonnement et factures'], ['parrainage', 'gift', 'Parrainage']]],
    ['Protection', [['securite', 'shield', 'Sécurité'], ['confidentialite', 'lock', 'Confidentialité'], ['controles', 'badge-check', 'Contrôles'], ['parametres', 'settings', 'Paramètres']]],
  ];
  const unread = () => PRO.messages.filter((m) => m.unread && !(V.L.pro.read || []).includes(m.subj)).length;
  const shell = (cur, inner) => `<div class="wrap"><div class="app-shell">
    <aside class="side"><div class="who"><img src="${V.img('alma', 's')}" alt=""><div><b>Alma, 29</b><span>${V.L.pro.hidden ? '<span class="danger">Profil masqué</span>' : V.statusInfo(ME()).short} · ${planOf().name}</span></div></div>
      <nav>${NAV.map(([g, items]) => `<div class="grp">${g}</div>${items.map(([k, ic, l]) => `<a href="#/pro${k ? '/' + k : ''}" class="${cur === k ? 'on' : ''}">${I(ic)}${l}${k === 'messages' && unread() ? `<span class="bdg">${unread()}</span>` : ''}</a>`).join('')}`).join('')}
      <a href="#/profil/alma">${I('eye')}Voir ma fiche publique</a></nav></aside>
    <div><div class="subnav"><div class="chips scroll">${NAV.flatMap(([, items]) => items).map(([k, , l]) => `<a class="chip sm${cur === k ? ' on' : ''}" href="#/pro${k ? '/' + k : ''}">${l}</a>`).join('')}</div></div>${inner}</div>
  </div></div>`;
  const planOf = () => V.PLANS.find((p) => p.id === V.L.pro.plan) || V.PLANS[1];
  const hello = () => { const h = new Date().getHours(); return h < 6 || h >= 18 ? 'Bonsoir' : 'Bonjour'; };
  const hhmm = (ts) => new Date(ts).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' });
  const sum = (a) => a.reduce((x, y) => x + y, 0);

  const setStatus = (st, label) => {
    V.L.pro.statuses.alma = Object.assign({ since: Date.now() }, st);
    if (st.t === 'now') { V.L.pro.nowCount = (V.L.pro.nowDay === new Date().toDateString() ? V.L.pro.nowCount || 0 : 0) + 1; V.L.pro.nowDay = new Date().toDateString(); }
    V.save();
    V.toast(`Statut publié : ${label}. Visible sur le site en moins de 60 s.`, { icon: 'zap', ms: 4000 });
  };
  V.proHide = async (hide) => {
    const sh = V.sheet.open({ title: hide ? 'Masquer mon profil' : 'Réactiver mon profil', body: `<div class="steps-run" id="hrun">${(hide ? ['Retrait de la galerie et de la recherche', 'Retrait des encarts de mise en avant et du duo', 'Purge des caches (CDN)', 'Profil invisible partout'] : ['Remise en ligne de la fiche', 'Retour dans la galerie (ordre inchangé)', 'Purge des caches (CDN)', 'Profil visible']).map((t) => `<div><i></i>${t}</div>`).join('')}</div><p class="hint" id="htime">0 s</p>` });
    const rows = $$('#hrun div', sh); const t0 = Date.now();
    const tick = setInterval(() => { const el = $('#htime', sh); if (el) el.textContent = ((Date.now() - t0) / 1000).toFixed(1) + ' s'; }, 100);
    for (const r of rows) { r.classList.add('run'); await V.wait(520); r.classList.remove('run'); r.classList.add('ok'); }
    clearInterval(tick);
    V.L.pro.hidden = hide; V.save();
    $('.sh-body', sh).insertAdjacentHTML('beforeend', `<div class="callout ${hide ? 'danger' : 'ok'}" style="margin-top:6px">${I(hide ? 'eye-off' : 'eye')}<span>${hide ? 'Votre profil est masqué. Personne ne peut plus le voir, ni dans la galerie, ni par lien direct.' : 'Votre profil est de nouveau visible, avec votre statut actuel.'}</span></div>`);
    setTimeout(() => { V.sheet.close(); V.render(); }, 1400);
  };

  /* =================================================================== TABLEAU DE BORD */
  V.route(/^\/pro$/, () => {
    const p = ME(); const s = V.statusOf(p); const si = V.statusInfo(p);
    const st = V.proStats;
    const kp = (ic, l, arr, d) => `<div class="kpi"><span class="l">${I(ic, 'sm')}${l}</span><span class="v">${V.nf(sum(arr))}</span><span class="d${d < 0 ? ' dn' : ''}">${d > 0 ? '+' : ''}${d} % vs mois précédent</span>${V.spark(arr)}</div>`;
    const nextCtrl = p.verif.media + 90;
    const msgs = PRO.messages.filter((m) => m.unread && !(V.L.pro.read || []).includes(m.subj));
    return {
      title: 'Espace pro',
      html: shell('', `<div class="dash-head"><div><div class="eyebrow">Espace pro · démonstration</div><h1>${hello()}, Alma.</h1></div><div class="row">${V.btn('Voir ma fiche', { href: '#/profil/alma', cls: 'sm ghost', arrow: 'eye' })}</div></div>
        ${V.L.pro.hidden ? `<div class="big-hide" style="margin-bottom:14px"><b class="h4">Votre profil est masqué</b><span class="small ink2">Il n’apparaît nulle part sur le site. Votre abonnement continue.</span><div>${V.btn('Réactiver mon profil', { act: 'pro-unhide', cls: 'sm' })}</div></div>` : ''}
        <div class="panel" style="margin-bottom:14px"><div class="row-b wrapr"><div><div class="eyebrow">Mon statut</div><div class="row" style="margin-top:8px">${V.statusPill(p, true)}<span class="small muted">${si.sub}${s.t === 'now' ? ` · expire à ${hhmm(s.since + 60 * 60e3)}` : ''}</span></div></div>
          <div class="chips"><button class="chip${s.t === 'now' ? ' on' : ''}" data-act="pro-st" data-v="now"><span class="ck">${I('check', 'sm')}</span>Disponible maintenant</button><button class="chip${s.t === 'tonight' ? ' on' : ''}" data-act="pro-st" data-v="tonight"><span class="ck">${I('check', 'sm')}</span>Ce soir à 21 h</button><button class="chip${s.t === 'request' ? ' on' : ''}" data-act="pro-st" data-v="request"><span class="ck">${I('check', 'sm')}</span>Sur demande</button><button class="chip${s.t === 'busy' ? ' on' : ''}" data-act="pro-st" data-v="busy"><span class="ck">${I('check', 'sm')}</span>Occupée</button><a class="chip" href="#/pro/statut">${I('plus', 'sm')}Plus</a></div></div></div>
        <div class="kpis">${kp('eye', 'Vues de votre carte · 30 j', st.views, 18)}${kp('image', 'Ouvertures de fiche', st.opens, 12)}${kp('heart', 'Ajouts en sélection', st.favs, 24)}<div class="kpi dark"><span class="l">${I('phone', 'sm')}Clics de contact</span><span class="v">${sum(Object.values(st.contacts))}</span><span class="xs" style="color:#d2c6de">WhatsApp ${st.contacts.WhatsApp} · appel ${st.contacts.Appel} · SMS ${st.contacts.SMS}</span><span class="d">+9 %</span></div></div>
        <div class="grid-2" style="margin-top:14px">
          <div class="panel"><div class="row-b"><h3>Vues de votre carte</h3><a class="link" href="#/pro/stats">Détails</a></div>${V.lineChart(st.views, { h: 200, labels: [[0, D.fmtD(D.addDays(-29), { day: 'numeric', month: 'short' })], [29, 'Aujourd’hui']], aria: 'Vues sur 30 jours' })}<p class="small muted">Votre fiche est consultée <b class="ok">32 % de plus</b> que la moyenne de la plateforme.</p></div>
          <div class="stack">
            <div class="panel"><div class="row-b"><div><div class="eyebrow">Abonnement</div><h3 style="margin-top:4px">${planOf().name} · ${planOf().price} CHF / mois</h3></div><a class="link" href="#/pro/abonnement">Gérer</a></div><p class="small ink2" style="margin-top:8px">Prochain prélèvement le <b>${D.fmtD(D.addDays(PRO.nextBill))}</b> · sans engagement · facturation continue, absences comprises.</p>${V.L.pro.cancelAt ? `<div class="callout danger" style="margin-top:10px">${I('alert')}<span>Résiliation programmée le ${D.fmtD(new Date(V.L.pro.cancelAt))}.</span></div>` : ''}<div class="row" style="margin-top:12px"><span class="small muted">Mise en avant incluse ce mois-ci</span><span class="sp"></span><b class="small">1 / 2 jours</b></div><div class="progress gold" style="margin-top:6px"><i style="width:50%"></i></div></div>
            <div class="panel"><div class="row-b"><div><div class="eyebrow">Prochain contrôle</div><h3 style="margin-top:4px">Selfie de contrôle dans ${nextCtrl} jours</h3></div><a class="link" href="#/pro/controles">Le faire</a></div><div class="progress" style="margin-top:12px"><i style="width:${Math.max(4, 100 - (nextCtrl / 90) * 100)}%"></i></div><p class="hint">Photos de moins de 30 jours : badge « Photos récentes » sur votre fiche.</p></div>
          </div>
        </div>
        <div class="grid-2" style="margin-top:14px">
          <div class="panel"><div class="row-b"><h3>Messages</h3><a class="link" href="#/pro/messages">Tous</a></div><div class="inbox" style="margin-top:8px">${(msgs.length ? msgs : PRO.messages.slice(0, 2)).map((m) => `<div class="msg${msgs.includes(m) ? ' unread' : ''}" data-act="pro-msg" data-k="${PRO.messages.indexOf(m)}"><div class="t"><b>${esc(m.subj)}</b><span>${esc(m.body)}</span></div></div>`).join('')}</div></div>
          <div class="panel" style="border-color:color-mix(in srgb,var(--danger) 40%,transparent)"><div class="eyebrow" style="color:var(--danger)">Alerte de fuite</div><h3 style="margin-top:4px">1 photo retrouvée ailleurs</h3><div class="row" style="margin-top:12px"><img class="avatar sq lg" src="${V.img('alma', 's')}" alt=""><div class="sp"><b>${PRO.leaks[0].where}</b><div class="small muted">Concordance ${PRO.leaks[0].match} · il y a 3 jours</div></div></div><div style="margin-top:12px">${V.btn('Demander le retrait', { href: '#/pro/securite', cls: 'sm danger-ghost' })}</div></div>
        </div>
        <div class="big-hide" style="margin-top:14px"><div class="row-b wrapr"><div><b class="h4">Masquer mon profil maintenant</b><div class="small ink2">Effet en moins d’une minute sur tout le site. Réactivation en un geste.</div></div>${V.L.pro.hidden ? V.btn('Réactiver', { act: 'pro-unhide', cls: 'sm' }) : V.btn('Masquer maintenant', { act: 'pro-hide', cls: 'sm danger', arrow: 'eye-off' })}</div></div>`),
    };
  }, { mode: 'pro' });

  /* =================================================================== STATUT EXPRESS */
  V.route(/^\/pro\/statut$/, () => {
    const p = ME(); const s = V.statusOf(p);
    const nowLeft = 6 - (V.L.pro.nowDay === new Date().toDateString() ? V.L.pro.nowCount || 0 : 0);
    const ex = (k, ic, t, sub, on) => `<button class="ex${on ? ' on' : ''} ${k}" data-act="ex" data-v="${k}"><span class="ic">${I(ic, 'lg')}</span><span><b>${t}</b><span>${sub}</span></span></button>`;
    return {
      title: 'Statut express',
      html: shell('statut', `<div class="dash-head"><div><div class="eyebrow">Un geste, visible en moins de 60 s</div><h1>Statut express</h1></div><div class="row">${V.statusPill(p, true)}<span class="small muted">${V.statusInfo(p).sub}</span></div></div>
        <div class="express">
          ${ex('now', 'zap', 'Disponible maintenant', `Expire seul après 60 min · ${nowLeft} passage${nowLeft > 1 ? 's' : ''} restant${nowLeft > 1 ? 's' : ''} aujourd’hui`, s.t === 'now')}
          ${ex('busy', 'clock', 'Occupée', 'En rendez-vous · repasse seule à « Sur demande » après 2 h', s.t === 'busy')}
          ${ex('today', 'clock', 'Aujourd’hui dès…', 'Choisissez l’heure', s.t === 'today')}
          ${ex('tonight', 'moon', 'Ce soir à…', 'Choisissez l’heure', s.t === 'tonight')}
          ${ex('tomorrow', 'calendar', 'Demain dès…', 'Choisissez l’heure', s.t === 'tomorrow')}
          ${ex('request', 'mail', 'Sur demande', 'Les visiteurs vous écrivent pour proposer un moment', s.t === 'request')}
          ${ex('away', 'pause', 'Absente', 'Profil visible « De retour le … » ou masqué', s.t === 'away')}
        </div>
        <div class="panel" id="hours" style="margin-top:14px;display:none"><p class="b" style="margin-bottom:10px">À quelle heure ?</p><div class="slots">${['14 h', '16 h', '18 h', '19 h', '20 h', '21 h', '22 h', '23 h'].map((h) => `<button class="chip" data-act="ex-h" data-h="${h}">${h}</button>`).join('')}</div></div>
        <div class="grid-2" style="margin-top:14px">
          <div class="panel soft"><h3>Sur l’écran d’accueil</h3><p class="small ink2" style="margin-top:8px">Installez BD comme une application : le statut express s’ouvre en un tap, sans vous reconnecter.</p><div style="margin-top:14px">${V.btn('Installer l’app', { act: 'install', cls: 'sm dark', arrow: 'smartphone' })}</div></div>
          <div class="panel soft">${V.sw('smslink', V.L.pro.smslink !== false, 'Lien de connexion directe par SMS', 'Un SMS discret quand votre statut expire')}${V.sw('remind', V.L.pro.remind !== false, 'Me rappeler quand le statut expire', '« Votre statut a expiré. Êtes-vous disponible ? »')}</div>
        </div>
        <p class="hint" style="margin-top:14px">L’historique de vos statuts n’est jamais public : un visiteur ne voit que le statut en cours.</p>`),
      after: (v) => {
        let pending = null;
        v.firstElementChild.addEventListener('click', (e) => {
          const b = e.target.closest('[data-act="ex"]'); const h = e.target.closest('[data-act="ex-h"]');
          if (b) {
            const k = b.dataset.v;
            if (k === 'away') { location.hash = '#/pro/absences'; return; }
            if (k === 'now') { if (nowLeft <= 0) return V.toast('Limite de 6 passages par jour atteinte.', { icon: 'info' }); setStatus({ t: 'now' }, 'Disponible maintenant'); return V.render(); }
            if (k === 'request') { setStatus({ t: 'request' }, 'Sur demande'); return V.render(); }
            if (k === 'busy') { setStatus({ t: 'busy' }, 'Occupée'); return V.render(); }
            pending = k; $$('.ex', v).forEach((x) => x.classList.toggle('on', x === b));
            const box = $('#hours', v); box.style.display = ''; box.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          if (h && pending) { const lbl = { today: 'Aujourd’hui dès ', tonight: 'Ce soir à ', tomorrow: 'Demain dès ' }[pending] + h.dataset.h; setStatus({ t: pending, at: h.dataset.h }, lbl); V.render(); }
        });
        v.addEventListener('change', (e) => { if (e.target.name) { V.L.pro[e.target.name] = e.target.checked; V.save(); V.toast('Réglage enregistré.', { ms: 1600 }); } });
      },
    };
  }, { mode: 'pro' });

  /* =================================================================== PROFIL (éditeur) */
  const TR = {
    en: 'An architect by training and a Genevan by choice. I love well-planned dates, conversations that last and dinners by the lake. Complete discretion, on both sides.',
    es: 'Arquitecta de formación, ginebrina de adopción. Me gustan las citas bien preparadas, las conversaciones que se alargan y las cenas junto al lago. Discreción absoluta, por ambas partes.',
    pt: 'Arquiteta de formação, genebrina por adoção. Gosto de encontros bem preparados, de conversas que se prolongam e de jantares à beira do lago. Discrição absoluta, de ambos os lados.',
    ru: 'Архитектор по образованию, женевка по выбору. Люблю продуманные встречи, долгие разговоры и ужины у озера. Полная конфиденциальность с обеих сторон.',
    de: 'Architektin von Beruf, Genferin aus Überzeugung. Ich mag gut geplante Treffen, Gespräche, die andauern, und Abendessen am See. Absolute Diskretion, auf beiden Seiten.',
    it: 'Architetta di formazione, ginevrina d’adozione. Amo gli incontri ben preparati, le conversazioni che durano e le cene in riva al lago. Discrezione assoluta, da entrambe le parti.',
    ar: 'مهندسة معمارية بالتكوين، وجنيفية بالاختيار. أحب اللقاءات المُعدّة جيدًا، والأحاديث التي تطول، والعشاء على ضفاف البحيرة. سرية تامة من الطرفين.',
  };
  V.route(/^\/pro\/profil$/, () => {
    const p = ME();
    const sel = (lbl, key, opts) => V.field(lbl, { type: 'select', value: p.attrs[key], options: opts });
    return {
      title: 'Mon profil',
      html: shell('profil', `<div class="dash-head"><div><div class="eyebrow">Éditeur · aperçu en direct</div><h1>Mon profil</h1></div>${V.btn('Prévisualiser ma fiche', { href: '#/profil/alma', cls: 'sm ghost', arrow: 'eye' })}</div>
        <div class="stack-lg">
          <div class="panel"><h3>Identité publique</h3><div class="form-grid two" style="margin-top:14px">
            ${V.field('Pseudo', { value: 'Alma' })}${V.field('Catégorie', { type: 'select', value: 'Femme', options: ['Femme', 'Femme trans', 'Homme', 'Masseuse', 'BDSM', 'Duo ou couple'] })}
            <div class="field"><input value="29 ans · âge réel vérifié" disabled style="opacity:.75"><label>Âge</label><span class="state muted">${I('lock', 'sm')}</span></div>
            ${V.field('Origine (facultative)', { type: 'select', value: p.origin, options: V.ORIGINS })}
          </div><p class="hint">L’âge provient de votre vérification d’identité : il n’est pas modifiable et se met à jour à votre anniversaire. L’origine est facultative, avec un consentement distinct ; vous pouvez la retirer à tout moment.</p></div>
          <div class="panel"><div class="row-b"><h3>Présentation</h3><span class="badge warn">${I('shield', 'sm')}Modérée</span></div><div style="margin-top:14px">${V.field('Votre présentation', { type: 'textarea', value: p.bio, max: 600 })}</div>
            <div style="margin-top:14px"><div class="row-b"><b class="small">Traduction automatique, relue</b>${V.seg('tr', [['en', 'EN'], ['de', 'DE'], ['it', 'IT'], ['es', 'ES'], ['pt', 'PT'], ['ru', 'RU'], ['ar', 'AR']], 'en')}</div><div class="panel soft" style="margin-top:10px;padding:16px" id="trBox"><p class="serif" style="font-size:18px">${TR.en}</p><p class="xs muted" style="margin-top:8px">Mention « traduit automatiquement » affichée sur la fiche · texte original accessible</p></div></div></div>
          <div class="panel"><h3>À propos</h3><div class="form-grid two" style="margin-top:14px">
            ${sel('Taille', 'Taille', Array.from({ length: 41 }, (_, k) => (150 + k) + ' cm'))}${sel('Silhouette', 'Silhouette', ['Mince', 'Sportive', 'Normale', 'Pulpeuse', 'Ronde', 'Petite'])}
            ${sel('Cheveux', 'Cheveux', ['Blond', 'Châtain clair', 'Châtain', 'Brun', 'Brun foncé', 'Noir', 'Roux auburn'])}${sel('Yeux', 'Yeux', ['Bleu', 'Gris', 'Vert', 'Noisette', 'Marron', 'Noir'])}
            ${sel('Poitrine', 'Poitrine', ['Naturelle · A', 'Naturelle · B', 'Naturelle · C', 'Naturelle · D', 'Refaite · B', 'Refaite · C'])}${sel('Tatouage', 'Tatouage', ['Non', 'Discret', 'Oui'])}
            ${sel('Tabac', 'Tabac', ['Non', 'Occasionnellement', 'Oui'])}${V.field('Études ou activité', { value: p.attrs['Études'] })}
          </div></div>
          <div class="panel"><h3>Langues</h3><div class="stack" style="margin-top:12px">${p.langs.map(([l, lv]) => `<div class="row"><span class="lang" style="min-width:130px">${V.LANGS[l]}</span>${V.seg('lv-' + l, ['A2', 'B1', 'B2', 'C1', 'C2'].map((x) => [x, x]), lv)}</div>`).join('')}<button class="txt-btn">${I('plus', 'sm')}Ajouter une langue</button></div></div>
          <div class="panel"><h3>Rendez-vous</h3><div style="margin-top:12px">${V.seg('mode', [['incall', 'Je reçois'], ['outcall', 'Je me déplace'], ['both', 'Les deux']], p.mode)}</div>
            <p class="small b" style="margin:16px 0 8px">Quartiers desservis</p><div class="chips">${V.COMMUNES.map((c) => `<button class="chip sm${['eaux-vives', 'cologny', 'vieille-ville', 'champel'].includes(c.id) ? ' on' : ''}" data-act="toggle-on"><span class="ck">${I('check', 'sm')}</span>${c.label}</button>`).join('')}</div>
            <p class="small b" style="margin:16px 0 8px">Jours habituels</p><div class="chips">${['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((d, k) => `<button class="chip sm${p.week[k] ? ' on' : ''}" data-act="toggle-on"><span class="ck">${I('check', 'sm')}</span>${d}</button>`).join('')}</div></div>
          <div class="panel"><h3>Tarifs</h3><p class="small muted" style="margin-top:4px">Publiés immédiatement. Fixés librement par vous : aucune commission.</p><div class="tbl-wrap" style="margin-top:10px"><table class="tbl" style="min-width:420px"><thead><tr><th>Durée</th><th>Je reçois (CHF)</th><th>Je me déplace (CHF)</th></tr></thead><tbody>${p.rates.map((r) => `<tr><td>${r[0]}</td><td><input class="num" style="width:110px;height:40px;border-radius:12px;border:1.5px solid var(--line-2);padding:0 12px;background:var(--surface)" value="${r[1] || ''}" placeholder="non"></td><td><input class="num" style="width:110px;height:40px;border-radius:12px;border:1.5px solid var(--line-2);padding:0 12px;background:var(--surface)" value="${r[2] || ''}" placeholder="non"></td></tr>`).join('')}</tbody></table></div></div>
          <div class="panel"><div class="row-b"><h3>Services et limites</h3><span class="badge warn">${I('shield', 'sm')}Modérés</span></div><p class="small muted" style="margin-top:4px">Catalogue fermé, identique dans toutes les langues. Pas de texte libre sur les pratiques.</p>
            <div class="chips" style="margin-top:12px">${Object.entries(V.SERVICES).map(([k, l]) => `<button class="chip sm${p.services.includes(k) ? ' on' : ''}" data-act="toggle-on"><span class="ck">${I('check', 'sm')}</span>${l}</button>`).join('')}</div>
            <p class="small b" style="margin:16px 0 8px">Ce que je ne fais pas</p><div class="chips">${Object.entries(V.LIMITS).map(([k, l]) => `<button class="chip sm${p.limits.includes(k) ? ' on' : ''}" data-act="toggle-on"><span class="ck">${I('check', 'sm')}</span>${l}</button>`).join('')}</div></div>
          <div class="panel"><div class="row-b"><h3>Liens externes</h3><span class="badge">Facultatif</span></div><p class="small muted" style="margin-top:4px">Affichés en simples liens sur votre fiche. Aucune intégration ni synchronisation : les visiteurs quittent BD en cliquant.</p>
            <div class="form-grid two" style="margin-top:12px">${V.field('Webcam (adresse de votre page)', { value: '', name: 'l-webcam' })}${V.field('OnlyFans', { value: 'onlyfans.com/alma', name: 'l-of' })}${V.field('Instagram', { value: '@alma.geneve', name: 'l-ig' })}</div>
            <p class="hint">Les liens sont vérifiés en modération : pas de lien vers un autre site d’annonces ni de numéro.</p></div>
          <div class="panel"><h3>Contacts et consignes</h3>${V.sw('c-tel', true, 'Appels', p.tel)}${V.sw('c-wa', true, 'WhatsApp', 'Message pré-rempli proposé aux visiteurs')}${V.sw('c-sms', true, 'SMS', '')}${V.sw('c-tg', false, 'Telegram', '')}<div style="margin-top:12px">${V.field('Consignes affichées avant le contact', { type: 'textarea', value: p.rules, max: 200 })}</div>
            ${V.sw('seo', V.L.pro.seo !== false, 'Fiche visible dans les moteurs de recherche', 'Désactivez pour n’être trouvée que sur BD')}</div>
        </div>
        <div style="position:sticky;bottom:calc(var(--tab-h) + 20px);z-index:5;margin-top:16px"><div class="panel row-b wrapr" style="box-shadow:var(--shadow-2);padding:14px 18px"><span class="small ink2">${I('info', 'sm')} Les photos et les textes passent en modération, comptez moins de 2 h. Les tarifs et les horaires sont publiés tout de suite.</span>${V.btn('Enregistrer', { act: 'pro-save', cls: 'sm', arrow: 'check' })}</div></div>`),
      after: (v) => {
        $('[data-seg="tr"]', v).addEventListener('seg', (e) => { const el = $('#trBox p', v); el.textContent = TR[e.detail]; el.dir = e.detail === 'ar' ? 'rtl' : 'ltr'; });
        v.firstElementChild.addEventListener('click', (e) => { const c = e.target.closest('[data-act="toggle-on"]'); if (c) c.classList.toggle('on'); });
      },
    };
  }, { mode: 'pro' });

  /* =================================================================== PHOTOS */
  V.route(/^\/pro\/photos$/, () => {
    V.L.pro.photos = V.L.pro.photos || [{ src: 'alma', main: true, st: 'ok' }, { src: 'alma-2', st: 'ok' }, { src: 'alma-jade', st: 'ok', note: 'Partagée avec le duo' }];
    const ph = V.L.pro.photos;
    return {
      title: 'Photos',
      html: shell('photos', `<div class="dash-head"><div><div class="eyebrow">${ph.length} / 20 photos · formule ${planOf().name}</div><h1>Mes photos</h1></div>${V.btn('Ajouter des photos', { act: 'ph-add', cls: 'sm', arrow: 'upload' })}</div>
        <div class="upl protect" id="upl">${ph.map((x, k) => `<div class="u${x.blur ? ' blurf' : ''}" data-k="${k}"><img src="${V.img(x.src, 's')}" alt="" draggable="false"><span class="facebox"></span>${x.main ? '<span class="badge goldfill main">Principale</span>' : x.st === 'mod' ? '<span class="badge warn main">En modération</span>' : ''}<div class="acts"><button data-act="ph-main" data-k="${k}" title="Photo principale">${I('star', 'sm')}</button><button data-act="ph-blur" data-k="${k}" title="Flouter le visage">${I('eye-off', 'sm')}</button><button data-act="ph-del" data-k="${k}" title="Supprimer">${I('trash', 'sm')}</button></div><span class="wm">BD</span></div>`).join('')}<div class="u add" data-act="ph-add">${I('plus', 'lg')}<span>Ajouter<br>JPG, HEIC, PNG</span></div></div>
        <div class="grid-2" style="margin-top:16px">
          <div class="panel soft"><h3>Protection automatique</h3><ul class="svc" style="margin-top:10px">${['Filigrane sur chaque photo affichée', 'Métadonnées supprimées (EXIF, GPS, appareil)', 'Clic droit et glisser-déposer désactivés', 'Recherche hebdomadaire de vos photos sur le web', 'Floutage du visage en un geste, au choix'].map((x) => `<li>${I('check')}${x}</li>`).join('')}</ul></div>
          <div class="panel soft"><h3>Modération et contrôle</h3><p class="small ink2" style="margin-top:8px">Chaque nouvelle photo est vérifiée avant publication : concordance avec votre selfie de contrôle et respect de la politique de contenu (photos suggestives oui, explicites non).</p><p class="small ink2" style="margin-top:8px">Un selfie de contrôle tous les 90 jours garde le badge « Photos récentes ».</p></div>
        </div>
        <div class="panel" style="margin-top:16px"><div class="row-b wrapr"><h3>Droits et consentement</h3><span class="small muted">Horodatés, révocables à tout moment</span></div>
          <p class="small muted" style="margin-top:4px">Pour chaque photo ou vidéo : qui détient les droits, et votre consentement à la publication. Révoquer retire le média du site en moins d’une minute.</p>
          <div class="tbl-wrap" style="margin-top:10px"><table class="tbl"><thead><tr><th>Média</th><th>Droits</th><th>Consentement</th><th>État</th><th></th></tr></thead><tbody>
          ${[...ph.map((x, k) => ({ k, src: x.src, kind: 'Photo', rights: k === 2 ? 'Photographe partenaire · cession signée' : 'Moi-même (autoportrait)', at: Date.now() - (k + 2) * 864e5 * 9 - k * 37e5 })), { k: 'v', src: 'alma', kind: 'Vidéo · 0:24', rights: 'Moi-même', at: Date.now() - 5 * 864e5 }].map((m) => { const rev = (V.L.pro.revoked || {})[m.k]; return `<tr><td><div class="row" style="gap:10px"><img class="avatar sq" src="${V.img(m.src, 's')}" alt="" style="width:40px;height:48px;border-radius:8px"><span class="small b">${m.kind}${m.k === 'v' ? '' : ' ' + (m.k + 1)}</span></div></td><td class="small">${m.rights}</td><td class="small num">${rev ? `<span class="muted">Révoqué le ${new Date(rev).toLocaleString('fr-CH', { dateStyle: 'short', timeStyle: 'short' })}</span>` : `Donné le ${new Date(m.at).toLocaleString('fr-CH', { dateStyle: 'short', timeStyle: 'short' })}`}</td><td>${rev ? '<span class="badge">Retiré du site</span>' : '<span class="badge ok">Publié</span>'}</td><td class="r">${V.btn(rev ? 'Redonner' : 'Révoquer', { cls: 'xs ' + (rev ? '' : 'danger-ghost'), attrs: `data-rev="${m.k}"` })}</td></tr>`; }).join('')}
          </tbody></table></div>
          <p class="hint">Chaque consentement est conservé avec sa date et son heure (heure de Genève). Le retirer ne demande aucune justification.</p></div>`),
      after: (v) => v.firstElementChild.addEventListener('click', (e) => {
        const b = e.target.closest('[data-rev]'); if (!b) return;
        const r = (V.L.pro.revoked = V.L.pro.revoked || {}); const k = b.dataset.rev;
        if (r[k]) { delete r[k]; V.toast('Consentement redonné : le média repasse en modération avant publication.', { icon: 'check' }); } else { r[k] = Date.now(); V.toast('Consentement révoqué : le média est retiré du site.', { icon: 'eye-off' }); }
        V.save(); V.render();
      }),
    };
  }, { mode: 'pro' });

  /* =================================================================== ABSENCES */
  V.route(/^\/pro\/absences$/, () => {
    const A = V.L.pro.absences;
    const iso = (n) => D.addDays(n).toISOString().slice(0, 10);
    return {
      title: 'Absences',
      html: shell('absences', `<div class="dash-head"><div><div class="eyebrow">Facturation continue</div><h1>Mes absences</h1></div></div>
        <div class="grid-2">
          <div class="panel"><h3>Programmer une absence</h3><div class="form-grid two" style="margin-top:14px">${V.field('Du', { type: 'date', value: iso(3), name: 'from' })}${V.field('Au', { type: 'date', value: iso(10), name: 'to' })}</div>
            <div class="stack" style="margin-top:12px">${V.opt('amode', 'visible', 'Profil visible « De retour le … »', 'Vos favoris peuvent s’abonner à votre retour', { on: true })}${V.opt('amode', 'hidden', 'Profil masqué pendant l’absence', 'Invisible partout, réapparaît automatiquement à votre retour')}</div>
            <div class="callout gold" style="margin-top:12px">${I('info')}<span>Votre abonnement continue pendant l’absence. Pour arrêter de payer, vous pouvez résilier depuis <a class="link" href="#/pro/abonnement">Abonnement</a>.</span></div>
            <div style="margin-top:14px">${V.btn('Programmer l’absence', { act: 'abs-add', cls: 'block', arrow: 'calendar' })}</div></div>
          <div class="panel"><h3>Absences prévues</h3><div class="list-rows" style="margin-top:8px">${A.length ? A.map((a, k) => `<div><div class="sp"><b>${D.fmtD(new Date(a.from))} → ${D.fmtD(new Date(a.to))}</b><div class="small muted">${a.mode === 'hidden' ? 'Profil masqué' : 'Visible « De retour le … »'}</div></div><button class="icon-btn" data-act="abs-del" data-k="${k}" aria-label="Supprimer">${I('trash')}</button></div>`).join('') : '<p class="muted small" style="padding:10px 0">Aucune absence prévue.</p>'}</div></div>
        </div>`),
    };
  }, { mode: 'pro' });

  /* =================================================================== DUO */
  V.route(/^\/pro\/duo$/, () => {
    const duo = V.byId('alma-jade');
    const inv = V.L.pro.invite;
    return {
      title: 'Duo',
      html: shell('duo', `<div class="dash-head"><div><div class="eyebrow">Duo réel · deux profils vérifiés et liés</div><h1>Mes duos</h1></div></div>
        <div class="grid-2">
          <div class="panel"><div class="row"><img src="${V.img('alma-jade', 's')}" alt="" style="width:86px;height:108px;border-radius:16px;object-fit:cover"><div class="sp"><span class="badge dark">${I('users', 'sm')}Duo vérifié</span><h3 style="margin-top:8px">Alma &amp; Jade</h3><p class="small muted">Actif · ${V.statusInfo(duo).label}</p></div></div>
            <dl class="kv" style="margin-top:14px"><dt>Abonnement</dt><dd>Profil duo · ${V.PLAN_DUO.price} CHF / mois</dd><dt>Répartition</dt><dd>${V.L.pro.duoSplit === 'me' ? 'Payé par Alma' : V.L.pro.duoSplit === 'her' ? 'Payé par Jade' : 'Partagé · 149.50 CHF chacune'}</dd><dt>Statut</dt><dd>Propre au duo</dd></dl>
            <div style="margin-top:14px">${V.seg('split', [['half', 'Partager 50/50'], ['me', 'Je paie'], ['her', 'Jade paie']], V.L.pro.duoSplit || 'half')}</div>
            <div class="row wrapr" style="margin-top:14px">${V.btn('Voir la fiche duo', { href: '#/profil/alma-jade', cls: 'sm ghost' })}${V.btn('Quitter le duo', { act: 'duo-quit', cls: 'sm danger-ghost' })}</div></div>
          <div class="panel"><h3>Inviter une partenaire</h3><p class="small ink2" style="margin-top:6px">Elle doit être vérifiée sur BD. Elle accepte depuis son espace pro ; chacune peut masquer le profil commun ou quitter le duo à tout moment.</p>
            <div style="margin-top:14px">${V.field('Pseudo de votre partenaire', { name: 'partner', value: inv ? inv.name : '' })}</div><div class="list-rows" id="pres"></div>
            ${inv ? `<div class="callout ${inv.ok ? 'ok' : 'gold'}" style="margin-top:12px">${I(inv.ok ? 'check' : 'clock')}<span>${inv.ok ? `${esc(inv.name)} a accepté : le profil duo est en modération.` : `Invitation envoyée à ${esc(inv.name)}. En attente de son accord.`}</span></div>${inv.ok ? '' : `<div style="margin-top:10px">${V.btn('Démo : accepter au nom de ' + esc(inv.name), { act: 'duo-accept', cls: 'sm ghost' })}</div>`}` : ''}</div>
        </div>`),
      after: (v) => {
        const inp = $('input[name="partner"]', v);
        const run = () => { const s = inp.value.trim().toLowerCase(); const r = s ? V.PROFILES.filter((p) => !p.persons && p.id !== 'alma' && p.name.toLowerCase().startsWith(s)) : []; $('#pres', v).innerHTML = r.map((p) => `<div><img class="avatar" src="${V.img(p.photos[0], 's')}" alt=""><div class="sp"><b>${esc(p.name)}, ${p.age}</b><div class="small muted">Profil vérifié</div></div><button class="btn xs" data-act="duo-invite" data-id="${p.id}"><span class="roll"><span>Inviter</span><span aria-hidden="true">Inviter</span></span></button></div>`).join(''); };
        inp.addEventListener('input', run);
        $('[data-seg="split"]', v).addEventListener('seg', (e) => { V.L.pro.duoSplit = e.detail; V.save(); V.toast('Répartition enregistrée, appliquée à la prochaine facture.', { ms: 2200 }); });
      },
    };
  }, { mode: 'pro' });

  /* =================================================================== MISE EN AVANT */
  const nf = (n) => Number(n || 0).toLocaleString('fr-CH');
  /* Mise en avant par crédits (P06, P07) : solde, packs, réservation avec places et coût affichés avant débit, campagnes, journal */
  const CRED = () => {
    const p = V.L.pro;
    if (!p.cr) p.cr = {
      bal: 24,
      ledger: [{ d: -20, t: 'Achat · pack de 30 crédits', n: 30 }, { d: -12, t: 'Mise en avant · Eaux-Vives · 2 jours', n: -6 }],
      camps: [{ id: 'k1', zone: 'zone', from: -12, days: 2, cost: 6, views: 1240, clicks: 38 }],
    };
    return p.cr;
  };
  const crZoneTxt = (z) => (z === 'canton' ? 'Tout le canton' : V.communeTxt(ME().commune));
  // places sponsorisées restantes par jour (démo déterministe), diminuées de vos propres réservations
  const crLeft = (type, k) => {
    const max = V.CREDITS.slots[type];
    const taken = (k * 7 + (type === 'canton' ? 3 : 1)) % (max + 2);
    const mine = CRED().camps.filter((c) => c.zone === type && k >= c.from && k < c.from + c.days).length;
    return Math.max(0, max - taken - mine);
  };
  const crState = (c) => (c.from > 0 ? 'avenir' : c.from + c.days - 1 < 0 ? 'fini' : 'cours');
  const crDate = (k) => D.fmtD(D.addDays(k), { weekday: 'short', day: 'numeric', month: 'short' });
  V.route(/^\/pro\/visibilite$/, () => {
    const cr = CRED();
    const pr = { zone: 'zone', start: 1, days: 3 };
    V._crPick = pr;
    return {
      title: 'Mise en avant',
      html: shell('visibilite', `<div class="dash-head"><div><div class="eyebrow">Placements sponsorisés · étiquetés · limités par zone</div><h1>Mise en avant</h1></div>
          <div class="cr-bal"><small>Solde</small><b id="crBal">${cr.bal}</b><span>crédits</span></div></div>
        <div class="grid-2">
          <div class="panel">
            <h3>Programmer une mise en avant</h3>
            <p class="small muted" style="margin:4px 0 16px">Votre profil apparaît en grand, étiqueté « ${esc(V.sponLabel())} », en tête des recherches qui vous correspondent. Aucun crédit n’est débité sans place attribuée.</p>
            <div class="cr-step"><span class="qf-l">Zone</span><div class="qf-chips" data-cr="zone">
              <button type="button" class="qf-c on" data-v="zone">${esc(V.communeTxt(ME().commune))} · ${V.CREDITS.cost.zone} crédits / jour</button>
              <button type="button" class="qf-c" data-v="canton">Tout le canton · ${V.CREDITS.cost.canton} crédits / jour</button></div></div>
            <div class="cr-step"><span class="qf-l">Début</span><div class="cr-days" id="crDays"></div></div>
            <div class="cr-step"><span class="qf-l">Durée</span><div class="qf-chips" data-cr="days">${[1, 3, 7].map((n) => `<button type="button" class="qf-c${n === 3 ? ' on' : ''}" data-v="${n}">${n} jour${n > 1 ? 's' : ''}</button>`).join('')}</div></div>
            <dl class="kv cr-sum" id="crSum"></dl>
            <div id="crGo" style="margin-top:14px"></div>
          </div>
          <div class="panel">
            <h3>Acheter des crédits</h3>
            <p class="small muted" style="margin:4px 0 16px">Valables ${V.CREDITS.months} mois. Votre formule ${PRO.plan === 'premium' ? 'Accompagnement offre 18' : 'Visibilité offre 6'} crédits chaque mois.</p>
            <div class="cr-packs">${V.CREDITS.packs.map((k) => `<button type="button" class="cr-pack${k.reco ? ' reco' : ''}" data-pack="${k.id}">${k.reco ? '<span class="cr-tag">Le plus choisi</span>' : ''}<b>${k.n}<small> crédits</small></b><span class="cr-pr">${V.chf(k.price)}</span><span class="cr-unit">${V.chf(k.price / k.n)} le crédit</span></button>`).join('')}</div>
            <p class="hint">Démonstration : aucun paiement n’est effectué. En production, le paiement passe par un prestataire agréé ; BD ne conserve aucune donnée de carte.</p>
          </div>
        </div>
        <div class="panel" style="margin-top:14px"><div class="row-b"><h3>Mes campagnes</h3><span class="small muted">Vues et clics sponsorisés, séparés de vos statistiques organiques</span></div><div id="crCamps" style="margin-top:10px"></div></div>
        <div class="grid-2" style="margin-top:14px">
          <div class="panel"><h3>Historique des crédits</h3><div id="crLog" style="margin-top:10px"></div></div>
          <div class="panel soft"><h3>Aperçu dans la galerie</h3><p class="small muted" style="margin:4px 0 14px">Visible seulement dans les recherches qui vous correspondent.</p><div class="gallery" style="grid-template-columns:repeat(2,1fr)">${V.card(ME(), { feat: true, noHide: true })}</div></div>
        </div>`),
      after: (v) => crAfter(v),
    };
  }, { mode: 'pro' });
  function crAfter(v) {
    const cr = CRED(), pr = V._crPick;
    const cost = () => pr.days * V.CREDITS.cost[pr.zone];
    const range = () => Array.from({ length: pr.days }, (_, j) => pr.start + j);
    const free = () => range().every((k) => crLeft(pr.zone, k) > 0);
    const draw = () => {
      $('#crBal', v).textContent = cr.bal;
      $('#crDays', v).innerHTML = Array.from({ length: 14 }, (_, k) => k + 1).map((k) => { const n = crLeft(pr.zone, k); return `<button type="button" data-k="${k}" class="${k >= pr.start && k < pr.start + pr.days ? 'in' : ''}${k === pr.start ? ' on' : ''}" ${n ? '' : 'disabled'}><b>${D.addDays(k).getDate()}</b><small>${D.fmtD(D.addDays(k), { weekday: 'short' })}</small><i>${n ? `${n} pl.` : 'complet'}</i></button>`; }).join('');
      const c = cost(), ok = free(), enough = cr.bal >= c;
      $('#crSum', v).innerHTML = `<dt>Zone</dt><dd>${esc(crZoneTxt(pr.zone))}</dd><dt>Période</dt><dd>du ${crDate(pr.start)} au ${crDate(pr.start + pr.days - 1)}</dd><dt>Places</dt><dd>${ok ? '<span class="ok-t">disponibles chaque jour</span>' : '<span class="no-t">un jour est complet : changez de date</span>'}</dd><dt>Coût</dt><dd><b>${c} crédits</b></dd><dt>Solde après</dt><dd>${enough ? `${cr.bal - c} crédits` : `<span class="no-t">il manque ${c - cr.bal} crédits</span>`}</dd>`;
      $('#crGo', v).innerHTML = ok && enough ? V.btn(`Réserver pour ${c} crédits`, { cls: 'block', attrs: 'data-cr-go', arrow: 'sparkles' }) : !enough ? V.btn('Acheter des crédits', { cls: 'ghost block', attrs: 'data-cr-buy', arrow: true }) : '';
      $('#crCamps', v).innerHTML = cr.camps.length ? `<div class="cr-camps">${cr.camps.slice().sort((a, b) => b.from - a.from).map((x) => { const s = crState(x); return `<div class="cr-camp ${s}"><span class="cr-st">${{ cours: 'En cours', avenir: 'À venir', fini: 'Terminée' }[s]}</span><div class="sp"><b>${esc(crZoneTxt(x.zone))} · ${x.days} jour${x.days > 1 ? 's' : ''}</b><small>du ${crDate(x.from)} au ${crDate(x.from + x.days - 1)} · ${x.cost} crédits</small></div>${s === 'avenir' ? `<button type="button" class="soc-b" data-cr-cancel="${x.id}">Annuler · restituer ${x.cost} crédits</button>` : `<span class="small muted">${nf(x.views || 0)} vues · ${nf(x.clicks || 0)} clics</span>`}</div>`; }).join('')}</div>` : '<p class="small muted">Aucune campagne pour l’instant.</p>';
      let run = cr.bal;
      const rows = cr.ledger.slice().reverse().map((l) => { const after = run; run -= l.n; return `<div class="cr-row"><span class="small muted">${D.fmtD(D.addDays(l.d), { day: 'numeric', month: 'short' })}</span><span class="sp">${esc(l.t)}</span><b class="${l.n > 0 ? 'ok-t' : ''}">${l.n > 0 ? '+' : ''}${l.n}</b><span class="small muted">solde ${after}</span></div>`; });
      $('#crLog', v).innerHTML = rows.join('') || '<p class="small muted">Aucune opération.</p>';
    };
    const buy = (id) => {
      const k = V.CREDITS.packs.find((x) => x.id === id) || V.CREDITS.packs[1];
      const sh = V.sheet.open({ title: `Acheter ${k.n} crédits`, body: `<dl class="kv"><dt>Pack</dt><dd>${k.n} crédits</dd><dt>Prix</dt><dd>${V.chf(k.price)} TTC</dd><dt>Validité</dt><dd>${V.CREDITS.months} mois</dd><dt>Solde après</dt><dd>${cr.bal + k.n} crédits</dd></dl><p class="hint">Démonstration : aucun paiement n’est effectué.</p>`, foot: V.btn(`Payer ${V.chf(k.price)}`, { cls: 'sm block', attrs: 'data-ok' }) });
      $('[data-ok]', sh).onclick = async (e) => { e.currentTarget.classList.add('loading'); await V.wait(900); cr.bal += k.n; cr.ledger.push({ d: 0, t: `Achat · pack de ${k.n} crédits`, n: k.n }); V.save(); V.sheet.close(); draw(); V.toast(`${k.n} crédits ajoutés. Solde : ${cr.bal}.`, { icon: 'check' }); };
    };
    // écouteur posé sur la page (remplacée à chaque affichage), pas sur #view qui persiste
    v.firstElementChild.addEventListener('click', (e) => {
      const z = e.target.closest('[data-cr="zone"] .qf-c'); if (z) { pr.zone = z.dataset.v; $$('[data-cr="zone"] .qf-c', v).forEach((x) => x.classList.toggle('on', x === z)); draw(); return; }
      const n = e.target.closest('[data-cr="days"] .qf-c'); if (n) { pr.days = +n.dataset.v; $$('[data-cr="days"] .qf-c', v).forEach((x) => x.classList.toggle('on', x === n)); draw(); return; }
      const d = e.target.closest('#crDays button'); if (d) { pr.start = +d.dataset.k; draw(); return; }
      const pk = e.target.closest('[data-pack]'); if (pk) { buy(pk.dataset.pack); return; }
      if (e.target.closest('[data-cr-buy]')) { buy('c30'); return; }
      const cx = e.target.closest('[data-cr-cancel]');
      if (cx) { const x = cr.camps.find((c) => c.id === cx.dataset.crCancel); if (!x || crState(x) !== 'avenir') return; cr.camps.splice(cr.camps.indexOf(x), 1); cr.bal += x.cost; cr.ledger.push({ d: 0, t: `Restitution · campagne annulée (${crZoneTxt(x.zone)})`, n: x.cost }); V.save(); draw(); V.toast(`Campagne annulée : ${x.cost} crédits restitués.`, { icon: 'check' }); return; }
      if (e.target.closest('[data-cr-go]')) {
        const c = cost();
        // contrôle au moment de la confirmation : place toujours libre et solde suffisant, sinon aucun débit
        const sh = V.sheet.open({ title: 'Confirmer la mise en avant', body: `<dl class="kv"><dt>Zone</dt><dd>${esc(crZoneTxt(pr.zone))}</dd><dt>Période</dt><dd>du ${crDate(pr.start)} au ${crDate(pr.start + pr.days - 1)}</dd><dt>Coût</dt><dd>${c} crédits</dd><dt>Solde après</dt><dd>${cr.bal - c} crédits</dd></dl><p class="hint">Étiquetée « ${esc(V.sponLabel())} », elle n’apparaît que dans les recherches qui vous correspondent. Annulable jusqu’au début, avec restitution des crédits.</p>`, foot: V.btn('Confirmer', { cls: 'sm block', attrs: 'data-ok' }) });
        $('[data-ok]', sh).onclick = async (ev) => {
          ev.currentTarget.classList.add('loading'); await V.wait(700);
          if (!free() || cr.bal < c) { V.sheet.close(); draw(); return V.toast('La place vient d’être prise ou le solde a changé : rien n’a été débité.', { icon: 'info', ms: 4000 }); }
          cr.bal -= c;
          cr.camps.push({ id: 'k' + Date.now(), zone: pr.zone, from: pr.start, days: pr.days, cost: c, views: 0, clicks: 0 });
          cr.ledger.push({ d: 0, t: `Mise en avant · ${crZoneTxt(pr.zone)} · ${pr.days} jour${pr.days > 1 ? 's' : ''}`, n: -c });
          V.save(); V.sheet.close(); draw();
          V.toast(`Réservée : ${c} crédits débités, solde ${cr.bal}.`, { icon: 'sparkles', ms: 3500 });
        };
      }
    });
    draw();
  }
  const upFeat = (v) => {
    const n = (V.L.pro.featDays || []).length;
    const paid = Math.max(0, n - 1);
    const tot = paid >= 7 ? V.FEATURED.perWeek + (paid - 7) * V.FEATURED.perDay : paid * V.FEATURED.perDay;
    const s = $('#featSum', v), t = $('#featTot', v);
    if (s) { s.textContent = n ? `${n} jour${n > 1 ? 's' : ''} · ${n ? '1 inclus' : ''}${paid >= 7 ? ' · tarif semaine' : ''}` : 'Aucun jour choisi'; t.textContent = V.chf(tot); }
  };
  V.upFeat = upFeat;

  /* =================================================================== ABONNEMENT ET FACTURES */
  V.route(/^\/pro\/abonnement$/, () => {
    const cur = V.L.pro.plan;
    return {
      title: 'Abonnement',
      html: shell('abonnement', `<div class="dash-head"><div><div class="eyebrow">Sans engagement · facturation continue</div><h1>Abonnement et factures</h1></div></div>
        <div class="panel" style="margin-bottom:14px"><div class="row-b wrapr"><div><div class="eyebrow">Formule actuelle</div><h3 style="margin-top:4px">${planOf().name} · ${planOf().price} CHF / mois</h3><p class="small ink2" style="margin-top:4px">Membre depuis le ${D.fmtD(D.addDays(PRO.since))} · offre de lancement utilisée (2 mois offerts) · prochain prélèvement le <b>${D.fmtD(D.addDays(PRO.nextBill))}</b></p></div>
          ${V.L.pro.cancelAt ? V.btn('Annuler la résiliation', { act: 'uncancel', cls: 'sm' }) : V.btn('Résilier', { act: 'cancel-sub', cls: 'sm danger-ghost' })}</div>
          ${V.L.pro.cancelAt ? `<div class="callout danger" style="margin-top:12px">${I('alert')}<span>Résiliation programmée le <b>${D.fmtD(new Date(V.L.pro.cancelAt))}</b>. Votre profil sera masqué à cette date${V.L.pro.keep ? ' et conservé 6 mois pour une reprise sans nouvelle inscription' : ''}.</span></div>` : ''}</div>
        <div class="plans">${V.PLANS.map((pl) => V.planRow(pl, { cur, btn: (x) => (x.id === cur ? '' : V.btn('Passer à ' + x.name, { act: 'plan', id: x.id, cls: 'sm ghost' })) })).join('')}</div>
        <div class="grid-2" style="margin-top:14px">
          <div class="panel"><h3>Moyen de paiement</h3><div class="stack" style="margin-top:12px">${V.opt('pay', 'qr', 'QR-facture suisse', 'Virement depuis votre banque · aucune donnée de carte', { on: (V.L.pro.pay || 'qr') === 'qr', right: I('qr', 'lg muted') })}${V.opt('pay', 'card', 'Carte bancaire', 'Prestataire spécialisé · libellé neutre sur le relevé', { on: V.L.pro.pay === 'card', right: I('card', 'lg muted') })}${V.opt('pay', 'twint', 'TWINT', 'Sous réserve de l’accord du prestataire', { on: V.L.pro.pay === 'twint', right: I('smartphone', 'lg muted') })}</div></div>
          <div class="panel"><h3>Factures</h3><div class="tbl-wrap"><table class="tbl" style="min-width:420px;margin-top:8px"><thead><tr><th>N°</th><th>Libellé</th><th class="r">Montant</th><th></th></tr></thead><tbody>${PRO.invoices.map((f) => `<tr><td class="num small">${f.n}<div class="xs muted">${D.fmtShort(D.addDays(f.d))}</div></td><td class="small">${f.label}</td><td class="r num b">${f.amt ? V.chf(f.amt) : 'Offert'}</td><td class="r"><button class="icon-btn" data-act="invoice" data-n="${f.n}" aria-label="Télécharger">${I('download')}</button></td></tr>`).join('')}</tbody></table></div><p class="hint">Libellé sur le relevé : « VLR SERVICES GENEVE ».</p></div>
        </div>`),
      after: (v) => v.addEventListener('change', (e) => { if (e.target.name === 'pay') { V.L.pro.pay = e.target.value; V.save(); V.toast('Moyen de paiement enregistré.', { ms: 1800 }); } }),
    };
  }, { mode: 'pro' });

  /* =================================================================== PARRAINAGE */
  V.route(/^\/pro\/parrainage$/, () => ({
    title: 'Parrainage',
    html: shell('parrainage', `<div class="dash-head"><div><div class="eyebrow">Marraine</div><h1>Parrainage</h1></div></div>
      <div class="grid-2"><div class="panel ink" style="display:flex;flex-direction:column;align-items:flex-start;gap:12px"><span class="small muted">Votre code</span><span class="serif num" style="font-size:44px;line-height:1;letter-spacing:.04em">${PRO.referral}</span><span style="font-size:14px;color:#cfc6d4">1 mois offert pour vous et pour elle, après son premier mois payé. Elle doit être vérifiée.</span><div class="row">${V.btn('Copier le code', { act: 'copy-ref', cls: 'gold sm' })}${V.btn('Partager', { act: 'share-ref', cls: 'light sm' })}</div></div>
      <div class="panel"><h3>Vos filleules</h3><div class="list-rows" style="margin-top:8px">${PRO.filleules.map((f) => `<div><span class="avatar">${f.name[0]}</span><div class="sp"><b>${f.name}</b><div class="small muted">${f.st}</div></div><span class="badge ${f.gain.includes('offert') ? 'ok' : ''}">${f.gain}</span></div>`).join('')}</div><p class="hint">Crédit gagné : 1 mois (249 CHF), appliqué automatiquement à votre prochaine facture.</p></div></div>`),
  }), { mode: 'pro' });

  /* =================================================================== STATISTIQUES */
  V.route(/^\/pro\/stats$/, (m, q) => {
    const per = q.p || '30';
    const n = +per === 7 ? 7 : 30;
    const st = V.proStats;
    const views = st.views.slice(-n), opens = st.opens.slice(-n), favs = st.favs.slice(-n);
    const k = n / 30;
    const contacts = Object.fromEntries(Object.entries(st.contacts).map(([a, b]) => [a, Math.round(b * k)]));
    const avg = views.map((x) => Math.round(x * st.avg));
    const tot = sum(Object.values(contacts));
    const dn = V.donut([['Suisse', 64], ['France', 21], ['Italie', 6], ['Royaume-Uni', 4], ['Autres', 5]]);
    return {
      title: 'Statistiques', keepScroll: true,
      html: shell('stats', `<div class="dash-head"><div><div class="eyebrow">Données agrégées, aucune donnée personnelle de visiteur</div><h1>Statistiques</h1></div>${V.seg('per', [['7', '7 jours'], ['30', '30 jours']], per)}</div>
        <div class="kpis"><div class="kpi"><span class="l">Vues de la carte</span><span class="v">${V.nf(sum(views))}</span>${V.spark(views)}</div><div class="kpi"><span class="l">Ouvertures de fiche</span><span class="v">${V.nf(sum(opens))}</span>${V.spark(opens)}</div><div class="kpi"><span class="l">Ajouts en sélection</span><span class="v">${V.nf(sum(favs))}</span>${V.spark(favs, 'var(--gold)')}</div><div class="kpi"><span class="l">Comparaisons</span><span class="v">${Math.round(88 * k)}</span><span class="d">+15 %</span></div></div>
        <div class="panel" style="margin-top:14px"><div class="row-b wrapr"><h3>Vues par jour</h3><div class="legend"><span><i style="background:var(--violet)"></i>Votre carte</span><span><i style="background:var(--gold)"></i>Moyenne de la plateforme</span></div></div>${V.lineChart(views, { avg, h: 240, labels: [[0, n === 7 ? 'J-6' : 'J-29'], [n - 1, 'Aujourd’hui']] })}</div>
        <div class="grid-2" style="margin-top:14px">
          <div class="panel"><h3>Contacts par canal · ${tot}</h3><div class="bars" style="margin-top:14px">${Object.entries(contacts).map(([a, b], j) => `<div class="bar-row"><span>${a}</span><span class="tr"><i class="${j === 0 ? '' : 'g'}" style="width:${(b / tot) * 100}%"></i></span><b class="r num">${b}</b></div>`).join('')}</div>
            <h3 style="margin-top:22px">Parcours des visiteurs</h3><div class="funnel" style="margin-top:12px"><div><span>Vues de la carte</span><b>${V.nf(sum(views))}</b></div><div><span>Ouvertures de fiche</span><b>${V.nf(sum(opens))}</b></div><div><span>Ajouts en sélection</span><b>${sum(favs)}</b></div><div><span>Contacts</span><b>${tot}</b></div></div></div>
          <div class="panel"><h3>Provenance des visiteurs</h3><div class="row" style="margin-top:12px;gap:20px;flex-wrap:wrap">${dn.svg}<div class="legend" style="flex-direction:column;gap:8px">${dn.legend}</div></div>
            <h3 style="margin-top:22px">Conseils</h3><div class="stack" style="margin-top:10px">
              <div class="callout ok">${I('trending')}<span>Votre fiche est vue <b>32 % de plus</b> que la moyenne. Votre 2<sup>e</sup> photo retient le plus l’attention.</span></div>
              <div class="callout gold">${I('languages')}<span>18 % de vos visiteurs filtrent en espagnol. Ajouter l’espagnol (même B1) élargirait votre audience.</span></div>
              <div class="callout">${I('zap')}<span>Les profils « Disponibles maintenant » entre 19 h et 23 h reçoivent 2,4 fois plus de contacts.</span></div></div></div>
        </div>`),
      after: (v) => $('[data-seg="per"]', v).addEventListener('seg', (e) => location.replace('#/pro/stats?p=' + e.detail)),
    };
  }, { mode: 'pro', keepScroll: true });

  /* =================================================================== MESSAGES */
  V.route(/^\/pro\/messages$/, () => ({
    title: 'Messages',
    html: shell('messages', `<div class="dash-head"><div><div class="eyebrow">De l’équipe BD uniquement</div><h1>Messages</h1></div></div>
      <div class="panel inbox">${PRO.messages.map((m, k) => `<div class="msg${m.unread && !(V.L.pro.read || []).includes(m.subj) ? ' unread' : ''}" data-act="pro-msg" data-k="${k}"><div class="t"><b>${esc(m.subj)}</b><span>${esc(m.from)} · ${m.d === 0 ? 'aujourd’hui' : D.fmtD(D.addDays(m.d))} · ${esc(m.body)}</span></div></div>`).join('')}</div>
      <p class="hint" style="margin-top:12px">BD n’intervient jamais dans vos échanges avec les visiteurs : il n’y a pas de messagerie entre visiteurs et escortes.</p>`),
  }), { mode: 'pro' });

  /* =================================================================== SÉCURITÉ */
  V.route(/^\/pro\/securite$/, () => {
    const lk = PRO.leaks[0];
    const done = V.L.pro.leakDone;
    return {
      title: 'Sécurité',
      html: shell('securite', `<div class="dash-head"><div><div class="eyebrow">Protection</div><h1>Sécurité</h1></div></div>
        <div class="big-hide"><div class="row-b wrapr"><div><b class="h4">${V.L.pro.hidden ? 'Profil masqué' : 'Masquer mon profil maintenant'}</b><div class="small ink2">${V.L.pro.hidden ? 'Invisible partout. Votre abonnement continue.' : 'Retrait de la galerie, de la recherche, des encarts et du duo, caches compris, en moins d’une minute.'}</div></div>${V.L.pro.hidden ? V.btn('Réactiver', { act: 'pro-unhide', cls: 'sm' }) : V.btn('Masquer maintenant', { act: 'pro-hide', cls: 'danger', arrow: 'eye-off' })}</div></div>
        <div class="grid-2" style="margin-top:14px">
          <div class="panel"><div class="row-b"><h3>Alertes de fuite d’images</h3><span class="badge ${done ? 'ok' : 'danger'}">${done ? 'Traitée' : '1 alerte'}</span></div><p class="small muted" style="margin:4px 0 12px">Recherche inversée chaque semaine sur le web.</p>
            <div class="cmpface"><figure><img src="${V.img(lk.img, 's')}" alt=""><figcaption><span class="badge dark">Votre photo</span></figcaption></figure><figure><img src="${V.img(lk.img, 's')}" alt="" style="filter:saturate(.7) contrast(1.05)"><figcaption><span class="badge danger">${lk.where}</span></figcaption></figure></div>
            <div class="score" style="margin-top:10px;background:var(--danger-soft);color:var(--danger)">${I('alert')}Concordance ${lk.match} · trouvée il y a 3 jours</div>
            ${done ? `<div class="callout ok" style="margin-top:12px">${I('check')}<span>Demande de retrait envoyée au site le ${D.fmtD(new Date(done))}. Nous relançons sous 7 jours.</span></div>` : `<div class="row wrapr" style="margin-top:12px">${V.btn('Demander le retrait', { act: 'leak-takedown', cls: 'sm', arrow: 'file' })}${V.btn('C’est bien moi, ignorer', { act: 'leak-ignore', cls: 'sm ghost' })}</div>`}</div>
          <div class="stack">
            <div class="panel"><h3>Protection des photos</h3><ul class="svc" style="margin-top:10px">${['Filigrane automatique', 'Métadonnées supprimées', 'Adresse exacte jamais affichée', 'Numéro révélé au clic, pas dans le code de la page'].map((x) => `<li>${I('check')}${x}</li>`).join('')}</ul></div>
            <div class="panel"><div class="row-b"><h3>Clients signalés</h3><span class="badge">V2</span></div><p class="small ink2" style="margin-top:6px">Vérifier un numéro avant d’accepter un rendez-vous, avec l’outil déjà utilisé à Genève. En cours d’étude juridique.</p></div>
            <div class="panel soft"><h3>Être accompagnée</h3><div class="list-rows" style="margin-top:6px"><div><b class="serif" style="font-size:24px;font-weight:400;width:70px">117</b><span class="small">Police, danger immédiat</span></div><div><b class="serif" style="font-size:20px;font-weight:400;width:70px">Aspasie</b><span class="small">Association genevoise. Permanences gratuites, sans donner son nom.</span></div></div></div>
          </div>
        </div>`),
    };
  }, { mode: 'pro' });

  /* =================================================================== CONTRÔLES */
  V.route(/^\/pro\/controles$/, () => {
    const v = ME().verif;
    return {
      title: 'Contrôles',
      html: shell('controles', `<div class="dash-head"><div><div class="eyebrow">Affichés et datés sur votre fiche</div><h1>Mes contrôles</h1></div></div>
        <div class="grid-2"><div class="panel"><div class="timeline">
          <div class="tl-i ok"><b>Âge réel et identité vérifiés</b><span>${D.fmtShort(D.addDays(v.id))} · prestataire suisse · aucune copie conservée</span></div>
          <div class="tl-i ok"><b>Indépendance confirmée en entretien</b><span>${D.fmtShort(D.addDays(v.indep))} · prochain avant le ${D.fmtShort(D.addDays(v.indep + 182))}</span></div>
          <div class="tl-i ok"><b>Médias concordants</b><span>${D.fmtShort(D.addDays(v.media))}</span></div>
          <div class="tl-i cur"><b>Prochain selfie de contrôle</b><span>avant le ${D.fmtShort(D.addDays(v.media + 90))} · moins d’une minute</span></div>
        </div>${V.btn('Faire mon selfie de contrôle', { act: 'selfie-check', arrow: 'camera' })}</div>
        ${ctlCard()}
        <div class="panel soft"><h3>Pourquoi ces contrôles ?</h3><p class="small ink2" style="margin-top:8px">Ils rassurent les visiteurs et vous distinguent des faux profils. Sans contrôle à jour, le badge tombe, puis le profil est suspendu après un délai de grâce de 14 jours.</p><div class="callout" style="margin-top:12px">${I('lock')}<span>Votre selfie sert uniquement à la comparaison : il n’est jamais publié.</span></div></div></div>`),
    };
  }, { mode: 'pro' });

  /* Contrôle planifié : BD propose une date, la professionnelle confirme ou reporte (même état que le back-office) */
  const ctlGet = () => { const a = V.L.adm2 && V.L.adm2.ctl && V.L.adm2.ctl.alma; if (a) return { ...a, when: new Date(a.when), from: a.from ? new Date(a.from) : null }; const d = V.ADM && V.ADM.PLANNED.find((x) => x.id === 'alma'); return d || null; };
  const ctlSet = (o) => { V.L.adm2 = V.L.adm2 || {}; V.L.adm2.ctl = V.L.adm2.ctl || {}; V.L.adm2.ctl.alma = { id: 'alma', ...o, when: +o.when, from: o.from ? +o.from : null }; V.L.adm2.log = [...(V.L.adm2.log || []), { at: Date.now(), who: 'Alma', role: 'Professionnelle', what: o.state === 'confirmé' ? 'Contrôle confirmé par la professionnelle' : 'Contrôle reporté par la professionnelle', obj: `Alma · ${V.gva ? V.gva.dt(new Date(+o.when)) : ''}` }]; V.save(); };
  const ctlCard = () => {
    const c = ctlGet(); if (!c) return '';
    const G = V.gva; const lbl = { proposé: ['warn', 'À confirmer'], confirmé: ['ok', 'Confirmé'], reporté: ['v', 'Reporté, en attente de BD'] }[c.state];
    return `<div class="panel" style="margin-top:14px"><div class="row-b"><h3>Prochain rendez-vous de contrôle</h3><span class="badge ${lbl[0]}">${lbl[1]}</span></div>
      <div class="adm-ctl"><span class="adm-ctl-d"><b>${G.wd(c.when)}</b><small>${G.t(c.when)}</small></span><div><b>${c.kind}</b><div class="small muted">${G.long(c.when)} à ${G.t(c.when)} · ${c.mode} · heure de Genève</div>${c.from ? `<div class="xs muted">Vous avez reporté la date du ${G.dt(c.from)}</div>` : ''}</div></div>
      ${c.state === 'proposé' ? `<div class="row wrapr" style="margin-top:12px">${V.btn('Je confirme', { cls: 'sm', arrow: 'check', attrs: 'data-ctl="ok"' })}${V.btn('Proposer un autre moment', { cls: 'sm ghost', arrow: 'calendar', attrs: 'data-ctl="move"' })}</div>` : c.state === 'confirmé' ? '<p class="hint">Un rappel discret vous est envoyé la veille.</p>' : '<p class="hint">L’équipe confirme votre nouvelle date sous 24 h.</p>'}
      <p class="hint">BD propose la date ; vous confirmez ou proposez un autre moment. Rien n’est publié.</p></div>`;
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ctl]'); if (!b || V.parse().path !== '/pro/controles') return;
    const c = ctlGet();
    if (b.dataset.ctl === 'ok') { ctlSet({ ...c, state: 'confirmé', by: 'La professionnelle' }); V.toast('Merci : rendez-vous de contrôle confirmé.', { icon: 'calendar' }); return V.render(); }
    const G = V.gva; const opts = Array.from({ length: 6 }, (_, k) => G.at(k + 3, [10, 14, 17][k % 3], k % 2 ? 30 : 0)).filter((d) => d.getDay() !== 0);
    const sh = V.sheet.open({ title: 'Proposer un autre moment', body: `<div class="stack">${opts.map((d, k) => V.opt('nd', String(d.getTime()), `${G.long(d)} à ${G.t(d)}`, 'Heure de Genève', { on: !k })).join('')}</div>`, foot: V.btn('Proposer ce moment', { cls: 'sm block', attrs: 'data-ok' }) });
    $('[data-ok]', sh).onclick = () => { const v = $('input[name="nd"]:checked', sh).value; ctlSet({ ...c, from: c.when, when: +v, state: 'reporté', by: 'La professionnelle' }); V.sheet.close(); V.toast('Nouvelle date proposée. L’équipe BD vous confirme sous 24 h.', { icon: 'calendar' }); V.render(); };
  });

  /* =================================================================== CONFIDENTIALITÉ (blocage par pays) */
  const COUNTRIES = [['CH', 'Suisse'], ['FR', 'France'], ['IT', 'Italie'], ['DE', 'Allemagne'], ['AT', 'Autriche'], ['ES', 'Espagne'], ['PT', 'Portugal'], ['BE', 'Belgique'], ['GB', 'Royaume-Uni'], ['RO', 'Roumanie'], ['BG', 'Bulgarie'], ['HU', 'Hongrie'], ['PL', 'Pologne'], ['UA', 'Ukraine'], ['RU', 'Russie'], ['BR', 'Brésil'], ['CO', 'Colombie'], ['VE', 'Venezuela'], ['MA', 'Maroc'], ['TN', 'Tunisie'], ['DZ', 'Algérie'], ['TH', 'Thaïlande'], ['CN', 'Chine'], ['US', 'États-Unis']];
  V.route(/^\/pro\/confidentialite$/, () => {
    const pc = (V.L.pro.priv = V.L.pro.priv || { block: ['BR'], faceBlur: false, revealTel: true, history: true });
    return {
      title: 'Confidentialité',
      html: shell('confidentialite', `<div class="dash-head"><div><div class="eyebrow">Vous décidez qui vous voit</div><h1>Centre de confidentialité</h1></div></div>
        <div class="grid-2">
          <div class="panel"><div class="row-b"><h3>Bloquer des pays</h3><span class="badge ${pc.block.length ? 'v' : ''}">${pc.block.length} bloqué${pc.block.length > 1 ? 's' : ''}</span></div>
            <p class="small muted" style="margin:4px 0 12px">Votre profil n’apparaît pas aux visiteurs qui se connectent depuis ces pays (par exemple votre pays d’origine). La localisation est approximative et n’est jamais conservée.</p>
            <label class="al-search" style="width:100%;margin-bottom:10px">${I('search', 'sm')}<input type="search" placeholder="Chercher un pays…" data-cq aria-label="Chercher un pays" style="width:100%"></label>
            <div class="chips" id="cty">${COUNTRIES.map(([c, n]) => `<button type="button" class="chip sm${pc.block.includes(c) ? ' on' : ''}" data-cty="${c}"><span class="ck">${I('check', 'sm')}</span>${n}</button>`).join('')}</div>
            <p class="hint">Un VPN peut contourner ce blocage : il réduit l’exposition, il ne garantit pas l’anonymat.</p></div>
          <div class="stack">
            <div class="panel"><h3>Autres réglages</h3>${V.sw('pv-face', pc.faceBlur, 'Flouter mon visage sur toutes les photos', 'Appliqué en moins de 2 min, sans nouvelle modération')}${V.sw('pv-tel', pc.revealTel, 'Numéro révélé seulement au clic', 'Jamais écrit dans le code de la page ni lisible par les robots')}${V.sw('pv-hist', pc.history, 'Ne pas garder l’historique de mes statuts', 'Seul le statut en cours est visible')}${V.sw('seo', V.L.pro.seo !== false, 'Fiche visible dans les moteurs de recherche', 'Désactivez pour n’être trouvée que sur BD')}</div>
            <div class="panel soft"><h3>Vos données</h3><p class="small ink2" style="margin-top:6px">Téléchargez tout ce que BD conserve sur vous, ou demandez une rectification. Réponse sous 30 jours, sans justification.</p><div class="row wrapr" style="margin-top:12px">${V.btn('Télécharger mes données', { cls: 'sm ghost', arrow: 'download', attrs: 'data-pv="dl"' })}${V.btn('Demander une rectification', { cls: 'sm ghost', attrs: 'data-pv="fix"' })}</div></div>
          </div>
        </div>`),
      after: (v) => {
        const root = v.firstElementChild;
        root.addEventListener('click', (e) => {
          const c = e.target.closest('[data-cty]');
          if (c) { const on = c.classList.toggle('on'); const code = c.dataset.cty; pc.block = on ? [...new Set([...pc.block, code])] : pc.block.filter((x) => x !== code); V.save(); V.toast(on ? `Profil masqué aux visiteurs depuis : ${c.textContent.trim()}.` : `${c.textContent.trim()} : profil de nouveau visible.`, { icon: 'globe', ms: 2600 }); const b = root.querySelector('.panel .badge'); if (b) { b.textContent = `${pc.block.length} bloqué${pc.block.length > 1 ? 's' : ''}`; b.className = 'badge ' + (pc.block.length ? 'v' : ''); } return; }
          const d = e.target.closest('[data-pv]'); if (d) V.toast(d.dataset.pv === 'dl' ? 'Démonstration : archive de vos données préparée, envoyée par e-mail sous 24 h.' : 'Demande envoyée à l’équipe BD. Réponse sous 30 jours.', { icon: 'mail' });
        });
        root.addEventListener('input', (e) => { if (!e.target.matches('[data-cq]')) return; const q = e.target.value.toLowerCase(); $$('[data-cty]', root).forEach((b) => { b.hidden = q && !b.textContent.toLowerCase().includes(q); }); });
        root.addEventListener('change', (e) => { const k = { 'pv-face': 'faceBlur', 'pv-tel': 'revealTel', 'pv-hist': 'history' }[e.target.name]; if (k) { pc[k] = e.target.checked; V.save(); V.toast('Réglage enregistré.', { ms: 1600 }); } else if (e.target.name === 'seo') { V.L.pro.seo = e.target.checked; V.save(); } });
      },
    };
  }, { mode: 'pro' });

  /* =================================================================== PARAMÈTRES */
  V.route(/^\/pro\/parametres$/, () => ({
    title: 'Paramètres',
    html: shell('parametres', `<div class="dash-head"><h1>Paramètres</h1></div>
      <div class="grid-2"><div class="panel stack-lg">${V.field('E-mail', { type: 'email', value: 'alma.g@proton.me' })}${V.field('Téléphone professionnel', { value: ME().tel })}${V.field('Langue de l’espace pro', { type: 'select', value: 'fr', options: V.LANG8 })}</div>
      <div class="panel">${V.sw('2fa', true, 'Double authentification', 'Code par application ou SMS à chaque connexion')}${V.sw('n-exp', true, 'Statut expiré', 'SMS et e-mail')}${V.sw('n-ctrl', true, 'Contrôles à prévoir', 'E-mail, 14 jours avant')}${V.sw('n-bill', true, 'Factures et paiements', 'E-mail')}${V.sw('n-leak', true, 'Alertes de fuite d’images', 'E-mail et SMS')}</div></div>
      <div class="panel" style="margin-top:14px;border-color:color-mix(in srgb,var(--danger) 40%,transparent)"><div class="row-b wrapr"><div><h3>Supprimer mon profil</h3><p class="small ink2" style="margin-top:4px">Profil et photos supprimés définitivement après 7 jours de rétractation. Les données sont effacées sous 30 jours, sauvegardes comprises.</p></div>${V.btn('Supprimer', { act: 'pro-delete', cls: 'sm danger-ghost', arrow: 'trash' })}</div></div>`),
  }), { mode: 'pro' });

  /* =================================================================== INSCRIPTION EN 4 ÉTAPES */
  const REG0 = { pseudo: 'Daria', ville: 'Genève', cat: 'Femme', langs: ['fr', 'en', 'ru'], days: [1, 2, 3, 4], bio: '', tel: '78 655 32 10', otp: false, kyc: 0, live: false, slot: null, mode: 'visio', cgu: false, ind: false, photos: [], consent: false, plan: 'visibilite' };
  const REG = () => { V.L.reg = V.L.reg || Object.assign({}, REG0); V.L.reg.savedAt = Date.now(); return V.L.reg; }; // brouillon gardé sur l'appareil
  const steps = ['Candidature', 'Contrôles', 'Profil', 'Publication'];
  const stepper = (n) => `<div class="stepper">${steps.map((s, k) => `<div class="${k + 1 < n ? 'done' : k + 1 === n ? 'cur' : ''}"><i></i><span>${k + 1}. ${s}</span></div>`).join('')}</div>`;
  const regShell = (n, inner, nextLbl) => `<div class="wrap" style="max-width:860px;padding-top:24px">
      <div class="row-b"><a class="txt-btn" href="${n > 1 ? '#/pro/inscription/' + (n - 1) : '#/rejoindre'}">${I('arrow-left', 'sm')}${n > 1 ? 'Étape précédente' : 'Retour'}</a><span class="xs muted reg-draft">${I('check', 'sm')}Brouillon enregistré à ${new Date().toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })} · reprise possible plus tard</span></div>
      ${REG().fix && REG().fix.length && n === 3 ? `<div class="callout gold" style="margin-top:14px">${I('edit')}<span><b>Corrections demandées par l’équipe :</b> ${REG().fix.map(esc).join(' · ')}</span></div>` : ''}
      <h1 class="h2" style="margin-top:16px">${['Votre candidature', 'Vos contrôles', 'Votre profil', 'Prête à publier'][n - 1]}</h1>
      ${stepper(n)}${inner}
      <div class="row-b" style="margin-top:24px"><span class="small muted">Étape ${n} sur 4</span>${V.btn(nextLbl || 'Continuer', { act: 'reg-next', id: String(n), arrow: 'arrow-right', cls: 'lg' })}</div>
    </div>`;

  V.route(/^\/pro\/inscription\/1$/, (m, q) => {
    const R = REG(); if (q.plan) R.plan = q.plan;
    return {
      title: 'Inscription · candidature',
      html: regShell(1, `<div class="panel stack-lg">
        <div class="form-grid two">${V.field('Pseudo (nom public)', { name: 'pseudo', value: R.pseudo, state: '<span class="ok">' + I('check', 'sm') + 'Disponible</span>' })}${V.field('Ville', { type: 'select', value: R.ville, options: ['Genève', 'Lausanne (bientôt)', 'Zurich (bientôt)'] })}</div>
        <div><p class="small b" style="margin-bottom:8px">Catégorie</p><div class="chips">${['Femme', 'Femme trans', 'Homme', 'Masseuse', 'BDSM', 'Duo ou couple'].map((c) => `<button class="chip${R.cat === c ? ' on' : ''}" data-act="reg-cat" data-v="${c}"><span class="ck">${I('check', 'sm')}</span>${c}</button>`).join('')}</div></div>
        <div><p class="small b" style="margin-bottom:8px">Langues parlées</p><div class="chips">${['fr', 'en', 'es', 'pt', 'ru', 'it', 'de', 'ar', 'uk'].map((l) => `<button class="chip sm${R.langs.includes(l) ? ' on' : ''}" data-act="toggle-on"><span class="ck">${I('check', 'sm')}</span>${V.LANGS[l]}</button>`).join('')}</div><p class="hint">Vous préciserez vos niveaux à l’étape 3.</p></div>
        <div><p class="small b" style="margin-bottom:8px">Disponibilités habituelles</p><div class="chips">${['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((d, k) => `<button class="chip sm${R.days.includes(k) ? ' on' : ''}" data-act="toggle-on"><span class="ck">${I('check', 'sm')}</span>${d}</button>`).join('')}</div></div>
        ${V.field('Présentation (quelques phrases)', { type: 'textarea', name: 'bio', value: R.bio, max: 600 })}
        <div><div class="form-grid two">${V.field('Téléphone professionnel', { name: 'tel', value: R.tel, suffix: '+41' })}${V.field('E-mail', { type: 'email', value: 'daria.m@proton.me' })}</div>
          <div id="otpBox" style="margin-top:12px">${R.otp ? `<div class="callout ok">${I('check')}<span>Numéro vérifié.</span></div>` : V.btn('Recevoir le code par SMS', { act: 'otp-send', cls: 'sm ghost', arrow: 'sms' })}</div></div>
        ${V.field('Langue de votre espace pro', { type: 'select', value: 'fr', options: V.LANG8 })}
      </div>`),
      after: (v) => {
        v.firstElementChild.addEventListener('click', (e) => { const c = e.target.closest('[data-act="toggle-on"]'); if (c) c.classList.toggle('on'); const k = e.target.closest('[data-act="reg-cat"]'); if (k) { $$('[data-act="reg-cat"]', v).forEach((b) => b.classList.toggle('on', b === k)); R.cat = k.dataset.v; V.save(); } });
        const ps = $('input[name="pseudo"]', v); let t;
        ps.addEventListener('input', () => { const st = ps.parentElement.querySelector('.state'); st.innerHTML = '<span class="muted">Vérification…</span>'; clearTimeout(t); t = setTimeout(() => { const taken = V.PROFILES.some((p) => p.name.toLowerCase() === ps.value.trim().toLowerCase()); st.innerHTML = taken ? `<span class="danger">${I('x', 'sm')}Déjà pris</span>` : `<span class="ok">${I('check', 'sm')}Disponible</span>`; R.pseudo = ps.value.trim(); V.save(); }, 600); });
        $('textarea[name="bio"]', v).addEventListener('input', (e) => { R.bio = e.target.value; V.save(); });
      },
    };
  }, { mode: 'pro' });

  V.route(/^\/pro\/inscription\/2$/, () => {
    const R = REG();
    const days = Array.from({ length: 6 }, (_, k) => D.addDays(k + 1)).filter((d) => d.getDay() !== 0);
    return {
      title: 'Inscription · contrôles',
      html: regShell(2, `<div class="stack-lg">
        <div class="panel"><div class="row-b"><h3>1. Âge et identité</h3><span class="badge ${R.kyc >= 3 ? 'ok' : ''}">${R.kyc >= 3 ? 'Vérifiée' : 'Prestataire suisse'}</span></div>
          <div id="kyc" style="margin-top:14px">${kycStage(R)}</div></div>
        <div class="panel"><div class="row-b"><h3>2. Entretien d’indépendance</h3><span class="badge ${R.slot ? 'ok' : ''}">${R.slot ? 'Planifié' : '15 minutes'}</span></div>
          <p class="small ink2" style="margin:6px 0 14px">Un échange direct avec notre équipe, pour vérifier que vous travaillez pour vous-même. Confidentiel.</p>
          ${V.seg('imode', [['visio', 'En visio'], ['bureau', 'En personne · Genève centre']], R.mode)}
          <p class="small b" style="margin:16px 0 8px">Jour</p><div class="chips">${days.map((d, k) => `<button class="chip sm${R.day === k ? ' on' : ''}" data-act="reg-day" data-k="${k}">${d.toLocaleDateString('fr-CH', { weekday: 'short', day: 'numeric', month: 'short' })}</button>`).join('')}</div>
          <p class="small b" style="margin:16px 0 8px">Heure</p><div class="slots">${['10 h', '10 h 30', '11 h', '14 h', '15 h 30', '17 h', '18 h 30'].map((h) => `<button class="chip sm${R.slot === h ? ' on' : ''}" data-act="reg-slot" data-v="${h}">${h}</button>`).join('')}</div></div>
        <div class="panel">${V.opt('cgu', '1', 'J’accepte les conditions escortes et la politique de contenu', 'Forfaits uniquement, aucune commission · photos suggestives, jamais explicites', { box: true, on: R.cgu })}<div style="height:10px"></div>${V.opt('ind', '1', 'Je confirme travailler de manière indépendante', 'Personne ne me contraint, ne gère mes rendez-vous ni ne perçoit mes revenus', { box: true, on: R.ind })}</div>
      </div>`),
      after: (v) => {
        v.firstElementChild.addEventListener('click', (e) => {
          const d = e.target.closest('[data-act="reg-day"]'), s = e.target.closest('[data-act="reg-slot"]');
          if (d) { R.day = +d.dataset.k; $$('[data-act="reg-day"]', v).forEach((b) => b.classList.toggle('on', b === d)); V.save(); }
          if (s) { R.slot = s.dataset.v; $$('[data-act="reg-slot"]', v).forEach((b) => b.classList.toggle('on', b === s)); V.save(); V.toast(`Entretien réservé : ${days[R.day || 0].toLocaleDateString('fr-CH', { weekday: 'long', day: 'numeric', month: 'long' })} à ${R.slot}.`, { icon: 'calendar' }); }
        });
        v.addEventListener('change', (e) => { if (e.target.name === 'cgu') R.cgu = e.target.checked; if (e.target.name === 'ind') R.ind = e.target.checked; V.save(); });
        $('[data-seg="imode"]', v).addEventListener('seg', (e) => { R.mode = e.detail; V.save(); });
      },
    };
  }, { mode: 'pro' });
  function kycStage(R) {
    if (R.kyc === 0) return `<div class="stack">${V.opt('doc', 'id', 'Carte d’identité', '', { on: true })}${V.opt('doc', 'pass', 'Passeport', '')}${V.opt('doc', 'permit', 'Permis de séjour', '')}</div><div style="margin-top:14px">${V.btn('Scanner ma pièce', { act: 'kyc-scan', arrow: 'id-card' })}</div><p class="hint">${I('lock', 'sm')} Votre pièce reste chez le prestataire : BD ne conserve que le résultat et votre date de naissance.</p>`;
    if (R.kyc === 1) return `<div class="scanner"><div class="doc"><div class="pic"></div><div class="lines"><i></i><i></i><i></i><i></i></div></div><span class="corner c1"></span><span class="corner c2"></span><span class="corner c3"></span><span class="corner c4"></span><span class="beam"></span><span class="lbl" id="scanLbl">Recto · tenez la carte bien à plat</span></div>`;
    if (R.kyc === 2) return `<div class="selfie"><svg viewBox="0 0 220 220"><circle class="trk" cx="110" cy="110" r="105"/><circle class="val" id="ring" cx="110" cy="110" r="105"/></svg><div class="face"><img src="img/p/daria-selfie-s.webp" alt="" onerror="this.src='img/p/daria-s.webp'"></div></div><p class="center b" style="text-align:center;margin-top:14px" id="liveLbl">Regardez l’écran, puis tournez lentement la tête</p>`;
    return `<div class="steps-run">${['Document authentique', 'Visage concordant · 98 %', 'Majorité confirmée · 27 ans', 'Aucune copie conservée par BD'].map((t) => `<div class="ok"><i></i>${t}</div>`).join('')}</div><div class="callout ok">${I('badge-check')}<span><b>Identité vérifiée.</b> Votre âge réel (27 ans) sera affiché sur votre profil.</span></div>`;
  }
  V.kycRun = async () => {
    const R = REG(); const box = $('#kyc'); if (!box) return;
    R.kyc = 1; box.innerHTML = kycStage(R);
    await V.wait(1600); const l = $('#scanLbl'); if (l) l.textContent = 'Verso · retournez la carte';
    await V.wait(1500); if (l) l.textContent = 'Lecture de la zone MRZ…';
    await V.wait(900);
    R.kyc = 2; box.innerHTML = kycStage(R);
    const ring = $('#ring'); const lbl = $('#liveLbl');
    for (let k = 1; k <= 20; k++) { await V.wait(110); if (ring) ring.style.strokeDashoffset = 660 - (660 * k) / 20; if (k === 9 && lbl) lbl.textContent = 'Encore un peu…'; }
    if (lbl) lbl.textContent = 'Vivacité confirmée';
    await V.wait(500);
    box.innerHTML = `<div class="steps-run" id="krun">${['Document authentique', 'Visage concordant · 98 %', 'Majorité confirmée · 27 ans', 'Aucune copie conservée par BD'].map((t) => `<div><i></i>${t}</div>`).join('')}</div>`;
    for (const r of $$('#krun div')) { r.classList.add('run'); await V.wait(480); r.classList.remove('run'); r.classList.add('ok'); }
    R.kyc = 3; V.save();
    box.insertAdjacentHTML('beforeend', `<div class="callout ok">${I('badge-check')}<span><b>Identité vérifiée.</b> Votre âge réel (27 ans) sera affiché sur votre profil.</span></div>`);
    const badge = box.closest('.panel').querySelector('.badge'); if (badge) { badge.className = 'badge ok'; badge.textContent = 'Vérifiée'; }
  };

  V.route(/^\/pro\/inscription\/3$/, () => {
    const R = REG();
    if (!R.photos.length) R.photos = [{ src: 'daria', main: true }];
    return {
      title: 'Inscription · profil',
      html: regShell(3, `<div class="stack-lg">
        <div class="panel"><div class="row-b"><h3>Photos</h3><span class="small muted">3 minimum</span></div>
          <div class="upl protect" id="regUpl" style="margin-top:12px">${R.photos.map((x, k) => `<div class="u${x.blur ? ' blurf' : ''}"><img src="${V.img(x.src, 's')}" alt="" style="${x.pos ? `object-position:${x.pos};transform:scale(${x.z || 1})` : ''}" draggable="false"><span class="facebox"></span>${x.main ? '<span class="badge goldfill main">Principale</span>' : ''}<div class="acts"><button data-act="reg-blur" data-k="${k}" title="Flouter le visage">${I('eye-off', 'sm')}</button></div><span class="wm">BD</span></div>`).join('')}<div class="u add" data-act="reg-add">${I('camera', 'lg')}<span>Ajouter</span></div></div>
          <p class="hint">${I('check', 'sm')} Filigrane ajouté · métadonnées GPS supprimées · modération avant publication.</p></div>
        <div class="panel"><h3>À propos</h3><div class="form-grid two" style="margin-top:12px">${V.field('Taille', { type: 'select', value: '169 cm', options: ['160 cm', '165 cm', '169 cm', '172 cm', '175 cm'] })}${V.field('Silhouette', { type: 'select', value: 'Mince', options: ['Mince', 'Sportive', 'Normale', 'Pulpeuse'] })}${V.field('Cheveux', { type: 'select', value: 'Châtain clair', options: ['Blond', 'Châtain clair', 'Brun', 'Noir', 'Roux'] })}${V.field('Yeux', { type: 'select', value: 'Vert', options: ['Bleu', 'Vert', 'Noisette', 'Marron'] })}${V.field('Origine (facultative)', { type: 'select', value: 'Non précisée', options: V.ORIGINS })}${V.field('Tabac', { type: 'select', value: 'Non', options: ['Non', 'Occasionnellement', 'Oui'] })}</div></div>
        <div class="panel"><h3>Tarifs</h3><div class="form-grid two" style="margin-top:12px">${V.field('1 heure', { value: '400', suffix: 'CHF' })}${V.field('2 heures', { value: '750', suffix: 'CHF' })}${V.field('Soirée (4 h)', { value: '1300', suffix: 'CHF' })}${V.field('Nuit', { value: '2200', suffix: 'CHF' })}</div><p class="hint">Fixés librement. Aucune commission.</p></div>
        <div class="panel"><h3>Services</h3><div class="chips" style="margin-top:12px">${Object.entries(V.SERVICES).map(([k, l], j) => `<button class="chip sm${[0, 1, 4, 6, 7].includes(j) ? ' on' : ''}" data-act="toggle-on"><span class="ck">${I('check', 'sm')}</span>${l}</button>`).join('')}</div></div>
        <div class="panel"><h3>Contacts</h3>${V.sw('wa', true, 'WhatsApp', '')}${V.sw('tel', true, 'Appels', '')}${V.sw('sms', false, 'SMS', '')}<div style="margin-top:10px">${V.field('Consignes pour les visiteurs', { type: 'textarea', value: 'Messages uniquement · réservation 1 h à l’avance', max: 200 })}</div></div>
      </div>`),
      after: (v) => v.firstElementChild.addEventListener('click', (e) => { const c = e.target.closest('[data-act="toggle-on"]'); if (c) c.classList.toggle('on'); }),
    };
  }, { mode: 'pro' });

  V.route(/^\/pro\/inscription\/4$/, () => {
    const R = REG();
    const fake = { id: 'daria', name: R.pseudo || 'Daria', age: 27, cat: 'femme', commune: 'eaux-vives', from: 400, mode: 'both', langs: [['fr', 'C1'], ['en', 'C2'], ['ru', 'C2']], status: { t: 'request', since: Date.now() }, photos: ['daria'], isNew: true, verif: { id: 0, media: 0, indep: 0 }, attrs: {}, accepts: [], services: [] };
    return {
      title: 'Inscription · publication',
      html: regShell(4, `<div class="grid-2" style="align-items:start">
        <div class="panel soft"><div class="eyebrow">Aperçu exact de votre carte</div><div style="margin-top:12px;max-width:280px">${V.card(fake, { noHide: true, noSeen: true }).replace(/data-act="(open|fav)"/g, '')}</div></div>
        <div class="stack">
          <div class="panel"><h3>Votre formule</h3><div class="stack" style="margin-top:12px">${V.PLANS.map((pl) => V.opt('plan', pl.id, `${pl.name} · ${pl.price} CHF / mois`, pl.pitch, { on: R.plan === pl.id })).join('')}</div>
            <div class="callout gold" style="margin-top:12px">${I('gift')}<span><b>2 mois offerts</b> avec le code LANCEMENT2M, sans carte bancaire. Premier prélèvement le ${D.fmtD(V.LAUNCH.until())}.</span></div></div>
          <div class="panel">${V.opt('consent', '1', 'Je consens à la publication de ces photos et informations', `Consentement horodaté, révocable à tout moment · ${new Date().toLocaleString('fr-CH', { dateStyle: 'short', timeStyle: 'short' })}`, { box: true, on: R.consent })}</div>
        </div></div>`, 'Envoyer en modération'),
      after: (v) => v.addEventListener('change', (e) => { if (e.target.name === 'plan') R.plan = e.target.value; if (e.target.name === 'consent') R.consent = e.target.checked; V.save(); }),
    };
  }, { mode: 'pro' });

  V.route(/^\/pro\/inscription\/fin$/, () => {
    const R = REG();
    const days = Array.from({ length: 6 }, (_, k) => D.addDays(k + 1)).filter((d) => d.getDay() !== 0);
    return {
      title: 'Candidature envoyée',
      html: `<div class="wrap" style="max-width:760px;padding-top:30px"><div class="success"><div class="ring">${I('check')}</div><h1 class="h2">Merci, ${esc(R.pseudo || 'Daria')}.</h1><p class="lead" style="margin:12px auto 0">Votre candidature est en modération. Votre profil sera en ligne après l’entretien, sous 48 heures ouvrées.</p></div>
        <div class="panel" style="margin-top:20px"><div class="timeline">
          <div class="tl-i ok"><b>Candidature reçue</b><span>${new Date().toLocaleString('fr-CH', { dateStyle: 'short', timeStyle: 'short' })}</span></div>
          <div class="tl-i ok"><b>Âge et identité vérifiés</b><span>27 ans · prestataire suisse</span></div>
          <div class="tl-i cur"><b>Entretien d’indépendance</b><span>${R.slot ? `${days[R.day || 0].toLocaleDateString('fr-CH', { weekday: 'long', day: 'numeric', month: 'long' })} à ${R.slot} · ${R.mode === 'visio' ? 'en visio' : 'en personne'}` : 'à planifier'}</span></div>
          <div class="tl-i"><b>Photos en modération</b><span>moins de 2 heures</span></div>
          <div class="tl-i"><b>Mise en ligne</b><span>avec votre consentement horodaté</span></div>
        </div></div>
        ${regStatus(R)}
        <div class="row wrapr" style="margin-top:20px;justify-content:center">${V.btn('Voir le dossier côté équipe', { href: '#/admin/candidature/c1', cls: 'dark', arrow: true })}${V.btn('Retour au site', { href: '#/', cls: 'ghost' })}</div></div>`,
      after: (v) => v.firstElementChild.addEventListener('click', (e) => {
        const b = e.target.closest('[data-rs]'); if (!b) return;
        const A2 = (V.L.adm2 = V.L.adm2 || {}); A2.cand = A2.cand || {};
        if (b.dataset.rs === 'sim') { A2.cand.c1 = { status: 'à compléter', msg: 'Merci de remplacer la photo 2 (floue) et de préciser vos langues.', at: Date.now() }; R.fix = ['Remplacer la photo 2 (floue)', 'Préciser vos langues et leur niveau']; V.save(); V.toast('Démonstration : l’équipe demande des corrections.', { icon: 'edit' }); return V.render(); }
        if (b.dataset.rs === 'send') { A2.cand.c1 = { status: 'en vérification', msg: 'Corrections reçues, merci.', at: Date.now() }; R.fix = []; V.save(); V.toast('Corrections envoyées : votre dossier repasse en vérification.', { icon: 'check' }); return V.render(); }
      }),
    };
  }, { mode: 'pro' });

  /* Statut du dossier vu par la candidate : lu depuis la décision de l'équipe (back-office) */
  const regStatus = (R) => {
    const c = (V.L.adm2 && V.L.adm2.cand && V.L.adm2.cand.c1) || null;
    if (c && c.status === 'à compléter') return `<div class="panel" style="margin-top:16px;border-color:var(--gold)"><div class="row-b"><h3>Corrections demandées</h3><span class="badge warn">À compléter</span></div><p class="small ink2" style="margin-top:6px">« ${esc(c.msg || '')} »</p>${(R.fix || []).length ? `<ul class="svc" style="margin-top:10px">${R.fix.map((x) => `<li>${I('edit')}${esc(x)}</li>`).join('')}</ul>` : ''}<div class="row wrapr" style="margin-top:12px">${V.btn('Corriger mon profil', { href: '#/pro/inscription/3', cls: 'sm', arrow: true })}${V.btn('J’ai corrigé, renvoyer', { cls: 'sm ghost', attrs: 'data-rs="send"' })}</div><p class="hint">Votre brouillon est conservé : rien n’est perdu.</p></div>`;
    if (c && c.status === 'accepté') return `<div class="callout ok" style="margin-top:16px">${I('check')}<span><b>Dossier accepté.</b> Choisissez votre formule pour la mise en ligne.</span></div>`;
    if (c && c.status === 'refusé') return `<div class="callout danger" style="margin-top:16px">${I('x')}<span><b>Dossier refusé.</b> ${esc(c.msg || '')}</span></div>`;
    return `<div class="panel soft" style="margin-top:16px"><div class="row-b wrapr"><span class="small ink2">${I('clock', 'sm')} Dossier en vérification. Si l’équipe demande une correction, vous la retrouverez ici, avec votre brouillon.</span>${V.btn('Démo : l’équipe demande une correction', { cls: 'xs ghost', attrs: 'data-rs="sim"' })}</div></div>`;
  };

  /* ---------- Actions de l'inscription ---------- */
  V.regNext = (n) => {
    const R = REG();
    if (n === 1 && !R.otp) return V.toast('Vérifiez d’abord votre numéro par SMS.', { icon: 'sms' });
    if (n === 2 && R.kyc < 3) return V.toast('Terminez la vérification d’identité.', { icon: 'id-card' });
    if (n === 2 && !R.slot) return V.toast('Choisissez un créneau pour l’entretien.', { icon: 'calendar' });
    if (n === 2 && !(R.cgu && R.ind)) return V.toast('Cochez les deux confirmations.', { icon: 'info' });
    if (n === 3 && R.photos.length < 3) return V.toast(`Ajoutez encore ${3 - R.photos.length} photo${3 - R.photos.length > 1 ? 's' : ''}.`, { icon: 'camera' });
    if (n === 4 && !R.consent) return V.toast('Le consentement explicite est nécessaire.', { icon: 'info' });
    location.hash = n === 4 ? '#/pro/inscription/fin' : '#/pro/inscription/' + (n + 1);
  };
  V.otpSend = async () => {
    const box = $('#otpBox'); if (!box) return;
    box.innerHTML = `<p class="small ink2" style="margin-bottom:10px">Code envoyé au +41 ${esc(REG().tel)}. Démo : saisie automatique.</p><div class="otp" id="otp">${Array.from({ length: 6 }, () => '<input inputmode="numeric" maxlength="1">').join('')}</div>`;
    const ins = $$('#otp input');
    for (const [k, c] of [...'482915'].entries()) { await V.wait(220); ins[k].value = c; ins[k].focus(); }
    await V.wait(300);
    $('#otp').classList.add('ok');
    REG().otp = true; V.save();
    box.insertAdjacentHTML('beforeend', `<div class="callout ok" style="margin-top:10px">${I('check')}<span>Numéro vérifié.</span></div>`);
  };
})(window.V);
