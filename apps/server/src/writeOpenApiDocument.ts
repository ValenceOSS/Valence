import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createApp } from '@ValenceServer/App';
import { createMemoryAuth } from '@ValenceServer/auth/createMemoryAuth';
import { createMemoryLibraryService } from '@ValenceServer/library/createMemoryLibraryService';
import { createMemoryWatchProgressService } from '@ValenceServer/progress/createMemoryWatchProgressService';
import { createMemoryFavouriteService } from '@ValenceServer/favourites/createMemoryFavouriteService';
import { createMemoryRatingService } from '@ValenceServer/ratings/createMemoryRatingService';
import { createMemorySegmentService } from '@ValenceServer/segments/createMemorySegmentService';
import { createMemorySubtitleService } from '@ValenceServer/subtitles/createMemorySubtitleService';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';

/**
 * Writes the API's OpenAPI document to a file, for the documentation site to serve.
 *
 * The document is read off a server built over in-memory services rather than a real database,
 * because it is made of the route declarations and nothing that a request would fill in. That keeps
 * a docs build from needing Postgres, and means the reference is the routes as they are rather than
 * a hand-written copy that drifts from them.
 */
const run = async (): Promise<void> => {
  const target = process.argv[2];

  if (target === undefined) {
    throw new Error('Say where to write the document, e.g. public/openapi.json.');
  }

  const { auth, settings } = createMemoryAuth();
  const app = createApp({
    auth,
    settings,
    countUsers: () => Promise.resolve(1),
    promoteToAdmin: () => Promise.resolve(null),
    library: createMemoryLibraryService(),
    subtitles: createMemorySubtitleService(),
    segments: createMemorySegmentService(),
    progress: createMemoryWatchProgressService(),
    favourites: createMemoryFavouriteService(),
    ratings: createMemoryRatingService(),
    playback: createMemoryPlaybackService(),
  });

  const response = await app.request('/api/openapi.json');

  if (!response.ok) {
    throw new Error(`The API answered ${response.status.toString()} for its own document.`);
  }

  const path = resolve(process.cwd(), target);

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(await response.json(), null, 2));
  process.stdout.write(`Wrote ${path}\n`);
};

try {
  await run();
} catch (problem) {
  process.stderr.write(
    `The API document could not be written: ${problem instanceof Error ? problem.message : 'no reason given'}\n`,
  );
  process.exitCode = 1;
}
