type ABox = {
  width: number;
  height: number;
};

type TheRoomAround = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

type HowClose = 'safe' | 'edge' | 'full';

/**
 * How much to scale a picture that is already fitted to the screen, to draw it one of three ways.
 *
 * All three are the same picture at different sizes rather than three different layouts, so moving
 * between them is a zoom and nothing is laid out again. Laying out again is what made it look like
 * the film slid rather than grew.
 *
 * Safe holds it inside everything the phone has put over its screen, so the cutout sits on black.
 * Edge lets it reach the sides, which is what most people expect and what the cutout then sits on.
 * Full crops it until there is no black left at all.
 *
 * @param howClose - Which of the three.
 * @param screen - The space the picture is drawn in.
 * @param room - What the phone has put over that space.
 * @param video - The shape of the film itself.
 * @returns What to multiply the picture by, which is one where nothing is known yet.
 */
const howBigToDrawIt = (
  howClose: HowClose,
  screen: ABox,
  room: TheRoomAround,
  video: ABox | null,
): number => {
  if (screen.width <= 0 || screen.height <= 0) {
    return 1;
  }

  if (howClose === 'safe') {
    return Math.min(
      (screen.width - room.left - room.right) / screen.width,
      (screen.height - room.top - room.bottom) / screen.height,
    );
  }

  if (howClose === 'edge' || video === null || video.width <= 0 || video.height <= 0) {
    return 1;
  }

  const across = screen.width / video.width;
  const down = screen.height / video.height;

  return Math.max(across, down) / Math.min(across, down);
};

export type { ABox, HowClose, TheRoomAround };

export { howBigToDrawIt };
