/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { nutritionRouter } from './src/api/nutritionRoutes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Endpoints
  app.use('/api/nutrition', nutritionRouter);

  // Healthcheck
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', engine: 'NutriEngine Pro 2.0', timestamp: new Date().toISOString() });
  });

  // Integrar Vite Middleware em modo Desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Servir build estático em produção
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🚀 NutriEngine Pro Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start NutriEngine server:', err);
  process.exit(1);
});
