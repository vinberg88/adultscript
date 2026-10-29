const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Mock data for videos - Expanded for "masses of movies"
const videos = [];
for (let i = 1; i <= 100; i++) {
  videos.push({
    id: i.toString(),
    title: `Häftig Film ${i} - Gratis Erotik`,
    thumbnail: `https://picsum.photos/seed/${i}/300/169`,
    url: 'https://www.w3schools.com/html/mov_bbb.mp4'
  });
}

app.get('/', (req, res) => {
  res.render('index', { videos });
});

app.get('/video/:id', (req, res) => {
  const video = videos.find(v => v.id === req.params.id);
  if (!video) return res.status(404).send('Video not found');
  res.render('video', { video });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
