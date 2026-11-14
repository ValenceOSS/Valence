import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { PictureSize } from './SubtitleCues.types';

/**
 * The shape of the picture a video is showing, as its width over its height.
 *
 * The element knows once it has read the film, and knows again when the picture changes size. Where
 * the page's own engine draws the picture on a canvas, the element carries only the sound and has no
 * picture to measure, so the size the engine says it draws is taken instead. The engine says nothing
 * when that size arrives or changes, so both are looked at every frame, and the shape is only given
 * again when it has changed.
 *
 * @param video - The video element, whose own picture comes first.
 * @param picture - The picture the page's own engine draws, where it draws one.
 * @returns The picture's width over its height, or nothing until there is a picture to measure.
 */
const usePictureRatio = (
  video: RefObject<HTMLVideoElement | null> | undefined,
  picture: RefObject<PictureSize | null> | undefined,
): number | null => {
  const [ratio, setRatio] = useState<number | null>(null);

  useEffect(() => {
    if (video === undefined) {
      return undefined;
    }

    let frame = 0;
    let measured: number | null | undefined;

    const measure = () => {
      const element = video.current;
      const size =
        element !== null && element.videoWidth > 0 && element.videoHeight > 0
          ? { width: element.videoWidth, height: element.videoHeight }
          : (picture?.current ?? null);
      const next =
        size !== null && size.width > 0 && size.height > 0 ? size.width / size.height : null;

      if (next !== measured) {
        measured = next;
        setRatio(next);
      }

      frame = requestAnimationFrame(measure);
    };

    frame = requestAnimationFrame(measure);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [video, picture]);

  return video === undefined ? null : ratio;
};

export { usePictureRatio };
