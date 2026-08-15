import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
// src/ in dev (tsx), dist/ after a build — both are one level under server/.
const serverRoot = path.resolve(here, '..');
const repoRoot = path.resolve(serverRoot, '..');

export const env = {
  port: Number(process.env.PORT ?? 4000),

  /** Empty = run on the JSON file store. No Mongo required to boot. */
  mongoUri: process.env.MONGODB_URI?.trim() ?? '',
  dbName: process.env.MONGODB_DB?.trim() || 'dropzone',

  /** Unset = /admin cannot be signed into and every write is refused. */
  adminToken: process.env.ADMIN_TOKEN?.trim() ?? '',

  /** Only needed if the site and the API live on different domains. Empty
   *  means no CORS headers at all, which is the safest default. */
  allowedOrigin: process.env.ALLOWED_ORIGIN?.trim() ?? '',

  /** The hand-edited JSON lives here. */
  dataDir: process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(serverRoot, 'data'),

  clientDist: path.join(repoRoot, 'client', 'dist'),

  isProduction: process.env.NODE_ENV === 'production',
};
