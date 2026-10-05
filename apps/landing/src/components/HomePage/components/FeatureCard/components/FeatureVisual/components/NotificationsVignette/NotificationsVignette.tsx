import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { NotificationsScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/NotificationsVignette/components/NotificationsScene/NotificationsScene';

/**
 * The notification list as the bell opens it, acted out round and round by a pointer.
 */
const NotificationsVignette = () => (
  <LoopingScene
    scene={NotificationsScene}
    frames={264}
    width={423}
    height={280}
    still={140}
    startsAt={150}
    className="w-full max-w-[var(--vignette-width)]"
  />
);

NotificationsVignette.displayName = 'NotificationsVignette';

export { NotificationsVignette };
