/**
 * Where to ask an indexer, from the address somebody gave for it.
 *
 * Newznab indexers are given by their site (`https://api.nzbgeek.info`), Jackett and Prowlarr by a
 * feed that ends in a slash (`…/results/torznab/`, `…/1/`), and some people paste the whole thing
 * with `/api` already on. All three want `/api` asked, once.
 *
 * @param address - The address as given.
 * @param parameters - What to ask it.
 * @returns The address to fetch.
 */
const indexerEndpoint = (address: string, parameters: Record<string, string>): string => {
  const url = new URL(address);
  const path = url.pathname.replace(/\/+$/, '');

  url.pathname = path.endsWith('/api') ? path : `${path}/api`;

  for (const [name, value] of Object.entries(parameters)) {
    url.searchParams.set(name, value);
  }

  return url.toString();
};

export { indexerEndpoint };
