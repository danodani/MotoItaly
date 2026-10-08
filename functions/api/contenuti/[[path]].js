// ============================================================
// PROXY CONTENUTI — elenco file di content/ dal repo privato
// ------------------------------------------------------------
// Il repository è privato, quindi l'API GitHub non è
// raggiungibile dal browser. Questa Function fa da tramite
// server-side usando la variabile d'ambiente GITHUB_TOKEN
// (Cloudflare Pages → Settings → Environment variables).
// È limitata alla cartella content/: non può essere usata per
// leggere la configurazione del CMS o altri file del repo.
// ============================================================

const REPO = 'danodani/MotoItaly';
const BRANCH = 'main';

function jsonResponse(data, status) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=60',
        },
    });
}

function safeDecode(segment) {
    try {
        return decodeURIComponent(segment);
    } catch (e) {
        return segment;
    }
}

export async function onRequest(context) {
    const { request, env, params } = context;

    if (request.method !== 'GET') {
        return new Response('Method Not Allowed', {
            status: 405,
            headers: { 'Allow': 'GET' },
        });
    }

    // Con la rotta catch-all [[path]] i segmenti arrivano come array
    // in context.params.path (es. /api/contenuti/content/wiki →
    // params.path = ['content', 'wiki'])
    const rawPath = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '');
    const segments = rawPath
        .split('/')
        .filter(Boolean)
        .map(safeDecode);

    // Solo content/... e mai segmenti nascosti o di traversal
    const valid = segments.length >= 2
        && segments[0] === 'content'
        && segments.every(s => s !== '.' && s !== '..' && !s.startsWith('.'));

    if (!valid) {
        return jsonResponse({ message: 'Not Found' }, 404);
    }

    // Il repo è privato: serve sempre GITHUB_TOKEN (Fine-grained PAT
    // Contents: Read-only su danodani/MotoItaly, impostato su Pages →
    // Settings → Environment variables per Production e Preview).
    if (!env.GITHUB_TOKEN) {
        return jsonResponse({
            message: 'GITHUB_TOKEN mancante: configura la variabile su Cloudflare Pages → Settings → Environment variables (Production e Preview).',
        }, 503);
    }

    const githubUrl = `https://api.github.com/repos/${REPO}/contents/${segments.join('/')}?ref=${BRANCH}`;
    const headers = {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'MotoItaly-Pages',
        'X-GitHub-Api-Version': '2022-11-28',
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
    };

    let res;
    try {
        res = await fetch(githubUrl, { headers });
    } catch (err) {
        return jsonResponse({ message: 'Errore di rete verso GitHub' }, 502);
    }

    // Errori espliciti per diagnosi rapida (verifica: /api/contenuti/content/wiki)
    if (res.status === 401) {
        return jsonResponse({
            message: 'GitHub 401: GITHUB_TOKEN non valido o scaduto. Rigenera il Fine-grained PAT (Contents: Read-only) e aggiornalo su Pages.',
        }, 401);
    }

    if (res.status === 403) {
        return jsonResponse({
            message: 'GitHub 403: token senza permessi o rate limit esaurito. Verifica Contents: Read-only sul repo danodani/MotoItaly.',
        }, 403);
    }

    if (res.status === 404) {
        return jsonResponse({
            message: 'GitHub 404: percorso non trovato o repo non accessibile al token. Verifica path content/... e permessi del PAT.',
        }, 404);
    }

    if (!res.ok) {
        const body = await res.text();
        return new Response(body, {
            status: res.status,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': 'public, max-age=60',
            },
        });
    }

    const data = await res.json();

    // Elenco cartella: passa l'array così com'è (stessa forma dell'API GitHub)
    if (Array.isArray(data)) {
        return jsonResponse(data, 200);
    }

    // Singolo file: restituisce il contenuto testuale decodificato
    let content = '';
    if (data.encoding === 'base64' && typeof data.content === 'string') {
        const bytes = Uint8Array.from(atob(data.content.replace(/\n/g, '')), c => c.charCodeAt(0));
        content = new TextDecoder().decode(bytes);
    }
    return jsonResponse(Object.assign({}, data, { content }), 200);
}
