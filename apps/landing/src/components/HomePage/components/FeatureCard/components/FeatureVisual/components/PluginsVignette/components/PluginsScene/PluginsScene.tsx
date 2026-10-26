import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { PluginsPicture } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/PluginsVignette/components/PluginsPicture/PluginsPicture';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';

const ACTS_AT = 62;

const LETS_GO_AT = 186;

/**
 * The picture acted out by a pointer that installs a plugin once it has read what it may do, then lets it settle back to where it began, so it
 * goes round without a seam.
 */
const PluginsScene = () => {
  const frame = useCurrentFrame();
  const isActed = frame >= ACTS_AT && frame < LETS_GO_AT;

  return (
    <AbsoluteFill>
      <div className="absolute inset-0" {...(isActed ? { 'data-acted': '' } : {})}>
        <PluginsPicture isUnderstood={isActed} />
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 30, y: 93 },
          { at: 24, x: 30, y: 93 },
          { at: ACTS_AT - 6, x: 10, y: 71 },
          { at: ACTS_AT, x: 10, y: 71, isPressing: true },
          { at: LETS_GO_AT - 20, x: 10, y: 71 },
          { at: 239, x: 30, y: 93 },
        ]}
      />
    </AbsoluteFill>
  );
};

PluginsScene.displayName = 'PluginsScene';

export { PluginsScene };
