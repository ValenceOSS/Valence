import { withAlpha } from '@ValenceCore/functions/withAlpha';
import type { ALight } from '@ValenceMobile/components/AMoodBackground/AMoodBackground.types';

const ACROSS = 6;

const DOWN = 4;

const STRONGEST = 0.42;

const FAINTEST = 0.2;

const REACH_ACROSS = 48;

const REACH_DOWN = 43.2;

const FALLS_OFF = 12.8;

const STEPS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6] as const;

const GONE_AT = 70;

/**
 * Lays out the lights read from a picture as the web's mood background lays out its orbs: each a
 * soft bloom of its colour where it was read, fading out as the web's does, strongest along the top
 * and fainter row by row towards the foot, and as strong as its light is vivid, so a grey part of
 * the picture lights nothing. Every bloom is one gradient of the same background, the first light
 * drawn beneath the rest as the web draws them.
 *
 * @param palette - The lights, in rows of six from the top.
 * @returns The blooms as one background, or nothing where no light shines.
 */
const bloomsOf = (palette: readonly ALight[]): string | null => {
  const blooms = palette.flatMap((light, at) => {
    const row = Math.min(Math.floor(at / ACROSS), DOWN - 1);
    const strength =
      (STRONGEST - ((STRONGEST - FAINTEST) * row) / (DOWN - 1)) * (light.weight ?? 1);

    if (strength <= 0) {
      return [];
    }

    const stops = STEPS.map(
      (step) =>
        `${withAlpha(light.colour, Math.round(strength * Math.exp(-FALLS_OFF * step * step) * 1000) / 1000)} ${(step * 100).toString()}%`,
    );

    return [
      `radial-gradient(ellipse ${REACH_ACROSS.toString()}% ${REACH_DOWN.toString()}% at ${light.at}, ${stops.join(', ')}, transparent ${GONE_AT.toString()}%)`,
    ];
  });

  return blooms.length === 0 ? null : blooms.reverse().join(', ');
};

export { bloomsOf };
