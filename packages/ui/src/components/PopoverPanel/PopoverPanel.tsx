import * as RadixPopover from '@radix-ui/react-popover';
import { buttonStyles } from '@ValenceUI/Button/buttonStyles';
import { cn } from '@ValenceUI/cn';
import { JOINED_LOOKS } from '@ValenceUI/tokens/joinedLooks';
import { POPUP_MOTION } from '@ValenceUI/animations/motion';
import { Tooltip } from '@ValenceUI/Tooltip';
import { usePortalContainer } from '@ValenceUI/usePortalContainer';
import type { PopoverPanelProps } from './PopoverPanel.types';

/**
 * A panel hung off the control that opened it, positioned to stay on screen wherever that
 * control happens to be. For anything richer than a menu — a form, a chart, a list with its own
 * controls — where a menu's row-per-item shape would be wrong. Opening it puts focus on the panel
 * itself rather than its first control, so nothing in it shows a tooltip before it is pointed at.
 *
 * @param label - What the panel holds, read out on opening.
 * @param trigger - The control that opens it.
 * @param children - What the panel holds.
 * @param heading - A title across its top.
 * @param isOpen - Whether it is open, for a caller holding that state itself.
 * @param onOpenChange - Told when it opens or closes.
 * @param side - Which side of the trigger to prefer.
 * @param align - Which part of the trigger the panel lines up with, matching `ActionMenu`.
 * @param isDisabled - Whether it can be opened at all.
 * @param isBare - Whether the surrounding chrome already draws the hover, so this must not draw a
 * second one.
 * @param triggerLook - An icon square that is lit when pointed at, a smaller one for a strip as
 *   thin as a window bar, a button of the standard kind with room for a word beside its icon, one
 *   part of a joined row of them, or
 *   whatever it is given drawn inline, for a trigger that is a run of words and faces.
 * @param tone - Whether it sits on the page or over film, where the page's colours say nothing.
 * @param isOverDialogs - Whether it opens from chrome that stays usable over a dialog, such as the
 *   desktop's window bar, so a press inside it does not close the dialog either.
 * @param hasSurface - Whether it draws its own floating surface, or leaves that to what it holds,
 *   such as a card that is already one — which is then set on the frame's solid colour, so its
 *   shell reads as a dialog's does rather than letting the page show through.
 * @param className - Extra classes for the caller's own layout.
 */
const PopoverPanel = ({
  label,
  trigger,
  children,
  heading,
  isOpen,
  onOpenChange,
  side = 'top',
  align = 'end',
  isDisabled = false,
  isBare = false,
  triggerLook = 'icon',
  tone = 'default',
  isOverDialogs = false,
  hasSurface = true,
  className,
}: PopoverPanelProps) => {
  const portalContainer = usePortalContainer();

  return (
    <RadixPopover.Root
      {...(isOpen === undefined ? {} : { open: isOpen })}
      {...(onOpenChange === undefined ? {} : { onOpenChange })}
    >
      <Tooltip label={label} side={side === 'top' ? 'top' : 'bottom'}>
        <RadixPopover.Trigger
          aria-label={label}
          disabled={isDisabled}
          data-slot="popover-trigger"
          className={
            triggerLook === 'button'
              ? buttonStyles({ variant: 'glossy', size: 'sm' })
              : triggerLook === 'segment'
                ? cn('inline-flex shrink-0 items-center outline-none', JOINED_LOOKS.segment)
                : triggerLook === 'inline'
                  ? 'inline-flex items-center rounded-full text-current outline-none focus-visible:ring-[3px] focus-visible:ring-ring'
                  : cn(
                      'inline-flex shrink-0 items-center justify-center rounded-md',
                      triggerLook === 'smallIcon' ? 'size-6' : 'size-10',
                      'text-current outline-none',
                      'transition-colors duration-[var(--duration-instant)] ease-[var(--ease-out)]',
                      'motion-reduce:transition-none',
                      'focus-visible:ring-[3px] focus-visible:ring-ring',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                      isBare ? '' : 'hover:bg-hover data-[state=open]:bg-active',
                    )
          }
        >
          {trigger}
        </RadixPopover.Trigger>
      </Tooltip>

      <RadixPopover.Portal
        {...(portalContainer === undefined ? {} : { container: portalContainer })}
      >
        <RadixPopover.Content
          aria-label={label}
          side={side}
          sideOffset={12}
          align={align}
          collisionPadding={12}
          data-slot="popover-content"
          onOpenAutoFocus={(event) => {
            event.preventDefault();

            if (event.currentTarget instanceof HTMLElement) {
              event.currentTarget.focus();
            }
          }}
          {...(isOverDialogs ? { 'data-over-dialogs': '' } : {})}
          className={cn(
            'z-50 flex max-h-[70vh] flex-col overflow-hidden text-text',
            !hasSurface
              ? 'rounded-2xl bg-[var(--frame-back)] shadow-[var(--shadow-overlay)]'
              : tone === 'overlay'
                ? 'valence-glass valence-glass--film rounded-lg p-3'
                : 'valence-float rounded-lg p-3',
            'outline-none',
            POPUP_MOTION,
            className,
          )}
        >
          {heading === undefined ? null : (
            <h3 className="shrink-0 px-1 pb-3 text-base font-medium tracking-tight">{heading}</h3>
          )}

          <div className="valence-rail min-h-0 flex-1 overflow-y-auto">{children}</div>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
};

PopoverPanel.displayName = 'PopoverPanel';

export { PopoverPanel };
