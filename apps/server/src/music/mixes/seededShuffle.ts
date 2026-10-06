/**
 * Puts things in an order that looks random but is the same every time for the same seed, so a mix
 * made from it keeps its order all day and changes the next.
 *
 * @param items - What to put in order.
 * @param seed - What decides the order.
 * @returns The same things in the seed's order.
 */
const seededShuffle = <T>(items: readonly T[], seed: string): T[] => {
  let state =
    [...seed].reduce(
      (hash, letter) => Math.imul(hash ^ letter.charCodeAt(0), 16777619),
      2166136261,
    ) >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);

    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);

    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
  const shuffled = [...items];

  for (let at = shuffled.length - 1; at > 0; at -= 1) {
    const other = Math.floor(next() * (at + 1));
    const held = shuffled[at];
    const swapped = shuffled[other];

    if (held !== undefined && swapped !== undefined) {
      shuffled[at] = swapped;
      shuffled[other] = held;
    }
  }

  return shuffled;
};

export { seededShuffle };
