/**
 * Puts the facts known about a title on one line, leaving out the ones that are not known.
 *
 * @param facts - Year, running time, genres, rating, in the order they are read.
 * @returns The line.
 */
const joinFacts = (facts: readonly (string | null | undefined)[]): string =>
  facts.filter((fact) => fact !== undefined && fact !== null && fact !== '').join('   ·   ');

export { joinFacts };
