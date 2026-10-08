// ============================================================
// TEMPLATE ARTICOLO — Carica un singolo .md + correlati per tag
// ============================================================

// ===== Articoli correlati (stesso tag, wiki + bar, max 5) =====
// Se l'articolo non ha tag (o nessuno condivide i tag), ripiega sugli
// ultimi 5 pubblicati tra wiki + bar, dal più nuovo al più vecchio.
async function renderRelated(currentTags, currentFile) {
    const section = document.getElementById('relatedArticles');
    const list = document.getElementById('relatedList');
    if (!section || !list) return;

    const tags = frontmatterToList(currentTags).map(t => t.toLowerCase());

    let all = [];
    try {
        // catch per-cartella: se una cartella non si elenca, usa l'altra
        const perFolder = await Promise.all(
            CONTENT_FOLDERS.map(f => fetchFolderArticles(f).catch(err => {
                console.warn('Cartella non disponibile per correlati:', f, err);
                return [];
            }))
        );
        all = perFolder.flat();
    } catch (err) {
        console.error('Articoli correlati non disponibili:', err);
        return;
    }

    const candidates = all.filter(a => a.fileName !== currentFile);
    const byDateDesc = [...candidates].sort((a, b) => new Date(b.date) - new Date(a.date));

    let related;
    if (tags.length) {
        related = byDateDesc.filter(a => a.tags.some(t => tags.includes(t.toLowerCase())));
        // Nessuna condivisione di tag → ultimi pubblicati
        if (!related.length) related = byDateDesc;
    } else {
        related = byDateDesc;
    }
    related = related.slice(0, 5);

    if (!related.length) return;

        list.innerHTML = related.map(a => `
            <a href="articolo.html?file=${encodeURIComponent(a.fileName)}" class="related-item">
                <span class="related-item-title">${a.title}</span>
                <span class="related-item-meta">
                    <span>📅 ${formatDateIT(a.date)}</span>
                    <span>${a.folder === 'wiki' ? '📚 Wiki' : '☕ Bar'}</span>
                </span>
            </a>`).join('');

        section.hidden = false;
}

async function loadArticle() {
    const params = new URLSearchParams(window.location.search);
    // Compatibilità con i vecchi link che usavano il parametro "slug"
    const requested = params.get('file') || params.get('slug');

    if (!requested) {
        document.getElementById('articleTitle').textContent = 'Articolo non trovato';
        document.getElementById('articleBody').innerHTML = '<p>Nessun file specificato.</p>';
        return;
    }

    const file = requested.replace(/\.md$/, '');

    let raw = null;
    let sourceFolder = 'bar';

    for (const folder of CONTENT_FOLDERS) {
        const text = await fetchContentText(folder, `${file}.md`);
        if (text) {
            raw = text;
            sourceFolder = folder;
            break;
        }
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

    // Categoria (per la wiki usa la categoria tematica se presente)
    const catEl = document.getElementById('articleCategory');
    const wikiCat = isWiki ? WIKI_CATEGORIES.find(c => c.slug === data.categoria) : null;
    catEl.textContent = wikiCat
        ? `${wikiCat.icon} ${wikiCat.title}`
        : (isWiki ? '📚 Wiki & Normative' : '☕ Da Bar');
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

    // Articoli correlati per tag
    renderRelated(data.tags || [], file);
}

loadArticle();

console.log('Template articolo caricato.');