import { Image as ImageIcon, RotateCcw as ResetIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { FilePicker } from '@ValenceUI/FilePicker';
import { Icon } from '@ValenceUI/Icon';
import { Slider } from '@ValenceUI/Slider';
import { MOST_FRAME_ZOOM } from '@ValenceContracts/constants/MOST_FRAME_ZOOM';
import { isUnframed } from '@ValenceCore/pictures/isUnframed';
import { PhotoFilters } from '@ValenceScreens/components/FaceEditor/components/PhotoFilters/PhotoFilters';
import type { PhotoStudioProps } from './PhotoStudio.types';
import { say } from '@ValenceI18n/say';

const PHOTO_TYPES = 'image/jpeg,image/png,image/webp,image/avif,image/gif';

const UNFRAMED = { zoom: 1, x: 0, y: 0 };

/**
 * The classes that grey a part out while there is no picture for it to work on.
 *
 * @param picture - The picture, or nothing.
 * @returns The classes.
 */
const GREYED = (picture: string | null): string =>
  cn('transition-opacity still:transition-none', picture === null && 'opacity-40');

/**
 * What a picture of one's own — a photograph or a GIF — is chosen and placed with, beneath the
 * face it is placed in: how near it is drawn, another picture and a way back to the middle, and the
 * filter it is drawn in. Until there is a picture, all but the choosing of one is shown greyed and
 * cannot be used, and the way back to the middle only while the picture is not there already.
 *
 * @param hasPicture - Whether there is a picture at all, chosen here or saved before.
 * @param picture - Where the whole picture is drawn from while it is placed, once there is one.
 * @param filter - The filter it is drawn in.
 * @param frame - How it sits now.
 * @param onPick - Told a picture was chosen.
 * @param onFrame - Told it was drawn nearer, or put back in the middle.
 * @param onFilter - Told a filter was chosen.
 */
const PhotoStudio = ({
  hasPicture,
  picture,
  filter,
  frame,
  onPick,
  onFrame,
  onFilter,
}: PhotoStudioProps) => (
  <div className="flex flex-col gap-4">
    <div
      aria-disabled={picture === null}
      className={cn('flex items-center gap-3', GREYED(picture))}
    >
      <Icon of={ImageIcon} size={13} tone="muted" />
      <div className="min-w-0 flex-1">
        <Slider
          label={say('common.zoom')}
          value={Math.round((frame.zoom - 1) * 100)}
          max={(MOST_FRAME_ZOOM - 1) * 100}
          valueLabel={(at) => `${(1 + at / 100).toFixed(2)}×`}
          isDisabled={picture === null}
          onValueChange={(at) => {
            onFrame({ ...frame, zoom: 1 + at / 100 });
          }}
        />
      </div>
      <Icon of={ImageIcon} size={19} tone="muted" />
    </div>

    <div className="flex items-center justify-between gap-3">
      <FilePicker
        label={say('phone.aFaceEditor.chooseAPhotoOrGIF')}
        accept={PHOTO_TYPES}
        size="sm"
        onPick={onPick}
      >
        <Icon of={ImageIcon} size={15} />
        {hasPicture ? say('common.chooseAnother') : say('common.chooseAPicture')}
      </FilePicker>

      <Button
        variant="ghost"
        size="sm"
        disabled={picture === null || isUnframed(frame)}
        onClick={() => {
          onFrame(UNFRAMED);
        }}
      >
        <Icon of={ResetIcon} size={15} />
        {say('common.resetPosition')}
      </Button>
    </div>

    <div aria-disabled={picture === null} className={GREYED(picture)}>
      <PhotoFilters picture={picture} frame={frame} chosen={filter} onChoose={onFilter} />
    </div>
  </div>
);

PhotoStudio.displayName = 'PhotoStudio';

export { PhotoStudio };
