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
 * copy, or starts a fresh decoder for a new run of decoding.
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

  state.decoder ??= loadBrowserDecoders().then((decoders) => decoders?.createMpeg2() ?? null);

  const decoder = await state.decoder;
  const decoded = decoder?.decode(new Uint8Array(asked.data.stream)) ?? null;
  const frames = decoded?.frames.buffer ?? new ArrayBuffer(0);

  globalThis.postMessage(
    {
      id: asked.data.id,
      frames,
      count: decoded?.count ?? 0,
      width: decoded?.width ?? 0,
      height: decoded?.height ?? 0,
    },
    { transfer: [frames] },
  );
};

globalThis.addEventListener('message', (event) => {
  void answer(event);
});
