import type { PromiseCardProps } from './PromiseCard.types';

/**
 * One thing that keeps a plugin safe, as a small card: a mark, a short name for the promise, and a
 * line saying what it means.
 *
 * @param title - The promise, in a few words.
 * @param text - What it means, in one line.
 * @param glyph - The mark drawn above it.
 */
const PromiseCard = ({ title, text, glyph: Glyph }: PromiseCardProps) => (
  <div className="valence-surface valence-surface--flat flex h-full flex-col gap-3 rounded-3xl p-6">
    <span
      aria-hidden
      className="flex size-10 items-center justify-center rounded-xl border border-[var(--surface-line)] bg-[var(--surface-hover)] text-text"
    >
      <Glyph size={20} />
    </span>

    <h3 className="text-base font-semibold text-text">{title}</h3>
    <p className="text-sm leading-relaxed text-text-muted">{text}</p>
  </div>
);

PromiseCard.displayName = 'PromiseCard';

export { PromiseCard };
