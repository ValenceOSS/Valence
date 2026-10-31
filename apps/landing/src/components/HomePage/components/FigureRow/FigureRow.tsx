import { Figure } from '@ValenceUI/Figure';

const FIGURES = [
  {
    of: 'yours',
    caption: 'Fig 0.1',
    title: 'Yours',
    body: 'Your library lives on your server, in your home, under your control.',
  },
  {
    of: 'media',
    caption: 'Fig 0.2',
    title: 'Every kind of media',
    body: 'Films, shows, music and books, kept together in one place.',
  },
  {
    of: 'share',
    caption: 'Fig 0.3',
    title: 'Built to share',
    body: 'Households link their servers and share libraries with each other.',
  },
] as const;

/**
 * Three things Valence is, side by side between thin rules, each a numbered line drawing above a
 * short title and one line saying what it means.
 */
const FigureRow = () => (
  <section aria-label="What Valence is" className="mx-auto max-w-7xl px-5 py-16 sm:px-10 sm:py-24">
    <ul className="grid divide-y divide-[var(--surface-line)] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
      {FIGURES.map((figure) => (
        <li
          key={figure.of}
          className="flex flex-col py-10 first:pt-0 last:pb-0 lg:px-8 lg:py-0 lg:first:pl-0 lg:last:pr-0"
        >
          <span className="font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-text-muted">
            {figure.caption}
          </span>
          <Figure of={figure.of} className="mx-auto mt-6 w-full max-w-[18rem] text-text-muted" />
          <h3 className="mt-10 text-base font-medium text-text">{figure.title}</h3>
          <p className="mt-2 max-w-[34ch] text-pretty leading-relaxed text-text-muted">
            {figure.body}
          </p>
        </li>
      ))}
    </ul>
  </section>
);

FigureRow.displayName = 'FigureRow';

export { FigureRow };
