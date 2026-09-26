import { useEffect, useState } from 'react';
import { cn } from '@ValenceUI/cn';
import { Orb } from '@ValenceUI/Orb';
import { SketchPicture } from '@ValenceScreens/components/SketchPicture/SketchPicture';
import { ORB_VARIANTS } from '@ValenceUI/orbs/ORB_VARIANTS';
import { profileInitial } from '@ValenceContracts/schemas/ViewerProfile';
import { framedPicture } from '@ValenceScreens/library/framedPicture';
import { LETTER_FONT_LOOKS } from '@ValenceScreens/library/LETTER_FONT_LOOKS';
import { inkFor } from '@ValenceScreens/library/inkFor';
import type { FaceCircleProps } from './FaceCircle.types';

/**
 * Draws a name, a colour and an avatar as a circle — a photograph sat in its frame, a drawn
 * avatar, an orb moving live, or an initial — and shows a picture being uploaded before the server
 * has taken it, so choosing one feels immediate.
 *
 * A picture the server cannot produce falls back to the initial. Whatever is being drawn says it
 * has one whenever a filename is stored against it, and the file behind that name can be gone — a
 * volume that was never mapped, a directory that moved — so without this a wall of them draws as
 * broken images, which reads as the software being broken rather than one picture being missing.
 *
 * Takes the address to load from rather than working it out, because a person's picture and a
 * household's are served by two different routes and everything else about drawing them is the same.
 *
 * @param name - Whose initial to fall back to.
 * @param colour - The background behind that initial.
 * @param avatar - Which of the three kinds of face this is.
 * @param source - Where the picture is served from.
 * @param pending - A picture being uploaded, drawn in place of the stored one.
 * @param className - Extra classes for the caller's own layout.
 */
const FaceCircle = ({
  name,
  colour,
  avatar,
  source,
  pending = null,
  shape = 'circle',
  isLifted = false,
  className,
}: FaceCircleProps) => {
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
  }, [source]);

  const isMoving =
    chosen === null
      ? avatar.kind === 'photo' && avatar.isVideo
      : pending?.type.startsWith('video/') === true;
  const address = chosen ?? source;
  const showsPicture = chosen !== null || (avatar.kind !== 'initial' && !isMissing);
  const orb =
    avatar.kind === 'orb' ? ORB_VARIANTS.find((variant) => variant.key === avatar.orb) : undefined;
  const frame = chosen === null && avatar.kind === 'photo' ? framedPicture(avatar.frame) : {};
  const letter = avatar.kind === 'initial' ? LETTER_FONT_LOOKS[avatar.font] : null;

  return (
    <span
      style={{
        backgroundColor: showsPicture ? undefined : colour,
        ...(letter === null ? {} : { fontFamily: letter.family, fontWeight: letter.weight }),
      }}
      className={cn(
        'flex items-center justify-center overflow-hidden bg-subtle font-semibold',
        !showsPicture && inkFor(colour) === 'dark' ? 'text-letter-dark' : 'text-letter-light',
        shape === 'circle' ? 'rounded-full' : 'rounded-lg',
        isLifted && 'shadow-lg',
        className,
      )}
    >
      {orb !== undefined && avatar.kind === 'orb' ? (
        <Orb
          variant={orb}
          look={{ params: avatar.params, colours: avatar.colours }}
          className="h-full w-full"
        />
      ) : avatar.kind === 'sketch' ? (
        <SketchPicture scene={avatar.scene} className="h-full w-full" />
      ) : !showsPicture ? (
        profileInitial(name)
      ) : isMoving ? (
        <video
          src={address}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
          style={frame}
          className="h-full w-full object-cover"
          onError={() => {
            setIsMissing(true);
          }}
        />
      ) : (
        <img
          src={address}
          alt=""
          style={frame}
          className="h-full w-full object-cover"
          onError={() => {
            setIsMissing(true);
          }}
        />
      )}
    </span>
  );
};

FaceCircle.displayName = 'FaceCircle';

export { FaceCircle };
