import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { SetupPicture } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SetupVignette/components/SetupPicture/SetupPicture';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';

const ACTS_AT = 50;

const LETS_GO_AT = 168;

/**
 * The picture acted out by a pointer that ticks off the step the setup wizard is on and opens the next, then lets it settle back to where it began, so it
 * goes round without a seam.
 */
const SetupScene = () => {
  const frame = useCurrentFrame();
  const isActed = frame >= ACTS_AT && frame < LETS_GO_AT;

  return (
    <AbsoluteFill className="items-center justify-center">
      <div className="flex w-full justify-center" {...(isActed ? { 'data-acted': '' } : {})}>
        <SetupPicture />
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 24, y: 90 },
          { at: 24, x: 24, y: 90 },
          { at: ACTS_AT - 6, x: 83, y: 77 },
          { at: ACTS_AT, x: 83, y: 77, isPressing: true },
          { at: LETS_GO_AT - 20, x: 83, y: 77 },
          { at: 221, x: 24, y: 90 },
        ]}
      />
    </AbsoluteFill>
  );
};

SetupScene.displayName = 'SetupScene';

export { SetupScene };
