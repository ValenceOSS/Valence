import type { LetterShape } from '@ValenceScreens/library/LetterShape';

const SIZE = 100;

const ROOM = 3;

/**
 * Measures a letter as this browser draws it in a font, by drawing it unseen: the box around its
 * ink, the font's line, and where its ink weighs from side to side. Gives nothing where there is no
 * canvas to draw on.
 *
 * @param letter - The letter.
 * @param family - The font, as CSS names it.
 * @param weight - How heavy it is set.
 * @returns The letter's shape, each length a share of its size, or nothing.
 */
const measureLetter = (letter: string, family: string, weight: number): LetterShape | null => {
  const canvas = typeof document === 'undefined' ? null : document.createElement('canvas');
  const side = SIZE * ROOM;

  if (canvas === null) {
    return null;
  }

  canvas.width = side;
  canvas.height = side;

  const pen = canvas.getContext('2d', { willReadFrequently: true });

  if (pen === null) {
    return null;
  }

  pen.font = `${weight.toString()} ${SIZE.toString()}px ${family}`;
  pen.textBaseline = 'alphabetic';
  pen.textAlign = 'left';
  pen.fillStyle = '#000';

  const metrics = pen.measureText(letter);

  pen.fillText(letter, SIZE, SIZE * 2);

  const ink = pen.getImageData(0, 0, side, side).data;
  let weighed = 0;
  let across = 0;

  for (let at = 3; at < ink.length; at += 4) {
    const amount = ink[at] ?? 0;

    weighed += amount;
    across += amount * (((at - 3) / 4) % side);
  }

  return {
    width: metrics.width / SIZE,
    inkLeft: metrics.actualBoundingBoxLeft / SIZE,
    inkRight: metrics.actualBoundingBoxRight / SIZE,
    inkAscent: metrics.actualBoundingBoxAscent / SIZE,
    inkDescent: metrics.actualBoundingBoxDescent / SIZE,
    fontAscent: metrics.fontBoundingBoxAscent / SIZE,
    fontDescent: metrics.fontBoundingBoxDescent / SIZE,
    weightAcross: weighed === 0 ? metrics.width / 2 / SIZE : across / weighed / SIZE - 1,
  };
};

export { measureLetter };
