// ============================================================
// IL BAR DEL MOTOCICLISTA — Carica articoli (da content.js)
// ============================================================

const articlesGrid = document.getElementById('articlesGrid');

// ===== Renderizza le card =====
function renderArticles(articles) {
    if (!articles.length) {
        articlesGrid.innerHTML = `
            <div class="empty-state">
                Il bar è aperto, ma il bancone è vuoto. 🍺<br>
                Pubblica il primo articolo dal pannello di amministrazione.
            </div>`;
        return;
    }

    const sorted = [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));

    articlesGrid.innerHTML = sorted.map(article => {
        const isWiki = article.category === 'wiki';
        const tagClass = isWiki ? 'tag-wiki' : 'tag-bar';
        const tagLabel = isWiki ? '📚 Wiki & Guide' : '☕ Da Bar';
        const gpxBadge = article.gpx_file ? '<span class="mini-badge">🗺️ GPX</span>' : '';
        const safeTitle = escapeHTML(article.title || '');
        const safeExcerpt = escapeHTML(article.excerpt || '');
        const safeAuthor = escapeHTML(article.author || '');

        return `
            <article class="content-card article-card">
                ${article.featured_image ? `<img src="${article.featured_image}" alt="${safeTitle}" class="card-image" loading="lazy">` : ''}
                <div class="article-card-tags">
                    <span class="card-tag ${tagClass}">${tagLabel}</span>
                    ${gpxBadge}
                </div>
                <h3>${safeTitle}</h3>
                <p class="article-excerpt">${safeExcerpt}</p>
                <div class="article-meta">
                    <span>${formatDateIT(article.date)}</span>
                    <span>·</span>
                    <span>${safeAuthor}</span>
                </div>
                <a href="articolo.html?file=${encodeURIComponent(article.fileName)}" class="card-link">Leggi di più →</a>
            </article>
        `;
    }).join('');
}

// ===== Bootstrap =====
async function init() {
    articlesGrid.innerHTML = '<div class="loading-state">Caricamento articoli...</div>';

    try {
        const articles = await fetchFolderArticles('bar');
        renderArticles(articles);
    } catch (err) {
        console.error('Impossibile elencare gli articoli:', err);
        articlesGrid.innerHTML = `
            <div class="empty-state">
                ⚠️ Al momento non riesco a caricare gli articoli.<br>
                Riprova tra qualche istante.
            </div>`;
    }
}

init();

console.log('Il Bar del Motociclista — caricamento avviato.');