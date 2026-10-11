/**
 * Where a picture sits inside a surface so that all of it shows at its own shape, centred, with bars
 * on the sides or above and below for the rest — what `object-fit: contain` does for an element.
 *
 * @param picture - The picture's width and height, in square pixels.
 * @param surface - The surface's width and height, in device pixels.
 * @returns The rectangle to draw into, in device pixels.
 */
const fitWithin = (
  picture: { width: number; height: number },
  surface: { width: number; height: number },
): { x: number; y: number; width: number; height: number } => {
  if (picture.width <= 0 || picture.height <= 0 || surface.width <= 0 || surface.height <= 0) {
    return { x: 0, y: 0, width: surface.width, height: surface.height };
  }

  const scale = Math.min(surface.width / picture.width, surface.height / picture.height);
  const width = Math.max(1, Math.round(picture.width * scale));
  const height = Math.max(1, Math.round(picture.height * scale));

  return {
    x: Math.floor((surface.width - width) / 2),
    y: Math.floor((surface.height - height) / 2),
    width,
    height,
  };
};

export { fitWithin };
