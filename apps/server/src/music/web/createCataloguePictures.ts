import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { nameKey } from '@ValenceServer/music/nameKey';
import { findAppleAlbumCoverUrl } from './findAppleAlbumCoverUrl';
import { findAppleArtistPictureUrl } from './findAppleArtistPictureUrl';
import { findDeezerArtistPictureUrl } from './findDeezerArtistPictureUrl';
import type { MusicWeb } from './createMusicWeb';

const NOTHING_LASTS_MS = 7 * 24 * 60 * 60 * 1000;

type CataloguePicture = {
  body: ArrayBuffer;
  contentType: string;
};

type CataloguePicturesOptions = {
  directory: string;
  web: MusicWeb;
  readImage: (url: string) => Promise<CataloguePicture | null>;
  now?: () => number;
};

type CataloguePictures = {
  cover: (
    releaseGroupId: string,
    hint: { title: string; artist: string } | null,
  ) => Promise<CataloguePicture | null>;
  artistPicture: (name: string, coverOf: string | null) => Promise<CataloguePicture | null>;
};

/**
 * The pictures shown while somebody looks for music to ask for — album covers and artists' faces —
 * found once, kept on this server's disk, and served from there to everybody after.
 *
 * A cover is taken from the Cover Art Archive, and from Apple's catalogue where the archive has
 * none; an artist's face from Deezer, or their public Apple Music page, or else the cover of their newest
 * record. Neither needs a key. Where each picture came from is remembered beside it, and so is
 * finding nothing, for a week, so a search that turns up the same records again asks nobody.
 * Asking twice at once for a picture not yet found finds it once.
 *
 * @param options - Where to remember what was found, the way out to the web, the disk cache the
 *   pictures themselves are kept in, and — for a test — how to tell the time.
 * @returns A way to read a cover and an artist's picture.
 */
const createCataloguePictures = ({
  directory,
  web,
  readImage,
  now = () => Date.now(),
}: CataloguePicturesOptions): CataloguePictures => {
  const finding = new Map<string, Promise<string | null>>();

  const fileFor = (key: string): string =>
    join(directory, createHash('sha256').update(key).digest('hex'));

  const remembered = async (key: string): Promise<string | null | undefined> => {
    const file = fileFor(key);
    const said = await readFile(file, 'utf8').catch(() => null);

    if (said === null) {
      return undefined;
    }

    if (said !== '') {
      return said;
    }

    const written = await stat(file).catch(() => null);

    return written !== null && now() - written.mtimeMs < NOTHING_LASTS_MS ? null : undefined;
  };

  const whereIs = (key: string, find: () => Promise<string | null>): Promise<string | null> => {
    const already = finding.get(key);

    if (already !== undefined) {
      return already;
    }

    const looking = (async () => {
      const known = await remembered(key);

      if (known !== undefined) {
        return known;
      }

      const found = await find();

      await mkdir(directory, { recursive: true });
      await writeFile(fileFor(key), found ?? '');

      return found;
    })().finally(() => {
      finding.delete(key);
    });

    finding.set(key, looking);

    return looking;
  };

  const readable = async (address: string | null): Promise<string | null> =>
    address !== null && (await readImage(address)) !== null ? address : null;

  const cover: CataloguePictures['cover'] = async (releaseGroupId, hint) => {
    const address = await whereIs(`cover:${releaseGroupId}`, async () => {
      const archived = await readable(
        `https://coverartarchive.org/release-group/${encodeURIComponent(releaseGroupId)}/front-500`,
      );

      return (
        archived ??
        (hint === null
          ? null
          : await readable(
              await findAppleAlbumCoverUrl(web, { title: hint.title, artistName: hint.artist }),
            ))
      );
    });

    return address === null ? null : readImage(address);
  };

  return {
    cover,
    artistPicture: async (name, coverOf) => {
      const address = await whereIs(
        `artist:${nameKey(name)}`,
        async () =>
          (await readable(await findDeezerArtistPictureUrl(web, name))) ??
          readable(await findAppleArtistPictureUrl(web, name)),
      );

      if (address !== null) {
        return readImage(address);
      }

      return coverOf === null ? null : cover(coverOf, null);
    },
  };
};

export type { CataloguePicture, CataloguePictures };

export { createCataloguePictures };
