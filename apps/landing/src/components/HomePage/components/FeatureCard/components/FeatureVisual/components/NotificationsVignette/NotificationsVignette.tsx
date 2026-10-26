import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { NotificationsScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/NotificationsVignette/components/NotificationsScene/NotificationsScene';

/**
 * The notification list as the bell opens it, acted out round and round by a pointer.
 */
const NotificationsVignette = () => (
  <LoopingScene scene={NotificationsScene} frames={264} anchor="left" still={140} startsAt={150} />
);

NotificationsVignette.displayName = 'NotificationsVignette';

export { NotificationsVignette };
