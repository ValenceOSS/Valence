/**
 * Reads a request's body as text, giving up as soon as it is longer than it is allowed to be,
 * whatever its headers claim.
 *
 * @param request - The request, or anything else with headers and a body.
 * @param limit - The most bytes to read.
 * @returns The body, or null where it is too long.
 */
const readCappedBody = async (
  request: Pick<Request, 'headers' | 'body'>,
  limit: number,
): Promise<string | null> => {
  const claimed = Number(request.headers.get('content-length') ?? '0');

  if (Number.isFinite(claimed) && claimed > limit) {
    return null;
  }

  if (request.body === null) {
    return '';
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;

  for (let read = await reader.read(); !read.done; read = await reader.read()) {
    length += read.value.byteLength;

    if (length > limit) {
      await reader.cancel();

      return null;
    }

    chunks.push(read.value);
  }

  const whole = new Uint8Array(length);
  let at = 0;

  for (const chunk of chunks) {
    whole.set(chunk, at);
    at += chunk.byteLength;
  }

  return new TextDecoder().decode(whole);
};

export { readCappedBody };
