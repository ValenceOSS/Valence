const WAIT_MS = 20_000;

/**
 * A picture from the web, such as a book's cover, where it can be fetched in good time.
 *
 * @param url - Where it is.
 * @returns Its bytes, or null where it could not be fetched.
 */
const fetchPicture = async (url: string): Promise<Uint8Array | null> => {
  const response = await fetch(url, { signal: AbortSignal.timeout(WAIT_MS) }).catch(() => null);

  return response?.ok === true
    ? new Uint8Array(await response.arrayBuffer().catch(() => new ArrayBuffer(0)))
    : null;
};

export { fetchPicture };
