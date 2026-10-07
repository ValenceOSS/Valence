import { BrandGlyph } from '@ValenceUI/BrandGlyph';
import type { LinuxMarkProps } from './LinuxMark.types';

/**
 * Linux's mark, for the Linux download, drawn the way the other downloads' icons are so it sits
 * among them: Tux, where Tabler's icons have no mark for Linux itself.
 *
 * @param size - How large to draw it, in pixels.
 * @param className - Extra classes for the caller's own layout.
 */
const LinuxMark = ({ size = 20, className }: LinuxMarkProps) => (
  <BrandGlyph of="linux" size={size} {...(className === undefined ? {} : { className })} />
);

LinuxMark.displayName = 'LinuxMark';

export { LinuxMark };
