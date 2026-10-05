import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { AuthPicture } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/AuthVignette/components/AuthPicture/AuthPicture';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';

const ACTS_AT = 58;

const LETS_GO_AT = 178;

/**
 * The picture acted out by a pointer that types in the code from an authenticator and signs in, then lets it settle back to where it began, so it
 * goes round without a seam.
 */
const AuthScene = () => {
  const frame = useCurrentFrame();
  const isActed = frame >= ACTS_AT && frame < LETS_GO_AT;

  return (
    <AbsoluteFill className="items-center justify-center">
      <div className="flex w-full justify-center" {...(isActed ? { 'data-acted': '' } : {})}>
        <AuthPicture />
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 22, y: 90 },
          { at: 24, x: 22, y: 90 },
          { at: ACTS_AT - 6, x: 50, y: 65 },
          { at: ACTS_AT, x: 50, y: 65, isPressing: true },
          { at: LETS_GO_AT - 20, x: 50, y: 65 },
          { at: 231, x: 22, y: 90 },
        ]}
      />
    </AbsoluteFill>
  );
};

AuthScene.displayName = 'AuthScene';

export { AuthScene };
