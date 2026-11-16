/**
 * The request a linked server's call is passed on as, to this server's own routes. A body carries
 * its length, so nothing between here and the route has to rebuild the request to measure it —
 * which would give it new headers, and the route could no longer tell it came from a linked server.
 *
 * @param address - Where on this server it goes.
 * @param method - The HTTP method.
 * @param headers - The headers passed on.
 * @param body - What was sent, if anything.
 * @returns The request.
 */
const innerRequestOf = (
  address: string | URL,
  method: string,
  headers: Headers,
  body: ArrayBuffer | null,
): Request => {
  if (body !== null) {
    headers.set('content-length', body.byteLength.toString());
  }

  return new Request(address, { method, headers, ...(body === null ? {} : { body }) });
};

export { innerRequestOf };
