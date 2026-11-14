import { describe, expect, it } from 'vitest';
import { boundedAnswer } from './boundedAnswer';

const endless = () =>
  new Response(
    new ReadableStream<Uint8Array>({
      pull: (controller) => {
        controller.enqueue(new Uint8Array(1024));
      },
    }),
  );

describe('boundedAnswer', () => {
  it('reads an answer within reason as it came', async () => {
    const answered = boundedAnswer(Response.json({ libraries: [] }, { status: 200 }), 1024);

    expect(answered.status).toBe(200);
    await expect(answered.json()).resolves.toEqual({ libraries: [] });
  });

  it('stops reading an answer that never ends', async () => {
    await expect(boundedAnswer(endless(), 64 * 1024).arrayBuffer()).rejects.toThrow();
  });

  it('refuses an answer that says it is longer than it may be before reading any of it', async () => {
    const answered = new Response('{}', { headers: { 'content-length': '999999999' } });

    await expect(boundedAnswer(answered, 1024).text()).rejects.toThrow();
  });
});
