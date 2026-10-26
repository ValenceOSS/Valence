import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { NotificationsPicture } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/NotificationsVignette/components/NotificationsPicture/NotificationsPicture';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';

const ACTS_AT = 80;

const LETS_GO_AT = 210;

/**
 * The top of the notifications at the app's own size, where a new one arrives on top under the
 * pointer, then goes again, so it goes round without a seam.
 */
const NotificationsScene = () => {
  const frame = useCurrentFrame();
  const isActed = frame >= ACTS_AT && frame < LETS_GO_AT;

  return (
    <AbsoluteFill>
      <div className="absolute left-4 top-6" {...(isActed ? { 'data-acted': '' } : {})}>
        <NotificationsPicture isActed={isActed} />
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 30, y: 88 },
          { at: ACTS_AT, x: 30, y: 88 },
          { at: ACTS_AT + 34, x: 24, y: 46 },
          { at: LETS_GO_AT - 20, x: 24, y: 46 },
          { at: 263, x: 30, y: 88 },
        ]}
      />
    </AbsoluteFill>
  );
};

NotificationsScene.displayName = 'NotificationsScene';

export { NotificationsScene };
