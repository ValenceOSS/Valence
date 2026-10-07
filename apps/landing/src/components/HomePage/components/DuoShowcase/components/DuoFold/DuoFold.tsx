import { useState } from 'react';
import { motion, useMotionValueEvent, useTransform } from 'motion/react';
import { DuoFrame } from '@ValenceLanding/components/HomePage/components/DuoShowcase/components/DuoFrame/DuoFrame';
import { OpenHalf } from './components/OpenHalf/OpenHalf';
import type { DuoFoldProps } from './DuoFold.types';

const FLAT = 0.999;

const percent = (part: number, whole: number): string => `${((part / whole) * 100).toString()}%`;

/**
 * The iPhone Duo folding shut and opening out again, in three dimensions, as far as it is told. Laid
 * flat it shows whatever it is given, the film playing on it; the moment it starts to close, it is
 * cut at the hinge into two halves showing a still of that screen, and the left half turns over on
 * the hinge onto the right. The back of the turning half is the folded Duo, its outer screen showing
 * the same book, sized so its body matches the open one's height with its hinge on the fold — so
 * when it lands, the folded phone is simply there. The whole thing slides across as it closes so
 * the folded phone ends up centred where the open one was.
 *
 * @param open - The opened Duo's picture, where its screen sits and where its body is.
 * @param folded - The folded Duo's, the same.
 * @param foldedScreen - What the folded Duo's outer screen shows.
 * @param still - What the open halves show while it moves.
 * @param openness - How open it is, from shut at 0 to flat at 1.
 * @param children - What it shows while flat.
 */
const DuoFold = ({ open, folded, foldedScreen, still, openness, children }: DuoFoldProps) => {
  const [isFlat, setIsFlat] = useState(() => openness.get() >= FLAT);

  useMotionValueEvent(openness, 'change', (value) => {
    setIsFlat(value >= FLAT);
  });

  const scale = open.body.height / folded.body.height;
  const half = open.width / 2;
  const openCentre = open.body.left + open.body.width / 2;
  const foldedCentre = half + (folded.body.width * scale) / 2;
  const foldedWidthOnOpen = folded.width * scale;
  const shift = useTransform(
    openness,
    [0, 1],
    [percent(openCentre - foldedCentre, open.width), '0%'],
  );
  const turn = useTransform(openness, [0, 1], [180, 0]);
  const restOfOpen = useTransform(openness, [0, 0.12], [0, 1]);
  const frontLight = useTransform(
    openness,
    [0, 0.5, 1],
    ['brightness(0.4)', 'brightness(0.75)', 'brightness(1)'],
  );
  const backLight = useTransform(openness, [0, 0.5], ['brightness(1)', 'brightness(0.4)']);

  return (
    <motion.div
      style={{ aspectRatio: `${open.width.toString()} / ${open.height.toString()}`, x: shift }}
      className="relative w-full [perspective:2600px]"
    >
      {isFlat ? (
        <DuoFrame
          frame={open.frame}
          width={open.width}
          height={open.height}
          screen={open.screen}
          className="absolute inset-0 w-full"
        >
          {children}
        </DuoFrame>
      ) : (
        <>
          <motion.div style={{ opacity: restOfOpen }} className="absolute inset-y-0 left-1/2 w-1/2">
            <OpenHalf side="right" open={open} still={still} />
          </motion.div>

          <motion.div
            style={{ rotateY: turn }}
            className="absolute inset-y-0 left-0 w-1/2 origin-right [transform-style:preserve-3d]"
          >
            <motion.div
              style={{ filter: frontLight }}
              className="absolute inset-0 [backface-visibility:hidden]"
            >
              <OpenHalf side="left" open={open} still={still} />
            </motion.div>

            <motion.div
              style={{ filter: backLight }}
              className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]"
            >
              <div
                className="absolute"
                style={{
                  left: percent(-folded.body.left * scale, half),
                  top: percent(open.body.top - folded.body.top * scale, open.height),
                  width: percent(foldedWidthOnOpen, half),
                }}
              >
                <DuoFrame
                  frame={folded.frame}
                  width={folded.width}
                  height={folded.height}
                  screen={folded.screen}
                  className="w-full"
                >
                  <img
                    src={foldedScreen}
                    alt=""
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                </DuoFrame>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

DuoFold.displayName = 'DuoFold';

export { DuoFold };
