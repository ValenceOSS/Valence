import { describe, expect, it } from 'vitest';
import { typedSegment } from './typedSegment';

const streamOf = (...chunks: number[][]): ReadableStream<Uint8Array> =>
  new ReadableStream<Uint8Array>({
    start: (controller) => {
      for (const chunk of chunks) {
        controller.enqueue(new Uint8Array(chunk));
      }

      controller.close();
    },
  });

const bytesOf = async (body: ReadableStream<Uint8Array>): Promise<number[]> =>
  Array.from(new Uint8Array(await new Response(body).arrayBuffer()));

describe('typedSegment', () => {
  it('names a transport stream as one', async () => {
    const typed = await typedSegment(
      streamOf([0x47, 0x40, 0x00], [0x10]),
      'application/octet-stream',
    );

    expect(typed.contentType).toBe('video/mp2t');
    expect(await bytesOf(typed.body)).toEqual([0x47, 0x40, 0x00, 0x10]);
  });

  it('names bare AAC behind an ID3 tag as AAC', async () => {
    const typed = await typedSegment(
      streamOf([0x49, 0x44, 0x33, 0x03]),
      'application/octet-stream',
    );

    expect(typed.contentType).toBe('audio/aac');
  });

  it('names bare AAC that starts on its own frame as AAC', async () => {
    const typed = await typedSegment(streamOf([0xff, 0xf1, 0x50]), null);

    expect(typed.contentType).toBe('audio/aac');
  });

  it('keeps what it was sent as where the bytes say neither', async () => {
    const typed = await typedSegment(streamOf([0x00, 0x00, 0x00, 0x18]), 'video/mp4');

    expect(typed.contentType).toBe('video/mp4');
    expect(await bytesOf(typed.body)).toEqual([0x00, 0x00, 0x00, 0x18]);
  });

  it('passes on an empty piece as empty', async () => {
    const typed = await typedSegment(streamOf(), null);

    expect(typed.contentType).toBe('application/octet-stream');
    expect(await bytesOf(typed.body)).toEqual([]);
  });
});
