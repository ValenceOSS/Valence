import type { MoodLight } from '@ValenceUI/MoodBackground.types';

/**
 * Reads an `rgb()` colour as its three channels, which is the only form it can be averaged in.
 * Anything else — a hex code, a named colour, a gradient — comes back as nothing rather than as a
 * guess, and leaves the light it came from alone.
 *
 * @param colour - The colour as CSS wrote it.
 * @returns The red, green and blue channels, or null where the colour was not in that form.
 */
const readColour = (colour: string): [number, number, number] | null => {
  const found = /rgb\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*\)/.exec(colour);

  if (found === null) {
    return null;
  }

  return [Number(found[1]), Number(found[2]), Number(found[3])];
};

/**
 * Reads where a light sits, written as two percentages, so it can be moved rather than jumped.
 *
 * @param at - Where the light sits, as CSS wrote it.
 * @returns Across and down, or null where it was not written as two percentages.
 */
const readPlace = (at: string | undefined): [number, number] | null => {
  const found = /^\s*(-?[\d.]+)%\s+(-?[\d.]+)%\s*$/.exec(at ?? '');

  return found === null ? null : [Number(found[1]), Number(found[2])];
};

/**
 * Moves one number part of the way towards another.
 *
 * @param from - Where it is.
 * @param to - Where it is going.
 * @param amount - How far to move, from nothing to all the way.
 * @returns Where it has got to.
 */
const towards = (from: number, to: number, amount: number): number => from + (to - from) * amount;

/**
 * Moves the light the page is lit by part of the way towards the light of whatever is on screen
 * now, so that changing what is featured warms the room rather than switching it. Each light's
 * colour, place and strength all move, so a light that is going out fades and one arriving from
 * elsewhere in the picture drifts over rather than appearing there. A light that cannot be read is
 * passed through untouched rather than being blended into grey.
 *
 * @param from - The lights currently in force.
 * @param to - The lights being moved towards.
 * @param amount - How far to move, from nothing to all the way.
 * @returns The lights to paint this frame.
 */
const blendLights = (from: MoodLight[], to: MoodLight[], amount: number): MoodLight[] =>
  to.map((light, at) => {
    const was = from[at];
    const held = readColour(was?.color ?? '');
    const wanted = readColour(light.color);

    if (was === undefined || held === null || wanted === null) {
      return light;
    }

    const [red, green, blue] = [0, 1, 2].map((channel) =>
      Math.round(towards(held[channel] ?? 0, wanted[channel] ?? 0, amount)),
    );

    const heldPlace = readPlace(was.at);
    const wantedPlace = readPlace(light.at);

    const place =
      heldPlace === null || wantedPlace === null
        ? {}
        : {
            at: `${towards(heldPlace[0], wantedPlace[0], amount).toFixed(2)}% ${towards(heldPlace[1], wantedPlace[1], amount).toFixed(2)}%`,
          };

    const weight =
      was.weight === undefined && light.weight === undefined
        ? {}
        : { weight: towards(was.weight ?? 1, light.weight ?? 1, amount) };

    return {
      ...light,
      ...place,
      ...weight,
      color: `rgb(${(red ?? 0).toString()} ${(green ?? 0).toString()} ${(blue ?? 0).toString()})`,
    };
  });

export { blendLights };
