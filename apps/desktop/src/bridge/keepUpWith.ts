import type { z } from 'zod';
import { hearTheHost } from '@ValenceDesktop/bridge/hearTheHost';
import { keepTheLatest } from '@ValenceDesktop/bridge/keepTheLatest';
import type { KeptLatest } from '@ValenceDesktop/bridge/keepTheLatest';

/**
 * Keeps the latest of something the host says, starting from what the page was booted with and
 * replaced each time the host's event says otherwise.
 *
 * @param event - The event that carries each change.
 * @param schema - What a change has to be to be kept.
 * @param first - What the page was booted with.
 * @returns The latest, and the way to follow it.
 */
const keepUpWith = <Said>(
  event: string,
  schema: z.ZodType<Said>,
  first: Said,
): KeptLatest<Said> => {
  const kept = keepTheLatest(first);

  hearTheHost(event, schema, kept.set);

  return kept;
};

export { keepUpWith };
