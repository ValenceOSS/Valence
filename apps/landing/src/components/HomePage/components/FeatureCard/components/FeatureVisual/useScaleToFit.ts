import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

/**
 * How far to shrink something so it fits inside the box around it, never growing it, kept up to
 * date as either changes size.
 *
 * @param frameRef - The box it has to fit inside, whose padding is left clear.
 * @param contentRef - What has to fit, measured at its own size.
 * @returns The scale to draw it at, one when it already fits.
 */
const useScaleToFit = (
  frameRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
) => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const frame = frameRef.current;
    const content = contentRef.current;

    if (frame === null || content === null) {
      return;
    }

    const measure = () => {
      const style = getComputedStyle(frame);
      const roomHigh =
        frame.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      const roomWide =
        frame.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const high = content.offsetHeight;
      const wide = content.offsetWidth;

      setScale(high === 0 || wide === 0 ? 1 : Math.min(1, roomHigh / high, roomWide / wide));
    };

    const observer = new ResizeObserver(measure);

    observer.observe(frame);
    observer.observe(content);
    measure();

    return () => {
      observer.disconnect();
    };
  }, [frameRef, contentRef]);

  return scale;
};

export { useScaleToFit };
