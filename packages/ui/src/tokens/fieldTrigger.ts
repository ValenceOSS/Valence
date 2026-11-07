import { FIELD_SURFACE } from '@ValenceUI/tokens/FIELD_SURFACE';
import { FIELD_DISABLED } from '@ValenceUI/tokens/FIELD_DISABLED';

const FIELD_TRIGGER = {
  base: [
    'w-full justify-between gap-2 px-3 text-[0.8125rem] font-medium text-text',
    FIELD_SURFACE,
    FIELD_DISABLED,
    'hover:bg-[var(--surface-active)]',
  ].join(' '),
  sm: 'h-7',
  md: 'h-8',
} as const;

export { FIELD_TRIGGER };
