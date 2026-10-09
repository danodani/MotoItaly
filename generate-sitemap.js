// ============================================================
// generate-sitemap.js — Genera sitemap.xml per Cloudflare Pages
// ------------------------------------------------------------
// Legge i file .md di content/wiki/ e content/bar/ e produce:
// - URL articoli:  https://motoitaly.pages.dev/articolo.html?file=<slug>
// - URL statici:   /, /faq.html, /wiki.html, /strumenti.html, ...
// Output: sitemap.xml nella root (viene servito da Pages).
//
// Uso:  node generate-sitemap.js      (npm run build)
// ============================================================

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://motoitaly.pages.dev';
const OUTPUT = path.join(__dirname, 'sitemap.xml');

// Cartelle contenuti (Sveltia CMS)
const CONTENT_DIRS = [
    path.join(__dirname, 'src', 'content', 'wiki'),
    path.join(__dirname, 'src', 'content', 'bar')
];

// Pagine statiche pubbliche (esclusi template con query: articolo.html, wiki-categoria.html)
const STATIC_PAGES = [
    '/',
    '/faq.html',
    '/wiki.html',
    '/strumenti.html',
    '/bar.html',
    '/chi-sono.html',
    '/contatti.html',
    '/bollo.html'
];

// Escape XML per i caratteri speciali negli URL (&, ecc.)
function xmlEscape(url) {
    return url.replace(/&/g, '&amp;');
}

// Raccoglie gli slug (nome file senza .md) da una cartella
function collectArticles(dir) {
    if (!fs.existsSync(dir)) {
        console.warn(`[sitemap] Cartella non trovata, salto: ${dir}`);
        return [];
    }
    return fs.readdirSync(dir)
        .filter(name => name.toLowerCase().endsWith('.md'))
        .map(name => name.slice(0, -3)); // rimuove ".md"
}

function build() {
    const today = new Date().toISOString().slice(0, 10);

    const urls = [];

    // 1) Pagine statiche
    for (const page of STATIC_PAGES) {
        urls.push({ loc: SITE_URL + page, lastmod: today });
    }

    // 2) Articoli wiki + bar
    for (const dir of CONTENT_DIRS) {
        const slugs = collectArticles(dir);
        for (const slug of slugs) {
            const file = encodeURIComponent(slug);
            urls.push({
                loc: `${SITE_URL}/articolo.html?file=${file}`,
                lastmod: today
            });
        }
        if (slugs.length) {
            console.log(`[sitemap] ${path.basename(dir)}: ${slugs.length} articoli`);
        }
    }

    // 3) Serializzazione XML
    const body = urls
        .map(u => `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`)
        .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

    fs.writeFileSync(OUTPUT, xml, 'utf8');
    console.log(`[sitemap] Scritto ${OUTPUT} — ${urls.length} URL totali.`);
}

build();
