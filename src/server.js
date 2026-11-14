const app = require('./app');
const { migrate } = require('./migrate');

const PORT = process.env.APP_PORT || 8000;

migrate()
  .then(() => {
    app.listen(PORT, () => console.log(`KirimCepat berjalan di port ${PORT}`));
  })
  .catch((err) => {
    console.error('Migrasi gagal:', err.message);
    process.exit(1);
  });