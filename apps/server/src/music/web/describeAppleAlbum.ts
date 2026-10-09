import { z } from 'zod';
import { appleEditorialNotesIn } from './appleEditorialNotesIn';
import { findAppleAlbum } from './findAppleAlbum';
import type { CatalogueTrack } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MusicWeb } from './createMusicWeb';

const SongsSchema = z.object({
  results: z
    .array(
      z.object({
        wrapperType: z.string().catch(''),
        kind: z.string().catch(''),
        discNumber: z.number().int().positive().catch(1),
        trackNumber: z.number().int().nonnegative().catch(0),
        trackName: z.string().catch(''),
        trackTimeMillis: z.number().nonnegative().nullable().catch(null),
      }),
    )
    .catch([]),
});

const MARKED_YEAR = /^\s*[℗©](?:\s*\d{4})?\s*/u;

type AppleAlbumDetail = {
  notes: string | null;
  genre: string | null;
  label: string | null;
  tracks: CatalogueTrack[];
};

/**
 * What Apple Music says of an album that MusicBrainz does not: what its editors wrote about it,
 * its genre, the label it came out on and its songs in order, disc by disc. The songs and the rest
 * come from the iTunes catalogue and the notes from the album's public page, neither of which needs
 * a key.
 *
 * @param web - The way out to the web.
 * @param album - What the album is called and who it is by.
 * @returns What Apple says of it, or nothing where Apple does not have it.
 */
const describeAppleAlbum = async (
  web: MusicWeb,
  album: { title: string; artistName: string },
): Promise<AppleAlbumDetail | null> => {
  const found = await findAppleAlbum(web, album);

  if (found === null) {
    return null;
  }

  const [listed, page] = await Promise.all([
    web.json(`https://itunes.apple.com/lookup?id=${found.id.toString()}&entity=song&limit=200`),
    found.link === null ? Promise.resolve(null) : web.text(found.link.split('?')[0] ?? found.link),
  ]);
  const songs = SongsSchema.safeParse(listed);
  const label = found.copyright?.replace(MARKED_YEAR, '').trim() ?? '';

  return {
    notes: page === null ? null : appleEditorialNotesIn(page),
    genre: found.genre,
    label: label === '' ? null : label,
    tracks: (songs.success ? songs.data.results : [])
      .filter((one) => one.wrapperType === 'track' && one.kind === 'song')
      .map((one) => ({
        disc: one.discNumber,
        number: one.trackNumber,
        title: one.trackName,
        seconds: one.trackTimeMillis === null ? null : Math.round(one.trackTimeMillis / 1000),
      }))
      .toSorted((left, right) => left.disc - right.disc || left.number - right.number),
  };
};

export type { AppleAlbumDetail };

export { describeAppleAlbum };
