import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { TerminalPicture } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/TerminalVignette/components/TerminalPicture/TerminalPicture';

const ACTS_AT = 48;

const LETS_GO_AT = 166;

/**
 * The picture acted out as the server finishes coming up, each line arriving in turn, then settling
 * back to where it began, so it goes round without a seam.
 */
const TerminalScene = () => {
  const frame = useCurrentFrame();
  const isActed = frame >= ACTS_AT && frame < LETS_GO_AT;

  return (
    <AbsoluteFill>
      <div className="absolute left-6 top-6" {...(isActed ? { 'data-acted': '' } : {})}>
        <TerminalPicture />
      </div>
    </AbsoluteFill>
  );
};

TerminalScene.displayName = 'TerminalScene';

export { TerminalScene };
