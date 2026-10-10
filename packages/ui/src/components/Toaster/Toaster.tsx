import { Toaster as SonnerToaster } from 'sonner';
import { cn } from '@ValenceUI/cn';
import { PRESS_MOTION } from '@ValenceUI/animations/motion';
import { DoneMark } from '@ValenceUI/DoneMark';
import type { ToasterProps } from './Toaster.types';

/**
 * Where everything the application has to say arrives. Mounted once, near the root; a second one
 * would show every message twice.
 *
 * Sonner is wrapped rather than reached for directly so that a toast is a Valence component like any
 * other: callers say what happened and this decides how it looks, which is what stops sixty screens
 * each inventing their own banner. It carries the product's own surface, border and radius rather
 * than the library's defaults, a success arrives as the work settling into a tick, and its answer is the product's grey secondary button, never a
 * coloured one: a toast reports, it does not ask to be the loudest thing on the screen.
 *
 * There is normally one, at the root. The exception is the player: it goes fullscreen, and a toast
 * portalled to the document is drawn behind a fullscreen video, which is to say not drawn. A named
 * toaster inside the player takes the messages addressed to it and nothing else.
 *
 * @param theme - Which way round to paint, following whatever the page is set to.
 * @param id - Which toaster this is, for messages addressed somewhere other than the page.
 * @param position - Which corner they arrive in, since a toast over a film wants to be clear of the controls.
 * @returns Where toasts are drawn.
 */
const Toaster = ({ theme = 'system', id, position = 'bottom-right' }: ToasterProps) => (
  <SonnerToaster
    {...(id === undefined ? {} : { id })}
    theme={theme}
    position={position}
    offset={24}
    mobileOffset={16}
    gap={10}
    visibleToasts={4}
    icons={{ success: <DoneMark /> }}
    toastOptions={{
      duration: 5000,
      classNames: {
        toast: [
          'group valence-float !rounded-xl !border-0',
          '!bg-surface-raised !text-text',
          '!shadow-[0_0_0_1px_var(--surface-line),var(--shadow-overlay)] !font-body',
        ].join(' '),
        title: '!text-sm !font-medium',
        description: '!text-xs !text-[var(--color-muted-foreground)]',
        actionButton: cn(
          '!h-8 !rounded-md !border !border-[var(--surface-line)] !bg-[var(--surface-hover)] !px-3',
          '!text-xs !font-medium !text-text hover:!bg-[var(--surface-active)]',
          PRESS_MOTION,
        ),
        cancelButton: cn(
          '!h-8 !rounded-md !border !border-transparent !bg-transparent !px-3',
          '!text-xs !font-medium !text-[var(--color-muted-foreground)] hover:!bg-[var(--surface-hover)]',
          PRESS_MOTION,
        ),
        closeButton:
          '!rounded-pill !border-[var(--glass-edge)] !bg-[var(--surface-hover)] !text-[var(--color-muted-foreground)]',
        error: '!text-[var(--color-destructive)]',
      },
    }}
  />
);

Toaster.displayName = 'Toaster';

export { Toaster };
