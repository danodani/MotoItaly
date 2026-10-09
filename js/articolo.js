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

// ===== Altre guide wiki: stessa categoria dell'articolo corrente =====
// Solo per articoli wiki. Esclude l'articolo corrente. Se la categoria
// ha un solo articolo, pesca dalle altre categorie wiki.
async function renderWikiSameCategory(currentCategoria, currentFile) {
    const section = document.getElementById('wikiSameCategory');
    const list = document.getElementById('wikiSameCategoryList');
    const heading = document.getElementById('wikiSameCategoryHeading');
    if (!section || !list) return;

    const catSlug = (currentCategoria || '').toString().trim().toLowerCase();
    // fileName da fetchFolderArticles include già ".md"; file qui è senza estensione
    const currentName = currentFile.toString().replace(/\.md$/, '').toLowerCase();

    let wikis = [];
    try {
        wikis = await fetchFolderArticles('wiki').catch(err => {
            console.warn('Cartella wiki non disponibile:', err);
            return [];
        });
    } catch (err) {
        console.error('Guide wiki non disponibili:', err);
        return;
    }

    // Escludi l'articolo corrente (confronto senza estensione, case-insensitive)
    const others = wikis.filter(
        a => (a.fileName || '').replace(/\.md$/, '').toLowerCase() !== currentName
    );

    // Prima le wiki della stessa categoria, poi le altre categorie
    const byDateDesc = arr => [...arr].sort((a, b) => new Date(b.date) - new Date(a.date));
    const sameCategory = byDateDesc(others.filter(
        a => (a.categoria || '').toLowerCase() === catSlug && catSlug
    ));
    const otherCategories = byDateDesc(others.filter(
        a => (a.categoria || '').toLowerCase() !== catSlug || !catSlug
    ));

    const guides = [...sameCategory, ...otherCategories].slice(0, 5);

    if (!guides.length) return;

    // Heading dinamico con il nome della categoria
    if (heading) {
        const catInfo = WIKI_CATEGORIES.find(c => c.slug === catSlug);
        heading.textContent = catInfo
            ? `${catInfo.icon} Altre guide: ${catInfo.title}`
            : '📚 Altre guide della Wiki & Guide';
    }

    // Formato lista/indice (stesse classi della pagina wiki.html)
    list.innerHTML = guides.map(a => `
        <li class="wiki-article-item">
            <a href="articolo.html?file=${encodeURIComponent(a.fileName)}" class="wiki-article-link">
                <span class="wiki-article-title">${escapeHTML(a.title || '')}</span>
                <span class="wiki-article-meta">${formatDateIT(a.date)}</span>
            </a>
        </li>`).join('');

    section.hidden = false;
}

// ===== SEO: aggiorna title/description/OG/canonical dopo il caricamento =====
// Il rendering è client-side: senza questi meta i motori di ricerca vedrebbero
// solo i valori generici del template.
function updateSeoMeta(data, content, isWiki) {
    const siteName = 'Moto Italy';
    const title = (data.title && data.title.trim()) || 'Articolo';
    const fullTitle = `${title} - ${siteName}`;

    // Description: excerpt del frontmatter, altrimenti prime ~150 lettere del contenuto
    let description = (data.excerpt || '').trim();
    if (!description && content) {
        description = content
            .replace(/[#*_>`~\[\]()!-]/g, ' ')   // via la formattazione Markdown
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 150);
        // Evita di tagliare a metà parola
        if (description.length === 150) {
            const lastSpace = description.lastIndexOf(' ');
            if (lastSpace > 100) description = description.slice(0, lastSpace);
            description += '…';
        }
    }

    // Canonical = URL completo dell'articolo corrente (con ?file=...):
    // senza il parametro ogni articolo risulterebbe duplicato dell'altro.
    const canonicalUrl = new URL(window.location.href);
    canonicalUrl.hash = '';                         // via solo l'eventuale frammento #

    const setMeta = (selector, attr, key, value) => {
        let el = document.head.querySelector(selector);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute(attr, key);
            document.head.appendChild(el);
        }
        el.setAttribute('content', value);
    };
    const setLink = (rel, href) => {
        let el = document.head.querySelector(`link[rel="${rel}"]`);
        if (!el) {
            el = document.createElement('link');
            el.setAttribute('rel', rel);
            document.head.appendChild(el);
        }
        el.setAttribute('href', href);
    };

    document.title = fullTitle;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl.href);
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'article');
    setLink('canonical', canonicalUrl.href);

    // Data di pubblicazione (utile ai crawler e ai rich snippet)
    if (data.date) {
        setMeta('meta[property="article:published_time"]', 'property', 'article:published_time', data.date);
    }
    if (isWiki) {
        setMeta('meta[property="article:section"]', 'property', 'article:section', 'Wiki & Guide');
    }
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
    document.getElementById('breadcrumbSection').textContent = isWiki ? 'Wiki & Guide' : 'Il Bar';
    document.getElementById('breadcrumbSection').href = isWiki ? 'wiki.html' : 'bar.html';
    document.getElementById('breadcrumbTitle').textContent =
        data.title && data.title.length > 40 ? data.title.slice(0, 40) + '…' : (data.title || 'Articolo');

    // Categoria (per la wiki usa la categoria tematica se presente)
    const catEl = document.getElementById('articleCategory');
    const wikiCat = isWiki ? WIKI_CATEGORIES.find(c => c.slug === data.categoria) : null;
    catEl.textContent = wikiCat
        ? `${wikiCat.icon} ${wikiCat.title}`
        : (isWiki ? '📚 Wiki & Guide' : '☕ Da Bar');
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

    // Altre guide wiki della stessa categoria (solo per articoli wiki)
    if (isWiki) {
        renderWikiSameCategory(data.categoria || '', file);
    }

    // SEO: title, description, Open Graph e canonical dinamici
    updateSeoMeta(data, content, isWiki);
}

loadArticle();

console.log('Template articolo caricato.');