import type { ArrSetup } from '@ValenceRequests/arrImport/ArrSetup';

/**
 * Says which profile of an app a Valence profile is made from, to find it again.
 *
 * @param setup - The app.
 * @param profileId - The profile's id in it.
 * @returns The key.
 */
const profileSourceOf = (setup: Pick<ArrSetup, 'source'>, profileId: number): string =>
  `${setup.source.url.replace(/\/+$/, '').toLowerCase()}#${profileId.toString()}`;

export { profileSourceOf };
