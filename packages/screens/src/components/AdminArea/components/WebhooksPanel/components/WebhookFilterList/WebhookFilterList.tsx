import { useMemo, useState } from 'react';
import { Search as SearchIcon } from '@keyline-icons/react';
import { Icon } from '@ValenceUI/Icon';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import { say } from '@ValenceI18n/say';
import type { WebhookFilterListProps } from './WebhookFilterList.types';

const EVERYONE = 'everyone';

const SOME = 'some';

/**
 * One allowlist on a subscription: everybody, or a list of names.
 *
 * There are two states and the control has two segments, which is the whole of it. A tick-everything
 * button cannot express this, because an empty list already means everybody — pressing it a second
 * time has nothing left to do, which reads as a button that does not work.
 *
 * Saying what each list decides is the reason there are several of them rather than one wall of
 * names. An operator picking faces is choosing whose viewing gets reported; an operator picking
 * accounts is choosing whose sign-ins do. Those are different questions about different people.
 *
 * Everybody is stored as an empty list rather than as a list of today's names, so that somebody added
 * tomorrow is included too.
 *
 * @param title - What this list is of.
 * @param governs - Which events it decides, said plainly.
 * @param choices - What can be picked.
 * @param chosen - What is picked, empty meaning everybody.
 * @param nothingToChoose - What to say where there is nothing to pick from at all.
 * @param onChange - Told the new selection.
 */
const WebhookFilterList = ({
  title,
  governs,
  choices,
  chosen,
  nothingToChoose,
  onChange,
}: WebhookFilterListProps) => {
  const [isPicking, setIsPicking] = useState(chosen.length > 0);
  const [search, setSearch] = useState('');

  const shown = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (query === '') {
      return choices;
    }

    return choices.filter((choice) => choice.label.toLowerCase().includes(query));
  }, [choices, search]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-text">{title}</span>
        <span className="text-xs text-text-muted">{governs}</span>
      </div>

      {choices.length === 0 ? (
        <span className="text-xs text-text-muted">{nothingToChoose}</span>
      ) : (
        <>
          <SegmentedRow
            label={say('admin.webhookFilterList.which', { what: title.toLowerCase() })}
            tone="accent"
            size="sm"
            items={[
              { id: EVERYONE, label: say('admin.webhookFilterList.everybody') },
              { id: SOME, label: say('admin.webhookFilterList.onlyThese') },
            ]}
            value={isPicking ? SOME : EVERYONE}
            onSelect={(id) => {
              setIsPicking(id === SOME);

              if (id === EVERYONE) {
                onChange([]);
              }
            }}
          />

          {!isPicking ? null : (
            <div className="flex flex-col gap-2 pt-1">
              <TextField
                label={say('admin.webhookFilterList.findIn', { what: title.toLowerCase() })}
                isLabelHidden
                type="search"
                value={search}
                onValueChange={setSearch}
                placeholder={say('admin.webhookFilterList.findIn', { what: title.toLowerCase() })}
                icon={<Icon of={SearchIcon} size={15} />}
              />

              {shown.length === 0 ? (
                <p className="text-sm text-text-muted">
                  {say('admin.webhookFilterList.nothingMatches')}
                </p>
              ) : (
                <ul
                  role="group"
                  aria-label={title}
                  className="flex flex-col divide-y divide-[var(--surface-line)]"
                >
                  {shown.map((choice) => (
                    <li key={choice.id} className="flex items-center justify-between gap-4 py-2">
                      <span className="min-w-0 truncate text-sm text-text">{choice.label}</span>

                      <Switch
                        label={choice.label}
                        isLabelHidden
                        isOn={chosen.includes(choice.id)}
                        onToggle={() => {
                          onChange(
                            chosen.includes(choice.id)
                              ? chosen.filter((held) => held !== choice.id)
                              : [...chosen, choice.id],
                          );
                        }}
                        className="shrink-0"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

WebhookFilterList.displayName = 'WebhookFilterList';

export { WebhookFilterList };
