/* BD : données fictives du back-office (40 professionnelles, duos, dossiers, signalements, factures).
   Tout est généré de façon stable à partir de la date du jour ; les heures sont celles de Genève. */
(function (V) {
  'use strict';
  const DAY = 864e5, TZ = 'Europe/Zurich';
  const R = (i) => { const x = Math.sin(i * 9301.17 + 49297.3) * 233280; return x - Math.floor(x); };
  const pick = (arr, i) => arr[Math.floor(R(i) * arr.length) % arr.length];

  /* ---------- Heure de Genève ---------- */
  const parts = (d) => Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d).map((p) => [p.type, p.value]));
  /* Date située à h:m (heure de Genève), « jours » jours après aujourd'hui (négatif = passé) */
  const at = (days, h = 10, m = 0) => {
    const p = parts(new Date(Date.now() + days * DAY));
    const guess = Date.UTC(+p.year, +p.month - 1, +p.day, h, m);
    const q = parts(new Date(guess));
    return new Date(guess - (Date.UTC(+q.year, +q.month - 1, +q.day, +q.hour, +q.minute) - guess));
  };
  const ago = (min) => new Date(Date.now() - min * 6e4);
  const F = (o) => new Intl.DateTimeFormat('fr-CH', { timeZone: TZ, ...o });
  const fD = F({ day: '2-digit', month: '2-digit', year: 'numeric' }), fT = F({ hour: '2-digit', minute: '2-digit' });
  const fL = F({ weekday: 'long', day: 'numeric', month: 'long' }), fS = F({ day: 'numeric', month: 'short' }), fWd = F({ weekday: 'short', day: 'numeric' });
  const dayKey = (d) => { const p = parts(d); return `${p.year}-${p.month}-${p.day}`; };
  V.gva = {
    TZ, at, ago, dayKey,
    d: (d) => fD.format(d), t: (d) => fT.format(d), dt: (d) => `${fD.format(d)} · ${fT.format(d)}`,
    long: (d) => fL.format(d), short: (d) => fS.format(d), wd: (d) => fWd.format(d),
    rel: (d) => { const k = dayKey(d); if (k === dayKey(new Date())) return `Aujourd’hui · ${fT.format(d)}`; if (k === dayKey(new Date(Date.now() - DAY))) return `Hier · ${fT.format(d)}`; return `${fD.format(d)} · ${fT.format(d)}`; },
    now: () => fT.format(new Date()),
  };

  /* ---------- Professionnelles : les 12 profils de la maquette (données du site) + 28 profils de remplissage, sans photo.
     Les cas sensibles (signalements graves, impayés, suspensions) ne concernent que les profils de remplissage. ---------- */
  const FILL = [
    ['alma', 'Alma', 29, 'femme', 'eaux-vives', 'visibilite'], ['lina', 'Lina', 26, 'femme', 'plainpalais', 'essentiel'], ['maya', 'Maya', 31, 'femme', 'champel', 'premium'],
    ['jade', 'Jade', 24, 'femme', 'paquis', 'essentiel'], ['sofia', 'Sofia', 34, 'femme', 'carouge', 'visibilite'], ['nora', 'Nora', 28, 'femme', 'cologny', 'premium'],
    ['ines', 'Inès', 27, 'femme', 'meyrin', 'essentiel'], ['camille', 'Camille', 32, 'femme', 'vieille-ville', 'visibilite'], ['valentina', 'Valentina', 30, 'femme', 'eaux-vives', 'premium'],
    ['zoe', 'Zoé', 25, 'femme', 'lancy', 'essentiel'], ['anya', 'Anya', 33, 'femme', 'grand-saconnex', 'visibilite'], ['leila', 'Leïla', 29, 'femme', 'paquis', 'visibilite'],
    ['bianca', 'Bianca', 36, 'femme', 'versoix', 'essentiel'], ['elena', 'Elena', 38, 'femme', 'chene-bougeries', 'visibilite'], ['luna', 'Luna', 27, 'trans', 'plainpalais', 'essentiel'],
    ['kiara', 'Kiara', 30, 'trans', 'eaux-vives', 'essentiel'], ['alexia', 'Alexia', 26, 'trans', 'onex', 'essentiel'], ['adrien', 'Adrien', 31, 'homme', 'thonex', 'visibilite'],
    ['marco', 'Marco', 35, 'homme', 'eaux-vives', 'essentiel'], ['samuel', 'Samuel', 28, 'homme', 'servette', 'essentiel'],
    ['x-aiko', 'Aiko', 29, 'masseuse', 'eaux-vives', 'essentiel'], ['x-rosa', 'Rosa', 41, 'masseuse', 'servette', 'visibilite'], ['x-vera', 'Vera', 37, 'bdsm', 'jonction', 'premium'], ['x-lexa', 'Lexa', 33, 'bdsm', 'carouge', 'essentiel'],
    ['clara-hugo', 'Clara & Hugo', '30 · 34', 'duo', 'cologny', 'duo'], ['mia-leo', 'Mia & Léo', '27 · 31', 'duo', 'champel', 'duo'], ['lena-sofia', 'Lena & Sofia', '26 · 29', 'duo', 'eaux-vives', 'duo'], ['eva-marc', 'Eva & Marc', '33 · 36', 'duo', 'carouge', 'duo'],
  ].map(([id, name, age, cat, commune, plan]) => ({ id, name, age, cat, commune, plan, photos: id === 'alma' ? ['alma'] : [], importe: false }));
  const CAT = { femme: 'Escorte', trans: 'Escorte trans', homme: 'Escort homme', duo: 'Duo', masseuse: 'Masseuse', bdsm: 'BDSM' };
  const STATUS = { // actif par défaut
    lina: 'pause', sofia: 'pause', bianca: 'pause', marco: 'pause', 'eva-marc': 'pause',
    zoe: 'attente', samuel: 'attente', 'x-lexa': 'attente', 'x-aiko': 'attente',
    leila: 'suspendu', alexia: 'suspendu', 'x-rosa': 'suspendu',
  };
  const LAUSANNE = ['zoe', 'samuel', 'x-lexa'];
  const UNPAID = { alexia: 24, 'x-rosa': 21, kiara: 11, adrien: 4 }; // jours de retard
  const BY_INVOICE = ['maya', 'valentina', 'x-vera', 'nora'];
  const TWINT = ['jade', 'ines', 'luna', 'imp-lou', 'imp-emily'];
  const PAYING12 = ['imp-pamela', 'imp-sarah', 'imp-lou', 'imp-emily']; // ont déjà dépassé l'offre de lancement
  const PLAN = { essentiel: ['Présence', 149], visibilite: ['Visibilité', 249], premium: ['Accompagnement', 399], duo: ['Duo / couple', 299] };
  const SITE = (V.PROFILES || []).filter((p) => p.importe);
  const base = SITE.map((p) => ({ id: p.id, name: p.name, age: p.age, cat: p.cat, commune: p.commune, plan: p.plan, photos: p.photos || [], importe: true, site: p }));
  const PROS = [...base, ...FILL].map((p, i) => {
    const imp = p.importe;
    const status = STATUS[p.id] || 'actif';
    const joined = imp ? (PAYING12.includes(p.id) ? 64 + i * 3 : 6 + Math.round(R(i + 3) * 40)) : 75 + Math.round(R(i + 7) * 330);
    const mediaLast = p.id === 'bianca' ? 96 : p.id === 'elena' ? 87 : imp ? Math.min(joined, 3 + Math.round(R(i + 11) * 50)) : 4 + Math.round(R(i + 11) * 80);
    const itwLast = imp ? joined : 15 + Math.round(R(i + 13) * 160);
    const pay = UNPAID[p.id] ? 'impayé' : imp ? (PAYING12.includes(p.id) ? 'à jour' : 'lancement') : BY_INVOICE.includes(p.id) ? 'facture' : 'à jour';
    const live = imp && V.statusOf ? V.statusOf(p.site).t === 'now' : status === 'actif' && R(i + 23) > .66;
    return {
      ...p, i,
      catLabel: CAT[p.cat] || 'Escorte',
      city: LAUSANNE.includes(p.id) ? 'Lausanne' : 'Genève',
      status, pay, late: UNPAID[p.id] || 0,
      method: BY_INVOICE.includes(p.id) ? 'Facture (virement)' : TWINT.includes(p.id) ? 'TWINT' : 'Carte',
      planName: PLAN[p.plan] ? PLAN[p.plan][0] : 'Visibilité', price: PLAN[p.plan] ? PLAN[p.plan][1] : 249,
      from: imp ? p.site.from : null, langs: imp ? p.site.langs : null,
      joined: at(-joined, 9 + Math.round(R(i) * 8), Math.round(R(i + 1) * 5) * 10),
      mediaLast: at(-mediaLast, 11, 20), mediaNext: at(90 - mediaLast, 11, 20), mediaDue: 90 - mediaLast,
      itwLast: at(-itwLast, 14, 0), itwNext: at(182 - itwLast, 14, 0), itwDue: 182 - itwLast,
      views: Math.round((imp ? 1400 : 380) + R(i + 17) * 2400), contacts: Math.round((imp ? 70 : 20) + R(i + 19) * 190),
      credits: [0, 6, 18, 4, 30, 2][i % 6],
      now: live,
      email: `${p.name.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '').slice(0, 1)}••••@${pick(['proton.me', 'gmail.com', 'icloud.com', 'outlook.com'], i + 5)}`,
      lastLogin: ago(20 + Math.round(R(i + 29) * 6000)),
      prepared: status === 'attente' ? (p.id === 'x-aiko' ? 'corrections' : 'envoyé') : 'validé',
      preparedBy: pick(['S. B.', 'A. R.', 'J. P.'], i + 31),
    };
  });
  const byId = (id) => PROS.find((p) => p.id === id);
  const photo = (p, k = 0) => (p && p.photos && p.photos.length ? V.img(p.photos[k % p.photos.length], 's') : '');
  PROS.forEach((p) => {
    p.badges = p.status === 'attente' ? [] : [
      { k: 'Identité vérifiée', d: at(-Math.max(5, Math.round((Date.now() - p.joined) / DAY)) + 1, 10, 0) },
      { k: 'Photos vérifiées', d: p.mediaLast },
      { k: 'Indépendance confirmée', d: p.itwLast },
      ...(p.importe && Date.now() - p.joined < 14 * DAY ? [{ k: 'Nouvelle arrivée', d: p.joined, until: new Date(p.joined.getTime() + 14 * DAY) }] : []),
      ...(p.cat === 'duo' ? [{ k: 'Duo vérifié', d: p.itwLast }] : []),
    ];
  });
  /* Contrôles planifiés : BD propose une date, la professionnelle confirme ou reporte */
  const PLANNED = [
    ['imp-marion', 2, 14, 0, 'confirmé', 'Bureau'], ['bianca', 1, 11, 30, 'reporté', 'Visio'], ['imp-sarah', 5, 16, 0, 'proposé', 'Visio'], ['elena', 3, 10, 0, 'confirmé', 'Bureau'],
    ['imp-lou', 8, 15, 30, 'proposé', 'Visio'], ['x-vera', 6, 9, 30, 'proposé', 'Bureau'], ['clara-hugo', 4, 18, 0, 'confirmé', 'Bureau'], ['kiara', 9, 13, 0, 'reporté', 'Visio'],
  ].map(([id, d, h, m, state, mode], k) => ({ id, when: at(d, h, m), state, mode, kind: k % 3 === 1 ? 'Entretien d’indépendance' : 'Contrôle médias (selfie)', from: state === 'reporté' ? at(d - 3, h, m) : null, by: state === 'proposé' ? 'BD' : 'La professionnelle' }));

  /* ---------- Candidatures et admission ---------- */
  const CAND = [
    ['c1', 'Daria', 27, 'Escorte', 1, 'en vérification', 1, 'Vérifiée', 'Concordants (96 %)', 'Planifié', 'daria'],
    ['c2', 'Mélodie', 31, 'Escorte', 1, 'en vérification', 1, 'Vérifiée', 'À vérifier (2 photos)', 'Fait', ''],
    ['c3', 'Yasmine', 25, 'Escorte', 2, 'en vérification', 1, 'En cours', 'À faire', 'À planifier', ''],
    ['c4', 'Paula & Iris', '28 · 26', 'Duo', 3, 'à compléter', 1, '1 sur 2', 'À vérifier', 'À planifier', ''],
    ['c5', 'Tess', 30, 'Masseuse', 0, 'reçu', 0, '—', '—', '—', ''],
    ['c6', 'Noémie', 24, 'Escorte', 0, 'reçu', 0, '—', '—', '—', ''],
    ['c7', 'Ilona', 35, 'BDSM', 0, 'reçu', 0, '—', '—', '—', ''],
    ['c8', 'Rafael', 29, 'Escort homme', 1, 'reçu', 0, '—', '—', '—', ''],
    ['c9', 'Kenza', 26, 'Escorte', 4, 'à compléter', 0, 'À refaire (photo floue)', '—', '—', ''],
    ['c10', 'Lisa', 33, 'Escorte trans', 5, 'à compléter', 1, 'Vérifiée', 'Photos manquantes', 'À planifier', ''],
    ['c11', 'Ambre', 28, 'Escorte', 3, 'en vérification', 1, 'Vérifiée', 'Concordants (91 %)', 'Demain', ''],
    ['c12', 'Selma', 32, 'Escorte', 6, 'accepté', 3, 'Vérifiée', 'Concordants (94 %)', 'Fait', ''],
    ['c13', 'Inga', 27, 'Masseuse', 8, 'accepté', 4, 'Vérifiée', 'Concordants (97 %)', 'Fait', ''],
    ['c14', 'Chloé', 23, 'Escorte', 9, 'accepté', 2, 'Vérifiée', 'Concordants (92 %)', 'Fait', ''],
    ['c15', 'Mara', 22, 'Escorte', 7, 'refusé', 1, 'Échec (document non valable)', '—', '—', ''],
    ['c16', '« Agence Prestige »', '—', 'Escorte', 12, 'refusé', 0, '—', '—', '—', ''],
  ].map(([id, name, age, cat, d, status, step, kyc, media, itw, img], k) => ({
    id, ref: `A-2026-${String(118 - k).padStart(4, '0')}`, name, age, cat, received: at(-d, 8 + (k * 5) % 12, (k * 17) % 60), status, step, kyc, media, itw, img,
    owner: pick(['S. B.', 'A. R.', 'J. P.', '—'], k + 41), plan: step >= 2 ? pick(['Visibilité', 'Présence', 'Accompagnement'], k + 2) : '—', billing: step >= 3 ? (k % 2 ? 'Facture' : 'Abonnement carte') : '—',
    missing: id === 'c4' ? ['Vérification de la seconde personne', 'Accord écrit du duo'] : id === 'c9' ? ['Nouvelle photo de la pièce (floue)'] : id === 'c10' ? ['Au moins 3 photos', 'Selfie de comparaison'] : [],
    why: id === 'c15' ? 'Document d’identité non valable (copie d’écran). La candidate peut refaire la vérification.' : id === 'c16' ? 'Dossier déposé par un tiers (agence). BD n’accepte que des professionnelles indépendantes.' : '',
  }));
  const STEPS = ['Dossier', 'Validation', 'Offre', 'Abonnement ou facture', 'Publication'];

  /* ---------- Modération : photos, vidéos, textes (file complète) ---------- */
  const MOD_SRC = [
    ['imp-nina', 'photo', 0, .12, [], 'à revoir'], ['imp-julie', 'photo', 1, .08, [], 'à revoir'], ['maya', 'texte', 2, .31, ['Numéro de téléphone dans le texte'], 'à revoir'],
    ['zoe', 'photo', 3, .86, ['Doublon trouvé sur le web (réseau social personnel)'], 'à revoir'], ['imp-lana', 'vidéo', 4, .22, [], 'à revoir'], ['camille', 'photo', 5, .91, ['Visage pouvant sembler mineur : à vérifier'], 'à revoir'],
    ['imp-sarah', 'photo', 6, .05, [], 'validé'], ['imp-oceane', 'texte', 7, .44, ['Lien externe dans le texte'], 'refusé'], ['imp-pamela', 'vidéo', 8, .17, [], 'validé'],
    ['leila', 'photo', 9, .88, ['Nudité explicite détectée'], 'bloqué'], ['imp-marion', 'photo', 10, .09, [], 'validé'], ['adrien', 'texte', 11, .12, [], 'validé'],
    ['imp-gwen', 'photo', 12, .27, [], 'à revoir'], ['imp-nina', 'photo', 13, .14, [], 'validé'], ['x-vera', 'texte', 14, .38, ['Terme à vérifier dans la liste des pratiques'], 'à revoir'],
    ['imp-cindy', 'vidéo', 15, .19, [], 'à revoir'], ['imp-julie', 'photo', 16, .07, [], 'validé'], ['x-lexa', 'photo', 17, .83, ['Filigrane d’un autre site'], 'refusé'],
    ['imp-dreirys', 'photo', 18, .1, [], 'à revoir'], ['imp-emily', 'photo', 19, .11, [], 'à revoir'],
  ];
  const TEXTS = { maya: 'Ingénieure le jour, amoureuse de jazz le soir. Écrivez-moi au 079 ••• •• 12 pour…', 'imp-oceane': 'Disponible aussi sur mon site perso (lien), réservations…', adrien: 'Discret, attentionné, je me déplace dans tout le canton.', 'x-vera': 'Domination douce à stricte, jeux de rôle, bondage léger, sur rendez-vous.', kiara: 'Douce et pétillante, je reçois dans un appartement calme aux Eaux-Vives.' };
  const MOTIFS = { refusé: ['Coordonnées dans le texte : retirées du texte public', 'Image provenant d’un autre site (filigrane)'], bloqué: ['Nudité explicite : interdite sur la plateforme'] };
  const MOD = MOD_SRC.map(([who, type, k, score, flags, state], n) => {
    const p = byId(who) || PROS[0];
    const done = state !== 'à revoir';
    return {
      id: 'm' + (n + 1), who, type, score, flags, state, prio: flags.length > 0 && score >= .8,
      sent: ago(25 + n * 97 + Math.round(R(n + 61) * 60)), text: type === 'texte' ? (TEXTS[who] || 'Présentation mise à jour.') : '', dur: type === 'vidéo' ? `0:${String(12 + (n * 7) % 40).padStart(2, '0')}` : '',
      img: photo(p, k), versions: [{ v: 1, d: ago(25 + n * 97 + 400), note: type === 'texte' ? 'Texte initial' : 'Envoi initial' }, ...(n % 3 === 0 ? [{ v: 2, d: ago(25 + n * 97 + 60), note: type === 'texte' ? 'Texte corrigé par la professionnelle' : 'Recadrée par la professionnelle' }] : [])],
      decision: done ? { by: pick(['Modération · S. B.', 'Modération · J. P.', 'Admin · A. R.'], n + 3), at: ago(10 + n * 61), motif: state === 'validé' ? 'Conforme' : MOTIFS[state][n % MOTIFS[state].length], msg: state === 'validé' ? '' : 'Message envoyé à la professionnelle avec la marche à suivre.' } : null,
    };
  });

  /* ---------- Signalements : file privée, numéro de dossier ---------- */
  const URG = ['Urgente', 'Élevée', 'Normale', 'Basse'];
  const REP = [
    [0, 'Contrainte ou traite suspectée', 'c2', 'Visiteur anonyme', 35, 'En cours', null, null],
    [0, 'Personne qui semble mineure', 'camille', 'Professionnelle vérifiée', 140, 'En cours', null, null],
    [1, 'Photos non conformes', 'leila', 'Client inscrit', 1500, 'Sanction appliquée', 'Suspension 7 jours', null],
    [1, 'Faux profil (photos volées)', 'jade', 'Visiteur anonyme', 2300, 'Nouveau', null, null],
    [1, 'Comportement dangereux d’un client', 'Compte client « marc.g »', 'Professionnelle vérifiée', 2900, 'Sanction appliquée', 'Bannissement', null],
    [2, 'Arnaque (acompte demandé)', 'Numéro +41 76 ••• •• 55', 'Professionnelle vérifiée', 3600, 'En cours', null, null],
    [2, 'Tarifs différents de la fiche', 'alexia', 'Client inscrit', 5200, 'Contesté', 'Avertissement', { text: 'Les tarifs avaient changé le jour même, la fiche était à jour à 18 h.', state: 'En examen' }],
    [2, 'Profil indisponible depuis longtemps', 'bianca', 'Visiteur anonyme', 7100, 'Clos', null, null],
    [2, 'Message insistant d’un client', 'Compte client « j.dupont »', 'Professionnelle vérifiée', 8400, 'Sanction appliquée', 'Avertissement', null],
    [3, 'Photo floue', 'imp-gwen', 'Visiteur anonyme', 9800, 'Clos', null, null],
    [3, 'Autre (langue mal indiquée)', 'imp-lou', 'Client inscrit', 12000, 'Clos', null, null],
    [2, 'Retard de paiement contesté', 'x-rosa', 'Équipe BD', 14200, 'Contesté', 'Suspension 7 jours', { text: 'Paiement fait par virement le 3, merci de vérifier.', state: 'Acceptée' }],
  ].map(([u, motif, target, by, min, status, sanction, contest], k) => {
    const rec = ago(min);
    const t = byId(target);
    const h = [{ at: rec, who: 'Système', what: `Signalement reçu, accusé de réception envoyé (dossier S-2026-${String(214 - k).padStart(4, '0')})` }];
    if (u === 0) h.push({ at: ago(min - 4), who: 'Système', what: 'Alerte urgente envoyée à l’équipe d’astreinte' });
    if (u === 0 && t) h.push({ at: ago(min - 9), who: 'Admin · A. R.', what: 'Profil masqué à titre conservatoire' });
    if (status !== 'Nouveau') h.push({ at: ago(Math.max(5, min - 30)), who: pick(['Modération · S. B.', 'Admin · A. R.'], k), what: 'Dossier pris en charge' });
    if (sanction) h.push({ at: ago(Math.max(3, min - 300)), who: 'Admin · A. R.', what: `${sanction} : motif communiqué à la personne concernée` });
    if (contest) h.push({ at: ago(Math.max(2, min - 900)), who: t ? t.name : 'Personne concernée', what: 'Contestation déposée' });
    if (contest && contest.state === 'Acceptée') h.push({ at: ago(Math.max(1, min - 1200)), who: 'Admin · A. R.', what: 'Contestation acceptée, sanction levée' });
    if (status === 'Clos') h.push({ at: ago(Math.max(1, min - 600)), who: 'Modération · S. B.', what: 'Clos sans suite : vérifié, rien à reprocher' });
    return { id: 'r' + (k + 1), ref: `S-2026-${String(214 - k).padStart(4, '0')}`, u, urg: URG[u], motif, target, t, by, rec, status, sanction, contest, owner: status === 'Nouveau' ? '—' : pick(['S. B.', 'A. R.', 'J. P.'], k + 9), history: h };
  });

  /* ---------- Coffre des justificatifs ---------- */
  const VAULT_DOCS = [
    ['Vérification d’identité', 'Résultat du prestataire : document authentique, personne majeure', 'Durée du compte + 12 mois'],
    ['Concordance selfie et photos', 'Score de ressemblance, selfie supprimé après 30 jours', 'Score : durée du compte'],
    ['Entretien d’indépendance', 'Compte rendu confidentiel de l’équipe', 'Durée du compte + 24 mois'],
    ['Consentement à la publication', 'Signature électronique des photos publiées', 'Durée du compte + 36 mois'],
    ['Conditions acceptées', 'Version des conditions et date d’acceptation', 'Durée du compte + 10 ans'],
  ];
  const VAULT = PROS.filter((p) => p.status !== 'attente').slice(0, 24).map((p, k) => ({
    id: 'v' + (k + 1), who: p.id, name: p.name, docs: VAULT_DOCS.length + (p.cat === 'duo' ? 1 : 0), kyc: `KYC-${(48213 + k * 37).toString(36).toUpperCase()}`,
    checked: p.badges[0] ? p.badges[0].d : p.joined, last: ago(200 + k * 1300), end: p.status === 'suspendu' ? at(30 + k, 0, 0) : null,
  }));
  const VAULT_LOG = [
    [45, 'S. B.', 'Admission', 'Daria', 'Entretien d’indépendance', 'Préparer l’entretien de demain'],
    [210, 'A. R.', 'Administration', 'Mélodie (dossier)', 'Vérification d’identité', 'Signalement urgent S-2026-0214'],
    [1250, 'A. R.', 'Administration', 'Leïla', 'Consentement à la publication', 'Signalement S-2026-0212 (photos)'],
    [2900, 'J. P.', 'Admission', 'Anya', 'Concordance selfie et photos', 'Contrôle médias à 90 jours'],
    [4300, 'A. R.', 'Administration', 'Alexia', 'Conditions acceptées', 'Contestation S-2026-0208'],
    [6100, 'S. B.', 'Admission', 'Elena', 'Entretien d’indépendance', 'Entretien de suivi à 6 mois'],
    [9900, 'A. R.', 'Administration', 'Camille', 'Vérification d’identité', 'Réquisition PJ-GE-2026-1187'],
  ].map(([m, who, role, name, doc, why]) => ({ at: ago(m), who, role, name, doc, why }));
  const HANDOVER = [
    { at: at(-12, 15, 40), auth: 'Police judiciaire de Genève (brigade de lutte contre la traite)', ref: 'PJ-GE-2026-1187', what: 'Résultat d’identité, compte rendu d’entretien, historique du profil « Camille »', by: 'A. R. et S. B. (double validation)', how: 'Plateforme sécurisée de l’autorité' },
    { at: at(-41, 10, 5), auth: 'Ministère public du canton de Genève', ref: 'MP-2026-3321', what: 'Journal des consultations et dates de publication d’un profil supprimé', by: 'A. R. et S. B. (double validation)', how: 'Remise en main propre, accusé signé' },
  ];
  const PURGE = [['Selfies de comparaison de 7 dossiers', 2], ['Dossier refusé « Mara » (A-2026-0104)', 9], ['Compte supprimé à sa demande (ex-« Kim »)', 18], ['Justificatifs d’un profil fermé en 2025', 33]].map(([what, d]) => ({ what, when: at(d, 3, 0) }));

  /* ---------- Comptes clients (jamais publics) ---------- */
  const CL_NAMES = ['marc.g', 'j.dupont', 'Lucien', 'theo_ge', 'A.M.', 'nico74', 'Philippe', 'samir.k', 'Anonyme 4821', 'Hugo B.', 'Olivier', 'k.w', 'Raphaël', 'Anonyme 3307', 'Daniel', 'm.rossi', 'Yann', 'Stefan', 'p.lemaire', 'Anonyme 1190', 'Ben', 'Karim', 'Jonas', 'L. V.'];
  const CLIENTS = CL_NAMES.map((n, k) => ({
    id: 'k' + (k + 1), pseudo: n, email: `${n.replace(/[^a-z]/gi, '').slice(0, 1).toLowerCase() || 'x'}••••@${pick(['gmail.com', 'bluewin.ch', 'proton.me', 'outlook.com', 'icloud.com'], k + 71)}`,
    created: at(-(12 + Math.round(R(k + 81) * 300)), 20, 15), seen: ago(30 + Math.round(R(k + 83) * 9000)), favs: Math.round(R(k + 85) * 14), hidden: Math.round(R(k + 87) * 4), alerts: Math.round(R(k + 89) * 3),
    lang: pick(['FR', 'FR', 'FR', 'EN', 'DE', 'IT'], k + 91), device: pick(['iPhone', 'Android', 'Ordinateur', 'iPhone'], k + 93),
    status: n === 'marc.g' ? 'Banni' : n === 'j.dupont' ? 'Averti' : k === 13 ? 'Suppression demandée' : 'Actif', reports: n === 'marc.g' ? 2 : n === 'j.dupont' ? 1 : 0, made: k % 7 === 2 ? 1 : 0,
  }));

  /* ---------- Facturation ---------- */
  const payers = PROS.filter((p) => p.status !== 'attente');
  const INV = [];
  let seq = 12;
  [-1, 0].forEach((mo) => payers.forEach((p, k) => {
    if (p.pay === 'lancement' && mo === -1) return;
    const issued = at(mo * 30 - 22 + (k % 3), 6, 0);
    const late = p.pay === 'impayé' && mo === 0;
    const status = p.pay === 'lancement' ? 'Offerte (lancement)' : late ? 'En retard' : p.pay === 'facture' && mo === 0 ? 'En attente' : 'Payée';
    INV.push({ n: `F-2026-${mo ? '09' : '10'}-${String(seq++).padStart(4, '0')}`, who: p.id, name: p.name, what: `Abonnement ${p.planName}`, amount: p.pay === 'lancement' ? 0 : p.price, issued, due: new Date(issued.getTime() + 10 * DAY), status, method: p.method, late: late ? p.late : 0 });
  }));
  ['imp-nina', 'valentina', 'imp-sarah', 'adrien', 'maya', 'imp-pamela', 'nora'].forEach((id, k) => {
    const p = byId(id); const pk = V.CREDITS ? V.CREDITS.packs[k % V.CREDITS.packs.length] : { n: 30, price: 240 };
    INV.push({ n: `F-2026-10-${String(seq++).padStart(4, '0')}`, who: id, name: p.name, what: `Pack ${pk.n} crédits`, amount: pk.price, issued: at(-(2 + k * 3), 19, 10 + k), due: at(-(2 + k * 3), 19, 10 + k), status: 'Payée', method: p.method === 'Facture (virement)' ? 'Carte' : p.method, late: 0 });
  });
  const CREDIT_NOTES = [
    { n: 'AV-2026-0007', who: 'x-rosa', name: 'Rosa', amount: 249, at: at(-3, 10, 12), why: 'Double prélèvement de septembre', inv: 'F-2026-09-0031', state: 'Remboursé sur la carte' },
    { n: 'AV-2026-0006', who: 'bianca', name: 'Bianca', amount: 75, at: at(-9, 16, 40), why: 'Pause demandée le 10 : prorata de 15 jours', inv: 'F-2026-09-0021', state: 'Imputé sur la prochaine facture' },
    { n: 'AV-2026-0005', who: 'imp-pamela', name: 'Pamela', amount: 30, at: at(-14, 9, 5), why: 'Mise en avant interrompue (panne de 2 h)', inv: '—', state: 'Rendu en crédits (4 crédits)' },
  ];
  const BANK = [
    ...INV.filter((x) => x.status === 'Payée').slice(0, 18).map((x, k) => ({ at: new Date(x.issued.getTime() + (k % 4) * 36e5 * 7), src: x.method === 'TWINT' ? 'TWINT' : x.method === 'Carte' ? 'Prestataire de paiement' : 'Virement bancaire', ref: x.method === 'Carte' ? `pi_${(73120 + k * 911).toString(36)}` : x.method === 'TWINT' ? `TW-${88120 + k * 7}` : x.n, amount: x.amount, inv: x.n, ok: true })),
    { at: at(-2, 8, 41), src: 'Virement bancaire', ref: 'Sans référence · « R. S. »', amount: 249, inv: '', ok: false },
    { at: at(-1, 21, 3), src: 'TWINT', ref: 'TW-90311', amount: 90, inv: '', ok: false },
  ].sort((a, b) => b.at - a.at);
  const DUNNING = PROS.filter((p) => p.pay === 'impayé').map((p) => ({ who: p.id, name: p.name, amount: p.price, late: p.late, steps: [['Rappel aimable', 3], ['Deuxième rappel', 10], ['Suspension de la publication', 20]].map(([l, d]) => ({ l, d, done: p.late >= d, at: at(-(p.late - d), 9, 0) })) }));
  const FREE = [
    ...PROS.filter((p) => p.pay === 'lancement').slice(0, 8).map((p) => ({ who: p.id, name: p.name, why: 'Offre de lancement', months: 2, until: new Date(p.joined.getTime() + 61 * DAY) })),
    { who: 'imp-nina', name: 'Nina', why: 'Parrainage (marraine de Selma)', months: 1, until: at(92, 0, 0) }, { who: 'alma', name: 'Alma', why: 'Parrainage (marraine de Inga)', months: 1, until: at(64, 0, 0) },
  ];
  const PROMOS = [
    { code: 'LANCEMENT2M', what: '2 mois offerts', used: 31, max: 60, until: at(61, 23, 59), state: 'Actif' },
    { code: 'MARRAINE', what: '1 mois offert (parrainage)', used: 4, max: null, until: null, state: 'Actif' },
    { code: 'SHOOT-OCT', what: 'Shooting photo à CHF 290', used: 9, max: 15, until: at(12, 23, 59), state: 'Actif' },
    { code: 'RENTREE25', what: '-20 % pendant 3 mois', used: 18, max: 20, until: at(-40, 23, 59), state: 'Expiré' },
  ];

  /* ---------- Mises en avant et parrainage ---------- */
  const ZONES = [['Canton', 6], ['Eaux-Vives', 3], ['Pâquis', 3], ['Plainpalais', 3], ['Champel', 3], ['Carouge', 3], ['Cologny', 3], ['Versoix', 3], ['Jonction', 3]];
  const OCC = ZONES.map(([z, max], r) => ({ z, max, days: Array.from({ length: 14 }, (_, d) => Math.min(max, Math.round(R(r * 31 + d * 7) * (max + (d < 3 ? 1.6 : .4))))) }));
  const LABELS = ['À la une', 'Sélection BD', 'Nouvelle à Genève'];
  const CAMP = [
    ['imp-pamela', 'Canton', -2, 7, 'En cours'], ['imp-sarah', 'Canton', -3, 7, 'En cours'], ['imp-gwen', 'Versoix', -1, 7, 'En cours'], ['imp-nina', 'Eaux-Vives', 0, 3, 'En cours'],
    ['imp-marion', 'Carouge', -1, 8, 'En cours'], ['maya', 'Champel', 2, 5, 'Programmée'], ['imp-julie', 'Pâquis', 4, 3, 'Programmée'], ['nora', 'Cologny', -16, 7, 'Terminée'],
    ['imp-lou', 'Plainpalais', -12, 5, 'Terminée'], ['adrien', 'Jonction', -20, 7, 'Terminée'], ['imp-emily', 'Jonction', -9, 3, 'Terminée'],
  ].map(([who, zone, start, days, state], k) => {
    const p = byId(who); const cost = zone === 'Canton' ? (V.CREDITS ? V.CREDITS.cost.canton : 5) : (V.CREDITS ? V.CREDITS.cost.zone : 3);
    const before = Math.round(60 + R(k + 101) * 90), lift = 1.6 + R(k + 103) * 1.6;
    return { id: 'cp' + (k + 1), who, name: p.name, zone, start: at(start, 0, 0), end: at(start + days, 23, 59), days, credits: cost * days, chf: Math.round(cost * days * 7.5), label: LABELS[k % 3], state,
      views: [before * 7, state === 'Programmée' ? 0 : Math.round(before * lift * Math.min(days, start < 0 ? -start + 1 : days)), state === 'Terminée' ? Math.round(before * 1.18 * 7) : 0],
      contacts: [Math.round(before * .055 * 7), state === 'Programmée' ? 0 : Math.round(before * lift * .06 * Math.min(days, start < 0 ? -start + 1 : days)), state === 'Terminée' ? Math.round(before * .062 * 7) : 0] };
  });
  /* Solde de crédits : inclus dans la formule + packs achetés - campagnes */
  PROS.forEach((p) => {
    const inc = p.plan === 'premium' ? 18 : p.plan === 'visibilite' ? 6 : 0;
    p.bought = INV.filter((x) => x.who === p.id && x.what.startsWith('Pack')).reduce((a, x) => a + parseInt(x.what.replace(/\D/g, ''), 10), 0);
    p.used = CAMP.filter((c) => c.who === p.id && c.state !== 'Programmée').reduce((a, c) => a + c.credits, 0);
    p.credits = p.status === 'attente' ? 0 : Math.max(0, inc + p.bought - p.used);
  });
  const REFERRALS = [
    { who: 'imp-nina', name: 'Nina', code: 'NINA-BD7', kids: [['Selma', 'Abonnée depuis 2 mois', true], ['Chloé', 'Validée, 1er mois en cours', false]], won: 1 },
    { who: 'alma', name: 'Alma', code: 'ALMA-BD2', kids: [['Inga', 'Abonnée depuis 2 mois', true]], won: 1 },
    { who: 'maya', name: 'Maya', code: 'MAYA-BD4', kids: [['Ambre', 'Dossier en vérification', false]], won: 0 },
    { who: 'imp-julie', name: 'Julie', code: 'JULIE-BD1', kids: [], won: 0 },
    { who: 'valentina', name: 'Valentina', code: 'VALE-BD9', kids: [['« Agence Prestige »', 'Refusé (tiers)', false]], won: 0 },
  ];

  /* ---------- Séries quotidiennes sur un an (tableau de bord, comparaison de périodes) ---------- */
  const SERIES = Array.from({ length: 365 }, (_, k) => {
    const d = 364 - k; const wd = new Date(Date.now() - d * DAY).getDay(); const growth = 1 + (365 - d) / 365 * .9;
    return { d, signups: Math.round(R(k + 301) * 2.2 * growth), valid: Math.round(R(k + 307) * 1.6 * growth), susp: R(k + 311) > .93 ? 1 : 0, rev: Math.round((210 + R(k + 313) * 120) * growth + (wd === 5 || wd === 6 ? 90 : 0)), visits: Math.round((1400 + R(k + 317) * 600) * growth * (wd === 5 || wd === 6 ? 1.3 : 1)) };
  });

  /* ---------- Statistiques ---------- */
  const STATS = {
    filters: [['Disponible maintenant', 41], ['Langue : anglais', 27], ['Quartier : Eaux-Vives', 19], ['Se déplace', 17], ['Budget jusqu’à 300', 15], ['Catégorie : duos', 9], ['Langue : allemand', 8], ['Silhouette : pulpeuse', 6]],
    zero: [['Lausanne', 31, 'Ville pas encore ouverte'], ['Massage tantrique', 14, 'Catégorie Masseuses à enrichir'], ['Langue : suédois', 9, '—'], ['Meyrin + se déplace + ce soir', 7, '—'], ['Escort homme + duo', 5, '—'], ['Budget moins de 150', 4, '—']],
    use: { views: 48210, favs: 6120, cmp: 1206, contacts: 2318, abandon: 37 },
    channels: [['WhatsApp', 58], ['Appel', 26], ['SMS', 16]],
    devices: [['Mobile', 78], ['Ordinateur', 18], ['Tablette', 4]],
    langs: [['Français', 58], ['Anglais', 24], ['Allemand', 8], ['Italien', 5], ['Autres', 5]],
    origin: [['Suisse', 61], ['France', 22], ['Italie', 4], ['Royaume-Uni', 3], ['Autres', 10]],
    traffic: [['Recherche naturelle', 'naturel', 9120, 2.1], ['Accès direct', 'naturel', 5230, 3.4], ['Sites partenaires', 'naturel', 1480, 1.6], ['Annonces payantes', 'payant', 1860, 1.2], ['Partenariats sponsorisés', 'payant', 550, 0.9]],
    declared: { clicks: 2318, msgs: 412, rdv: 167 },
    excluded: { bots: 12480, tests: 214 },
  };
  const FEEDBACK = [
    [60, 'imp-nina', 'Contact du 22.10 via WhatsApp', 'Positif', 'Ponctuel et respectueux, aucun souci.', 'Aucune'],
    [210, 'maya', 'Compte client « j.dupont »', 'Négatif', 'Messages insistants après refus.', 'Transmis aux signalements (S-2026-0206)'],
    [400, 'BD', 'Professionnelle « Kiara »', 'Sans réponse', 'Relance sur la facture d’octobre restée sans réponse.', 'Deuxième rappel envoyé'],
    [700, 'imp-julie', 'Contact du 21.10 via appel', 'Positif', 'Client poli, rendez-vous honoré.', 'Aucune'],
    [1300, 'camille', 'Compte client « marc.g »', 'Négatif', 'Comportement menaçant, refus de partir.', 'Compte banni (S-2026-0210)'],
    [1900, 'imp-lou', 'Contact du 20.10 via SMS', 'Sans réponse', 'Le client n’est pas venu, pas de nouvelles.', 'Aucune'],
    [2600, 'BD', 'Professionnelle « Elena »', 'Positif', 'Entretien de suivi : tout va bien, souhaite plus de visibilité.', 'Proposition de mise en avant'],
    [3500, 'valentina', 'Contact du 19.10 via WhatsApp', 'Positif', 'Très correct.', 'Aucune'],
    [4700, 'adrien', 'Contact du 18.10 via appel', 'Négatif', 'Annulation au dernier moment, troisième fois.', 'Aucune (pas de sanction automatique)'],
    [6200, 'BD', 'Professionnelle « Bianca »', 'Sans réponse', 'Contrôle médias en retard, deux messages restés sans réponse.', 'Profil mis en pause'],
    [8000, 'imp-sarah', 'Contact du 17.10 via WhatsApp', 'Positif', 'Rien à signaler.', 'Aucune'],
    [9800, 'luna', 'Contact du 16.10 via SMS', 'Négatif', 'Propos irrespectueux par message.', 'Client averti'],
  ].map(([m, from, about, kind, text, next], k) => ({ id: 'f' + (k + 1), at: ago(m), from, fromName: from === 'BD' ? 'Équipe BD' : (byId(from) || {}).name, about, kind, text, next }));

  /* ---------- Référentiels et villes ---------- */
  const CITIES = [
    { name: 'Genève', state: 'Ouverte', since: at(-30, 0, 0), pros: PROS.filter((p) => p.city === 'Genève').length, pre: 0 },
    { name: 'Lausanne', state: 'Ouverture prochainement', since: at(75, 0, 0), pros: 3, pre: 23 },
    { name: 'Montreux · Vevey', state: 'Ouverture prochainement', since: at(140, 0, 0), pros: 0, pre: 6 },
    { name: 'Neuchâtel', state: 'Fermée', since: null, pros: 0, pre: 4 },
    { name: 'Fribourg', state: 'Fermée', since: null, pros: 0, pre: 2 },
    { name: 'Sion', state: 'Fermée', since: null, pros: 0, pre: 1 },
  ];
  const PRE = ['Lia', 'Romane', 'Kira', 'Sun', 'Mila', 'Hana', 'Zara', 'Eva', 'Nadia', 'Tamara', 'Joy', 'Elsa'].map((n, k) => ({ name: n, city: k < 9 ? 'Lausanne' : 'Montreux · Vevey', cat: pick(['Escorte', 'Escorte', 'Masseuse', 'Escorte trans', 'BDSM'], k + 121), at: at(-(2 + k * 4), 18, 30), src: pick(['Page « Nous rejoindre »', 'Parrainage', 'Bouche-à-oreille'], k + 127) }));
  const LANGS = ['fr', 'en', 'de', 'it', 'es', 'pt', 'ru', 'ar'];
  const PAGES = [['Accueil', 0], ['Nous rejoindre', 0], ['Sécurité', 1], ['Vérifications', 1], ['Conditions d’utilisation', 2], ['Confidentialité', 2], ['FAQ visiteurs (14 questions)', 3], ['FAQ professionnelles (18 questions)', 4]].map(([t, s]) => ({ t, st: LANGS.map((l, k) => (k < 2 ? 'ok' : k < 6 - s % 3 ? (R(s * 9 + k) > .3 ? 'ok' : 'rev') : R(s * 13 + k) > .5 ? 'rev' : 'miss')) }));

  /* ---------- Messages (e-mails et SMS) ---------- */
  const TPL = [
    ['Inscription reçue', 'E-mail', 'Votre demande BD'], ['Dossier à compléter', 'E-mail + SMS', 'Votre dossier BD'], ['Profil publié', 'E-mail', 'Votre compte BD'], ['Contrôle à venir', 'E-mail + SMS', 'Rappel BD'],
    ['Contrôle reporté ou confirmé', 'E-mail', 'Rendez-vous BD'], ['Facture émise', 'E-mail', 'Votre facture BD'], ['Rappel de paiement', 'E-mail + SMS', 'Rappel BD'], ['Publication suspendue', 'E-mail + SMS', 'Votre compte BD'],
    ['Statut « Disponible » expiré', 'Notification', 'BD'], ['Signalement : accusé de réception', 'E-mail', 'Votre dossier BD'], ['Code de connexion', 'SMS', 'BD'], ['Alerte client (nouveau profil)', 'E-mail', 'Nouveautés BD'],
  ];
  const MSG = Array.from({ length: 32 }, (_, k) => {
    const [trg, ch, subj] = TPL[(k * 5) % TPL.length]; const p = PROS[(k * 7) % PROS.length]; const client = trg.startsWith('Alerte client') || trg.startsWith('Signalement');
    const channel = ch === 'E-mail + SMS' ? (k % 2 ? 'SMS' : 'E-mail') : ch;
    const fail = k === 3 ? 'Numéro invalide' : k === 11 ? 'Boîte de réception pleine' : k === 19 ? 'Refusé par l’opérateur' : k === 26 ? 'Adresse inexistante' : '';
    return { id: 'e' + (k + 1), at: ago(8 + k * 173 + Math.round(R(k + 141) * 90)), trg, to: client ? (CLIENTS[k % CLIENTS.length].email) : channel === 'SMS' ? `+41 7${k % 9} ••• •• ${String(10 + k * 3).slice(-2)}` : p.email, toName: client ? CLIENTS[k % CLIENTS.length].pseudo : p.name, channel, lang: pick(['FR', 'FR', 'FR', 'EN', 'DE', 'IT', 'ES', 'PT'], k + 151), subj, state: fail ? 'Échec' : channel === 'SMS' ? 'Délivré' : k % 4 ? 'Délivré' : 'Ouvert', fail };
  });

  /* ---------- Équipe, rôles, journal ---------- */
  const ROLES = ['Administration', 'Admission', 'Modération', 'Support', 'Finances'];
  const AREAS = [
    ['Tableau de bord', ['Tout', 'Lecture', 'Lecture', 'Lecture', 'Lecture']], ['Candidatures et admission', ['Tout', 'Tout', 'Lecture', '—', '—']], ['Coffre des justificatifs', ['Avec motif', 'Avec motif', '—', '—', '—']],
    ['Modération des contenus', ['Tout', 'Lecture', 'Tout', '—', '—']], ['Signalements', ['Tout', 'Lecture', 'Tout', 'Créer', '—']], ['Professionnelles', ['Tout', 'Tout', 'Lecture', 'Sans données sensibles', 'Formule et paiements']],
    ['Comptes clients', ['Tout', '—', 'Lecture', 'Sans données sensibles', '—']], ['Facturation', ['Tout', '—', '—', 'Lecture', 'Tout']], ['Mises en avant et parrainage', ['Tout', '—', '—', 'Lecture', 'Tout']],
    ['Statistiques', ['Tout', 'Lecture', 'Lecture', '—', 'Lecture']], ['Référentiels, pages et messages', ['Tout', '—', 'Lecture', 'Lecture', '—']], ['Paramètres, rôles et journal', ['Tout', '—', '—', '—', '—']],
  ];
  const TEAM = [
    { n: 'A. R.', role: 'Administration', mfa: 'Clé de sécurité', last: ago(2) }, { n: 'S. B.', role: 'Admission · Modération', mfa: 'Application d’authentification', last: ago(38) },
    { n: 'J. P.', role: 'Modération', mfa: 'Application d’authentification', last: ago(260) }, { n: 'L. M.', role: 'Support', mfa: 'Application d’authentification', last: ago(1400) }, { n: 'C. D.', role: 'Finances', mfa: 'Clé de sécurité', last: ago(3100) },
  ];
  const AUD_SRC = [
    [6, 'A. R.', 'Administration', 'Consultation du coffre', 'Mélodie (dossier A-2026-0117)'], [14, 'Système', '—', 'Statut « Disponible maintenant » expiré (60 min)', 'Julie'], [21, 'S. B.', 'Admission', 'Dossier ouvert', 'Daria (A-2026-0118)'],
    [35, 'Système', '—', 'Signalement urgent reçu, alerte envoyée', 'S-2026-0214'], [44, 'A. R.', 'Administration', 'Profil masqué à titre conservatoire', 'Mélodie'], [80, 'J. P.', 'Modération', 'Photo validée', 'Sarah'],
    [130, 'C. D.', 'Finances', 'Avoir émis', 'AV-2026-0007 · Rosa'], [180, 'S. B.', 'Admission', 'Contrôle proposé', 'Valentina · contrôle médias'], [260, 'J. P.', 'Modération', 'Texte refusé avec message', 'Oceane'],
    [400, 'A. R.', 'Administration', 'Export CSV', 'Facturation · factures d’octobre'], [620, 'Système', '—', 'Deuxième rappel de paiement envoyé', 'Kiara'], [900, 'A. R.', 'Administration', 'Bannissement', 'Compte client « marc.g »'],
    [1300, 'L. M.', 'Support', 'Compte client consulté (sans données sensibles)', 'theo_ge'], [1700, 'C. D.', 'Finances', 'Paiement rapproché manuellement', 'F-2026-10-0044'], [2100, 'A. R.', 'Administration', 'Paramètre modifié', 'Seuil de l’IA : 0,85 → 0,80'],
    [2600, 'S. B.', 'Admission', 'Candidature acceptée', 'Chloé (A-2026-0105)'], [3200, 'Système', '—', 'Suspension automatique de la publication (impayé J+20)', 'Rosa'], [3900, 'A. R.', 'Administration', 'Rôle modifié', 'J. P. : Support → Modération'],
    [4600, 'S. B.', 'Admission', 'Profil préparé envoyé à la professionnelle', 'Aiko'], [5600, 'A. R.', 'Administration', 'Remise aux autorités (double validation)', 'PJ-GE-2026-1187'],
  ];
  const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16).padStart(8, '0'); };
  let prev = '00000000';
  const AUDIT = AUD_SRC.slice().reverse().map(([m, who, role, what, obj], k) => { const at2 = ago(m); const h = hash(prev + who + what + obj + at2.getTime()); prev = h; return { n: 4100 + k, at: at2, who, role, what, obj, h }; }).reverse();

  V.ADM = { R, PROS, byId, photo, PLANNED, CAND, STEPS, MOD, REP, URG, VAULT, VAULT_DOCS, VAULT_LOG, HANDOVER, PURGE, CLIENTS, INV, CREDIT_NOTES, BANK, DUNNING, FREE, PROMOS, ZONES, OCC, LABELS, CAMP, REFERRALS, SERIES, STATS, FEEDBACK, CITIES, PRE, LANGS, PAGES, TPL, MSG, ROLES, AREAS, TEAM, AUDIT, hash };
})(window.V);
