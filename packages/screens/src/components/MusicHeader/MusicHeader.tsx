import type { MusicHeaderProps } from './MusicHeader.types';

/**
 * The top of an album's, an artist's or a playlist's page: its picture, what kind of thing it is,
 * its name set large, a line about it, and the buttons that play it — all on a wash of the colour
 * of its picture, fading into the page, so each record's page feels like that record.
 *
 * @param eyebrow - What kind of thing it is.
 * @param title - Its name.
 * @param artwork - Its picture.
 * @param tint - The colour to wash the top of the page in, or nothing for the page's own.
 * @param details - A line about it.
 * @param actions - The buttons that play it and do things with it.
 */
const MusicHeader = ({ eyebrow, title, artwork, tint, details, actions }: MusicHeaderProps) => (
  <header
    className="relative flex flex-col gap-5 px-5 pt-8 pb-5 transition-[background] duration-700 sm:px-8"
    style={
      tint === null
        ? undefined
        : {
            backgroundImage: `linear-gradient(180deg, color-mix(in oklab, ${tint} 72%, transparent) 0%, color-mix(in oklab, ${tint} 28%, transparent) 62%, transparent 100%)`,
          }
    }
  >
    <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-end">
      <div className="w-40 shrink-0 shadow-2xl sm:w-48 lg:w-56">{artwork}</div>

      <div className="flex min-w-0 flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-text">
          {eyebrow}
        </span>
        <h1 className="break-words text-[clamp(2rem,5.5vw,4.75rem)] font-bold leading-[0.95] tracking-[-0.04em] text-text">
          {title}
        </h1>
        {details === undefined ? null : (
          <div className="flex flex-wrap items-center gap-x-1.5 text-sm text-text-muted">
            {details}
          </div>
        )}
      </div>
    </div>

    {actions === undefined ? null : (
      <div className="flex flex-wrap items-center gap-3">{actions}</div>
    )}
  </header>
);

MusicHeader.displayName = 'MusicHeader';

export { MusicHeader };
