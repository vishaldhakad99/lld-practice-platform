const express = require('express');
const path = require('path');
const { initDb } = require('./repositories/db');

const problemRoutes = require('./routes/problems');
const attemptRoutes = require('./routes/attempts');
const healthRoutes  = require('./routes/health');

function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../public')));

  app.use('/api/health',   healthRoutes);
  app.use('/api/problems', problemRoutes);
  app.use('/api/attempts', attemptRoutes);

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  initDb()
    .then(() => {
      const app = createApp();
      app.listen(PORT, () => {
        console.log(`LLD Practice Platform running on http://localhost:${PORT}`);
      });
    })
    .catch(err => {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    });
}

module.exports = { createApp };
