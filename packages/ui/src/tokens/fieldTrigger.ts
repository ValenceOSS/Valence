const FIELD_TRIGGER = {
  base: [
    'w-full justify-between gap-2 rounded-md px-2.5 text-[0.8125rem] font-medium',
    'border border-[var(--surface-line)] bg-[var(--surface-hover)] text-text',
    'hover:bg-[var(--surface-active)]',
  ].join(' '),
  sm: 'h-7',
  md: 'h-8',
} as const;

export { FIELD_TRIGGER };
