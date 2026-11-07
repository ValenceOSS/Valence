import { fetch as streamingFetch } from 'expo/fetch';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { tellThisServerWhoAsks } from '@ValenceMobile/platform/tellThisServerWhoAsks';

/**
 * Asks the server this phone watches for something that arrives a little at a time, so it can be
 * read as it comes rather than once it has all arrived, which the phone's ordinary fetch cannot do.
 * It asks as the ordinary fetch does: by a path on the server, saying who is asking.
 *
 * @param path - What to ask for, as a path on the server.
 * @param init - How to ask.
 * @returns The answer, whose body can be read as it arrives.
 */
const streamFromThisServer = async (path: string, init?: RequestInit): Promise<Response> => {
  const address = platformInUse().serverAddress();

  if (address === null) {
    return fetch(path, init);
  }

  const headers = new Headers(init?.headers);

  tellThisServerWhoAsks(headers, address);

  const answer = await streamingFetch(new URL(path, address).toString(), {
    method: init?.method ?? 'GET',
    headers: Object.fromEntries(headers.entries()),
  });

  return answer;
};

export { streamFromThisServer };
