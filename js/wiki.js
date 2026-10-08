// ============================================================
// WIKI — pagina indice: categorie + ultime guide pubblicate
// ============================================================

const categoriesGrid = document.getElementById('categoriesGrid');
const articlesGrid = document.getElementById('articlesGrid');
const altreSection = document.getElementById('altreSection');
const altreGrid = document.getElementById('altreGrid');

// ===== Griglia delle categorie (le conteglio vengono dagli articoli) =====
function renderCategories(articles) {
    categoriesGrid.innerHTML = WIKI_CATEGORIES.map(cat => {
        const count = articles
            ? articles.filter(a => a.categoria === cat.slug).length
            : null;
        const countLabel = count === null
            ? '–'
            : `${count} ${count === 1 ? 'guida' : 'guide'}`;

        return `
            <a href="wiki-categoria.html?cat=${encodeURIComponent(cat.slug)}" class="content-card wiki-cat-card">
                <span class="wiki-cat-icon" aria-hidden="true">${cat.icon}</span>
                <h3>${cat.title}</h3>
                <p>${cat.description}</p>
                <span class="wiki-cat-count">${countLabel}</span>
            </a>`;
    }).join('');
}

// ===== Ultime guide pubblicate (max 5, dalla più recente) =====
function renderLatest(articles) {
    if (!articles.length) {
        articlesGrid.innerHTML = `
            <div class="empty-state">
                Nessuna guida ancora pubblicata. 📚<br>
                Pubblica la prima guida dal pannello di amministrazione.
            </div>`;
        return;
    }

    const sorted = [...articles]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    articlesGrid.innerHTML = sorted.map(wikiCardHTML).join('');
}

// ===== Guide senza categoria → sezione "Altre guide" in fondo alla pagina =====
function renderAltre(articles) {
    if (!altreSection || !altreGrid) return;
    const uncategorized = articles.filter(a => !WIKI_CATEGORIES.some(c => c.slug === a.categoria));
    if (!uncategorized.length) {
        altreSection.hidden = true;
        return;
    }
    const sorted = [...uncategorized]
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    altreGrid.innerHTML = sorted.map(wikiCardHTML).join('');
    altreSection.hidden = false;
}

async function init() {
    categoriesGrid.innerHTML = '<div class="loading-state">Caricamento categorie...</div>';
    articlesGrid.innerHTML = '<div class="loading-state">Caricamento guide...</div>';

    try {
        const articles = await fetchFolderArticles('wiki');
        renderCategories(articles);
        renderLatest(articles);
        renderAltre(articles);
    } catch (err) {
        console.error('Impossibile caricare le guide:', err);
        renderCategories(null);
        articlesGrid.innerHTML = `
            <div class="empty-state">
                ⚠️ Al momento non riesco a caricare le guide.<br>
                Riprova tra qualche istante.
            </div>`;
    }
}

init();

console.log('Wiki — categorie e ultime guide caricate.');
