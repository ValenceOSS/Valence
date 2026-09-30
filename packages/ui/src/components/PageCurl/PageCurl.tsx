import { useLayoutEffect, useRef } from 'react';
import { useMotionValueEvent } from 'motion/react';
import { applyMatrix } from '@ValenceCore/functions/applyMatrix';
import { clampCurl } from '@ValenceCore/functions/clampCurl';
import { composeMatrices } from '@ValenceCore/functions/composeMatrices';
import { mirrorAcrossSpine } from '@ValenceCore/functions/mirrorAcrossSpine';
import { pageCurlOf } from '@ValenceCore/functions/pageCurlOf';
import type { CurlFold, CurlMatrix, CurlPoint } from '@ValenceCore/functions/pageCurl.types';
import type { PageCurlProps } from './PageCurl.types';
import { say } from '@ValenceI18n/say';

const SHADE_DEPTH = 0.16;

const NOWHERE = 'polygon(0 0, 0 0, 0 0)';

/**
 * Writes a shape as a CSS clip path.
 *
 * @param points - Its corners, in order.
 * @returns The clip path.
 */
const clipOf = (points: readonly CurlPoint[]): string =>
  points.length < 3
    ? NOWHERE
    : `polygon(${points.map((point) => say('ui.pageCurl.xPxYPx', { x: point.x.toString(), y: point.y.toString() })).join(', ')})`;

/**
 * Writes an affine matrix as a CSS transform.
 *
 * @param matrix - The matrix.
 * @returns The transform.
 */
const cssOf = (matrix: CurlMatrix): string => `matrix(${matrix.join(', ')})`;

/**
 * Lays a long strip along a crease, reaching from it towards the flap, so a gradient drawn down the
 * strip darkens from the crease outwards.
 *
 * @param fold - The crease.
 * @param length - How long the strip is, which is enough to run the crease's whole length.
 * @returns The transform that puts it there.
 */
const stripAlong = (fold: CurlFold, length: number): string => {
  const { at, normal } = fold;
  const along = { x: -normal.y, y: normal.x };

  return cssOf([
    along.x,
    along.y,
    -normal.x,
    -normal.y,
    at.x - (along.x * length) / 2,
    at.y - (along.y * length) / 2,
  ]);
};

/**
 * A page lifted by a corner and carried over, drawn as UIKit's page curl draws it: the page stays
 * bound along its spine and folds where the corner has been taken, the part of it still lying flat
 * cut along the crease, the flap's back laid over it mirrored across the crease and lit pale with a
 * shadow gathering at the fold, and whatever lies beneath showing where the flap came away, darkened
 * along the crease. Nothing of it is drawn beyond the page — or, for a pair, beyond the page it turns
 * onto — so a single page's back goes out of sight over its spine as the phone's does. All of the shape is worked out by `pageCurlOf` from where the corner is, so it
 * follows a hand wherever it goes and any other client can draw the same curl.
 *
 * It paints on every movement of the corner without drawing again through React, since a curl
 * follows a pointer many times a second.
 *
 * @param leaf - The page that turns, where it lies and which side it is bound on.
 * @param corner - The corner that lifted, where it started.
 * @param x - Where the corner is now, across.
 * @param y - Where the corner is now, down.
 * @param under - What lies beneath the page.
 * @param rest - What lies flat beside it and does not turn, such as the other page of a pair.
 * @param front - The page itself, laid out where it lies.
 * @param back - What its back shows, laid out where that lies once the page is over.
 * @param isBackFacing - Whether the back shows the page facing it, as the leaf of a pair does, rather
 *   than the page's own reverse seen through the paper.
 */
const PageCurl = ({
  leaf,
  corner,
  x,
  y,
  under,
  rest,
  front,
  back,
  isBackFacing,
}: PageCurlProps) => {
  const frontRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<HTMLDivElement | null>(null);
  const shadowStripRef = useRef<HTMLDivElement | null>(null);
  const liftRef = useRef<HTMLDivElement | null>(null);
  const backRef = useRef<HTMLDivElement | null>(null);
  const backStripRef = useRef<HTMLDivElement | null>(null);
  const spine = mirrorAcrossSpine(leaf);
  const facing = applyMatrix(spine, { x: leaf.x, y: leaf.y });
  const left = isBackFacing ? Math.min(leaf.x, facing.x - leaf.width) : leaf.x;
  const bounds = clipOf([
    { x: left, y: leaf.y },
    { x: left + (isBackFacing ? 2 : 1) * leaf.width, y: leaf.y },
    { x: left + (isBackFacing ? 2 : 1) * leaf.width, y: leaf.y + leaf.height },
    { x: left, y: leaf.y + leaf.height },
  ]);
  const reach = 2 * Math.hypot(leaf.width, leaf.height) + leaf.width;
  const depth = Math.max(leaf.width * SHADE_DEPTH, 24);

  const paint = () => {
    const held = clampCurl(leaf, corner, { x: x.get(), y: y.get() });
    const curl = pageCurlOf(leaf, corner, held);
    const shown = frontRef.current;
    const shadow = shadowRef.current;
    const shadowStrip = shadowStripRef.current;
    const lift = liftRef.current;
    const reverse = backRef.current;
    const backStrip = backStripRef.current;

    if (
      shown === null ||
      shadow === null ||
      shadowStrip === null ||
      lift === null ||
      reverse === null ||
      backStrip === null
    ) {
      return;
    }

    if (curl === null) {
      shown.style.clipPath = 'none';
      shadow.style.visibility = 'hidden';
      lift.style.visibility = 'hidden';

      return;
    }

    const toBack = isBackFacing ? composeMatrices(curl.reflect, spine) : curl.reflect;
    const backFold = isBackFacing
      ? {
          at: applyMatrix(spine, curl.fold.at),
          normal: { x: -curl.fold.normal.x, y: curl.fold.normal.y },
        }
      : curl.fold;

    shown.style.clipPath = clipOf(curl.front);
    shadow.style.visibility = 'visible';
    shadow.style.clipPath = clipOf(curl.flap);
    shadowStrip.style.transform = stripAlong(curl.fold, reach);
    lift.style.visibility = 'visible';
    reverse.style.transform = cssOf(toBack);
    reverse.style.clipPath = clipOf(
      isBackFacing ? curl.flap.map((point) => applyMatrix(spine, point)) : curl.flap,
    );
    backStrip.style.transform = stripAlong(backFold, reach);
  };

  useLayoutEffect(paint);
  useMotionValueEvent(x, 'change', paint);
  useMotionValueEvent(y, 'change', paint);

  const strip = {
    width: `${reach.toString()}px`,
    height: `${depth.toString()}px`,
  };

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0">{under}</div>

      {rest === undefined ? null : <div className="absolute inset-0">{rest}</div>}

      <div ref={shadowRef} className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          ref={shadowStripRef}
          className="absolute left-0 top-0 origin-top-left bg-linear-to-b from-shade/45 via-shade/10 to-transparent"
          style={strip}
        />
      </div>

      <div ref={frontRef} className="absolute inset-0">
        {front}
      </div>

      <div
        ref={liftRef}
        className="pointer-events-none absolute inset-0"
        style={{ clipPath: bounds }}
      >
        <div className="absolute inset-0 drop-shadow-[0_0_14px_var(--color-scrim)]">
          <div ref={backRef} className="absolute inset-0 origin-top-left">
            {back}
            {isBackFacing ? null : <div className="absolute inset-0 bg-plate/80" />}
            <div
              ref={backStripRef}
              className="absolute left-0 top-0 origin-top-left bg-linear-to-b from-shade/30 via-shade/5 to-transparent"
              style={strip}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

PageCurl.displayName = 'PageCurl';

export { PageCurl };
