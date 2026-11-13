import { describe, expect, it } from 'vitest';
import { readRemoteText } from './readRemoteText';

const answering =
  (response: Response): typeof fetch =>
  () =>
    Promise.resolve(response);

describe('readRemoteText', () => {
  it('reads a text within the limit', async () => {
    expect(
      await readRemoteText('https://guide.test/a', 100, answering(new Response('hello'))),
    ).toBe('hello');
  });

  it('gives up on a body that runs past the limit without taking in the rest', async () => {
    let pulled = 0;
    const endless = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1;
        controller.enqueue(new Uint8Array(1024));
      },
    });

    expect(
      await readRemoteText('https://guide.test/a', 4096, answering(new Response(endless))),
    ).toBeNull();
    expect(pulled).toBeLessThan(20);
  });

  it('gives up at once on a body that says it is larger than the limit', async () => {
    const response = new Response('x', { headers: { 'content-length': '999999' } });

    expect(await readRemoteText('https://guide.test/a', 100, answering(response))).toBeNull();
  });
});
