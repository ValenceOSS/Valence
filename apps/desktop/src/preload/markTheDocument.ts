const MARK = 'valenceDesktop';

const PLATFORM = 'valencePlatform';

/**
 * Marks a document as one this client is showing, as soon as there is a document to mark.
 *
 * A preload script runs before the page it is preloading exists. At that point the document has been
 * created but nothing has been parsed into it, so there is no root element to put anything on:
 * reaching for one throws, and a script that throws here takes everything after it with it — the
 * listeners the window forwards through, and the bridge the pages are handed.
 *
 * So where the root is not there yet it is waited for rather than assumed. It arrives at the very
 * start of parsing, long before anything the server sent has run, which is what this has to beat.
 *
 * The platform is marked alongside, because the window draws its own controls differently on each
 * and the header has to leave room for whichever it drew.
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
