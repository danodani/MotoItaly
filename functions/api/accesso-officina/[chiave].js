// Endpoint di ingresso del login GitHub OAuth (usato da Sveltia CMS).
// Il path contiene una chiave segreta: senza la chiave giusta la richiesta
// riceve un 404 generico, come qualsiasi pagina inesistente.
const CHIAVE_SEGRETA = '9d4k2m';

export async function onRequest(context) {
    const { request, env, params } = context;

    if (params.chiave !== CHIAVE_SEGRETA) {
        return new Response('Not Found', {
            status: 404,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Robots-Tag': 'noindex',
            },
        });
    }

    const url = new URL(request.url);

    const clientId = env.GITHUB_CLIENT_ID;
    const redirectUri = `${url.origin}/api/callback`;
    const scope = 'repo,user';
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

    return Response.redirect(githubAuthUrl, 302);
}