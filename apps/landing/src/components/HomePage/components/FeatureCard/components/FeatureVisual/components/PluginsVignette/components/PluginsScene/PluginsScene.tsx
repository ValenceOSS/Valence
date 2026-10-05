import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { PluginsPicture } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/PluginsVignette/components/PluginsPicture/PluginsPicture';
import { SceneCursor } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/SceneCursor/SceneCursor';

const ACTS_AT = 62;

const LETS_GO_AT = 186;

/**
 * The picture acted out by a pointer that grants a plugin the one thing it had not been given, narrowly, then lets it settle back to where it began, so it
 * goes round without a seam.
 */
const PluginsScene = () => {
  const frame = useCurrentFrame();
  const isActed = frame >= ACTS_AT && frame < LETS_GO_AT;

  return (
    <AbsoluteFill className="items-center justify-center">
      <div className="flex w-full justify-center" {...(isActed ? { 'data-acted': '' } : {})}>
        <PluginsPicture />
      </div>

      <SceneCursor
        path={[
          { at: 0, x: 28, y: 90 },
          { at: 24, x: 28, y: 90 },
          { at: ACTS_AT - 6, x: 8, y: 78 },
          { at: ACTS_AT, x: 8, y: 78, isPressing: true },
          { at: LETS_GO_AT - 20, x: 8, y: 78 },
          { at: 239, x: 28, y: 90 },
        ]}
      />
    </AbsoluteFill>
  );
};

PluginsScene.displayName = 'PluginsScene';

export { PluginsScene };
