import { createSourceReader } from './createSourceReader';
import type { ImportServices } from './ImportServices';
import type { StoredImportSource } from './ImportRecords';
import type { SourceReader } from './SourceReader';

/**
 * The reader for a source an administrator connected, with the tokens resolved for its people.
 *
 * @param services - What the import works with, which may supply its own readers.
 * @param source - The source.
 * @param regions - The certification systems its ratings are read in.
 * @returns The reader.
 */
const readerOfSource = (
  services: Pick<ImportServices, 'fetch' | 'readerFor'>,
  source: StoredImportSource,
  regions: readonly string[],
): SourceReader =>
  services.readerFor?.(source, regions) ??
  createSourceReader(
    {
      kind: source.kind,
      url: source.url,
      token: source.token,
      clientId: source.details.clientId === '' ? source.id : source.details.clientId,
      userTokens: source.details.userTokens,
    },
    services.fetch,
    regions,
  );

export { readerOfSource };
