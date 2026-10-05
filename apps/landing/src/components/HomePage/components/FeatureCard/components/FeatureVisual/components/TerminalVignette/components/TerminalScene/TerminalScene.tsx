import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { TerminalPicture } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/TerminalVignette/components/TerminalPicture/TerminalPicture';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';

const ACTS_AT = 48;

const LETS_GO_AT = 166;

/**
 * The picture acted out as lets the server finish coming up, a pointer following along and that points at what arrives as it arrives, then letting it settle back to where it began, so it
 * goes round without a seam.
 */
const TerminalScene = () => {
  const frame = useCurrentFrame();
  const isActed = frame >= ACTS_AT && frame < LETS_GO_AT;

  return (
    <AbsoluteFill className="items-center justify-center">
      <div className="flex w-full justify-center" {...(isActed ? { 'data-acted': '' } : {})}>
        <TerminalPicture />
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 70, y: 90 },
          { at: ACTS_AT, x: 70, y: 90 },
          { at: ACTS_AT + 34, x: 50, y: 78 },
          { at: LETS_GO_AT - 20, x: 50, y: 78 },
          { at: 219, x: 70, y: 90 },
        ]}
      />
    </AbsoluteFill>
  );
};

TerminalScene.displayName = 'TerminalScene';

export { TerminalScene };
