import { useState } from 'react';
import { useReducedMotionConfig } from 'motion/react';
import { FoldGradient } from '@ValenceUI/FoldGradient';
import { AURORA } from '@ValenceUI/tokens/AURORA';

/**
 * The slow ribbons of blue light behind a page's opening card, darkening towards its edges so the
 * words over it stay easy to read. It fills whatever it is put in and sits behind everything else
 * there; whoever asked for stillness sees the light hold still, and a page drawn without a graphics
 * card, which the page marks on its root, gets the darkened edges alone rather than a shader.
 */
const AuroraBackdrop = () => {
  const isStill = useReducedMotionConfig() === true;
  const [isDrawnInSoftware] = useState(
    () =>
      typeof document !== 'undefined' && document.documentElement.dataset.graphics === 'software',
  );

  return (
    <>
      {isDrawnInSoftware ? null : (
        <FoldGradient
          colors={[...AURORA.colours]}
          bgColor={AURORA.back}
          shadowColor={AURORA.shadow}
          softness={0.9}
          saturation={1.1}
          rotation={52}
          zoom={7}
          ribbon={0.17}
          ribbonWidth={1}
          className="absolute inset-0 -z-10 h-full w-full opacity-80"
          speed={isStill ? 0 : 1.5}
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,transparent_30%,var(--color-aurora)_85%)]"
      />
    </>
  );
};

AuroraBackdrop.displayName = 'AuroraBackdrop';

export { AuroraBackdrop };
