import { FaceCircle } from '@ValenceScreens/components/FaceCircle/FaceCircle';
import { PictureFramer } from '@ValenceUI/PictureFramer';
import { MOST_FRAME_ZOOM } from '@ValenceContracts/constants/MOST_FRAME_ZOOM';
import { PICTURE_ASPECTS } from '@ValenceContracts/constants/PICTURE_ASPECTS';
import type { FaceStageProps } from './FaceStage.types';
import { say } from '@ValenceI18n/say';

const STAGE = 'h-52 w-full';

/**
 * The face being made, large, in the one place it stays whichever kind of face is being made: a
 * photograph to be dragged into its circle and drawn nearer, with the rest of it faded around the
 * circle, or else the face itself, the same size in the same spot.
 *
 * @param name - Whose face, for the initial.
 * @param colour - The colour behind an initial.
 * @param avatar - The face as it stands in the editor.
 * @param source - Where the saved picture is served from.
 * @param pending - A picture chosen here and not saved yet.
 * @param framing - The whole photograph, where it sits, the filter it is drawn in, and what to tell
 *   as it moves, while a photograph is being placed.
 */
const FaceStage = ({ name, colour, avatar, source, pending, framing }: FaceStageProps) =>
  framing === null ? (
    <div className={`${STAGE} grid place-items-center rounded-lg bg-subtle`}>
      <FaceCircle
        name={name}
        colour={colour}
        avatar={avatar}
        source={source}
        pending={pending}
        className="size-[10.4rem] text-6xl"
      />
    </div>
  ) : (
    <div className="relative">
      <PictureFramer
        src={framing.picture}
        frame={framing.frame}
        aspect={PICTURE_ASPECTS.face}
        tone={framing.tone}
        mostZoom={MOST_FRAME_ZOOM}
        label={say('common.wherePictureSits')}
        shape="circle"
        onFrame={framing.onFrame}
        className={STAGE}
      />
      <p className="pointer-events-none absolute inset-x-0 bottom-1 text-center text-[0.65rem] leading-none text-text-muted">
        {say('common.dragToMovePinchToZoom')}
      </p>
    </div>
  );

FaceStage.displayName = 'FaceStage';

export { FaceStage };
