import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { ApiKeysPicture } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ApiKeysVignette/components/ApiKeysPicture/ApiKeysPicture';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';

const ACTS_AT = 84;

const LETS_GO_AT = 214;

/**
 * The picture acted out as makes a new key, shown in full once, a pointer following along and that copies the new key the moment it is shown, then letting it settle back to where it began, so it
 * goes round without a seam.
 */
const ApiKeysScene = () => {
  const frame = useCurrentFrame();
  const isActed = frame >= ACTS_AT && frame < LETS_GO_AT;

  return (
    <AbsoluteFill className="items-center justify-center">
      <div className="flex w-full justify-center" {...(isActed ? { 'data-acted': '' } : {})}>
        <ApiKeysPicture />
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 26, y: 90 },
          { at: ACTS_AT + 10, x: 26, y: 90 },
          { at: ACTS_AT + 40, x: 79, y: 43 },
          { at: ACTS_AT + 48, x: 79, y: 43, isPressing: true },
          { at: LETS_GO_AT - 20, x: 79, y: 43 },
          { at: 269, x: 26, y: 90 },
        ]}
      />
    </AbsoluteFill>
  );
};

ApiKeysScene.displayName = 'ApiKeysScene';

export { ApiKeysScene };
