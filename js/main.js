/* BD : démarrage, actions, clavier, installation */
(function (V) {
  'use strict';
  const { $, $$, i: I, esc } = V;
  const D = V.date;

  /* ---------- Mode discret : onglet « Notes » ---------- */
  const baseRender = V.renderBase;
  V.renderBase = async (...a) => { await baseRender(...a); if (V.L.prefs.discreet) document.title = 'Notes'; };

  /* ---------- Actions déclarées dans le HTML (data-act) ---------- */
  const act = {
    open: (el) => { const id = el.dataset.id; if (!id) return; if ($('#ov-fiche.on')) location.replace('#/profil/' + id); else location.hash = '#/profil/' + id; },
    goto: (el) => location.replace('#/profil/' + el.dataset.id),
    fav: (el) => V.ui.fav(el.dataset.id, el),
    hide: (el) => V.ui.hide(el.dataset.id),
    'hide-close': (el) => { const id = el.dataset.id; V.overlay.back(); setTimeout(() => V.ui.hide(id), 350); },
    unhide: (el) => { const h = V.hidden(); h.splice(h.indexOf(el.dataset.id), 1); V.save(); V.toast('Profil rétabli dans la galerie.', { icon: 'eye' }); V.render(); },
    session: () => V.ui.openSession(),
    stab: (el) => { V.ui.sessTab = el.dataset.v; V.ui.renderSession(); },
    compare: () => { if (V.sel().length < 2) return V.toast('Ajoutez au moins deux profils avec le cœur.', { icon: 'heart' }); V.sheet.close(true); location.hash = '#/comparer'; },
    'compare-with': (el) => { const id = el.dataset.id; if (!V.isSel(id)) V.ui.fav(id); if (V.sel().length < 2) return V.toast('Ajoutez un autre profil pour comparer.', { icon: 'columns' }); location.hash = '#/comparer'; },
    'cmp-out': (el) => { V.cmpOut.push(el.dataset.id); V.renderCmp(); },
    'cmp-in': (el) => { V.cmpOut = V.cmpOut.filter((x) => x !== el.dataset.id); V.renderCmp(); },
    'cmp-all': () => { V.cmpDiff = false; V.renderCmp(); },
    'close-ov': () => V.overlay.back(),
    slide: (el) => { const tr = $('#fTrack'); tr.scrollBy({ left: tr.clientWidth * +el.dataset.d, behavior: 'smooth' }); },
    zoom: () => { const tr = $('#fTrack'); const k = Math.round(tr.scrollLeft / tr.clientWidth); const img = $$('.f-slide img', tr)[k]; lightbox(img.src); },
    share: async (el) => { const p = V.byId(el.dataset.id); const url = location.href.split('#')[0] + '#/profil/' + p.id; try { if (navigator.share) await navigator.share({ title: 'BD', text: 'Un profil vérifié', url }); else { await navigator.clipboard.writeText(url); V.toast('Lien copié. Il ne contient aucun terme explicite.', { icon: 'link' }); } } catch (e) { /* partage annulé */ } },
    report: (el) => V.openReport(el.dataset.id),
    contact: (el) => V.openContact(el.dataset.id, el.dataset.ch || 'wa'),
    theme: (el) => V.ui.toggleTheme(el),
    menu: () => V.ui.menu(),
    lang: () => V.openLang(),
    'lang-set': (el) => V.setLang(el.dataset.l),
    feedback: (el) => V.openFeedback(el.dataset.id),
    'ext-link': (el, e) => { e.preventDefault(); V.toast(`Lien externe (${el.dataset.h}) : s’ouvrirait dans un nouvel onglet. BD n’intègre aucun contenu de ce site.`, { icon: 'link', ms: 4200 }); },
    'demo-news': () => { V.ui.menu(false); V.ui.demoNews(); },
    panic: () => location.replace('https://www.google.ch'),
    filters: (el) => V.openFilters(el.dataset.g),
    sort: () => V.openSort(),
    search: () => V.openSearch(),
    'focus-search': (el, e) => { e.preventDefault(); if (V.parse().path !== '/profils') { location.hash = '#/profils'; setTimeout(V.openSearch, 450); } else V.openSearch(); },
    unfilter: (el) => { const { q } = V.parse(); const k = el.dataset.k; const v = el.dataset.v; const patch = {}; patch[k] = v ? (q[k] || '').split(',').filter((x) => x !== v).join(',') : ''; V.setQ(patch); },
    'clear-filters': () => V.setQ({ dispo: '', lang: '', mode: '', svc: '', commune: '', origin: '', hair: '', sil: '', acc: '', age: '', prix: '', nosmoke: '', recent: '', video: '', face: '', q: '' }),
    'only-changes': () => V.setQ({ chg: '1' }, false),
    'exit-changes': () => V.setQ({ chg: '' }),
    'save-search': () => saveSearch(),
    'hero-next': () => V.heroStep && V.heroStep(),
    'hero-open': () => { const cur = $('#hero .slide.cur'); if (cur && cur.dataset.id) location.hash = '#/profil/' + cur.dataset.id; },
    'scroll-tarifs': (el, e) => { e.preventDefault(); $('#tarifs').scrollIntoView({ behavior: 'smooth' }); },
    install: () => install(),
    logout: (el, e) => { e.preventDefault(); V.L.account = null; V.save(); V.toast('Déconnecté. Votre sélection de session reste sur cet appareil jusqu’à la fermeture du navigateur.', { icon: 'logout', ms: 4200 }); location.hash = '#/'; },
    'alert-toggle': (el) => { const id = el.dataset.id; V.L.alerts[id] = !V.L.alerts[id]; V.save(); V.toast(V.L.alerts[id] ? `Alerte activée : vous serez prévenu du retour de ${V.byId(id).name}.` : 'Alerte désactivée.', { icon: 'bell' }); V.render(); },
    'del-search': (el) => { V.L.searches.splice(+el.dataset.k, 1); V.save(); V.render(); },
    'clear-recent': () => { V.L.recent = []; V.save(); V.toast('Historique effacé.', { icon: 'trash' }); V.render(); },
    'kill-session': () => V.toast('Session déconnectée sur cet appareil.', { icon: 'logout' }),
    export: () => download('bd-mes-donnees.json', JSON.stringify({ compte: { pseudo: V.L.account.pseudo, email: V.L.account.email, depuis: new Date(V.L.account.since).toISOString() }, selection: V.sel(), masques: V.hidden(), recherches: V.L.searches, alertes: V.L.alerts, preferences: V.L.prefs, vusRecemment: V.L.recent, hebergement: 'Suisse' }, null, 2), 'application/json'),
    'delete-account': async () => { if (await V.confirm({ title: 'Supprimer mon compte', text: 'Sélection, recherches, alertes et historique seront supprimés définitivement, sauvegardes comprises, sous 30 jours.', ok: 'Supprimer', danger: true })) { V.L.account = null; V.L.searches = []; V.L.alerts = {}; V.L.recent = []; V.save(); V.toast('Compte supprimé.', { icon: 'trash' }); location.hash = '#/'; } },
    /* espace pro */
    'pro-st': (el) => { const v = el.dataset.v; const st = v === 'tonight' ? { t: 'tonight', at: '21 h' } : { t: v }; V.L.pro.statuses.alma = Object.assign({ since: Date.now() }, st); V.save(); V.toast(`Statut publié : ${V.statusInfo(V.byId('alma')).label}. Visible en moins de 60 s.`, { icon: 'zap' }); V.render(); },
    'pro-hide': () => V.proHide(true),
    'pro-unhide': () => V.proHide(false),
    'pro-save': async (el) => { el.classList.add('loading'); await V.wait(900); el.classList.remove('loading'); V.toast('Enregistré. Tarifs publiés ; présentation et services en modération (moins de 2 h).', { icon: 'check', ms: 4200 }); },
    'ph-add': async () => { const ph = V.L.pro.photos; if (ph.length >= 20) return V.toast('Limite de 20 photos atteinte.', { icon: 'info' }); ph.push({ src: ph.length % 2 ? 'alma' : 'alma-2', st: 'mod' }); V.save(); V.render(); await V.wait(60); const u = $$('#upl .u:not(.add)').pop(); if (u) u.classList.add('uploading'); V.toast('Photo ajoutée : filigrane appliqué, métadonnées supprimées, en modération.', { icon: 'upload', ms: 4200 }); },
    'ph-main': (el) => { V.L.pro.photos.forEach((p, k) => { p.main = k === +el.dataset.k; }); V.save(); V.render(); V.toast('Photo principale mise à jour.', { icon: 'star' }); },
    'ph-blur': (el) => { const p = V.L.pro.photos[+el.dataset.k]; p.blur = !p.blur; V.save(); el.closest('.u').classList.toggle('blurf', p.blur); V.toast(p.blur ? 'Visage flouté sur cette photo.' : 'Floutage retiré.', { icon: 'eye-off', ms: 2200 }); },
    'ph-del': async (el) => { if (V.L.pro.photos.length <= 1) return V.toast('Gardez au moins une photo.', { icon: 'info' }); if (await V.confirm({ title: 'Supprimer cette photo', text: 'Elle sera retirée du site et de nos serveurs.', ok: 'Supprimer', danger: true })) { V.L.pro.photos.splice(+el.dataset.k, 1); V.save(); V.render(); } },
    'abs-add': () => { const f = $('input[name="from"]').value, t = $('input[name="to"]').value; const m = ($('input[name="amode"]:checked') || {}).value || 'visible'; if (!f || !t || t < f) return V.toast('Vérifiez les dates.', { icon: 'calendar' }); V.L.pro.absences.push({ from: f, to: t, mode: m }); V.save(); V.toast('Absence programmée. Votre abonnement continue pendant cette période.', { icon: 'calendar', ms: 4200 }); V.render(); },
    'abs-del': (el) => { V.L.pro.absences.splice(+el.dataset.k, 1); V.save(); V.render(); },
    'duo-invite': (el) => { V.L.pro.invite = { id: el.dataset.id, name: V.byId(el.dataset.id).name, ok: false }; V.save(); V.toast(`Invitation envoyée à ${V.byId(el.dataset.id).name}.`, { icon: 'users' }); V.render(); },
    'duo-accept': () => { V.L.pro.invite.ok = true; V.save(); V.toast('Invitation acceptée : profil duo en modération.', { icon: 'check' }); V.render(); },
    'duo-quit': async () => { if (await V.confirm({ title: 'Quitter le duo Alma & Jade', text: 'Le profil commun sera dépublié immédiatement. Vos profils individuels restent en ligne.', ok: 'Quitter le duo', danger: true })) V.toast('Démo : le profil duo serait dépublié (non appliqué dans la maquette).', { icon: 'info', ms: 4000 }); },
    'feat-day': (el) => { const k = +el.dataset.k; const a = V.L.pro.featDays = V.L.pro.featDays || []; const i = a.indexOf(k); i >= 0 ? a.splice(i, 1) : a.push(k); V.save(); el.classList.toggle('on'); V.upFeat($('#view')); },
    'feat-pay': () => featPay(),
    plan: async (el) => { const pl = V.PLANS.find((p) => p.id === el.dataset.id); if (await V.confirm({ title: `Passer à ${pl.name}`, text: `${pl.price} CHF / mois à partir du ${D.fmtD(D.addDays(V.PRO.nextBill))}. Sans engagement.`, ok: 'Confirmer' })) { V.L.pro.plan = pl.id; V.save(); V.toast(`Formule ${pl.name} activée au prochain cycle.`, { icon: 'check' }); V.render(); } },
    'cancel-sub': () => cancelSub(),
    uncancel: () => { V.L.pro.cancelAt = null; V.save(); V.toast('Résiliation annulée.', { icon: 'check' }); V.render(); },
    invoice: (el) => invoice(el.dataset.n),
    'copy-ref': async () => { try { await navigator.clipboard.writeText(V.PRO.referral); } catch (e) { /* presse-papiers indisponible */ } V.toast('Code copié : ' + V.PRO.referral, { icon: 'copy' }); },
    'share-ref': async () => { try { if (navigator.share) await navigator.share({ title: 'BD', text: `Rejoins BD avec mon code ${V.PRO.referral} : un mois offert.` }); else V.toast('Démo : partage du code ' + V.PRO.referral, { icon: 'share' }); } catch (e) { /* annulé */ } },
    'pro-msg': (el) => { const m = V.PRO.messages[+el.dataset.k]; V.L.pro.read = [...new Set([...(V.L.pro.read || []), m.subj])]; V.save(); V.sheet.open({ title: esc(m.subj), body: `<p class="small muted">${esc(m.from)} · ${m.d === 0 ? 'aujourd’hui' : D.fmtD(D.addDays(m.d))}</p><p style="margin-top:12px" class="ink2">${esc(m.body)}</p>`, onClose: () => V.render() }); },
    'leak-takedown': async () => { const sh = V.sheet.open({ title: 'Demande de retrait', body: `<p class="ink2">Nous envoyons au site une demande fondée sur votre droit à l’image et sur le droit d’auteur de la photo. Vous restez anonyme.</p><div class="panel soft" style="margin-top:12px;font-size:14px;line-height:1.6"><b>Objet : retrait d’une image utilisée sans autorisation</b><br>Madame, Monsieur, l’image publiée à l’adresse indiquée est utilisée sans le consentement de la personne représentée ni de l’ayant droit. Nous vous prions de la retirer sous 7 jours…</div>`, foot: V.btn('Envoyer la demande', { cls: 'sm block', attrs: 'data-send' }) }); $('[data-send]', sh).onclick = async (e) => { e.currentTarget.classList.add('loading'); await V.wait(900); V.L.pro.leakDone = Date.now(); V.save(); V.sheet.close(); V.toast('Demande envoyée. Relance automatique sous 7 jours.', { icon: 'check' }); V.render(); }; },
    'leak-ignore': () => { V.L.pro.leakDone = Date.now(); V.save(); V.toast('Alerte classée.', { icon: 'check' }); V.render(); },
    'selfie-check': () => selfieCheck(),
    'pro-delete': async () => { if (await V.confirm({ title: 'Supprimer mon profil', text: 'Vous avez 7 jours pour changer d’avis. Ensuite, profil et photos sont supprimés définitivement.', ok: 'Supprimer', danger: true })) V.toast('Démo : suppression programmée dans 7 jours (non appliquée).', { icon: 'trash', ms: 4000 }); },
    /* inscription */
    'reg-next': (el) => V.regNext(+el.dataset.id),
    'otp-send': () => V.otpSend(),
    'kyc-scan': () => V.kycRun(),
    'reg-add': () => { const R = V.L.reg; const crops = [{ pos: 'center 12%', z: 1.45 }, { pos: 'center 72%', z: 1.25 }, { pos: '30% 30%', z: 1.6 }, { pos: '70% 40%', z: 1.3 }]; if (R.photos.length >= 5) return V.toast('Assez pour la démo : 5 photos.', { icon: 'info' }); R.photos.push(Object.assign({ src: 'daria' }, crops[(R.photos.length - 1) % crops.length])); V.save(); V.render(); setTimeout(() => { const u = $$('#regUpl .u:not(.add)').pop(); if (u) u.classList.add('uploading'); }, 40); },
    'reg-blur': (el) => { const p = V.L.reg.photos[+el.dataset.k]; p.blur = !p.blur; V.save(); el.closest('.u').classList.toggle('blurf', p.blur); },
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.closest('.is-disabled')) return;
    const fn = act[el.dataset.act];
    if (!fn) return;
    if (el.tagName === 'A' && !['focus-search', 'scroll-tarifs', 'logout'].includes(el.dataset.act)) e.preventDefault();
    if (el.tagName === 'BUTTON') e.preventDefault();
    fn(el, e);
  });
  document.addEventListener('contextmenu', (e) => { if (e.target.tagName === 'IMG' && e.target.closest('.protect, .card, .f-media, .hero, .upl')) e.preventDefault(); });

  /* ---------- Feuilles spécifiques ---------- */
  function saveSearch() {
    const { q } = V.parse();
    const sum = [q.cat && (V.CATS.find((c) => c.id === q.cat) || {}).label, q.dispo && 'disponibilité', q.lang && q.lang.split(',').map((l) => V.LANGS[l]).join(' / '), q.mode && (q.mode === 'incall' ? 'reçoit' : 'se déplace'), q.commune && V.communeTxt(q.commune.split(',')[0]), q.origin].filter(Boolean).join(' · ') || 'Tous les profils';
    const sh = V.sheet.open({ title: 'Enregistrer la recherche', body: `${V.field('Nom de la recherche', { value: sum.split(' · ').slice(0, 2).join(', ') })}<p class="hint">${esc(sum)}</p>${V.sw('alert', true, 'M’alerter des nouvelles arrivées', 'Par e-mail, expéditeur neutre')}`, foot: V.btn('Enregistrer', { cls: 'sm block', attrs: 'data-ok' }) });
    $('[data-ok]', sh).onclick = () => { V.L.searches.push({ name: $('input', sh).value || sum, sum, qs: V.qs(q), alert: $('input[name="alert"]', sh).checked }); V.save(); V.sheet.close(); V.toast('Recherche enregistrée dans votre compte.', { icon: 'bookmark', action: 'Voir', fn: () => { location.hash = '#/compte/recherches'; } }); };
  }
  function featPay() {
    const n = (V.L.pro.featDays || []).length;
    if (!n) return V.toast('Choisissez au moins un jour.', { icon: 'calendar' });
    const paid = Math.max(0, n - 1); const tot = paid >= 7 ? V.FEATURED.perWeek + (paid - 7) * V.FEATURED.perDay : paid * V.FEATURED.perDay;
    const sh = V.sheet.open({ title: 'Confirmer la mise en avant', body: `<dl class="kv"><dt>Jours</dt><dd>${n} (dont 1 inclus)</dd><dt>Total</dt><dd>${V.chf(tot)}</dd><dt>Paiement</dt><dd>${(V.L.pro.pay || 'qr') === 'qr' ? 'QR-facture' : V.L.pro.pay === 'card' ? 'Carte' : 'TWINT'}</dd></dl><p class="hint">Montant fixe, indépendant du nombre de contacts.</p>`, foot: V.btn(tot ? 'Payer ' + V.chf(tot) : 'Confirmer', { cls: 'sm block', attrs: 'data-ok', arrow: 'lock' }) });
    $('[data-ok]', sh).onclick = async (e) => { e.currentTarget.classList.add('loading'); await V.wait(1300); $('.sh-body', sh).innerHTML = `<div class="success"><div class="ring">${I('check')}</div><h3 class="h3">Réservé</h3><p class="muted" style="margin-top:6px">Votre encart apparaîtra les jours choisis, étiqueté « Mise en avant ».</p></div>`; $('.sh-foot', sh).remove(); V.L.pro.featDays = []; V.save(); setTimeout(() => { V.sheet.close(); V.render(); }, 1500); };
  }
  function cancelSub() {
    const at = D.addDays(V.PRO.nextBill);
    const sh = V.sheet.open({ title: 'Résilier mon abonnement', body: `<p class="ink2">La résiliation prend effet le <b>${D.fmtD(at)}</b>, à la fin de la période déjà payée. Votre profil sera masqué à cette date. Aucun remboursement au prorata, aucun frais.</p>${V.sw('keep', true, 'Conserver mon profil 6 mois', 'Reprise possible sans nouvelle inscription si vos contrôles sont encore valides')}`, foot: `<button class="btn ghost sm" data-no style="flex:1">Garder mon abonnement</button>${V.btn('Résilier', { cls: 'danger sm', attrs: 'data-ok style="flex:1"' })}` });
    $('[data-no]', sh).onclick = () => V.sheet.close();
    $('[data-ok]', sh).onclick = () => { V.L.pro.cancelAt = at.getTime(); V.L.pro.keep = $('input[name="keep"]', sh).checked; V.save(); V.sheet.close(); V.toast('Résiliation programmée.', { icon: 'check' }); V.render(); };
  }
  function invoice(n) {
    const f = V.PRO.invoices.find((x) => x.n === n);
    const html = `<!doctype html><meta charset="utf-8"><title>Facture ${f.n}</title><style>body{font:15px/1.6 system-ui;max-width:680px;margin:40px auto;padding:0 20px;color:#120d18}h1{font-family:Georgia,serif;font-weight:400}table{width:100%;border-collapse:collapse;margin-top:20px}td,th{padding:10px;border-bottom:1px solid #ddd;text-align:left}.r{text-align:right}.muted{color:#777}</style><h1>BD <span class="muted" style="font-size:16px">(nom de travail)</span></h1><p class="muted">Genève · facture de démonstration</p><p><b>Facture ${f.n}</b><br>Date : ${D.fmtShort(D.addDays(f.d))}<br>Client : Alma (compte pro)</p><table><tr><th>Libellé</th><th class="r">Montant</th></tr><tr><td>${f.label}</td><td class="r">${f.amt ? 'CHF ' + f.amt.toFixed(2) : 'Offert'}</td></tr><tr><th>Total</th><th class="r">${f.amt ? 'CHF ' + f.amt.toFixed(2) : 'CHF 0.00'}</th></tr></table><p class="muted" style="margin-top:30px">Forfait sans commission sur les rendez-vous. Libellé bancaire : VLR SERVICES GENEVE.</p><script>print()<\/script>`;
    const w = window.open(URL.createObjectURL(new Blob([html], { type: 'text/html' })), '_blank');
    if (!w) V.toast('Autorisez les fenêtres pour télécharger la facture.', { icon: 'info' });
  }
  async function selfieCheck() {
    const sh = V.sheet.open({ title: 'Selfie de contrôle', body: `<div class="selfie"><svg viewBox="0 0 220 220"><circle class="trk" cx="110" cy="110" r="105"/><circle class="val" id="ring2" cx="110" cy="110" r="105"/></svg><div class="face"><img src="${V.img('alma-2', 's')}" alt="" style="object-position:center 18%"></div></div><p style="text-align:center;margin-top:14px" class="b" id="sl">Regardez l’écran, puis tournez lentement la tête</p><div class="steps-run" id="srun" style="display:none">${['Vivacité confirmée', 'Comparaison avec vos 3 photos publiées', 'Concordance 97 %'].map((t) => `<div><i></i>${t}</div>`).join('')}</div>` });
    const ring = $('#ring2', sh);
    for (let k = 1; k <= 20; k++) { await V.wait(100); if (ring) ring.style.strokeDashoffset = 660 - (660 * k) / 20; }
    $('#sl', sh).textContent = 'Analyse…'; $('#srun', sh).style.display = '';
    for (const r of $$('#srun div', sh)) { r.classList.add('run'); await V.wait(500); r.classList.remove('run'); r.classList.add('ok'); }
    V.L.pro.mediaDone = Date.now(); V.byId('alma').verif.media = 0; V.save();
    $('#sl', sh).textContent = 'Contrôle validé · badge « Photos récentes » actif';
    setTimeout(() => { V.sheet.close(); V.render(); V.toast('Date du contrôle mise à jour sur votre fiche publique.', { icon: 'badge-check' }); }, 1300);
  }
  function lightbox(src) {
    const lb = document.createElement('div'); lb.className = 'lightbox protect';
    lb.innerHTML = `<img src="${src}" alt="" draggable="false"><span class="wm">BD · photo vérifiée</span><button class="icon-btn" aria-label="Fermer">${I('x')}</button>`;
    document.body.appendChild(lb); void lb.offsetWidth; lb.classList.add('on');
    let z = false; const img = $('img', lb);
    img.ondblclick = img.onclick = () => { z = !z; img.style.transform = z ? 'scale(2)' : ''; };
    $('button', lb).onclick = () => { lb.classList.remove('on'); setTimeout(() => lb.remove(), 350); };
    V.lb = lb;
  }
  function download(name, content, type) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    V.toast(`Fichier « ${name} » téléchargé.`, { icon: 'download' });
  }

  /* ---------- Installation (PWA) ---------- */
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); V.deferredPrompt = e; });
  function install() {
    if (V.deferredPrompt) { V.deferredPrompt.prompt(); V.deferredPrompt.userChoice.finally(() => { V.deferredPrompt = null; }); return; }
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    V.sheet.open({ title: standalone ? 'Déjà installée' : 'Installer l’application', body: standalone ? '<p class="ink2">BD est déjà installée sur cet appareil.</p>' : `<div class="stack"><div class="panel soft"><b>iPhone · Safari</b><p class="small ink2" style="margin-top:6px">Touchez ${I('share', 'sm')} Partager, puis « Sur l’écran d’accueil ».</p></div><div class="panel soft"><b>Android · Chrome</b><p class="small ink2" style="margin-top:6px">Menu ⋮, puis « Installer l’application ».</p></div><p class="hint">L’app s’ouvre en plein écran, fonctionne hors connexion pour les pages déjà vues et peut recevoir vos alertes.</p></div>` });
  }

  /* ---------- Clavier : Échap ferme, deux fois = sortie rapide ---------- */
  let lastEsc = 0;
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (V.lb && document.body.contains(V.lb)) { V.lb.querySelector('button').click(); return; }
    if (V.sheet.el) { V.sheet.close(); return; }
    if (V.overlay.any()) { V.overlay.back(); return; }
    if (document.body.classList.contains('menu-open')) { V.ui.menu(false); return; }
    if (Date.now() - lastEsc < 600) location.replace('https://www.google.ch');
    lastEsc = Date.now();
  });

  /* ---------- Navigation ---------- */
  V.navDepth = 0;
  // hors ligne, l'app continue avec la dernière version gardée par le service worker
  window.addEventListener('offline', () => V.toast('Hors ligne. Vous voyez la dernière version enregistrée sur cet appareil.', { ms: 5000 }));
  window.addEventListener('online', () => V.toast('Connexion rétablie.', { ms: 2200 }));
  window.addEventListener('hashchange', () => {
    V.navDepth++;
    V.sheet.close(true);
    if (document.body.classList.contains('menu-open')) V.ui.menu(false);
    V.render();
  });
  // barre du haut : pilule dès 90 px ; barre du haut et onglets se cachent quand on descend, reviennent quand on remonte
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY, tb = $('#topbar'), bar = $('#tabbar'), b = document.body;
    tb.classList.toggle('scrolled', y > 8);
    tb.classList.toggle('pill', y > 90);
    if (Math.abs(y - lastY) < 8 || b.classList.contains('menu-open')) return;
    const hide = y > lastY && y > 380;
    tb.classList.toggle('hid', hide); bar.classList.toggle('away', hide); b.classList.toggle('nav-hid', hide);
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { $$('.seg').forEach(V.ui.segThumb); V.ui.chrome(V.parse().path, V.mode); });

  /* ---------- Démarrage : préchargement, thème, porte d'âge ---------- */
  async function boot() {
    if (location.search.includes('capture')) document.documentElement.classList.add('capture'); // captures d'écran : sans animation
    const qt = (location.search.match(/[?&]theme=(dark|light)/) || [])[1];
    V.ui.applyTheme(qt || V.L.theme || 'light');
    $('#menu').innerHTML = V.ui.menuHTML();
    await V.render();
    V.booted = true;
    V.ui.startEvents();
    if (V.L.prefs.discreet) V.ui.discreet();
    const pre = $('#pre');
    // ?direct : lien de présentation qui saute le préchargement et l'avertissement d'âge
    const direct = location.search.includes('direct');
    if (direct) V.L.ageOk = V.L.ageOk || Date.now();
    await V.wait(direct ? 0 : 2500);
    if (location.search.includes('capture')) pre.remove(); // captures d'écran : sans écran de démarrage
    else { pre.classList.add('go'); setTimeout(() => pre.remove(), 1200); }
    const okAge = V.L.ageOk && Date.now() - V.L.ageOk < 30 * D.DAY;
    if (!okAge) gate(); else { document.body.classList.remove('lock'); if (!location.search.includes('capture')) setTimeout(cookieNote, 1500); } // ?capture : captures d'écran sans le bandeau cookies
  }
  /* Porte d'âge : le site reste visible derrière un flou, avec les conditions et la question oui / non */
  function gate() {
    const g = document.createElement('div');
    g.className = 'gate'; g.setAttribute('role', 'dialog'); g.setAttribute('aria-modal', 'true'); g.setAttribute('aria-labelledby', 'gateT');
    const cg = [
      'L’accès est réservé aux personnes majeures. En entrant, vous confirmez avoir 18 ans révolus.',
      'BD met en relation des adultes. Il ne fournit aucune prestation et ne prend aucune commission sur les rendez-vous.',
      'Les photos peuvent être suggestives. Aucun contenu pornographique n’est publié.',
      'Les consignes et les limites indiquées sur chaque fiche s’appliquent. Un manquement peut être signalé et entraîner une exclusion.',
      'Aucun cookie de suivi. Votre réponse est gardée 30 jours sur cet appareil.',
      'Droit suisse applicable, for à Genève.',
    ];
    g.innerHTML = `<div class="gate-card">
      <img class="gate-logo" src="img/logo-b-s.webp" alt="" width="101" height="112">
      <h1 id="gateT">Réservé aux adultes</h1>
      <p>Ce site présente des profils de personnes majeures qui proposent des services pour adultes à Genève.</p>
      <div class="gate-cg" tabindex="0" aria-label="Conditions générales d’utilisation"><b>Conditions générales d’utilisation</b><ol>${cg.map((x) => `<li>${x}</li>`).join('')}</ol></div>
      <p class="gate-q">Avez-vous 18 ans ou plus ?</p>
      <div class="gate-btns">${V.btn('Oui, j’ai 18 ans ou plus', { cls: 'gold block', attrs: 'data-enter', arrow: true })}${V.btn('Non, quitter le site', { cls: 'ghost block', attrs: 'data-quit style="--bf:#f1ecf3;--bh:#f1ecf3;--bhf:#17131a;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25)"' })}</div>
      <p class="legal">En entrant, vous acceptez ces conditions. Maquette : profils fictifs, aucun contact réel.</p>
      <div class="chips">${['Français', 'English', 'Español', 'Português', 'Русский'].map((l, k) => `<button class="m-chip${k ? '' : ' on'}" data-lang="${k}">${l}</button>`).join('')}</div>
    </div>`;
    document.body.appendChild(g); document.body.classList.add('lock');
    $$('[data-lang]', g).forEach((b) => { b.onclick = () => { $$('[data-lang]', g).forEach((x) => x.classList.toggle('on', x === b)); if (b.dataset.lang !== '0') V.toast('Démo en français. Les autres langues arrivent avec la V1.', { icon: 'globe' }); }; });
    $('[data-enter]', g).onclick = () => { V.L.ageOk = Date.now(); V.save(); g.classList.add('out'); document.body.classList.remove('lock'); setTimeout(() => g.remove(), 800); setTimeout(cookieNote, 1400); };
    $('[data-quit]', g).onclick = () => location.replace('https://www.google.ch');
  }

  // bandeau de confidentialité, une seule fois (pas sur les liens de présentation ?direct)
  function cookieNote() {
    if (V.L.cookieOk || location.search.includes('direct')) return;
    const c = document.createElement('div');
    c.className = 'cookie'; c.setAttribute('role', 'status');
    c.innerHTML = `<span class="sp"><b>Aucun cookie de suivi.</b> Votre sélection et vos préférences restent sur cet appareil.</span>${V.btn('Compris', { cls: 'sm dark' })}`;
    document.body.appendChild(c);
    $('.btn', c).onclick = () => { V.L.cookieOk = 1; V.save(); c.classList.add('out'); setTimeout(() => c.remove(), 400); };
  }

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { /* hors ligne indisponible : l'app fonctionne quand même */ }));
  }
  boot();
})(window.V);
