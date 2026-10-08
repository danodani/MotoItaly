// ============================================================
// WIKI — pagina categoria (?cat=neofiti, manutenzione, ...)
// ============================================================

const params = new URLSearchParams(window.location.search);
const catSlug = params.get('cat') || '';
const category = WIKI_CATEGORIES.find(c => c.slug === catSlug);

const catTitle = document.getElementById('catTitle');
const catDescription = document.getElementById('catDescription');
const catBreadcrumb = document.getElementById('breadcrumbCategory');
const articlesGrid = document.getElementById('articlesGrid');

function renderCategoryHeader() {
    if (!category) {
        document.title = 'Categoria non trovata - Moto Italy';
        catTitle.textContent = '❌ Categoria non trovata';
        catDescription.textContent = 'La categoria che cerchi non esiste. Torna alla Wiki Guide per sceglierne una.';
        catBreadcrumb.textContent = 'Categoria non trovata';
        return;
    }

    document.title = `${category.icon} ${category.title} - Wiki Guide - Moto Italy`;
    catTitle.textContent = `${category.icon} ${category.title}`;
    catDescription.textContent = category.description;
    catBreadcrumb.textContent = category.title;
}

function renderArticles(articles) {
    if (!articles.length) {
        articlesGrid.innerHTML = `
            <div class="empty-state">
                Nessuna guida in questa categoria per ora. 📚<br>
                <a href="wiki.html">← Torna a tutte le categorie</a>
            </div>`;
        return;
    }

    const sorted = [...articles]
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    articlesGrid.innerHTML = sorted.map(wikiCardHTML).join('');
}

async function init() {
    renderCategoryHeader();

    if (!category) {
        articlesGrid.innerHTML = `
            <div class="empty-state">
                <a href="wiki.html">← Torna alla Wiki Guide</a>
            </div>`;
        return;
    }

    articlesGrid.innerHTML = '<div class="loading-state">Caricamento guide...</div>';

    try {
        const all = await fetchFolderArticles('wiki');
        renderArticles(all.filter(a => a.categoria === category.slug));
    } catch (err) {
        console.error('Impossibile caricare la categoria:', err);
        articlesGrid.innerHTML = `
            <div class="empty-state">
                ⚠️ Al momento non riesco a caricare le guide.<br>
                Riprova tra qualche istante.
            </div>`;
    }
}

init();

console.log('Wiki — pagina categoria caricata.');
