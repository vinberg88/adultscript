const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function normalizeCategories(value) {
    if (!Array.isArray(value)) return [];
    const categories = value.map(item => typeof item === 'string' ? item : item?.category)
        .map(item => String(item || '').trim().toLowerCase())
        .filter(item => item.length <= 64 && SLUG.test(item));
    return [...new Set(categories)].slice(0, 24);
}

function categoryLabel(slug) {
    if (/^\d+-\d+$/.test(slug)) return slug;
    return slug.replace(/-/g, ' ').replace(/\b[a-z]/g, letter => letter.toUpperCase());
}

function categoryCounts(videos) {
    const counts = new Map();
    for (const video of videos) {
        for (const slug of normalizeCategories(video?.categories)) {
            counts.set(slug, (counts.get(slug) || 0) + 1);
        }
    }
    return [...counts].map(([slug, count]) => ({ slug, label: categoryLabel(slug), count }))
        .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
}

module.exports = { normalizeCategories, categoryLabel, categoryCounts };
