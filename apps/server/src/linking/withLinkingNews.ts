import type { LinkStore } from './LinkStore';

/**
 * Wraps the store of linked servers so every change to an invite, a server or what is shared with
 * it is told to whoever is watching, and an open linking page reads it again without waiting.
 *
 * @param store - The store.
 * @param tell - Says linking changed.
 * @returns The same store, telling of each change.
 */
const withLinkingNews = (store: LinkStore, tell: () => void): LinkStore => {
  const told = <Value>(done: Value): Value => {
    tell();

    return done;
  };

  return {
    ...store,
    addInvite: (codeHash, expiresAt) => store.addInvite(codeHash, expiresAt).then(told),
    withdrawInvite: (id) => store.withdrawInvite(id).then(told),
    spendInvite: (codeHash, now) => store.spendInvite(codeHash, now).then(told),
    addServer: (server) => store.addServer(server).then(told),
    changeServer: (id, change) => store.changeServer(id, change).then(told),
    removeServer: (id) => store.removeServer(id).then(told),
    declineLibrary: (id, libraryId, isDeclined) =>
      store.declineLibrary(id, libraryId, isDeclined).then(told),
  };
};

export { withLinkingNews };
