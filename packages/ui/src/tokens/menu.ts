const MENU = {
  content: [
    'z-50 valence-menu min-w-52 overflow-hidden rounded-[1.25rem] p-2 text-sm text-text outline-none',
    'coarse:min-w-72 coarse:p-2.5 coarse:text-base',
  ].join(' '),
  group: 'relative z-10 flex flex-col',
  groupAfterFirst: 'mt-2 border-t border-[var(--surface-line)] pt-2',
  label: 'px-3 pb-1 pt-2 text-[0.8125rem] font-medium text-text-muted',
  stickyLabel: [
    'sticky top-0 z-30 px-3 pb-1 pt-2',
    'bg-[var(--menu-surface)] text-[0.8125rem] font-medium text-text-muted',
  ].join(' '),
  item: [
    'flex min-h-9 cursor-default items-center gap-3 rounded-[0.625rem] px-3 py-1.5 outline-none',
    'coarse:gap-4 coarse:px-4 coarse:py-3.5',
    'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40',
  ].join(' '),
  itemDestructive: 'text-danger',
  itemPlain: 'text-text',
  marker: 'flex w-3.5 shrink-0 items-center justify-center text-text',
  dot: 'size-1.5 rounded-full bg-current',
  icon: 'flex size-4 shrink-0 items-center justify-center text-text coarse:size-5',
  itemLabel: 'flex-1 truncate text-left',
  detail: 'shrink-0 pl-4 text-[0.8125rem] text-text-muted',
  hint: 'flex shrink-0 items-center text-text-muted',
} as const;

export { MENU };
