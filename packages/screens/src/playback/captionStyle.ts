import { z } from 'zod';

const FONT_FAMILIES = {
  sans: 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  casual: '"Comic Sans MS", "Chalkboard SE", cursive',
} as const;

/**
 * Builds the edge drawn behind caption lettering at a chosen strength — an outline, a shadow, a
 * raised or depressed edge — which is what keeps white text readable over a white shirt.
 *
 * An outline is drawn as copies of the lettering pushed out all the way round, sixteen directions
 * rather than four, so a thick one stays solid instead of breaking up at the diagonals. Its reach is
 * measured against the lettering itself rather than in pixels, so the same setting reads the same on
 * a small preview and on a large screen instead of swallowing small text.
 *
 * @param edge - Which edge to draw.
 * @param opacity - How strongly to draw it.
 * @param thickness - How thick an outline is, in steps from one to four.
 * @returns The CSS that draws it.
 */
const edgeStyle = (edge: CaptionStyle['edgeStyle'], opacity: number, thickness: number): string => {
  const ink = (strength: number): string => `rgba(0, 0, 0, ${(strength * opacity).toFixed(2)})`;

  if (edge === 'none') {
    return 'none';
  }

  if (edge === 'shadow') {
    return `2px 2px 4px ${ink(0.9)}`;
  }

  if (edge === 'raised') {
    return `1px 1px 0 rgba(255, 255, 255, ${(0.4 * opacity).toFixed(2)}), 2px 2px 3px ${ink(0.9)}`;
  }

  const reach = thickness * OUTLINE_STEP_EM;

  return [
    ...Array.from({ length: OUTLINE_DIRECTIONS }, (_, at) => {
      const turn = (at / OUTLINE_DIRECTIONS) * Math.PI * 2;

      return `${em(Math.cos(turn) * reach)} ${em(Math.sin(turn) * reach)} 0 ${ink(1)}`;
    }),
    `0 0 ${em(reach * 2)} ${ink(0.9)}`,
  ].join(', ');
};

const OUTLINE_DIRECTIONS = 16;

const OUTLINE_STEP_EM = 0.025;

/**
 * Writes a length in ems, rounded so the rule stays readable.
 *
 * @param value - The length, as a fraction of the lettering's size.
 * @returns The length, as CSS.
 */
const em = (value: number): string => `${(Math.round(value * 1000) / 1000).toString()}em`;

const CaptionStyleSchema = z.object({
  fontFamily: z.enum(['sans', 'serif', 'mono', 'casual']).default('sans'),
  fontScale: z.number().min(50).max(300).default(100),
  color: z.string().default('#ffffff'),
  opacity: z.number().min(0.1).max(1).default(1),
  backgroundColor: z.string().default('#000000'),
  backgroundOpacity: z.number().min(0).max(1).default(0.75),
  edgeStyle: z.enum(['none', 'outline', 'shadow', 'raised']).default('outline'),
  outlineThickness: z.number().int().min(1).max(4).default(1),
});

type CaptionStyle = z.infer<typeof CaptionStyleSchema>;

const STORAGE_KEY = 'valence.captionStyle';

const DEFAULT_CAPTION_STYLE: CaptionStyle = CaptionStyleSchema.parse({});

/**
 * Turns a hex colour and an opacity into a colour CSS accepts, since captions are configured as a
 * colour and a separate opacity but drawn as one value.
 *
 * @param color - The colour as configured.
 * @param opacity - How opaque it should be, from nothing to one.
 * @returns The colour, as CSS.
 */
const withOpacity = (color: string, opacity: number): string => {
  const hex = color.replace('#', '');
  const expanded =
    hex.length === 3
      ? hex
          .split('')
          .map((character) => `${character}${character}`)
          .join('')
      : hex;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  if (Number.isNaN(red) || Number.isNaN(green) || Number.isNaN(blue)) {
    return color;
  }

  return `rgba(${red.toString()}, ${green.toString()}, ${blue.toString()}, ${opacity.toString()})`;
};

type CueDeclarations = {
  fontFamily: string;
  fontSize: string;
  color: string;
  backgroundColor: string;
  textShadow: string;
};

/**
 * Turns a viewer's caption preferences into the properties that draw them.
 *
 * @param style - The preferences as configured.
 * @returns The declarations to apply to the cues.
 */
const toCueDeclarations = (style: CaptionStyle): CueDeclarations => ({
  fontFamily: FONT_FAMILIES[style.fontFamily],
  fontSize: `${style.fontScale.toString()}%`,
  color: withOpacity(style.color, style.opacity),
  backgroundColor: withOpacity(style.backgroundColor, style.backgroundOpacity),
  textShadow: edgeStyle(style.edgeStyle, style.opacity, style.outlineThickness),
});

/**
 * Writes a viewer's caption preferences as the CSS rule that renders them, which is applied to the
 * cue pseudo-element since that is the only way a browser lets captions be styled.
 *
 * @param style - The preferences as configured.
 * @returns The stylesheet text to install.
 */
const toCueCss = (style: CaptionStyle): string => {
  const declarations = toCueDeclarations(style);

  return [
    `font-family: ${declarations.fontFamily};`,
    `font-size: ${declarations.fontSize};`,
    `color: ${declarations.color};`,
    `background-color: ${declarations.backgroundColor};`,
    `text-shadow: ${declarations.textShadow};`,
  ].join(' ');
};

/**
 * Reads how this viewer likes captions drawn. Held on the device rather than on the profile, since
 * legibility depends on the screen and the room it is in.
 */
const readCaptionStyle = (): CaptionStyle => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored === null) {
      return DEFAULT_CAPTION_STYLE;
    }

    const parsed = CaptionStyleSchema.safeParse(JSON.parse(stored));

    return parsed.success ? parsed.data : DEFAULT_CAPTION_STYLE;
  } catch {
    return DEFAULT_CAPTION_STYLE;
  }
};

/**
 * Remembers a viewer's caption preferences on this device, since how captions should look is a
 * property of the room and the screen rather than of the account.
 *
 * @param style - The preferences to remember.
 */
const saveCaptionStyle = (style: CaptionStyle): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(style));
  } catch {}
};

export type { CaptionStyle };

export {
  DEFAULT_CAPTION_STYLE,
  toCueCss,
  toCueDeclarations,
  withOpacity,
  readCaptionStyle,
  saveCaptionStyle,
};
