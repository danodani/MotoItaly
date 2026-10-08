// ============================================================
// WIKI — pagina indice: indice per categoria (stile wiki)
// ============================================================

const wikiCategoriesContent = document.getElementById('wikiCategoriesContent');
const wikiTocList = document.getElementById('wikiTocList');

// ===== Renderizza l'indice completo per categoria =====
function renderWikiIndex(articles) {
    if (!articles.length) {
        wikiCategoriesContent.innerHTML = `
            <div class="empty-state">
                Nessuna guida ancora pubblicata. 📚<br>
                Pubblica la prima guida dal pannello di amministrazione.
            </div>`;
        return;
    }

    // Raggruppa articoli per categoria
    const byCategory = {};
    articles.forEach(a => {
        const cat = a.categoria || 'uncategorized';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(a);
    });

    // Ordina categorie secondo WIKI_CATEGORIES, poi uncategorized
    const categoryOrder = [...WIKI_CATEGORIES.map(c => c.slug), 'uncategorized'];

    let html = '';
    let tocHtml = '';

    categoryOrder.forEach((catSlug, idx) => {
        const catArticles = byCategory[catSlug];
        if (!catArticles || !catArticles.length) return;

        const catInfo = WIKI_CATEGORIES.find(c => c.slug === catSlug);
        const catTitle = catInfo ? `${catInfo.icon} ${catInfo.title}` : '📁 Altre guide';
        const catId = `cat-${catSlug}`;

        // Ordina articoli per data decrescente
        const sorted = [...catArticles].sort((a, b) => new Date(b.date) - new Date(a.date));

        // Voce TOC
        tocHtml += `<li><a href="#${catId}" class="wiki-toc-link">${catTitle}</a></li>`;

        // Sezione categoria
        html += `
            <section class="wiki-category-section" id="${catId}" aria-labelledby="${catId}-title">
                <h2 class="wiki-category-title" id="${catId}-title">${catTitle}</h2>
                <ul class="wiki-article-list">
                    ${sorted.map(a => `
                        <li class="wiki-article-item">
                            <a href="articolo.html?file=${encodeURIComponent(a.fileName)}" class="wiki-article-link">
                                <span class="wiki-article-title">${a.title}</span>
                                <span class="wiki-article-meta">${formatDateIT(a.date)}</span>
                            </a>
                        </li>
                    `).join('')}
                </ul>
            </section>`;
    });

    wikiCategoriesContent.innerHTML = html;
    wikiTocList.innerHTML = tocHtml;

    // Scroll spy per evidenziare sezione attiva nel TOC
    if (tocHtml) setupTocSpy();
}

// ===== Scroll spy per TOC (evidenzia categoria visibile) =====
function setupTocSpy() {
    const tocLinks = wikiTocList.querySelectorAll('.wiki-toc-link');
    const sections = document.querySelectorAll('.wiki-category-section');
    if (!tocLinks.length || !sections.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                tocLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });

    sections.forEach(sec => observer.observe(sec));
}

async function init() {
    wikiCategoriesContent.innerHTML = '<div class="loading-state">Caricamento guide...</div>';

    try {
        const articles = await fetchFolderArticles('wiki');
        renderWikiIndex(articles);
    } catch (err) {
        console.error('Impossibile caricare le guide:', err);
        wikiCategoriesContent.innerHTML = `
            <div class="empty-state">
                ⚠️ Al momento non riesco a caricare le guide.<br>
                Riprova tra qualche istante.
            </div>`;
    }
}

init();

console.log('Wiki — indice per categoria caricato.');
