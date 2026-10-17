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
 */
const AccelerationNote = ({
  acceleration,
  ffmpeg,
  side = 'bottom',
  align = 'end',
}: AccelerationNoteProps) => (
  <HoverCard
    side={side}
    align={align}
    detail={
      <div className="flex max-w-xs flex-col gap-2 text-xs leading-relaxed">
        <p>{acceleration.detail}</p>

        {ffmpeg === null ? null : <p className="font-medium text-text">{ffmpeg}</p>}
      </div>
    }
  >
    <span>{acceleration.label}</span>
  </HoverCard>
);

AccelerationNote.displayName = 'AccelerationNote';

export { AccelerationNote };
