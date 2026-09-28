import { vi } from 'vitest';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';

/**
 * A way out to the web that answers each address with what it is given for the first path found in
 * it, and with nothing for any other.
 *
 * @param answers - What to say, by a part of the address it is asked at.
 * @param pages - The pages to answer with as text, by a part of their address.
 * @returns The web, its asks kept for a test to read.
 */
const aWebThatAnswers = (
  answers: Record<string, JsonValue>,
  pages: Record<string, string> = {},
) => {
  const web = {
    json: vi.fn((url: string): Promise<JsonValue | null> =>
      Promise.resolve(Object.entries(answers).find(([path]) => url.includes(path))?.[1] ?? null),
    ),
    bytes: vi.fn((): Promise<Uint8Array | null> => Promise.resolve(null)),
    text: vi.fn((url: string): Promise<string | null> =>
      Promise.resolve(Object.entries(pages).find(([path]) => url.includes(path))?.[1] ?? null),
    ),
  };

  return web satisfies MusicWeb;
};

export { aWebThatAnswers };
