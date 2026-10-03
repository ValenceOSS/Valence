import type { LinkPerson } from './LinkPerson';
import type { LinkService } from './LinkService';
import type { LinkSharingStore } from './LinkSharingStore';

/**
 * Signs a request to a linked server as one of this server's people, or as the server itself where
 * it is asking for nobody: by the pseudonym that server knows them by, and by name only where this
 * server's admin lets names travel to it.
 *
 * @param linking - The link service, which signs.
 * @param sharing - What this server shares with the other, where the names setting is kept.
 * @param serverId - The linked server.
 * @param person - Who on this server is asking, if anybody.
 * @returns Where to send it and the token, or nothing where that server is not linked.
 */
const signAsPerson = async (
  linking: LinkService,
  sharing: LinkSharingStore,
  serverId: string,
  person: LinkPerson | null,
): Promise<{ address: string; token: string } | null> => {
  if (person === null) {
    return linking.signFor(serverId);
  }

  const shared = await sharing.readSharing(serverId);

  return shared === null
    ? null
    : linking.signFor(serverId, {
        pseudonym: await linking.pseudonymFor(serverId, person.profileId),
        name: shared.namesTravel ? person.name : null,
      });
};

export { signAsPerson };
