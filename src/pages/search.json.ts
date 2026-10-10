import { getCollection } from 'astro:content';

export const GET = async () => {
    const [wiki, bar] = await Promise.all([
        getCollection('wiki'),
        getCollection('bar'),
    ]);

    const toItem = (type) => (entry) => ({
        title: entry.data.title,
        slug: entry.id,
        collection: type,
        url: `/${type}/${entry.id}`,
        // Primi 150 caratteri del body (Markdown senza frontmatter)
        excerpt: (entry.body || '').replace(/\s+/g, ' ').trim().slice(0, 150),
    });

    const items = [
        ...wiki.map(toItem('wiki')),
        ...bar.map(toItem('bar')),
    ];

    return new Response(JSON.stringify(items), {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
};