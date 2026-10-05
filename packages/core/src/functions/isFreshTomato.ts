const FRESH_FROM = 60;

/**
 * Whether a Rotten Tomatoes critics' score earns the fresh tomato rather than the green splat.
 *
 * @param score - The critics' score, as a percentage.
 * @returns True from 60% up.
 */
const isFreshTomato = (score: number): boolean => score >= FRESH_FROM;

export { isFreshTomato };
