import { Badge } from '@ValenceUI/Badge';
import type { UiPropsTableProps } from './UiPropsTable.types';

const CELL = 'px-4 py-3 align-top';

/**
 * Every prop a component takes, as it documents them: the name, whether it must be given, its type —
 * spelled out as the values it accepts where it is one of a few words — its default, and what it is
 * for. Anything the props inherit from elsewhere, such as a native button's attributes, is named
 * under the table rather than listed out.
 *
 * @param doc - What the component documents about itself.
 */
const UiPropsTable = ({ doc }: UiPropsTableProps) => (
  <div className="flex flex-col gap-3">
    {doc.props.length === 0 ? (
      <p className="text-sm text-text-muted">{doc.name} takes no props of its own.</p>
    ) : (
      <div className="overflow-x-auto rounded-xl border border-[var(--surface-line)]">
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <caption className="sr-only">Props of {doc.name}</caption>
          <thead className="bg-[var(--surface-hover)] text-[0.6875rem] uppercase tracking-[0.14em] text-text-muted">
            <tr>
              <th scope="col" className={CELL}>
                Prop
              </th>
              <th scope="col" className={CELL}>
                Type
              </th>
              <th scope="col" className={CELL}>
                Default
              </th>
              <th scope="col" className={CELL}>
                What it is for
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--surface-line)]">
            {doc.props.map((prop) => (
              <tr key={prop.name}>
                <th scope="row" className={CELL}>
                  <span className="flex flex-wrap items-center gap-2">
                    <code className="font-mono text-[0.8125rem] font-semibold text-text">
                      {prop.name}
                    </code>
                    {prop.isRequired ? (
                      <Badge tone="accent" size="sm">
                        Required
                      </Badge>
                    ) : null}
                  </span>
                </th>
                <td className={CELL}>
                  {prop.values.length === 0 ? (
                    <code className="font-mono text-[0.8125rem] text-text-muted">{prop.type}</code>
                  ) : (
                    <span className="flex flex-wrap gap-1">
                      {prop.values.map((value) => (
                        <code
                          key={value}
                          className="rounded-md bg-[var(--surface-hover)] px-1.5 py-0.5 font-mono text-xs text-text"
                        >
                          {value}
                        </code>
                      ))}
                    </span>
                  )}
                </td>
                <td className={CELL}>
                  {prop.defaultValue === null ? (
                    <span className="text-text-muted">—</span>
                  ) : (
                    <code className="font-mono text-[0.8125rem] text-text">
                      {prop.defaultValue}
                    </code>
                  )}
                </td>
                <td className={`${CELL} text-text-muted`}>{prop.description ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {doc.inherits.length === 0 ? null : (
      <p className="text-sm text-text-muted">
        Also takes everything from{' '}
        {doc.inherits.map((inherited, at) => (
          <span key={inherited}>
            {at === 0 ? '' : ', '}
            <code className="font-mono text-[0.8125rem] text-text">{inherited}</code>
          </span>
        ))}
        .
      </p>
    )}
  </div>
);

UiPropsTable.displayName = 'UiPropsTable';

export { UiPropsTable };
