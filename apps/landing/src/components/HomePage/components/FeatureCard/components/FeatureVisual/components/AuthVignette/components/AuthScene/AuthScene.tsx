import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { AuthPicture } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/AuthVignette/components/AuthPicture/AuthPicture';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';

const ACTS_AT = 58;

const LETS_GO_AT = 178;

const CODE = '481073';

const FRAMES_A_DIGIT = 4;

const PRESSES_AT = ACTS_AT + CODE.length * FRAMES_A_DIGIT + 16;

/**
 * The picture acted out by a pointer that types in the code from an authenticator and presses verify, then lets it settle back to where it began, so it
 * goes round without a seam.
 */
const AuthScene = () => {
  const frame = useCurrentFrame();
  const isActed = frame >= ACTS_AT && frame < LETS_GO_AT;
  const typed = isActed ? CODE.slice(0, Math.floor((frame - ACTS_AT) / FRAMES_A_DIGIT) + 1) : '';

  return (
    <AbsoluteFill>
      <div
        className="absolute left-1/2 top-7 -translate-x-1/2"
        {...(isActed ? { 'data-acted': '' } : {})}
      >
        <AuthPicture typed={typed} />
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 62, y: 92 },
          { at: 24, x: 62, y: 92 },
          { at: ACTS_AT - 6, x: 48, y: 53 },
          { at: ACTS_AT, x: 48, y: 53, isPressing: true },
          { at: PRESSES_AT - 6, x: 50, y: 71 },
          { at: PRESSES_AT, x: 50, y: 71, isPressing: true },
          { at: LETS_GO_AT - 20, x: 50, y: 71 },
          { at: 231, x: 62, y: 92 },
        ]}
      />
    </AbsoluteFill>
  );
};

AuthScene.displayName = 'AuthScene';

export { AuthScene };
