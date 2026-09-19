import { describe, expect, it } from 'vitest';
import { readServerSentEvents } from './readServerSentEvents';

/**
 * A stream that arrives in the pieces given.
 */
const arriving = (...pieces: string[]) =>
  new ReadableStream<Uint8Array>({
    start: (controller) => {
      for (const piece of pieces) {
        controller.enqueue(new TextEncoder().encode(piece));
      }

      controller.close();
    },
  });

describe('readServerSentEvents', () => {
  it('hands on each event’s data, however the stream is split', async () => {
    const heard: string[] = [];

    await readServerSentEvents(arriving('data: {"a"', ':1}\n\nda', 'ta: two\n\n'), (data) =>
      heard.push(data),
    );

    expect(heard).toStrictEqual(['{"a":1}', 'two']);
  });

  it('joins an event’s lines, and ignores comments and other fields', async () => {
    const heard: string[] = [];

    await readServerSentEvents(
      arriving(': still here\n\nevent: queue\ndata:one\r\ndata: two\r\n\r\n'),
      (data) => heard.push(data),
    );

    expect(heard).toStrictEqual(['one\ntwo']);
  });

  it('hands on a last event the stream ended without closing', async () => {
    const heard: string[] = [];

    await readServerSentEvents(arriving('data: last'), (data) => heard.push(data));

    expect(heard).toStrictEqual(['last']);
  });
});
