import { describe, expect, it } from 'vitest';
import { readBodyUpTo } from './readBodyUpTo';

/**
 * A body of the given chunk that never ends unless it is cancelled.
 */
const endless = (chunk: Uint8Array): Response =>
  new Response(
    new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(chunk);
      },
    }),
  );

describe('readBodyUpTo', () => {
  it('reads a body within the limit', async () => {
    expect(await readBodyUpTo(new Response('hello'), 10)).toEqual(
      new TextEncoder().encode('hello'),
    );
  });

  it('gives nothing for a body over the limit, whether it says so or only turns out so', async () => {
    expect(await readBodyUpTo(new Response('x'.repeat(11)), 10)).toBeNull();
    expect(
      await readBodyUpTo(new Response('x'.repeat(11), { headers: { 'content-length': '11' } }), 10),
    ).toBeNull();
  });

  it('stops reading a body that never ends once it passes the limit', async () => {
    expect(await readBodyUpTo(endless(new Uint8Array(1024)), 4096)).toBeNull();
  });

  it('gives nothing for a response with no body', async () => {
    expect(await readBodyUpTo(new Response(null), 10)).toBeNull();
  });
});
