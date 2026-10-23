/* BD : pages et fenêtres ajoutées au site public.
   Sélecteur des 8 langues, page d'accueil en arabe (de droite à gauche), pages « Ouverture prochainement »
   par ville avec préinscription des professionnelles, retour privé à BD (remplace les avis publics). */
(function (V) {
  'use strict';
  const { $, $$, i: I, esc } = V;

  /* ---------------------------------------------------------------- langues */
  V.openLang = () => {
    const sh = V.sheet.open({
      title: 'Langue du site',
      body: `<p class="small muted" style="margin-bottom:12px">Le site existe dans 8 langues. Dans la maquette, l’interface reste en français ; la page d’accueil en arabe montre l’affichage de droite à gauche.</p>
        <div class="lang-grid">${V.LANG8.map(([c, l]) => `<button type="button" class="lang-o${c === 'fr' ? ' on' : ''}" data-l="${c}"${c === 'ar' ? ' dir="rtl" lang="ar"' : ''}>${V.flag(c)}<b>${l}</b>${c === 'ar' ? '<small>aperçu disponible</small>' : c === 'fr' ? '<small>langue actuelle</small>' : ''}</button>`).join('')}</div>`,
    });
    $$('.lang-o', sh).forEach((b) => { b.onclick = () => { V.sheet.close(); V.setLang(b.dataset.l); }; });
  };
  V.setLang = (l) => {
    if (l === 'ar') { location.hash = '#/ar'; return; }
    if (l === 'fr') { if (V.parse().path === '/ar') location.hash = '#/'; return; }
    const name = (V.LANG8.find(([c]) => c === l) || [, l])[1];
    V.toast(`Démonstration : en production, tout le site est traduit en ${name}. Aperçu de l’affichage de droite à gauche : choisissez العربية.`, { icon: 'globe', ms: 5000 });
  };

  /* ---------------------------------------------------------------- page d'accueil en arabe */
  const AR_ST = { now: 'متاحة الآن', soon: 'متاحة اليوم أو غدًا', req: 'عند الطلب', busy: 'مشغولة', away: 'غائبة حاليًا' };
  V.route(/^\/ar$/, () => {
    const L = V.PROFILES.filter((p) => V.visible(p));
    const nowN = L.filter((p) => V.statusOf(p).t === 'now').length;
    return {
      title: 'العربية',
      html: `<div class="ar-note"><div class="wrap row-b wrapr">${I('globe', 'sm')}<span class="sp">Démonstration de la version arabe : la page s’affiche de droite à gauche. En production, tout le site existe dans les 8 langues.</span>${V.btn('Revenir en français', { href: '#/', cls: 'xs ghost' })}</div></div>
      <div class="ar-page" dir="rtl" lang="ar">
        <section class="ar-hero"><div class="wrap">
          <div class="ar-eyebrow"><i class="dot-live"></i>جنيف · ملفات موثّقة</div>
          <h1>مرافِقات موثّقات في جنيف، <em>متاحات هذا المساء.</em></h1>
          <p>ملفات خاضعة للتحقق، توفّر يُحدَّث لحظيًا وتواصل مباشر. بلا حساب، بلا وسيط، وبسرية تامة.</p>
          <div class="ar-cta">${V.btn(`اعرض المتاحات الآن · ${nowN}`, { href: '#/profils?dispo=now', cls: 'gold lg' })}${V.btn('العودة إلى الفرنسية', { href: '#/', cls: 'ghost lg' })}</div>
        </div></section>
        <section class="section-sm"><div class="wrap">
          <h2 class="ar-h2">وجوه جديدة</h2><p class="ar-note2">انضممن إلى BD خلال الأسابيع الأخيرة، وجميعهن موثّقات.</p>
          <div class="ar-grid">${L.slice(0, 8).map((p) => { const s = V.statusInfo(p); return `<a class="ar-card" href="#/profil/${p.id}"><span class="ar-ph"><img src="${V.img(p.photos[0], 's')}" alt="" loading="lazy"><span class="ar-st ${s.cls}"><i></i>${AR_ST[s.cls] || AR_ST.req}</span></span><b><bdi>${esc(p.name)}</bdi> · <bdi>${V.ageShort(p)}</bdi></b><small>${I('map-pin', 'sm')}<bdi>${V.communeTxt(p.commune)}</bdi></small><span class="ar-pr">${p.from ? `ابتداءً من <bdi>${p.from}</bdi> فرنك` : 'السعر غير محدَّد'}</span></a>`; }).join('')}</div>
        </div></section>
        <section class="section-sm"><div class="wrap">
          <h2 class="ar-h2">كيف نتحقق</h2>
          <div class="ar-checks">${[['العمر الحقيقي والهوية', 'بطاقة هوية وصورة ذاتية حيّة لدى مزوّد سويسري متخصص. لا نحتفظ بأي نسخة من الوثيقة.', 'عند التسجيل'], ['تطابق الصور', 'تُقارَن صورة ذاتية للتحقق بالصور المنشورة، وتمرّ كل صورة جديدة بالمراجعة قبل نشرها.', 'كل 90 يومًا'], ['الاستقلالية', 'مقابلة مباشرة مع فريقنا للتأكد من أن الشخص يعمل لحسابه الخاص.', 'كل 6 أشهر']].map(([t, d, w]) => `<div class="ar-ck"><span class="ar-ic">${I('badge-check')}</span><div><b>${t}</b><p>${d}</p><small>${w}</small></div></div>`).join('')}</div>
          <p class="ar-safe">في حالة الطوارئ: الشرطة <bdi>117</bdi> · الإسعاف <bdi>144</bdi></p>
        </div></section>
      </div>${V.footer()}`,
    };
  });

  /* ---------------------------------------------------------------- villes : ouverture prochainement */
  const CITY = { lausanne: { name: 'Lausanne', when: 'début 2027', pre: 23, code: 'LAU' }, zurich: { name: 'Zurich', when: 'courant 2027', pre: 11, code: 'ZRH' } };
  V.route(/^\/ville\/(lausanne|zurich)$/, (m) => {
    const c = CITY[m[1]];
    const mine = (V.L.pre || []).filter((x) => x.city === c.name);
    const cats = V.CATS.filter((x) => x.id !== 'all');
    return {
      title: c.name + ' · bientôt',
      html: `<div class="wrap"><div class="page-hero" style="max-width:860px"><div class="eyebrow"><i class="dot-live"></i> Ouverture prochainement · ${c.when}</div><h1 class="h1" style="margin-top:12px">BD arrive à ${c.name}.</h1>
        <p class="lead">Nous préparons l’ouverture de ${c.name}. Aucun profil n’y est encore publié. Les professionnelles peuvent déjà se préinscrire : leur dossier sera traité en priorité à l’ouverture, avec la même admission qu’à Genève.</p>
        <div class="row wrapr" style="margin-top:14px;gap:8px"><span class="badge v">${c.pre + mine.length} préinscriptions</span><span class="badge">Gratuit jusqu’à l’ouverture</span><span class="badge">Identité, photos et entretien vérifiés</span></div></div>
        <div class="grid-2 city-forms" style="margin-top:28px">
          <form class="panel" id="preForm" novalidate><h3>Vous êtes professionnelle ?</h3><p class="small muted" style="margin:4px 0 14px">Préinscription sans engagement. Vos coordonnées restent privées et ne servent qu’à vous prévenir.</p>
            <div class="stack">${V.field('Prénom ou pseudo', { name: 'pn' })}${V.field('Catégorie', { type: 'select', name: 'pc', value: 'Escortes', options: cats.map((x) => x.label) })}${V.field('Téléphone ou e-mail', { name: 'pt' })}
            ${V.opt('p18', '1', 'J’ai 18 ans ou plus et je travaille de façon indépendante', 'Vérifié à l’ouverture, comme à Genève', { box: true })}</div>
            <div style="margin-top:14px">${V.btn('Me préinscrire', { cls: 'block', arrow: true, attrs: 'data-pre' })}</div></form>
          <div class="stack">
            <form class="panel" id="alertForm" novalidate><h3>Être prévenu de l’ouverture</h3><p class="small muted" style="margin:4px 0 14px">Un seul e-mail, à l’ouverture de ${c.name}. Objet discret, aucune publicité.</p>${V.field('E-mail', { type: 'email', name: 'ae' })}<div style="margin-top:12px">${V.btn('Me prévenir', { cls: 'sm ghost block', attrs: 'data-alert' })}</div></form>
            <div class="panel soft"><h3>En attendant</h3><p class="small ink2" style="margin-top:8px">Les profils vérifiés de Genève restent accessibles, à moins d’une heure de ${c.name}.</p><div style="margin-top:12px">${V.btn('Voir les profils de Genève', { href: '#/profils', cls: 'sm dark', arrow: true })}</div></div>
          </div>
        </div>
      </div>${V.footer()}`,
      after: (v) => {
        const f = $('#preForm', v), a = $('#alertForm', v);
        f.addEventListener('submit', (e) => e.preventDefault()); a.addEventListener('submit', (e) => e.preventDefault());
        $('[data-pre]', f).onclick = (e) => {
          e.preventDefault();
          const pn = $('[name="pn"]', f).value.trim(), pt = $('[name="pt"]', f).value.trim(), ok = $('[name="p18"]', f).checked;
          if (!pn || !pt) return V.toast('Indiquez un prénom et un moyen de vous joindre.', { icon: 'info' });
          if (!ok) return V.toast('Cochez la confirmation (18 ans ou plus, indépendante).', { icon: 'info' });
          const ref = `PRE-${c.code}-${String(100 + (V.L.pre || []).length + c.pre).padStart(4, '0')}`;
          V.L.pre = [...(V.L.pre || []), { name: pn, city: c.name, cat: $('[name="pc"]', f).value, at: Date.now(), src: 'Page « Ouverture prochainement »', ref }]; V.save();
          f.innerHTML = `<div class="success"><div class="ring">${I('check')}</div><h3 class="h3">Préinscription enregistrée</h3><p class="muted" style="margin-top:8px">Référence <b class="num">${ref}</b>. Nous vous écrirons avant l’ouverture de ${c.name} pour compléter votre dossier.</p></div>`;
        };
        $('[data-alert]', a).onclick = (e) => { e.preventDefault(); const em = $('[name="ae"]', a).value.trim(); if (!/.+@.+\..+/.test(em)) return V.toast('Indiquez une adresse e-mail valide.', { icon: 'info' }); a.innerHTML = `<div class="callout ok">${I('check')}<span>C’est noté : un seul e-mail à l’ouverture de ${c.name}.</span></div>`; };
      },
    };
  });

  /* ---------------------------------------------------------------- retour privé à BD (remplace les avis publics) */
  V.openFeedback = (id) => {
    const p = id ? V.byId(id) : null;
    const first = p ? p.name.split(' ')[0] : '';
    const L = V.PROFILES.filter((x) => V.visible(x));
    const sh = V.sheet.open({
      title: p ? `Retour privé sur ${esc(first)}` : 'Retour privé à BD',
      body: `<p class="ink2" style="margin-bottom:14px">Votre retour va uniquement à l’équipe BD. Il n’est <b>jamais publié</b>, ne donne pas de note${p ? ` et ${esc(first)} ne le voit pas` : ''}. Pour un danger ou une contrainte, utilisez plutôt « Signaler ».</p>
        ${p ? '' : `<div style="margin-bottom:12px">${V.field('Profil concerné (facultatif)', { type: 'select', name: 'fp', value: '', options: [['', 'Aucun en particulier'], ...L.map((x) => [x.id, x.name])] })}</div>`}
        <div class="stack">${V.opt('fk', 'Positif', 'Tout s’est bien passé', 'Ponctualité, respect, conforme au profil', { on: true })}${V.opt('fk', 'Négatif', 'Un problème', 'Pas conforme, irrespectueux, tarif différent…')}${V.opt('fk', 'Sans réponse', 'Pas de réponse ou rendez-vous non honoré', '')}</div>
        <div class="form-grid two" style="margin-top:12px">${V.field('Quand ?', { type: 'select', name: 'fw', value: 'Aujourd’hui', options: ['Aujourd’hui', 'Hier', 'Cette semaine', 'Plus ancien'] })}${V.field('Par quel canal ?', { type: 'select', name: 'fc', value: 'WhatsApp', options: ['WhatsApp', 'Appel', 'SMS', 'Telegram'] })}</div>
        <div style="margin-top:12px">${V.field('Votre retour (facultatif)', { type: 'textarea', name: 'ft', max: 600 })}</div>
        <div style="margin-top:12px">${V.field('E-mail pour une réponse (facultatif)', { type: 'email', name: 'fe' })}</div>`,
      foot: V.btn('Envoyer à l’équipe BD', { cls: 'sm block', attrs: 'data-send' }),
    });
    $('[data-send]', sh).onclick = () => {
      const kind = ($('input[name="fk"]:checked', sh) || {}).value || 'Positif';
      const pid = p ? p.id : ($('[name="fp"]', sh) || {}).value;
      V.L.fb = [...(V.L.fb || []), { at: Date.now(), pid: pid || '', kind, when: $('[name="fw"]', sh).value, canal: $('[name="fc"]', sh).value, text: $('[name="ft"]', sh).value.trim() }]; V.save();
      $('.sh-body', sh).innerHTML = `<div class="success"><div class="ring">${I('check')}</div><h3 class="h3">Merci, c’est transmis.</h3><p class="muted" style="margin-top:8px">Votre retour est arrivé chez l’équipe BD, en privé. Il ne sera jamais publié.</p>${kind === 'Négatif' ? `<p class="hint">Un danger, une contrainte, une personne qui semble mineure ? <button class="link" data-act="report" data-id="${pid || ''}">Faites un signalement</button>, traité en priorité.</p>` : ''}</div>`;
      $('.sh-foot', sh).innerHTML = `<button class="btn sm block" data-close4><span class="roll"><span>Fermer</span><span aria-hidden="true">Fermer</span></span></button>`;
      $('[data-close4]', sh).onclick = () => V.sheet.close();
    };
  };
})(window.V);
