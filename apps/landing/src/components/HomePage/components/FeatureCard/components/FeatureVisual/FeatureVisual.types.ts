import type { IconGlyph } from '@ValenceUI/Icon.types';

type FeatureVisualKind = 'window' | 'waveform' | 'orbit' | 'stack';

type FeatureVisualProps = {
  kind: FeatureVisualKind;
  icon: IconGlyph;
};

export type { FeatureVisualKind, FeatureVisualProps };
