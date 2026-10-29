const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs-extra');
const cron = require('node-cron');
const { importVideos } = require('./importer');
const { readSiteConfig, createSiteConfig, verifyAdminPassword, safeEqual } = require('./config');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const DATA_FILE = path.join(__dirname, 'videos.json');

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
        if (await fs.pathExists(DATA_FILE)) {
            videoCache = await fs.readJson(DATA_FILE);
        } else {
            videoCache = [];
            await fs.writeJson(DATA_FILE, videoCache);
        }
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
    const shuffled = [...(realVideos.length ? realVideos : videoCache)].sort(() => 0.5 - Math.random());
    res.render('index', { videos: shuffled });
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
    const added = /^\d+$/.test(req.query.added || '') ? Number(req.query.added) : undefined;
    res.render('admin', { videos: videoCache, added });
});

app.post('/admin/delete/:id', async (req, res) => {
    await loadVideos();
    videoCache = videoCache.filter(v => v.id !== req.params.id);
    await fs.writeJson(DATA_FILE, videoCache);
    res.redirect('/secret-admin-panel-777');
});

app.post('/admin/clear', async (req, res) => {
    videoCache = [];
    await fs.writeJson(DATA_FILE, videoCache);
    res.redirect('/secret-admin-panel-777');
});

app.post('/admin/force-import', async (req, res) => {
    try {
        const result = await importVideos();
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
        const result = await importVideos();
        console.log('Import complete:', result);
    } catch (err) {
        console.error('Initial import error (app will still run):', err);
    }
};

if (require.main === module) {
    cron.schedule('0 0 * * *', () => {
        console.log('Running scheduled daily import...');
        startImport();
    });
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        startImport();
    });
}

module.exports = { app };
