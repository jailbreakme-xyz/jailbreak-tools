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
      
      // Special handling for known endpoints
      app.get('/capabilities.json', (req, res) => {
        const targetUrl = `${proxyUrl}/capabilities.json`;
        handleProxyRequest(req, res, targetUrl);
      });
      
      app.get('/health', (req, res) => {
        const targetUrl = `${proxyUrl}/health`;
        handleProxyRequest(req, res, targetUrl);
      });
      
      // Handle MCP requests (default path)
      app.all('/mcp', (req, res) => {
        handleProxyRequest(req, res, proxyUrl);
      });
      
      // Redirect root to MCP
      app.get('/', (req, res) => {
        res.redirect('/mcp');
      });
      
      // Handle all other paths
      app.all('*', (req, res) => {
        res.redirect('/mcp');
      });
      
      // Helper function to handle proxy requests
      function handleProxyRequest(req: express.Request, res: express.Response, targetUrl: string) {
        console.log(`Forwarding ${req.method} request to ${targetUrl}`);
        
        // Filter out problematic headers
        const filteredHeaders: Record<string, string> = { 
          'Content-Type': 'application/json'
        };
        
        // Copy safe headers
        const headersToCopy = ['authorization', 'user-agent', 'accept'];
        for (const header of headersToCopy) {
          if (req.headers[header]) {
            filteredHeaders[header] = req.headers[header] as string;
          }
        }
        
        // Don't automatically accept compressed responses
        filteredHeaders['accept-encoding'] = 'identity';
        
        const options = {
          method: req.method,
          headers: filteredHeaders,
          body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
        };
        
        console.log(`Request body: ${options.body || 'none'}`);
        
        fetch(targetUrl, options)
          .then(async response => {
            // Copy status code
            res.status(response.status);
            
            // Simplified header handling - just copy a few critical ones
            const contentType = response.headers.get('content-type');
            if (contentType) {
              res.setHeader('Content-Type', contentType);
            }
            
            try {
              if (contentType && contentType.includes('application/json')) {
                // Get JSON response
                const jsonData = await response.json();
                res.json(jsonData);
              } else {
                // Get text response
                const text = await response.text();
                res.send(text);
              }
            } catch (parseError) {
              console.error('Error parsing response:', parseError);
              // Fallback: return raw body as text
              const text = await response.text();
              console.log('Raw response:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
              res.send(text);
            }
          })
          .catch(error => {
            console.error('Error forwarding request:', error);
            res.status(500).send(`Error forwarding request: ${error.message}`);
          });
      }
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