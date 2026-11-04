import { useRef, useState } from 'react';
import { TagField } from '@ValenceUI/TagField';
import { textOfValue } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/textOfValue';
import { Link } from '@ValenceUI/Link';
import { addressOfId } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/addressOfId';
import { ContentRatingField } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/components/ContentRatingField/ContentRatingField';
import { TextField } from '@ValenceUI/TextField';
import { notify } from '@ValenceUI/notify';
import { useSavedSetting } from '@ValenceScreens/admin/useSavedSetting';
import { SourcedField } from '@ValenceScreens/components/AdminArea/components/SourcedField/SourcedField';
import { labelOfField } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/labelOfField';
import type { TitleField, TitleValue } from '@ValenceContracts/schemas/TitleEdit';
import type { MetadataFieldProps } from './MetadataField.types';
import { say } from '@ValenceI18n/say';

const TYPING_SETTLES_MS = 700;

const SCALE = 'w-8 text-right text-sm tabular-nums text-text-muted';

const LONG: readonly TitleField[] = ['overview', 'note'];

const WORDS: readonly TitleField[] = ['genres', 'tags', 'studios', 'networks'];

const NUMBERS: readonly TitleField[] = ['rating', 'rottenTomatoes'];

const CLEARABLE_TO_NOTHING: readonly TitleField[] = ['title'];

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
 * @param suggestions - The words in use elsewhere, offered as a list field is typed in.
 * @param region - The server's own country, whose content rating decides ages.
 * @param placeholder - What an empty text field shows, such as what a title sorts as without one.
 * @param isCard - Whether it stands as a card of its own, for a field with nothing beside it.
 * @param className - Extra classes for the caller's own layout.
 */
const MetadataField = ({
  field,
  kind,
  state,
  change,
  onShowHistory,
  suggestions,
  region = 'GB',
  placeholder,
  isCard = false,
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
      {...(suggestions === undefined ? {} : { suggestions })}
    />
  ) : field === 'certifications' ? (
    <ContentRatingField
      ratings={shown !== null && typeof shown === 'object' && !Array.isArray(shown) ? shown : {}}
      region={region}
      onRatingsChange={(ratings) => {
        setShown(ratings);
      }}
    />
  ) : (
    <TextField
      label={label}
      isLabelHidden
      value={textOfValue(shown)}
      type={field === 'releaseDate' ? 'date' : NUMBERS.includes(field) ? 'number' : 'text'}
      {...(placeholder === undefined ? {} : { placeholder })}
      {...(LONG.includes(field) ? { rows: field === 'note' ? 3 : 6 } : {})}
      {...(field === 'rating' ? { min: 0, max: 10 } : {})}
      {...(field === 'rottenTomatoes' ? { min: 0, max: 100 } : {})}
      {...(field === 'rating'
        ? { trailing: <span className={SCALE}>/ 10</span> }
        : field === 'rottenTomatoes'
          ? { trailing: <span className={SCALE}>%</span> }
          : {})}
      onValueChange={(typed) => {
        setShown(valueOfTyped(field, typed));
      }}
    />
  );

  const address =
    (field === 'imdbId' || field === 'tvdbId') && typeof shown === 'string'
      ? addressOfId(field, shown, kind === 'show')
      : null;
  const shownControl =
    address === null ? (
      control
    ) : (
      <span className="flex items-center gap-3 [&>:first-child]:min-w-0 [&>:first-child]:flex-1">
        {control}
        <Link
          href={address}
          label={say('screens.adminArea.titleDetails.openOnSite', { site: label })}
          className="shrink-0 text-sm"
        >
          {say('common.open')}
        </Link>
      </span>
    );

  return (
    <SourcedField
      label={label}
      isCard={isCard}
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
      {shownControl}
    </SourcedField>
  );
};

MetadataField.displayName = 'MetadataField';

export { MetadataField };
