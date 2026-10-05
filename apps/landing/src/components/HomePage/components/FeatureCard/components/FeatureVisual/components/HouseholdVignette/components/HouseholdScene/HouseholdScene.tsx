import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { HouseholdPicture } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/HouseholdVignette/components/HouseholdPicture/HouseholdPicture';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';

const ACTS_AT = 72;

const LETS_GO_AT = 196;

/**
 * The picture acted out by a pointer that fans out the household’s faces and picks one, then lets it settle back to where it began, so it
 * goes round without a seam.
 */
const HouseholdScene = () => {
  const frame = useCurrentFrame();
  const isActed = frame >= ACTS_AT && frame < LETS_GO_AT;

  return (
    <AbsoluteFill className="items-center justify-center">
      <div className="flex w-full justify-center" {...(isActed ? { 'data-acted': '' } : {})}>
        <HouseholdPicture />
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 76, y: 88 },
          { at: 24, x: 76, y: 88 },
          { at: ACTS_AT - 6, x: 38, y: 60 },
          { at: ACTS_AT, x: 38, y: 60, isPressing: true },
          { at: LETS_GO_AT - 20, x: 38, y: 60 },
          { at: 249, x: 76, y: 88 },
        ]}
      />
    </AbsoluteFill>
  );
};

HouseholdScene.displayName = 'HouseholdScene';

export { HouseholdScene };
