/* Velours : compte visiteur (facultatif, sans mot de passe) */
(function (V) {
  'use strict';
  const { $, $$, i: I, esc } = V;
  const D = V.date;

  const NAV = [['', 'layout', 'Tableau de bord'], ['preferences', 'settings', 'Préférences'], ['recherches', 'bookmark', 'Recherches enregistrées'], ['alertes', 'bell', 'Alertes'], ['activite', 'history', 'Activité'], ['donnees', 'lock', 'Données et sécurité']];
  const shell = (cur, inner) => {
    const a = V.L.account;
    return `<div class="wrap"><div class="app-shell">
      <aside class="side"><div class="who"><span class="avatar" style="width:46px;height:56px;border-radius:12px">${esc(a.pseudo[0] || 'V')}</span><div><b>${esc(a.pseudo)}</b><span>Compte discret · depuis le ${D.fmtShort(new Date(a.since))}</span></div></div>
        <nav>${NAV.map(([k, ic, l]) => `<a href="#/compte${k ? '/' + k : ''}" class="${cur === k ? 'on' : ''}">${I(ic)}${l}${k === 'alertes' && Object.keys(V.L.alerts).length ? `<span class="bdg">${Object.values(V.L.alerts).filter(Boolean).length}</span>` : ''}</a>`).join('')}
        <a href="#" data-act="logout">${I('logout')}Se déconnecter</a></nav></aside>
      <div><div class="subnav"><div class="chips scroll">${NAV.map(([k, , l]) => `<a class="chip sm${cur === k ? ' on' : ''}" href="#/compte${k ? '/' + k : ''}">${l}</a>`).join('')}</div></div>${inner}</div>
    </div></div>`;
  };
  const guard = () => { if (!V.L.account) { location.replace('#/compte/connexion'); return true; } return false; };
  const hello = () => { const h = new Date().getHours(); return h < 6 || h >= 18 ? 'Bonsoir' : 'Bonjour'; };

  /* ---------- Connexion / création (lien magique ou clé d'accès) ---------- */
  V.route(/^\/compte\/connexion$/, () => ({
    title: 'Mon compte',
    html: `<div class="wrap" style="max-width:1080px"><div class="grid-2" style="align-items:center;gap:30px;padding:30px 0 40px">
      <div><div class="eyebrow">Facultatif · sans mot de passe</div><h1 class="h1" style="margin-top:12px">Un compte, si vous le voulez</h1>
        <p class="lead">Sans compte, votre sélection s’efface à la fermeture du navigateur. Avec un compte discret, elle vous suit sur tous vos appareils, avec vos profils masqués, vos recherches et vos alertes de retour.</p>
        <ul class="svc" style="margin-top:18px;max-width:460px">${['Un pseudonyme et un e-mail, rien d’autre', 'Connexion par lien magique ou clé d’accès', 'Expéditeur et objets d’e-mails neutres', 'Suppression définitive en un geste'].map((x) => `<li>${I('check')}${x}</li>`).join('')}</ul></div>
      <div class="panel" style="padding:26px" id="login">
        <h2 class="h3">Créer un compte ou se connecter</h2>
        <form class="stack" style="margin-top:18px" data-form="login">
          ${V.field('Pseudonyme (visible par vous seul)', { name: 'pseudo', value: 'Marc' })}
          ${V.field('E-mail (un alias convient)', { name: 'email', type: 'email', value: 'marc.g@proton.me' })}
          ${V.btn('Recevoir un lien de connexion', { cls: 'block', attrs: 'data-magic', arrow: 'mail' })}
        </form>
        <div class="row" style="margin:16px 0;gap:12px"><hr class="divider" style="flex:1;margin:0"><span class="xs muted">ou</span><hr class="divider" style="flex:1;margin:0"></div>
        ${V.btn('Utiliser une clé d’accès (Face ID, empreinte)', { cls: 'ghost block', attrs: 'data-passkey', arrow: 'key' })}
        <p class="hint" style="margin-top:14px">${V.sel().length ? `Les <b>${V.sel().length}</b> profils de votre session actuelle seront ajoutés à votre compte.` : 'Votre sélection actuelle sera conservée.'}</p>
      </div></div></div>`,
    after: (v) => {
      const login = async (how) => {
        const f = $('[data-form="login"]', v);
        const pseudo = (f.pseudo.value || 'Visiteur').trim().slice(0, 24);
        const email = f.email.value.trim();
        const box = $('#login', v);
        if (how === 'magic') {
          box.innerHTML = `<div class="success"><div class="ring" style="border-color:var(--violet);color:var(--violet)">${I('mail')}</div><h3 class="h3">Lien envoyé</h3><p class="muted" style="margin-top:8px">Vérifiez la boîte <b>${esc(email.replace(/^(.).+(@.*)$/, '$1•••$2'))}</b>. Objet : « Votre lien de connexion », expéditeur neutre.</p><div class="steps-run" id="mrun"><div class="run"><i></i>Lien valable 15 minutes</div></div><p class="hint">Démo : le lien s’ouvre automatiquement.</p></div>`;
          await V.wait(1800);
        } else {
          box.innerHTML = `<div class="success"><div class="ring" style="border-color:var(--violet);color:var(--violet)">${I('scan-face', 'xl')}</div><h3 class="h3">Clé d’accès</h3><p class="muted" style="margin-top:8px">Confirmez avec Face ID ou votre empreinte…</p></div>`;
          await V.wait(1500);
        }
        V.L.account = { pseudo, email, since: Date.now(), sel: [...new Set(V.S.sel)], hidden: [...new Set(V.S.hidden)] };
        V.save();
        V.toast(`Bienvenue ${esc(pseudo)}. Votre sélection est synchronisée.`, { icon: 'check' });
        location.hash = '#/compte';
      };
      $('[data-magic]', v).onclick = (e) => { e.preventDefault(); login('magic'); };
      $('[data-passkey]', v).onclick = () => login('passkey');
    },
  }));

  /* ---------- Tableau de bord ---------- */
  V.route(/^\/compte$/, () => {
    if (guard()) return {};
    const a = V.L.account;
    const sel = V.sel().map(V.byId).filter(Boolean);
    const alerts = Object.entries(V.L.alerts).filter(([, on]) => on).map(([id]) => V.byId(id)).filter(Boolean);
    const kpi = (ic, l, v, s) => `<div class="kpi"><span class="l">${I(ic, 'sm')}${l}</span><span class="v">${v}</span><span class="xs muted">${s}</span></div>`;
    return {
      title: 'Mon compte',
      html: shell('', `<div class="dash-head"><div><div class="eyebrow">Compte client · discret</div><h1>${hello()}, ${esc(a.pseudo)}.</h1></div>${V.btn('Voir la galerie', { href: '#/profils', cls: 'sm dark', arrow: true })}</div>
        <div class="kpis">${kpi('heart', 'Favoris', sel.length, 'Synchronisés sur vos appareils')}${kpi('eye-off', 'Profils masqués', V.hidden().length, 'Retirés de votre galerie')}${kpi('bell', 'Alertes actives', alerts.length, 'Retour et nouvelle disponibilité')}${kpi('history', 'Vus récemment', V.L.recent.length, 'Effaçable à tout moment')}</div>
        <div class="grid-2" style="margin-top:14px">
          <div class="panel"><div class="row-b"><div><div class="eyebrow">Ma sélection</div><h3 style="margin-top:4px">Retrouver et comparer</h3></div><a class="link" href="#/profils">Galerie</a></div>
            <div class="list-rows" style="margin-top:8px">${sel.length ? sel.slice(0, 5).map((p) => `<div><img class="avatar sq" src="${V.img(p.photos[0], 's')}" alt=""><div class="sp" data-act="open" data-id="${p.id}" style="cursor:pointer"><b>${esc(p.name)}, ${V.ageShort(p)}</b><div class="small">${V.statusPill(p, true)}</div></div><button class="icon-btn" data-act="alert-toggle" data-id="${p.id}" aria-label="Alerte de retour" title="Me prévenir">${I(V.L.alerts[p.id] ? 'bell' : 'bell-off')}</button></div>`).join('') : '<p class="muted small" style="padding:10px 0">Aucun favori pour le moment.</p>'}</div>
            ${sel.length >= 2 ? V.btn('Comparer ma sélection', { act: 'compare', cls: 'sm block', arrow: 'columns' }) : ''}</div>
          <div class="panel"><div class="eyebrow">À surveiller</div><h3 style="margin-top:4px">Alertes de retour</h3>
            <div class="list-rows" style="margin-top:8px">${alerts.length ? alerts.map((p) => `<div><img class="avatar" src="${V.img(p.photos[0], 's')}" alt=""><div class="sp"><b>${esc(p.name)}</b><div class="small muted">${V.statusInfo(p).label}</div></div><span class="badge ok">Active</span></div>`).join('') : `<p class="muted small" style="padding:10px 0">Aucune alerte active. Touchez la cloche à côté d’un favori pour être prévenu de son retour.</p>`}</div>
            <div class="callout" style="margin-top:12px">${I('mail')}<span>Les alertes arrivent par e-mail (expéditeur neutre) ou en notification sur l’app installée.</span></div></div>
        </div>
        <div class="panel soft" style="margin-top:14px"><div class="row-b wrapr"><div><div class="eyebrow">Recherches enregistrées</div><h3 style="margin-top:4px">${V.L.searches.length || 'Aucune'} recherche${V.L.searches.length > 1 ? 's' : ''}</h3></div><a class="link" href="#/compte/recherches">Gérer</a></div>
          <div class="chips" style="margin-top:12px">${V.L.searches.map((s, k) => `<a class="chip" href="#/profils${s.qs}">${I('bookmark', 'sm')}${esc(s.name)}</a>`).join('') || '<span class="small muted">Dans la galerie, filtrez puis touchez « Enregistrer ».</span>'}</div></div>`),
    };
  });

  /* ---------- Préférences ---------- */
  V.route(/^\/compte\/preferences$/, () => {
    if (guard()) return {};
    const pr = V.L.prefs;
    return {
      title: 'Préférences',
      html: shell('preferences', `<div class="dash-head"><h1>Préférences</h1></div>
        <div class="grid-2"><div class="panel stack-lg">
          ${V.field('Langue de l’interface', { type: 'select', name: 'lang', value: pr.lang, options: [['fr', 'Français'], ['en', 'English'], ['es', 'Español'], ['pt', 'Português'], ['ru', 'Русский'], ['de', 'Deutsch (V1.1)'], ['it', 'Italiano (V1.1)'], ['ar', 'العربية (V1.1)']] })}
          ${V.field('Ville', { type: 'select', name: 'city', value: pr.city, options: ['Genève', 'Lausanne (bientôt)', 'Zurich (bientôt)'] })}
          <div><p class="small b" style="margin-bottom:8px">Catégorie par défaut de la galerie</p>${V.seg('defcat', V.CATS.map((c) => [c.id, c.label]), pr.cat || 'all')}</div>
          <div><p class="small b" style="margin-bottom:8px">Fréquence des alertes</p>${V.seg('freq', [['immediate', 'Immédiate'], ['daily', 'Quotidienne'], ['weekly', 'Hebdomadaire']], pr.freq)}</div>
        </div>
        <div class="panel">${V.sw('discreet', pr.discreet, 'Mode discret', 'Onglet nommé « Notes » et icône neutre')}${V.sw('mail', pr.mail !== false, 'Alertes par e-mail', 'Expéditeur neutre, aucune photo')}${V.sw('push', !!pr.push, 'Notifications sur l’app installée', 'Ajoutez Velours à l’écran d’accueil')}${V.sw('history', pr.history !== false, 'Enregistrer les profils vus', 'Liste « Vus récemment », effaçable')}</div></div>`),
      after: (v) => {
        v.addEventListener('change', (e) => {
          const t = e.target; if (!t.name) return;
          pr[t.name] = t.type === 'checkbox' ? t.checked : t.value; V.save();
          if (t.name === 'discreet') V.ui.discreet();
          if (t.name === 'push' && t.checked && 'Notification' in window) Notification.requestPermission().catch(() => {});
          if (t.name === 'lang' && t.value !== 'fr') V.toast('Démo en français. Les traductions arrivent avec la V1.', { icon: 'globe' });
          V.toast('Préférence enregistrée.', { ms: 1800 });
        });
        v.addEventListener('seg', (e) => { const k = e.target.dataset.seg === 'defcat' ? 'cat' : 'freq'; pr[k] = e.detail; V.save(); V.toast('Préférence enregistrée.', { ms: 1800 }); });
      },
    };
  });

  /* ---------- Recherches enregistrées ---------- */
  V.route(/^\/compte\/recherches$/, () => {
    if (guard()) return {};
    const S = V.L.searches;
    return {
      title: 'Recherches enregistrées',
      html: shell('recherches', `<div class="dash-head"><h1>Recherches enregistrées</h1>${V.btn('Nouvelle recherche', { href: '#/profils', cls: 'sm', arrow: 'plus' })}</div>
        <div class="panel">${S.length ? `<div class="list-rows">${S.map((s, k) => `<div><div class="sp"><b>${esc(s.name)}</b><div class="small muted">${esc(s.sum)} · ${V.filterList(Object.fromEntries(new URLSearchParams(s.qs.slice(1)))).length} profils aujourd’hui</div></div><a class="btn xs" href="#/profils${s.qs}"><span class="roll"><span>Lancer</span><span aria-hidden="true">Lancer</span></span></a><button class="icon-btn" data-act="del-search" data-k="${k}" aria-label="Supprimer">${I('trash')}</button></div>`).join('')}</div>` : V.empty('bookmark', 'Aucune recherche enregistrée', 'Dans la galerie, choisissez vos filtres puis touchez « Enregistrer » : vous n’aurez plus à tout ressaisir.', V.btn('Aller à la galerie', { href: '#/profils?dispo=now&lang=en', cls: 'sm' }))}</div>`),
    };
  });

  /* ---------- Alertes ---------- */
  V.route(/^\/compte\/alertes$/, () => {
    if (guard()) return {};
    const sel = V.sel().map(V.byId).filter(Boolean);
    return {
      title: 'Alertes',
      html: shell('alertes', `<div class="dash-head"><div><div class="eyebrow">Être averti en premier</div><h1>Alertes</h1></div></div>
        <div class="grid-2"><div class="panel"><h3>Retour d’une favorite</h3><p class="small muted" style="margin:6px 0 10px">Prévenu quand elle revient d’absence ou redevient disponible.</p>
          ${sel.length ? sel.map((p) => `<label class="switch-row"><img class="avatar" src="${V.img(p.photos[0], 's')}" alt=""><span class="t"><b>${esc(p.name)}</b><span>${V.statusInfo(p).label}</span></span><span class="switch"><input type="checkbox" data-alert="${p.id}" ${V.L.alerts[p.id] ? 'checked' : ''}><span></span></span></label>`).join('') : '<p class="muted small">Ajoutez des favoris pour créer des alertes.</p>'}</div>
        <div class="panel"><h3>Nouvelles arrivées</h3><p class="small muted" style="margin:6px 0 10px">Une nouvelle personne correspond à l’une de vos recherches enregistrées.</p>
          ${V.L.searches.length ? V.L.searches.map((s, k) => V.sw('srch' + k, !!s.alert, s.name, s.sum)).join('') : '<p class="muted small">Enregistrez une recherche pour l’activer.</p>'}
          <div class="callout gold" style="margin-top:12px">${I('info')}<span>Fréquence et canaux dans <a class="link" href="#/compte/preferences">Préférences</a>. Aucune alerte par SMS ni par WhatsApp.</span></div></div></div>`),
      after: (v) => v.addEventListener('change', (e) => {
        const t = e.target;
        if (t.dataset.alert) { V.L.alerts[t.dataset.alert] = t.checked; V.save(); V.toast(t.checked ? 'Alerte activée.' : 'Alerte désactivée.', { icon: 'bell', ms: 1800 }); }
        if (t.name && t.name.startsWith('srch')) { V.L.searches[+t.name.slice(4)].alert = t.checked; V.save(); V.toast('Alerte enregistrée.', { icon: 'bell', ms: 1800 }); }
      }),
    };
  });

  /* ---------- Activité ---------- */
  V.route(/^\/compte\/activite$/, () => {
    if (guard()) return {};
    const R = V.L.recent.map(V.byId).filter(Boolean);
    return {
      title: 'Activité',
      html: shell('activite', `<div class="dash-head"><h1>Vus récemment</h1>${R.length ? V.btn('Tout effacer', { act: 'clear-recent', cls: 'sm danger-ghost' }) : ''}</div>
        <div class="panel">${R.length ? `<div class="gallery">${R.map((p, k) => V.card(p, { i: k, noHide: true, noSeen: true })).join('')}</div>` : V.empty('history', 'Aucun profil vu récemment', 'Les fiches que vous ouvrez apparaissent ici. Vous pouvez désactiver cet historique dans les préférences.')}</div>`),
    };
  });

  /* ---------- Données et sécurité ---------- */
  V.route(/^\/compte\/donnees$/, () => {
    if (guard()) return {};
    return {
      title: 'Données et sécurité',
      html: shell('donnees', `<div class="dash-head"><h1>Données et sécurité</h1></div>
        <div class="grid-2"><div class="panel"><h3>Sessions actives</h3><div class="list-rows" style="margin-top:8px">
          <div><span class="avatar">${I('smartphone')}</span><div class="sp"><b>Cet appareil</b><div class="small muted">Genève · actif maintenant</div></div><span class="badge ok">Actuelle</span></div>
          <div><span class="avatar">${I('globe')}</span><div class="sp"><b>Ordinateur · Firefox</b><div class="small muted">Genève · il y a 3 jours</div></div><button class="btn xs ghost" data-act="kill-session"><span class="roll"><span>Déconnecter</span><span aria-hidden="true">Déconnecter</span></span></button></div></div></div>
        <div class="panel"><h3>Vos données</h3><p class="small ink2" style="margin:6px 0 14px">Hébergées en Suisse. Vous pouvez les exporter ou les supprimer définitivement, sans justification.</p>
          <div class="stack">${V.btn('Exporter mes données (JSON)', { act: 'export', cls: 'ghost block', arrow: 'download' })}${V.btn('Supprimer mon compte', { act: 'delete-account', cls: 'danger-ghost block', arrow: 'trash' })}</div>
          <p class="hint">La suppression est effective sous 30 jours, sauvegardes comprises.</p></div></div>`),
    };
  });

  V.ui.discreet = () => {
    const on = V.L.prefs.discreet;
    document.title = on ? 'Notes' : document.title.replace(/^Notes$/, 'Velours');
    const fav = $('link[rel="icon"]');
    if (fav) fav.href = on ? 'icons/neutral.svg' : 'icons/icon-192.png';
  };
})(window.V);
