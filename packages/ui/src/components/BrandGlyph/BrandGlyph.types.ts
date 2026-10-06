type BrandMarkName =
  | 'android'
  | 'apple'
  | 'brave'
  | 'chrome'
  | 'discord'
  | 'docker'
  | 'firefox'
  | 'github'
  | 'linux'
  | 'opera'
  | 'safari'
  | 'vivaldi';

type BrandGlyphProps = {
  of: BrandMarkName;
  size?: number;
  label?: string;
  className?: string;
};

export type { BrandGlyphProps, BrandMarkName };
