import { CAPTION_COLOURS } from '@ValenceCore/tokens/CAPTION_COLOURS';
import type { CaptionStyle } from '@ValenceClient/playback/captionStyle';
import { say } from '@ValenceI18n/say';
import { CAPTION_FONTS } from '@ValenceClient/playback/CAPTION_FONTS';
import { CAPTION_WEIGHTS } from '@ValenceClient/playback/CAPTION_WEIGHTS';
import { nameCaptionFont } from '@ValenceClient/playback/nameCaptionFont';
import { nameCaptionWeight } from '@ValenceClient/playback/nameCaptionWeight';

type CaptionChoiceSet = {
  id: 'size' | 'font' | 'weight' | 'colour' | 'background' | 'backgroundOpacity' | 'edge';
  heading: string;
  chosen: string;
  choices: readonly { id: string; label: string }[];
  choose: (id: string) => CaptionStyle;
};

const SIZES = [50, 75, 100, 125, 150, 200, 250, 300, 400, 500] as const;

const SEE_THROUGH = [0, 0.25, 0.5, 0.75, 1] as const;

const EDGES = ['none', 'outline', 'shadow', 'raised'] as const;

const EDGE_NAMES = {
  none: () => say('common.none'),
  outline: () => say('common.outline'),
  shadow: () => say('common.shadow'),
  raised: () => say('common.raised'),
} as const;

/**
 * Writes a percentage, as the choices name sizes and how solid a background is.
 *
 * @param value - The percentage, as a whole number.
 */
const percent = (value: number): string => say('common.percent', { value: value.toString() });

/**
 * How captions can be made to look on a client that offers a set of answers rather than sliders and
 * swatches — a phone's sheet, or a television's panel worked with a remote — each set saying what is
 * chosen now and what choosing another does to the whole style. The answers are steps of the same
 * settings the browser offers, so a style made in one reads the same in the others.
 *
 * @param style - How captions are drawn now.
 * @returns The sets, in the order they are offered.
 */
const captionChoices = (style: CaptionStyle): CaptionChoiceSet[] => [
  {
    id: 'size',
    heading: say('common.size'),
    chosen: style.fontScale.toString(),
    choices: [...new Set([...SIZES, style.fontScale])]
      .sort((one, other) => one - other)
      .map((size) => ({ id: size.toString(), label: percent(size) })),
    choose: (id) => ({ ...style, fontScale: Number(id) }),
  },
  {
    id: 'font',
    heading: say('common.font'),
    chosen: style.fontFamily,
    choices: CAPTION_FONTS.map((font) => ({ id: font, label: nameCaptionFont(font) })),
    choose: (id) => ({
      ...style,
      fontFamily: CAPTION_FONTS.find((font) => font === id) ?? style.fontFamily,
    }),
  },
  {
    id: 'weight',
    heading: say('common.weight'),
    chosen: style.fontWeight,
    choices: CAPTION_WEIGHTS.map((weight) => ({ id: weight, label: nameCaptionWeight(weight) })),
    choose: (id) => ({
      ...style,
      fontWeight: CAPTION_WEIGHTS.find((weight) => weight === id) ?? style.fontWeight,
    }),
  },
  {
    id: 'colour',
    heading: say('common.textColour'),
    chosen: style.color,
    choices: CAPTION_COLOURS.map((colour) => ({ id: colour.id, label: colour.label })),
    choose: (id) => ({ ...style, color: id }),
  },
  {
    id: 'background',
    heading: say('common.background'),
    chosen: style.backgroundColor,
    choices: CAPTION_COLOURS.map((colour) => ({ id: colour.id, label: colour.label })),
    choose: (id) => ({ ...style, backgroundColor: id }),
  },
  {
    id: 'backgroundOpacity',
    heading: say('common.backgroundOpacity'),
    chosen: style.backgroundOpacity.toString(),
    choices: SEE_THROUGH.map((opacity) => ({
      id: opacity.toString(),
      label: percent(opacity * 100),
    })),
    choose: (id) => ({ ...style, backgroundOpacity: Number(id) }),
  },
  {
    id: 'edge',
    heading: say('common.edge'),
    chosen: style.edgeStyle,
    choices: EDGES.map((edge) => ({ id: edge, label: EDGE_NAMES[edge]() })),
    choose: (id) => ({
      ...style,
      edgeStyle: EDGES.find((edge) => edge === id) ?? style.edgeStyle,
    }),
  },
];

export type { CaptionChoiceSet };

export { captionChoices };
