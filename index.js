// index.js
const express = require('express');
const cors = require('cors');
const { fetchIndicesList, fetchIndexConstituents } = require('./sheetProvider');

const app = express();
const PORT = 5000;

app.use(cors());

// Endpoint to list all indices
app.get('/api/indices', async (req, res) => {
  try {
    const indices = await fetchIndicesList();
    res.json(indices);
  } catch (err) {
    console.error('[Indices List ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch indices' });
  }
});

// Endpoint to fetch specific index with calculated allocations
app.get('/api/indices/:name', async (req, res) => {
  const indexName = req.params.name;
  const investment = parseFloat(req.query.amount || '100000');

  try {
    const indexData = await fetchIndexConstituents(indexName, investment);
    res.json(indexData);
  } catch (err) {
    console.error(`[Index Fetch ERROR] ${indexName}:`, err);
    res.status(500).json({ error: 'Failed to fetch index data' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ DIY Index API running on http://localhost:${PORT}`);
});
