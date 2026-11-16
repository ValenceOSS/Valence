const MARK = 'valenceDesktop';

const PLATFORM = 'valencePlatform';

/**
 * Marks a document as one Valence's own window is showing, and on which operating system, as soon as there is a root element to mark.
 *
 * @param within - The document to mark.
 * @param platform - Which operating system the window is on.
 */
const markTheDocument = (within: Document, platform: string): void => {
  const root = within.querySelector('html');

  if (root !== null) {
    root.dataset[MARK] = 'true';
    root.dataset[PLATFORM] = platform;

    return;
  }

  const waiting = new MutationObserver(() => {
    const arrived = within.querySelector('html');

    if (arrived === null) {
      return;
    }

    arrived.dataset[MARK] = 'true';
    arrived.dataset[PLATFORM] = platform;
    waiting.disconnect();
  });

  waiting.observe(within, { childList: true });
};

export { markTheDocument };
