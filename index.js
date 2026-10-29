const express = require('express');
const app = express();
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Mock data for videos
const videos = [
  { id: '1', title: 'Sample Video 1', thumbnail: 'https://via.placeholder.com/150', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { id: '2', title: 'Sample Video 2', thumbnail: 'https://via.placeholder.com/150', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { id: '3', title: 'Sample Video 3', thumbnail: 'https://via.placeholder.com/150', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
];

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
