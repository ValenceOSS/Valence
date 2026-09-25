/**
 * Says how fast a book plays, the way the speeds are listed.
 *
 * @param speed - How much faster than read it plays.
 * @returns The words, such as "1.25×".
 */
const describeSpeed = (speed: number): string => `${speed.toString()}×`;

export { describeSpeed };
