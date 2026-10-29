const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs-extra');
const cron = require('node-cron');
const { importVideos } = require('./importer');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'videos.json');

// Load videos from JSON file
async function getVideos() {
  try {
    return await fs.readJson(DATA_FILE);
  } catch (e) {
    return [];
  }
}

app.get('/', async (req, res) => {
  const videos = await getVideos();
  res.render('index', { videos });
});

app.get('/video/:id', async (req, res) => {
  const videos = await getVideos();
  const video = videos.find(v => v.id === req.params.id);
  if (!video) return res.status(404).send('Video not found');
  res.render('video', { video });
});

// Schedule auto-import to run every day at midnight
cron.schedule('0 0 * * *', () => {
  importVideos();
});

// Also run once on startup to ensure we have content
importVideos();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
