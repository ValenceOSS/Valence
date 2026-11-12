import { cn } from '@ValenceUI/cn';
import { PictureFramer } from '@ValenceUI/PictureFramer';
import { PICTURE_ASPECTS } from '@ValenceContracts/constants/PICTURE_ASPECTS';
import { MOST_FRAME_ZOOM } from '@ValenceContracts/constants/MOST_FRAME_ZOOM';
import { useFileAddress } from '@ValenceScreens/pictures/useFileAddress';
import { FaceCircle } from '@ValenceScreens/components/FaceCircle/FaceCircle';
import type { FacePreviewsProps } from './FacePreviews.types';

const UNFRAMED = { zoom: 1, x: 0, y: 0 };
import { say } from '@ValenceI18n/say';

/**
 * The face being made, large, and beneath it the same face at each size Valence draws faces:
 * the corner of the bar, a row in a list, and a tile on the screen that asks who is watching —
 * so a detail that only works large is caught before it is chosen.
 *
 * @param name - Whose face, for the initial and the captions.
 * @param colour - The colour behind an initial.
 * @param avatar - The face as it stands in the editor.
 * @param source - Where the saved picture is served from.
 * @param pending - A picture chosen here and not saved yet.
 * @param onFrame - Told where a photograph sits once it is dragged or drawn nearer in the large
 *   face, which can only be framed by hand where this is given.
 * @param className - Extra classes for the caller's own layout.
 */
const FacePreviews = ({
  name,
  colour,
  avatar,
  source,
  pending,
  onFrame,
  className,
}: FacePreviewsProps) => {
  const face = { name, colour, avatar, source, pending };
  const chosen = useFileAddress(pending);
  const picture = chosen ?? (pending === null ? source : null);
  const framed =
    onFrame !== undefined && avatar.kind === 'photo' && !avatar.isVideo && picture !== null
      ? { onFrame, picture, frame: avatar.frame ?? UNFRAMED }
      : null;

  return (
    <div className={cn('flex flex-col items-center gap-8', className)}>
      {framed === null ? (
        <FaceCircle {...face} isLifted className="size-48 text-6xl" />
      ) : (
        <PictureFramer
          src={framed.picture}
          frame={framed.frame}
          aspect={PICTURE_ASPECTS.face}
          mostZoom={MOST_FRAME_ZOOM}
          label={say('common.wherePictureSits')}
          shape="circle"
          onFrame={framed.onFrame}
          className="size-48 shadow-lg"
        />
      )}

      <div className="flex w-full flex-col gap-3">
        <p className="text-center text-[0.65rem] font-medium text-text-muted">
          {say('screens.faceEditor.facePreviews.aroundValence')}
        </p>

        <div className="flex items-end justify-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <FaceCircle {...face} shape="tile" className="size-20 text-2xl" />
            <span className="text-xs text-text-muted">
              {say('screens.faceEditor.facePreviews.whoIsWatching')}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 rounded-full bg-subtle py-1 pl-1 pr-3">
              <FaceCircle {...face} className="size-7 text-[0.65rem]" />
              <span className="max-w-24 truncate text-xs text-text">{name}</span>
            </div>
            <span className="text-xs text-text-muted">
              {say('screens.faceEditor.facePreviews.inAList')}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <FaceCircle {...face} className="size-9 text-xs ring-2 ring-line" />
            <span className="text-xs text-text-muted">
              {say('screens.faceEditor.facePreviews.theTopBar')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

FacePreviews.displayName = 'FacePreviews';

export { FacePreviews };
