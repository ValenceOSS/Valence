/**
 * Eases out on a cube: quick to arrive, slowing as it settles — how a page lands.
 *
 * @param progress - How far through, from nothing to all of it.
 * @returns How far along the movement is.
 */
const easeOutCubic = (progress: number): number => 1 - (1 - progress) ** 3;

export { easeOutCubic };
