const express = require('express');
const app = express();
const path = require('path');
const cron = require('node-cron');
const { importVideos } = require('./importer');
const { readSiteConfig, createSiteConfig, verifyAdminPassword, safeEqual } = require('./config');
const { readVideos, writeVideos } = require('./video-store');
const links = require('./links.json');
const { siteForHost, siteWithSettings } = require('./site-profile');
const { readSettings, writeSettings, THEMES } = require('./admin-settings');
const { suggest } = require('./admin-ai');
const { readAds, writeAds } = require('./ad-settings');
const { paginate } = require('./pagination');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(async (req, res, next) => {
    const site = siteForHost(req.get('host'));
    try {
        res.locals.site = siteWithSettings(site, await readSettings());
    } catch (error) {
        console.error('Could not read site appearance, using domain defaults:', error);
        res.locals.site = { ...site, theme: 'midnight' };
    }
    next();
});
app.use(async (req, res, next) => {
    try { res.locals.ads = await readAds(); next(); } catch (error) { next(error); }
});

function installerEnabled() {
    return typeof process.env.INSTALL_TOKEN === 'string' && process.env.INSTALL_TOKEN.length >= 32;
}

function sameOrigin(req, res, next) {
    const origin = req.get('origin');
    let matches = false;
    try { matches = new URL(origin).host.toLowerCase() === req.get('host').toLowerCase(); } catch { /* missing or invalid Origin */ }
    if (!matches) return res.status(403).send('Ogiltigt ursprung för begäran');
    next();
}

async function adminAuth(req, res, next) {
    res.set('Cache-Control', 'no-store');
    res.set('X-Robots-Tag', 'noindex, nofollow');
    try {
        const config = await readSiteConfig();
        const password = process.env.ADMIN_PASSWORD;
        if (!config && !password) return res.status(503).send('Slutför /install eller ange ADMIN_PASSWORD');
        const match = /^Basic ([A-Za-z0-9+/=]+)$/.exec(req.get('authorization') || '');
        const credentials = match ? Buffer.from(match[1], 'base64').toString('utf8') : '';
        const separator = credentials.indexOf(':');
        const user = separator < 0 ? '' : credentials.slice(0, separator);
        const supplied = separator < 0 ? '' : credentials.slice(separator + 1);
        const valid = config
            ? user === config.adminUser && verifyAdminPassword(supplied, config)
            : user === (process.env.ADMIN_USER || 'admin') && safeEqual(supplied, password);
        if (valid) return next();
        res.set('WWW-Authenticate', 'Basic realm="AdultScript admin"');
        return res.status(401).send('Inloggning krävs');
    } catch (error) {
        next(error);
    }
}

app.use(['/secret-admin-panel-777', '/admin'], adminAuth);
app.use('/admin', (req, res, next) => req.method === 'POST' ? sameOrigin(req, res, next) : next());

// Robust JSON loading with caching
let videoCache = [];
async function loadVideos() {
    try {
        videoCache = await readVideos();
    } catch (e) {
        console.error('Error loading videos.json, using empty array:', e);
        videoCache = [];
    }
    return videoCache;
}

// Routes
app.get('/install', async (req, res, next) => {
    try {
        if (!installerEnabled() || await readSiteConfig()) return res.sendStatus(404);
        res.set('Cache-Control', 'no-store').render('install', { error: null });
    } catch (error) { next(error); }
});

app.post('/install', sameOrigin, async (req, res, next) => {
    try {
        if (!installerEnabled() || await readSiteConfig()) return res.sendStatus(404);
        if (!req.is('application/x-www-form-urlencoded')) return res.sendStatus(415);
        await createSiteConfig(req.body);
        if (require.main === module) importVideos().catch(console.error);
        res.redirect('/secret-admin-panel-777?installed=1');
    } catch (error) {
        if (error.status === 400 || error.status === 403 || error.status === 409) {
            return res.status(error.status)
                .set('Cache-Control', 'no-store').render('install', { error: error.message });
        }
        next(error);
    }
});

app.get('/', async (req, res) => {
    await loadVideos();
    const realVideos = videoCache.filter(v => v.source !== 'Automated');
    const sort = ['views', 'rating'].includes(req.query.sort) ? req.query.sort : 'latest';
    const videos = [...(realVideos.length ? realVideos : videoCache)].sort((a, b) => {
        const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
        const date = value => Date.parse(String(value || '').replace(' ', 'T')) || 0;
        const score = sort === 'views' ? number(b.views) - number(a.views)
            : sort === 'rating' ? number(b.rating) - number(a.rating)
            : date(b.date) - date(a.date);
        return score || String(a.id).localeCompare(String(b.id));
    });
    const page = paginate(videos, req.query.page);
    res.render('index', { ...page, sort });
});

app.get('/lankar', (req, res) => {
    res.render('links', { links });
});

app.get('/video/:id', async (req, res) => {
    await loadVideos();
    const video = videoCache.find(v => v.id === req.params.id);
    if (!video) return res.status(404).send('Video not found');
    
    // Get a few related videos
    const related = videoCache
        .filter(v => v.source !== 'Automated')
        .filter(v => v.id !== video.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 6);

    res.render('video', { video, related });
});

// Secret Admin Panel
app.get('/secret-admin-panel-777', async (req, res) => {
    await loadVideos();
    const settings = await readSettings();
    const added = /^\d+$/.test(req.query.added || '') ? Number(req.query.added) : undefined;
    res.render('admin', { videos: videoCache, added, saved: req.query.saved === '1', adsSaved: req.query.adsSaved === '1', settings, themes: THEMES, suggestion: null, error: null });
});

app.post('/admin/ads', async (req, res) => {
    try {
        await writeAds({
            top: { imageUrl: req.body.topImageUrl, targetUrl: req.body.topTargetUrl, alt: req.body.topAlt, enabled: req.body.topEnabled },
            bottom: { imageUrl: req.body.bottomImageUrl, targetUrl: req.body.bottomTargetUrl, alt: req.body.bottomAlt, enabled: req.body.bottomEnabled }
        });
        res.redirect('/secret-admin-panel-777?adsSaved=1');
    } catch (error) {
        await loadVideos();
        res.status(400).render('admin', { videos: videoCache, added: undefined, adsSaved: false, settings: await readSettings(), themes: THEMES, suggestion: null, error: error.message });
    }
});

app.post('/admin/settings', async (req, res) => {
    try {
        await writeSettings(req.body);
        res.redirect('/secret-admin-panel-777?saved=1');
    } catch (error) {
        await loadVideos();
        res.status(400).render('admin', { videos: videoCache, added: undefined, settings: await readSettings(), themes: THEMES, suggestion: null, error: error.message });
    }
});

app.post('/admin/ai/:kind', async (req, res) => {
    await loadVideos();
    const settings = await readSettings();
    try {
        const suggestion = await suggest(req.params.kind, { site: res.locals.site, videos: videoCache, settings });
        res.render('admin', { videos: videoCache, added: undefined, settings, themes: THEMES, suggestion, error: null });
    } catch (error) {
        res.status(400).render('admin', { videos: videoCache, added: undefined, settings, themes: THEMES, suggestion: null, error: error.message });
    }
});

app.post('/admin/delete/:id', async (req, res) => {
    await loadVideos();
    videoCache = videoCache.filter(v => v.id !== req.params.id);
    await writeVideos(videoCache);
    res.redirect('/secret-admin-panel-777');
});

app.post('/admin/clear', async (req, res) => {
    videoCache = [];
    await writeVideos(videoCache);
    res.redirect('/secret-admin-panel-777');
});

app.post('/admin/force-import', async (req, res) => {
    try {
        const settings = await readSettings();
        const result = await importVideos(settings.saved ? { pages: settings.importPages, search: settings.importSearch } : undefined);
        await loadVideos(); // Refresh cache
        res.redirect(`/secret-admin-panel-777?added=${result.added}`);
    } catch (e) {
        res.status(500).send('Import failed: ' + e.message);
    }
});

// Startup Import - Moved to run AFTER the server starts to prevent cPanel deployment failure
const startImport = async () => {
    console.log('Starting import...');
    try {
        if (installerEnabled() && !(await readSiteConfig())) {
            console.log('Waiting for web installation before importing.');
            return;
        }
        const settings = await readSettings();
        if (!settings.autoImport) return;
        const result = await importVideos(settings.saved ? { pages: settings.importPages, search: settings.importSearch } : undefined);
        console.log('Import complete:', result);
    } catch (err) {
        console.error('Initial import error (app will still run):', err);
    }
};

if (require.main === module) {
    cron.schedule('0 * * * *', async () => {
        try {
            const settings = await readSettings();
            if (settings.autoImport && new Date().getHours() === settings.importHour) startImport();
        } catch (error) { console.error('Scheduled import settings error:', error); }
    });
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        startImport();
    });
}

module.exports = { app };
