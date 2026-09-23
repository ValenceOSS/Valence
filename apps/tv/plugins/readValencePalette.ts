import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const STYLESHEET = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'packages',
  'ui',
  'src',
  'styles',
  'valence.css',
);

const A_TOKEN = /--((?:color|surface)-[\w-]+)\s*:\s*([^;]+);/gu;

const AN_OKLCH = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/u;

const A_MIX = /^color-mix\(in oklab,\s*(.+?)\s+([\d.]+)%,\s*transparent\)$/u;

const A_REFERENCE = /^var\(--([\w-]+)\)$/u;

const DARK = 'prefers-color-scheme: dark)';

type Rgba = { r: number; g: number; b: number; a: number };

/**
 * One channel of linear light as the screen shows it.
 *
 * @param linear - The channel, linear.
 * @returns It, gamma-encoded and clamped to what a screen can show.
 */
const encode = (linear: number): number => {
  const clamped = Math.min(Math.max(linear, 0), 1);

  return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
};

/**
 * An OKLCH colour as sRGB, by way of OKLab, with Björn Ottosson's published matrices.
 *
 * @param lightness - L, from 0 to 1.
 * @param chroma - C.
 * @param hue - h, in degrees.
 * @returns The colour, opaque.
 */
const fromOklch = (lightness: number, chroma: number, hue: number): Rgba => {
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);

  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return {
    r: encode(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: encode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: encode(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    a: 1,
  };
};

/**
 * Reads one value from the stylesheet as a colour, following references to other tokens.
 *
 * Only the forms the stylesheet uses for its palette are read: `oklch()`, `white` and `black`, a
 * reference to another token, and a colour mixed with transparent, which is that colour made
 * translucent. Anything else is left out rather than guessed at.
 *
 * @param value - What the stylesheet says.
 * @param tokens - Every token read so far, for references.
 * @returns The colour, or nothing where it is not one of those forms.
 */
const readColour = (value: string, tokens: ReadonlyMap<string, string>): Rgba | null => {
  const said = value.trim();

  if (said === 'white') {
    return { r: 1, g: 1, b: 1, a: 1 };
  }

  if (said === 'black') {
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  const oklch = AN_OKLCH.exec(said);

  if (oklch !== null) {
    return fromOklch(Number(oklch[1]), Number(oklch[2]), Number(oklch[3]));
  }

  const reference = A_REFERENCE.exec(said);

  if (reference?.[1] !== undefined) {
    const named = tokens.get(reference[1]);

    return named === undefined ? null : readColour(named, tokens);
  }

  const mix = A_MIX.exec(said);

  if (mix?.[1] !== undefined) {
    const mixed = readColour(mix[1], tokens);

    return mixed === null ? null : { ...mixed, a: mixed.a * (Number(mix[2]) / 100) };
  }

  return null;
};

/**
 * A colour as React Native writes one.
 *
 * @param colour - The colour.
 * @returns It as `rgba()`.
 */
const asRgba = ({ r, g, b, a }: Rgba): string =>
  `rgba(${Math.round(r * 255).toString()}, ${Math.round(g * 255).toString()}, ${Math.round(b * 255).toString()}, ${Number(a.toFixed(3)).toString()})`;

/**
 * The block of the stylesheet that holds the dark theme's own values.
 *
 * @param stylesheet - The whole stylesheet.
 * @returns What is between the braces of the first dark-scheme block.
 */
const theDarkBlock = (stylesheet: string): string => {
  const at = stylesheet.indexOf(DARK);
  const opens = stylesheet.indexOf('{', at);
  let depth = 0;

  for (let index = opens; index < stylesheet.length; index += 1) {
    const character = stylesheet[index];

    depth += character === '{' ? 1 : character === '}' ? -1 : 0;

    if (depth === 0) {
      return stylesheet.slice(opens + 1, index);
    }
  }

  return '';
};

/**
 * Every token a block of the stylesheet declares, in order.
 *
 * @param block - Some of the stylesheet.
 * @returns The tokens, by name.
 */
const tokensIn = (block: string): Map<string, string> =>
  new Map([...block.matchAll(A_TOKEN)].map((found) => [found[1] ?? '', found[2] ?? '']));

/**
 * ValenceUI's dark palette, read out of its own stylesheet, for a client that cannot read CSS.
 *
 * The television is dark, and draws with the same colours the web does in its dark theme. Those are
 * written once, in ValenceUI's stylesheet, in OKLCH — which React Native does not read — so they are
 * read from there each time the app is configured and handed to it as `rgba()`. Nothing is copied:
 * change a colour in the stylesheet and the television changes with it.
 *
 * The light values come first and the dark ones over them, because the dark theme only restates
 * what it changes.
 *
 * @param stylesheet - The stylesheet, which a caller may hand over instead of it being read.
 * @returns Each colour token, named as the stylesheet names it, as React Native writes it.
 */
const readValencePalette = (
  stylesheet: string = readFileSync(STYLESHEET, 'utf8'),
): Record<string, string> => {
  const tokens = new Map([...tokensIn(stylesheet), ...tokensIn(theDarkBlock(stylesheet))]);

  return Object.fromEntries(
    [...tokens.keys()].flatMap((name) => {
      const colour = readColour(tokens.get(name) ?? '', tokens);

      return colour === null ? [] : [[name, asRgba(colour)]];
    }),
  );
};

export { readValencePalette };
