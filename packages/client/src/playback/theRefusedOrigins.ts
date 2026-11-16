const MOST_KEPT = 16;

const refused: string[] = [];

/**
 * The linked servers' addresses this page could not stream from directly. Kept for as long as the
 * page is open, since what stopped it, such as the page's Content-Security-Policy, cannot change
 * until it is loaded again; a linked title from one of them is asked for through this server. Holds
 * the sixteen most recent, as many as a session request may name.
 *
 * @returns Whether an address is kept, keeping one, every one kept, and forgetting them all.
 */
const theRefusedOrigins = () => ({
  has: (origin: string): boolean => refused.includes(origin),
  add: (origin: string): void => {
    if (refused.includes(origin)) {
      return;
    }

    refused.push(origin);

    if (refused.length > MOST_KEPT) {
      refused.shift();
    }
  },
  list: (): string[] => [...refused],
  forget: (): void => {
    refused.length = 0;
  },
});

export { theRefusedOrigins };
