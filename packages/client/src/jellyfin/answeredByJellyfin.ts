import { theJellyfinAnswers } from '@ValenceClient/jellyfin/theJellyfinAnswers';

const OURS = '/api/';

/**
 * Answers a request for Valence's endpoints from the Jellyfin server at the address the app is
 * pointed at, where that server is a Jellyfin one. A host's fetch asks this first, and sends the
 * request to the server itself where it answers with nothing.
 *
 * @param address - The server the app is pointed at, without a trailing slash.
 * @param request - The request, already aimed at that server.
 * @param send - The fetch the host had before it pointed fetch at a server.
 * @returns The answer, or nothing where the server is not a Jellyfin one or the request is not for
 *   Valence's endpoints.
 */
const answeredByJellyfin = (
  address: string | null,
  request: Request,
  send: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<Response> | null => {
  if (address === null) {
    return null;
  }

  const { links, answers } = theJellyfinAnswers(send);
  const link = links.of(address);

  if (link === null || !new URL(request.url).pathname.startsWith(OURS)) {
    return null;
  }

  return answers.answer(link, request);
};

export { answeredByJellyfin };
