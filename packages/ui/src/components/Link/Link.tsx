import { cn } from '@ValenceUI/cn';
import type { MouseEvent } from 'react';
import type { LinkProps } from './Link.types';

const LOOK =
  'rounded-sm font-medium text-text underline decoration-text/30 underline-offset-4 outline-none transition-colors hover:decoration-text focus-visible:ring-[3px] focus-visible:ring-ring';

const THE_WEB = /^https?:$/u;

/**
 * Whether an address is on another site than the page it is written on, judged by where it
 * resolves to rather than how it is written.
 *
 * @param href - The address.
 * @returns Whether it leaves this site.
 */
const isElsewhere = (href: string): boolean => {
  try {
    const to = new URL(href, window.location.href);

    return THE_WEB.test(to.protocol) && to.origin !== window.location.origin;
  } catch {
    return false;
  }
};

/**
 * Whether a click is a plain one, which the page handles itself, rather than one asking the browser
 * for something — a new tab, a new window, a download — which the browser should be left to.
 *
 * @param event - The click.
 * @returns Whether it is plain.
 */
const isPlainClick = (event: MouseEvent<HTMLAnchorElement>): boolean =>
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey &&
  !event.defaultPrevented;

/**
 * The one place an `<a>` is written in Valence: a link a person can open, copy or open elsewhere
 * from their browser's own menu, as a button that opens an address cannot be. An address on another
 * site opens in a new tab, without handing it this page; anything else opens here.
 *
 * A link within the app can be handed a way to go there itself. A plain click then moves the page
 * without reloading it, while a middle click, a Cmd or Ctrl click, or "Open in new tab" still opens
 * the address, which is the point of it being a link rather than a button.
 *
 * @param href - Where it goes.
 * @param children - What it says.
 * @param className - Extra classes for the caller's own layout.
 * @param onNavigate - How the page goes there itself on a plain click, where it can.
 * @param look - Whether it reads as an underlined word or wears whatever it holds — a card, a row.
 * @param label - What it is called, where what it holds does not say.
 * @param isCurrent - Whether it is the page already open, as a place in a bar of places is.
 * @param onPointerEnter - Told when the pointer comes over it.
 * @param onFocus - Told when it takes focus.
 */
const Link = ({
  href,
  children,
  className,
  onNavigate,
  look = 'text',
  label,
  isCurrent = false,
  onPointerEnter,
  onFocus,
}: LinkProps) => {
  const shown = cn(
    look === 'text' ? LOOK : 'outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
    className,
  );

  return isElsewhere(href) ? (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={shown}>
      {children}
    </a>
  ) : (
    <a
      href={href}
      aria-label={label}
      aria-current={isCurrent ? 'page' : undefined}
      className={shown}
      onPointerEnter={onPointerEnter}
      onFocus={onFocus}
      onClick={(event) => {
        if (onNavigate !== undefined && isPlainClick(event)) {
          event.preventDefault();
          onNavigate();
        }
      }}
    >
      {children}
    </a>
  );
};

Link.displayName = 'Link';

export { Link };
