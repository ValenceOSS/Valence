import type { PlacementSettings } from '@ValenceServer/transcoder/buildPlacement';
import { buildPlacement } from '@ValenceServer/transcoder/buildPlacement';
import type { Placement, Transcoder } from '@ValenceServer/transcoder/TranscoderClient';

/**
 * Reads where sessions may be placed now, asking the media service for its devices only when
 * sessions are spread across them, and placing nothing where it cannot say.
 *
 * @param settings - Reads the saved placement settings.
 * @param transcoder - The media service to ask for its devices.
 * @returns The placement to send, or null to leave placement off.
 */
const readPlacement = async (
  settings: () => Promise<PlacementSettings>,
  transcoder: Pick<Transcoder, 'listDevices'>,
): Promise<Placement | null> => {
  const saved = await settings();

  if (!saved.spreadAcrossDevices || transcoder.listDevices === undefined) {
    return null;
  }

  return buildPlacement(saved, await transcoder.listDevices().catch(() => []));
};

export { readPlacement };
