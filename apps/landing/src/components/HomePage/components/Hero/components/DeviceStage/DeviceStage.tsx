import { useRef } from 'react';
import { motion, useReducedMotionConfig, useScroll, useTransform } from 'motion/react';
import { DeviceFrame } from '@ValenceLanding/components/HomePage/components/Hero/components/DeviceFrame/DeviceFrame';

/**
 * The web app itself, large and centred, tipped back away from the reader as though propped on a
 * table, and laying itself flat to face them as the page is scrolled, so the first scroll turns the
 * picture into the thing. Whoever asked for stillness sees it flat already.
 */
const DeviceStage = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const isStill = useReducedMotionConfig() === true;
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start end', 'center center'],
  });

  const tip = useTransform(scrollYProgress, [0.25, 1], isStill ? [0, 0] : [32, 0]);
  const scale = useTransform(scrollYProgress, [0.25, 1], isStill ? [1, 1] : [0.86, 1]);
  const rise = useTransform(scrollYProgress, [0.25, 1], isStill ? ['0%', '0%'] : ['-22%', '0%']);

  return (
    <div ref={stageRef} className="relative mx-auto w-full max-w-6xl [perspective:1800px]">
      <motion.div style={{ rotateX: tip, scale, y: rise }} className="origin-bottom">
        <DeviceFrame
          shape="browser"
          src="/devices/web.jpg"
          alt="The Valence web app's home page, with a film in the featured row"
          className="ring-on-scrim/15"
        />
      </motion.div>
    </div>
  );
};

DeviceStage.displayName = 'DeviceStage';

export { DeviceStage };
