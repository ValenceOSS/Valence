import { withOpacity } from '@ValenceClient/playback/captionStyle';
import type { CaptionStyle } from '@ValenceClient/playback/captionStyle';
import { say } from '@ValenceI18n/say';

const FONT_FAMILIES = {
  sans: 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  serif: say('common.georgiaTimesNewRomanSerif'),
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  casual: say('screens.playback.captionStyle.comicSansMSChalkboardSECursive'),
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

export { toCueCss, toCueDeclarations };
