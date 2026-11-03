import {
  Layers as LayersIcon,
  Monitor as MonitorIcon,
  MonitorSparkles as MonitorSparklesIcon,
  Smartphone as SmartphoneIcon,
} from '@keyline-icons/react';
import type { IconGlyph } from '@ValenceUI/Icon.types';

/**
 * The mark beside a quality somebody may ask for, read from its name as the phone reads it, since a
 * quality is only named: a lit screen for 4K, a screen for a sharp picture, a phone for a smaller
 * one, and a stack for anything that takes whatever it finds.
 *
 * @param name - The quality's name, such as `4K`, `1080p or 720p` or `Any`.
 * @returns The mark.
 */
const iconOfQuality = (name: string): IconGlyph =>
  /\b(4k|2160p?|uhd)\b/iu.test(name)
    ? MonitorSparklesIcon
    : /\b(1080p?|720p?|hd)\b/iu.test(name)
      ? MonitorIcon
      : /\b(576p?|480p?|sd)\b/iu.test(name)
        ? SmartphoneIcon
        : LayersIcon;

export { iconOfQuality };
