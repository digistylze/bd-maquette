/* BD : vitrine de sortie rapide. Échap (ou le bouton de sortie) fait glisser une page neutre « Genève Info »
   (météo, agenda, transports) par-dessus le site : titre d'onglet et icône neutres, retour arrière bloqué,
   rien de BD visible. Retour discret : trois appuis rapides sur le logo « Genève Info ». */
(function (V) {
  'use strict';
  const TZ = 'Europe/Zurich';
  const TITLE = 'Météo à Genève · Genève Info';
  const ICON = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="14" fill="#f5b301"/><g stroke="#f5b301" stroke-width="5" stroke-linecap="round"><path d="M32 4v8M32 52v8M4 32h8M52 32h8M12 12l6 6M46 46l6 6M12 52l6-6M46 18l6-6"/></g></svg>');
  const base = () => location.pathname + location.search;
  const fmt = (o) => new Intl.DateTimeFormat('fr-CH', { timeZone: TZ, ...o });

  /* Météo plausible et stable pour la journée (moyennes de Genève par mois) */
  const HIGH = [5, 7, 12, 15, 20, 24, 27, 26, 21, 15, 9, 5];
  const SKY = [['sun', 'Ensoleillé'], ['part', 'Éclaircies'], ['cloud', 'Nuageux'], ['rain', 'Pluie faible'], ['part', 'Bise légère, éclaircies']];
  const seed = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
  const day = (k) => { const d = new Date(Date.now() + k * 864e5); const n = Math.floor(d.getTime() / 864e5); const m = +fmt({ month: 'numeric' }).format(d) - 1; const hi = HIGH[m] + Math.round(seed(n) * 6 - 3); const sky = SKY[Math.floor(seed(n + 7) * SKY.length)]; return { d, hi, lo: hi - 6 - Math.round(seed(n + 3) * 3), sky, rain: sky[0] === 'rain' ? 60 + Math.round(seed(n + 5) * 30) : Math.round(seed(n + 9) * 25), wind: 6 + Math.round(seed(n + 11) * 18) }; };
  const ico = (k, s = 44) => ({
    sun: `<svg viewBox="0 0 64 64" width="${s}" height="${s}"><circle cx="32" cy="32" r="12" fill="#f5b301"/><g stroke="#f5b301" stroke-width="4" stroke-linecap="round"><path d="M32 6v7M32 51v7M6 32h7M51 32h7M14 14l5 5M45 45l5 5M14 50l5-5M45 19l5-5"/></g></svg>`,
    part: `<svg viewBox="0 0 64 64" width="${s}" height="${s}"><circle cx="24" cy="24" r="10" fill="#f5b301"/><path d="M22 50h26a10 10 0 0 0 0-20 14 14 0 0 0-27 4 8 8 0 0 0 1 16z" fill="#cfd8e3"/></svg>`,
    cloud: `<svg viewBox="0 0 64 64" width="${s}" height="${s}"><path d="M18 48h30a11 11 0 0 0 0-22 15 15 0 0 0-29 4 9 9 0 0 0-1 18z" fill="#b8c4d2"/></svg>`,
    rain: `<svg viewBox="0 0 64 64" width="${s}" height="${s}"><path d="M18 40h30a11 11 0 0 0 0-22 15 15 0 0 0-29 4 9 9 0 0 0-1 18z" fill="#9fb0c4"/><g stroke="#4a8fd6" stroke-width="3" stroke-linecap="round"><path d="M24 46l-3 8M34 46l-3 8M44 46l-3 8"/></g></svg>`,
  }[k]);
  const SUN = [['08:13', '17:05'], ['07:45', '17:45'], ['06:55', '18:25'], ['06:50', '20:10'], ['06:05', '20:50'], ['05:40', '21:30'], ['05:55', '21:25'], ['06:35', '20:45'], ['07:15', '19:45'], ['07:55', '18:40'], ['07:35', '17:00'], ['08:05', '16:50']];
  const AGENDA = [
    [0, '18:30', 'Visite guidée de la Vieille-Ville', 'Départ place du Bourg-de-Four · 1 h 30 · gratuit'],
    [0, '20:00', 'Concert de musique de chambre', 'Temple de la Vieille-Ville · entrée libre, chapeau'],
    [1, '09:00', 'Marché aux puces', 'Plaine de Plainpalais · toute la journée'],
    [1, '19:00', 'Soirée contes pour adultes', 'Bibliothèque de quartier, Eaux-Vives · sur inscription'],
    [2, '10:00', 'Course du dimanche au bord du lac', 'Départ jardin Anglais · 5 ou 10 km, tous niveaux'],
    [3, '18:00', 'Atelier cuisine de saison', 'Maison de quartier de Carouge · courges et châtaignes'],
    [4, '12:15', 'Midi musical', 'Parc des Bastions, kiosque · 45 minutes'],
  ];
  const html = () => {
    const days = Array.from({ length: 6 }, (_, k) => day(k)), t = days[0];
    const m = +fmt({ month: 'numeric' }).format(new Date()) - 1;
    const now = fmt({ hour: '2-digit', minute: '2-digit' }).format(new Date());
    return `<div class="vt-in">
      <header class="vt-head"><div class="vt-wrap"><button type="button" class="vt-logo" data-vt-logo aria-label="Genève Info">${ico('sun', 26)}<b>Genève Info</b></button>
        <nav class="vt-nav"><a href="#vt-meteo">Météo</a><a href="#vt-agenda">Agenda</a><a href="#vt-transports">Transports</a><a href="#vt-plans">Bons plans</a></nav></div></header>
      <main class="vt-wrap">
        <p class="vt-date">${fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())} · mis à jour à ${now}</p>
        <section class="vt-now" id="vt-meteo"><div class="vt-now-l">${ico(t.sky[0], 92)}<div><span class="vt-city">Genève</span><b class="vt-temp">${t.hi}°</b><span>${t.sky[1]} · min. ${t.lo}°</span></div></div>
          <dl class="vt-kv"><div><dt>Pluie</dt><dd>${t.rain} %</dd></div><div><dt>Vent</dt><dd>${t.wind} km/h</dd></div><div><dt>Lever</dt><dd>${SUN[m][0]}</dd></div><div><dt>Coucher</dt><dd>${SUN[m][1]}</dd></div></dl></section>
        <section class="vt-days">${days.slice(1).map((x) => `<div class="vt-day"><span>${fmt({ weekday: 'short', day: 'numeric' }).format(x.d)}</span>${ico(x.sky[0], 38)}<b>${x.hi}°</b><small>${x.lo}°</small></div>`).join('')}</section>
        <div class="vt-grid">
          <section class="vt-card" id="vt-agenda"><h2>Agenda des prochains jours</h2><ul class="vt-list">${AGENDA.map(([k, h, t2, d]) => `<li><span class="vt-when"><b>${fmt({ weekday: 'short', day: 'numeric' }).format(new Date(Date.now() + k * 864e5))}</b><small>${h}</small></span><span><b>${t2}</b><small>${d}</small></span></li>`).join('')}</ul></section>
          <div class="vt-side">
            <section class="vt-card" id="vt-transports"><h2>Transports</h2><ul class="vt-list"><li><span class="vt-dot ok"></span><span><b>Réseau urbain : trafic normal</b><small>Trams et bus à l’heure</small></span></li><li><span class="vt-dot warn"></span><span><b>Pont du Mont-Blanc</b><small>Circulation dense de 17 h à 19 h</small></span></li><li><span class="vt-dot ok"></span><span><b>Bateaux du lac</b><small>Horaires d’hiver dès le 1er novembre</small></span></li></ul></section>
            <section class="vt-card" id="vt-plans"><h2>Bons plans</h2><ul class="vt-list"><li><span class="vt-dot"></span><span><b>Bains du lac</b><small>Sauna et fondue, saison d’hiver</small></span></li><li><span class="vt-dot"></span><span><b>Jet d’eau</b><small>En fonction de 10 h à la tombée de la nuit</small></span></li><li><span class="vt-dot"></span><span><b>Musées</b><small>Collections permanentes gratuites le premier dimanche du mois</small></span></li></ul></section>
          </div>
        </div>
      </main>
      <footer class="vt-foot"><div class="vt-wrap">Genève Info · météo et informations pratiques · données indicatives</div></footer>
    </div>`;
  };

  /* Identité neutre de l'onglet */
  let saved = null;
  const neutral = () => {
    const link = document.querySelector('link[rel="icon"]');
    if (!saved) saved = { icon: link ? link.href : '', title: document.title.includes('Genève Info') ? 'BD · Genève (maquette)' : document.title };
    document.title = TITLE;
    if (link) link.href = ICON;
  };
  const restore = () => { const link = document.querySelector('link[rel="icon"]'); if (link) link.href = saved && saved.icon && !saved.icon.startsWith('data:') ? saved.icon : 'icons/icon-192.png'; document.title = saved && saved.title ? saved.title : 'BD · Genève (maquette)'; saved = null; };

  V.vitrine = (instant) => {
    neutral();
    if (document.getElementById('vitrine')) return;
    if (location.hash !== '#/info') { V.S.vitrineBack = location.hash || '#/'; V.save(); }
    // tout ce qui est ouvert se ferme en dessous, sans animation
    try { V.sheet.close(true); } catch (e) { /* aucune fenêtre ouverte */ }
    try { V.overlay.closeAll(true); } catch (e) { /* aucune surcouche */ }
    if (document.body.classList.contains('menu-open') && V.ui.menu) V.ui.menu(false);
    const el = document.createElement('div');
    el.id = 'vitrine'; el.className = 'vt-root'; el.setAttribute('role', 'document'); el.innerHTML = html();
    document.body.appendChild(el);
    document.body.classList.add('vt-on');
    if (instant) { el.classList.add('on', 'still'); document.body.classList.add('vt-hide'); }
    else { void el.offsetWidth; el.classList.add('on'); setTimeout(() => document.body.classList.add('vt-hide'), 340); }
    // l'entrée d'historique du site est remplacée ; le bouton retour reste sur la vitrine
    history.replaceState(null, '', base() + '#/info');
    history.pushState(null, '', base() + '#/info');
    let taps = [];
    el.querySelector('[data-vt-logo]').addEventListener('click', () => { const t = Date.now(); taps = [...taps.filter((x) => t - x < 1500), t]; if (taps.length >= 3) V.vitrineExit(); });
    el.addEventListener('click', (e) => { const a = e.target.closest('.vt-nav a'); if (a) { e.preventDefault(); const s = el.querySelector(a.getAttribute('href')); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
  };
  V.vitrineExit = () => {
    const el = document.getElementById('vitrine'); if (!el) return;
    el.id = ''; // la vitrine sort : la protection du bouton retour se désactive tout de suite
    const back = V.S.vitrineBack && V.S.vitrineBack !== '#/info' ? V.S.vitrineBack : '#/';
    document.body.classList.remove('vt-hide');
    el.classList.remove('on', 'still');
    setTimeout(() => { el.remove(); document.body.classList.remove('vt-on'); }, 320);
    restore();
    V.basePath = null; // la page de fond est reconstruite (la vitrine n'en laisse aucune)
    location.replace(back);
    if (V.gateIfNeeded) setTimeout(V.gateIfNeeded, 400);
  };
  addEventListener('popstate', () => { if (document.getElementById('vitrine')) { history.pushState(null, '', base() + '#/info'); neutral(); } });

  V.route(/^\/info$/, () => ({ title: 'Météo', html: '', after: () => V.vitrine(true) }));
})(window.V);
