import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define schema for environment variables with validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DB_CONNECTION_STRING: z.string({
    required_error: 'MongoDB connection string is required',
  }),
  OPENAI_API_KEY: z.string({
    required_error: 'OpenAI API key is required',
  }),
  CAPABILITIES_PATH: z.string().default(path.resolve(__dirname, '../../capabilities.json')),
  EDITION: z.enum(["db","api"]).default("api"),
  PROXY_URL: z.string().default("http://localhost:8001/api/mcp")
});

// Validate environment variables
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error(
    '❌ Invalid environment variables:',
    _env.error.flatten().fieldErrors
  );
  throw new Error('Invalid environment variables');
}

export const env = _env.data; 