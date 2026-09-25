import { usePictureLights } from '@ValenceMobile/hooks/usePictureLights';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import type { ALight } from '@ValenceMobile/components/AMoodBackground/AMoodBackground.types';

/**
 * The colours of a title's artwork, as lights for the page behind it, as the web lights its home
 * page with whatever its hero is showing.
 *
 * @param mediaId - Whose artwork, or nothing for no lights.
 * @returns The lights.
 */
const useArtworkLights = (mediaId: string | null): ALight[] =>
  usePictureLights(mediaId === null ? null : onThisServer(`/api/media/${mediaId}/image/backdrop`));

export { useArtworkLights };
