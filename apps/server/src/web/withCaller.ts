import { CALLER_HEADER } from '@ValenceServer/web/CALLER_HEADER';

/**
 * Hands a request on carrying the caller's address in the one header the sign-in service reads it
 * from, replacing whatever the caller put there, or removing it where the address is not known.
 *
 * It is rebuilt from its parts rather than copied, because the Node adapter's request is a stand-in
 * that only looks like one, and copying it reads it as an address instead.
 *
 * @param request - The request as it arrived.
 * @param address - The caller's address, as this server worked it out.
 * @returns The same request, carrying that address and no other.
 */
const withCaller = async (request: Request, address: string | null): Promise<Request> => {
  const headers = new Headers(request.headers);

  if (address === null) {
    headers.delete(CALLER_HEADER);
  } else {
    headers.set(CALLER_HEADER, address);
  }

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  return new Request(request.url, {
    method: request.method,
    headers,
    ...(hasBody ? { body: await request.arrayBuffer() } : {}),
  });
};

export { withCaller };
