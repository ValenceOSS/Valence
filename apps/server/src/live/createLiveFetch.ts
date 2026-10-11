import { ProxyAgent, fetch as fetchThrough } from 'undici';
import { FINAL_ADDRESS } from './FINAL_ADDRESS';

/**
 * How live TV reaches the outside world: straight out, or through a proxy where one is set, such as
 * gluetun's, so streams, playlists, guides and logos are fetched from the VPN's country rather than
 * this server's — which is how a channel blocked here can still be watched.
 *
 * @param proxy - The proxy's address, or nothing to fetch directly.
 * @returns A fetch that goes the chosen way, saying where a redirected request ended up as a
 *   response through the proxy cannot carry it the usual way.
 */
const createLiveFetch = (proxy: string): typeof fetch => {
  if (proxy === '') {
    return fetch;
  }

  const dispatcher = new ProxyAgent(proxy);

  return async (input, init) => {
    const address = input instanceof Request ? input.url : input.toString();
    const answered = await fetchThrough(address, {
      method: init?.method ?? 'GET',
      headers: [...new Headers(init?.headers).entries()],
      ...(init?.signal === undefined || init.signal === null ? {} : { signal: init.signal }),
      dispatcher,
    });

    return new Response(answered.body, {
      status: answered.status,
      headers: [...answered.headers.entries(), [FINAL_ADDRESS, answered.url]],
    });
  };
};

export { createLiveFetch };
