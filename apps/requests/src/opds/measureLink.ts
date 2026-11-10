import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import { BOOK_FILE_TYPES } from '@ValenceRequests/opds/BOOK_FILE_TYPES';
import type { ReleaseFile } from '@ValenceRequests/indexers/ReleaseFile';
import { safeFileName } from '@ValenceCore/functions/safeFileName';
import { saying } from '@ValenceI18n/saying';

type LinkFetch = (
  url: string,
  init: { headers: Record<string, string>; signal: AbortSignal },
) => Promise<Response>;

/**
 * The file name a download says it has, read from its Content-Disposition, or else the last part
 * of its address, with the extension its type calls for where it lacks one.
 *
 * @param url - Where it is downloaded from.
 * @param disposition - Its Content-Disposition, where it sent one.
 * @param type - Its content type.
 * @returns The name.
 */
const fileNameOf = (url: string, disposition: string | null, type: string): string => {
  const encoded = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(disposition ?? '')?.[1];
  const plain = /filename="?([^";]+)"?/i.exec(disposition ?? '')?.[1];
  const fromAddress = decodeURIComponent(new URL(url).pathname.split('/').at(-1) ?? '');
  const named = safeFileName(
    encoded === undefined ? (plain ?? fromAddress) : decodeURIComponent(encoded),
  );
  const extension = BOOK_FILE_TYPES[type]?.extension;
  const base = named === '' ? 'book' : named;

  return extension === undefined || base.toLowerCase().endsWith(`.${extension}`)
    ? base
    : `${base}.${extension}`;
};

/**
 * Reads how big a book behind a link is and what it is called, by asking for its first byte rather
 * than downloading it, so the direct download client can fetch it knowing what to expect.
 *
 * @param fetch - How to ask.
 * @param url - Where the book is.
 * @param timeoutSeconds - How long to wait for an answer.
 * @returns The link to download, with its name and size.
 */
const measureLink = async (
  fetch: LinkFetch,
  url: string,
  timeoutSeconds: number,
): Promise<ReleaseFile> => {
  let response: Response;

  try {
    response = await fetch(url, {
      headers: { range: 'bytes=0-0' },
      signal: AbortSignal.timeout(timeoutSeconds * 1000),
    });
  } catch {
    throw new IndexerFailure(saying('requests.indexers.indexerService.theIndexerCouldNotBeAsked'));
  }

  await response.body?.cancel().catch(() => undefined);

  const total =
    response.status === 206
      ? Number(/\/(\d+)$/.exec(response.headers.get('content-range') ?? '')?.[1])
      : Number(response.headers.get('content-length'));

  if (!response.ok || !Number.isInteger(total) || total <= 0) {
    throw new IndexerFailure(
      saying('requests.opds.opdsCatalogue.theBookCouldNotBeSized', {
        status: response.status.toString(),
      }),
    );
  }

  const type = (response.headers.get('content-type') ?? '').split(';')[0]?.trim() ?? '';
  const landed = response.url === '' ? url : response.url;

  return {
    kind: 'link',
    url: landed,
    name: fileNameOf(landed, response.headers.get('content-disposition'), type.toLowerCase()),
    sizeBytes: total,
  };
};

export type { LinkFetch };

export { measureLink };
