import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { FormField } from '@ValenceUI/FormField';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { SelectField } from '@ValenceUI/SelectField';
import { TagField } from '@ValenceUI/TagField';
import { TextField } from '@ValenceUI/TextField';
import { CERTIFICATE_AGES } from '@ValenceCore/constants/CERTIFICATE_AGES';
import { labelOfField } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/labelOfField';
import { textOfValue } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/textOfValue';
import { valueOfTyped } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/valueOfTyped';
import { describeRatingAge } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/components/ContentRatingField/describeRatingAge';
import { regionName } from '@ValenceScreens/live/regionName';
import { z } from 'zod';
import type { TitleField } from '@ValenceContracts/schemas/TitleEdit';
import type { BulkFieldProps } from './BulkField.types';
import { say } from '@ValenceI18n/say';

const WORDS: readonly TitleField[] = ['genres', 'tags', 'studios', 'networks'];

const LONG: readonly TitleField[] = ['overview', 'note'];

const NUMBERS: readonly TitleField[] = ['rating', 'rottenTomatoes'];

const CertificationsSchema = z.record(z.string(), z.string()).catch({});

const WordsSchema = z.array(z.string()).catch([]);

const UNCHOSEN = '~';

/**
 * One field of the bulk editor: what every chosen title holds in it, or that they differ, and what
 * is to be done to it on all of them — a value typed in, words added, taken away or put in place of
 * the rest, the field emptied, put back to the catalogue's value, or, for the sort title, filled in
 * from each title. A field left alone is not sent; one touched can be let alone again.
 *
 * @param field - The field.
 * @param kind - The kind of title, for what the field is called.
 * @param state - How the chosen titles hold it, or nothing before the server has said.
 * @param touch - What is to be done to it, where anything is.
 * @param onTouch - Told what is now to be done to it, or that it is to be let alone.
 * @param region - The server's own country, whose content rating is set.
 * @param suggestions - The words in use in the library, for a list of words.
 * @param className - Extra classes for the caller's own layout.
 */
const BulkField = ({
  field,
  kind,
  state,
  touch,
  onTouch,
  region,
  suggestions,
  className,
}: BulkFieldProps) => {
  const label = labelOfField(field, kind);
  const isMixed = state?.isMixed === true;
  const shared = isMixed ? null : (state?.value ?? null);
  const mixedWord = say('screens.adminArea.mediaPanel.mixed');
  const said =
    touch?.kind === 'clear'
      ? say('screens.adminArea.bulkField.clearedOnEveryTitle')
      : touch?.kind === 'reset'
        ? say('screens.adminArea.bulkField.putBackOnEveryTitle')
        : touch?.kind === 'fromTitle'
          ? say('screens.adminArea.bulkField.filledFromEachTitle')
          : null;
  const known = CERTIFICATE_AGES[region];
  const sharedRating = CertificationsSchema.parse(shared ?? {})[region] ?? '';

  const control =
    said !== null ? (
      <p className="flex h-8 items-center text-[0.8125rem] text-text-muted">{said}</p>
    ) : field === 'sortTitle' ? (
      <p className="flex h-8 items-center text-[0.8125rem] text-text-muted">
        {isMixed ? mixedWord : textOfValue(shared) || mixedWord}
      </p>
    ) : WORDS.includes(field) ? (
      <div className="flex flex-col gap-2">
        <SegmentedRow
          label={say('screens.adminArea.bulkField.whatToDoWithTheWords')}
          size="xs"
          items={[
            { id: 'add', label: say('common.add') },
            { id: 'remove', label: say('common.forget') },
            { id: 'replace', label: say('common.replace') },
          ]}
          value={touch?.kind === 'words' ? touch.how : 'add'}
          onSelect={(how) => {
            const words = touch?.kind === 'words' ? touch.words : [];

            onTouch({
              kind: 'words',
              how: how === 'remove' ? 'remove' : how === 'replace' ? 'replace' : 'add',
              words:
                how === 'replace' && words.length === 0 ? WordsSchema.parse(shared ?? []) : words,
            });
          }}
        />
        <TagField
          label={label}
          isLabelHidden
          values={touch?.kind === 'words' ? touch.words : []}
          placeholder={
            isMixed
              ? mixedWord
              : WordsSchema.parse(shared ?? []).join(', ') ||
                say('screens.adminArea.bulkField.noneYet')
          }
          onValuesChange={(words) => {
            onTouch({ kind: 'words', how: touch?.kind === 'words' ? touch.how : 'add', words });
          }}
          {...(suggestions === undefined ? {} : { suggestions })}
        />
      </div>
    ) : field === 'certifications' ? (
      known === undefined ? (
        <TextField
          label={regionName(region)}
          isLabelHidden
          value={touch?.kind === 'rating' ? (touch.rating ?? '') : sharedRating}
          placeholder={isMixed ? mixedWord : ''}
          onValueChange={(typed) => {
            onTouch({ kind: 'rating', rating: typed.trim() === '' ? null : typed.trim() });
          }}
        />
      ) : (
        <SelectField
          label={regionName(region)}
          isLabelHidden
          value={
            touch?.kind === 'rating' ? (touch.rating ?? '') : isMixed ? UNCHOSEN : sharedRating
          }
          placeholder={mixedWord}
          options={[
            { id: '', label: say('screens.adminArea.contentRatingField.noRating') },
            ...Object.keys(known).flatMap((rating) => {
              const age = describeRatingAge(region, rating);

              return age === null ? [] : [{ id: rating, label: rating, detail: age }];
            }),
          ]}
          onSelect={(rating) => {
            onTouch({ kind: 'rating', rating: rating === '' ? null : rating });
          }}
        />
      )
    ) : (
      <TextField
        label={label}
        isLabelHidden
        value={touch?.kind === 'set' ? textOfValue(touch.value) : textOfValue(shared)}
        placeholder={isMixed ? mixedWord : ''}
        type={
          field === 'releaseDate' || field === 'addedAt'
            ? 'date'
            : NUMBERS.includes(field)
              ? 'number'
              : 'text'
        }
        {...(LONG.includes(field) ? { rows: 1, isGrowing: true } : {})}
        {...(field === 'rating' ? { unit: '/ 10', min: 0, max: 10 } : {})}
        {...(field === 'rottenTomatoes' ? { unit: '%', min: 0, max: 100 } : {})}
        onValueChange={(typed) => {
          onTouch({ kind: 'set', value: valueOfTyped(field, typed) });
        }}
      />
    );

  return (
    <FormField
      label={
        field === 'certifications'
          ? say('screens.adminArea.titleDetails.contentRatingIn', { country: regionName(region) })
          : label
      }
      {...(className === undefined ? {} : { className })}
      aside={
        <span className="ms-auto flex items-center gap-1.5">
          {isMixed && touch === undefined ? <Badge size="sm">{mixedWord}</Badge> : null}
          {touch === undefined ? null : (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                onTouch(undefined);
              }}
            >
              {say('screens.adminArea.bulkField.doNotChange')}
            </Button>
          )}
          <ActionMenu
            label={say('common.moreForName', { name: label })}
            size="sm"
            align="end"
            groups={[
              {
                items: [
                  ...(field === 'sortTitle'
                    ? [
                        {
                          id: 'from-title',
                          label: say('screens.adminArea.bulkField.fromTitle'),
                          onChoose: () => {
                            onTouch({ kind: 'fromTitle' });
                          },
                        },
                      ]
                    : []),
                  {
                    id: 'clear',
                    label: say('common.clear'),
                    onChoose: () => {
                      onTouch({ kind: 'clear' });
                    },
                  },
                  {
                    id: 'reset',
                    label: say('screens.jobRunner.describeJobGroup.reset'),
                    onChoose: () => {
                      onTouch({ kind: 'reset' });
                    },
                  },
                ],
              },
            ]}
          />
        </span>
      }
    >
      {control}
    </FormField>
  );
};

BulkField.displayName = 'BulkField';

export { BulkField };
