"""Import de vrais profils dans la maquette, pour une démo privée.

Usage (depuis le dossier de la maquette) :
    python outils/import_profils.py chemin/vers/export
    python outils/import_profils.py chemin/vers/export --remplacer   # masque les profils fictifs

L'export contient un fichier profils.csv (séparateur ; ou ,) et un dossier photos/.
Voir outils/exemple-profils.csv pour les colonnes. Seules les lignes avec accord_demo = oui
sont importées : l'escorte doit avoir accepté d'apparaître dans la démo.

Règles reprises du cahier des charges :
- personnes majeures uniquement (âge vérifié) ; une ligne de moins de 18 ans arrête l'import ;
- photos suggestives possibles, mais aucune nudité : retirez ces photos de l'export.

Sorties (ignorées par git, donc jamais poussées par accident) :
- img/p/imp-<prenom>-<n>.webp (900 px) et -s.webp (360 px), métadonnées supprimées ;
- js/profils-importes.js, chargé par index.html juste après data.js.
"""
import csv, json, re, sys, unicodedata
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUI = {'oui', 'o', 'yes', 'y', '1', 'x', 'true', 'vrai'}


def slug(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def lieux_connus():
    """Lieux de data.js : quartiers et communes (identifiant, et nom simplifié vers identifiant)."""
    src = (ROOT / 'js/data.js').read_text(encoding='utf-8')
    pairs = re.findall(r"\{ id: '([a-z-]+)', label: '([^']+)'", src) + re.findall(r"\['([a-z-]+)', '([^']+)'\]", src)
    out = {}
    for i, label in pairs:
        out[i] = i; out[slug(label)] = i
    return out


def statut(txt):
    t = slug(txt or '')
    h = re.search(r'(\d{1,2})\s*h', txt or '')
    at = f"{h.group(1)} h" if h else '20 h'
    if t.startswith('maintenant') or t.startswith('disponible'): return 'st.now(5)'
    if t.startswith('ce-soir'): return f"st.tonight('{at}', 30)"
    if t.startswith('aujourd'): return f"st.today('{at}', 30)"
    if t.startswith('demain'): return f"st.tomorrow('{at}', 60)"
    return 'st.req(60)'


def langues(txt):
    out = []
    for part in re.split(r'[,;|]', txt or ''):
        m = re.match(r'\s*([a-z]{2})\s*([ABC][12])?', part.strip(), re.I)
        if m: out.append([m.group(1).lower(), (m.group(2) or 'B2').upper()])
    return out or [['fr', 'B2']]


def entier(v, defaut=None):
    v = re.sub(r'[^\d]', '', v or '')
    return int(v) if v else defaut


def photo(src, base):
    """Recadre en 3:4 (haut de l'image conservé), produit 900 px et 360 px, sans métadonnées."""
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    w, h = im.size; tw, th = (w, round(w * 4 / 3)) if h >= w * 4 / 3 else (round(h * 3 / 4), h)
    left = (w - tw) // 2; top = max(0, min(h - th, round((h - th) * 0.2)))
    im = im.crop((left, top, left + tw, top + th))
    for suffix, width in (('', 900), ('-s', 360)):
        out = im if im.width <= width else im.resize((width, round(width * 4 / 3)), Image.LANCZOS)
        out.save(ROOT / 'img/p' / f'{base}{suffix}.webp', 'WEBP', quality=82, method=6)


def main():
    if len(sys.argv) < 2: sys.exit(__doc__)
    export = Path(sys.argv[1]).resolve(); remplacer = '--remplacer' in sys.argv
    fichier = next((export / n for n in ('profils.csv', 'profils.CSV') if (export / n).exists()), None)
    if not fichier: sys.exit(f'profils.csv introuvable dans {export}')
    texte = fichier.read_text(encoding='utf-8-sig')
    lignes = list(csv.DictReader(texte.splitlines(), dialect=csv.Sniffer().sniff(texte.splitlines()[0], ';,')))
    lieux = lieux_connus(); photos_dir = export / 'photos'
    profils, ignores, vus = [], [], set()
    for n, r in enumerate(lignes, start=2):
        r = {slug(k).replace('-', '_'): (v or '').strip() for k, v in r.items() if k}
        nom = r.get('prenom', '')
        if slug(r.get('accord_demo', '')) not in OUI:
            ignores.append(f'ligne {n} ({nom or "sans prénom"}) : pas d’accord démo'); continue
        age = entier(r.get('age'))
        if not nom or not age: sys.exit(f'ligne {n} : prénom et âge obligatoires')
        if age < 18: sys.exit(f'ligne {n} ({nom}) : âge {age}, import arrêté. Personnes majeures uniquement.')
        pid = 'imp-' + slug(nom); k = 2
        while pid in vus: pid = f'imp-{slug(nom)}-{k}'; k += 1
        vus.add(pid)
        noms = [x.strip() for x in re.split(r'[|]', r.get('photos', '')) if x.strip()]
        if not noms: sys.exit(f'ligne {n} ({nom}) : aucune photo indiquée (colonne photos, noms séparés par |)')
        bases = []
        for j, x in enumerate(noms, start=1):
            src = photos_dir / x
            if not src.exists(): sys.exit(f'ligne {n} ({nom}) : photo introuvable {src}')
            base = f'{pid}-{j}'; photo(src, base); bases.append(base)
        cat = slug(r.get('categorie', 'femme'))
        kind = 'Couple' if cat == 'couple' else 'Duo' if cat == 'duo' else None
        cat = {'femme': 'femme', 'trans': 'trans', 'femme-trans': 'trans', 'homme': 'homme', 'couple': 'duo', 'duo': 'duo'}.get(cat, 'femme')
        lieu = lieux.get(slug(r.get('commune', '')), 'geneve')
        mode = {'recoit': 'incall', 'deplace': 'outcall', 'se-deplace': 'outcall'}.get(slug(r.get('mode', '')), 'both')
        depart = entier(r.get('tarif'), 300)
        t = lambda c, d: entier(r.get(c), d)
        p = {
            'id': pid, 'name': nom, 'age': age, 'cat': cat, 'commune': lieu, 'origin': r.get('origine') or 'Non précisée',
            'from': depart, 'mode': mode, 'langs': langues(r.get('langues')), 'photos': bases,
            'attrs': {k2: r[c] for c, k2 in (('taille', 'Taille'), ('silhouette', 'Silhouette'), ('cheveux', 'Cheveux'), ('yeux', 'Yeux'), ('tabac', 'Tabac')) if r.get(c)},
            'accepts': ['Hommes'] + (['Couples'] if slug(r.get('accepte_couples', '')) in OUI else []),
            'services': ['s1', 's2', 's8'], 'limits': ['l1', 'l2'], 'interests': [],
            'rates': [['1 heure', t('1h_recoit', depart), t('1h_deplace', depart + 50)], ['2 heures', t('2h_recoit', depart * 2 - 50), t('2h_deplace', depart * 2)],
                      ['Soirée (4 h)', t('soiree', depart * 3), t('soiree', depart * 3)], ['Nuit', t('nuit', depart * 5), t('nuit', depart * 5)]],
            'contacts': ['tel', 'wa', 'sms'], 'rules': r.get('consignes') or 'Prendre rendez-vous à l’avance.',
            'bio': r.get('presentation') or '', 'week': [1, 1, 1, 1, 1, 0, 0], 'hours': r.get('horaires') or '14 h à 23 h',
            'verif': {'id': -3, 'media': -3, 'indep': -3}, 'plan': 'visibilite', 'tel': r.get('telephone') or '+41 •• ••• •• ••',
            'isNew': True, 'importe': True,
        }
        if kind: p['kind'] = kind
        if slug(r.get('mise_en_avant', '')) in OUI: p['feat'] = True
        if r.get('note'): p['note'] = r['note']
        profils.append((p, statut(r.get('statut'))))
    corps = ',\n    '.join(json.dumps(p, ensure_ascii=False)[:-1] + f', "status": {s}}}' for p, s in profils)
    (ROOT / 'js/profils-importes.js').write_text(f"""/* Généré par outils/import_profils.py : {len(profils)} profil(s) réel(s) avec accord démo. Ne pas pousser en ligne. */
(function (V) {{
  'use strict';
  const st = V.st;
  const profils = [
    {corps}
  ];
  if (!profils.length) return;
  {"V.PROFILES.forEach((p) => { p.cache = true; });" if remplacer else ''}
  V.PROFILES.unshift(...profils);
  profils.forEach((p) => {{ if (p.note) V.NOTES[p.id] = p.note; }});
  V.STORIES = [...profils.map((p) => p.id), ...V.STORIES].slice(0, 12);
}})(window.V);
""", encoding='utf-8')
    print(f'{len(profils)} profil(s) importé(s){" (profils fictifs masqués)" if remplacer else ""}.')
    for x in ignores: print('ignoré :', x)
    print('Rechargez la maquette (http://localhost:8790/?direct). Pour revenir aux seuls profils fictifs : supprimez js/profils-importes.js.')


if __name__ == '__main__':
    main()
