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
    <AbsoluteFill>
      <div className="absolute left-6 top-6" {...(isActed ? { 'data-acted': '' } : {})}>
        <SetupPicture isOnLibraries={isActed} />
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 36, y: 94 },
          { at: 24, x: 36, y: 94 },
          { at: ACTS_AT - 6, x: 17, y: 86 },
          { at: ACTS_AT, x: 17, y: 86, isPressing: true },
          { at: LETS_GO_AT - 20, x: 17, y: 86 },
          { at: 221, x: 36, y: 94 },
        ]}
      />
    </AbsoluteFill>
  );
};

SetupScene.displayName = 'SetupScene';

export { SetupScene };
