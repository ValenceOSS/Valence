import type { ABox } from '@ValenceMobile/components/Watching/howBigToDrawIt';

type Listed = {
  width: number;
  height: number;
  videoPixelAspect?: string | null | undefined;
  videoRotationDegrees?: number | null | undefined;
};

/**
 * The shape a film is shown at, as the library knows it: its stored size stretched by the shape of
 * its pixels and turned the way it is meant to be held.
 *
 * Anamorphic and rotated pictures are stored a different shape from the one they are shown at, so
 * the size the player reports for them would draw them squashed or on their side. Their shape is
 * taken from here instead; a plain picture of square pixels is taken from the player, which knows
 * the size of the one actually sent.
 *
 * @param listed - The film as the library holds it, where it has been read.
 * @param played - The picture's size as the player says, where it has said.
 * @returns The shape to fit, or nothing until either is known.
 */
const shownShapeOf = (listed: Listed | null, played: ABox | null): ABox | null => {
  if (listed === null || listed.width <= 0 || listed.height <= 0) {
    return played;
  }

  const [across = 1, down = 1] = (listed.videoPixelAspect ?? '1/1').split(/[/:]/u).map(Number);
  const stretch =
    Number.isFinite(across) && Number.isFinite(down) && across > 0 && down > 0 ? across / down : 1;
  const isTurned = Math.abs(listed.videoRotationDegrees ?? 0) % 180 === 90;

  if (stretch === 1 && !isTurned) {
    return played ?? { width: listed.width, height: listed.height };
  }

  const width = listed.width * stretch;

  return isTurned ? { width: listed.height, height: width } : { width, height: listed.height };
};

export { shownShapeOf };
