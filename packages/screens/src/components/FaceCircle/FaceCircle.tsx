import { useEffect, useState } from 'react';
import { cn } from '@ValenceUI/cn';
import { profileInitial } from '@ValenceContracts/schemas/ViewerProfile';
import { framedPicture } from '@ValenceScreens/library/framedPicture';
import { LETTER_FONT_LOOKS } from '@ValenceScreens/library/LETTER_FONT_LOOKS';
import { inkFor } from '@ValenceClient/library/inkFor';
import type { FaceCircleProps } from './FaceCircle.types';

const RETRIES = 2;

const RETRY_AFTER_MS = 1500;

/**
 * Draws a name, a colour and an avatar as a circle — a photograph sat in its frame, a drawn
 * avatar, the picture an orb or a drawing was saved as, or an initial — and shows a picture being uploaded before the server
 * has taken it, so choosing one feels immediate.
 *
 * A picture the server cannot produce falls back to the initial, after asking twice more a moment
 * apart, so a server that was slow or briefly out of reach does not leave the initial behind for
 * good. Whatever is being drawn says it
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
  const [tries, setTries] = useState(0);

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
    setTries(0);
  }, [source]);

  const failed = () => {
    if (tries >= RETRIES) {
      setIsMissing(true);

      return;
    }

    setTimeout(
      () => {
        setTries((was) => was + 1);
      },
      RETRY_AFTER_MS * (tries + 1),
    );
  };

  const isMoving =
    chosen === null
      ? avatar.kind === 'photo' && avatar.isVideo
      : pending?.type.startsWith('video/') === true;
  const address =
    chosen ??
    (tries === 0 ? source : `${source}${source.includes('?') ? '&' : '?'}try=${tries.toString()}`);
  const showsPicture = chosen !== null || (avatar.kind !== 'initial' && !isMissing);
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
      {!showsPicture ? (
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
          onError={failed}
        />
      ) : (
        <img
          src={address}
          alt=""
          style={frame}
          className="h-full w-full object-cover"
          onError={failed}
        />
      )}
    </span>
  );
};

FaceCircle.displayName = 'FaceCircle';

export { FaceCircle };
