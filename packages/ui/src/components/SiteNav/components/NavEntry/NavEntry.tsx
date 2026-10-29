import { ArrowUpRight as ArrowUpRightIcon } from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { NavLink } from '@ValenceUI/SiteNav/NavLink';
import { say } from '@ValenceI18n/say';
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
 * One place in the bar, drawn the same in the wide panel and the narrow menu: its icon, its name
 * and a line on what is there, with an arrow when it leads away from Valence's own pages, to the
 * documentation or off Valence's sites altogether.
 *
 * @param item - The place, and which site it is on.
 * @param here - Which site the bar is on.
 * @param InSiteLink - How that site links to one of its own pages.
 * @param size - Whether it sits in the wide panel or the narrow menu.
 * @param onChoose - Called once it is chosen, so whatever holds it can close.
 * @param onAim - Called when a pointer or the keyboard comes to rest on it.
 */
const NavEntry = ({ item, here, InSiteLink, size, onChoose, onAim }: NavEntryProps) => {
  const isAway = 'href' in item || (item.site !== here && item.site !== 'landing');

  return (
    <NavLink
      target={item}
      here={here}
      InSiteLink={InSiteLink}
      className={cn(ENTRY_CLASS, SIZE_CLASSES[size])}
      onClick={onChoose}
      {...(onAim === undefined ? {} : { onFocus: onAim, onPointerEnter: onAim })}
    >
      <span className="flex pt-0.5 text-accent transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)] group-hover:scale-110 group-active:scale-95">
        <Icon of={item.icon} size={20} />
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className={LABEL_CLASSES[size]}>{say(item.label)}</span>
        <span className="text-sm leading-snug text-text-muted">{say(item.detail)}</span>
      </span>
      {isAway ? (
        <Icon
          of={ArrowUpRightIcon}
          size={14}
          tone="muted"
          className="mt-1 transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      ) : (
        <span />
      )}
    </NavLink>
  );
};

NavEntry.displayName = 'NavEntry';

export { NavEntry };
