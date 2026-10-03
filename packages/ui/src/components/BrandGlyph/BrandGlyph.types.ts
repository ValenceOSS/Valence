type BrandMarkName =
  | 'android'
  | 'apple'
  | 'brave'
  | 'chrome'
  | 'firefox'
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
