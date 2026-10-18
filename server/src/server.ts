import { createServer } from 'http';
import { Server } from 'socket.io';
import { createApp } from './app';
import { config } from './config';
import mongoose from 'mongoose';
import { authenticateSocket } from './sockets/auth';
import { registerMessageHandlers } from './sockets/messages';

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

async function start(): Promise<void> {
  await mongoose.connect(config.mongodbUri);
  console.log(`🗄️  Connected to MongoDB`);

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
