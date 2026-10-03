import { vi } from 'vitest';

/**
 * Stands in for the server, answering every request with the same thing, and records what it was
 * asked. The test unstubs it afterwards with `vi.unstubAllGlobals`.
 *
 * @param body - What it answers with, or nothing for an empty answer.
 * @param status - The status it answers with.
 * @returns The stand-in, to see what it was asked.
 */
const aServerAnswering = (body: object | null, status = 200) => {
  const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(() =>
    Promise.resolve(
      body === null ? new Response(null, { status }) : Response.json(body, { status }),
    ),
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

export { aServerAnswering };
