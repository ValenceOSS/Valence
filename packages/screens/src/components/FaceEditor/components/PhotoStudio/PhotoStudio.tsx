import { Image as ImageIcon, RotateCcw as ResetIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { FilePicker } from '@ValenceUI/FilePicker';
import { Icon } from '@ValenceUI/Icon';
import { Slider } from '@ValenceUI/Slider';
import type { PhotoStudioProps } from './PhotoStudio.types';

const PHOTO_TYPES = 'image/jpeg,image/png,image/webp,image/avif,image/gif,video/webm,video/mp4';

const UNFRAMED = { zoom: 1, x: 0, y: 0 };

/**
 * A picture of one's own — a photograph, a GIF or a short video — and where it sits in the circle:
 * how far in it is drawn, and which part of it is in the middle.
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
      <h3 className="text-[0.65rem] uppercase tracking-[0.18em] text-text-muted">Picture</h3>
      <div className="flex items-center gap-3">
        <FilePicker
          label="Choose a picture, GIF or video"
          accept={PHOTO_TYPES}
          size="sm"
          onPick={onPick}
        >
          <Icon of={ImageIcon} size={15} />
          {hasPicture ? 'Choose another' : 'Choose a picture'}
        </FilePicker>
        <span className="truncate text-xs text-text-muted">
          {fileName ??
            (hasPicture ? 'Your current picture' : 'A photograph, a GIF or a short video.')}
        </span>
      </div>
    </section>

    {hasPicture ? (
      <section className="flex flex-col gap-5">
        <h3 className="text-[0.65rem] uppercase tracking-[0.18em] text-text-muted">Framing</h3>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-text">Zoom</span>
          <Slider
            label="Zoom"
            value={Math.round((frame.zoom - 1) * 100)}
            max={300}
            valueLabel={(at) => `${(1 + at / 100).toFixed(2)}×`}
            onValueChange={(at) => {
              onFrame({ ...frame, zoom: 1 + at / 100 });
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-text">Across</span>
          <Slider
            label="Across"
            value={Math.round((frame.x + 1) * 100)}
            max={200}
            valueLabel={(at) => `${(at - 100).toString()}%`}
            isDisabled={frame.zoom === 1}
            onValueChange={(at) => {
              onFrame({ ...frame, x: at / 100 - 1 });
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-text">Up and down</span>
          <Slider
            label="Up and down"
            value={Math.round((frame.y + 1) * 100)}
            max={200}
            valueLabel={(at) => `${(at - 100).toString()}%`}
            isDisabled={frame.zoom === 1}
            onValueChange={(at) => {
              onFrame({ ...frame, y: at / 100 - 1 });
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
            Fit the whole picture
          </Button>
        </div>
      </section>
    ) : null}
  </div>
);

PhotoStudio.displayName = 'PhotoStudio';

export { PhotoStudio };
