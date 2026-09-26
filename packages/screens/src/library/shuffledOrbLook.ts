import type { OrbLook } from '@ValenceUI/orbs/OrbLook';
import type { OrbVariant } from '@ValenceUI/orbs/OrbVariant';

/**
 * A colour picked from the whole wheel but kept rich and mid-bright, so a shuffled orb comes out
 * vivid rather than muddy.
 *
 * @param pick - Where randomness comes from.
 */
const aColour = (pick: () => number): string => {
  const hue = pick() * 360;
  const saturation = 0.55 + pick() * 0.4;
  const lightness = 0.4 + pick() * 0.3;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const second = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const offset = lightness - chroma / 2;
  const sector = Math.floor(hue / 60);
  const sectors: readonly (readonly [number, number, number])[] = [
    [chroma, second, 0],
    [second, chroma, 0],
    [0, chroma, second],
    [0, second, chroma],
    [second, 0, chroma],
    [chroma, 0, second],
  ];
  const [red, green, blue] = sectors[sector] ?? [chroma, second, 0];

  return `#${[red, green, blue]
    .map((channel) =>
      Math.round((channel + offset) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
};

/**
 * A new look for an orb: every setting somewhere near its own, and every colour anywhere, so
 * shuffling finds something different each time without landing on settings that draw nothing.
 *
 * @param variant - Which orb.
 * @param pick - Where randomness comes from.
 * @returns The look.
 */
const shuffledOrbLook = (variant: OrbVariant, pick: () => number = Math.random): OrbLook => ({
  params: Object.fromEntries(
    variant.params.map((param) => {
      const reach = (param.max - param.min) * 0.2;
      const low = Math.max(param.min, param.standard - reach);
      const high = Math.min(param.max, param.standard + reach);
      const value = low + pick() * (high - low);

      return [param.key, Math.round(value / param.step) * param.step];
    }),
  ),
  colours: Object.fromEntries(variant.colours.map((colour) => [colour.key, aColour(pick)])),
});

export { shuffledOrbLook };
