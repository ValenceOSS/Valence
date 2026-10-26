import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { ShareLinkPicture } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ShareLinkVignette/components/ShareLinkPicture/ShareLinkPicture';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';

const ACTS_AT = 74;

const LETS_GO_AT = 198;

/**
 * The picture acted out by a pointer that copies a link made for one series, then lets it settle back to where it began, so it
 * goes round without a seam.
 */
const ShareLinkScene = () => {
  const frame = useCurrentFrame();
  const isActed = frame >= ACTS_AT && frame < LETS_GO_AT;

  return (
    <AbsoluteFill>
      <div className="absolute inset-0" {...(isActed ? { 'data-acted': '' } : {})}>
        <ShareLinkPicture isCopied={isActed} />
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 50, y: 94 },
          { at: 24, x: 50, y: 94 },
          { at: ACTS_AT - 6, x: 60, y: 77 },
          { at: ACTS_AT, x: 60, y: 77, isPressing: true },
          { at: LETS_GO_AT - 20, x: 60, y: 77 },
          { at: 251, x: 50, y: 94 },
        ]}
      />
    </AbsoluteFill>
  );
};

ShareLinkScene.displayName = 'ShareLinkScene';

export { ShareLinkScene };
