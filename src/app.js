const path = require('path');
const express = require('express');
const db = require('./db');
const routes = require('./routes');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', async (req, res) => {
  try {
    await db.ping();
    res.status(200).json({ status: 'ok', db: 'up' });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'down' });
  }
});

app.use('/api', routes);

module.exports = app;