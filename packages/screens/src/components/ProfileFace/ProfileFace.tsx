import { profileAvatarUrl } from '@ValenceContracts/schemas/ViewerProfile';
import { FaceCircle } from '@ValenceScreens/components/FaceCircle/FaceCircle';
import type { ProfileFaceProps } from './ProfileFace.types';

/**
 * Draws what a profile looks like — their photograph, their drawn avatar, or their initial.
 *
 * @param profile - Whose face to draw.
 * @param pending - A photograph being uploaded, drawn in place of the stored one.
 * @param className - Extra classes for the caller's own layout.
 */
const ProfileFace = ({ profile, pending = null, className }: ProfileFaceProps) => (
  <FaceCircle
    name={profile.name}
    colour={profile.colour}
    avatar={profile.avatar}
    source={profileAvatarUrl(profile)}
    pending={pending}
    {...(className === undefined ? {} : { className })}
  />
);

ProfileFace.displayName = 'ProfileFace';

export { ProfileFace };
