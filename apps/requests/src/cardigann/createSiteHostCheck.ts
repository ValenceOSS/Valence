import { isIP } from 'node:net';

const SECOND_LEVEL_LABELS = new Set(['co', 'com', 'org', 'net', 'gov', 'edu', 'ac', 'or', 'ne']);

/**
 * The part of a host a site's own subdomains share, taken as the last two labels, or the last
 * three where a two-letter country code follows a label such as `co`, as in `site.co.uk`.
 *
 * @param hostname - The host, in lower case.
 * @returns The shared part, or the host itself where it is an address or has no subdomain.
 */
const sharedDomainOf = (hostname: string): string => {
  if (isIP(hostname.replace(/^\[|\]$/g, '')) !== 0) {
    return hostname;
  }

  const labels = hostname.split('.');
  const last = labels.at(-1) ?? '';
  const before = labels.at(-2) ?? '';
  const keep = last.length === 2 && SECOND_LEVEL_LABELS.has(before) ? 3 : 2;

  return labels.slice(-keep).join('.');
};

/**
 * Makes the check for whether a host is the indexer's own site, which is where its cookies and
 * headers may go: every host its definition lists as a link, the configured link, and the
 * subdomains of the configured link's domain, so `site.org` reaches `www.site.org` and the
 * `dl.site.org` it serves its files from. Every other host is somebody else's.
 *
 * @param siteLink - The link the indexer is configured with.
 * @param links - Every link its definition lists.
 * @returns Whether a host name belongs to the site.
 */
const createSiteHostCheck = (siteLink: string, links: readonly string[]) => {
  const own = new Set(
    [siteLink, ...links].flatMap((link) => {
      const parsed = URL.parse(link);

      return parsed === null ? [] : [parsed.hostname.toLowerCase()];
    }),
  );
  const configured = URL.parse(siteLink)?.hostname.toLowerCase();
  const shared = configured === undefined ? null : sharedDomainOf(configured);

  return (hostname: string): boolean => {
    const host = hostname.toLowerCase();

    return (
      own.has(host) ||
      (shared !== null && shared.includes('.') && (host === shared || host.endsWith(`.${shared}`)))
    );
  };
};

export { createSiteHostCheck };
