import express from 'express';
import path from 'path';

const app = express();
const port = 3000;

// Serve static files from public directory
app.use(express.static('public'));

// Serve index.html for all routes (client-side routing)
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: './public' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});