type ABox = {
  width: number;
  height: number;
};

type HowClose = 'fit' | 'fill';

/**
 * How much to scale a picture that is already fitted to the screen, to draw it either way.
 *
 * Both are the same picture at different sizes rather than two layouts, so moving between them is
 * a zoom and nothing is laid out again. Laying out again is what made it look like the film slid
 * rather than grew.
 *
 * Fit is the whole picture, edge to edge, with bands only where its shape differs from the
 * screen's, which is how Netflix, Disney+ and Apple's own player open a film. The cutout sits over
 * the picture's edge there as it does in them. It used to be held clear of the cutout and the home
 * bar too, which drew a wide film as a small box in black on every side. Fill zooms it until the
 * bands have gone, giving up what falls off the sides, which is what pinching outwards does in
 * all of them.
 *
 * @param howClose - Which of the two.
 * @param screen - The space the picture is drawn in.
 * @param picture - The picture's own size, where the player has said.
 * @returns What to multiply the picture by, which is one where nothing is known yet.
 */
const howBigToDrawIt = (howClose: HowClose, screen: ABox, picture: ABox | null): number => {
  if (
    howClose === 'fit' ||
    picture === null ||
    screen.width <= 0 ||
    screen.height <= 0 ||
    picture.width <= 0 ||
    picture.height <= 0
  ) {
    return 1;
  }

  const across = screen.width / picture.width;
  const down = screen.height / picture.height;

  return Math.max(across, down) / Math.min(across, down);
};

export type { ABox, HowClose };

export { howBigToDrawIt };
