import { useEffect, useRef } from 'react';
import { cn } from '@ValenceUI/cn';
import { drawScene } from '@ValenceScreens/library/sketch/drawScene';
import type { SketchPictureProps } from './SketchPicture.types';

/**
 * A sketch somebody drew, drawn afresh at whatever size it is shown, so a face made of strokes is
 * as sharp in the corner of the bar as it is large.
 *
 * @param scene - The sketch.
 * @param className - Extra classes for the caller's own layout.
 */
const SketchPicture = ({ scene, className }: SketchPictureProps) => {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const target = canvas.current;
    const paint = target?.getContext('2d');

    if (target === null || paint === null || paint === undefined) {
      return;
    }

    const across = Math.max(
      Math.round(target.clientWidth * Math.min(window.devicePixelRatio, 2)),
      1,
    );

    target.width = across;
    target.height = across;
    drawScene(paint, scene, across);
  }, [scene]);

  return <canvas ref={canvas} aria-hidden className={cn('block aspect-square', className)} />;
};

SketchPicture.displayName = 'SketchPicture';

export { SketchPicture };
