import { useRef } from 'react';
import { motion, useReducedMotionConfig, useScroll, useTransform } from 'motion/react';
import { PhoneFrame } from '@ValenceLanding/components/HomePage/components/PhoneFan/components/PhoneFrame/PhoneFrame';
import { DeviceFrame } from '@ValenceLanding/components/HomePage/components/Hero/components/DeviceFrame/DeviceFrame';

/**
 * The web app itself, large and centred, tipped back away from the reader as though propped on a
 * table with a phone stood at either corner, and all of it laying itself flat to face them as the
 * page is scrolled, so the first scroll turns the picture into the thing. Whoever asked for
 * stillness sees it flat already.
 */
const DeviceStage = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const isStill = useReducedMotionConfig() === true;
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start end', 'center center'],
  });

  const tip = useTransform(scrollYProgress, [0.12, 0.6], isStill ? [0, 0] : [32, 0]);
  const scale = useTransform(scrollYProgress, [0.12, 0.6], isStill ? [1, 1] : [0.86, 1]);
  const rise = useTransform(scrollYProgress, [0.12, 0.6], isStill ? ['0%', '0%'] : ['-22%', '0%']);

  return (
    <div ref={stageRef} className="relative mx-auto w-full max-w-6xl [perspective:1800px]">
      <motion.div style={{ rotateX: tip, scale, y: rise }} className="relative origin-bottom">
        <PhoneFrame
          label="Now playing"
          finish="silver"
          className="absolute -bottom-[3%] -left-[9%] z-10 hidden w-[15%] -rotate-6 lg:block"
        />
        <PhoneFrame
          label="Your library"
          finish="blue"
          className="absolute -bottom-[3%] -right-[9%] z-10 hidden w-[15%] rotate-6 lg:block"
        />
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
