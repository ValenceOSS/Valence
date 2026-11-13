import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';

/**
 * The address an upload is sent to, carrying where the picture sits in its shape, so the server cuts
 * the part that was chosen. A picture left alone is sent to the address as it is.
 *
 * @param address - Where the upload goes.
 * @param frame - Where the picture sits, or nothing for its middle.
 * @returns The address to send it to.
 */
const withFrameQuery = (address: string, frame: PhotoFrame | null): string => {
  if (frame === null) {
    return address;
  }

  const query = new URLSearchParams({
    zoom: frame.zoom.toString(),
    x: frame.x.toString(),
    y: frame.y.toString(),
  });

  return `${address}${address.includes('?') ? '&' : '?'}${query.toString()}`;
};

export { withFrameQuery };
