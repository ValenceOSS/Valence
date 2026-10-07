import {
  Cursor as CursorIcon,
  CursorClick as CursorClickIcon,
  HandClosed as HandClosedIcon,
  HandOpen as HandOpenIcon,
} from '@keyline-icons/react/fill';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { POINTER_LOOK } from '@ValenceLanding/components/SiteCursor/POINTER_LOOK';
import type { SceneCursorProps } from './SceneCursor.types';

const PRESS_FRAMES = 7;

/**
 * The pointer a scene is acted out with, gliding from stop to stop the way a hand moves a mouse —
 * easing away from where it rests and into where it is going — and pressing where a stop says so.
 * Its stops are frames and places across the scene, as shares of its width and height, and a press
 * can be held until a later frame, for something dragged.
 *
 * @param path - Where it is at which frame, and where it presses.
 * @param look - An arrow for pressing things, or a hand that closes on what it drags.
 */
const SceneCursor = ({ path, look = 'pointer' }: SceneCursorProps) => {
  const frame = useCurrentFrame();
  const frames = path.map((stop) => stop.at);
  const easing = Easing.inOut((at) => Easing.cubic(at));
  const x = interpolate(
    frame,
    frames,
    path.map((stop) => stop.x),
    {
      easing,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
  const y = interpolate(
    frame,
    frames,
    path.map((stop) => stop.y),
    {
      easing,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );
  const isPressing = path.some(
    (stop) =>
      stop.isPressing === true &&
      frame >= stop.at &&
      frame < (stop.holdsUntil ?? stop.at + PRESS_FRAMES),
  );

  return (
    <span
      className={cn('pointer-events-none absolute z-20', POINTER_LOOK)}
      style={{
        left: `${x.toString()}%`,
        top: `${y.toString()}%`,
        transform:
          look === 'drag'
            ? `translate(-50%, -50%) scale(${isPressing ? '0.92' : '1'})`
            : `scale(${isPressing ? '0.88' : '1'})`,
        transformOrigin: look === 'drag' ? 'center' : 'top left',
      }}
    >
      <Icon
        of={
          look === 'drag'
            ? isPressing
              ? HandClosedIcon
              : HandOpenIcon
            : isPressing
              ? CursorClickIcon
              : CursorIcon
        }
        size={20}
      />
    </span>
  );
};

SceneCursor.displayName = 'SceneCursor';

export { SceneCursor };
