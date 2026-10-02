import { useCallback, useState } from 'react';
import { readCaptionStyle, saveCaptionStyle } from '@ValenceClient/playback/captionStyle';
import type { CaptionStyle } from '@ValenceClient/playback/captionStyle';

/**
 * How this device draws captions, and the way to change it, remembered on the device as soon as it
 * changes so the next film is read the same way.
 *
 * @returns The style now, and how to change it.
 */
const useCaptionStyle = (): { style: CaptionStyle; change: (style: CaptionStyle) => void } => {
  const [style, setStyle] = useState(readCaptionStyle);

  const change = useCallback((next: CaptionStyle) => {
    saveCaptionStyle(next);
    setStyle(next);
  }, []);

  return { style, change };
};

export { useCaptionStyle };
