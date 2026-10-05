import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { OfflinePicture } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/OfflineVignette/components/OfflinePicture/OfflinePicture';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';

const ACTS_AT = 46;

const LETS_GO_AT = 160;

/**
 * The picture acted out by a pointer that chooses a smaller size for a download, which then fills, then lets it settle back to where it began, so it
 * goes round without a seam.
 */
const OfflineScene = () => {
  const frame = useCurrentFrame();
  const isActed = frame >= ACTS_AT && frame < LETS_GO_AT;

  return (
    <AbsoluteFill className="items-center justify-center">
      <div className="flex w-full justify-center" {...(isActed ? { 'data-acted': '' } : {})}>
        <OfflinePicture />
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 20, y: 88 },
          { at: 24, x: 20, y: 88 },
          { at: ACTS_AT - 6, x: 46, y: 55 },
          { at: ACTS_AT, x: 46, y: 55, isPressing: true },
          { at: LETS_GO_AT - 20, x: 46, y: 55 },
          { at: 215, x: 20, y: 88 },
        ]}
      />
    </AbsoluteFill>
  );
};

OfflineScene.displayName = 'OfflineScene';

export { OfflineScene };
