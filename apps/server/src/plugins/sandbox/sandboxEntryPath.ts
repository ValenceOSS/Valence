import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const NamedPackageSchema = z.object({ name: z.string() });

/**
 * Where the server's own package sits on disk, found by walking up from wherever this code is
 * running — the source in development, the bundle in production — until the server's
 * `package.json` is reached.
 *
 * @param from - A file inside the server.
 * @returns The server's folder.
 */
const serverRootFrom = (from: string): string => {
  let at = dirname(from);

  while (at !== dirname(at)) {
    const manifest = join(at, 'package.json');

    if (existsSync(manifest)) {
      const read = NamedPackageSchema.safeParse(JSON.parse(readFileSync(manifest, 'utf8')));

      if (read.success && read.data.name === '@valence/server') {
        return at;
      }
    }

    at = dirname(at);
  }

  throw new Error('The server could not find its own folder to start a plugin sandbox from.');
};

/**
 * The file a plugin's sandbox process runs, and the folders that process is allowed to read: its own
 * folder, the server's `package.json` Node reads to know the file is a module, and the
 * `node_modules` folders QuickJS and Zod are loaded from. Nothing else.
 *
 * @param from - A file inside the server, normally this module's own address.
 * @returns The entry and what it may read.
 */
const sandboxEntryPath = (
  from: string = fileURLToPath(import.meta.url),
): { entry: string; readable: string[] } => {
  const root = serverRootFrom(from);
  const folder = join(root, 'src', 'plugins', 'sandbox');
  const modules: string[] = [];

  let at = root;

  while (at !== dirname(at)) {
    if (existsSync(join(at, 'node_modules'))) {
      modules.push(join(at, 'node_modules'));
    }

    at = dirname(at);
  }

  return {
    entry: join(folder, 'runPluginSandbox.ts'),
    readable: [folder, join(root, 'package.json'), ...modules],
  };
};

export { sandboxEntryPath };
