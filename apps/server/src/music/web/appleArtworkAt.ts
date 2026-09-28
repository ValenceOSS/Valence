/**
 * The address of an Apple artwork at a given size, square and cropped to fill, from the address of
 * the same artwork at whatever size it was listed at.
 *
 * @param address - The artwork as listed, ending in its size, such as `100x100bb.jpg`.
 * @param size - How many pixels along each edge.
 * @returns The address at that size.
 */
const appleArtworkAt = (address: string, size: number): string =>
  address.replace(
    /\/\d+x\d+[a-z]*\.(?:jpg|jpeg|png|webp)$/i,
    `/${size.toString()}x${size.toString()}cc.jpg`,
  );

export { appleArtworkAt };
