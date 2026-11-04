import { useRef, useState } from 'react';
import { TagField } from '@ValenceUI/TagField';
import { TextField } from '@ValenceUI/TextField';
import { notify } from '@ValenceUI/notify';
import { useSavedSetting } from '@ValenceScreens/admin/useSavedSetting';
import { SourcedField } from '@ValenceScreens/components/AdminArea/components/SourcedField/SourcedField';
import { labelOfField } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/labelOfField';
import type { TitleField, TitleValue } from '@ValenceContracts/schemas/TitleEdit';
import type { MetadataFieldProps } from './MetadataField.types';
import { say } from '@ValenceI18n/say';

const TYPING_SETTLES_MS = 700;

const LONG: readonly TitleField[] = ['overview', 'note'];

const WORDS: readonly TitleField[] = ['genres', 'tags', 'studios', 'networks'];

const NUMBERS: readonly TitleField[] = ['rating', 'rottenTomatoes'];

const CLEARABLE_TO_NOTHING: readonly TitleField[] = ['title'];

/**
 * Reads a field's value as the text its field shows.
 *
 * @param value - The value.
 * @returns The text.
 */
const textOf = (value: TitleValue): string =>
  typeof value === 'string' ? value : typeof value === 'number' ? value.toString() : '';

/**
 * Reads what was typed into a field as the value it is saved as.
 *
 * @param field - The field.
 * @param typed - What was typed.
 * @returns The value.
 */
const valueOfTyped = (field: TitleField, typed: string): TitleValue => {
  const trimmed = typed.trim();

  if (NUMBERS.includes(field)) {
    const read = Number(trimmed);

    return trimmed === '' || Number.isNaN(read) ? null : read;
  }

  return trimmed === '' && !CLEARABLE_TO_NOTHING.includes(field) ? null : typed;
};

/**
 * One field of a title's Details tab: its control, saved as it changes, inside the frame that says
 * where its value came from and offers to put it back or lock it.
 *
 * @param field - The field.
 * @param kind - The kind of title it belongs to.
 * @param state - The field as the server has it.
 * @param change - Saves a change to the title.
 * @param onShowHistory - Opens the title's history.
 * @param className - Extra classes for the caller's own layout.
 */
const MetadataField = ({
  field,
  kind,
  state,
  change,
  onShowHistory,
  className,
}: MetadataFieldProps) => {
  const label = labelOfField(field, kind);
  const [isBusy, setBusy] = useState(false);
  const reason = useRef('');
  const isWords = WORDS.includes(field);

  const save = async (value: TitleValue): Promise<boolean> => {
    const outcome = await change({ set: { [field]: value } });

    reason.current = outcome.reason;

    return outcome.isSaved;
  };

  const [shown, setShown] = useSavedSetting<TitleValue>(state?.value ?? null, save, {
    done: say('screens.adminArea.titleDetails.saved'),
    failed: say('client.admin.fetchCorrections.thatCouldNotBeChanged'),
    delayMs: isWords ? 0 : TYPING_SETTLES_MS,
    tells: (isSaved) => {
      if (!isSaved) {
        notify.failed(reason.current);
      }
    },
  });

  const act = (request: Parameters<typeof change>[0]) => {
    setBusy(true);

    void change(request).then((outcome) => {
      setBusy(false);

      if (!outcome.isSaved) {
        notify.failed(outcome.reason);
      }
    });
  };

  const control = isWords ? (
    <TagField
      label={label}
      isLabelHidden
      values={Array.isArray(shown) ? shown : []}
      onValuesChange={(values) => {
        setShown(values);
      }}
    />
  ) : field === 'certifications' ? (
    <div className="grid gap-2 sm:grid-cols-2">
      {Object.entries(
        shown !== null && typeof shown === 'object' && !Array.isArray(shown) ? shown : {},
      ).map(([country, rating]) => (
        <TextField
          key={country}
          label={country}
          value={rating}
          onValueChange={(typed) => {
            const held =
              shown !== null && typeof shown === 'object' && !Array.isArray(shown) ? shown : {};

            setShown({ ...held, [country]: typed });
          }}
        />
      ))}
    </div>
  ) : (
    <TextField
      label={label}
      isLabelHidden
      value={textOf(shown)}
      type={field === 'releaseDate' ? 'date' : NUMBERS.includes(field) ? 'number' : 'text'}
      {...(LONG.includes(field) ? { rows: field === 'note' ? 3 : 6 } : {})}
      {...(field === 'rating' ? { min: 0, max: 10 } : {})}
      {...(field === 'rottenTomatoes' ? { min: 0, max: 100 } : {})}
      onValueChange={(typed) => {
        setShown(valueOfTyped(field, typed));
      }}
    />
  );

  return (
    <SourcedField
      label={label}
      state={state}
      isBusy={isBusy}
      {...(className === undefined ? {} : { className })}
      {...(onShowHistory === undefined ? {} : { onShowHistory })}
      onReset={() => {
        act({ reset: [field] });
      }}
      onLock={() => {
        act({ lock: [field] });
      }}
      onUseCatalogue={() => {
        act({ set: { [field]: state?.catalogue ?? null } });
      }}
    >
      {control}
    </SourcedField>
  );
};

MetadataField.displayName = 'MetadataField';

export { MetadataField };
