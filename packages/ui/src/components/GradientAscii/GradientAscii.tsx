import { useEffect, useRef } from 'react';
import { useReducedMotionConfig } from 'motion/react';
import { cn } from '@ValenceUI/cn';
import { AURORA } from '@ValenceUI/tokens/AURORA';
import { startGradientAscii } from './startGradientAscii';
import type { GradientAsciiLook, GradientAsciiProps } from './GradientAscii.types';

const MONOSPACE = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/**
 * A gradient written out in characters, glowing over the colour itself, after React Bits'
 * Gradient ASCII: a field of light in one of a few shapes, each cell of it a glyph picked by how
 * bright the light is there. The glyphs scramble under the pointer and a ring runs out from a
 * click. It fills whatever holds it, draws only while on screen and holds still for whoever asked
 * for stillness; where the browser has no WebGL 2, or the page is drawn without a graphics card,
 * which the page marks on its root, it draws nothing.
 *
 * @param colours - The stops the light blends through, in Valence's blues unless given others.
 * @param shape - Where the light sits: an arch along the foot, a pinched band, a rising glow or a ring.
 * @param characters - The glyphs, darkest first.
 * @param cellSize - How tall each glyph is, in CSS pixels.
 * @param density - How many cells carry a glyph, from none to all.
 * @param glyphOpacity - How strongly the glyphs show.
 * @param glow - How much the glyphs bloom.
 * @param flicker - How restlessly the glyphs change.
 * @param softness - How soft the light's edge is.
 * @param flow - How much the light wanders.
 * @param speed - How fast it all moves.
 * @param gradientOpacity - How strongly the light shows behind the glyphs.
 * @param grain - How much film grain sits over it.
 * @param fontFamily - What the glyphs are drawn in.
 * @param isInteractive - Whether the pointer scrambles the glyphs and a click sends out a ring.
 * @param className - Extra classes for where the caller places it.
 */
const GradientAscii = ({
  colours = AURORA.ascii,
  shape = 'horizon',
  characters = ' =+xX0S8#@',
  cellSize = 18,
  density = 0.8,
  glyphOpacity = 0.85,
  glow = 0.2,
  flicker = 0.2,
  softness = 0.5,
  flow = 0.5,
  speed = 1,
  gradientOpacity = 0.9,
  grain = 0.08,
  fontFamily = MONOSPACE,
  isInteractive = true,
  className,
}: GradientAsciiProps) => {
  const isStill = useReducedMotionConfig() === true;
  const holder = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLCanvasElement>(null);
  const wake = useRef<(() => void) | null>(null);
  const look = useRef<GradientAsciiLook | null>(null);

  useEffect(() => {
    look.current = {
      colours,
      shape,
      characters,
      cellSize,
      density,
      glyphOpacity,
      glow,
      flicker,
      softness,
      flow,
      speed,
      gradientOpacity,
      grain,
      fontFamily,
      isStill,
      isInteractive,
    };
    wake.current?.();
  });

  useEffect(() => {
    const container = holder.current;
    const canvas = surface.current;
    const first = look.current;
    const isDrawnInSoftware = document.documentElement.dataset.graphics === 'software';

    if (container === null || canvas === null || first === null || isDrawnInSoftware) {
      return undefined;
    }

    const running = startGradientAscii(container, canvas, () => look.current ?? first);

    wake.current = running?.wake ?? null;

    return () => {
      wake.current = null;
      running?.stop();
    };
  }, []);

  return (
    <div
      ref={holder}
      aria-hidden
      className={cn('relative h-full w-full overflow-hidden', className)}
    >
      <canvas ref={surface} className="absolute inset-0 block h-full w-full" />
    </div>
  );
};

GradientAscii.displayName = 'GradientAscii';

export { GradientAscii };
