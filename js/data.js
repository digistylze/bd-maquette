/* Velours : données fictives de démonstration (aucune personne réelle) */
window.V = window.V || {};
(function (V) {
  'use strict';
  const DAY = 864e5;
  const now = () => new Date();
  const addDays = (n) => new Date(now().getTime() + n * DAY);
  const fmtD = (d, o) => d.toLocaleDateString('fr-CH', o || { day: 'numeric', month: 'long' });
  const fmtShort = (d) => d.toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
  V.date = { DAY, now, addDays, fmtD, fmtShort };

  V.BRAND = { name: 'Velours', domain: 'velours.ch', city: 'Genève' };

  V.CATS = [
    { id: 'all', label: 'Toutes' },
    { id: 'femme', label: 'Femmes' },
    { id: 'trans', label: 'Femmes trans' },
    { id: 'homme', label: 'Hommes' },
    { id: 'duo', label: 'Couples et duos' },
  ];

  V.LANGS = { fr: 'Français', en: 'Anglais', de: 'Allemand', it: 'Italien', es: 'Espagnol', pt: 'Portugais', ru: 'Russe', ar: 'Arabe', uk: 'Ukrainien', zh: 'Mandarin', sv: 'Suédois', th: 'Thaï', ca: 'Catalan', ln: 'Lingala' };
  V.ORIGINS = ['Europe', 'Afrique', 'Amérique latine', 'Asie', 'Moyen-Orient', 'Métisse', 'Non précisée'];
  /* Lieux affichés sur les fiches : quartiers de la ville (c = commune de rattachement) et autres communes */
  V.COMMUNES = [
    { id: 'eaux-vives', label: 'Eaux-Vives', c: 'geneve' }, { id: 'paquis', label: 'Pâquis', c: 'geneve' }, { id: 'plainpalais', label: 'Plainpalais', c: 'geneve' },
    { id: 'carouge', label: 'Carouge' }, { id: 'champel', label: 'Champel', c: 'geneve' }, { id: 'cologny', label: 'Cologny' },
    { id: 'vieille-ville', label: 'Vieille-Ville', c: 'geneve' }, { id: 'servette', label: 'Servette', c: 'geneve' }, { id: 'jonction', label: 'Jonction', c: 'geneve' },
    { id: 'petit-saconnex', label: 'Petit-Saconnex', c: 'geneve' }, { id: 'florissant', label: 'Florissant', c: 'geneve' }, { id: 'chene-bougeries', label: 'Chêne-Bougeries' },
    { id: 'lancy', label: 'Lancy' }, { id: 'meyrin', label: 'Meyrin' }, { id: 'onex', label: 'Onex' },
    { id: 'thonex', label: 'Thônex' }, { id: 'grand-saconnex', label: 'Le Grand-Saconnex' }, { id: 'versoix', label: 'Versoix' },
  ];
  /* Les 45 communes du canton (armoiries dans img/armoiries, domaine public, Wikimedia Commons) */
  V.COMMUNES_GE = [['geneve', 'Genève'], ['aire-la-ville', 'Aire-la-Ville'], ['anieres', 'Anières'], ['avully', 'Avully'], ['avusy', 'Avusy'], ['bardonnex', 'Bardonnex'], ['bellevue', 'Bellevue'], ['bernex', 'Bernex'], ['carouge', 'Carouge'], ['cartigny', 'Cartigny'], ['celigny', 'Céligny'], ['chancy', 'Chancy'], ['chene-bougeries', 'Chêne-Bougeries'], ['chene-bourg', 'Chêne-Bourg'], ['choulex', 'Choulex'], ['collex-bossy', 'Collex-Bossy'], ['collonge-bellerive', 'Collonge-Bellerive'], ['cologny', 'Cologny'], ['confignon', 'Confignon'], ['corsier', 'Corsier'], ['dardagny', 'Dardagny'], ['genthod', 'Genthod'], ['grand-saconnex', 'Le Grand-Saconnex'], ['gy', 'Gy'], ['hermance', 'Hermance'], ['jussy', 'Jussy'], ['laconnex', 'Laconnex'], ['lancy', 'Lancy'], ['meinier', 'Meinier'], ['meyrin', 'Meyrin'], ['onex', 'Onex'], ['perly-certoux', 'Perly-Certoux'], ['plan-les-ouates', 'Plan-les-Ouates'], ['pregny-chambesy', 'Pregny-Chambésy'], ['presinge', 'Presinge'], ['puplinge', 'Puplinge'], ['russin', 'Russin'], ['satigny', 'Satigny'], ['soral', 'Soral'], ['thonex', 'Thônex'], ['troinex', 'Troinex'], ['vandoeuvres', 'Vandœuvres'], ['vernier', 'Vernier'], ['versoix', 'Versoix'], ['veyrier', 'Veyrier']].map(([id, label]) => ({ id, label }));

  /* Catalogue fermé des services (identique dans toutes les langues) */
  V.SERVICES = {
    s1: 'Accompagnement dîner, événement', s2: 'Soirée privée', s3: 'Nuit complète', s4: 'Voyage, week-end',
    s5: 'Massage relaxant', s6: 'Massage sensuel', s7: 'Girlfriend experience (GFE)', s8: 'Rapport protégé',
    s9: 'Duo', s10: 'Couples', s11: 'Jeux de rôle', s12: 'Striptease', s13: 'Lingerie et tenues', s14: 'Domination douce',
    p1: 'Fellation protégée', p2: 'Fellation nature', p3: 'Gorge profonde', p4: '69', p5: 'Cunnilingus',
    p6: 'Embrasse avec la langue', p7: 'Bisous sans la langue', p8: 'Branlette espagnole', p9: 'Masturbation',
    p11: 'Éjaculation sur le corps', p12: 'Éjaculation faciale', p13: 'Éjaculation en bouche',
    p14: 'Sodomie', p15: 'Facesitting', p16: 'Fétichisme des pieds', p17: 'Soumission légère', p18: 'Sextoys',
    p19: 'Douche ensemble', p20: 'Porn star experience (PSE)', p21: 'Service VIP', p22: 'Trio avec une amie',
    p23: 'Massage érotique', p24: 'Massage body-body', p25: 'Massage tantrique',
  };
  /* Regroupement des pratiques pour la fiche (ordre d'affichage) */
  V.SVC_GROUPS = [
    ['Essentiels', ['s8', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9']],
    ['Finitions', ['p11', 'p12', 'p13']],
    ['Expériences', ['s7', 'p20', 's12', 's13', 'p19', 'p21']],
    ['Fantasmes et jeux', ['p14', 'p15', 'p16', 's11', 's14', 'p17', 'p18']],
    ['Massages', ['s5', 's6', 'p23', 'p24', 'p25']],
    ['À plusieurs', ['s9', 's10', 'p22']],
    ['Accompagnement', ['s1', 's2', 's3', 's4']],
  ];
  V.LIMITS = {
    l1: 'Aucun rapport non protégé', l2: 'Pas de photos ni de vidéos', l3: 'Pas de déplacement hors du canton', l4: 'Pas de rendez-vous sous influence',
    l5: 'Pas de sodomie', l6: 'Pas d’éjaculation en bouche', l7: 'Pas de fellation nature', l8: 'Pas de baisers avec la langue',
  };

  const R = (h1i, h1o, h2i, h2o, soi, nuit) => ([
    ['1 heure', h1i, h1o], ['2 heures', h2i, h2o], ['Soirée (4 h)', soi, soi], ['Nuit', nuit, nuit],
  ]);
  const ago = (min) => now().getTime() - min * 60e3;
  const st = {
    now: (m) => ({ t: 'now', since: ago(m) }),
    today: (h, m) => ({ t: 'today', at: h, since: ago(m) }),
    tonight: (h, m) => ({ t: 'tonight', at: h, since: ago(m) }),
    tomorrow: (h, m) => ({ t: 'tomorrow', at: h, since: ago(m) }),
    req: (m) => ({ t: 'request', since: ago(m) }),
    away: (d, m) => ({ t: 'away', day: d, since: ago(m) }),
    arrive: (d, m) => ({ t: 'arrive', day: d, since: ago(m) }),
  };
  V.st = st;
  const vf = (a, b, c) => ({ id: -a, media: -b, indep: -c });

  V.PROFILES = [
    { id: 'alma', name: 'Alma', age: 29, cat: 'femme', commune: 'eaux-vives', origin: 'Europe', from: 400, mode: 'both',
      langs: [['fr', 'C2'], ['en', 'C1'], ['it', 'B2']], status: st.now(12), photos: ['alma', 'alma-2'], video: true,
      attrs: { Taille: '172 cm', Silhouette: 'Mince', Cheveux: 'Brun foncé', Yeux: 'Noisette', Poitrine: 'Naturelle · B', Épilation: 'Intégrale', Tatouage: 'Discret', Tabac: 'Non', Études: 'Architecture (master)' },
      accepts: ['Hommes', 'Couples'], services: ['s1', 's2', 's3', 's5', 's6', 's7', 's8', 's9', 's13'], limits: ['l1', 'l2'],
      interests: ['Architecture', 'Opéra', 'Natation', 'Vins naturels'], rates: R(400, 450, 750, 800, 1300, 2200),
      contacts: ['tel', 'wa', 'sms'], rules: 'WhatsApp de préférence · rendez-vous au moins 1 h à l’avance · pas de numéro masqué',
      bio: 'Architecte de formation, Genevoise d’adoption. J’aime les rendez-vous préparés, les conversations qui durent et les dîners au bord du lac. Discrétion absolue, de part et d’autre.',
      week: [1, 1, 0, 1, 1, 1, 0], hours: '14 h à 1 h', verif: vf(41, 6, 41), feat: true, duo: 'alma-jade', plan: 'visibilite', tel: '+41 79 412 •• ••' },
    { id: 'lina', name: 'Lina', age: 26, cat: 'femme', commune: 'plainpalais', origin: 'Moyen-Orient', from: 350, mode: 'incall',
      langs: [['fr', 'C1'], ['ar', 'C2'], ['en', 'C1']], status: st.tonight('20 h', 34), photos: ['lina'],
      attrs: { Taille: '165 cm', Silhouette: 'Mince', Cheveux: 'Brun foncé', Yeux: 'Marron', Poitrine: 'Naturelle · C', Épilation: 'Intégrale', Tatouage: 'Non', Tabac: 'Non', Études: 'Droit international' },
      accepts: ['Hommes'], services: ['s1', 's2', 's5', 's7', 's8'], limits: ['l1', 'l2', 'l4'],
      interests: ['Danse orientale', 'Cinéma d’auteur', 'Cuisine libanaise'], rates: R(350, null, 650, null, 1100, 1900),
      contacts: ['wa', 'sms'], rules: 'Messages uniquement, je rappelle · je reçois à Plainpalais',
      bio: 'Étudiante en droit international. Douce, curieuse, très attentive. Je reçois dans un appartement calme et lumineux, à deux pas d’Uni Mail.',
      week: [0, 1, 1, 1, 1, 1, 0], hours: '18 h à 0 h', verif: vf(9, 9, 9), isNew: true, plan: 'essentiel', tel: '+41 78 655 •• ••' },
    { id: 'maya', name: 'Maya', age: 31, cat: 'femme', commune: 'champel', origin: 'Afrique', from: 500, mode: 'both',
      langs: [['fr', 'C2'], ['en', 'C2'], ['de', 'B1']], status: st.now(4), photos: ['maya'],
      attrs: { Taille: '170 cm', Silhouette: 'Sportive', Cheveux: 'Noir, bouclés courts', Yeux: 'Marron', Poitrine: 'Naturelle · C', Épilation: 'Intégrale', Tatouage: 'Non', Tabac: 'Non', Études: 'Ingénieure' },
      accepts: ['Hommes', 'Femmes', 'Couples'], services: ['s1', 's2', 's3', 's4', 's6', 's7', 's8', 's11'], limits: ['l1', 'l2'],
      interests: ['Jazz', 'Tennis', 'Voyages'], rates: R(500, 550, 900, 950, 1600, 2600),
      contacts: ['tel', 'wa', 'tg'], rules: 'Appels de 12 h à 22 h · réservation la veille appréciée',
      bio: 'Ingénieure le jour, amoureuse de jazz le soir. J’aime l’humour, la ponctualité et les gens qui savent ce qu’ils veulent.',
      week: [1, 1, 1, 1, 1, 0, 0], hours: '12 h à 23 h', verif: vf(63, 12, 63), isUpd: true, plan: 'premium', tel: '+41 76 301 •• ••' },
    { id: 'jade', name: 'Jade', age: 24, cat: 'femme', commune: 'paquis', origin: 'Asie', from: 380, mode: 'both',
      langs: [['fr', 'B2'], ['en', 'C1'], ['zh', 'C2']], status: st.req(70), photos: ['jade'],
      attrs: { Taille: '160 cm', Silhouette: 'Petite', Cheveux: 'Noir, carré', Yeux: 'Marron', Poitrine: 'Naturelle · A', Épilation: 'Intégrale', Tatouage: 'Non', Tabac: 'Non', Études: 'Design graphique' },
      accepts: ['Hommes', 'Couples'], services: ['s1', 's2', 's5', 's7', 's8', 's9', 's13'], limits: ['l1', 'l2', 'l3'],
      interests: ['Illustration', 'Thé', 'Musées'], rates: R(380, 420, 700, 750, 1200, 2000),
      contacts: ['wa', 'sms'], rules: 'Sur demande uniquement · message avec le jour et l’heure souhaités',
      bio: 'Designer graphique, discrète et rieuse. Je réponds sur demande : dites-moi le jour, l’heure et ce qui vous ferait plaisir.',
      week: [1, 0, 1, 0, 1, 1, 1], hours: 'Sur demande', verif: vf(22, 22, 22), duo: 'alma-jade', plan: 'essentiel', tel: '+41 79 880 •• ••' },
    { id: 'sofia', name: 'Sofia', age: 34, cat: 'femme', commune: 'carouge', origin: 'Amérique latine', from: 450, mode: 'both',
      langs: [['es', 'C2'], ['fr', 'B2'], ['en', 'C1'], ['pt', 'B2']], status: st.away(5, 900), photos: ['sofia'],
      attrs: { Taille: '168 cm', Silhouette: 'Sportive', Cheveux: 'Châtain clair, balayage', Yeux: 'Noisette', Poitrine: 'Naturelle · D', Épilation: 'Intégrale', Tatouage: 'Oui', Tabac: 'Non', Études: 'Kinésithérapie' },
      accepts: ['Hommes', 'Couples'], services: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'], limits: ['l1'],
      interests: ['Natation', 'Salsa', 'Cuisine mexicaine'], rates: R(450, 500, 850, 900, 1500, 2400),
      contacts: ['tel', 'wa'], rules: 'Je parle espagnol, français et anglais · messages en espagnol bienvenus',
      bio: 'Kinésithérapeute de métier, je connais le corps et j’aime prendre mon temps. Énergie solaire, massages remarquables.',
      week: [1, 1, 1, 0, 1, 1, 0], hours: '11 h à 22 h', verif: vf(80, 18, 80), plan: 'visibilite', tel: '+41 77 214 •• ••' },
    { id: 'nora', name: 'Nora', age: 28, cat: 'femme', commune: 'cologny', origin: 'Europe', from: 600, mode: 'outcall',
      langs: [['sv', 'C2'], ['en', 'C2'], ['fr', 'B2'], ['de', 'B2']], status: st.tomorrow('14 h', 120), photos: ['nora'],
      attrs: { Taille: '178 cm', Silhouette: 'Mince', Cheveux: 'Blond platine', Yeux: 'Bleu', Poitrine: 'Naturelle · B', Épilation: 'Intégrale', Tatouage: 'Non', Tabac: 'Non', Études: 'Histoire de l’art' },
      accepts: ['Hommes'], services: ['s1', 's2', 's3', 's4', 's7', 's8'], limits: ['l1', 'l2'],
      interests: ['Art contemporain', 'Ski', 'Photographie'], rates: R(null, 600, null, 1100, 1900, 3200),
      contacts: ['tel', 'sms'], rules: 'Je me déplace uniquement (hôtels et domiciles) · deux heures minimum le soir',
      bio: 'Suédoise installée à Genève, passionnée d’art contemporain. Élégante, posée, parfaite pour un dîner qui se prolonge.',
      week: [0, 1, 1, 1, 1, 1, 1], hours: '14 h à 2 h', verif: vf(30, 2, 30), photosRecent: true, plan: 'premium', tel: '+41 79 145 •• ••' },
    { id: 'ines', name: 'Inès', age: 27, cat: 'femme', commune: 'meyrin', origin: 'Métisse', from: 380, mode: 'both',
      langs: [['fr', 'C2'], ['pt', 'C1'], ['en', 'B2']], status: st.now(25), photos: ['ines'],
      attrs: { Taille: '166 cm', Silhouette: 'Sportive', Cheveux: 'Brun, bouclés', Yeux: 'Marron', Poitrine: 'Naturelle · C', Épilation: 'Intégrale', Tatouage: 'Discret', Tabac: 'Occasionnellement', Études: 'Danse contemporaine' },
      accepts: ['Hommes', 'Femmes'], services: ['s1', 's2', 's5', 's6', 's7', 's8', 's12'], limits: ['l1', 'l4'],
      interests: ['Danse', 'Afrobeat', 'Brunchs'], rates: R(380, 420, 700, 750, 1250, 2100),
      contacts: ['tel', 'wa', 'sms'], rules: 'Appels bienvenus · disponible souvent en dernière minute',
      bio: 'Danseuse, spontanée et chaleureuse. Je préfère les rencontres simples, sans chichis, avec de la musique et des rires.',
      week: [1, 1, 1, 1, 1, 1, 0], hours: '15 h à 2 h', verif: vf(15, 15, 15), plan: 'essentiel', tel: '+41 78 990 •• ••' },
    { id: 'camille', name: 'Camille', age: 32, cat: 'femme', commune: 'vieille-ville', origin: 'Europe', from: 450, mode: 'incall',
      langs: [['fr', 'C2'], ['en', 'C1'], ['de', 'C1']], status: st.today('18 h', 55), photos: ['camille'],
      attrs: { Taille: '169 cm', Silhouette: 'Normale', Cheveux: 'Roux auburn', Yeux: 'Vert', Poitrine: 'Naturelle · B', Épilation: 'Naturelle', Tatouage: 'Non', Tabac: 'Non', Études: 'Lettres modernes' },
      accepts: ['Hommes', 'Couples'], services: ['s1', 's2', 's3', 's5', 's7', 's8', 's11'], limits: ['l1', 'l2'],
      interests: ['Livres anciens', 'Théâtre', 'Piano'], rates: R(450, null, 850, null, 1400, 2300),
      contacts: ['tel', 'sms'], rules: 'Je reçois en Vieille-Ville · appartement ancien, entrée discrète',
      bio: 'Lectrice insatiable et pianiste amatrice. Je reçois dans un appartement ancien de la Vieille-Ville, au calme.',
      week: [1, 1, 0, 1, 1, 0, 0], hours: '16 h à 23 h', verif: vf(50, 11, 50), plan: 'visibilite', tel: '+41 76 778 •• ••' },
    { id: 'valentina', name: 'Valentina', age: 30, cat: 'femme', commune: 'eaux-vives', origin: 'Europe', from: 700, mode: 'both',
      langs: [['it', 'C2'], ['fr', 'C1'], ['en', 'C1'], ['ru', 'B1']], status: st.tonight('21 h', 18), photos: ['valentina', 'valentina-2'],
      attrs: { Taille: '175 cm', Silhouette: 'Mince', Cheveux: 'Brun', Yeux: 'Noisette', Poitrine: 'Naturelle · C', Épilation: 'Intégrale', Tatouage: 'Non', Tabac: 'Non', Études: 'Chant lyrique' },
      accepts: ['Hommes'], services: ['s1', 's2', 's3', 's4', 's7', 's8'], limits: ['l1', 'l2', 'l4'],
      interests: ['Opéra', 'Gastronomie', 'Équitation'], rates: R(700, 750, 1300, 1400, 2200, 3800),
      contacts: ['tel', 'wa'], rules: 'Rendez-vous de deux heures minimum en soirée · tenue soignée appréciée',
      bio: 'Soprano de formation, née à Turin. Je partage mon temps entre la scène et Genève. Pour les soirées qui comptent.',
      week: [0, 1, 1, 1, 1, 1, 0], hours: '19 h à 3 h', verif: vf(35, 4, 35), feat: true, photosRecent: true, video: true, plan: 'premium', tel: '+41 79 233 •• ••' },
    { id: 'zoe', name: 'Zoé', age: 25, cat: 'femme', commune: 'lancy', origin: 'Europe', from: 300, mode: 'both',
      langs: [['fr', 'C2'], ['en', 'B2']], status: st.now(41), photos: ['zoe'],
      attrs: { Taille: '167 cm', Silhouette: 'Mince', Cheveux: 'Blond, très court', Yeux: 'Gris', Poitrine: 'Naturelle · A', Épilation: 'Intégrale', Tatouage: 'Oui', Tabac: 'Non', Études: 'Photographie' },
      accepts: ['Hommes', 'Femmes', 'Couples'], services: ['s2', 's5', 's7', 's8', 's12', 's13'], limits: ['l1', 'l2'],
      interests: ['Skate', 'Vinyles', 'Street art'], rates: R(300, 350, 550, 600, 1000, 1700),
      contacts: ['wa', 'tg'], rules: 'Telegram ou WhatsApp · réponse en moins d’une heure',
      bio: 'Photographe, un peu rock, très directe. J’aime les gens curieux et les soirées qui ne ressemblent à aucune autre.',
      week: [1, 1, 1, 1, 1, 1, 1], hours: '17 h à 3 h', verif: vf(7, 7, 7), isNew: true, plan: 'essentiel', tel: '+41 77 503 •• ••' },
    { id: 'anya', name: 'Anya', age: 33, cat: 'femme', commune: 'grand-saconnex', origin: 'Europe', from: 550, mode: 'both',
      langs: [['ru', 'C2'], ['uk', 'C2'], ['en', 'C2'], ['fr', 'C1']], status: st.arrive(2, 300), photos: ['anya'],
      attrs: { Taille: '174 cm', Silhouette: 'Mince', Cheveux: 'Blond', Yeux: 'Bleu', Poitrine: 'Naturelle · B', Épilation: 'Intégrale', Tatouage: 'Non', Tabac: 'Non', Études: 'Relations internationales' },
      accepts: ['Hommes', 'Couples'], services: ['s1', 's2', 's3', 's4', 's7', 's8'], limits: ['l1', 'l2'],
      interests: ['Ballet', 'Échecs', 'Littérature russe'], rates: R(550, 600, 1000, 1100, 1800, 3000),
      contacts: ['tel', 'wa', 'tg'], rules: 'De retour à Genève sous peu · réservations ouvertes dès maintenant',
      bio: 'Diplômée en relations internationales, je partage mon temps entre Genève et Vienne. Conversation brillante garantie, en quatre langues.',
      week: [1, 1, 1, 1, 0, 0, 0], hours: '12 h à 22 h', verif: vf(95, 21, 95), plan: 'visibilite', tel: '+41 79 667 •• ••' },
    { id: 'leila', name: 'Leïla', age: 29, cat: 'femme', commune: 'paquis', origin: 'Afrique', from: 400, mode: 'incall',
      langs: [['fr', 'C2'], ['ar', 'C2'], ['en', 'B2']], status: st.now(8), photos: ['leila'],
      attrs: { Taille: '168 cm', Silhouette: 'Normale', Cheveux: 'Noir, ondulés', Yeux: 'Marron', Poitrine: 'Naturelle · C', Épilation: 'Intégrale', Tatouage: 'Non', Tabac: 'Occasionnellement', Études: 'Marketing' },
      accepts: ['Hommes'], services: ['s1', 's2', 's5', 's6', 's7', 's8', 's14'], limits: ['l1', 'l2', 'l4'],
      interests: ['Musique gnawa', 'Parfums', 'Cuisine'], rates: R(400, null, 750, null, 1300, 2200),
      contacts: ['tel', 'wa'], rules: 'Je reçois aux Pâquis · interphone discret, aucun nom sur la porte',
      bio: 'Mystérieuse au premier regard, très tendre ensuite. J’adore les parfums et les soirées qui commencent par un thé à la menthe.',
      week: [1, 1, 1, 1, 1, 0, 1], hours: '14 h à 0 h', verif: vf(28, 9, 28), plan: 'visibilite', tel: '+41 78 312 •• ••' },
    { id: 'bianca', name: 'Bianca', age: 36, cat: 'femme', commune: 'versoix', origin: 'Amérique latine', from: 450, mode: 'both',
      langs: [['pt', 'C2'], ['es', 'C1'], ['fr', 'B2'], ['en', 'B2']], status: st.tomorrow('11 h', 200), photos: ['bianca'],
      attrs: { Taille: '170 cm', Silhouette: 'Pulpeuse', Cheveux: 'Brun, bouclés', Yeux: 'Marron', Poitrine: 'Naturelle · D', Épilation: 'Intégrale', Tatouage: 'Discret', Tabac: 'Non', Études: 'Professeure de yoga' },
      accepts: ['Hommes', 'Femmes', 'Couples'], services: ['s1', 's2', 's3', 's5', 's6', 's7', 's8', 's10'], limits: ['l1'],
      interests: ['Yoga', 'Samba', 'Jardinage'], rates: R(450, 500, 850, 900, 1500, 2500),
      contacts: ['tel', 'wa'], rules: 'Massages du matin possibles · couples bienvenus',
      bio: 'Brésilienne, professeure de yoga. Douceur, lenteur et beaucoup de chaleur. Les couples sont les bienvenus.',
      week: [1, 1, 1, 1, 1, 1, 0], hours: '9 h à 21 h', verif: vf(44, 14, 44), plan: 'essentiel', tel: '+41 76 121 •• ••' },
    { id: 'elena', name: 'Elena', age: 38, cat: 'femme', commune: 'chene-bougeries', origin: 'Europe', from: 500, mode: 'incall',
      langs: [['es', 'C2'], ['ca', 'C2'], ['fr', 'C2'], ['en', 'C1']], status: st.today('19 h', 95), photos: ['elena'],
      attrs: { Taille: '166 cm', Silhouette: 'Normale', Cheveux: 'Noir, chignon', Yeux: 'Marron', Poitrine: 'Naturelle · C', Épilation: 'Intégrale', Tatouage: 'Non', Tabac: 'Non', Études: 'Gestion hôtelière' },
      accepts: ['Hommes', 'Couples'], services: ['s1', 's2', 's3', 's5', 's6', 's7', 's8', 's10', 's14'], limits: ['l1', 'l2'],
      interests: ['Flamenco', 'Vins d’Espagne', 'Voyages'], rates: R(500, null, 900, null, 1600, 2600),
      contacts: ['tel', 'sms'], rules: 'Femme d’expérience · je reçois dans une maison de maître, parking discret',
      bio: 'Barcelonaise, ancienne directrice d’hôtel. Je sais recevoir. Élégance, expérience et un vrai sens de l’accueil.',
      week: [1, 0, 1, 1, 1, 1, 0], hours: '15 h à 0 h', verif: vf(120, 25, 120), plan: 'visibilite', tel: '+41 79 590 •• ••' },
    { id: 'luna', name: 'Luna', age: 27, cat: 'trans', commune: 'plainpalais', origin: 'Amérique latine', from: 350, mode: 'both',
      langs: [['es', 'C2'], ['fr', 'B2'], ['en', 'B1'], ['pt', 'B1']], status: st.tonight('22 h', 60), photos: ['luna'],
      attrs: { Taille: '176 cm', Silhouette: 'Sportive', Cheveux: 'Noir, longs', Yeux: 'Marron', Poitrine: 'Refaite · C', Épilation: 'Intégrale', Tatouage: 'Discret', Tabac: 'Non', Études: 'Mode et stylisme' },
      accepts: ['Hommes', 'Couples'], services: ['s1', 's2', 's5', 's7', 's8', 's11', 's12'], limits: ['l1', 'l2'],
      interests: ['Danse', 'Mode', 'Karaoké'], rates: R(350, 400, 650, 700, 1100, 1900),
      contacts: ['wa', 'tel'], rules: 'Femme trans, fière et rayonnante · WhatsApp de préférence',
      bio: 'Colombienne, styliste dans l’âme. Je suis une femme trans fière, pétillante et très attentive à votre confort.',
      week: [0, 1, 1, 1, 1, 1, 1], hours: '18 h à 4 h', verif: vf(19, 19, 19), plan: 'essentiel', tel: '+41 78 403 •• ••' },
    { id: 'kiara', name: 'Kiara', age: 30, cat: 'trans', commune: 'eaux-vives', origin: 'Asie', from: 400, mode: 'incall',
      langs: [['th', 'C2'], ['en', 'C2'], ['fr', 'B1']], status: st.now(1), photos: ['kiara'],
      attrs: { Taille: '171 cm', Silhouette: 'Mince', Cheveux: 'Noir, longs', Yeux: 'Marron', Poitrine: 'Refaite · B', Épilation: 'Intégrale', Tatouage: 'Non', Tabac: 'Non', Études: 'Architecture d’intérieur' },
      accepts: ['Hommes', 'Couples'], services: ['s1', 's2', 's5', 's6', 's7', 's8'], limits: ['l1', 'l2'],
      interests: ['Design', 'Cuisine thaïe', 'Méditation'], rates: R(400, null, 750, null, 1300, 2200),
      contacts: ['wa', 'sms'], rules: 'Nouvelle à Genève · anglais de préférence',
      bio: 'Architecte d’intérieur, je viens d’arriver à Genève. Calme, raffinée, je reçois dans un loft lumineux aux Eaux-Vives.',
      week: [1, 1, 1, 1, 1, 0, 0], hours: '12 h à 22 h', verif: vf(1, 1, 1), isNew: true, arrival: true, plan: 'essentiel', tel: '+41 77 820 •• ••' },
    { id: 'alexia', name: 'Alexia', age: 26, cat: 'trans', commune: 'onex', origin: 'Europe', from: 320, mode: 'outcall',
      langs: [['fr', 'C2'], ['en', 'C1']], status: st.req(180), photos: ['alexia'], faceHidden: true,
      attrs: { Taille: '173 cm', Silhouette: 'Mince', Cheveux: 'Blond, ondulés', Yeux: 'Bleu', Poitrine: 'Refaite · B', Épilation: 'Intégrale', Tatouage: 'Oui', Tabac: 'Non', Études: 'Mode' },
      accepts: ['Hommes', 'Femmes', 'Couples'], services: ['s2', 's5', 's7', 's8', 's11', 's13'], limits: ['l1', 'l2', 'l3'],
      interests: ['Mode', 'Concerts', 'Nuit genevoise'], rates: R(null, 320, null, 600, 1000, 1800),
      contacts: ['tg', 'wa'], rules: 'Visage non affiché, photos vérifiées · je me déplace uniquement',
      bio: 'Je préfère garder mon visage pour nos rendez-vous : mes photos sont vérifiées par l’équipe. Rock, douce et joueuse.',
      week: [0, 0, 1, 1, 1, 1, 1], hours: '20 h à 4 h', verif: vf(26, 26, 26), plan: 'essentiel', tel: '+41 79 704 •• ••' },
    { id: 'adrien', name: 'Adrien', age: 31, cat: 'homme', commune: 'thonex', origin: 'Europe', from: 350, mode: 'outcall',
      langs: [['fr', 'C2'], ['en', 'C2'], ['es', 'B1']], status: st.tonight('20 h', 45), photos: ['adrien'],
      attrs: { Taille: '183 cm', Silhouette: 'Sportive', Cheveux: 'Brun', Yeux: 'Marron', Tatouage: 'Non', Tabac: 'Non', Études: 'Finance' },
      accepts: ['Femmes', 'Couples'], services: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's10'], limits: ['l1', 'l2'],
      interests: ['Voile', 'Cuisine', 'Cinéma'], rates: R(null, 350, null, 650, 1100, 1900),
      contacts: ['tel', 'wa'], rules: 'Accompagnement de femmes et de couples · discrétion professionnelle',
      bio: 'Ancien de la finance, je me consacre à l’accompagnement de femmes et de couples. Attentionné, cultivé, toujours ponctuel.',
      week: [1, 1, 1, 1, 1, 1, 0], hours: '18 h à 1 h', verif: vf(40, 13, 40), plan: 'visibilite', tel: '+41 78 222 •• ••' },
    { id: 'marco', name: 'Marco', age: 35, cat: 'homme', commune: 'eaux-vives', origin: 'Europe', from: 400, mode: 'both',
      langs: [['it', 'C2'], ['fr', 'C1'], ['en', 'C1']], status: st.tomorrow('19 h', 240), photos: ['marco'],
      attrs: { Taille: '180 cm', Silhouette: 'Normale', Cheveux: 'Poivre et sel', Yeux: 'Marron', Tatouage: 'Non', Tabac: 'Occasionnellement', Études: 'Œnologie' },
      accepts: ['Femmes', 'Hommes', 'Couples'], services: ['s1', 's2', 's3', 's5', 's6', 's10'], limits: ['l1'],
      interests: ['Vins', 'Moto', 'Jazz'], rates: R(400, 450, 750, 800, 1300, 2200),
      contacts: ['tel'], rules: 'Appels uniquement · italien, français, anglais',
      bio: 'Œnologue milanais, épicurien assumé. Je propose des soirées où l’on prend le temps : un bon vin, une vraie conversation.',
      week: [0, 1, 0, 1, 1, 1, 0], hours: '18 h à 0 h', verif: vf(70, 16, 70), plan: 'essentiel', tel: '+41 76 540 •• ••' },
    { id: 'samuel', name: 'Samuel', age: 28, cat: 'homme', commune: 'servette', origin: 'Afrique', from: 380, mode: 'incall',
      langs: [['fr', 'C2'], ['en', 'C2'], ['ln', 'C2']], status: st.now(30), photos: ['samuel'],
      attrs: { Taille: '188 cm', Silhouette: 'Sportive', Cheveux: 'Noir, ras', Yeux: 'Marron', Tatouage: 'Non', Tabac: 'Non', Études: 'Coach sportif' },
      accepts: ['Femmes', 'Hommes', 'Couples'], services: ['s1', 's2', 's5', 's6', 's7', 's10', 's14'], limits: ['l1', 'l2'],
      interests: ['Boxe', 'Musique', 'Mode'], rates: R(380, null, 700, null, 1200, 2000),
      contacts: ['wa', 'sms'], rules: 'Je reçois à la Servette · douche et serviettes à disposition',
      bio: 'Coach sportif, calme et rassurant. J’accueille femmes, hommes et couples dans un appartement sobre et soigné.',
      week: [1, 1, 1, 1, 1, 0, 0], hours: '13 h à 23 h', verif: vf(33, 10, 33), plan: 'essentiel', tel: '+41 79 115 •• ••' },
    { id: 'clara-hugo', name: 'Clara & Hugo', age: [30, 34], cat: 'duo', kind: 'Couple', commune: 'cologny', origin: 'Europe', from: 700, mode: 'incall',
      langs: [['fr', 'C2'], ['en', 'C2']], status: st.tomorrow('20 h', 160), photos: ['clara-hugo'],
      persons: [
        { name: 'Clara', age: 30, attrs: { Taille: '167 cm', Cheveux: 'Châtain', Yeux: 'Vert', Silhouette: 'Mince' } },
        { name: 'Hugo', age: 34, attrs: { Taille: '184 cm', Cheveux: 'Châtain', Yeux: 'Bleu', Silhouette: 'Sportive' } },
      ],
      attrs: { Taille: '167 et 184 cm', Silhouette: 'Mince · sportive', Cheveux: 'Châtains', Yeux: 'Vert · bleu', Tabac: 'Non', Études: 'Avocate · architecte' },
      accepts: ['Femmes', 'Hommes', 'Couples'], services: ['s1', 's2', 's3', 's10'], limits: ['l1', 'l2', 'l4'],
      interests: ['Voile', 'Cuisine japonaise', 'Art'], rates: R(700, null, 1300, null, 2200, 3600),
      contacts: ['wa'], rules: 'Couple marié, vérifié · nous recevons à Cologny, vue sur le lac',
      bio: 'Couple complice depuis dix ans, nous recevons des femmes, des hommes et des couples pour des soirées élégantes et sans tabou de mauvais goût.',
      week: [0, 0, 0, 1, 1, 1, 0], hours: '20 h à 2 h', verif: vf(52, 20, 52), plan: 'duo', tel: '+41 78 909 •• ••' },
    { id: 'alma-jade', name: 'Alma & Jade', age: [29, 24], cat: 'duo', kind: 'Duo', commune: 'eaux-vives', origin: 'Europe · Asie', from: 800, mode: 'both',
      langs: [['fr', 'C2'], ['en', 'C1']], status: st.req(90), photos: ['alma-jade'], members: ['alma', 'jade'], duoVerified: true,
      persons: [{ name: 'Alma', age: 29, ref: 'alma' }, { name: 'Jade', age: 24, ref: 'jade' }],
      attrs: { Taille: '172 et 160 cm', Silhouette: 'Mince · petite', Cheveux: 'Brun foncé · noir', Yeux: 'Noisette · marron', Tabac: 'Non', Études: 'Architecture · design' },
      accepts: ['Hommes', 'Couples'], services: ['s2', 's3', 's7', 's8', 's9'], limits: ['l1', 'l2'],
      interests: ['Design', 'Dîners', 'Lac'], rates: R(800, 900, 1500, 1600, 2600, 4200),
      contacts: ['wa'], rules: 'Duo réel : deux profils vérifiés et liés · réservation la veille',
      bio: 'Un vrai duo, pas un décor : deux amies qui se connaissent bien et s’entendent à merveille. Chacune a aussi son propre profil.',
      week: [0, 0, 1, 0, 1, 1, 0], hours: 'Sur demande', verif: vf(22, 6, 22), plan: 'duo', tel: '+41 79 412 •• ••' },
    { id: 'nina-sasha', name: 'Nina & Sasha', age: [27, 29], cat: 'duo', kind: 'Duo', commune: 'paquis', origin: 'Europe', from: 900, mode: 'outcall',
      langs: [['ru', 'C2'], ['en', 'C1'], ['fr', 'B2']], status: st.tonight('21 h', 75), photos: ['nina-sasha'], duoVerified: true,
      persons: [{ name: 'Nina', age: 27 }, { name: 'Sasha', age: 29 }],
      attrs: { Taille: '170 et 168 cm', Silhouette: 'Minces', Cheveux: 'Noir · roux', Yeux: 'Marron · vert', Tabac: 'Non', Études: 'Danse · traduction' },
      accepts: ['Hommes', 'Couples'], services: ['s1', 's2', 's3', 's7', 's8', 's9', 's12'], limits: ['l1', 'l2', 'l3'],
      interests: ['Ballet', 'Cocktails', 'Voyages'], rates: R(null, 900, null, 1700, 2800, 4500),
      contacts: ['tg', 'wa'], rules: 'Nous nous déplaçons ensemble, hôtels uniquement · deux heures minimum',
      bio: 'Amies depuis l’école de danse de Saint-Pétersbourg. Énergie, complicité et beaucoup d’élégance.',
      week: [0, 1, 1, 1, 1, 1, 0], hours: '19 h à 3 h', verif: vf(17, 17, 17), feat: true, plan: 'duo', tel: '+41 78 077 •• ••' },
  ];
  V.byId = (id) => V.PROFILES.find((p) => p.id === id);

  /* Offres pour les escortes (inventées, cohérentes avec le cahier des charges v1.1) */
  /* Petit mot publié avec le statut (texte court, modéré, jamais de pratique ni d'adresse) */
  V.NOTES = {
    alma: 'Libre maintenant aux Eaux-Vives, jusqu’à 23 h.',
    lina: 'Ce soir à Plainpalais à partir de 20 h. Nouvelle à Genève.',
    maya: 'Rentrée de Milan ce matin. Disponible tout de suite à Champel.',
    jade: 'Sur rendez-vous cette semaine, je réponds le soir.',
    sofia: 'En vacances, de retour la semaine prochaine.',
    nora: 'Demain après-midi, je me déplace sur toute la rive gauche.',
    ines: 'Disponible pour la soirée à Meyrin, à deux minutes du tram.',
    camille: 'Nouvelles photos en ligne. Aujourd’hui dès 18 h.',
    valentina: 'Ce soir à 21 h, ensuite complet.',
    zoe: 'Je me déplace dans tout le canton jusqu’à minuit.',
    anya: 'J’arrive après-demain pour une semaine.',
    leila: 'Libre maintenant aux Pâquis.',
    bianca: 'Demain matin à Versoix, sur rendez-vous.',
    elena: 'Ce soir dès 19 h, un seul rendez-vous.',
    luna: 'Ce soir 22 h. Je lis les messages vers 20 h.',
    kiara: 'Arrivée ce matin, premier rendez-vous possible maintenant.',
    alexia: 'Je me déplace à domicile ou à l’hôtel, sur demande.',
    adrien: 'Ce soir 20 h, je me déplace à l’hôtel.',
    marco: 'Demain à partir de 19 h aux Eaux-Vives.',
    samuel: 'Disponible maintenant, je reçois à la Servette.',
    'clara-hugo': 'Demain soir à Cologny, réservation la veille.',
    'alma-jade': 'Duo sur demande, prévenir deux jours avant.',
    'nina-sasha': 'Ce soir à 21 h, nous nous déplaçons à l’hôtel.',
  };
  /* Stories (mise en avant de 24 h), dans l'ordre du bandeau */
  V.STORIES = ['valentina', 'alma', 'nina-sasha', 'maya', 'camille', 'luna', 'lina', 'adrien', 'clara-hugo', 'zoe'];

  V.PLANS = [
    { id: 'essentiel', name: 'Présence', price: 149, pitch: 'Le profil vérifié et le statut express. De quoi essayer un mois ou deux.',
      feats: ['Profil vérifié (âge, identité, photos, indépendance)', '8 photos filigranées', 'Statut express en un geste', 'Statistiques de base', 'Masquage immédiat à tout moment'] },
    { id: 'visibilite', name: 'Visibilité', price: 249, reco: true, pitch: 'Pour celles qui travaillent plusieurs soirs par semaine : deux jours de mise en avant compris.',
      feats: ['Tout ce que comprend Présence', '20 photos et une vidéo de présentation', '2 jours de mise en avant par mois', 'Statistiques détaillées et conseils', 'Traduction relue en 5 langues', 'Alertes si vos photos apparaissent ailleurs'] },
    { id: 'premium', name: 'Accompagnement', price: 399, pitch: 'Pour déléguer : nous rédigeons votre profil et vous photographions une fois par an.',
      feats: ['Tout ce que comprend Visibilité', '6 jours de mise en avant par mois', 'Shooting photo annuel offert (valeur CHF 450)', 'Rédaction du profil par notre équipe', 'Assistance WhatsApp prioritaire 7 j/7'] },
  ];
  V.PLAN_DUO = { id: 'duo', name: 'Profil duo ou couple', price: 299, note: 'Un abonnement pour le profil commun. Payé par l’une des deux ou partagé à parts égales.' };
  V.LAUNCH = { months: 2, until: () => V.date.addDays(61), label: '2 mois offerts, sans carte' };
  V.ADDONS = [
    { ico: 'sparkles', name: 'Mise en avant', price: 'CHF 29', unit: '/ jour', desc: 'Encart deux fois plus grand, étiqueté, dans les recherches qui vous correspondent. CHF 149 la semaine.' },
    { ico: 'camera', name: 'Shooting photo', price: 'CHF 290', unit: 'au lieu de 450', desc: 'Session groupée de 4 à 5 escortes, retouches comprises. Vidéo + CHF 190.' },
    { ico: 'languages', name: 'Rédaction et traduction', price: 'CHF 120', unit: 'une fois', desc: 'Présentation écrite avec vous et traduite en 5 langues par des natifs.' },
    { ico: 'phone', name: 'Réceptionniste', price: 'dès CHF 390', unit: '/ mois · bientôt', desc: 'Prise de rendez-vous en français au forfait fixe, jamais à la commission. En cours de validation.', soon: true },
  ];
  V.FEATURED = { perDay: 29, perWeek: 149, slotsPerDay: 6 };

  /* Espace pro : compte de démonstration = Alma */
  V.PRO = {
    id: 'alma', plan: 'visibilite', since: -41, nextBill: 12, launchLeft: 0, referral: 'ALMA-7Q2',
    invoices: [
      { n: 'VL-2026-0318', d: -18, label: 'Abonnement Visibilité · octobre', amt: 249, st: 'Payée' },
      { n: 'VL-2026-0291', d: -22, label: 'Mise en avant · 3 jours', amt: 87, st: 'Payée' },
      { n: 'VL-2026-0207', d: -41, label: 'Offre de lancement · 2 mois offerts', amt: 0, st: 'Offerte' },
    ],
    messages: [
      { from: 'Équipe Velours', d: 0, subj: 'Votre contrôle médias arrive à échéance', body: 'Bonjour Alma, votre prochain contrôle médias (selfie de comparaison) est à faire avant le ' + fmtD(addDays(84)) + '. Cela prend moins d’une minute depuis votre téléphone.', unread: true },
      { from: 'Équipe Velours', d: -2, subj: 'Nouveau : alertes de fuite d’images', body: 'Nous vérifions désormais chaque semaine si vos photos apparaissent ailleurs sur le web. Une alerte a été trouvée cette semaine : consultez l’onglet Sécurité.', unread: true },
      { from: 'Facturation', d: -18, subj: 'Facture VL-2026-0318 disponible', body: 'Votre facture d’octobre (CHF 249) est disponible dans Abonnement et factures.' },
      { from: 'Équipe Velours', d: -41, subj: 'Bienvenue sur Velours', body: 'Votre profil est en ligne. Vos trois contrôles sont validés et datés sur votre fiche.' },
    ],
    leaks: [{ where: 'Annuaire d’annonces, Madrid', when: -3, img: 'alma', match: '97 %' }],
    filleules: [{ name: 'Inès', st: 'Abonnée depuis 15 jours', gain: '1 mois offert' }, { name: 'Daria', st: 'Candidature en vérification', gain: 'En attente' }],
  };
  V.proStats = (() => {
    const seed = (i) => Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    const views = [], opens = [], favs = [];
    for (let i = 0; i < 30; i++) {
      const wk = [6, 0].includes(addDays(i - 29).getDay()) ? 1.35 : 1;
      views.push(Math.round((120 + i * 2.2 + seed(i) * 60) * wk));
      opens.push(Math.round((34 + i * .7 + seed(i + 50) * 18) * wk));
      favs.push(Math.round(7 + seed(i + 99) * 7 + i * .12));
    }
    return { views, opens, favs, contacts: { 'WhatsApp': 82, 'Appel': 37, 'SMS': 22 }, avg: 0.68 };
  })();

  /* Back-office */
  V.ADMIN = {
    candidates: [
      { id: 'c1', name: 'Daria', age: 27, cat: 'Femme', d: -1, step: 'Entretien planifié', kyc: 'Vérifiée', media: 'Concordants (96 %)', interview: 'Demain 10 h 30 · visio', img: 'nora', prio: 1 },
      { id: 'c2', name: 'Mélodie', age: 31, cat: 'Femme', d: -1, step: 'Photos à modérer', kyc: 'Vérifiée', media: 'À vérifier (2 photos)', interview: 'Fait le ' + fmtShort(addDays(-1)), img: 'camille', prio: 2 },
      { id: 'c3', name: 'Yasmine', age: 25, cat: 'Femme', d: -2, step: 'Vérification d’identité', kyc: 'En cours', media: 'à faire', interview: 'À planifier', img: 'lina', prio: 2 },
      { id: 'c4', name: 'Paula & Iris', age: '28 · 26', cat: 'Duo', d: -3, step: 'Seconde personne à vérifier', kyc: '1 sur 2', media: 'À vérifier', interview: 'À planifier', img: 'nina-sasha', prio: 1 },
    ],
    moderation: [
      { id: 'm1', who: 'camille', what: '2 nouvelles photos', auto: ['Nudité explicite : non', 'Visage semblant mineur : non', 'Doublon sur le web : aucun'], d: 0 },
      { id: 'm2', who: 'maya', what: 'Présentation modifiée', auto: ['Numéro ou lien dans le texte : non', 'Terme interdit : non'], d: 0, text: 'Ingénieure le jour, amoureuse de jazz le soir…' },
      { id: 'm3', who: 'zoe', what: '1 nouvelle photo', auto: ['Nudité explicite : non', 'Visage semblant mineur : non', 'Doublon sur le web : 1 résultat (Instagram personnel)'], d: -1, flag: true },
    ],
    reports: [
      { id: 'r1', prio: 0, motif: 'Contrainte ou traite suspectée', target: 'Profil « Mélodie » (candidature)', d: 0, st: 'Profil masqué à titre conservatoire', by: 'Visiteur anonyme' },
      { id: 'r2', prio: 1, motif: 'Photos non conformes', target: 'leila', d: -1, st: 'En cours', by: 'Visiteur inscrit' },
      { id: 'r3', prio: 2, motif: 'Arnaque (faux rendez-vous)', target: 'Numéro +41 76 ••• •• 55', d: -2, st: 'Nouveau', by: 'Escorte vérifiée' },
      { id: 'r4', prio: 2, motif: 'Autre', target: 'marco', d: -6, st: 'Résolu', by: 'Visiteur anonyme' },
    ],
    audit: [
      { d: 0, t: '09:41', who: 'Modératrice · S. B.', what: 'A consulté le dossier de vérification de « Daria »' },
      { d: 0, t: '09:12', who: 'Système', what: 'Profil « Mélodie » masqué à titre conservatoire (signalement prioritaire)' },
      { d: 0, t: '08:55', who: 'Admin · A. R.', what: 'A validé 2 photos de « Nora »' },
      { d: -1, t: '22:03', who: 'Système', what: 'Statut « Disponible maintenant » de « Inès » expiré automatiquement' },
      { d: -1, t: '17:30', who: 'Admin · A. R.', what: 'Export CSV des statistiques (filtres utilisés)' },
      { d: -1, t: '11:02', who: 'Modératrice · S. B.', what: 'Candidature « Kiara » validée après entretien en visio' },
    ],
    promos: [{ code: 'LANCEMENT2M', what: '2 mois offerts', used: 31, max: 60, until: 61 }, { code: 'MARRAINE', what: '1 mois offert (parrainage)', used: 4, max: null, until: null }, { code: 'SHOOT-OCT', what: 'Shooting à CHF 290', used: 9, max: 15, until: 12 }],
    traffic: { visits7: 18240, mobile: 78, countries: [['Suisse', 61], ['France', 22], ['Italie', 4], ['Royaume-Uni', 3], ['Autres', 10]] },
    topFilters: [['Disponible maintenant', 41], ['Langue : anglais', 27], ['Commune : Eaux-Vives', 19], ['Se déplace', 17], ['Catégorie : couples et duos', 9]],
  };
})(window.V);
