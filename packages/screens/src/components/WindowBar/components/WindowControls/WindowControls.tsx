import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import {
  Copy as RestoreIcon,
  Minus as MinimiseIcon,
  Square as MaximiseIcon,
  X as CloseIcon,
} from '@keyline-icons/react';
import type { WindowControlsProps } from './WindowControls.types';
import { say } from '@ValenceI18n/say';

const MINIMISE_GLYPH = 14;

const MAXIMISE_GLYPH = 10;

const RESTORE_GLYPH = 9;

const CLOSE_GLYPH = 14;

const BLOCK = 'w-[2.875rem] self-stretch';

/**
 * Minimise, maximise and close, drawn by the page at the right of the window bar on Windows and
 * Linux, where the system would otherwise lay its own over the top. Each is a flat block the height
 * of the bar, lit under the pointer, and close lights red, as the system's own do. Maximise turns
 * into restore while the window fills the screen. Each glyph is sized to stand as wide as the others,
 * since the square and the pair of squares fill far more of the icon set's grid than the cross does.
 *
 * @param isMaximised - Whether the window fills the screen, which turns maximise into restore.
 * @param onMinimise - Told to minimise the window.
 * @param onMaximise - Told to maximise the window, or restore it where it is maximised.
 * @param onClose - Told to close the window.
 */
const WindowControls = ({ isMaximised, onMinimise, onMaximise, onClose }: WindowControlsProps) => (
  <div data-slot="window-controls" className="flex items-center self-stretch">
    <span aria-hidden className="mx-1 h-4 w-px bg-[var(--surface-line)]" />

    <Button
      variant="windowControl"
      size="none"
      label={say('screens.windowBar.minimise')}
      onClick={onMinimise}
      className={BLOCK}
    >
      <Icon of={MinimiseIcon} size={MINIMISE_GLYPH} />
    </Button>

    <Button
      variant="windowControl"
      size="none"
      label={isMaximised ? say('screens.windowBar.restoreDown') : say('screens.windowBar.maximise')}
      onClick={onMaximise}
      className={BLOCK}
    >
      <Icon
        of={isMaximised ? RestoreIcon : MaximiseIcon}
        size={isMaximised ? RESTORE_GLYPH : MAXIMISE_GLYPH}
      />
    </Button>

    <Button
      variant="windowClose"
      size="none"
      label={say('common.close')}
      onClick={onClose}
      className={BLOCK}
    >
      <Icon of={CloseIcon} size={CLOSE_GLYPH} />
    </Button>
  </div>
);

WindowControls.displayName = 'WindowControls';

export { WindowControls };
