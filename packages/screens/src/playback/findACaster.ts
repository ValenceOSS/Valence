import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { castThroughThePlatform } from '@ValenceScreens/playback/castThroughThePlatform';
import { chromesCaster } from '@ValenceScreens/playback/chromesCaster';
import { loadCastSender } from '@ValenceScreens/playback/castSender';
import type { Caster } from './Caster.types';

/**
 * Finds what this client casts with: what the client itself offers where it offers anything, as the
 * desktop app does, and otherwise the browser's Cast SDK, loaded only now that it is wanted.
 *
 * @returns What to cast with, or null where there is nothing.
 */
const findACaster = async (): Promise<Caster | null> => {
  const casting = platformInUse().casting;

  if (casting !== undefined) {
    return castThroughThePlatform(casting);
  }

  const context = await loadCastSender();

  return context === null ? null : chromesCaster(context);
};

export { findACaster };
