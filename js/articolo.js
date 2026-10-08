// ============================================================
// TEMPLATE ARTICOLO — Carica un singolo .md + correlati per tag
// ============================================================

// ===== Articoli correlati (solo Bar, max 5) =====
// Per articoli wiki: mostra solo post del Bar
// Per articoli Bar: mostra solo post del Bar, heading "Leggi anche"
// Se l'articolo non ha tag (o nessuno condivide i tag), ripiega sugli
// ultimi 5 pubblicati del Bar, dal più nuovo al più vecchio.
async function renderRelated(currentTags, currentFile, sourceFolder) {
    const section = document.getElementById('relatedArticles');
    const list = document.getElementById('relatedList');
    const heading = document.getElementById('relatedHeading');
    if (!section || !list) return;

    const isWiki = sourceFolder === 'wiki';
    const tags = frontmatterToList(currentTags).map(t => t.toLowerCase());

    let all = [];
    try {
        // Prende solo articoli del Bar (folder 'bar')
        const articles = await fetchFolderArticles('bar').catch(err => {
            console.warn('Cartella bar non disponibile per correlati:', err);
            return [];
        });
        all = articles;
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

    // Cambia heading per articoli Bar
    if (!isWiki && heading) {
        heading.textContent = '🔗 Leggi anche';
    }

    list.innerHTML = related.map(a => `
        <a href="articolo.html?file=${encodeURIComponent(a.fileName)}" class="related-item">
            <span class="related-item-title">${escapeHTML(a.title || '')}</span>
            <span class="related-item-meta">
                <span>📅 ${formatDateIT(a.date)}</span>
                <span>☕ Bar</span>
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

    // Contenuto — marked.js se disponibile, altrimenti renderer interno
    const htmlContent = (typeof marked !== 'undefined' && marked && typeof marked.parse === 'function')
        ? marked.parse(content)
        : renderMarkdown(content);
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

    // Articoli correlati per tag (solo Bar)
    renderRelated(data.tags || [], file, sourceFolder);
}

loadArticle();

console.log('Template articolo caricato.');