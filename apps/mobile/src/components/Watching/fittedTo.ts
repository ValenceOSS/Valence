import type { PictureArea } from '@ValenceClient/playback/readPictureArea';
import type { ABox } from '@ValenceMobile/components/Watching/howBigToDrawIt';

type AFrame = ABox & {
  left: number;
  top: number;
};

const WHOLE: PictureArea = { x: 0, y: 0, width: 1, height: 1 };

/**
 * Where to draw a film's frame so its picture is as large as fits the screen, edge to edge, and
 * centred on it.
 *
 * The frame is drawn into exactly this box rather than left for the player to fit, because Apple's
 * player fits a picture inside the screen's safe area. And it is the picture inside the frame that
 * is fitted, not the frame: a widescreen film on a UHD Blu-ray is kept in a sixteen-by-nine frame
 * with black bars in it, and fitting the frame drew bars down the sides of a phone as well as the
 * ones in the picture. Fitted by its picture, the frame is larger than the screen and its bars fall
 * off the edges, as they would on a television.
 *
 * @param screen - The space the picture is drawn in.
 * @param frame - The frame's own size, where the player or the library has said.
 * @param area - Where the picture sits in the frame, as fractions of it, where it is known.
 * @returns Where to draw the frame, or nothing until its size is known.
 */
const fittedTo = (screen: ABox, frame: ABox | null, area: PictureArea | null): AFrame | null => {
  if (
    frame === null ||
    screen.width <= 0 ||
    screen.height <= 0 ||
    frame.width <= 0 ||
    frame.height <= 0
  ) {
    return null;
  }

  const picture = area ?? WHOLE;
  const scale = Math.min(
    screen.width / (frame.width * picture.width),
    screen.height / (frame.height * picture.height),
  );
  const width = frame.width * scale;
  const height = frame.height * scale;

  return {
    width,
    height,
    left: screen.width / 2 - (picture.x + picture.width / 2) * width,
    top: screen.height / 2 - (picture.y + picture.height / 2) * height,
  };
};

/**
 * The size of the picture inside a frame, which is what a pinch fills the screen with.
 *
 * @param frame - The frame's own size.
 * @param area - Where the picture sits in it, where it is known.
 * @returns The picture's size, or nothing until the frame's is known.
 */
const pictureIn = (frame: ABox | null, area: PictureArea | null): ABox | null => {
  if (frame === null) {
    return null;
  }

  const picture = area ?? WHOLE;

  return { width: frame.width * picture.width, height: frame.height * picture.height };
};

export type { AFrame };

export { fittedTo, pictureIn };
