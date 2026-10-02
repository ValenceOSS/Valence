import { realEmailOf } from '@ValenceContracts/functions/realEmailOf';
import type { ArrRequester } from '@ValenceContracts/schemas/ArrImport';
import type { ImportedAccount } from '@ValenceServer/arrImport/ImportedAccount';

type Account = { id: string; name: string; email: string };

/**
 * An id written the one way, whatever its case and whether it has dashes, as Jellyfin's are
 * written both ways.
 *
 * @param key - The id.
 * @returns It, written the one way.
 */
const tidy = (key: string): string => key.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * The Valence account somebody who asked in Overseerr or Jellyseerr has: the one an import from
 * Plex, Jellyfin or Emby made for the account behind them there, or else the one with the address
 * they signed in with — never one whose address is only a placeholder.
 *
 * @param requester - Who asked.
 * @param imported - The accounts imports made or matched.
 * @param accounts - Every account.
 * @returns Their account, or none.
 */
const accountOfRequester = (
  requester: ArrRequester,
  imported: readonly ImportedAccount[],
  accounts: readonly Account[],
): { id: string; name: string } | null => {
  const linked = imported.find(
    (link) =>
      (link.sourceKind === 'plex' &&
        requester.plexId !== null &&
        tidy(link.sourceKey) === tidy(requester.plexId.toString())) ||
      ((link.sourceKind === 'jellyfin' || link.sourceKind === 'emby') &&
        requester.jellyfinUserId !== null &&
        tidy(link.sourceKey) === tidy(requester.jellyfinUserId)),
  );
  const email = requester.email?.trim().toLowerCase() ?? '';
  const found =
    accounts.find((account) => account.id === linked?.accountId) ??
    (email === ''
      ? undefined
      : accounts.find((account) => realEmailOf(account.email)?.toLowerCase() === email));

  return found === undefined ? null : { id: found.id, name: found.name };
};

export { accountOfRequester };
