const SIZE = 32;

const CIRCLE = 'rgb(99, 100, 106)';

const FONT = `600 19px Gilroy, system-ui, sans-serif`;

type Pen = Pick<CanvasRenderingContext2D, 'arc' | 'beginPath' | 'fill' | 'fillText'> & {
  font: string;
  fillStyle: CanvasRenderingContext2D['fillStyle'];
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  measureText: (
    text: string,
  ) => Pick<TextMetrics, 'actualBoundingBoxAscent' | 'actualBoundingBoxDescent'>;
};

type UnreadBadgeCanvas = Pick<HTMLCanvasElement, 'width' | 'height' | 'toDataURL'> & {
  getContext: (kind: '2d') => Pen | null;
};

/**
 * Draws the unread count as the small circle Windows lays over the corner of Valence's taskbar
 * button, in Valence's own font and centred by the digits' own height rather than the line's.
 *
 * Windows has no badge of its own to give a count to, so whatever is shown is a picture; Chromium's
 * picture uses a font of its own choosing, sized for one digit and set off-centre. Drawn here, in the
 * window, because that is where Valence's font is loaded. Counts past nine read as 9+.
 *
 * @param count - How many are unread.
 * @param canvas - What to draw on, a fresh canvas unless one is given.
 * @returns The picture as a PNG data URL, or null for nothing unread or where it could not be drawn.
 */
const drawUnreadBadge = async (
  count: number,
  canvas: UnreadBadgeCanvas = document.createElement('canvas'),
): Promise<string | null> => {
  if (count <= 0) {
    return null;
  }

  await document.fonts.load(FONT).catch(() => []);

  const pen = canvas.getContext('2d');

  if (pen === null) {
    return null;
  }

  const text = count > 9 ? '9+' : count.toString();

  canvas.width = SIZE;
  canvas.height = SIZE;

  pen.fillStyle = CIRCLE;
  pen.beginPath();
  pen.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
  pen.fill();

  pen.font = count > 9 ? FONT.replace('19px', '15px') : FONT;
  pen.fillStyle = 'white';
  pen.textAlign = 'center';
  pen.textBaseline = 'alphabetic';

  const measured = pen.measureText(text);
  const height = measured.actualBoundingBoxAscent + measured.actualBoundingBoxDescent;

  pen.fillText(text, SIZE / 2, SIZE / 2 + height / 2 - measured.actualBoundingBoxDescent);

  return canvas.toDataURL('image/png');
};

export type { UnreadBadgeCanvas };

export { drawUnreadBadge };
