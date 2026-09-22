import { Logo } from '@ValenceUI/Logo';
import type { TitleBarProps } from './TitleBar.types';

/**
 * The bar a window draws along its top where the system's own controls are laid over the page.
 *
 * Windows and Linux put minimise, maximise and close in the top right, and a header drawn under them
 * either loses its right-hand actions or has to move them. So the window gets a strip of its own, the
 * way Discord's does: the name of the application on the left, and room on the right for the controls
 * the system draws.
 *
 * @param title - What to call the window.
 */
const TitleBar = ({ title }: TitleBarProps) => (
  <div
    data-slot="title-bar"
    className="fixed inset-x-0 top-0 z-[60] flex h-9 items-center gap-2 bg-surface px-3 text-sm font-medium text-text [-webkit-app-region:drag]"
  >
    <Logo size={16} isSolid />
    {title}
  </div>
);

TitleBar.displayName = 'TitleBar';

export { TitleBar };
