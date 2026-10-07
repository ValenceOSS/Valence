type BrandMarkName =
  | 'android'
  | 'apple'
  | 'brave'
  | 'chrome'
  | 'discord'
  | 'docker'
  | 'firefox'
  | 'github'
  | 'lg'
  | 'linux'
  | 'opera'
  | 'safari'
  | 'samsung'
  | 'vivaldi';

type BrandGlyphProps = {
  of: BrandMarkName;
  size?: number;
  label?: string;
  className?: string;
};

export type { BrandGlyphProps, BrandMarkName };
