import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { NotificationsPicture } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/NotificationsVignette/components/NotificationsPicture/NotificationsPicture';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';

const ACTS_AT = 80;

const LETS_GO_AT = 210;

/**
 * The picture acted out as brings in another notification on top of the list, a pointer following along and that points at what arrives as it arrives, then letting it settle back to where it began, so it
 * goes round without a seam.
 */
const NotificationsScene = () => {
  const frame = useCurrentFrame();
  const isActed = frame >= ACTS_AT && frame < LETS_GO_AT;

  return (
    <AbsoluteFill className="items-center justify-center">
      <div className="flex w-full justify-center" {...(isActed ? { 'data-acted': '' } : {})}>
        <NotificationsPicture />
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 30, y: 86 },
          { at: ACTS_AT, x: 30, y: 86 },
          { at: ACTS_AT + 34, x: 60, y: 32 },
          { at: LETS_GO_AT - 20, x: 60, y: 32 },
          { at: 263, x: 30, y: 86 },
        ]}
      />
    </AbsoluteFill>
  );
};

NotificationsScene.displayName = 'NotificationsScene';

export { NotificationsScene };
