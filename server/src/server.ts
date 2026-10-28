import { createServer } from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { config } from './config/index.js';
import mongoose from 'mongoose';
import { authenticateSocket } from './sockets/auth.js';
import { registerMessageHandlers } from './sockets/messages.js';
import { processDueScheduledMessages } from './modules/scheduledMessages/service.js';

const app = createApp();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigin,
    credentials: true,
  },
});

io.use(authenticateSocket);
registerMessageHandlers(io);

// Scheduled messages worker - runs every 10 seconds
const SCHEDULED_WORKER_INTERVAL_MS = 10_000;

async function startScheduledWorker(): Promise<void> {
  console.log('⏰ Starting scheduled messages worker');
  setInterval(async () => {
    try {
      const processed = await processDueScheduledMessages(io);
      if (processed > 0) {
        console.log(`⏰ Processed ${processed} scheduled message(s)`);
      }
    } catch (err) {
      console.error('❌ Scheduled worker error:', err);
    }
  }, SCHEDULED_WORKER_INTERVAL_MS);
}

async function start(): Promise<void> {
  await mongoose.connect(config.mongodbUri);
  console.log(`🗄️  Connected to MongoDB`);

  // Start scheduled messages worker
  await startScheduledWorker();

  httpServer.listen(config.port, () => {
    console.log(
      `🚀 Connectly API running on http://localhost:${config.port} (${config.nodeEnv})`
    );
  });
}

start().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

export default httpServer;
export { io };
