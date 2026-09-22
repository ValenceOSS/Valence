/**
 * Reads the address out of whatever `fetch` was asked with, for a stand-in that answers by path.
 *
 * @param input - What `fetch` was handed.
 * @returns The address.
 */
const theAddressOf = (input: RequestInfo | URL): string =>
  typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

export { theAddressOf };
