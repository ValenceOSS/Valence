import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { ApiKeysPicture } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ApiKeysVignette/components/ApiKeysPicture/ApiKeysPicture';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';

const ACTS_AT = 84;

const COPIES_AT = 132;

const LETS_GO_AT = 214;

/**
 * A slice of the API keys at the app's own size, where the pointer makes a key, which is shown in
 * full once, and copies it, then lets it go again, so it goes round without a seam.
 */
const ApiKeysScene = () => {
  const frame = useCurrentFrame();
  const isActed = frame >= ACTS_AT && frame < LETS_GO_AT;

  return (
    <AbsoluteFill>
      <div
        className="absolute -top-[5.8125rem] left-4 w-[37rem]"
        {...(isActed ? { 'data-acted': '' } : {})}
      >
        <ApiKeysPicture isActed={isActed} isCopied={frame >= COPIES_AT} />
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 30, y: 72 },
          { at: 30, x: 30, y: 72 },
          { at: ACTS_AT - 8, x: 20, y: 19 },
          { at: ACTS_AT, x: 20, y: 19, isPressing: true },
          { at: COPIES_AT - 10, x: 20, y: 25 },
          { at: COPIES_AT, x: 20, y: 25, isPressing: true },
          { at: LETS_GO_AT - 20, x: 20, y: 25 },
          { at: 269, x: 30, y: 72 },
        ]}
      />
    </AbsoluteFill>
  );
};

ApiKeysScene.displayName = 'ApiKeysScene';

export { ApiKeysScene };
