import { useEffect, useState } from 'react';
import { barsOfAFrame } from '@ValenceScreens/playback/barsOfAFrame';
import type { RefObject } from 'react';

const LOOKS_EVERY_MS = 1000;

const SAMPLE = { width: 320, height: 320 };

const REMEMBERED = 4;

const MOST_BAR = 0.3;

/**
 * Works out the shape of the picture a film actually shows, so an immersive frame can hug it rather
 * than draw black around it: the video's own proportions, less any black burned in around its edges.
 *
 * A bar is only believed once it has held across several looks, and the thinnest seen lately wins,
 * so a dark shot or a fade cannot crop the picture; frames that are dark all over are ignored.
 *
 * @param videoRef - The video element to read.
 * @param isOn - Whether anything is using the shape.
 * @returns The width of the shown picture over its height, the share of the frame's height each bar
 *   above and below takes, and the share of its width each side strip takes.
 */
const useLetterbox = (
  videoRef: RefObject<HTMLVideoElement | null>,
  isOn: boolean,
): { ratio: number; rows: number; columns: number } => {
  const [shape, setShape] = useState<{ ratio: number; rows: number; columns: number }>({
    ratio: 16 / 9,
    rows: 0,
    columns: 0,
  });

  useEffect(() => {
    if (!isOn) {
      return;
    }

    const canvas = document.createElement('canvas');
    const seen: { rows: number; columns: number }[] = [];

    canvas.width = SAMPLE.width;
    canvas.height = SAMPLE.height;

    const look = () => {
      const video = videoRef.current;
      const context = canvas.getContext('2d', { willReadFrequently: true });

      if (video === null || context === null || video.videoWidth === 0) {
        return;
      }

      let bars: { rows: number; columns: number } | null = null;

      try {
        context.drawImage(video, 0, 0, SAMPLE.width, SAMPLE.height);
        bars = barsOfAFrame(
          context.getImageData(0, 0, SAMPLE.width, SAMPLE.height).data,
          SAMPLE.width,
          SAMPLE.height,
        );
      } catch {
        bars = null;
      }

      if (bars !== null) {
        seen.push({
          rows: Math.min(MOST_BAR, bars.rows),
          columns: Math.min(MOST_BAR, bars.columns),
        });

        if (seen.length > REMEMBERED) {
          seen.shift();
        }
      }

      const rows = seen.length < 2 ? 0 : Math.min(...seen.map((one) => one.rows));
      const columns = seen.length < 2 ? 0 : Math.min(...seen.map((one) => one.columns));
      const ratio = (video.videoWidth * (1 - columns * 2)) / (video.videoHeight * (1 - rows * 2));

      setShape((was) =>
        Math.abs(was.ratio - ratio) < 0.005 &&
        Math.abs(was.rows - rows) < 0.002 &&
        Math.abs(was.columns - columns) < 0.002
          ? was
          : { ratio, rows, columns },
      );
    };

    look();

    const timer = setInterval(look, LOOKS_EVERY_MS);

    return () => {
      clearInterval(timer);
    };
  }, [isOn, videoRef]);

  return shape;
};

export { useLetterbox };
