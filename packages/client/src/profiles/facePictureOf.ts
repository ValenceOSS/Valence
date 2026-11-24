import { drawnAvatarUrl } from '@ValenceContracts/functions/drawnAvatarUrl';
import { framedPictureUrl } from '@ValenceContracts/functions/framedPictureUrl';
import { profileAvatarUrl } from '@ValenceContracts/schemas/ViewerProfile';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

/**
 * Where a face's picture is read from on its server, and whether it is drawn, for a client that
 * draws faces natively rather than in a browser.
 *
 * A drawn face is read from the drawing itself, which anybody may read before signing in, on its
 * colour where it is drawn on one. An orb or a sketch is the picture the server keeps of it, since a
 * native client draws no shaders. A photograph that moves has nothing an image can show, so it gives
 * way to the initial, and a photograph the server framed is read as that square.
 *
 * @param profile - Whose picture to read.
 * @returns The path and whether it is a drawing, or null where the initial is all there is.
 */
const facePictureOf = (
  profile: Pick<ViewerProfile, 'id' | 'updatedAt' | 'avatar' | 'colour'> & {
    pictureUrl?: string | undefined;
  },
): { path: string; isDrawn: boolean } | null => {
  switch (profile.avatar.kind) {
    case 'initial':
      return null;
    case 'drawn':
      return {
        path: drawnAvatarUrl(
          profile.avatar.style,
          profile.avatar.seed,
          profile.avatar.isOnColour === true ? profile.colour : null,
        ),
        isDrawn: true,
      };
    case 'orb':
    case 'sketch':
      return { path: profileAvatarUrl(profile), isDrawn: false };
    case 'photo':
      return profile.avatar.isVideo
        ? null
        : {
            path: profile.avatar.hasFramedPicture
              ? framedPictureUrl(profileAvatarUrl(profile))
              : profileAvatarUrl(profile),
            isDrawn: false,
          };
  }
};

export { facePictureOf };
