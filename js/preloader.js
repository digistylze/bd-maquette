/* Velours : préchargeur « pile et titre » (pile de photos, logo, titre lettre par lettre, compteur),
   joué une fois par session puis rideau qui découvre l'accueil. Port sans dépendance de l'effet
   preloader-stacked-images-counter (effects-library), mêmes temps et mêmes courbes. */
(function (V) {
  'use strict';
  let seen = false;
  try { seen = sessionStorage.getItem('vl-intro') === '1'; } catch (e) { /* stockage indisponible : on joue l'intro */ }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (seen || reduce || !Element.prototype.animate || new URLSearchParams(location.search).has('nointro')) return;

  if (!V.PROFILES || !V.img) return; // ordre de chargement inattendu : pas d'intro plutôt qu'une erreur
  const pics = V.PROFILES.filter((p) => (V.visible ? V.visible(p) : !p.cache)).slice(0, 6).map((p) => V.img(p.photos[0]));
  const ROT = [7.5, -2.5, -10, 12.5, -5, 5];
  const HOP = 'cubic-bezier(0.8, 0, 0.2, 1)', HOP2 = 'cubic-bezier(0.9, 0, 0.1, 1)';
  const WORD = 'Velours';
  const root = document.createElement('div');
  root.className = 'pl';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `${pics.map((src) => `<div class="pl-card"><img src="${src}" alt=""></div>`).join('')}
    <div class="pl-head"><img class="pl-logo" src="img/logo-b.webp" alt=""><div class="pl-title"><span class="pl-word">${[...WORD].map((c) => `<span class="pl-l">${c}</span>`).join('')}</span><span class="pl-count"><span>000</span></span></div></div>`;
  document.body.appendChild(root);
  document.body.classList.add('pl-on');
  try { sessionStorage.setItem('vl-intro', '1'); } catch (e) { /* idem */ }

  const T0 = 500; // fond seul avant la première carte (ms)
  const run = (el, kf, o) => el.animate(kf, { fill: 'both', ...o });
  const out = (el, kf, o) => el.animate(kf, { fill: 'forwards', ...o });
  const cards = [...root.querySelectorAll('.pl-card')];
  const letters = [...root.querySelectorAll('.pl-l')];
  const logo = root.querySelector('.pl-logo'), num = root.querySelector('.pl-count > span');

  // 1. Cartes : apparition en pile, rotation fixe par carte
  cards.forEach((c, k) => {
    const r = ROT[k % ROT.length];
    run(c, [{ transform: `rotate(${r}deg) scale(0)`, clipPath: 'inset(20%)' }, { transform: `rotate(${r}deg) scale(1)`, clipPath: 'inset(0%)' }], { duration: 1000, delay: T0 + k * 200, easing: HOP });
    // 5. Repli : la carte du dessus part en premier
    out(c, [{ transform: `rotate(${r}deg) scale(1)`, clipPath: 'inset(0%)' }, { transform: `rotate(${r}deg) scale(0)`, clipPath: 'inset(20%)' }], { duration: 1000, delay: T0 + 3500 + (cards.length - 1 - k) * 75, easing: HOP2 });
  });

  // 2. Titre lettre par lettre, ordre aléatoire
  const order = letters.map((_, k) => k).sort(() => Math.random() - 0.5);
  const gap = Math.min(125, 625 / Math.max(1, letters.length - 1));
  order.forEach((k, j) => {
    run(letters[k], [{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], { duration: 1000, delay: T0 + 350 + j * gap, easing: HOP2 });
    out(letters[k], [{ transform: 'translateY(0)' }, { transform: 'translateY(-110%)' }], { duration: 750, delay: T0 + 3250 + j * gap, easing: HOP2 });
  });
  run(logo, [{ opacity: 0, transform: 'translateY(18px) scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 1000, delay: T0 + 300, easing: HOP2 });
  out(logo, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-18px) scale(.9)' }], { duration: 750, delay: T0 + 3250, easing: HOP2 });

  // 3. Compteur : monte avec le titre puis compte de 000 à 100 (easeInOutQuad)
  run(num, [{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], { duration: 1000, delay: T0 + 350, easing: HOP2 });
  out(num, [{ transform: 'translateY(0)' }, { transform: 'translateY(-110%)' }], { duration: 750, delay: T0 + 3250, easing: HOP2 });
  const t0 = performance.now() + T0 + 850;
  const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
  const count = (t) => {
    const x = Math.max(0, Math.min(1, (t - t0) / 2000));
    num.textContent = String(Math.round(ease(x) * 100)).padStart(3, '0');
    if (x < 1 && root.isConnected) requestAnimationFrame(count);
  };
  requestAnimationFrame(count);

  // 6. Rideau : le bas du calque remonte et découvre l'accueil déjà en place
  out(root, [{ clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)' }], { duration: 1000, delay: T0 + 4350, easing: HOP2 });

  let done = false;
  const finish = () => {
    if (done) return; done = true;
    document.body.classList.remove('pl-on');
    root.remove();
  };
  setTimeout(() => document.body.classList.add('pl-reveal'), T0 + 4500);
  setTimeout(finish, T0 + 5400);
  setTimeout(finish, 7000); // sécurité
  root.addEventListener('click', () => {
    // un clic passe l'intro : rideau immédiat
    if (done) return;
    root.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    out(root, [{ clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)' }], { duration: 650, easing: HOP2 }).onfinish = finish;
  });
})(window.V);
