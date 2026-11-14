/**
 * Reads a response's body up to a limit, giving up as soon as it is passed, by its declared length
 * or by what has arrived, rather than holding however much a host chooses to send.
 *
 * @param response - The response.
 * @param limit - The most to read, in bytes.
 * @returns The body, or nothing where it was over the limit or could not be read.
 */
const readBodyUpTo = async (response: Response, limit: number): Promise<Uint8Array | null> => {
  const declared = Number(response.headers.get('content-length'));

  if (response.body === null || declared > limit) {
    await response.body?.cancel().catch(() => undefined);

    return null;
  }

  const chunks: Uint8Array[] = [];
  let length = 0;

  try {
    for await (const chunk of response.body) {
      if (!(chunk instanceof Uint8Array)) {
        return null;
      }

      length += chunk.length;

      if (length > limit) {
        return null;
      }

      chunks.push(chunk);
    }
  } catch {
    return null;
  }

  return new Uint8Array(Buffer.concat(chunks));
};

export { readBodyUpTo };
