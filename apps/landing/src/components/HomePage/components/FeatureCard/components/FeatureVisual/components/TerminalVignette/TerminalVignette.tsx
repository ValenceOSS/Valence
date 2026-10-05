import { LoopingScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/LoopingScene/LoopingScene';
import { TerminalScene } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/TerminalVignette/components/TerminalScene/TerminalScene';

/**
 * The one command that starts it and the few lines it says as it comes up, acted out round and round by a pointer.
 */
const TerminalVignette = () => (
  <LoopingScene
    scene={TerminalScene}
    frames={220}
    width={323}
    height={275}
    still={108}
    startsAt={100}
    className="w-full max-w-[var(--vignette-width)]"
  />
);

TerminalVignette.displayName = 'TerminalVignette';

export { TerminalVignette };
