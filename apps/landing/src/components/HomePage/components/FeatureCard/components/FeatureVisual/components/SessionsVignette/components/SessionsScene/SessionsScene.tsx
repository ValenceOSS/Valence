import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { SessionsPicture } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SessionsVignette/components/SessionsPicture/SessionsPicture';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';

const ACTS_AT = 60;

const LETS_GO_AT = 182;

/**
 * The picture acted out as brings in somebody else starting to watch, a pointer following along and that points at what arrives as it arrives, then letting it settle back to where it began, so it
 * goes round without a seam.
 */
const SessionsScene = () => {
  const frame = useCurrentFrame();
  const isActed = frame >= ACTS_AT && frame < LETS_GO_AT;

  return (
    <AbsoluteFill className="items-center justify-center">
      <div className="flex w-full justify-center" {...(isActed ? { 'data-acted': '' } : {})}>
        <SessionsPicture />
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 70, y: 88 },
          { at: ACTS_AT, x: 70, y: 88 },
          { at: ACTS_AT + 34, x: 40, y: 84 },
          { at: LETS_GO_AT - 20, x: 40, y: 84 },
          { at: 233, x: 70, y: 88 },
        ]}
      />
    </AbsoluteFill>
  );
};

SessionsScene.displayName = 'SessionsScene';

export { SessionsScene };
