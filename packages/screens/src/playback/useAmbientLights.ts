import { useEffect, useState } from 'react';
import { lightsOfAFrame } from '@ValenceScreens/playback/lightsOfAFrame';
import { AMBIENT_GRID } from '@ValenceScreens/playback/AMBIENT_GRID';
import type { RefObject } from 'react';

const LOOKS_EVERY_MS = 33;

const SAMPLE = { width: 48, height: 27 };

const DARK: readonly string[] = Array.from(
  { length: AMBIENT_GRID.columns * AMBIENT_GRID.rows },
  () => 'rgb(40 40 40)',
);

/**
 * Follows the colours of the picture as it plays, for the glow around it: on the screen's own frames,
 * about thirty times a second, the frame is drawn tiny onto a canvas and read back.
 *
 * Looks only while asked to, since reading a frame back costs something on every look and nothing
 * needs it while the glow is off. Where the frame cannot be read — a browser that will not let a
 * page read what a video is showing — the glow keeps whatever colours it last had rather than
 * failing.
 *
 * @param videoRef - The video element to read.
 * @param isOn - Whether the glow is showing.
 * @returns The colour of each cell of the grid over the picture, row by row from the top left.
 */
const useAmbientLights = (
  videoRef: RefObject<HTMLVideoElement | null>,
  isOn: boolean,
): readonly string[] => {
  const [lights, setLights] = useState<readonly string[]>(DARK);

  useEffect(() => {
    if (!isOn) {
      return;
    }

    const canvas = document.createElement('canvas');

    canvas.width = SAMPLE.width;
    canvas.height = SAMPLE.height;

    const look = () => {
      const video = videoRef.current;
      const context = canvas.getContext('2d', { willReadFrequently: true });

      if (video === null || context === null || video.videoWidth === 0) {
        return;
      }

      try {
        context.drawImage(video, 0, 0, SAMPLE.width, SAMPLE.height);

        const seen = lightsOfAFrame(
          context.getImageData(0, 0, SAMPLE.width, SAMPLE.height).data,
          SAMPLE.width,
          SAMPLE.height,
          AMBIENT_GRID.columns,
          AMBIENT_GRID.rows,
          AMBIENT_GRID.reach,
        );

        setLights((was) => (was.join() === seen.join() ? was : seen));
      } catch {
        return;
      }
    };

    let frame = 0;
    let lastLook = -Infinity;

    const tick = (now: number) => {
      if (now - lastLook >= LOOKS_EVERY_MS) {
        lastLook = now;
        look();
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [isOn, videoRef]);

  return lights;
};

export { useAmbientLights };
