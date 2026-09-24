import { z } from 'zod';

const ITunesAnswerSchema = z.object({
  results: z.array(
    z.object({
      collectionName: z.string().optional(),
      artistName: z.string().optional(),
      previewUrl: z.string().url().optional(),
    }),
  ),
});

const PREVIEWS_FROM = /^https:\/\/[a-z0-9.-]+\.(?:apple|mzstatic)\.com\//;

/**
 * Reads a name for comparing, the way two catalogues spell the same album differently: in any case,
 * without what is in brackets — an edition, a remaster, a bonus disc — and without punctuation.
 *
 * @param name - The name.
 * @returns It, plainly.
 */
const plainly = (name: string): string =>
  name
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

/**
 * Finds a short sample of an album — half a minute of one of its songs — from Apple's public music
 * search, which offers one for most of what it sells and asks for no key. A song from the album
 * itself is chosen where one is offered, and one by the same artist otherwise; nothing is made up
 * where neither is there.
 *
 * Only an address on Apple's own servers is handed back, since the page plays whatever it is given.
 *
 * @param ask - How to fetch, which a test replaces.
 * @param artist - Who the album is by.
 * @param album - The album.
 * @returns Where the sample plays from, or nothing.
 */
const findASample = async (
  ask: (url: string) => Promise<Response>,
  artist: string,
  album: string,
): Promise<string | null> => {
  const query = new URLSearchParams({
    term: `${artist} ${album}`,
    media: 'music',
    entity: 'song',
    limit: '25',
  });
  const answer = await ask(`https://itunes.apple.com/search?${query.toString()}`).catch(() => null);

  if (answer === null || !answer.ok) {
    return null;
  }

  const read = ITunesAnswerSchema.safeParse(await answer.json().catch(() => null));

  if (!read.success) {
    return null;
  }

  const playable = read.data.results.filter(
    (one) => one.previewUrl !== undefined && PREVIEWS_FROM.test(one.previewUrl),
  );
  const byTheArtist = playable.filter((one) => plainly(one.artistName ?? '') === plainly(artist));
  const onTheAlbum = byTheArtist.find(
    (one) => plainly(one.collectionName ?? '') === plainly(album),
  );

  return (onTheAlbum ?? byTheArtist[0])?.previewUrl ?? null;
};

export { findASample };
