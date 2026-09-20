import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { thumbnailAt } from '@ValenceScreens/playback/fetchTrickplay';
import type { TrickplayFrameProps } from './TrickplayFrame.types';

const PLACEHOLDER = { width: 320, height: 180 };

/**
 * Draws the frame of an item at a moment, on its own with nothing around it, from the sprite sheet
 * built when the item was scanned. Where no frame is built yet it holds the space a frame would take,
 * so what is around it does not change shape as sheets arrive.
 *
 * @param trickplay - The sheet and how its frames are arranged, or nothing where none is built yet.
 * @param seconds - The moment to show.
 */
const TrickplayFrame = ({ trickplay, seconds }: TrickplayFrameProps) => {
  const thumbnail = trickplay === null ? null : thumbnailAt(trickplay.thumbnails, seconds);

  if (thumbnail === null) {
    return (
      <div
        aria-hidden
        className="rounded-lg bg-surface-raised"
        style={{
          width: `${(trickplay?.width ?? PLACEHOLDER.width).toString()}px`,
          height: `${(trickplay?.height ?? PLACEHOLDER.height).toString()}px`,
        }}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`Preview at ${formatDuration(seconds)}`}
      className="rounded-lg bg-surface bg-no-repeat"
      style={{
        width: `${thumbnail.width.toString()}px`,
        height: `${thumbnail.height.toString()}px`,
        backgroundImage: `url(${thumbnail.sheetUrl})`,
        backgroundPosition: `-${thumbnail.x.toString()}px -${thumbnail.y.toString()}px`,
      }}
    />
  );
};

TrickplayFrame.displayName = 'TrickplayFrame';

export { TrickplayFrame };
