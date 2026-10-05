// functions/api/callback.js
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
        return new Response('Codice mancante', { status: 400 });
    }

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
        return new Response(html, { headers: { 'Content-Type': 'text/html' } });
    } else {
        return new Response('Errore durante l\'autenticazione', { status: 401 });
    }
}