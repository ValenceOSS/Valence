type BrandMarkName =
  | 'android'
  | 'apple'
  | 'brave'
  | 'chrome'
  | 'discord'
  | 'docker'
  | 'firefox'
  | 'github'
  | 'hitachi'
  | 'lg'
  | 'linux'
  | 'opera'
  | 'safari'
  | 'samsung'
  | 'toshiba'
  | 'vivaldi'
  | 'windows';

type BrandGlyphProps = {
  of: BrandMarkName;
  size?: number;
  label?: string;
  className?: string;
};

export type { BrandGlyphProps, BrandMarkName };
