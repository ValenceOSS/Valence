import { z } from 'zod';
import {
  UPLOAD_PIECE_BYTES,
  UploadPiecesSchema,
  UploadStartedSchema,
} from '@ValenceContracts/schemas/UploadPieces';

const UploadedSchema = z.object({ path: z.string(), bytes: z.number().int().nonnegative() });

const ErrorBodySchema = z.object({ error: z.string() });

const TRIES = 4;

type Uploaded = z.infer<typeof UploadedSchema>;

type UploadOptions = {
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
  pauseFor?: (milliseconds: number) => Promise<void>;
};

/**
 * Reads what the server said about a request it would not answer, in its own words where it gave
 * any.
 *
 * @param response - What it answered.
 * @returns An error carrying those words.
 */
const refusalFrom = async (response: Response): Promise<Error> => {
  const parsed = ErrorBodySchema.safeParse(await response.json().catch(() => null));

  return new Error(parsed.success ? parsed.data.error : 'The file could not be uploaded.');
};

/**
 * Waits a while, the way an upload does between tries.
 *
 * @param milliseconds - How long.
 */
const pause = (milliseconds: number): Promise<void> =>
  new Promise((done) => {
    setTimeout(done, milliseconds);
  });

/**
 * Sends one file from this device into a library, never holding it whole in memory on either end.
 *
 * A file no larger than a piece goes as the body of a single request. A larger one goes in pieces,
 * each its own request, so that a proxy capping what one request may carry — Cloudflare's is 100 MB
 * — lets it through: each piece is tried again where the connection drops or the server stumbles,
 * after asking which pieces already arrived so none is sent twice, and the upload is thrown away on
 * the server if it is cancelled or cannot be finished.
 *
 * @param libraryId - The library to put it in.
 * @param path - Where in the library it goes, with `/` between folders.
 * @param file - The file itself.
 * @param options - Told how much has arrived as it goes, and a signal that cancels it.
 * @returns Where it was put, and how much arrived.
 * @throws With the server's own words where it would not take it, which say what to change.
 */
const uploadMedia = async (
  libraryId: string,
  path: string,
  file: File,
  { onProgress, signal, pauseFor = pause }: UploadOptions = {},
): Promise<Uploaded> => {
  const uploads = `/api/libraries/${libraryId}/uploads`;

  if (file.size <= UPLOAD_PIECE_BYTES) {
    const response = await fetch(`${uploads}?${new URLSearchParams({ path }).toString()}`, {
      method: 'POST',
      headers: { 'content-type': 'application/octet-stream' },
      body: file,
      signal: signal ?? null,
    });

    if (!response.ok) {
      throw await refusalFrom(response);
    }

    onProgress?.(1);

    return UploadedSchema.parse(await response.json());
  }

  const begun = await fetch(
    `${uploads}/start?${new URLSearchParams({ path, bytes: file.size.toString() }).toString()}`,
    { method: 'POST', signal: signal ?? null },
  );

  if (!begun.ok) {
    throw await refusalFrom(begun);
  }

  const { uploadId, pieceBytes, pieces } = UploadStartedSchema.parse(await begun.json());
  const upload = `${uploads}/${uploadId}`;
  let received = new Set<number>();

  try {
    for (let index = 0; index < pieces; index += 1) {
      for (let tried = 1; !received.has(index); tried += 1) {
        const sent = await fetch(`${upload}/pieces/${index.toString()}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/octet-stream' },
          body: file.slice(index * pieceBytes, (index + 1) * pieceBytes),
          signal: signal ?? null,
        }).catch((error: Error) => {
          if (signal?.aborted === true || tried >= TRIES) {
            throw error;
          }

          return null;
        });

        if (sent?.ok === true) {
          received = new Set(UploadPiecesSchema.parse(await sent.json()).received);
        } else if (sent !== null && (sent.status < 500 || tried >= TRIES)) {
          throw await refusalFrom(sent);
        } else {
          await pauseFor(tried * 1000);

          const asked = await fetch(upload, { signal: signal ?? null }).catch(() => null);

          if (asked?.ok === true) {
            received = new Set(UploadPiecesSchema.parse(await asked.json()).received);
          }
        }

        onProgress?.(received.size / pieces);
      }
    }

    const finished = await fetch(`${upload}/finish`, { method: 'POST', signal: signal ?? null });

    if (!finished.ok) {
      throw await refusalFrom(finished);
    }

    return UploadedSchema.parse(await finished.json());
  } catch (error) {
    await fetch(upload, { method: 'DELETE' }).catch(() => null);

    throw error;
  }
};

export { uploadMedia };
