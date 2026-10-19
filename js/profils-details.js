/* Velours : détails des fiches (maquette). Chargé après profils-importes.js.
   Pratiques, attributs complets, paiements, compteurs, description et avis, propres à chaque profil.
   Séparé du fichier généré par outils/import_profils.py pour ne pas être écrasé à un nouvel import. */
(function (V) {
  'use strict';
  const H = 3600e3, J = 24 * H;
  const DETAILS = {
    'imp-nina': {
      type: 'Escort VIP', likes: 2840, followers: 1430, visits: 61200, pay: ['chf', 'eur', 'twint', 'card'],
      attrs: { Poitrine: 'C · naturelle', Épilation: 'Intégrale', Tatouage: 'Non', Piercing: 'Nombril' },
      services: ['s8', 'p1', 'p2', 'p4', 'p5', 'p6', 's7', 'p11', 'p15', 's12', 's13', 'p19', 's6', 'p23', 's1', 's2', 's3', 's4', 'p21'],
      limits: ['l1', 'l5', 'l6', 'l2'], interests: ['Opéra', 'Voyages', 'Vins naturels', 'Yoga'],
      desc: ['Bonsoir, moi c’est Nina 🔥', 'Élégante le jour, beaucoup plus joueuse le soir. J’aime les rendez-vous préparés : un verre pour faire connaissance, puis on prend tout notre temps.', 'Je reçois dans un appartement cosy aux Eaux-Vives, ou je vous rejoins à votre hôtel. Hygiène irréprochable, discrétion absolue.', 'Au plaisir de vous rencontrer 💋'],
    },
    'imp-julie': {
      type: 'Escort indépendante', likes: 1210, followers: 640, visits: 23900, pay: ['chf', 'twint'],
      attrs: { Poitrine: 'B · naturelle', Épilation: 'Intégrale', Tatouage: 'Petit, discret', Piercing: 'Non' },
      services: ['s8', 'p1', 'p6', 'p5', 'p4', 'p9', 's7', 'p11', 'p18', 's13', 'p19', 's5', 's6', 'p24'],
      limits: ['l1', 'l2', 'l5', 'l6', 'l7'], interests: ['Danse', 'Séries', 'Pâtisserie'],
      desc: ['Coucou, je suis Julie 😊', 'Petite blonde naturelle et souriante, nouvelle aux Pâquis. J’adore les moments complices, les câlins et les rendez-vous sans prise de tête.', 'Je reçois dans un studio discret et très propre, douche à disposition. Prévenez-moi un peu à l’avance 😘'],
    },
    'imp-marion': {
      type: 'Escort indépendante', likes: 3120, followers: 1870, visits: 78400, pay: ['chf', 'eur', 'twint'],
      attrs: { Poitrine: 'C · naturelle', Épilation: 'Intégrale', Tatouage: 'Oui, sur le bras', Piercing: 'Non', Tabac: 'Occasionnellement' },
      services: ['s8', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p14', 'p11', 'p12', 's14', 'p17', 's11', 'p18', 'p20', 's12', 's13', 's6', 'p23', 's2', 's3'],
      limits: ['l1', 'l2'], interests: ['Fitness', 'Escalade', 'Cuisine italienne'],
      desc: ['Marion, 31 ans, Genevoise pur jus 🔥', 'Sportive, directe et gourmande. J’aime les hommes qui savent ce qu’ils veulent, et ceux qui aiment se laisser guider. Jeux de rôle et domination douce sur demande.', 'Chez moi à Carouge, ou chez vous dans tout le canton. Tenue soignée appréciée.'],
    },
    'imp-pamela': {
      type: 'Escort VIP', likes: 4510, followers: 2960, visits: 104300, pay: ['chf', 'eur', 'card'],
      attrs: { Poitrine: 'D · naturelle', Épilation: 'Intégrale', Tatouage: 'Non', Piercing: 'Langue' },
      services: ['s8', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 's7', 'p20', 'p8', 'p11', 'p13', 'p15', 'p14', 's12', 'p24', 'p23', 's1', 's2', 's3', 's4', 'p21', 'p22'],
      limits: ['l1', 'l2'], interests: ['Samba', 'Plage', 'Cocktails'],
      desc: ['Olá ! Moi c’est Pamela, brésilienne au tempérament de feu 🔥🔥', 'Courbes généreuses, peau dorée, sourire contagieux. Je me déplace dans vos hôtels et domiciles pour des moments intenses et sans tabou.', 'Deux heures minimum le soir. Beijos 💋🍑'],
    },
    'imp-lou': {
      type: 'Escort indépendante', likes: 980, followers: 520, visits: 18400, pay: ['chf', 'twint'],
      attrs: { Poitrine: 'B · naturelle', Épilation: 'Ticket de métro', Tatouage: 'Fleur sur la hanche', Piercing: 'Non' },
      services: ['s8', 'p1', 'p6', 'p7', 'p5', 'p4', 's7', 'p9', 'p11', 's5', 's6', 'p25', 'p19', 's13'],
      limits: ['l1', 'l2', 'l5', 'l6', 'l7'], interests: ['Lecture', 'Photographie', 'Thé'],
      desc: ['Hello, c’est Lou 🌸', 'Douce, tactile et un brin timide au début… mais ça ne dure pas longtemps 😉 J’aime prendre le temps, les massages et la tendresse.', 'Je reçois à Plainpalais dans un appartement calme. WhatsApp de préférence.'],
    },
    'imp-sarah': {
      type: 'Escort VIP', likes: 2210, followers: 1650, visits: 55800, pay: ['chf', 'eur', 'card'],
      attrs: { Poitrine: 'C · naturelle', Épilation: 'Intégrale', Tatouage: 'Non', Piercing: 'Non' },
      services: ['s8', 'p1', 'p6', 'p4', 'p5', 's7', 'p11', 's12', 's13', 's6', 'p23', 's1', 's2', 's3', 's4', 'p21'],
      limits: ['l1', 'l2', 'l4', 'l6'], interests: ['Art contemporain', 'Gastronomie', 'Équitation'],
      desc: ['Sarah, compagne de vos soirées genevoises ✨', 'Grande, élégante, cultivée. Je vous accompagne au restaurant, à un vernissage ou en voyage, puis la soirée se prolonge en toute intimité.', 'Rendez-vous d’au moins une heure, réservés à l’avance. Discrétion de rigueur 🥂'],
    },
    'imp-dreirys': {
      type: 'Escort indépendante', likes: 1890, followers: 1120, visits: 37600, pay: ['chf', 'twint'],
      attrs: { Poitrine: 'C · naturelle', Épilation: 'Intégrale', Tatouage: 'Dans le dos', Piercing: 'Nombril' },
      services: ['s8', 'p1', 'p2', 'p4', 'p5', 'p6', 's7', 'p20', 'p8', 'p11', 'p12', 'p15', 'p16', 's12', 'p24', 's6', 'p22'],
      limits: ['l1', 'l2', 'l5'], interests: ['Salsa', 'Musique', 'Cuisine'],
      desc: ['¡Hola ! Je suis Dreirys, latina chaleureuse et pleine d’énergie 🔥', 'Corps sportif, regard de braise et beaucoup de passion. J’adore les rencontres complices et les massages body-body.', 'Je reçois à la Servette. Messages en espagnol bienvenus 💋'],
    },
    'imp-cindy': {
      type: 'Escort et masseuse', likes: 1460, followers: 870, visits: 29100, pay: ['chf', 'eur', 'twint', 'card'],
      attrs: { Poitrine: 'B · naturelle', Épilation: 'Intégrale', Tatouage: 'Non', Piercing: 'Non', Tabac: 'Occasionnellement' },
      services: ['s8', 'p1', 'p6', 'p5', 'p4', 's7', 'p9', 'p11', 's5', 's6', 'p23', 'p24', 'p25', 'p19', 's13'],
      limits: ['l1', 'l2', 'l5', 'l6'], interests: ['Yoga', 'Randonnée', 'Aromathérapie'],
      desc: ['Cindy, masseuse diplômée et escort à Florissant 🌿', 'Mes mains savent détendre… et réveiller. Massage tantrique, body-body ou sensuel, puis on se laisse aller selon vos envies.', 'Je reçois et je me déplace à Genève. Réponse en moins d’une heure en journée.'],
    },
    'imp-emily': {
      type: 'Escort indépendante', likes: 760, followers: 410, visits: 12800, pay: ['chf', 'eur'],
      attrs: { Poitrine: 'A · naturelle', Épilation: 'Intégrale', Tatouage: 'Non', Piercing: 'Oreilles' },
      services: ['s8', 'p1', 'p6', 'p4', 'p5', 's7', 'p9', 'p11', 'p18', 's11', 's13', 's6'],
      limits: ['l1', 'l2', 'l5', 'l6', 'l7'], interests: ['Mode', 'Cinéma', 'Running'],
      desc: ['Hi, I’m Emily 💫', 'Nouvelle à Genève, jeune, fine et curieuse de tout. Je parle anglais et russe, un peu français, mais on se comprendra très bien 😉', 'Je reçois à la Jonction : interphone discret, aucun nom sur la porte.'],
    },
    'imp-lana': {
      type: 'Escort indépendante', likes: 1330, followers: 790, visits: 26700, pay: ['chf', 'eur', 'twint'],
      attrs: { Poitrine: 'C · naturelle', Épilation: 'Intégrale', Tatouage: 'Cheville', Piercing: 'Non' },
      services: ['s8', 'p1', 'p2', 'p4', 'p5', 'p6', 's7', 'p11', 'p15', 's12', 's13', 's5', 's6', 'p23', 's1', 's2', 's3'],
      limits: ['l1', 'l2', 'l5'], interests: ['Flamenco', 'Voyages', 'Tapas'],
      desc: ['Lana, espagnole solaire 🌞', 'Je me déplace uniquement, à votre hôtel ou chez vous, dans tout le canton. Le matin, massage et réveil en douceur ; le soir, place à la passion.', 'Rapide, discrète, toujours ponctuelle 💋'],
    },
    'imp-oceane': {
      type: 'Escort indépendante', likes: 890, followers: 470, visits: 15300, pay: ['chf', 'twint'],
      attrs: { Poitrine: 'B · naturelle', Épilation: 'Intégrale', Tatouage: 'Non', Piercing: 'Nez' },
      services: ['s8', 'p1', 'p6', 'p7', 'p5', 'p4', 's7', 'p9', 'p11', 'p19', 's13', 's5', 's6'],
      limits: ['l1', 'l2', 'l5', 'l6'], interests: ['Surf', 'Concerts', 'Animaux'],
      desc: ['Coucou, moi c’est Océane 🌊', 'Naturelle, souriante et câline. Avec moi, pas de chrono : on discute, on rit, et on profite.', 'Je reçois à Lancy, ou je viens à vous sur Genève.'],
    },
    'imp-gwen': {
      type: 'Escort VIP', likes: 3680, followers: 2240, visits: 89200, pay: ['chf', 'eur', 'card'],
      attrs: { Poitrine: 'D · naturelle', Épilation: 'Intégrale', Tatouage: 'Oui, sur l’épaule', Piercing: 'Non' },
      services: ['s8', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p14', 'p11', 'p12', 'p13', 's14', 'p17', 's11', 'p16', 'p18', 'p20', 's12', 's13', 'p19', 's6', 'p23', 's2'],
      limits: ['l1', 'l2'], interests: ['Littérature', 'Jazz', 'Whisky'],
      desc: ['Gwen, rousse incendiaire et femme d’expérience 🔥', 'Je sais ce que je veux, et je devine vite ce que vous voulez. Domination douce, jeux de rôle, fantasmes assumés : on en parle, puis on les vit.', 'Je reçois au calme à Versoix, uniquement sur rendez-vous pris à l’avance.'],
    },
  };

  V.PROFILES.forEach((p) => {
    const d = DETAILS[p.id]; if (!d) return;
    Object.assign(p.attrs, d.attrs);
    Object.assign(p, { type: d.type, likes: d.likes, followers: d.followers, visits: d.visits, pay: d.pay, services: d.services, limits: d.limits, interests: d.interests, desc: d.desc });
  });

  /* Avis de démonstration : utilisés sur l'accueil (derniers avis) et sur chaque fiche */
  V.AVIS = [
    { to: 'imp-nina', by: 'Marc', ago: 2 * H, note: 5, txt: 'Accueil tout en douceur et discrétion parfaite. Fidèle aux photos, je recommande les yeux fermés.' },
    { to: 'imp-nina', by: 'Alexandre', ago: 9 * J, note: 5, txt: 'Une vraie GFE, on oublie la montre. Appartement impeccable, conversation passionnante.' },
    { to: 'imp-sarah', by: 'David', ago: 5 * H, note: 5, txt: 'Élégante et cultivée, parfaite pour une soirée. Ponctuelle et vraiment charmante.' },
    { to: 'imp-sarah', by: 'Henri', ago: 15 * J, note: 4, txt: 'Dîner puis nuit à l’hôtel : très classe, très attentionnée. Tarif à la hauteur de la prestation.' },
    { to: 'imp-julie', by: 'Thomas', ago: 3 * H, note: 5, txt: 'Très à l’aise et naturelle, le courant passe tout de suite. Un moment simple et agréable.' },
    { to: 'imp-julie', by: 'Kevin', ago: 6 * J, note: 4, txt: 'Adorable et souriante, studio propre. Un peu de retard mais elle a prolongé sans souci.' },
    { to: 'imp-lou', by: 'Antoine', ago: 6 * H, note: 5, txt: 'Douce et souriante, elle met tout de suite à l’aise. Le massage est un vrai plus.' },
    { to: 'imp-gwen', by: 'Nicolas', ago: 22 * H, note: 5, txt: 'Femme de caractère et pleine d’esprit. Elle mène la danse comme personne, moment inoubliable.' },
    { to: 'imp-gwen', by: 'Stéphane', ago: 11 * J, note: 5, txt: 'Expérience assumée, sans tabou mais toujours dans le respect. Je reviendrai.' },
    { to: 'imp-marion', by: 'Julien', ago: 8 * H, note: 5, txt: 'Pile à l’heure, exactement le profil annoncé. Gourmande et très joueuse, excellent moment.' },
    { to: 'imp-marion', by: 'Romain', ago: 4 * J, note: 4, txt: 'Sportive et directe, ça me plaît. Le jeu de rôle était parfaitement mené.' },
    { to: 'imp-cindy', by: 'Laurent', ago: 10 * H, note: 5, txt: 'Le massage tantrique vaut le détour. Très professionnelle et discrète.' },
    { to: 'imp-lana', by: 'Paul', ago: 26 * H, note: 5, txt: 'Déplacement rapide et discret à l’hôtel. Charmante, attentionnée et ponctuelle.' },
    { to: 'imp-pamela', by: 'Fabio', ago: 2 * J, note: 5, txt: 'Un volcan brésilien. Énergie folle, sourire permanent, aucune déception.' },
    { to: 'imp-pamela', by: 'Olivier', ago: 13 * J, note: 5, txt: 'Soirée VIP réussie de A à Z. Elle est encore plus belle qu’en photo.' },
    { to: 'imp-dreirys', by: 'Sébastien', ago: 3 * J, note: 5, txt: 'Latina pleine de passion, le body-body est incroyable. À essayer.' },
    { to: 'imp-emily', by: 'Mathieu', ago: 5 * J, note: 4, txt: 'Jeune et timide au départ, puis très complice. Un peu de français, beaucoup de charme.' },
    { to: 'imp-oceane', by: 'Yann', ago: 7 * J, note: 5, txt: 'Naturelle et câline, aucun chrono. Exactement ce que je cherchais.' },
  ];
})(window.V);
