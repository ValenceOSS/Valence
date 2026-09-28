import { applyPalette, GIFEncoder, quantize } from 'gifenc';
import { showOrb } from '@ValenceUI/orbs/showOrb';
import type { OrbLook } from '@ValenceUI/orbs/OrbLook';
import type { OrbVariant } from '@ValenceUI/orbs/OrbVariant';

const FRAMES = 36;

const BLENDED = 10;

const EVERY = 66;

/**
 * Films an orb moving and loops it as a GIF, for everywhere that is shown a picture rather than a
 * shader — the phone and the television — so the orb moves there too, as a GIF rather than drawn.
 *
 * The orb never repeats itself, so the loop is made to: a few frames more than are kept are filmed,
 * and the last of them are faded into the first, so the end runs into the start without a jump.
 * Every frame shares one set of colours, picked from them all, so the colours hold still while the
 * orb moves, and anything barely there around its edge is left clear.
 *
 * @param variant - Which orb.
 * @param look - Its settings.
 * @param across - How many pixels wide and high the GIF is.
 * @returns The GIF, or nothing where the browser could not draw the orb.
 */
const orbLoop = (variant: OrbVariant, look: OrbLook, across = 240): Promise<Blob | null> =>
  new Promise((settle) => {
    const target = document.createElement('canvas');
    const paint = target.getContext('2d', { willReadFrequently: true });
    const shown = showOrb(target, variant, () => look, { isStill: false, across });
    const filmed: Uint8ClampedArray[] = [];
    let lastAt = 0;

    const film = (now: number) => {
      if (paint === null) {
        shown.stop();
        settle(null);

        return;
      }

      if (target.width === across && now - lastAt >= EVERY) {
        lastAt = now;
        filmed.push(paint.getImageData(0, 0, across, across).data);
      }

      if (filmed.length < FRAMES + BLENDED) {
        requestAnimationFrame(film);

        return;
      }

      shown.stop();
      settle(new Blob([looped(filmed, across)], { type: 'image/gif' }));
    };

    requestAnimationFrame(film);
  });

/**
 * Fades the frames filmed past the loop into its first ones, then writes the loop as a GIF.
 *
 * @param filmed - Every frame filmed, the loop's and the few past it.
 * @param across - How wide and high each frame is.
 * @returns The GIF's bytes.
 */
const looped = (filmed: readonly Uint8ClampedArray[], across: number): Uint8Array<ArrayBuffer> => {
  const frames = filmed.slice(0, FRAMES).map((frame, at) => {
    const past = filmed[FRAMES + at];

    if (at >= BLENDED || past === undefined) {
      return frame;
    }

    const toward = at / BLENDED;

    return frame.map((channel, which) =>
      Math.round((past[which] ?? channel) * (1 - toward) + channel * toward),
    );
  });
  const sampling = frames.filter((_, at) => at % 4 === 0);
  const sampled = new Uint8ClampedArray(sampling.length * across * across * 4);

  sampling.forEach((frame, at) => {
    sampled.set(frame, at * across * across * 4);
  });

  const palette = quantize(sampled, 256, { format: 'rgba4444', oneBitAlpha: true });
  const clear = palette.findIndex((colour) => colour[3] === 0);
  const gif = GIFEncoder();

  for (const frame of frames) {
    gif.writeFrame(applyPalette(frame, palette, 'rgba4444'), across, across, {
      palette,
      delay: EVERY,
      repeat: 0,
      ...(clear === -1 ? {} : { transparent: true, transparentIndex: clear, dispose: 2 }),
    });
  }

  gif.finish();

  return gif.bytes();
};

export { orbLoop };
