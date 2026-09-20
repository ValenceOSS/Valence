import { useEffect, useState } from 'react';
import { lightsOfAFrame } from '@ValenceScreens/playback/lightsOfAFrame';
import type { RefObject } from 'react';

const LOOKS_EVERY_MS = 500;

const SAMPLE = { width: 32, height: 18 };

const DARK = ['rgb(40 40 40)', 'rgb(40 40 40)', 'rgb(40 40 40)', 'rgb(40 40 40)'];

/**
 * Follows the colours of the picture as it plays, for the glow around it: every half second the
 * frame is drawn tiny onto a canvas and read back.
 *
 * Looks only while asked to, since reading a frame back costs something on every look and nothing
 * needs it while the glow is off. Where the frame cannot be read — a browser that will not let a
 * page read what a video is showing — the glow keeps whatever colours it last had rather than
 * failing.
 *
 * @param videoRef - The video element to read.
 * @param isOn - Whether the glow is showing.
 * @returns The colour of each quarter of the picture, top left first.
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

        setLights(
          lightsOfAFrame(
            context.getImageData(0, 0, SAMPLE.width, SAMPLE.height).data,
            SAMPLE.width,
            SAMPLE.height,
          ),
        );
      } catch {
        return;
      }
    };

    look();

    const timer = setInterval(look, LOOKS_EVERY_MS);

    return () => {
      clearInterval(timer);
    };
  }, [isOn, videoRef]);

  return lights;
};

export { useAmbientLights };
