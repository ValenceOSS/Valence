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

type HowClose = 'safe' | 'edge';

/**
 * How much to scale a picture that is already fitted to the screen, to draw it either way.
 *
 * Both are the same picture at different sizes rather than two layouts, so moving between them is
 * a zoom and nothing is laid out again. Laying out again is what made it look like the film slid
 * rather than grew.
 *
 * Safe holds it inside everything the phone has put over its screen, so the cutout sits on black.
 * Edge lets it reach the sides, which is what most people expect and what the cutout then sits on.
 *
 * @param howClose - Which of the two.
 * @param screen - The space the picture is drawn in.
 * @param room - What the phone has put over that space.
 * @returns What to multiply the picture by, which is one where nothing is known yet.
 */
const howBigToDrawIt = (howClose: HowClose, screen: ABox, room: TheRoomAround): number => {
  if (howClose === 'edge' || screen.width <= 0 || screen.height <= 0) {
    return 1;
  }

  return Math.min(
    (screen.width - room.left - room.right) / screen.width,
    (screen.height - room.top - room.bottom) / screen.height,
  );
};

export type { ABox, HowClose, TheRoomAround };

export { howBigToDrawIt };
