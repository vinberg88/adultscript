const { readSiteConfig } = require('./config');
const { DATA_FILE, readVideos, writeVideos } = require('./video-store');
const { normalizeCategories } = require('./categories');
const API_URL = 'https://www.pornhub.com/webmasters/search';
let currentImport;

function pageCount(value) {
    const count = Number(value || 1);
    if (!Number.isInteger(count) || count < 1 || count > 5) {
        throw new Error('PORN_HUB_IMPORT_PAGES must be an integer from 1 to 5');
    }
    return count;
}

function normalizeVideo(video) {
    if (!video || !/^[a-zA-Z0-9]+$/.test(String(video.video_id || ''))) return null;
    const id = String(video.video_id);
    const title = String(video.title || '').trim();
    if (!title) return null;
    const thumbnail = String(video.default_thumb || video.thumb || '');
    if (!thumbnail.startsWith('https://')) return null;
    return {
        id: `pornhub-${id}`,
        sourceId: id,
        source: 'Pornhub',
        title,
        url: `https://www.pornhub.com/view_video.php?viewkey=${id}`,
        embedUrl: `https://www.pornhub.com/embed/${id}`,
        thumbnail,
        duration: /^\d+(?::\d{1,2}){1,2}$/.test(String(video.duration || '')) ? String(video.duration) : null,
        views: Number.isFinite(Number(video.views)) ? Number(video.views) : null,
        rating: Number.isFinite(Number(video.rating)) ? Number(video.rating) : null,
        categories: normalizeCategories(video.categories),
        date: String(video.publish_date || new Date().toISOString())
    };
}

async function runImport({ fetchImpl = fetch, dataFile = DATA_FILE, pages, search } = {}) {
    const config = await readSiteConfig();
    pages ??= config?.pornhubImportPages ?? process.env.PORN_HUB_IMPORT_PAGES;
    search ??= config?.pornhubSearch ?? process.env.PORN_HUB_SEARCH ?? '';
    const count = pageCount(pages);
    const incoming = new Map();

    for (let page = 1; page <= count; page++) {
        const url = new URL(API_URL);
        url.searchParams.set('ordering', 'newest');
        url.searchParams.set('page', String(page));
        if (search) url.searchParams.set('search', search);

        const response = await fetchImpl(url, { signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error(`Pornhub API returned HTTP ${response.status}`);
        const body = await response.json();
        if (!Array.isArray(body.videos)) throw new Error('Pornhub API did not return a videos list');
        for (const raw of body.videos) {
            const video = normalizeVideo(raw);
            if (video) incoming.set(video.sourceId, video);
        }
    }

    const existing = await readVideos(dataFile);
    const existingIds = new Set();
    let enriched = 0;
    const updated = existing.map(video => {
        if (!video || video.source !== 'Pornhub') return video;
        let id = video.sourceId ? String(video.sourceId) : null;
        if (!id) {
            try { id = new URL(video.url).searchParams.get('viewkey'); } catch { /* leave unknown IDs unchanged */ }
        }
        if (!id) return video;
        existingIds.add(id);
        const fresh = incoming.get(id);
        if (!fresh?.categories.length || normalizeCategories(video.categories).length) return video;
        enriched++;
        return { ...video, categories: fresh.categories };
    });
    const additions = [...incoming.values()].filter(v => !existingIds.has(v.sourceId));
    if (additions.length || enriched) {
        await writeVideos([...updated, ...additions], dataFile);
    }
    return { fetched: incoming.size, added: additions.length, enriched, total: existing.length + additions.length };
}

function importVideos(options) {
    if (!currentImport) currentImport = runImport(options).finally(() => { currentImport = null; });
    return currentImport;
}

module.exports = { importVideos, normalizeVideo };
