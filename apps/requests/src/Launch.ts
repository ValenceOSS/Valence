import { launchPath } from '@ValenceDatabase/launchPath';
import { readEnv } from '@ValenceRequests/env/Env';

await import(launchPath(import.meta.url, readEnv(process.env).DATABASE_URL));
