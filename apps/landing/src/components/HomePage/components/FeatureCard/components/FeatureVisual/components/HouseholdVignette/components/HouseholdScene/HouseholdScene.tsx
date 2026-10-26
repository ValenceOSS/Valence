import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { HouseholdPicture } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/HouseholdVignette/components/HouseholdPicture/HouseholdPicture';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';

const ACTS_AT = 72;

const LETS_GO_AT = 196;

/**
 * The picture acted out by a pointer that comes to rest on one of the household’s faces, then
 * drifts away so the faces settle back to where they began, and it goes round without a seam.
 */
const HouseholdScene = () => {
  const frame = useCurrentFrame();
  const isActed = frame >= ACTS_AT && frame < LETS_GO_AT;

  return (
    <AbsoluteFill>
      <div className="absolute inset-x-0 top-7" {...(isActed ? { 'data-acted': '' } : {})}>
        <HouseholdPicture />
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 52, y: 90 },
          { at: 24, x: 52, y: 90 },
          { at: ACTS_AT - 6, x: 41, y: 58 },
          { at: ACTS_AT, x: 41, y: 58, isPressing: true },
          { at: LETS_GO_AT - 20, x: 41, y: 58 },
          { at: 249, x: 52, y: 90 },
        ]}
      />
    </AbsoluteFill>
  );
};

HouseholdScene.displayName = 'HouseholdScene';

export { HouseholdScene };
