/**
 * Puts some rows in an order of their own for one time round, the same each time that round is
 * asked for, so rows coming round again do not come in the order they first did.
 *
 * @param count - How many rows there are.
 * @param round - Which time round it is.
 * @returns Each row's place in this round.
 */
const roundOrder = (count: number, round: number): number[] => {
  const order = Array.from({ length: count }, (_, at) => at);
  let seed = round * 2_654_435_761;

  for (let at = count - 1; at > 0; at -= 1) {
    seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
    const other = seed % (at + 1);
    const held = order[at] ?? at;

    order[at] = order[other] ?? other;
    order[other] = held;
  }

  return order;
};

export { roundOrder };
