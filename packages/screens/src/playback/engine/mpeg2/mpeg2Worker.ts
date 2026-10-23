import { z } from 'zod';
import { loadBrowserDecoders } from '@ValenceScreens/playback/engine/loadBrowserDecoders';
import type { Mpeg2Decoder } from '@ValenceScreens/playback/engine/loadBrowserDecoders';

const AskedSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('decode'), id: z.number(), stream: z.instanceof(ArrayBuffer) }),
  z.object({ kind: z.literal('reset') }),
]);

const state: { decoder: Promise<Mpeg2Decoder | null> | null } = { decoder: null };

/**
 * Answers one request from the page: decodes a run of MPEG-2 and hands the frames back without a
 * copy, or starts a fresh decoder for a new run of decoding. A run that cannot be decoded, or a
 * decoder that cannot be loaded, is answered as failed, so the page says so rather than waiting on
 * frames that never come.
 *
 * @param event - The request.
 */
const answer = async (event: MessageEvent) => {
  const asked = AskedSchema.safeParse(event.data);

  if (!asked.success) {
    return;
  }

  if (asked.data.kind === 'reset') {
    void (await state.decoder)?.free();
    state.decoder = null;

    return;
  }

  const { id, stream } = asked.data;

  try {
    state.decoder ??= loadBrowserDecoders().then((decoders) => decoders?.createMpeg2() ?? null);

    const decoder = await state.decoder;

    if (decoder === null) {
      throw new Error('The MPEG-2 decoder could not be loaded.');
    }

    const decoded = decoder.decode(new Uint8Array(stream));
    const frames = decoded.frames.buffer;

    globalThis.postMessage(
      { id, frames, count: decoded.count, width: decoded.width, height: decoded.height },
      { transfer: [frames] },
    );
  } catch {
    globalThis.postMessage({ id, failed: true });
  }
};

globalThis.addEventListener('message', (event) => {
  void answer(event);
});
