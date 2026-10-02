import { saying } from '@ValenceI18n/saying';
import { SourceFailure } from './SourceFailure';
import { findXmlElements } from './findXmlElements';
import { readXmlElements } from './readXmlElements';
import type { SourceCaller } from './createSourceCaller';

/**
 * Gets a member of the owner's Plex Home a token for this server, by switching to them on plex.tv
 * with their PIN where they have one and reading the server's token from their resources.
 *
 * @param plexTv - How to reach plex.tv as the owner.
 * @param machineId - The server's machine identifier.
 * @param userId - The Home member.
 * @param pin - Their PIN, where they have one.
 * @returns A token that reads the server as them.
 */
const resolvePlexHomeToken = async (
  plexTv: SourceCaller,
  machineId: string,
  userId: string,
  pin: string | null,
): Promise<string> => {
  const switched = await plexTv
    .switchAccount(`/api/home/users/${encodeURIComponent(userId)}/switch`, {
      query: pin === null ? {} : { pin },
    })
    .catch((error) => {
      if (error instanceof SourceFailure && error.status !== null && error.status < 500) {
        throw new SourceFailure(saying('server.imports.resolvePlexHomeToken.thatPinWasNotRight'));
      }

      throw error;
    });
  const user = findXmlElements(readXmlElements(switched), 'user')[0];
  const accountToken = user?.attributes.authenticationToken ?? user?.attributes.authToken ?? null;

  if (accountToken === null || accountToken === '') {
    throw new SourceFailure(saying('server.imports.resolvePlexHomeToken.plexDidNotLetValenceIn'));
  }

  const resources = await plexTv.text('/api/v2/resources', {
    query: { includeHttps: '1', includeRelay: '1' },
    headers: { 'X-Plex-Token': accountToken },
  });
  const server = findXmlElements(readXmlElements(resources), 'resource').find(
    (resource) => resource.attributes.clientIdentifier === machineId,
  );
  const token = server?.attributes.accessToken ?? '';

  if (token === '') {
    throw new SourceFailure(
      saying('server.imports.resolvePlexHomeToken.thisServerIsNotSharedWithThem'),
    );
  }

  return token;
};

export { resolvePlexHomeToken };
