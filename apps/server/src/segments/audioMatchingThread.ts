import { setPriority } from 'node:os';
import { parentPort } from 'node:worker_threads';
import { z } from 'zod';
import { matchSeason, SeasonToMatchSchema } from './matchSeason';

const AskedSchema = z.object({ id: z.number(), season: SeasonToMatchSchema });

const NumberedSchema = z.object({ id: z.number() });

const BACKGROUND_PRIORITY = 10;

/**
 * Has this thread give way to everything else on the machine, at the priority the media service's
 * background renders run at, so a transcode somebody is watching always wins the processor. Only on
 * Linux, which sets priority per thread and so leaves the rest of the server its own; elsewhere the
 * priority is the whole process's, and is left alone.
 *
 * @returns Whether it now gives way.
 */
const stepAside = (): boolean => {
  if (process.platform !== 'linux') {
    return false;
  }

  try {
    setPriority(BACKGROUND_PRIORITY);

    return true;
  } catch {
    return false;
  }
};

/**
 * Answers one season sent over by the server: what each wanted episode shares with the others, or
 * why it could not be matched. Something that cannot be read at all is answered as a failure where
 * it says which request it was, so the server is never left waiting on it.
 *
 * @param message - What the server sent.
 */
const answer = (message: Parameters<typeof AskedSchema.safeParse>[0]) => {
  const asked = AskedSchema.safeParse(message);

  if (!asked.success) {
    const numbered = NumberedSchema.safeParse(message);

    if (numbered.success) {
      parentPort?.postMessage({ id: numbered.data.id, failure: asked.error.message });
    }

    return;
  }

  try {
    parentPort?.postMessage({ id: asked.data.id, matched: matchSeason(asked.data.season) });
  } catch (error) {
    parentPort?.postMessage({
      id: asked.data.id,
      failure: error instanceof Error ? error.message : String(error),
    });
  }
};

stepAside();
parentPort?.on('message', answer);
