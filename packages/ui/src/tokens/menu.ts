const MENU = {
  content: [
    'z-50 valence-menu min-w-44 overflow-hidden rounded-lg p-1 text-[0.8125rem] text-text outline-none',
    'coarse:min-w-72 coarse:p-2 coarse:text-base',
  ].join(' '),
  group: 'relative z-10 flex flex-col',
  groupAfterFirst: 'mt-1 border-t border-[var(--surface-line)] pt-1',
  label: 'px-2.5 pb-1 pt-1.5 text-xs font-medium text-text-muted',
  stickyLabel: [
    'sticky top-0 z-30 mb-1 border-b border-[var(--surface-line)] px-2.5 pb-1.5 pt-1',
    'bg-[var(--menu-surface)] text-[0.6875rem] font-medium text-text-muted',
  ].join(' '),
  item: [
    'flex cursor-default items-center gap-2.5 rounded-md px-2.5 py-1.5 font-medium outline-none',
    'coarse:gap-4 coarse:px-4 coarse:py-3.5',
    'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40',
  ].join(' '),
  itemDestructive: 'text-danger',
  itemPlain: 'text-text',
  icon: 'flex size-4 shrink-0 items-center justify-center text-text-muted coarse:size-5',
  itemLabel: 'flex-1 truncate text-left',
  detail: 'shrink-0 text-xs text-text-muted',
  hint: 'flex shrink-0 items-center text-text-muted',
} as const;

export { MENU };
