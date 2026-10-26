import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { WebhooksPicture } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/WebhooksVignette/components/WebhooksPicture/WebhooksPicture';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';

const ACTS_AT = 70;

const LETS_GO_AT = 200;

/**
 * A slice of a failing webhook's delivery history at the app's own size, where the pointer sends the
 * failed delivery again and this time it is answered, then lets it fail again, so it goes round
 * without a seam.
 */
const WebhooksScene = () => {
  const frame = useCurrentFrame();
  const isActed = frame >= ACTS_AT && frame < LETS_GO_AT;

  return (
    <AbsoluteFill>
      <div
        className="absolute -top-[5.125rem] left-4 w-[37rem]"
        {...(isActed ? { 'data-acted': '' } : {})}
      >
        <WebhooksPicture isActed={isActed} />
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 32, y: 94 },
          { at: 24, x: 32, y: 94 },
          { at: ACTS_AT - 6, x: 10, y: 73 },
          { at: ACTS_AT, x: 10, y: 73, isPressing: true },
          { at: LETS_GO_AT - 20, x: 10, y: 73 },
          { at: 257, x: 32, y: 94 },
        ]}
      />
    </AbsoluteFill>
  );
};

WebhooksScene.displayName = 'WebhooksScene';

export { WebhooksScene };
