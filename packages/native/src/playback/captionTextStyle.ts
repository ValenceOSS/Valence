import { Platform } from 'react-native';
import { withOpacity } from '@ValenceClient/playback/captionStyle';
import type { CaptionStyle } from '@ValenceClient/playback/captionStyle';
import { say } from '@ValenceI18n/say';

type CaptionTextStyle = {
  fontFamily?: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  textShadowColor?: string;
  textShadowOffset?: { width: number; height: number };
  textShadowRadius?: number;
};

type CaptionEdge = Pick<
  CaptionTextStyle,
  'textShadowColor' | 'textShadowOffset' | 'textShadowRadius'
>;

const OUTLINE_REACH = 1.5;

/**
 * The family a caption font is drawn in on this device, or the system's own for the plain one.
 *
 * Apple's devices and Android name their families differently, and a family a device does not have
 * falls back to the system's, so an unfamiliar one costs a look rather than a line.
 *
 * @param font - The font as configured.
 * @returns The family to ask for, or nothing for the system's own.
 */
const familyOf = (font: CaptionStyle['fontFamily']): string | undefined => {
  const isApple = Platform.OS === 'ios';

  switch (font) {
    case 'sans':
      return undefined;
    case 'serif':
      return isApple ? say('native.captionTextStyle.georgia') : 'serif';
    case 'mono':
      return isApple ? say('native.captionTextStyle.menlo') : 'monospace';
    case 'casual':
      return isApple ? say('native.captionTextStyle.chalkboardSE') : 'casual';
  }
};

/**
 * The shadow that stands for a caption's edge. React Native draws one shadow and no outline, so an
 * outline is a tight shadow all the way round, thicker with each step, and a raised edge is one
 * dropped down and to the right without blur.
 *
 * @param style - The style as configured.
 * @returns The shadow, or none.
 */
const edgeOf = (style: CaptionStyle): CaptionEdge => {
  const ink = withOpacity('#000000', 0.9 * style.opacity);

  switch (style.edgeStyle) {
    case 'none':
      return {};
    case 'outline':
      return {
        textShadowColor: ink,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: style.outlineThickness * OUTLINE_REACH,
      };
    case 'shadow':
      return {
        textShadowColor: ink,
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
      };
    case 'raised':
      return {
        textShadowColor: ink,
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 0,
      };
  }
};

/**
 * Turns how somebody likes captions drawn into the text style that draws them on a phone or a
 * television, at the size that client draws captions at by default.
 *
 * @param style - The style as configured.
 * @param fontSize - The client's own caption size, which the chosen scale is taken from.
 * @returns The text style.
 */
const captionTextStyle = (style: CaptionStyle, fontSize: number): CaptionTextStyle => {
  const fontFamily = familyOf(style.fontFamily);

  return {
    ...(fontFamily === undefined ? {} : { fontFamily }),
    fontSize: (fontSize * style.fontScale) / 100,
    color: withOpacity(style.color, style.opacity),
    backgroundColor: withOpacity(style.backgroundColor, style.backgroundOpacity),
    ...edgeOf(style),
  };
};

export type { CaptionTextStyle };

export { captionTextStyle };
