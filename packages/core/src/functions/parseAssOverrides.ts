import { parseAssAlpha, parseAssColour } from './parseAssColour';
import { readAssAlignment } from './readAssAlignment';

type AssTextStyle = {
  fontFamily: string | null;
  fontSize: number | null;
  colour: string | null;
  opacity: number | null;
  isBold: boolean;
  isItalic: boolean;
  isUnderlined: boolean;
  isStruckThrough: boolean;
};

type AssOverrides = {
  style: Partial<AssTextStyle>;
  alignment: number | null;
  position: { x: number; y: number } | null;
  drawing: number | null;
  reset: string | null;
};

const BOLD_FROM = 600;

const AN_ANIMATION = '\\t(';

const A_TAG = new RegExp(
  [
    '\\\\(?:',
    'pos\\(\\s*(?<x>-?[\\d.]+)\\s*,\\s*(?<y>-?[\\d.]+)\\s*\\)',
    '|move\\(\\s*(?<fromX>-?[\\d.]+)\\s*,\\s*(?<fromY>-?[\\d.]+)[^)]*\\)',
    '|an(?<numpad>\\d+)',
    '|alpha(?<alpha>&H[0-9a-f]+&?)',
    '|1a(?<primaryAlpha>&H[0-9a-f]+&?)',
    '|1?c(?<colour>&H[0-9a-f]+&?)',
    '|fn(?<font>[^\\\\}]*)',
    '|fs(?<size>[\\d.]+)',
    '|b(?<bold>\\d+)',
    '|i(?<italic>[01])',
    '|u(?<underline>[01])',
    '|s(?<strike>[01])',
    '|a(?<legacy>\\d+)',
    '|p(?<drawing>\\d+)',
    '|r(?<reset>[^\\\\}]*)',
    ')',
  ].join(''),
  'gi',
);

/**
 * Takes the animations out of an override block, so that what a line changes into over time is not
 * mistaken for how it starts.
 *
 * @param block - What was between the braces.
 * @returns The block without its `\t(...)` groups, however deeply their brackets nest.
 */
const withoutAnimations = (block: string): string => {
  let kept = '';
  let at = 0;
  let start = block.indexOf(AN_ANIMATION);

  while (start !== -1) {
    kept += block.slice(at, start);

    let depth = 0;
    let end = start + AN_ANIMATION.length - 1;

    for (; end < block.length; end += 1) {
      depth += block[end] === '(' ? 1 : block[end] === ')' ? -1 : 0;

      if (depth === 0) {
        break;
      }
    }

    at = end + 1;
    start = block.indexOf(AN_ANIMATION, at);
  }

  return kept + block.slice(at);
};

/**
 * Reads a point a tag names, refusing one whose numbers are not numbers.
 *
 * @param x - How far across, as written.
 * @param y - How far down, as written.
 * @returns The point, or null where either number cannot be read.
 */
const pointOf = (x: string | undefined, y: string | undefined): { x: number; y: number } | null => {
  const across = Number(x);
  const down = Number(y);

  return x === undefined || y === undefined || !Number.isFinite(across) || !Number.isFinite(down)
    ? null
    : { x: across, y: down };
};

/**
 * Reads the override block an Advanced SubStation line carries in braces, taking the parts that mean
 * something a client can draw and ignoring the rest.
 *
 * Two kinds of instruction share the block. Most describe the lettering from that point on, and so
 * belong to the run of text that follows. Where the line sits — `\pos`, the start of a `\move` and
 * the alignments — belongs to the whole line however far into it the tag appears, because a line
 * cannot be in two places. `\p` switches a run into a vector drawing and back, which is shapes rather
 * than words, and `\r` starts the lettering over from the line's own style or from one it names.
 *
 * What an animation changes the line into is ignored rather than applied from the first frame, so a
 * line that fades out is shown rather than invisible throughout. `\a` is always the older SubStation
 * numbering, whichever kind of script carries it. Anything else not understood is dropped rather than
 * guessed at, which leaves the words readable instead of leaving the codes on screen.
 *
 * @param block - What was between the braces.
 * @returns What the block said about the lettering, where the line goes, whether a drawing starts or
 *   ends, and which style it starts over from.
 */
const parseAssOverrides = (block: string): AssOverrides => {
  const style: Partial<AssTextStyle> = {};

  let alignment: number | null = null;
  let position: { x: number; y: number } | null = null;
  let drawing: number | null = null;
  let reset: string | null = null;

  for (const match of withoutAnimations(block).matchAll(A_TAG)) {
    const groups = match.groups ?? {};

    position =
      pointOf(groups['x'], groups['y']) ?? pointOf(groups['fromX'], groups['fromY']) ?? position;

    if (groups['numpad'] !== undefined) {
      alignment = readAssAlignment(groups['numpad'], false) ?? alignment;
    }

    if (groups['legacy'] !== undefined) {
      alignment = readAssAlignment(groups['legacy'], true) ?? alignment;
    }

    const alpha = groups['alpha'] ?? groups['primaryAlpha'];

    if (alpha !== undefined) {
      style.opacity = parseAssAlpha(alpha) ?? style.opacity ?? null;
    }

    if (groups['colour'] !== undefined) {
      const read = parseAssColour(groups['colour']);

      if (read !== null) {
        style.colour = read.colour;

        if (read.opacity !== null) {
          style.opacity = read.opacity;
        }
      }
    }

    if (groups['font'] !== undefined && groups['font'] !== '') {
      style.fontFamily = groups['font'].trim();
    }

    const size = Number(groups['size']);

    if (groups['size'] !== undefined && Number.isFinite(size) && size > 0) {
      style.fontSize = size;
    }

    if (groups['bold'] !== undefined) {
      const weight = Number(groups['bold']);

      style.isBold = weight === 1 || weight >= BOLD_FROM;
    }

    if (groups['italic'] !== undefined) {
      style.isItalic = groups['italic'] === '1';
    }

    if (groups['underline'] !== undefined) {
      style.isUnderlined = groups['underline'] === '1';
    }

    if (groups['strike'] !== undefined) {
      style.isStruckThrough = groups['strike'] === '1';
    }

    if (groups['drawing'] !== undefined) {
      drawing = Number(groups['drawing']);
    }

    if (groups['reset'] !== undefined) {
      reset = groups['reset'].trim();
    }
  }

  return { style, alignment, position, drawing, reset };
};

export type { AssOverrides, AssTextStyle };

export { parseAssOverrides };
