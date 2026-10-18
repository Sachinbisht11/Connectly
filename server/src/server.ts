import { createServer } from 'http';
import { createApp } from './app';
import { config } from './config';
import mongoose from 'mongoose';

const app = createApp();
const httpServer = createServer(app);

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
