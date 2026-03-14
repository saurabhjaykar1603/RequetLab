import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import logger from './logger.js';

import collectionRoutes from './routes/collectionRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import environmentRoutes from './routes/environmentRoutes.js';
import proxyRoutes from './routes/proxyRoutes.js';

dotenv.config();

// Watch .env file for changes
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  fs.watchFile(envPath, { interval: 1000 }, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      const result = dotenv.config({ override: true });
      if (result.error) {
        logger.error(`Error reloading .env file: ${result.error.message}`);
      } else {
        logger.info('Reloaded .env file due to changes');
      }
    }
  });
}

const app = express();
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Register routes
app.use('/api/collections', collectionRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/environments', environmentRoutes);
app.use('/api/proxy', proxyRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
