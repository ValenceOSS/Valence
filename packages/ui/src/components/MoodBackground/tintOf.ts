/**
 * Reads any colour the page could paint, a hex, rgb() or a named colour, as red, green and blue
 * from nothing to one, by letting a drawing surface parse it, so the shader can be given whatever
 * colour the artwork was read as.
 *
 * @param colour - The colour, as CSS writes it.
 * @returns Its red, green and blue, or black where it cannot be read.
 */
const tintOf = (colour: string): [number, number, number] => {
  const surface =
    typeof OffscreenCanvas === 'undefined' ? null : new OffscreenCanvas(1, 1).getContext('2d');

  if (surface === null) {
    return [0, 0, 0];
  }

  surface.fillStyle = '#000000';
  surface.fillStyle = colour;
  surface.fillRect(0, 0, 1, 1);

  const [red = 0, green = 0, blue = 0] = surface.getImageData(0, 0, 1, 1).data;

  return [red / 255, green / 255, blue / 255];
};

export { tintOf };
