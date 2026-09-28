import { useRef } from 'react';
import { motion, useReducedMotionConfig, useScroll, useTransform } from 'motion/react';
import { DeviceFrame } from '@ValenceLanding/components/HomePage/components/Hero/components/DeviceFrame/DeviceFrame';

/**
 * The web app itself, large and turned slightly away towards the right of the page, running off
 * its edge and fading into it at the foot. Scrolling turns it to face the reader; whoever asked for
 * stillness sees it at rest.
 */
const DeviceStage = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotionConfig();
  const isStill = prefersReducedMotion === true;
  const { scrollYProgress } = useScroll({ target: stageRef, offset: ['start end', 'end start'] });

  const tilt = useTransform(scrollYProgress, [0.2, 0.6], isStill ? [0, 0] : [6, 0]);
  const turn = useTransform(scrollYProgress, [0.2, 0.6], isStill ? [0, 0] : [-12, -4]);

  return (
    <div ref={stageRef} className="relative w-full [perspective:2000px]">
      <motion.div
        style={{ rotateX: tilt, rotateY: turn }}
        className="origin-left [mask-image:linear-gradient(to_bottom,black_70%,transparent),linear-gradient(to_right,black_80%,transparent)] [mask-composite:intersect]"
      >
        <DeviceFrame
          shape="browser"
          src="/devices/web.jpg"
          alt="The Valence web app's home page, with a film in the featured row"
        />
      </motion.div>
    </div>
  );
};

DeviceStage.displayName = 'DeviceStage';

export { DeviceStage };
