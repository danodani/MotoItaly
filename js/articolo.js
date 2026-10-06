// ============================================================
// TEMPLATE ARTICOLO — Carica e renderizza un singolo .md
// ============================================================

const REPO = 'danodani/MotoItaly';
const BRANCH = 'main';
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;

function parseFrontmatter(md) {
    const match = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    if (!match) return { data: {}, content: md };
    const data = {};
    match[1].split('\n').forEach(line => {
        const idx = line.indexOf(':');
        if (idx === -1) return;
        const key = line.slice(0, idx).trim();
        let value = line.slice(idx + 1).trim();
        value = value.replace(/^["']|["']$/g, '');
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        data[key] = value;
    });
    return { data, content: match[2] };
}

async function loadArticle() {
    const params = new URLSearchParams(window.location.search);
    // Compatibilità con i vecchi link che usavano il parametro "slug"
    const file = params.get('file') || params.get('slug');

    if (!file) {
        document.getElementById('articleTitle').textContent = 'Articolo non trovato';
        document.getElementById('articleBody').innerHTML = '<p>Nessun file specificato.</p>';
        return;
    }

    let raw = null;
    let sourceFolder = 'bar';

    for (const folder of ['bar', 'wiki']) {
        try {
            const res = await fetch(`${RAW_BASE}/content/${folder}/${encodeURIComponent(file)}.md`);
            if (res.ok) {
                raw = await res.text();
                sourceFolder = folder;
                break;
            }
        } catch (e) { /* continua */ }
    }

    if (!raw) {
        document.getElementById('articleTitle').textContent = 'Articolo non trovato';
        document.getElementById('articleBody').innerHTML = '<p>L\'articolo che cerchi non esiste o è stato rimosso. Torna al <a href="bar.html">Bar del Motociclista</a>.</p>';
        document.getElementById('articleMeta').innerHTML = '';
        return;
    }

    const { data, content } = parseFrontmatter(raw);
    const isWiki = data.category === 'wiki' || sourceFolder === 'wiki';

    document.title = `${data.title} - Moto Italy`;

    // Breadcrumb
    document.getElementById('breadcrumbSection').textContent = isWiki ? 'Wiki' : 'Il Bar';
    document.getElementById('breadcrumbSection').href = isWiki ? 'wiki.html' : 'bar.html';
    document.getElementById('breadcrumbTitle').textContent =
        data.title && data.title.length > 40 ? data.title.slice(0, 40) + '…' : (data.title || 'Articolo');

    // Categoria
    const catEl = document.getElementById('articleCategory');
    catEl.textContent = isWiki ? '📚 Wiki & Normative' : '☕ Da Bar';
    catEl.className = `article-category ${isWiki ? 'cat-wiki' : 'cat-blog'}`;

    // Titolo
    document.getElementById('articleTitle').textContent = data.title || 'Senza titolo';

    // Meta
    if (data.date) {
        const d = new Date(data.date);
        document.getElementById('articleDate').textContent = isNaN(d.getTime())
            ? data.date
            : d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    document.getElementById('articleAuthor').textContent = data.author || 'Redazione Moto Italy';

    // Tempo di lettura
    const wordCount = (content || '').split(/\s+/).length;
    document.getElementById('readingTime').textContent = `${Math.max(1, Math.round(wordCount / 200))} min di lettura`;

    // Immagine
    if (data.featured_image) {
        const img = document.getElementById('articleImage');
        img.src = data.featured_image;
        img.alt = data.title || '';
        img.hidden = false;
    }

    // Contenuto — usa marked.js
    const htmlContent = (typeof marked !== 'undefined')
        ? marked.parse(content)
        : content.replace(/\n/g, '<br>');
    document.getElementById('articleBody').innerHTML = htmlContent;

    // GPX
    if (data.gpx_file) {
        document.getElementById('gpxBox').hidden = false;
        document.getElementById('gpxLink').href = data.gpx_file;
    }

    // Disclaimer affiliazioni
    const aff = data.affiliate_links_present;
    if (aff === true || aff === 'true' || aff === 'yes' || aff === '1') {
        document.getElementById('affiliateDisclaimer').hidden = false;
    }
}

loadArticle();

console.log('Template articolo caricato.');