import { segmentsLitAt } from '@ValenceCore/functions/segmentsLitAt';
import { glowOverATurn } from './glowOverATurn';

const COUNT = 8;

/**
 * Reads how bright a range says a segment is at a tick, as a native animation interpolates it.
 *
 * @param range - The range.
 * @param range.inputRange - The ticks.
 * @param range.outputRange - How bright it is at each.
 * @param tick - The tick.
 * @returns How bright.
 */
const brightnessAt = (
  { inputRange, outputRange }: ReturnType<typeof glowOverATurn>,
  tick: number,
): number => {
  const after = inputRange.findIndex((one) => one > tick);
  const to = after === -1 ? inputRange.length - 1 : after;
  const from = Math.max(0, to - 1);
  const start = inputRange[from] ?? 0;
  const end = inputRange[to] ?? 0;
  const low = outputRange[from] ?? 0;
  const high = outputRange[to] ?? 0;

  return end === start ? high : low + ((tick - start) / (end - start)) * (high - low);
};

describe('glowOverATurn', () => {
  it('runs from the start of a turn to its end, never going back', () => {
    for (let at = 0; at < COUNT; at += 1) {
      const { inputRange } = glowOverATurn(at, COUNT, 0.8, 0.2, (share) => share);

      expect(inputRange[0]).toBe(0);
      expect(inputRange.at(-1)).toBe(COUNT * 2);

      for (let step = 1; step < inputRange.length; step += 1) {
        expect(inputRange[step]).toBeGreaterThan(inputRange[step - 1] ?? 0);
      }
    }
  });

  it('is lit at every tick the ring lights it on, and dim at every other', () => {
    for (let at = 0; at < COUNT; at += 1) {
      const glow = glowOverATurn(at, COUNT, 0.8, 0.2, (share) => share);

      for (let tick = 0; tick < COUNT * 2; tick += 1) {
        const { from, lit } = segmentsLitAt(tick, COUNT);
        const isLit = at >= from && at < lit;

        expect(brightnessAt(glow, tick + 0.9)).toBeCloseTo(isLit ? 1 : 0.2);
      }
    }
  });
});
