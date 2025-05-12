import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import routes from './routes/index.js';

// Export all services
export * from './services/index.js';

// Export server function
export interface ServerOptions {
  port?: number;
  edition?: 'api' | 'db' | 'standalone';
  proxyUrl?: string; 
}

/**
 * Start the MCP server with options
 */
export async function startServer(options: ServerOptions = {}): Promise<express.Application> {
  const port = options.port || env.PORT || 4000;
  const edition = options.edition || env.EDITION || 'standalone';
  const proxyUrl = options.proxyUrl || env.PROXY_URL;
  
  try {
    // Connect to MongoDB if needed
    if (edition === 'db' || edition === 'standalone') {
      await connectDB();
    }
    
    // Create Express application
    const app = express();
    
    // Apply middleware
    app.use(cors());
    app.use(bodyParser.json());
    
    if (edition === 'api' && proxyUrl) {
      console.log(`API Edition: Forwarding all requests to ${proxyUrl}`);
      
      app.all('*', (req, res) => {
        const targetUrl = proxyUrl;
        console.log(`Forwarding ${req.method} request to ${targetUrl}`);
        
        const options = {
          method: req.method,
          headers: {
            'Content-Type': 'application/json',
            ...req.headers as Record<string, string>
          },
          body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
        };
        
        fetch(targetUrl, options)
          .then(response => response.json())
          .then(data => {
            res.json(data);
          })
          .catch(error => {
            console.error('Error forwarding request:', error);
            res.status(500).send(`Error forwarding request: ${error.message}`);
          });
      });
    } else {
      // Register routes
      app.use('/', routes);
    }
    
    // Start the server
    app.listen(port, () => {
      console.log('\n🚀 MCP Server successfully started!');
      console.log(`🔗 Server running at http://localhost:${port}`);
      console.log(`📚 Capabilities available at http://localhost:${port}/capabilities.json`);
      console.log(`🛠️  JSON-RPC 2.0 endpoint: http://localhost:${port}/mcp`);
      console.log(`🔍 Health check: http://localhost:${port}/health`);
      console.log(`🌎 Environment: ${env.NODE_ENV}\n`);
    });
    
    // Handle graceful shutdown
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'] as const;
    signals.forEach(signal => {
      process.on(signal, () => {
        console.log(`\n📢 Received ${signal}, shutting down gracefully...`);
        process.exit(0);
      });
    });
    
    return app;
  } catch (error) {
    console.error('🔥 Server failed to start:', error);
    process.exit(1);
  }
}

// Start the application if this module is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
} 