import type { ASymbol } from '@ValenceMobile/components/AMenu/AMenu.types';

/**
 * The symbol beside a quality somebody may ask for, read from its name, since a quality is only
 * named: a 4K television for 4K, a television for a sharp picture, a small screen for a smaller
 * one, and a stack for anything that takes whatever it finds.
 *
 * @param name - The quality's name, such as `4K`, `1080p or 720p` or `Any`.
 * @returns The symbol.
 */
const symbolOfQuality = (name: string): ASymbol =>
  /\b(4k|2160p?|uhd)\b/iu.test(name)
    ? '4k.tv'
    : /\b(1080p?|720p?|hd)\b/iu.test(name)
      ? 'tv'
      : /\b(576p?|480p?|sd)\b/iu.test(name)
        ? 'iphone'
        : 'square.stack';

export { symbolOfQuality };
