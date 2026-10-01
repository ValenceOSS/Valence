import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Whether a request carries the key Valence made for Overseerr or Jellyseerr — in the `X-Api-Key`
 * header or the `apikey` query parameter, as Radarr and Sonarr take it — compared in a time that
 * says nothing of how much of it was right.
 *
 * @param request - The request.
 * @param key - The key Valence made, empty where none has been.
 * @returns Whether it is that key.
 */
const isTheSeerrKey = (request: Request, key: string): boolean => {
  const given =
    request.headers.get('x-api-key') ?? new URL(request.url).searchParams.get('apikey') ?? '';

  if (key === '' || given === '') {
    return false;
  }

  const digest = (text: string) => createHash('sha256').update(text).digest();

  return timingSafeEqual(digest(given), digest(key));
};

export { isTheSeerrKey };
