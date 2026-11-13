/**
 * Widens the small parts of a whole so each is seen: any part narrower than the least share is
 * drawn at that share, and the room it takes is made by narrowing the rest, which keep their sizes
 * against one another. What is drawn still fills the whole; only how much of it each part takes
 * changes, and only for the parts too small to see.
 *
 * @param shares - Each part's true share of the whole, from nothing to one.
 * @param least - The narrowest a part with anything in it is drawn.
 * @returns Each part's share as drawn, in the same order.
 */
const visibleShares = (shares: readonly number[], least: number): number[] => {
  const parts = shares.filter((share) => share > 0).length;
  const floor = parts === 0 ? 0 : Math.min(least, 1 / parts);
  const raised = new Set<number>();

  for (let round = 0; round < shares.length; round += 1) {
    const room = 1 - raised.size * floor;
    const rest = shares.reduce((sum, share, at) => (raised.has(at) ? sum : sum + share), 0);
    const tooSmall = shares.findIndex(
      (share, at) =>
        share > 0 && !raised.has(at) && (rest === 0 ? 0 : (share / rest) * room) < floor,
    );

    if (tooSmall === -1) {
      return shares.map((share, at) =>
        share <= 0 ? 0 : raised.has(at) ? floor : rest === 0 ? 0 : (share / rest) * room,
      );
    }

    raised.add(tooSmall);
  }

  return shares.map((share) => (share > 0 ? floor : 0));
};

export { visibleShares };
