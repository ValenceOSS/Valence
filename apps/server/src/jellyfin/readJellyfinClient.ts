import type { JellyfinClient } from '@ValenceServer/jellyfin/JellyfinClient';

const FIELD = /(\w+)="([^"]*)"/gu;

const LONGEST_FIELD = 512;

/**
 * Decodes a field an app escaped, or keeps it as sent where it was not escaped properly.
 *
 * @param field - The field as sent.
 * @returns The field.
 */
const decoded = (field: string): string => {
  try {
    return decodeURIComponent(field);
  } catch {
    return field;
  }
};

/**
 * Reads the fields of a `MediaBrowser` authorization header, such as `Client="Findroid"`.
 *
 * @param header - The header as sent.
 * @returns Each field by its name in lower case.
 */
const fieldsOf = (header: string): ReadonlyMap<string, string> =>
  new Map(
    [...header.matchAll(FIELD)]
      .filter((match) => (match[2] ?? '').length <= LONGEST_FIELD)
      .map((match) => [(match[1] ?? '').toLowerCase(), decoded(match[2] ?? '')]),
  );

/**
 * Works out which Jellyfin app is asking and with what token, from wherever Jellyfin's apps put
 * them: the `Authorization` or `X-Emby-Authorization` header, a token header of its own, or an
 * `api_key` in the address for a player that can send nothing else.
 *
 * @param headers - The request's headers.
 * @param query - The request's query, with its names in lower case.
 * @returns The app, its device and its token, each where it was sent.
 */
const readJellyfinClient = (
  headers: Headers,
  query: Readonly<Record<string, string>>,
): JellyfinClient => {
  const header = [headers.get('authorization'), headers.get('x-emby-authorization')].find(
    (one) => one !== null && /^\s*(MediaBrowser|Emby)\s/iu.test(one),
  );
  const fields = fieldsOf(header ?? '');
  const tokens = [
    fields.get('token'),
    headers.get('x-emby-token'),
    headers.get('x-mediabrowser-token'),
    query['api_key'],
    query['apikey'],
  ];
  const token = tokens.find((one) => one !== undefined && one !== null && one !== '') ?? null;

  return {
    client: fields.get('client') ?? null,
    device: fields.get('device') ?? null,
    deviceId: fields.get('deviceid') ?? null,
    version: fields.get('version') ?? null,
    token,
  };
};

export { readJellyfinClient };
