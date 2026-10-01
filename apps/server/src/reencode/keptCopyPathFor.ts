import { basename, dirname, extname, join } from 'node:path';
import { QUALITY_STEPS } from '@ValenceContracts/schemas/QualityStep';
import { KEPT_COPY_MARK } from '@ValenceServer/library/isKeptCopy';
import { reencodePathsFor } from './reencodePathsFor';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { ReencodeSettings } from '@ValenceContracts/schemas/Reencode';

type KeptCopyPath = {
  directory: string;
  output: string;
};

type KeptCopyPathOptions = {
  libraryPath: string;
  originalPath: string;
  requestId: string;
  item: Pick<MediaItem, 'width' | 'height' | 'videoCodec'>;
  settings: ReencodeSettings;
};

/**
 * The rung a copy's picture will turn out at: the one asked for where the original is taller, and
 * the original's own otherwise, since nothing is ever made larger than it was.
 *
 * @param item - The original's picture.
 * @param settings - What was asked for.
 * @returns The rung's name, such as 1080p.
 */
const rungOf = (item: Pick<MediaItem, 'width' | 'height'>, settings: ReencodeSettings): string => {
  const asked = QUALITY_STEPS.find((step) => step.id === settings.quality);

  if (asked !== undefined && item.height > asked.maxHeight) {
    return asked.id;
  }

  return (
    QUALITY_STEPS.find((step) => item.width >= step.maxWidth || item.height >= step.maxHeight)
      ?.id ?? `${item.height.toString()}p`
  );
};

/**
 * Where a copy kept alongside a film is written: in the library's own Valence folder under the
 * request's identifier, or beside the film under a name a person can read, such as
 * `Arrival (2016) - 1080p H264 3000kbps.valence.mp4`.
 *
 * The name beside the film is made only from the film and what was asked for, so asking twice for
 * the same thing names the same file rather than making a second one. It ends in `.valence.` and an
 * extension, which is what keeps the scanner from ever taking it for a film.
 *
 * @param options - The library, the film, the request, the film's picture and what was asked for.
 * @returns The folder that must be writable, and the file to write.
 */
const keptCopyPathFor = ({
  libraryPath,
  originalPath,
  requestId,
  item,
  settings,
}: KeptCopyPathOptions): KeptCopyPath => {
  const ownExtension = extname(originalPath).slice(1);
  const extension = settings.container ?? ownExtension;

  if (settings.placement !== 'beside') {
    const { directory } = reencodePathsFor(libraryPath, originalPath, requestId);

    return {
      directory,
      output: `${directory}/${requestId}${extension === '' ? '' : `.${extension}`}`,
    };
  }

  const directory = dirname(originalPath);
  const stem = basename(originalPath, extname(originalPath));
  const codec = (settings.videoCodec ?? item.videoCodec).toUpperCase();
  const bitrate =
    settings.maxBitrateKbps === undefined ? '' : ` ${settings.maxBitrateKbps.toString()}kbps`;
  const mark = KEPT_COPY_MARK.slice(0, -1);

  return {
    directory,
    output: join(
      directory,
      `${stem} - ${rungOf(item, settings)} ${codec}${bitrate}${mark}.${extension}`,
    ),
  };
};

export type { KeptCopyPath, KeptCopyPathOptions };

export { keptCopyPathFor };
