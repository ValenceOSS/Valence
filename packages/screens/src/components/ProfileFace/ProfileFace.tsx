import { useEffect, useState } from 'react';
import { cn } from '@ValenceUI/cn';
import { profileInitial, profileAvatarUrl } from '@ValenceContracts/schemas/ViewerProfile';
import type { ProfileFaceProps } from './ProfileFace.types';

/**
 * Draws what a profile looks like — their photograph, their drawn avatar, or their initial — and
 * shows a photograph being uploaded before the server has taken it, so choosing one feels immediate.
 *
 * A photograph the server cannot produce falls back to the initial. The profile says it has one
 * whenever a filename is stored against it, and the file behind that name can be gone — a volume
 * that was never mapped, a directory that moved — so without this the way in draws a wall of broken
 * images, which reads as the software being broken rather than one picture being missing.
 *
 * @param profile - Whose face to draw.
 * @param pending - A photograph being uploaded, drawn in place of the stored one.
 * @param className - Extra classes for the caller's own layout.
 */
const ProfileFace = ({ profile, pending = null, className }: ProfileFaceProps) => {
  const [chosen, setChosen] = useState<string | null>(null);
  const [isMissing, setIsMissing] = useState(false);

  useEffect(() => {
    if (pending === null) {
      setChosen(null);

      return;
    }

    const address = URL.createObjectURL(pending);

    setChosen(address);

    return () => {
      URL.revokeObjectURL(address);
    };
  }, [pending]);

  useEffect(() => {
    setIsMissing(false);
  }, [profile.id, profile.updatedAt]);

  const isMoving =
    chosen === null
      ? profile.avatar.kind === 'photo' && profile.avatar.isVideo
      : pending?.type.startsWith('video/') === true;
  const source = chosen ?? profileAvatarUrl(profile);
  const showsPicture = chosen !== null || (profile.avatar.kind !== 'initial' && !isMissing);

  return (
    <span
      style={{ backgroundColor: showsPicture ? undefined : profile.colour }}
      className={cn(
        'flex items-center justify-center overflow-hidden bg-subtle font-semibold text-text',
        className,
      )}
    >
      {!showsPicture ? (
        profileInitial(profile.name)
      ) : isMoving ? (
        <video
          src={source}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
          className="h-full w-full object-cover"
          onError={() => {
            setIsMissing(true);
          }}
        />
      ) : (
        <img
          src={source}
          alt=""
          className="h-full w-full object-cover"
          onError={() => {
            setIsMissing(true);
          }}
        />
      )}
    </span>
  );
};

ProfileFace.displayName = 'ProfileFace';

export { ProfileFace };
