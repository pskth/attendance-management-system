// src/routes/database.ts
import { Router } from 'express';
import DatabaseService from '../lib/database';

const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await DatabaseService.healthCheck();
    if (isHealthy) {
      res.json({ 
        status: 'healthy', 
        database: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ 
        status: 'unhealthy', 
        database: 'disconnected',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      status: 'error', 
      database: 'error',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Data summary endpoint
router.get('/summary', async (req, res) => {
  try {
    const summary = await DatabaseService.getDataSummary();
    res.json({
      status: 'success',
      data: summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      status: 'error', 
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
