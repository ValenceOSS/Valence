import { z } from 'zod';
import { platformInUse } from '@ValenceClient/platform/installPlatform';

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

const CAPTION_STYLE_KEY = 'valence.captionStyle';

const DEFAULT_CAPTION_STYLE: CaptionStyle = CaptionStyleSchema.parse({});

/**
 * Turns a hex colour and an opacity into one colour with its alpha, since captions are configured
 * as a colour and a separate opacity but drawn as one value, by a browser and by a phone alike.
 *
 * @param color - The colour as configured.
 * @param opacity - How opaque it should be, from nothing to one.
 * @returns The colour, as `rgba(…)`, or the colour as given where it is not a hex colour.
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

/**
 * Reads how this viewer likes captions drawn. Held on the device rather than on the profile, since
 * legibility depends on the screen and the room it is in.
 */
const readCaptionStyle = (): CaptionStyle => {
  const stored = platformInUse().store.read(CAPTION_STYLE_KEY);

  if (stored === null) {
    return DEFAULT_CAPTION_STYLE;
  }

  try {
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
  platformInUse().store.write(CAPTION_STYLE_KEY, JSON.stringify(style));
};

export type { CaptionStyle };

export {
  CAPTION_STYLE_KEY,
  CaptionStyleSchema,
  DEFAULT_CAPTION_STYLE,
  readCaptionStyle,
  saveCaptionStyle,
  withOpacity,
};
