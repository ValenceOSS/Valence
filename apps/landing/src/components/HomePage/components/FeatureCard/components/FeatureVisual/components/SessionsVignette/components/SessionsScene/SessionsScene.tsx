import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { SessionsPicture } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SessionsVignette/components/SessionsPicture/SessionsPicture';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';

const ACTS_AT = 60;

const LETS_GO_AT = 182;

/**
 * A slice of the admin's sessions at the app's own size, where somebody else starts watching and
 * their session arrives on top under the pointer, then goes again, so it goes round without a seam.
 */
const SessionsScene = () => {
  const frame = useCurrentFrame();
  const isActed = frame >= ACTS_AT && frame < LETS_GO_AT;

  return (
    <AbsoluteFill>
      <div className="absolute left-4 top-6 w-[37rem]" {...(isActed ? { 'data-acted': '' } : {})}>
        <SessionsPicture isActed={isActed} />
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 30, y: 86 },
          { at: ACTS_AT, x: 30, y: 86 },
          { at: ACTS_AT + 34, x: 33, y: 44 },
          { at: LETS_GO_AT - 20, x: 33, y: 44 },
          { at: 233, x: 30, y: 86 },
        ]}
      />
    </AbsoluteFill>
  );
};

SessionsScene.displayName = 'SessionsScene';

export { SessionsScene };
