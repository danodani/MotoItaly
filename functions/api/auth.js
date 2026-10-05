// ============================================================
// CLOUDFLARE FUNCTION: OAuth GitHub per Decap CMS
// ============================================================
// Questo endpoint gestisce il redirect iniziale a GitHub.
// Il callback è gestito da /api/callback
// ============================================================

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    // Se è la prima chiamata (senza codice), reindirizza a GitHub
    const code = url.searchParams.get('code');

    if (!code) {
        const clientId = env.GITHUB_CLIENT_ID;
        const redirectUri = `${url.origin}/api/callback`;
        const scope = 'repo,user';
        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

        return Response.redirect(githubAuthUrl, 302);
    }

    // Se c'è un codice, è il callback: scambia il codice per un token
    const clientId = env.GITHUB_CLIENT_ID;
    const clientSecret = env.GITHUB_CLIENT_SECRET;
    const redirectUri = `${url.origin}/api/callback`;

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: redirectUri
        })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.access_token) {
        // Restituisci una pagina che comunica il token a Decap CMS
        const html = `
            <!DOCTYPE html>
            <html>
            <head><title>Autenticazione completata</title></head>
            <body>
                <script>
                    (function() {
                        const token = '${tokenData.access_token}';
                        const message = 'authorization:github:success:' + JSON.stringify({
                            token: token,
                            provider: 'github'
                        });
                        window.opener.postMessage(message, window.location.origin);
                        window.close();
                    })();
                </script>
                <p>Autenticazione completata. Questa finestra si chiuderà automaticamente.</p>
            </body>
            </html>
        `;
        return new Response(html, {
            headers: { 'Content-Type': 'text/html' }
        });
    } else {
        return new Response('Errore durante l\'autenticazione', { status: 401 });
    }
}