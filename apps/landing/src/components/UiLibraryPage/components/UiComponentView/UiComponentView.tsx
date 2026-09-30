import { RevealItem } from '@ValenceUI/RevealItem';
import { UiBuiltOn } from '@ValenceLanding/components/UiLibraryPage/components/UiBuiltOn/UiBuiltOn';
import { UiPropsTable } from '@ValenceLanding/components/UiLibraryPage/components/UiPropsTable/UiPropsTable';
import { splitInlineCode } from '@ValenceLanding/components/UiLibraryPage/splitInlineCode';
import type { UiComponentViewProps } from './UiComponentView.types';

const HEADING = 'text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-text-muted';

/**
 * One component in the UI library: its name and what it is for, each of its examples drawn live in a
 * panel of its own, the props it takes, and the libraries it is built on. The theme toggle in the bar switches the examples between
 * light and dark with the rest of the site.
 *
 * @param doc - What the component documents about itself.
 * @param group - The group it is listed under.
 * @param examples - Its examples.
 */
const UiComponentView = ({ doc, group, examples }: UiComponentViewProps) => (
  <article aria-labelledby="ui-component-name" className="flex flex-col gap-10">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-2xl flex-col gap-2">
        <span className={HEADING}>{group}</span>
        <h1 id="ui-component-name" className="text-4xl font-semibold tracking-tight text-text">
          {doc.name}
        </h1>
        {doc.summary === '' ? null : (
          <p className="text-base leading-relaxed text-text-muted">
            {splitInlineCode(doc.summary).map((part, at) =>
              part.isCode ? (
                <code key={at} className="font-mono text-[0.9em] text-text">
                  {part.text}
                </code>
              ) : (
                <span key={at}>{part.text}</span>
              ),
            )}
          </p>
        )}
        <UiBuiltOn doc={doc} />
      </div>
    </header>

    <section aria-label="Examples" className="flex flex-col gap-4">
      <h2 className={HEADING}>Examples</h2>

      <ul className="flex flex-col gap-4">
        {examples.map((example, index) => (
          <RevealItem key={example.title} index={index}>
            <figure className="valence-card-shell flex flex-col">
              <figcaption className="px-3 pb-2 pt-2.5 text-sm font-medium text-text">
                {example.title}
              </figcaption>
              <div className="valence-card-face overflow-x-auto p-6">{example.render()}</div>
            </figure>
          </RevealItem>
        ))}
      </ul>
    </section>

    <section aria-label="Props" className="flex flex-col gap-4">
      <h2 className={HEADING}>Props</h2>
      <UiPropsTable doc={doc} />
    </section>
  </article>
);

UiComponentView.displayName = 'UiComponentView';

export { UiComponentView };
