import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { Said } from '@ValenceI18n/SaidSchema';
import { createHash } from 'node:crypto';
import { describeFailure } from '@ValenceServer/logging/describeFailure';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { narrowPicture } from '@ValenceServer/images/narrowPicture';
import { rasterOfCataloguePicture } from '@ValenceServer/images/rasterOfCataloguePicture';
import { saying } from '@ValenceI18n/saying';
import { ARTWORK_WIDTHS } from '@ValenceContracts/constants/ARTWORK_WIDTHS';
import { nameOfSource } from '@ValenceServer/sources/nameOfSource';
import { reportStatus } from '@ValenceServer/sources/reportStatus';
import { troubleWatch } from '@ValenceServer/sources/troubleWatch';

type CachedImage = {
  body: ArrayBuffer;
  contentType: string;
};

type ImageFetcher = (url: string) => Promise<{
  ok: boolean;
  status: number;
  headers: { get: (name: string) => string | null };
  arrayBuffer: () => Promise<ArrayBuffer>;
}>;

type Publishing = {
  directory: string;
  nameOf: (url: string) => Promise<string>;
};

type CreateImageCacheOptions = {
  directory: string;
  fetchImpl?: ImageFetcher;
  onProblem?: (url: string, reason: Said) => void;
  publish?: Publishing;
};

const MAX_BYTES = 32 * 1024 * 1024;

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

/**
 * Holds artwork fetched from a catalogue on this server's own disk, so a browser drawing a library
 * never talks to the catalogue — which is the point of self-hosting, and why covers do not vanish
 * when a third party reorganises its addresses.
 *
 * A catalogue logo kept as an SVG drawing is fetched as the PNG the catalogue serves beside it, and
 * kept under the drawing's address, so a title whose best logo is a drawing still has one.
 *
 * A picture can also be asked for narrower, for a grid that draws it a few hundred pixels wide: the
 * narrower copy is made once from the whole one and kept beside it, so a phone scrolling a library
 * neither downloads nor decodes posters several times the size it shows them.
 *
 * Where asked to, each narrower copy is also kept under the name it is served by where anybody may
 * fetch it, in a folder of its own, so a proxy in front of the server can hand it out straight from
 * the disk. Forgetting a picture forgets those copies too.
 *
 * @param options - Where to keep the files, and how to fetch what is missing.
 * @returns The cache, which fetches on a miss and serves from disk thereafter.
 */
const createImageCache = ({ directory, fetchImpl, onProblem, publish }: CreateImageCacheOptions) => {
  const fetchOut: ImageFetcher = fetchImpl ?? ((url: string) => fetch(url));

  const call: ImageFetcher = async (url) => {
    try {
      return await fetchOut(rasterOfCataloguePicture(url));
    } catch (error) {
      troubleWatch.report({ source: nameOfSource(url), reason: 'unreachable' });

      throw error;
    }
  };

  const nameFor = (url: string): string => createHash('sha256').update(url).digest('hex');

  const readWhole = async (url: string): Promise<CachedImage | null> => {
    const name = nameFor(url);
    const path = join(directory, name);

    try {
      const cached = await readFile(path);
      const type = await readFile(`${path}.type`, 'utf8').catch(() => 'image/jpeg');

      return {
        body: cached.buffer.slice(cached.byteOffset, cached.byteOffset + cached.byteLength),
        contentType: type,
      };
    } catch {}

    try {
      const response = await call(url);

      if (!response.ok) {
        reportStatus(url, response.status);

        onProblem?.(
          url,
          saying('server.images.imageCache.theCatalogueAnsweredStatus', {
            status: response.status.toString(),
          }),
        );

        return null;
      }

      const contentType = response.headers.get('content-type') ?? 'image/jpeg';

      if (!IMAGE_TYPES.has(contentType.split(';')[0]?.trim() ?? '')) {
        onProblem?.(
          url,
          saying('server.images.imageCache.thatIsNotAnImageContentType', { contentType }),
        );

        return null;
      }

      const body = await response.arrayBuffer();

      if (body.byteLength > MAX_BYTES) {
        onProblem?.(
          url,
          saying('server.images.imageTooLarge', {
            megabytes: Math.round(body.byteLength / 1024 / 1024).toString(),
          }),
        );

        return null;
      }

      await mkdir(directory, { recursive: true });
      await writeFile(path, Buffer.from(body));
      await writeFile(`${path}.type`, contentType);

      return { body, contentType };
    } catch (error) {
      onProblem?.(
        url,
        error instanceof Error
          ? sayVerbatim(describeFailure(error))
          : saying('server.images.imageCache.unreachable'),
      );

      return null;
    }
  };

  const published = new Set<string>();

  const publicPathOf = async (url: string, width: number): Promise<string | null> =>
    publish === undefined
      ? null
      : join(publish.directory, `${await publish.nameOf(url)}-w${width.toString()}.webp`);

  const publishCopy = async (url: string, width: number, body: Uint8Array): Promise<void> => {
    const path = await publicPathOf(url, width);

    if (path === null || published.has(path)) {
      return;
    }

    const isThere = await access(path).then(
      () => true,
      () => false,
    );

    if (!isThere) {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, body);
    }

    published.add(path);
  };

  const readNarrowed = async (url: string, width: number): Promise<CachedImage | null> => {
    const path = join(directory, `${nameFor(url)}-w${width.toString()}`);
    const kept = await readFile(path).catch(() => null);

    if (kept !== null) {
      await publishCopy(url, width, kept).catch(() => undefined);

      return {
        body: kept.buffer.slice(kept.byteOffset, kept.byteOffset + kept.byteLength),
        contentType: 'image/webp',
      };
    }

    const whole = await readWhole(url);

    if (whole === null) {
      return null;
    }

    const narrowed = await narrowPicture(Buffer.from(whole.body), width);

    if (narrowed === null) {
      return whole;
    }

    await writeFile(path, narrowed).catch(() => null);
    await publishCopy(url, width, narrowed).catch(() => undefined);

    return {
      body: narrowed.buffer.slice(narrowed.byteOffset, narrowed.byteOffset + narrowed.byteLength),
      contentType: 'image/webp',
    };
  };

  return {
    read: async (url: string, width?: number): Promise<CachedImage | null> =>
      width === undefined ? readWhole(url) : readNarrowed(url, width),

    forget: async (url: string): Promise<void> => {
      const path = join(directory, nameFor(url));

      await rm(path, { force: true });
      await rm(`${path}.type`, { force: true });
      await Promise.all(
        Object.values(ARTWORK_WIDTHS).map(async (width) => {
          const copy = await publicPathOf(url, width);

          if (copy !== null) {
            published.delete(copy);
          }

          await Promise.all([
            rm(`${path}-w${width.toString()}`, { force: true }),
            ...(copy === null ? [] : [rm(copy, { force: true })]),
          ]);
        }),
      );
    },

    nameFor,
  };
};

export type { ImageFetcher };

export { createImageCache };
