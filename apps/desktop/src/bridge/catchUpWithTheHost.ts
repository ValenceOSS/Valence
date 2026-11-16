import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';
import { DesktopUpdateSchema } from '@ValenceContracts/schemas/DesktopUpdate';
import type { DesktopUpdate } from '@ValenceContracts/schemas/DesktopUpdate';
import { WindowFrameSchema } from '@ValenceContracts/schemas/WindowFrame';
import type { WindowFrame } from '@ValenceContracts/schemas/WindowFrame';

const NowSchema = z.object({
  isReachable: z.boolean(),
  update: DesktopUpdateSchema,
  frame: WindowFrameSchema,
});

/**
 * Asks the host once more how things stand, after the page has started listening, so that a change
 * made between the page's boot script being written and its listeners being attached is not missed.
 *
 * @param keep - Where each answer is kept.
 * @param keep.reach - Keeps whether the server can be reached.
 * @param keep.update - Keeps what is known about an update.
 * @param keep.frame - Keeps the window's frame.
 * @returns When the answer has been kept, or ignored where the host gave none it could read.
 */
const catchUpWithTheHost = async (keep: {
  reach: (isReachable: boolean) => void;
  update: (update: DesktopUpdate) => void;
  frame: (frame: WindowFrame) => void;
}): Promise<void> => {
  const said = NowSchema.safeParse(await invoke('what_is_now').catch(() => null));

  if (!said.success) {
    return;
  }

  keep.reach(said.data.isReachable);
  keep.update(said.data.update);
  keep.frame(said.data.frame);
};

export { catchUpWithTheHost };
