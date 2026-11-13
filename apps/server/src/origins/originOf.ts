import type {
  FiledOrigin,
  MediaLink,
  MediaOrigin,
  RecordedSource,
} from '@ValenceContracts/schemas/MediaOrigin';

/**
 * Says where one file came from: what the requests service filed comes first, since it knows the
 * download client or app that fetched it; then what the server recorded of an upload or an import;
 * and anything else was found on the disk by a scan.
 *
 * @param filed - What the requests service says it filed there, if anything.
 * @param recorded - What the server recorded of it, if anything.
 * @param link - Whether the file is linked to another copy on the disk now.
 * @returns Where it came from.
 */
const originOf = (
  filed: FiledOrigin | undefined,
  recorded: { source: RecordedSource; via: string | null } | undefined,
  link: MediaLink | null,
): MediaOrigin => {
  if (filed !== undefined) {
    return { ...filed, link };
  }

  if (recorded !== undefined) {
    return { ...recorded, link };
  }

  return { source: 'disk', via: null, link };
};

export { originOf };
