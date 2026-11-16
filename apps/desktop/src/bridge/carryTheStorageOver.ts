/**
 * Writes what the Electron app's page kept into this page's own storage, leaving alone anything
 * this page has kept under the same key since.
 *
 * @param carried - What the host read out of the Electron app's storage, by key.
 * @param storage - Reaches this page's storage, which can refuse to be reached.
 * @returns Whether there was something to carry and all of it is in this page's storage now.
 */
const carryTheStorageOver = (carried: Record<string, string>, storage: () => Storage): boolean => {
  const entries = Object.entries(carried);

  if (entries.length === 0) {
    return false;
  }

  try {
    const kept = storage();
    const written = entries.map(([key, value]) => {
      try {
        if (kept.getItem(key) === null) {
          kept.setItem(key, value);
        }

        return true;
      } catch {
        return false;
      }
    });

    return written.every(Boolean);
  } catch {
    return false;
  }
};

export { carryTheStorageOver };
