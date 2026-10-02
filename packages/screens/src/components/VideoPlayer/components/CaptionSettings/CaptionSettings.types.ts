import type { CaptionStyle } from '@ValenceClient/playback/captionStyle';

type CaptionSettingsProps = {
  style: CaptionStyle;
  onChange: (style: CaptionStyle) => void;
  onReset: () => void;
};

export type { CaptionSettingsProps };
