/* BD : accès à la maquette par mot de passe (Vercel Routing Middleware)
   La maquette montre de vrais profils : elle est réservée au client. Le mot de passe (BD_PASS) et la valeur
   du cookie de session (BD_TOKEN) sont des variables d'environnement Vercel, jamais dans le dépôt.
   Sans BD_TOKEN, personne n'entre. */
export const config = { matcher: '/:path*' };

const COOKIE = 'bd_acces';
const LIBRE = ['/img/logo-b-s.webp', '/icons/icon-192.png', '/robots.txt'];
const JOURS = 30;

const suite = () => new Response(null, { headers: { 'x-middleware-next': '1' } });

// comparaison à durée constante, pour ne rien laisser deviner du mot de passe
const egal = (a, b) => {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};

// retour après connexion : seulement un chemin du site, jamais une autre adresse
const retour = (v) => (typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') && !v.includes('\\') ? v : '/');

const page = (erreur) => `<!doctype html>
<html lang="fr-CH">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0f0c11">
<title>Maquette BD · accès réservé</title>
<link rel="icon" href="/icons/icon-192.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400..700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px 16px; background: #0f0c11; color: #fbf7ef; font: 15px/1.5 Montserrat, system-ui, sans-serif; }
  .box { width: 100%; max-width: 380px; padding: 36px 28px 30px; border-radius: 24px; background: #17131a; border: 1px solid rgba(255, 255, 255, .07); box-shadow: 0 24px 60px rgba(0, 0, 0, .55); text-align: center; }
  img { width: 52px; height: auto; }
  h1 { margin: 18px 0 6px; font-size: 22px; font-weight: 700; letter-spacing: -.01em; }
  p { margin: 0; color: #cbc4cf; font-size: 14px; }
  form { margin-top: 24px; display: grid; gap: 12px; text-align: left; }
  label { font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #8f8794; }
  input { width: 100%; height: 48px; padding: 0 16px; border-radius: 999px; border: 1px solid #3b3540; background: #0f0c11; color: #fbf7ef; font: inherit; font-size: 16px; }
  input:focus { outline: none; border-color: #cfae6c; }
  button { height: 48px; border: 0; border-radius: 999px; background: #cfae6c; color: #0f0c11; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; }
  button:hover { background: #e2c68d; }
  .err { color: #f0a3a3; font-size: 13.5px; text-align: center; }
  .note { margin-top: 22px; font-size: 12px; color: #8f8794; }
</style>
</head>
<body>
<main class="box">
  <img src="/img/logo-b-s.webp" alt="" width="101" height="112">
  <h1>Maquette BD</h1>
  <p>Accès réservé. Entrez le mot de passe reçu avec la maquette.</p>
  <form method="post" action="/__acces">
    <label for="mdp">Mot de passe</label>
    <input id="mdp" name="mdp" type="password" autocomplete="current-password" required autofocus>
    <input type="hidden" name="retour" id="retour" value="/">
    ${erreur ? '<div class="err" role="alert">Mot de passe incorrect.</div>' : ''}
    <button type="submit">Entrer</button>
  </form>
  <p class="note">Maquette confidentielle de Digistylze.</p>
</main>
<script>
  // garde la page demandée, y compris la partie après # que le serveur ne voit pas
  document.getElementById('retour').value = location.pathname === '/__acces' ? (sessionStorage.getItem('bd-retour') || '/') : location.pathname + location.search + location.hash;
  if (location.pathname !== '/__acces') try { sessionStorage.setItem('bd-retour', document.getElementById('retour').value); } catch (e) {}
</script>
</body>
</html>`;

const html = (body, status) => new Response(body, {
  status,
  headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
});

export default async function middleware(req) {
  const url = new URL(req.url);
  const { BD_PASS, BD_TOKEN } = process.env;
  if (LIBRE.includes(url.pathname)) return suite();

  if (url.pathname === '/__acces' && req.method === 'POST') {
    const f = await req.formData();
    if (BD_PASS && BD_TOKEN && egal(String(f.get('mdp') || ''), BD_PASS)) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: retour(String(f.get('retour') || '/')),
          'Set-Cookie': `${COOKIE}=${BD_TOKEN}; Path=/; Max-Age=${JOURS * 86400}; HttpOnly; Secure; SameSite=Lax`,
          'Cache-Control': 'no-store',
        },
      });
    }
    return html(page(true), 401);
  }

  const c = (req.headers.get('cookie') || '').match(/(?:^|;\s*)bd_acces=([^;]+)/);
  if (c && BD_TOKEN && egal(c[1], BD_TOKEN)) return suite();
  return html(page(false), 401);
}
