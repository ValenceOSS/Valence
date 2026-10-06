import android from '@ValenceBrands/android.svg';
import apple from '@ValenceBrands/apple.svg';
import brave from '@ValenceBrands/brave.svg';
import discord from '@ValenceBrands/discord.svg';
import docker from '@ValenceBrands/docker.svg';
import github from '@ValenceBrands/github.svg';
import chrome from '@ValenceBrands/googlechrome.svg';
import firefox from '@ValenceBrands/firefoxbrowser.svg';
import linux from '@ValenceBrands/linux.svg';
import opera from '@ValenceBrands/opera.svg';
import safari from '@ValenceBrands/safari.svg';
import vivaldi from '@ValenceBrands/vivaldi.svg';
import { cn } from '@ValenceUI/cn';
import type { BrandGlyphProps, BrandMarkName } from './BrandGlyph.types';

const MARKS: Readonly<Record<BrandMarkName, string>> = {
  android,
  apple,
  brave,
  chrome,
  discord,
  docker,
  firefox,
  github,
  linux,
  opera,
  safari,
  vivaldi,
};

const BASE_TEXT_PX = 16;

/**
 * The mark of a browser or a system, for saying at a glance what something runs in, where the icon
 * set has only generic shapes. The mark is a file referenced by its address and painted through as
 * a mask, so it takes the colour of the text around it the way an icon does and no SVG is inlined.
 *
 * @param of - Whose mark it is.
 * @param size - How large to draw it, in pixels at the default text size.
 * @param label - What to read out in its place, where it stands for something rather than sits
 *   beside words that already say it.
 * @param className - Extra classes for the caller's own layout.
 */
const BrandGlyph = ({ of, size = 16, label, className }: BrandGlyphProps) => {
  const mark = `url("${MARKS[of]}")`;
  const side = `${(size / BASE_TEXT_PX).toString()}rem`;

  return (
    <span
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
      className={cn('inline-block shrink-0 bg-current', className)}
      style={{
        width: side,
        height: side,
        maskImage: mark,
        WebkitMaskImage: mark,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
      }}
    />
  );
};

BrandGlyph.displayName = 'BrandGlyph';

export { BrandGlyph };
