import { ArrowUpRight as ArrowUpRightIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { Link } from '@ValenceUI/Link';
import type { UiBuiltOnProps } from './UiBuiltOn.types';

/**
 * Says which third-party libraries a component is built on, each a link to where that library
 * documents its props, so anything a component passes through can be looked up at its source.
 * A component built on nothing but the platform says nothing.
 *
 * @param doc - What the component documents about itself.
 */
const UiBuiltOn = ({ doc }: UiBuiltOnProps) =>
  doc.builtOn.length === 0 ? null : (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-muted">
      <span>Built on</span>
      {doc.builtOn.map((library, at) => (
        <span key={library.url} className="flex items-center gap-2">
          {at === 0 ? null : <span aria-hidden>·</span>}
          <Link
            href={library.url}
            className="inline-flex items-center gap-0.5 font-medium text-text-muted decoration-text-muted/40 hover:text-text"
          >
            {library.name}
            <Icon of={ArrowUpRightIcon} size={13} />
          </Link>
        </span>
      ))}
      {doc.inherits.length === 0 ? null : <span>— props not listed here pass through to it.</span>}
    </p>
  );

UiBuiltOn.displayName = 'UiBuiltOn';

export { UiBuiltOn };
