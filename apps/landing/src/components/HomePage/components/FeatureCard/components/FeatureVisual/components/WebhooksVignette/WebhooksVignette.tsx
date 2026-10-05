import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { WebhooksScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/WebhooksVignette/components/WebhooksScene/WebhooksScene';

/**
 * The admin page of webhooks with their last delivery, acted out round and round by a pointer.
 */
const WebhooksVignette = () => (
  <LoopingScene
    scene={WebhooksScene}
    frames={258}
    width={323}
    height={400}
    still={130}
    startsAt={30}
    className="w-full max-w-[var(--vignette-width)]"
  />
);

WebhooksVignette.displayName = 'WebhooksVignette';

export { WebhooksVignette };
