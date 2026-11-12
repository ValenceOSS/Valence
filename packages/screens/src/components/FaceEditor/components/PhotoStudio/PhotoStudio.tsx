import { Image as ImageIcon, RotateCcw as ResetIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { FilePicker } from '@ValenceUI/FilePicker';
import { Icon } from '@ValenceUI/Icon';
import { Slider } from '@ValenceUI/Slider';
import type { PhotoStudioProps } from './PhotoStudio.types';
import { say } from '@ValenceI18n/say';
import { MOST_FRAME_ZOOM } from '@ValenceContracts/constants/MOST_FRAME_ZOOM';

const PHOTO_TYPES = 'image/jpeg,image/png,image/webp,image/avif,image/gif';

const UNFRAMED = { zoom: 1, x: 0, y: 0 };

/**
 * A picture of one's own — a photograph or a GIF — and how near it is drawn in the circle; which
 * part of it shows is chosen by dragging it in the large face beside this.
 *
 * @param fileName - The picture chosen here and not saved yet, where there is one.
 * @param hasPicture - Whether there is a picture to frame at all, chosen here or saved before.
 * @param frame - How it sits now.
 * @param onPick - Told a picture was chosen.
 * @param onFrame - Told it was moved or drawn nearer.
 */
const PhotoStudio = ({ fileName, hasPicture, frame, onPick, onFrame }: PhotoStudioProps) => (
  <div className="flex flex-col gap-8">
    <section className="flex flex-col gap-3">
      <h3 className="text-[0.65rem] font-medium text-text-muted">{say('common.picture')}</h3>
      <div className="flex items-center gap-3">
        <FilePicker
          label={say('phone.aFaceEditor.chooseAPhotoOrGIF')}
          accept={PHOTO_TYPES}
          size="sm"
          onPick={onPick}
        >
          <Icon of={ImageIcon} size={15} />
          {hasPicture ? say('common.chooseAnother') : say('common.chooseAPicture')}
        </FilePicker>
        <span className="truncate text-xs text-text-muted">
          {fileName ??
            (hasPicture
              ? say('screens.faceEditor.photoStudio.yourCurrentPicture')
              : say('screens.faceEditor.photoStudio.aPhotoOrAGIF'))}
        </span>
      </div>
    </section>

    {hasPicture ? (
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h3 className="text-[0.65rem] font-medium text-text-muted">
            {say('screens.faceEditor.photoStudio.framing')}
          </h3>
          <p className="text-xs text-text-muted">{say('common.dragToMoveScrollToZoom')}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-text">{say('common.zoom')}</span>
          <Slider
            label={say('common.zoom')}
            value={Math.round((frame.zoom - 1) * 100)}
            max={(MOST_FRAME_ZOOM - 1) * 100}
            valueLabel={(at) => `${(1 + at / 100).toFixed(2)}×`}
            onValueChange={(at) => {
              onFrame({ ...frame, zoom: 1 + at / 100 });
            }}
          />
        </div>

        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onFrame(UNFRAMED);
            }}
          >
            <Icon of={ResetIcon} size={15} />
            {say('common.resetPosition')}
          </Button>
        </div>
      </section>
    ) : null}
  </div>
);

PhotoStudio.displayName = 'PhotoStudio';

export { PhotoStudio };
