/* BD : carte des profils (positions approximatives au quartier, jamais d'adresse) */
(function (V) {
  'use strict';
  const { $, $$, i: I, esc } = V;
  /* Centres approximatifs des quartiers et communes (lat, lng) */
  const COORD = {
    geneve: [46.2044, 6.1432], 'eaux-vives': [46.2010, 6.1600], paquis: [46.2125, 6.1475], plainpalais: [46.1962, 6.1412],
    carouge: [46.1820, 6.1390], champel: [46.1912, 6.1560], cologny: [46.2172, 6.1805], 'vieille-ville': [46.2010, 6.1482],
    servette: [46.2120, 6.1330], jonction: [46.2005, 6.1300], 'petit-saconnex': [46.2240, 6.1310], florissant: [46.1932, 6.1640],
    'chene-bougeries': [46.1980, 6.1860], 'chene-bourg': [46.1960, 6.1960], lancy: [46.1830, 6.1180], meyrin: [46.2340, 6.0800],
    onex: [46.1840, 6.1000], thonex: [46.1940, 6.2000], 'grand-saconnex': [46.2330, 6.1230], versoix: [46.2830, 6.1630],
    vernier: [46.2170, 6.0850], veyrier: [46.1670, 6.1850], 'plan-les-ouates': [46.1670, 6.1170], bernex: [46.1760, 6.0750],
  };
  const CENTER = [46.2033, 6.1466]; // place du Molard
  const PIN = { w: 92, h: 70, lw: 44, lh: 50 }; // taille du marqueur (normal, puis vue éloignée)
  const RADII = [['', 'Tout le canton'], ['1', '1 km'], ['2', '2 km'], ['5', '5 km']];
  /* Décalage stable par profil (environ 150 à 450 m) : on ne pointe jamais un immeuble */
  const jitter = (id) => { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0; const a = (h % 360) * Math.PI / 180, r = 0.0015 + (h % 1000) / 1000 * 0.0025; return [Math.sin(a) * r, Math.cos(a) * r * 1.45]; };
  const posOf = (p) => { const c = COORD[p.commune] || COORD.geneve; const j = jitter(p.id); return [c[0] + j[0], c[1] + j[1]]; };
  const km = (a, b) => { const R = 6371, dLa = (b[0] - a[0]) * Math.PI / 180, dLo = (b[1] - a[1]) * Math.PI / 180, x = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
  const kmTxt = (d) => (d < 1 ? `${Math.max(100, Math.round(d * 10) * 100)} m` : `${d.toFixed(1).replace('.', ',')} km`);

  let leaflet = null;
  const loadLeaflet = () => leaflet || (leaflet = new Promise((ok, ko) => {
    if (window.L) return ok(window.L);
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'; document.head.appendChild(css);
    const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'; s.onload = () => ok(window.L); s.onerror = () => { leaflet = null; ko(new Error('leaflet')); }; document.head.appendChild(s);
  }));

  V.route(/^\/carte$/, () => ({
    title: 'Carte',
    html: `<div class="mp">
      <aside class="mp-side">
        <div class="mp-head"><div class="eyebrow">Genève · positions approximatives</div><h1 class="mp-title">Autour de vous</h1>
          <p class="small muted">Placez-vous sur la carte ou utilisez votre position : les profils les plus proches s’affichent en premier.</p></div>
        <div class="mp-tools">
          <button type="button" class="mp-me" data-mp="locate">${I('map-pin', 'sm')}Autour de moi</button>
          <div class="qf-chips" data-mp-r>${RADII.map(([v, l]) => `<button type="button" class="qf-c${v ? '' : ' on'}" data-v="${v}">${l}</button>`).join('')}</div>
          <div class="qf-chips"><button type="button" class="qf-c" data-mp="now"><i class="dot-live"></i>Disponibles maintenant</button></div>
        </div>
        <div class="mp-count" id="mpCount"></div>
        <div class="mp-list" id="mpList"></div>
        <p class="hint mp-note">${I('shield', 'sm')}Chaque profil apparaît dans une zone approximative de 100 à 200 m, décalée au hasard : l’adresse n’est ni au centre ni publiée.</p>
      </aside>
      <div class="mp-map"><div id="mpMap" role="application" aria-label="Carte des profils"></div><div class="mp-hint" id="mpHint">${I('map-pin', 'sm')}Cliquez sur la carte pour vous placer</div></div>
    </div>`,
    after: (v) => initMap(v),
  }));

  async function initMap(v) {
    const box = $('#mpMap', v); if (!box) return;
    let L;
    try { L = await loadLeaflet(); } catch (e) { box.innerHTML = V.empty('map-pin', 'Carte indisponible', 'La carte a besoin d’une connexion internet. La liste reste utilisable.', ''); }
    const P = V.PROFILES.filter((p) => V.visible(p) && !V.hidden().includes(p.id));
    const st = { me: CENTER.slice(), r: '', now: false, sel: null };
    let map = null, meMk = null, ring = null, zone = null;
    const marks = {}, off = {}, zones = {};
    if (L && document.body.contains(box)) {
      if (V._map) { try { V._map.remove(); } catch (e) { /* carte précédente déjà retirée */ } }
      const dark = document.documentElement.dataset.theme === 'dark';
      map = V._map = L.map(box, { zoomControl: false, scrollWheelZoom: true, attributionControl: true, maxZoom: 16 }).setView(CENTER, 13);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      // fonds Esri « Canvas » (sans clé) : gris clair ou sombre, plus la couche des noms de lieux
      const esri = (n) => `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${dark ? 'Dark' : 'Light'}_Gray_${n}/MapServer/tile/{z}/{y}/{x}`;
      L.tileLayer(esri('Base'), { maxZoom: 16, attribution: 'Fond &copy; Esri, HERE, Garmin, &copy; contributeurs OpenStreetMap' }).addTo(map);
      L.tileLayer(esri('Reference'), { maxZoom: 16 }).addTo(map);
      meMk = L.marker(st.me, { draggable: true, zIndexOffset: 1000, icon: L.divIcon({ className: 'mp-you', html: '<span></span><b>Vous</b>', iconSize: [22, 22], iconAnchor: [11, 11] }) }).addTo(map);
      meMk.on('dragend', () => { st.me = [meMk.getLatLng().lat, meMk.getLatLng().lng]; render(); hideHint(); });
      map.on('click', (e) => { st.me = [e.latlng.lat, e.latlng.lng]; meMk.setLatLng(st.me); render(); hideHint(); });
      P.forEach((p) => {
        const now = V.statusOf(p).t === 'now';
        const m = L.marker(posOf(p), { title: `${p.name}, ${V.fromTxt(p)}`, riseOnHover: true, icon: L.divIcon({ className: 'mp-mk', html: `<div class="mp-pin${now ? ' on' : ''}"><i class="mp-ph" style="background-image:url('${V.img(p.photos[0], 's')}')"></i><span class="mp-tag"><b>${esc(p.name)}</b>${p.from ? p.from + '.–' : 'tarif ?'}</span><i class="mp-tip"></i></div>`, iconSize: [PIN.w, PIN.h], iconAnchor: [PIN.w / 2, PIN.h] }) }).addTo(map);
        m.on('click', () => select(p.id, true));
        marks[p.id] = m;
        zones[p.id] = L.circle(posOf(p), { radius: V.zoneR(p), color: '#5f2a8a', weight: 1, opacity: .5, fillColor: '#5f2a8a', fillOpacity: .1, interactive: false }).addTo(map);
      });
      map.on('zoomend', declutter);
      setTimeout(() => { map.invalidateSize(); declutter(); }, 120);
    }
    /* Écarte les marqueurs qui se chevauchent à l'écran (décalage visuel seulement, la position reste celle du quartier) */
    function declutter() {
      if (!map) return;
      const lo = map.getZoom() <= 12; box.classList.toggle('mp-lo', lo);
      const W = lo ? PIN.lw : PIN.w + 4, H = lo ? PIN.lh : PIN.h - 4;
      const it = Object.entries(marks).filter(([, m]) => { const el = m.getElement(); return el && !el.classList.contains('dim'); })
        .map(([k, m], n) => { const pt = map.latLngToLayerPoint(m.getLatLng()); return { k, m, x: pt.x, y: pt.y, ox: 0, oy: 0, n }; });
      const me = meMk ? map.latLngToLayerPoint(meMk.getLatLng()) : null; // le repère « Vous » ne bouge pas : les profils s'en écartent
      for (let pass = 0; pass < 60; pass++) {
        let hit = false;
        if (me) it.forEach((A) => {
          const dx = A.x + A.ox - me.x, dy = A.y + A.oy - H / 2 - (me.y - 12);
          const px = (W + 56) / 2 - Math.abs(dx), py = (H + 50) / 2 - Math.abs(dy);
          if (px <= 0 || py <= 0) return;
          hit = true;
          if (px / W < py / H) A.ox += (dx >= 0 ? 1 : -1) * (px + .5); else A.oy += (dy >= 0 ? 1 : -1) * (py + .5);
        });
        for (let a = 0; a < it.length; a++) for (let b = a + 1; b < it.length; b++) {
          const A = it[a], B = it[b];
          let dx = B.x + B.ox - A.x - A.ox, dy = B.y + B.oy - A.y - A.oy;
          const px = W - Math.abs(dx), py = H - Math.abs(dy);
          if (px <= 0 || py <= 0) continue;
          hit = true;
          if (!dx && !dy) dx = B.n > A.n ? 1 : -1;
          if (px / W < py / H) { const d = (dx >= 0 ? 1 : -1) * (px / 2 + .5); A.ox -= d; B.ox += d; } else { const d = (dy >= 0 ? 1 : -1) * (py / 2 + .5); A.oy -= d; B.oy += d; }
        }
        if (!hit) break;
      }
      Object.keys(off).forEach((k) => delete off[k]);
      it.forEach(({ k, m, ox, oy }) => { off[k] = [ox, oy]; const pin = m.getElement().firstElementChild; if (pin) pin.style.translate = `${ox.toFixed(1)}px ${oy.toFixed(1)}px`; });
      Object.entries(marks).forEach(([k, m]) => { if (!off[k]) { const pin = m.getElement() && m.getElement().firstElementChild; if (pin) pin.style.translate = ''; } });
      if (st.sel && marks[st.sel]) { const pp = marks[st.sel].getPopup(); if (pp && pp.isOpen()) { pp.options.offset = popOff(st.sel); pp.update(); } }
    }
    const popOff = (id) => { const o = off[id] || [0, 0]; return L.point(o[0], o[1] - (box.classList.contains('mp-lo') ? PIN.lh : PIN.h) + 4); };
    const hideHint = () => { const h = $('#mpHint', v); if (h) h.classList.add('off'); };
    const popup = (p, d) => `<div class="mp-pop"><img src="${V.img(p.photos[0], 's')}" alt=""><div><b>${esc(p.name)} <span>${V.ageShort(p)}</span></b><small>${V.communeTxt(p.commune)} · à ${kmTxt(d)}</small><small>Zone d’environ ${V.zoneR(p)} m, adresse non publiée</small>${V.statusPill(p, true, true)}<a class="mp-go" href="#/profil/${p.id}">Voir le profil ${I('arrow-right', 'sm')}</a></div></div>`;
    function select(id, fromMap) {
      st.sel = id;
      const p = V.byId(id); const d = km(st.me, posOf(p));
      $$('.mp-it', v).forEach((x) => x.classList.toggle('on', x.dataset.id === id));
      if (map) {
        Object.entries(marks).forEach(([k, m]) => { const el = m.getElement(); if (el) el.classList.toggle('sel', k === id); });
        if (zone) zone.remove();
        zone = L.circle(posOf(p), { radius: V.zoneR(p), color: '#cfae6c', weight: 2, dashArray: '4 5', fillColor: '#cfae6c', fillOpacity: .22, interactive: false }).addTo(map);
        marks[id].bindPopup(popup(p, d), { closeButton: false, offset: popOff(id), className: 'mp-popup', autoPanPadding: [24, 24] }).openPopup();
        if (!fromMap) map.flyTo(posOf(p), Math.max(map.getZoom(), 14), { duration: .8 });
      }
      if (fromMap) { const it = $(`.mp-it[data-id="${id}"]`, v); if (it) it.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    }
    function render() {
      const list = P.map((p) => ({ p, d: km(st.me, posOf(p)) }))
        .filter((x) => (!st.r || x.d <= +st.r) && (!st.now || V.statusOf(x.p).t === 'now'))
        .sort((a, b) => a.d - b.d);
      const ids = new Set(list.map((x) => x.p.id));
      if (st.sel && !ids.has(st.sel)) { // le profil sélectionné sort du filtre : on le désélectionne
        if (map) { marks[st.sel].closePopup(); const el = marks[st.sel].getElement(); if (el) el.classList.remove('sel'); if (zone) { zone.remove(); zone = null; } }
        st.sel = null;
      }
      Object.entries(marks).forEach(([k, m]) => { const el = m.getElement(); if (el) el.classList.toggle('dim', !ids.has(k)); });
      Object.entries(zones).forEach(([k, z]) => z.setStyle({ fillOpacity: ids.has(k) ? .1 : .03, opacity: ids.has(k) ? .5 : .15 }));
      declutter();
      $('#mpCount', v).innerHTML = `<b>${list.length}</b> profil${list.length > 1 ? 's' : ''}${st.r ? ` à moins de ${st.r} km` : ''}`;
      $('#mpList', v).innerHTML = list.length ? list.map(({ p, d }) => `<button type="button" class="mp-it${st.sel === p.id ? ' on' : ''}" data-id="${p.id}"><img src="${V.img(p.photos[0], 's')}" alt=""><span class="mp-tx"><b>${esc(p.name)} <span>${V.ageShort(p)}</span>${I('badge-check', 'sm')}</b><small>${I('map-pin', 'sm')}${V.communeTxt(p.commune)} · ${kmTxt(d)}</small>${V.statusPill(p, true, true)}</span><span class="mp-pr">${p.from ? `dès<b>${p.from}.–</b>` : 'tarif<b>non renseigné</b>'}</span></button>`).join('') : `<p class="small muted" style="padding:16px 4px">Aucun profil dans ce rayon. Élargissez la zone ou déplacez-vous sur la carte.</p>`;
      if (map) {
        if (ring) { ring.remove(); ring = null; }
        if (st.r) { ring = L.circle(st.me, { radius: +st.r * 1000, color: '#4b1c71', weight: 1, fillColor: '#4b1c71', fillOpacity: .05 }).addTo(map); map.fitBounds(ring.getBounds(), { padding: [30, 30] }); }
      }
    }
    // écouteur posé sur la page (remplacée à chaque affichage), pas sur #view qui persiste
    v.firstElementChild.addEventListener('click', (e) => {
      const it = e.target.closest('.mp-it'); if (it) { select(it.dataset.id, false); return; }
      const r = e.target.closest('[data-mp-r] .qf-c'); if (r) { $$('[data-mp-r] .qf-c', v).forEach((x) => x.classList.toggle('on', x === r)); st.r = r.dataset.v; render(); return; }
      const n = e.target.closest('[data-mp="now"]'); if (n) { st.now = n.classList.toggle('on'); render(); return; }
      if (e.target.closest('[data-mp="locate"]')) {
        if (!navigator.geolocation) return V.toast('Votre navigateur ne partage pas la position.', { icon: 'info' });
        navigator.geolocation.getCurrentPosition((pos) => {
          st.me = [pos.coords.latitude, pos.coords.longitude];
          if (map) { meMk.setLatLng(st.me); map.flyTo(st.me, 14, { duration: .8 }); }
          hideHint(); render(); V.toast('Position trouvée : les profils les plus proches sont en tête.', { icon: 'map-pin' });
        }, () => V.toast('Position refusée. Cliquez sur la carte pour vous placer.', { icon: 'info', ms: 3500 }), { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
      }
    });
    render();
  }
})(window.V);
