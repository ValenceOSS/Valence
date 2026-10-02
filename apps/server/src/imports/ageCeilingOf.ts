import { ageOfRating } from './ageOfRating';

/**
 * The oldest age among the ratings somebody may watch, which is the age ceiling that lets through
 * the same things.
 *
 * @param allowed - The ratings they may watch.
 * @param regions - The certification systems to read the ratings in.
 * @returns The ceiling, or zero where none of the ratings could be read as an age.
 */
const ageCeilingOf = (allowed: readonly string[], regions: readonly string[]): number =>
  allowed.reduce((highest, rating) => Math.max(highest, ageOfRating(rating, regions) ?? 0), 0);

export { ageCeilingOf };
