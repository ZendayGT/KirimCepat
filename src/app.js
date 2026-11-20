const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json());

const path = require('path');
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', async (req, res) => {
  try {
    await db.ping();
    res.status(200).json({ status: 'ok', db: 'up' });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'down' });
  }
});

module.exports = app;