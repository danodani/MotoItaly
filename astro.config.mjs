// ============================================================
// astro.config.mjs — configurazione Moto Italy
// ------------------------------------------------------------
// - output static (SSG): nessun adapter server necessario.
// - build.format 'file': genera /faq.html, /strumenti.html, ...
//   invece di /faq/index.html, così TUTTI i link legacy
//   (pagine ancora in public/ e link esterni) restano validi.
// - @astrojs/sitemap: produce dist/sitemap-index.xml a ogni build.
// ============================================================
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
    site: 'https://motoitaly.pages.dev',
    output: 'static',
    build: {
        format: 'file',
    },
    integrations: [
        sitemap({
            // Esclude dalla sitemap i template legacy con query string
            // (articolo.html e wiki-categoria.html restano in public/
            // per compatibilità con i vecchi link ?file=...).
            filter: (page) =>
                !page.includes('articolo.html') && !page.includes('wiki-categoria.html'),
        }),
    ],
});
