import type { PlacementSettings } from '@ValenceServer/transcoder/buildPlacement';
import { readPlacement } from '@ValenceServer/transcoder/readPlacement';
import type { Transcoder } from '@ValenceServer/transcoder/TranscoderClient';

/**
 * Tells the media service where sessions may be placed, so it can check each device's encoders
 * ahead of time, and says why where it could not rather than failing.
 *
 * @param settings - Reads the saved placement settings.
 * @param transcoder - The media service to tell.
 * @param warn - Told why, where the media service could not be told.
 */
const sendPlacement = async (
  settings: () => Promise<PlacementSettings>,
  transcoder: Pick<Transcoder, 'listDevices' | 'setPlacement'>,
  warn: (line: string) => void,
): Promise<void> => {
  const { setPlacement } = transcoder;

  if (setPlacement === undefined) {
    return;
  }

  try {
    await setPlacement(await readPlacement(settings, transcoder));
  } catch (error) {
    warn(
      `placement: the media service could not be told where to place sessions: ${String(error)}`,
    );
  }
};

export { sendPlacement };
