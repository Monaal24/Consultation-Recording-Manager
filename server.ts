import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { initDB } from './backend/config/db';
import apiRouter from './backend/routes';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize file database & seed files
  initDB();

  // Basic Middleware
  // In v4, express json and urlencoded should be set up before mounting APIs
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(cors());

  // Serve uploads statically
  const uploadsDir = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsDir));

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Handle Vite middleware for local development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware integrated.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Server] Static production asset hosting initialized.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Consultant Recording Manager running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('[Server Fail] Crash during boot:', error);
});
