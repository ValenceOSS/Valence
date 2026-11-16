import { listen } from '@tauri-apps/api/event';
import type { z } from 'zod';

/**
 * Follows one of the host's events, passing on each payload the schema accepts, until the function
 * it returns is called.
 *
 * @param event - The event's name.
 * @param schema - What a payload has to be to be passed on.
 * @param listener - Told each payload.
 * @returns How to stop.
 */
const hearTheHost = <Said>(
  event: string,
  schema: z.ZodType<Said>,
  listener: (said: Said) => void,
): (() => void) => {
  let isStopped = false;

  const listening = listen(event, (heard) => {
    const said = schema.safeParse(heard.payload);

    if (!isStopped && said.success) {
      listener(said.data);
    }
  }).catch(() => null);

  return () => {
    isStopped = true;
    void listening.then((stop) => {
      stop?.();
    });
  };
};

export { hearTheHost };
