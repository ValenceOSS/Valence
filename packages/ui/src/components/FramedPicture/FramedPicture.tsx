import { useEffect, useState } from 'react';
import { cn } from '@ValenceUI/cn';
import { placedPicture } from '@ValenceCore/pictures/placedPicture';
import { toneFilter } from '@ValenceCore/pictures/toneFilter';
import type { CSSProperties } from 'react';
import type { FramedPictureProps } from './FramedPicture.types';

/**
 * A picture showing the part its frame chose, filling a box of the frame's shape that holds it. A
 * picture with no frame, or whose size is not known yet, fills the box from its middle, as it always
 * has — so a drawing with no size of its own is never taken for a wide picture.
 *
 * @param src - Where the picture is.
 * @param frame - Where it sits in its box, or nothing for its middle.
 * @param aspect - How wide the box is for its height.
 * @param tone - The filter it is drawn in, whose colour layer is laid over the whole box, which
 *   keeps it to the picture by drawing it as a group of its own.
 * @param onMeasure - Told how large the picture is once it has loaded.
 * @param onError - Told the picture could not be loaded.
 */
const FramedPicture = ({
  src,
  frame,
  aspect,
  tone = null,
  onMeasure,
  onError,
  className,
}: FramedPictureProps) => {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    setSize(null);
  }, [src]);

  const at = size === null || frame === null ? null : placedPicture(size, aspect, frame);
  const placed: CSSProperties | undefined =
    at === null
      ? undefined
      : {
          position: 'absolute',
          maxWidth: 'none',
          width: `${(at.width * 100).toFixed(4)}%`,
          height: `${(at.height * 100).toFixed(4)}%`,
          left: `${(at.left * 100).toFixed(4)}%`,
          top: `${(at.top * 100).toFixed(4)}%`,
        };

  const filter = tone === null ? undefined : toneFilter(tone);

  return (
    <>
      <img
        src={src}
        alt=""
        draggable={false}
        style={filter === undefined ? placed : { ...placed, filter }}
        className={cn(placed === undefined && 'h-full w-full object-cover', className)}
        onLoad={(event) => {
          const measured = {
            width: event.currentTarget.naturalWidth,
            height: event.currentTarget.naturalHeight,
          };

          if (measured.width > 0 && measured.height > 0) {
            setSize(measured);
            onMeasure?.(measured);
          }
        }}
        onError={onError}
      />
      {tone?.layer === null || tone?.layer === undefined ? null : (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundColor: tone.layer.colour,
            mixBlendMode: tone.layer.blend,
            opacity: tone.layer.opacity,
          }}
        />
      )}
    </>
  );
};

FramedPicture.displayName = 'FramedPicture';

export { FramedPicture };
