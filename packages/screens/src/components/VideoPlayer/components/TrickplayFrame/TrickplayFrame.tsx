import { useElementWidth } from './useElementWidth';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { thumbnailAt } from '@ValenceClient/playback/fetchTrickplay';
import type { TrickplayFrameProps } from './TrickplayFrame.types';
import { say } from '@ValenceI18n/say';

const PLACEHOLDER = { width: 320, height: 180 };

/**
 * Draws the frame of an item at a moment, on its own with nothing around it, from the sprite sheet
 * built when the item was scanned. Where no frame is built yet it holds the space a frame would take,
 * so what is around it does not change shape as sheets arrive.
 *
 * @param trickplay - The sheet and how its frames are arranged, or nothing where none is built yet.
 * @param seconds - The moment to show.
 * @param isFluid - Whether it fills the width it is given, scaled to fit, rather than drawing at the
 *   size the sheet was cut at.
 */
const TrickplayFrame = ({ trickplay, seconds, isFluid = false }: TrickplayFrameProps) => {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const thumbnail = trickplay === null ? null : thumbnailAt(trickplay.thumbnails, seconds);

  if (isFluid) {
    const naturalWidth = thumbnail?.width ?? trickplay?.width ?? PLACEHOLDER.width;
    const naturalHeight = thumbnail?.height ?? trickplay?.height ?? PLACEHOLDER.height;
    const scale = width === null ? 1 : width / naturalWidth;

    return (
      <div
        ref={ref}
        className="relative w-full overflow-hidden rounded-lg bg-surface-raised"
        style={{ aspectRatio: `${naturalWidth.toString()} / ${naturalHeight.toString()}` }}
      >
        {thumbnail === null ? null : (
          <div
            role="img"
            aria-label={say('screens.trickplayFrame.previewAt', { time: formatDuration(seconds) })}
            className="absolute top-0 left-0 origin-top-left bg-no-repeat"
            style={{
              width: `${naturalWidth.toString()}px`,
              height: `${naturalHeight.toString()}px`,
              transform: `scale(${scale.toString()})`,
              backgroundImage: `url(${thumbnail.sheetUrl})`,
              backgroundPosition: `-${thumbnail.x.toString()}px -${thumbnail.y.toString()}px`,
            }}
          />
        )}
      </div>
    );
  }

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
      aria-label={say('screens.trickplayFrame.previewAt', { time: formatDuration(seconds) })}
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
