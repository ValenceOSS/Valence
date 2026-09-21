import type { ZodType } from 'zod';

/**
 * Asks the server a question about the log and reads the answer.
 *
 * Answers with what the caller says an empty answer is rather than throwing when the server refuses
 * or cannot be reached, since a panel that has lost the connection should say it is empty and carry
 * on rather than take the page down with it.
 *
 * @param path - Which question to ask.
 * @param query - What to ask it about.
 * @param schema - What a good answer looks like.
 * @param nothing - The answer to fall back on.
 * @returns The answer.
 */
const postForLogs = async <Answer>(
  path: string,
  query: object,
  schema: ZodType<Answer>,
  nothing: Answer,
): Promise<Answer> => {
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(query),
  }).catch(() => null);

  if (response === null || !response.ok) {
    return nothing;
  }

  const read = schema.safeParse(await response.json().catch(() => null));

  return read.success ? read.data : nothing;
};

export { postForLogs };
