import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { randomId } from '@ValenceClient/platform/randomId';

const KEY = 'valence.tv.id';

/**
 * Which television this is, made the first time it is asked and kept from then on.
 *
 * A browser answers with a tab and a phone with a launch. A television is one box under one screen
 * that is switched on and off far more often than it is replaced, so it keeps one identifier for as
 * long as it is installed — the sessions list shows the living room once rather than a new stranger
 * every evening.
 *
 * @returns The identifier for this television.
 */
const thisTvsId = (): string => {
  const store = platformInUse().store;
  const held = store.read(KEY);

  if (held !== null && held !== '') {
    return held;
  }

  const made = randomId();

  store.write(KEY, made);

  return made;
};

export { thisTvsId };
