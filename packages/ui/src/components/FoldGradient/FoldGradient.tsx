import { useMemo } from 'react';
import { ShaderMount } from '@paper-design/shaders-react';
import { cn } from '@ValenceUI/cn';
import {
  DEFAULT_FOLD_GRADIENT_BACKGROUND,
  DEFAULT_FOLD_GRADIENT_COLORS,
  DEFAULT_FOLD_GRADIENT_SHADOW,
  fragmentShader,
} from './foldGradientShader';
import type { FoldGradientProps } from './FoldGradient.types';

const toLinear = (channel: number): number => channel ** 2.2;

const hexToLinearChannel = (hex: string, offset: number): number =>
  toLinear(parseInt(hex.slice(offset, offset + 2), 16) / 255);

const hexToLinearRgba = (hex: string): [number, number, number, number] => [
  hexToLinearChannel(hex, 1),
  hexToLinearChannel(hex, 3),
  hexToLinearChannel(hex, 5),
  1,
];

const hexToLinearRgb = (hex: string): [number, number, number] => {
  const [r, g, b] = hexToLinearRgba(hex);

  return [r, g, b];
};

/**
 * Domain-warped sheets of light drifting behind whatever sits in front of them, built on Paper's
 * shader runtime rather than a static image or video, so a hero can move without shipping either.
 *
 * @param colors - Up to five stops, darkest to hottest; the brightest sheet edges reach the last one.
 * @param bgColor - The colour of the gaps between sheets.
 * @param shadowColor - The tint that bleeds into the shadowed edges.
 * @param softness - How soft and long the smear along each sheet is.
 * @param saturation - How much colour survives the grade; zero is monochrome.
 * @param rotation - The angle the sheets drape at, in degrees.
 * @param zoom - How large the sheets read on screen; higher is bigger.
 * @param ribbon - How much the flow is cut into discrete strips, from none to fully.
 * @param ribbonWidth - How wide those strips are, where any are cut.
 * @param speed - How fast the sheets drift; zero holds them still.
 * @param className - Extra classes for the caller's own layout.
 */
const FoldGradient = ({
  colors = DEFAULT_FOLD_GRADIENT_COLORS,
  bgColor = DEFAULT_FOLD_GRADIENT_BACKGROUND,
  shadowColor = DEFAULT_FOLD_GRADIENT_SHADOW,
  softness = 1,
  saturation = 1,
  rotation = 52,
  zoom = 9,
  ribbon = 0,
  ribbonWidth = 1,
  speed = 1,
  className,
}: FoldGradientProps) => {
  const uniforms = useMemo(
    () => ({
      u_colors: colors.map(hexToLinearRgba),
      u_ncols: colors.length,
      u_back: hexToLinearRgb(bgColor),
      u_shadow: hexToLinearRgb(shadowColor),
      u_softness: softness,
      u_saturation: saturation,
      u_noise: 0,
      u_rotation: rotation,
      u_folds: zoom,
      u_ribbon: ribbon,
      u_ribbonWidth: ribbonWidth,
    }),
    [colors, bgColor, shadowColor, softness, saturation, rotation, zoom, ribbon, ribbonWidth],
  );

  return (
    <ShaderMount
      fragmentShader={fragmentShader}
      uniforms={uniforms}
      speed={speed}
      maxPixelCount={1600 * 900}
      minPixelRatio={1}
      className={cn('block h-full w-full', className)}
    />
  );
};

FoldGradient.displayName = 'FoldGradient';

export { FoldGradient };
