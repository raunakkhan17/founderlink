import http from 'http';
import app from './app';
import { config } from './config/env';
import { connectMongoDB } from './config/database';
import { connectRedis } from './config/redis';
import { initializeSockets } from './sockets';

const server = http.createServer(app);

// Initialize WebSockets
initializeSockets(server);

// Start server and initialize services
const startServer = async () => {
  try {
    // Attempt connections (async, non-blocking if offline in development)
    await connectMongoDB();
    connectRedis();

    server.listen(config.PORT, () => {
      console.log(`🚀 FounderLink Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
      console.log(`👉 Health check available at: http://localhost:${config.PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { server, app };
