import { useState } from 'react';
import { TagField } from '@ValenceUI/TagField';
import { textOfValue } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/textOfValue';
import { OpenOnSite } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/components/OpenOnSite/OpenOnSite';
import { addressOfId } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/addressOfId';
import { ContentRatingField } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/components/ContentRatingField/ContentRatingField';
import { TextField } from '@ValenceUI/TextField';
import { placeholderOf } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/placeholderOf';
import { DateField } from '@ValenceScreens/components/DateField/DateField';
import { notify } from '@ValenceUI/notify';
import { WORD_FIELDS } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/WORD_FIELDS';
import { SourcedField } from '@ValenceScreens/components/AdminArea/components/SourcedField/SourcedField';
import { labelOfField } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/labelOfField';
import type { TitleField } from '@ValenceContracts/schemas/TitleEdit';
import type { MetadataFieldProps } from './MetadataField.types';
import { regionName } from '@ValenceScreens/live/regionName';
import { valueOfTyped } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/valueOfTyped';
import { say } from '@ValenceI18n/say';

const LONG: readonly TitleField[] = ['overview', 'note'];

const NUMBERS: readonly TitleField[] = ['rating', 'rottenTomatoes'];

const TRAILER = /^[A-Za-z0-9_-]{11}$/u;

/**
 * One field of a title's Details tab: its control, held still while the field is locked so it
 * cannot be changed until it is unlocked from its menu, showing what the form holds and telling the form
 * of every change, inside the frame that says where its value came from and offers to put it back or
 * lock it.
 *
 * @param field - The field.
 * @param kind - The kind of title it belongs to.
 * @param state - The field as the server has it.
 * @param value - What the field holds now, which may be ahead of the server while it saves.
 * @param onValueChange - Told each change, for the form to hold and save.
 * @param change - Changes the title, for putting a field back, locking it or taking the catalogue's.
 * @param onShowHistory - Opens the title's history.
 * @param suggestions - The words in use elsewhere, offered as a list field is typed in.
 * @param region - The server's own country, whose content rating decides ages.
 * @param isLabelHidden - Whether the label is only read out, for a field alone in a section named
 *   for it.
 * @param placeholder - What an empty text field shows, such as what a title sorts as without one.
 * @param className - Extra classes for the caller's own layout.
 */
const MetadataField = ({
  field,
  kind,
  state,
  value: shown,
  onValueChange: setShown,
  change,
  onShowHistory,
  suggestions,
  region = 'GB',
  placeholder,
  isLabelHidden = false,
  className,
}: MetadataFieldProps) => {
  const label =
    field === 'certifications'
      ? say('screens.adminArea.titleDetails.contentRatingIn', { country: regionName(region) })
      : labelOfField(field, kind);
  const [isBusy, setBusy] = useState(false);
  const isWords = WORD_FIELDS.includes(field);
  const isLocked = state?.source === 'locked';
  const hint = placeholder ?? placeholderOf(field);

  const act = (request: Parameters<typeof change>[0]) => {
    setBusy(true);

    void change(request).then((outcome) => {
      setBusy(false);

      if (!outcome.isSaved) {
        notify.failed(outcome.reason);
      }
    });
  };

  const address =
    typeof shown !== 'string'
      ? null
      : field === 'imdbId' || field === 'tvdbId' || field === 'anilistId' || field === 'malId'
        ? addressOfId(field, shown, kind === 'show')
        : field === 'trailer' && TRAILER.test(shown)
          ? `https://www.youtube.com/watch?v=${shown}`
          : null;
  const control = isWords ? (
    <TagField
      label={label}
      isLabelHidden
      disabled={isLocked}
      {...(hint === undefined ? {} : { placeholder: hint })}
      values={Array.isArray(shown) ? shown.filter((one) => typeof one === 'string') : []}
      onValuesChange={(values) => {
        setShown(field === 'countries' ? values.map((one) => one.trim().toUpperCase()) : values);
      }}
      {...(suggestions === undefined ? {} : { suggestions })}
    />
  ) : field === 'certifications' ? (
    <ContentRatingField
      ratings={shown !== null && typeof shown === 'object' && !Array.isArray(shown) ? shown : {}}
      region={region}
      isDisabled={isLocked}
      onRatingsChange={(ratings) => {
        setShown(ratings);
      }}
    />
  ) : field === 'releaseDate' || field === 'addedAt' ? (
    <DateField
      label={label}
      isLabelHidden
      isDisabled={isLocked}
      {...(hint === undefined ? {} : { placeholder: hint })}
      value={textOfValue(shown)}
      onValueChange={(picked) => {
        setShown(valueOfTyped(field, picked));
      }}
    />
  ) : (
    <TextField
      label={label}
      isLabelHidden
      value={textOfValue(shown)}
      type={NUMBERS.includes(field) ? 'number' : 'text'}
      disabled={isLocked}
      {...(hint === undefined ? {} : { placeholder: hint })}
      {...(LONG.includes(field) ? { rows: field === 'note' ? 1 : 3, isGrowing: true } : {})}
      {...(field === 'rating' ? { min: 0, max: 10 } : {})}
      {...(field === 'rottenTomatoes' ? { min: 0, max: 100 } : {})}
      {...(field === 'rating' ? { unit: '/ 10' } : field === 'rottenTomatoes' ? { unit: '%' } : {})}
      {...(address === null
        ? {}
        : {
            inside: (
              <OpenOnSite
                href={address}
                label={say('screens.adminArea.titleDetails.openOnSite', { site: label })}
              />
            ),
          })}
      onValueChange={(typed) => {
        setShown(valueOfTyped(field, typed));
      }}
    />
  );

  return (
    <SourcedField
      label={label}
      isLabelHidden={isLabelHidden}
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
