const MENU = {
  content: [
    'z-50 valence-float min-w-56 overflow-hidden rounded-lg p-1.5 text-sm text-text outline-none',
    'coarse:min-w-72 coarse:p-2 coarse:text-base',
  ].join(' '),
  group: 'relative z-10 flex flex-col',
  groupAfterFirst: 'mt-1.5 border-t border-[var(--surface-line)] pt-1.5',
  label: 'px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-text-muted',
  item: [
    'flex cursor-default items-center gap-3 rounded-sm px-3 py-2.5 outline-none',
    'coarse:gap-4 coarse:px-4 coarse:py-3.5',
    'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40',
  ].join(' '),
  itemDestructive: 'bg-danger text-destructive-foreground hover:brightness-110',
  itemPlain: 'text-text',
  icon: 'flex size-4 shrink-0 items-center justify-center coarse:size-5',
  itemLabel: 'flex-1 truncate text-left',
  detail: 'shrink-0 text-xs text-text-muted',
} as const;

export { MENU };
