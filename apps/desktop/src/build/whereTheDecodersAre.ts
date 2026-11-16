import { isAbsolute, join } from 'node:path';

type DecodersPlaces = { built: string; shipped: string };

const TARGET = 'wasm32-unknown-unknown';

const BUILT_AS = 'valence_browser_decoders.wasm';

const SERVED_AS = 'valence-browser-decoders.wasm';

/**
 * Where Cargo writes the browser decoders it builds for WebAssembly, and where the app's pages
 * ship them, so the player finds them at `/decoders/valence-browser-decoders.wasm` as it does on a
 * server.
 *
 * @param repository - The repository's root, where Cargo builds the workspace.
 * @param app - The desktop app's folder, whose `public` folder Vite ships as it is.
 * @param targetFolder - Where Cargo was told to build instead, where it was.
 * @returns The file Cargo builds, and where it goes to be shipped.
 */
const whereTheDecodersAre = (
  repository: string,
  app: string,
  targetFolder?: string,
): DecodersPlaces => {
  const target =
    targetFolder === undefined || targetFolder === ''
      ? join(repository, 'target')
      : isAbsolute(targetFolder)
        ? targetFolder
        : join(repository, targetFolder);

  return {
    built: join(target, TARGET, 'release', BUILT_AS),
    shipped: join(app, 'public', 'decoders', SERVED_AS),
  };
};

export { whereTheDecodersAre };
