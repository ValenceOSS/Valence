import { facePictureOf } from '@ValenceClient/profiles/facePictureOf';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { ThePicture } from '@ValenceMobile/components/APicture/APicture.types';

/**
 * Where to read somebody's picture from, and whether it is drawn.
 *
 * A drawn face is read from the drawing itself rather than the profile's picture, so a face somebody
 * has just chosen shows before it is saved. An orb or a sketch is shown as the picture the server keeps of it,
 * since a phone draws no shaders. A photograph that moves has nothing a phone can show in
 * a tile, so it gives way to the initial. A photograph the server framed is read as that square.
 *
 * @param profile - Whose picture to read.
 * @param picked - A photograph chosen on this phone and not yet sent, which shows instead.
 * @returns The picture, or null where the initial is all there is.
 */
const thePictureFor = (
  profile: Pick<ViewerProfile, 'id' | 'updatedAt' | 'avatar' | 'colour'> & {
    pictureUrl?: string | undefined;
  },
  picked: string | null = null,
): ThePicture | null => {
  if (picked !== null) {
    return { uri: picked, isDrawn: false };
  }

  const found = facePictureOf(profile);

  return found === null ? null : { uri: onThisServer(found.path), isDrawn: found.isDrawn };
};

export { thePictureFor };
