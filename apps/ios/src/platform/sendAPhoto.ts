import { FileSystemUploadType, uploadAsync } from 'expo-file-system/legacy';
import { z } from 'zod';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { theCookiesThisPhoneHolds } from '@ValencePhone/platform/theCookiesThisPhoneHolds';

const KINDS: Record<string, string> = {
  avif: 'image/avif',
  gif: 'image/gif',
  heic: 'image/heic',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const Refusal = z.object({ error: z.string() });

const NOT_SENT = 'That photo could not be sent.';

/**
 * Sends a photo on this phone to the server straight from its file, rather than reading it into
 * memory first, and says why the server refused it where it did.
 *
 * @param path - Where on the server it goes, such as `/api/profiles/{id}/photo`.
 * @param file - Where the photo is on this phone.
 * @returns Nothing once it is kept, or what went wrong.
 */
const sendAPhoto = async (path: string, file: string): Promise<string | null> => {
  const address = platformInUse().serverAddress();

  if (address === null) {
    return NOT_SENT;
  }

  const cookie = await theCookiesThisPhoneHolds(address);
  const kind = KINDS[file.split('.').pop()?.toLowerCase() ?? ''] ?? 'image/jpeg';
  const sent = await uploadAsync(`${address}${path}`, file, {
    httpMethod: 'PUT',
    uploadType: FileSystemUploadType.BINARY_CONTENT,
    headers: { 'content-type': kind, origin: address, ...(cookie === null ? {} : { cookie }) },
  }).catch(() => null);

  if (sent === null) {
    return NOT_SENT;
  }

  if (sent.status >= 200 && sent.status < 300) {
    return null;
  }

  try {
    return Refusal.parse(JSON.parse(sent.body)).error;
  } catch {
    return NOT_SENT;
  }
};

export { sendAPhoto };
