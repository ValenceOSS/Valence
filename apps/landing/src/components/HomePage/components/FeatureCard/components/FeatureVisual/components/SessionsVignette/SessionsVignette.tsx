import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { SessionsScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SessionsVignette/components/SessionsScene/SessionsScene';

/**
 * The admin page of who is watching now, acted out round and round by a pointer.
 */
const SessionsVignette = () => (
  <LoopingScene
    scene={SessionsScene}
    frames={234}
    width={323}
    height={320}
    still={120}
    startsAt={70}
    className="w-full max-w-[var(--vignette-width)]"
  />
);

SessionsVignette.displayName = 'SessionsVignette';

export { SessionsVignette };
