import { BrandGlyph } from '@ValenceUI/BrandGlyph';
import { Icon } from '@ValenceUI/Icon';
import { brandMarksOf } from '@ValenceScreens/components/AdminArea/components/SessionCard/brandMarksOf';
import { deviceIconFor } from '@ValenceScreens/components/AdminArea/components/SessionCard/deviceIcon';
import type { BrandMarkName } from '@ValenceUI/BrandGlyph.types';
import type { DeviceLabelProps } from './DeviceLabel.types';

const WORDMARKS: ReadonlySet<BrandMarkName> = new Set(['lg', 'samsung', 'toshiba', 'hitachi']);

/**
 * What somebody is using, as its marks and then its name: the browser's mark where it is a browser
 * we know, then the maker's or the system's, or a plain device where neither is known. A maker
 * whose mark is a word rather than a symbol is left to the name, since a word that small cannot be
 * read.
 *
 * @param deviceLabel - The device, as the server names it, such as Chromium on macOS.
 * @param clientKind - What kind of app it is, which picks the plain device drawn where no mark is.
 */
const DeviceLabel = ({ deviceLabel, clientKind = 'browser' }: DeviceLabelProps) => {
  const marks = brandMarksOf(deviceLabel);
  const system = marks.system === null || WORDMARKS.has(marks.system) ? null : marks.system;

  return (
    <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-text-muted">
      {clientKind === 'browser' && marks.browser !== null ? (
        <BrandGlyph of={marks.browser} size={14} />
      ) : null}

      {system === null ? (
        marks.browser === null || clientKind !== 'browser' ? (
          <Icon of={deviceIconFor(deviceLabel, clientKind)} size={14} className="shrink-0" />
        ) : null
      ) : (
        <BrandGlyph of={system} size={14} />
      )}

      <span className="truncate">{deviceLabel}</span>
    </span>
  );
};

DeviceLabel.displayName = 'DeviceLabel';

export { DeviceLabel };
