import { LANDING_ORIGIN } from '@ValenceLanding/content/LANDING_ORIGIN';

/**
 * Points the page's canonical link at the address being shown on the published host, adding the
 * link where the page has none.
 *
 * @param pathname - The address being shown.
 */
const keepCanonical = (pathname: string): void => {
  const found = document.head.querySelector('link[rel="canonical"]');
  const link = found ?? document.createElement('link');

  link.setAttribute('rel', 'canonical');
  link.setAttribute('href', `${LANDING_ORIGIN}${pathname}`);

  if (found === null) {
    document.head.append(link);
  }
};

export { keepCanonical };
