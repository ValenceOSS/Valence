import { pageFor } from '@ValenceLanding/components/LandingShell/pageFor';

/**
 * Fetches the code of the page at an address ahead of drawing it, so it renders whole on its first
 * frame. A fetch that fails is left for the page itself to try again and report.
 *
 * @param pathname - The address.
 */
const preloadPage = async (pathname: string): Promise<void> => {
  const page = pageFor(pathname);

  if ('preload' in page) {
    await page.preload().catch(() => undefined);
  }
};

export { preloadPage };
