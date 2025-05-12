import { Router, Request, Response } from 'express';
import fs from 'fs';
import { env } from '../config/env.js';
import { handleJsonRpcRequest } from '../controllers/jsonrpc.controller.js';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// MCP capabilities endpoint
router.get('/capabilities.json', (req: Request, res: Response) => {
  try {
    const capabilities = JSON.parse(fs.readFileSync(env.CAPABILITIES_PATH, 'utf8'));
    res.json(capabilities);
  } catch (error) {
    console.error('Error loading capabilities.json:', error);
    res.status(500).json({ error: 'Failed to load capabilities' });
  }
});

// JSON-RPC 2.0 endpoint for MCP
router.post('/mcp', handleJsonRpcRequest);

export default router; 