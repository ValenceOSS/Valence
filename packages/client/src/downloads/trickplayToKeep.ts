import { z } from 'zod';
import { parseTrickplayIndex } from '@ValenceClient/playback/fetchTrickplay';

const IndexSchema = z.object({ url: z.string() });

const PLAIN_NAME = /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/u;

type TrickplayToKeep = {
  vtt: string;
  sheets: { name: string; from: string }[];
};

/**
 * Asks the server for a film's thumbnails and says what keeping them would take: the index as it
 * stands, and each sheet it names with where the server has it.
 *
 * Asking is also what has the server make them, so a film downloaded before they exist answers with
 * nothing the first time and can be asked again later. A sheet whose name would reach outside the
 * folder it is kept in is not kept.
 *
 * @param ask - How to ask the server, given a path on it.
 * @param mediaId - The film.
 * @returns The index and its sheets, or null where there are none yet.
 */
const trickplayToKeep = async (
  ask: (path: string, how?: RequestInit) => Promise<Response>,
  mediaId: string,
): Promise<TrickplayToKeep | null> => {
  try {
    const asked = await ask(`/api/playback/${mediaId}/trickplay`, { method: 'POST' });

    if (!asked.ok) {
      return null;
    }

    const { url } = IndexSchema.parse(await asked.json());
    const index = await ask(url);

    if (!index.ok) {
      return null;
    }

    const vtt = await index.text();
    const named = parseTrickplayIndex(vtt, '');
    const served = parseTrickplayIndex(vtt, url);
    const sheets = new Map<string, string>();

    for (const [place, thumbnail] of named.entries()) {
      const from = served[place]?.sheetUrl;

      if (!PLAIN_NAME.test(thumbnail.sheetUrl) || from === undefined) {
        return null;
      }

      sheets.set(thumbnail.sheetUrl, from);
    }

    return sheets.size === 0
      ? null
      : { vtt, sheets: [...sheets].map(([name, from]) => ({ name, from })) };
  } catch {
    return null;
  }
};

export type { TrickplayToKeep };

export { trickplayToKeep };
