// ============================================================
// src/content.config.ts — Content Collections (Astro 5)
// ------------------------------------------------------------
// I Markdown vivono in src/content/{wiki,bar} (sorgente in cui
// salva anche Sveltia CMS, vedi public/officina-segreta/config.yml).
// Lo schema Zod validato riflette il frontmatter reale dei file,
// incluso il vecchio campo "category: wiki" dei primi articoli.
// ============================================================
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Le date nei .md arrivano sia come stringa ("2026-10-09")
// sia come datetime YAML (2026-10-07T11:27:00): coerce le unifica in Date.
const dateField = z.coerce.date();

const wiki = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/wiki' }),
    schema: z.object({
        title: z.string(),
        slug: z.string().optional(),
        date: dateField,
        category: z.string().optional(),
        categoria: z
            .enum(['neofiti', 'manutenzione', 'normative', 'sicurezza', 'viaggi', 'faq'])
            .optional(),
        author: z.string().optional(),
        featured_image: z.string().optional(),
        excerpt: z.string().optional(),
        tags: z.array(z.string()).optional(),
        affiliate_links_present: z.boolean().optional(),
        gpx_file: z.string().optional(),
    }),
});

const bar = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/bar' }),
    schema: z.object({
        title: z.string(),
        slug: z.string().optional(),
        date: dateField,
        category: z.string().optional(),
        author: z.string().optional(),
        featured_image: z.string().optional(),
        excerpt: z.string().optional(),
        tags: z.array(z.string()).optional(),
        affiliate_links_present: z.boolean().optional(),
    }),
});

export const collections = { wiki, bar };
