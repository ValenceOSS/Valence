const held: {
  maker: typeof OffscreenCanvas | null;
  surface: OffscreenCanvasRenderingContext2D | null;
} = { maker: null, surface: null };

/**
 * Reads any colour the page could paint, a hex, rgb() or a named colour, as red, green and blue
 * from nothing to one, by letting a drawing surface parse it, so the shader can be given whatever
 * colour the artwork was read as. The one surface is kept and painted over each time, since a
 * changing trailer asks for a colour many times a second.
 *
 * @param colour - The colour, as CSS writes it.
 * @returns Its red, green and blue, or black where it cannot be read.
 */
const tintOf = (colour: string): [number, number, number] => {
  if (typeof OffscreenCanvas === 'undefined') {
    return [0, 0, 0];
  }

  if (held.maker !== OffscreenCanvas || held.surface === null) {
    held.maker = OffscreenCanvas;
    held.surface = new OffscreenCanvas(1, 1).getContext('2d', { willReadFrequently: true });
  }

  const { surface } = held;

  if (surface === null) {
    return [0, 0, 0];
  }

  surface.clearRect(0, 0, 1, 1);
  surface.fillStyle = '#000000';
  surface.fillStyle = colour;
  surface.fillRect(0, 0, 1, 1);

  const [red = 0, green = 0, blue = 0] = surface.getImageData(0, 0, 1, 1).data;

  return [red / 255, green / 255, blue / 255];
};

export { tintOf };
