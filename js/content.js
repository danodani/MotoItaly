// ============================================================
// CONTENUTI — utilità condivise per leggere gli articoli
// ------------------------------------------------------------
// Repo PRIVATO: tutta la lettura GitHub passa dalla Function
// /api/contenuti (usa GITHUB_TOKEN server-side su Pages).
// - Elenco file  → Function /api/contenuti/content/<cartella>
// - Testo        → 1) asset statico same-origin /content/... (i .md
//                   committati sono pubblicati da Pages come file
//                   statici, quindi leggibili senza token)
//                 → 2) Function single-file /api/contenuti/content/...
// Niente api.github.com né raw.githubusercontent.com lato browser:
// con repo privato risponderebbero 404 senza token.
// Usato da wiki.js, wiki-categoria.js, bar.js e articolo.js.
// ============================================================

const CONTENT_FOLDERS = ['wiki', 'bar'];
const CONTENT_LIST_BASE = '/api/contenuti';
const CONTENT_RAW_BASE = '/content';

// Categorie della wiki (anche in officina-segreta/config.yml)
const WIKI_CATEGORIES = [
    {
        slug: 'neofiti',
        icon: '📖',
        title: 'Guide per Neofiti',
        description: 'Da zero a cento: primi passi, documenti, prima moto ed errori da evitare.'
    },
    {
        slug: 'manutenzione',
        icon: '🔧',
        title: 'Manutenzione e Riparazioni',
        description: 'Tagliandi, olio, catena, freni e riparazioni fatte in garage.'
    },
    {
        slug: 'normative',
        icon: '📜',
        title: 'Normative e Burocrazia',
        description: 'Patenti, assicurazioni, bollo e tutta la documentazione.'
    },
    {
        slug: 'sicurezza',
        icon: '🛡️',
        title: 'Sicurezza e Abbigliamento',
        description: 'Casco, protezioni e abbigliamento: come scegliere cosa ti salva la pelle.'
    },
    {
        slug: 'viaggi',
        icon: '🗺️',
        title: 'Viaggi e Itinerari',
        description: 'Itinerari, tracce GPX e consigli per viaggiare su due ruote.'
    },
    {
        slug: 'faq',
        icon: '❓',
        title: 'FAQ',
        description: 'Le risposte alle domande più frequenti dei motociclisti.'
    }
];

// ===== Parser del frontmatter (YAML semplice: scalari, liste e array inline) =====
function parseFrontmatter(md) {
    const match = md.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);
    if (!match) return { data: {}, content: md };

    const data = {};
    let currentListKey = null;

    match[1].split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        // Elemento di lista di blocco: "  - valore"
        const listItem = line.match(/^\s+-\s+(.*)$/);
        if (listItem && currentListKey) {
            let item = listItem[1].trim().replace(/^["']|["']$/g, '');
            // Elementi oggetto ("- tag: valore") → ne prendiamo il valore
            const objMatch = item.match(/^\w+:\s*(.*)$/);
            if (objMatch) item = objMatch[1].trim().replace(/^["']|["']$/g, '');
            data[currentListKey].push(item);
            return;
        }

        const idx = line.indexOf(':');
        if (idx === -1) return;

        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();

        if (value === '') {
            // Possibile inizio lista di blocco: "tags:"
            currentListKey = key;
            data[key] = [];
            return;
        }

        currentListKey = null;

        // Array inline: "tags: [a, b]"
        if (value.startsWith('[') && value.endsWith(']')) {
            data[key] = value.slice(1, -1).split(',')
                .map(v => v.trim().replace(/^["']|["']$/g, ''))
                .filter(Boolean);
            return;
        }

        let parsed = value.replace(/^["']|["']$/g, '');
        if (parsed === 'true') parsed = true;
        else if (parsed === 'false') parsed = false;
        data[key] = parsed;
    });

    return { data, content: match[2] };
}

// ===== Converte il campo tags in array di stringhe =====
function frontmatterToList(value) {
    if (Array.isArray(value)) {
        return value.map(v => String(v).trim()).filter(Boolean);
    }
    if (typeof value === 'string' && value.trim()) {
        return [value.trim()];
    }
    return [];
}

// ===== Elenco dei file .md di una cartella (solo via Function: repo privato) =====
async function fetchContentList(folder) {
    const path = `content/${encodeURIComponent(folder)}`;
    const res = await fetch(`${CONTENT_LIST_BASE}/${path}`);
    if (!res.ok) {
        let hint = '';
        try {
            const body = await res.json();
            if (body && body.message) hint = ' — ' + body.message;
        } catch (err) { /* ignora: usa solo lo status */ }
        throw new Error('Elenco contenuti non disponibile (HTTP ' + res.status + ')' + hint);
    }
    const files = await res.json();
    if (!Array.isArray(files)) throw new Error('Risposta elenco non valida');
    return files.filter(f => f.type === 'file' && typeof f.name === 'string' && f.name.endsWith('.md'));
}

// ===== Testo grezzo di un singolo articolo (repo privato) =====
// 1) asset statico same-origin /content/... (file .md pubblicati da Pages)
// 2) Function single-file (decodifica server-side il base64 dell'API GitHub)
async function fetchContentText(folder, fileName) {
    const encFolder = encodeURIComponent(folder);
    const encFile = encodeURIComponent(fileName);

    try {
        const res = await fetch(`${CONTENT_RAW_BASE}/${encFolder}/${encFile}`);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.text();
    } catch (err) { /* fallback Function sotto */ }

    try {
        const res = await fetch(`${CONTENT_LIST_BASE}/content/${encFolder}/${encFile}`);
        if (!res.ok) return null;
        const data = await res.json();
        // La Function restituisce già il testo decodificato in data.content
        if (typeof data.content === 'string' && data.content && data.encoding !== 'base64') return data.content;
        if (data.encoding === 'base64' && typeof data.content === 'string') {
            const bytes = Uint8Array.from(atob(data.content.replace(/\n/g, '')), c => c.charCodeAt(0));
            return new TextDecoder().decode(bytes);
        }
        return null;
    } catch (err) {
        return null;
    }
}

// ===== Metadati completi di un singolo articolo =====
async function fetchArticleMeta(folder, fileName) {
    const raw = await fetchContentText(folder, fileName);
    if (!raw) return null;

    const { data } = parseFrontmatter(raw);
    const base = fileName.replace(/\.md$/, '');

    return {
        fileName: base,
        folder: folder,
        title: data.title || base,
        slug: data.slug || base,
        date: data.date || '',
        category: data.category || folder,
        categoria: data.categoria || '',
        author: data.author || 'Redazione Moto Italy',
        excerpt: data.excerpt || '',
        featured_image: data.featured_image || '',
        gpx_file: data.gpx_file || null,
        tags: frontmatterToList(data.tags),
        affiliate_links_present: data.affiliate_links_present
    };
}

// ===== Tutti gli articoli di una cartella =====
async function fetchFolderArticles(folder) {
    const files = await fetchContentList(folder);
    const articles = await Promise.all(files.map(f => fetchArticleMeta(folder, f.name)));
    return articles.filter(Boolean);
}

// ===== Data in italiano =====
function formatDateIT(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ===== Card standard di una guida wiki =====
function wikiCardHTML(article) {
    const category = WIKI_CATEGORIES.find(c => c.slug === article.categoria);
    const badge = category
        ? `<span class="card-tag tag-wiki">${category.icon} ${category.title}</span>`
        : '<span class="card-tag tag-wiki">📚 Wiki</span>';

    return `
        <article class="content-card article-card">
            ${article.featured_image ? `<img src="${article.featured_image}" alt="${article.title}" class="card-image" loading="lazy">` : ''}
            <div class="article-card-tags">${badge}</div>
            <h3>${article.title}</h3>
            <p class="article-excerpt">${article.excerpt}</p>
            <div class="article-meta">
                <span>${formatDateIT(article.date)}</span>
                <span>·</span>
                <span>${article.author}</span>
            </div>
            <a href="articolo.html?file=${encodeURIComponent(article.fileName)}" class="card-link">Leggi di più →</a>
        </article>`;
}
