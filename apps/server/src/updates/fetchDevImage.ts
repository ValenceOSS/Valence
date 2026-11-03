import { z } from 'zod';

const TOKEN = 'https://ghcr.io/token?scope=repository:valenceoss/valence:pull';

const DEV_TAG = 'https://ghcr.io/v2/valenceoss/valence/manifests/dev';

const IMAGE_INDEX = [
  'application/vnd.oci.image.index.v1+json',
  'application/vnd.docker.distribution.manifest.list.v2+json',
].join(', ');

const TokenSchema = z.object({ token: z.string() });

/**
 * Asks the container registry what Valence's `dev` tag points at, signed in as nobody, as anyone
 * pulling the public image is.
 *
 * @param signal - Gives up on the asking.
 * @returns The registry's answer: the image index, whose annotations name the commit and when it was
 *   built, or the refusal of the token or of the tag.
 */
const fetchDevImage = async (signal: AbortSignal): Promise<Response> => {
  const asked = await fetch(TOKEN, { signal });

  if (!asked.ok) {
    return asked;
  }

  const { token } = TokenSchema.parse(await asked.json());

  return fetch(DEV_TAG, {
    headers: { accept: IMAGE_INDEX, authorization: `Bearer ${token}` },
    signal,
  });
};

export { fetchDevImage };
