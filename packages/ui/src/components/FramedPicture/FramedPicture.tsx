import { useEffect, useState } from 'react';
import { cn } from '@ValenceUI/cn';
import { placedPicture } from '@ValenceCore/pictures/placedPicture';
import type { CSSProperties } from 'react';
import type { FramedPictureProps } from './FramedPicture.types';

/**
 * A picture showing the part its frame chose, filling a box of the frame's shape that holds it. Until
 * the picture's size is known it shows its middle, as a picture left alone does.
 *
 * @param src - Where the picture is.
 * @param frame - Where it sits in its box, or nothing for its middle.
 * @param aspect - How wide the box is for its height.
 * @param onMeasure - Told how large the picture is once it has loaded.
 * @param onError - Told the picture could not be loaded.
 */
const FramedPicture = ({
  src,
  frame,
  aspect,
  onMeasure,
  onError,
  className,
}: FramedPictureProps) => {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    setSize(null);
  }, [src]);

  const at = size === null ? null : placedPicture(size, aspect, frame);
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

  return (
    <img
      src={src}
      alt=""
      draggable={false}
      style={placed}
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
  );
};

FramedPicture.displayName = 'FramedPicture';

export { FramedPicture };
