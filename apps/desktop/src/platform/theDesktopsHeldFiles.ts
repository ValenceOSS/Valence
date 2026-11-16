import { z } from 'zod';
import { HeldFileSchema } from '@ValenceContracts/schemas/HeldFile';
import { KEPT_TRICKPLAY_INDEX } from '@ValenceClient/downloads/KEPT_TRICKPLAY_INDEX';
import { keptTrickplayFrom } from '@ValenceClient/downloads/keptTrickplayFrom';
import type { HeldFiles } from '@ValenceClient/platform/Platform.types';

const HeldFilesSchema = z.array(HeldFileSchema).catch([]);

/**
 * What this machine is holding, asked of the host that holds it, with each file addressed as a path
 * on the window's own origin and every answer parsed rather than trusted.
 *
 * @returns Where this client's files are kept.
 */
const theDesktopsHeldFiles = (): HeldFiles => {
  const { held } = window.valence;

  return {
    all: async () => HeldFilesSchema.parse(await held.all()),
    keep: async (what) => {
      await held.keep(what);
    },
    drop: async (downloadId) => {
      await held.drop(downloadId);
    },
    pause: async (downloadId, isPaused) => {
      await held.pause(downloadId, isPaused);
    },
    sourceFor: (downloadId) => `/held/${downloadId}`,
    posterFor: (downloadId) => `/held/${downloadId}/poster`,
    trickplayFor: async (downloadId) => {
      const index = `/held/${downloadId}/trickplay/${KEPT_TRICKPLAY_INDEX}`;
      const answer = await fetch(index).catch(() => null);

      return answer === null || !answer.ok ? null : keptTrickplayFrom(await answer.text(), index);
    },
    whenChanged: (listener) =>
      held.whenChanged((said) => {
        listener(HeldFilesSchema.parse(said));
      }),
  };
};

export { theDesktopsHeldFiles };
