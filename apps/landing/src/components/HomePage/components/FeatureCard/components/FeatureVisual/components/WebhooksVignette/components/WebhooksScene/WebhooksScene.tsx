import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { WebhooksPicture } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/WebhooksVignette/components/WebhooksPicture/WebhooksPicture';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';

const ACTS_AT = 70;

const LETS_GO_AT = 200;

/**
 * The picture acted out by a pointer that sends the webhook that failed again, and this time it is answered, then lets it settle back to where it began, so it
 * goes round without a seam.
 */
const WebhooksScene = () => {
  const frame = useCurrentFrame();
  const isActed = frame >= ACTS_AT && frame < LETS_GO_AT;

  return (
    <AbsoluteFill className="items-center justify-center">
      <div className="flex w-full justify-center" {...(isActed ? { 'data-acted': '' } : {})}>
        <WebhooksPicture />
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 64, y: 90 },
          { at: 24, x: 64, y: 90 },
          { at: ACTS_AT - 6, x: 18, y: 51 },
          { at: ACTS_AT, x: 18, y: 51, isPressing: true },
          { at: LETS_GO_AT - 20, x: 18, y: 51 },
          { at: 257, x: 64, y: 90 },
        ]}
      />
    </AbsoluteFill>
  );
};

WebhooksScene.displayName = 'WebhooksScene';

export { WebhooksScene };
