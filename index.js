const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs-extra');
const cron = require('node-cron');
const { importVideos } = require('./importer');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const DATA_FILE = path.join(__dirname, 'videos.json');

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
app.get('/', async (req, res) => {
    await loadVideos();
    // Shuffle or slice for a "fresh" look on home page
    const shuffled = [...videoCache].sort(() => 0.5 - Math.random());
    res.render('index', { videos: shuffled });
});

app.get('/video/:id', async (req, res) => {
    await loadVideos();
    const video = videoCache.find(v => v.id === req.params.id);
    if (!video) return res.status(404).send('Video not found');
    
    // Get a few related videos
    const related = videoCache
        .filter(v => v.id !== video.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 6);

    res.render('video', { video, related });
});

// Secret Admin Panel
app.get('/secret-admin-panel-777', async (req, res) => {
    await loadVideos();
    res.render('admin', { videos: videoCache });
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
        await importVideos();
        await loadVideos(); // Refresh cache
        res.redirect('/secret-admin-panel-777');
    } catch (e) {
        res.status(500).send('Import failed: ' + e.message);
    }
});

// Daily Cron Job (Midnight)
cron.schedule('0 0 * * *', () => {
    console.log('Running scheduled daily import...');
    importVideos().catch(console.error);
});

// Startup Import
importVideos().catch(err => console.error('Initial import error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
