/**
 * Whether two collections hold the same things, whatever their order and however they are held.
 *
 * @param one - The first.
 * @param other - The second.
 * @returns Whether each holds everything the other does.
 */
const holdTheSame = <Thing>(one: Iterable<Thing>, other: Iterable<Thing>): boolean => {
  const these = new Set(one);
  const those = new Set(other);

  return these.size === those.size && [...these].every((thing) => those.has(thing));
};

export { holdTheSame };
