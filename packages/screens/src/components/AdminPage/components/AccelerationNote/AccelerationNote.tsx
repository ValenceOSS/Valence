import { HoverCard } from '@ValenceUI/HoverCard';
import type { AccelerationNoteProps } from './AccelerationNote.types';

/**
 * How the server converts video, in a word, with the longer explanation and the FFmpeg it runs on
 * shown on hover.
 *
 * @param acceleration - How the server converts video.
 * @param ffmpeg - What to say about its FFmpeg, if anything.
 * @param side - Which side of the word the explanation opens on.
 * @param align - Which edge of the word it lines up with.
 * @param isBlock - Whether it fills its line, trailing off where it is too long to fit.
 */
const AccelerationNote = ({
  acceleration,
  ffmpeg,
  side = 'bottom',
  align = 'end',
  isBlock = false,
}: AccelerationNoteProps) => (
  <HoverCard
    side={side}
    align={align}
    isBlock={isBlock}
    detail={
      <div className="flex max-w-xs flex-col gap-2 text-xs leading-relaxed">
        <p>{acceleration.detail}</p>

        {ffmpeg === null ? null : <p className="font-medium text-text">{ffmpeg}</p>}
      </div>
    }
  >
    <span className={isBlock ? 'block truncate' : undefined}>{acceleration.label}</span>
  </HoverCard>
);

AccelerationNote.displayName = 'AccelerationNote';

export { AccelerationNote };
