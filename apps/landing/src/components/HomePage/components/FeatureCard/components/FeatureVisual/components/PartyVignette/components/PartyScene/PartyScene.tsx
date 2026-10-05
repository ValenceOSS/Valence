import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { PartyPicture } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/PartyVignette/components/PartyPicture/PartyPicture';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';

const ACTS_AT = 52;

const LETS_GO_AT = 170;

/**
 * The picture acted out as brings three people who drifted apart back onto the one playhead, a pointer following along and that points at what arrives as it arrives, then letting it settle back to where it began, so it
 * goes round without a seam.
 */
const PartyScene = () => {
  const frame = useCurrentFrame();
  const isActed = frame >= ACTS_AT && frame < LETS_GO_AT;

  return (
    <AbsoluteFill className="items-center justify-center">
      <div className="flex w-full justify-center" {...(isActed ? { 'data-acted': '' } : {})}>
        <PartyPicture />
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 24, y: 82 },
          { at: ACTS_AT, x: 24, y: 82 },
          { at: ACTS_AT + 34, x: 50, y: 58 },
          { at: LETS_GO_AT - 20, x: 50, y: 58 },
          { at: 227, x: 24, y: 82 },
        ]}
      />
    </AbsoluteFill>
  );
};

PartyScene.displayName = 'PartyScene';

export { PartyScene };
