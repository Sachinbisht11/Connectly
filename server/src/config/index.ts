import { fileURLToPath } from 'node:url';
import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load the root .env (monorepo root) regardless of the working directory the
// server is started from (e.g. `npm run dev --workspace=server` runs from server/).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5001),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),
  UPLOAD_DIR: z.string().default('./uploads'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  for (const [, issues] of Object.entries(parsed.error.flatten().fieldErrors)) {
    for (const issue of issues) {
      console.error(`  - ${issue}`);
    }
  }
  process.exit(1);
}

export const config = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  mongodbUri: parsed.data.MONGODB_URI,
  jwtSecret: parsed.data.JWT_SECRET,
  jwtExpiresIn: parsed.data.JWT_EXPIRES_IN,
  corsOrigin: parsed.data.CORS_ORIGIN,
  uploadDir: parsed.data.UPLOAD_DIR,
} as const;

export type Config = typeof config;
