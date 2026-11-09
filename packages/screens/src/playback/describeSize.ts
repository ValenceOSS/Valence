/**
 * Describes a picture's size, or says nothing where it is not known yet.
 *
 * @param width - How wide.
 * @param height - How tall.
 * @returns The size as width by height, or null where there is not one to report.
 */
const describeSize = (width: number | null, height: number | null): string | null =>
  width === null || height === null || width === 0
    ? null
    : `${width.toString()}×${height.toString()}`;

export { describeSize };
