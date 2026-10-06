// ============================================================
// IL BAR DEL MOTOCICLISTA — Carica articoli da GitHub
// ============================================================

const REPO = 'danodani/MotoItaly';
const BRANCH = 'main';
const FOLDER = 'content/bar';           // Cartella dove Sveltia salva i post del bar
const API_LIST = `https://api.github.com/repos/${REPO}/contents/${FOLDER}?ref=${BRANCH}`;
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${FOLDER}`;

const articlesGrid = document.getElementById('articlesGrid');

// ===== Parser del frontmatter (YAML semplice) =====
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

// ===== Carica l'elenco dei file .md nella cartella =====
async function fetchArticleList() {
    try {
        const res = await fetch(API_LIST);
        if (!res.ok) throw new Error('Errore API GitHub: ' + res.status);
        const files = await res.json();
        return files.filter(f => f.name.endsWith('.md') && f.type === 'file');
    } catch (err) {
        console.error('Impossibile elencare gli articoli:', err);
        return [];
    }
}

// ===== Scarica e parsa un singolo articolo =====
async function fetchArticle(fileName) {
    try {
        const res = await fetch(`${RAW_BASE}/${fileName}`);
        if (!res.ok) throw new Error('Errore raw: ' + res.status);
        const raw = await res.text();
        const { data } = parseFrontmatter(raw);
        return {
            fileName: fileName.replace('.md', ''),
            title: data.title || fileName.replace('.md', ''),
            slug: data.slug || fileName.replace('.md', ''),
            date: data.date || '',
            category: data.category || 'bar',
            author: data.author || 'Redazione Moto Italy',
            excerpt: data.excerpt || '',
            featured_image: data.featured_image || '',
            gpx_file: data.gpx_file || null
        };
    } catch (err) {
        console.error('Errore caricamento ' + fileName, err);
        return null;
    }
}

// ===== Formatta la data =====
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ===== Renderizza le card =====
function renderArticles(articles) {
    if (!articles.length) {
        articlesGrid.innerHTML = `
            <div class="empty-state">
                Il bar è aperto, ma il bancone è vuoto. 🍺<br>
                Pubblica il primo articolo dal <a href="/admin/">pannello di amministrazione</a>.
            </div>`;
        return;
    }

    const sorted = [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));

    articlesGrid.innerHTML = sorted.map(article => {
        const isWiki = article.category === 'wiki';
        const tagClass = isWiki ? 'tag-wiki' : 'tag-bar';
        const tagLabel = isWiki ? '📚 Wiki & Normative' : '☕ Da Bar';
        const gpxBadge = article.gpx_file ? '<span class="mini-badge">🗺️ GPX</span>' : '';

        return `
            <article class="content-card article-card">
                ${article.featured_image ? `<img src="${article.featured_image}" alt="${article.title}" class="card-image" loading="lazy">` : ''}
                <div class="article-card-tags">
                    <span class="card-tag ${tagClass}">${tagLabel}</span>
                    ${gpxBadge}
                </div>
                <h3>${article.title}</h3>
                <p class="article-excerpt">${article.excerpt}</p>
                <div class="article-meta">
                    <span>${formatDate(article.date)}</span>
                    <span>·</span>
                    <span>${article.author}</span>
                </div>
                <a href="articolo.html?file=${article.fileName}" class="card-link">Leggi di più →</a>
            </article>
        `;
    }).join('');
}

// ===== Bootstrap =====
async function init() {
    articlesGrid.innerHTML = '<div class="loading-state">Caricamento articoli...</div>';

    const files = await fetchArticleList();
    if (!files.length) {
        renderArticles([]);
        return;
    }

    const articles = (await Promise.all(files.map(f => fetchArticle(f.name)))).filter(Boolean);
    renderArticles(articles);
}

init();

console.log('Il Bar del Motociclista — caricamento avviato.');