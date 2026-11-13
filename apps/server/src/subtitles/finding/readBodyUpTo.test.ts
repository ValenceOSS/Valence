import { describe, expect, it } from 'vitest';
import { readBodyUpTo } from './readBodyUpTo';

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
});
