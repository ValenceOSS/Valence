import { buttonStyles } from '@ValenceUI/Button/buttonStyles';
import { cn } from '@ValenceUI/cn';

const JOINED_SIZE = 'size-9 coarse:size-11';

const DIVIDER =
  'relative before:pointer-events-none before:absolute before:inset-y-2.5 before:left-0 before:w-px';

const FLIPS = '[&_svg]:transition-transform [&[data-state=open]_svg]:rotate-180';

const JOINED_LOOKS = {
  confirm: cn(
    buttonStyles({ variant: 'confirm', size: 'lg', isIconOnly: true, shape: 'joinsPrevious' }),
    JOINED_SIZE,
    DIVIDER,
    FLIPS,
    'before:bg-on-white/20 hover:bg-white-hover data-[state=open]:bg-white-hover text-on-white',
  ),
  secondary: cn(
    buttonStyles({ variant: 'secondary', size: 'lg', isIconOnly: true, shape: 'joinsPrevious' }),
    JOINED_SIZE,
    DIVIDER,
    FLIPS,
    'border-l-0 before:bg-[var(--surface-line)] data-[state=open]:bg-[var(--surface-active)]',
  ),
} as const;

export { JOINED_LOOKS };
