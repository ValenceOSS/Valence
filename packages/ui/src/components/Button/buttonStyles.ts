import { cva } from 'class-variance-authority';
import { PRESS_MOTION } from '@ValenceUI/animations/motion';

const FLAT = 'border';

const buttonStyles = cva(
  [
    'inline-flex select-none font-medium',
    'outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-0',
    'disabled:pointer-events-none disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-[1.15em]",
    PRESS_MOTION,
  ].join(' '),
  {
    variants: {
      variant: {
        primary: `${FLAT} border-transparent bg-primary text-primary-foreground hover:bg-primary-hover`,
        glossy: `${FLAT} border-[var(--surface-line)] bg-[var(--surface-hover)] text-text hover:bg-[var(--surface-active)]`,
        confirm: `${FLAT} border-transparent bg-white text-on-white hover:bg-white-hover`,
        secondary: `${FLAT} border-[var(--surface-line)] bg-[var(--surface-hover)] text-text hover:bg-[var(--surface-active)]`,
        raised: `${FLAT} border-[var(--surface-line)] bg-surface-raised text-text shadow-[var(--shadow-lifted)] hover:brightness-125`,
        soft: `${FLAT} border-transparent bg-[var(--surface-hover)] text-text hover:bg-[var(--surface-active)]`,
        ghost: 'bg-transparent text-foreground hover:bg-[var(--surface-hover)]',
        danger: `${FLAT} border-transparent bg-danger text-destructive-foreground hover:brightness-110`,
        overlay: `${FLAT} border-overlay-line bg-overlay text-on-scrim backdrop-blur-md hover:bg-overlay-hover`,
        link: 'bg-transparent text-foreground underline-offset-4 hover:underline',
        discord: `${FLAT} border-transparent bg-[#5865f2] text-accent-contrast hover:brightness-110`,
        subtle: 'bg-transparent text-text-muted hover:text-text',
        windowControl:
          'flex items-center justify-center bg-transparent text-foreground hover:bg-[var(--surface-hover)] active:bg-[var(--surface-active)]',
        windowClose:
          'flex items-center justify-center bg-transparent text-foreground hover:bg-danger hover:text-destructive-foreground active:bg-danger/85',
        row: 'flex w-full rounded-md bg-transparent text-left text-foreground transition-colors duration-[var(--duration-fast)] hover:bg-[var(--surface-hover)]',
        bare: '',
      },
      size: {
        xs: 'h-6 gap-1.5 px-2 text-xs',
        sm: 'h-7 gap-1.5 px-2.5 text-[0.8125rem]',
        md: 'h-8 gap-2 px-3 text-[0.8125rem]',
        lg: 'h-9 gap-2 px-3.5 text-sm',
        xl: 'h-11 gap-2.5 px-5 text-base font-semibold',
        none: '',
      },
      shape: {
        square: 'rounded-md',
        pill: 'rounded-full',
        joinsNext: 'rounded-l-md rounded-r-none',
        joinsPrevious: 'rounded-l-none rounded-r-md',
        bare: '',
      },
      isIconOnly: {
        true: 'px-0',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: [
          'primary',
          'glossy',
          'confirm',
          'secondary',
          'raised',
          'soft',
          'ghost',
          'danger',
          'overlay',
          'link',
          'subtle',
        ],
        class: 'shrink-0 items-center justify-center whitespace-nowrap',
      },
      {
        variant: [
          'primary',
          'glossy',
          'confirm',
          'secondary',
          'raised',
          'soft',
          'ghost',
          'danger',
          'overlay',
        ],
        class: 'coarse:min-h-11',
      },
      { isIconOnly: true, size: 'xs', class: 'size-6 coarse:size-11' },
      { isIconOnly: true, size: 'sm', class: 'size-7 coarse:size-11' },
      { isIconOnly: true, size: 'md', class: 'size-8 coarse:size-11' },
      { isIconOnly: true, size: 'lg', class: 'size-9 coarse:size-11' },
      { isIconOnly: true, size: 'xl', class: 'size-11' },
      { variant: 'bare', class: 'shadow-none active:translate-y-0' },
      {
        variant: ['bare', 'row', 'link', 'subtle'],
        class: 'hover-hover:hover:scale-100 active:scale-100',
      },
      { variant: ['ghost', 'link', 'overlay'], class: 'shadow-none' },
      {
        variant: ['windowControl', 'windowClose'],
        class:
          'rounded-none shadow-none hover-hover:hover:scale-100 active:translate-y-0 active:scale-100',
      },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      shape: 'square',
      isIconOnly: false,
    },
  },
);

export { buttonStyles };
