import { Link } from '@tanstack/react-router';
import { ArrowUpRight as ArrowUpRightIcon } from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { isLocalTarget } from '@ValenceLanding/components/LandingNav/isLocalTarget';
import type { NavEntryProps } from './NavEntry.types';

const ENTRY_CLASS =
  'group relative z-10 grid w-full grid-cols-[1.5rem_minmax(0,1fr)_auto] items-start gap-3 no-underline outline-none focus-visible:ring-[3px] focus-visible:ring-ring';

const SIZE_CLASSES = {
  panel: 'rounded-md p-3',
  menu: 'rounded-xl p-3 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover-hover:hover:bg-[var(--surface-hover)]',
} as const;

const LABEL_CLASSES = {
  panel: 'text-[0.9375rem] font-semibold leading-tight text-text',
  menu: 'text-base font-semibold leading-tight text-text',
} as const;

/**
 * One place in the site's navigation, drawn the same in the wide panel and the narrow menu: its
 * icon, its name and a line on what is there, with an arrow when it leaves the site.
 *
 * @param item - The place, and whether the router or the browser takes it there.
 * @param size - Whether it sits in the wide panel or the narrow menu.
 * @param onChoose - Called once it is chosen, so whatever holds it can close.
 * @param onAim - Called when a pointer or the keyboard comes to rest on it.
 */
const NavEntry = ({ item, size, onChoose, onAim }: NavEntryProps) => {
  const content = (
    <>
      <span className="flex pt-0.5 text-accent transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)] group-hover:scale-110 group-active:scale-95">
        <Icon of={item.icon} size={20} />
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className={LABEL_CLASSES[size]}>{item.label}</span>
        <span className="text-sm leading-snug text-text-muted">{item.detail}</span>
      </span>
      {isLocalTarget(item) ? (
        <span />
      ) : (
        <Icon
          of={ArrowUpRightIcon}
          size={14}
          tone="muted"
          className="mt-1 transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      )}
    </>
  );
  const shared = {
    'data-highlight': item.label,
    className: cn(ENTRY_CLASS, SIZE_CLASSES[size]),
    onMouseEnter: onAim,
    onFocus: onAim,
    onClick: onChoose,
  };

  return isLocalTarget(item) ? (
    <Link to={item.to} {...shared}>
      {content}
    </Link>
  ) : (
    <a href={item.href} {...shared}>
      {content}
    </a>
  );
};

NavEntry.displayName = 'NavEntry';

export { NavEntry };
