import type { ALight } from '@ValenceMobile/components/AMoodBackground/AMoodBackground.types';

const AT = /^\s*([\d.]+)%\s+([\d.]+)%/u;

/**
 * The colour of a picture's top right corner, taken from the lights read off it: the light furthest
 * right along its top row.
 *
 * @param lights - The lights read off the picture.
 * @returns The colour, or nothing where there are no lights.
 */
const lightAtTheCorner = (lights: readonly ALight[]): string | null => {
  const placed = lights.flatMap((light) => {
    const found = AT.exec(light.at);

    return found === null
      ? []
      : [{ across: Number(found[1]), down: Number(found[2]), colour: light.colour }];
  });
  const top = Math.min(...placed.map((light) => light.down));
  const corner = placed
    .filter((light) => light.down === top)
    .reduce<(typeof placed)[number] | null>(
      (best, light) => (best === null || light.across > best.across ? light : best),
      null,
    );

  return corner?.colour ?? null;
};

export { lightAtTheCorner };
