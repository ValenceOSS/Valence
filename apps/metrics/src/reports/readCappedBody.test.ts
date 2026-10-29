import { describe, expect, it } from 'vitest';
import { readCappedBody } from './readCappedBody';

const posting = (body: BodyInit | null, headers: Record<string, string> = {}) =>
  new Request('http://metrics.test/api/v1/reports', { method: 'POST', body, headers });

describe('readCappedBody', () => {
  it('reads a body within the limit', async () => {
    expect(await readCappedBody(posting('{"a":1}'), 16)).toBe('{"a":1}');
  });

  it('reads nothing as an empty body', async () => {
    expect(await readCappedBody(posting(null), 16)).toBe('');
  });

  it('gives up on a body whose length says it is too long', async () => {
    expect(await readCappedBody(posting('x', { 'content-length': '17' }), 16)).toBeNull();
  });

  it('gives up on a body that turns out too long, whatever it claimed', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        controller.enqueue(new TextEncoder().encode('0123456789'));
        controller.enqueue(new TextEncoder().encode('0123456789'));
        controller.close();
      },
    });

    expect(await readCappedBody(new Response(stream), 16)).toBeNull();
  });

  it('puts a body that arrives in pieces back together', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        controller.enqueue(new TextEncoder().encode('héllo '));
        controller.enqueue(new TextEncoder().encode('there'));
        controller.close();
      },
    });

    expect(await readCappedBody(new Response(stream), 64)).toBe('héllo there');
  });
});
