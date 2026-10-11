const TABLE_LOOKS = {
  well: 'valence-well m-2 flex flex-col overflow-hidden rounded-xl border-[color-mix(in_oklab,var(--color-text)_13%,transparent)]!',
  band: 'bg-[color-mix(in_oklab,var(--card-face)_93%,var(--color-text))]',
  body: 'bg-surface bg-[linear-gradient(var(--card-shell),var(--card-shell))]',
} as const;

export { TABLE_LOOKS };
