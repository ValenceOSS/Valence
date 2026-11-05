import { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { BULK_TITLES_AT_ONCE, REPLACEABLE_FIELDS } from '@ValenceContracts/schemas/BulkTitleEdit';
import type { BulkReplace } from '@ValenceContracts/schemas/BulkTitleEdit';
import { FindReplace } from './components/FindReplace/FindReplace';
import { TITLE_VALUE_FIELDS } from '@ValenceContracts/schemas/TitleList';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { readTitlesTogether } from '@ValenceClient/admin/readTitlesTogether';
import { editTitlesInParts } from '@ValenceClient/admin/editTitlesInParts';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { SettingGroup } from '@ValenceUI/SettingGroup';
import { SettingList } from '@ValenceUI/SettingList';
import { Spinner } from '@ValenceUI/Spinner';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { notify } from '@ValenceUI/notify';
import { BulkField } from './components/BulkField/BulkField';
import { changeOfTouches } from './changeOfTouches';
import type { TitleField } from '@ValenceContracts/schemas/TitleEdit';
import type { BulkEditDialogProps } from './BulkEditDialog.types';
import type { BulkTouch } from './BulkTouch.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const SECTIONS: readonly { title: string; fields: readonly TitleField[] }[] = [
  {
    title: say('screens.adminArea.titleDetails.titleAndRelease'),
    fields: ['sortTitle', 'releaseDate', 'addedAt', 'status'],
  },
  { title: say('screens.adminArea.titleDetails.story'), fields: ['tagline', 'overview'] },
  {
    title: say('screens.adminArea.titleDetails.classification'),
    fields: ['genres', 'tags', 'studios', 'networks'],
  },
  {
    title: say('screens.ratingPanel.ratings'),
    fields: ['rating', 'rottenTomatoes', 'certifications'],
  },
  { title: say('screens.adminArea.titleDetails.note'), fields: ['note'] },
];

const WIDE: readonly TitleField[] = ['overview', 'note', 'genres', 'tags', 'studios', 'networks'];

/**
 * Edits the metadata of every title chosen at once: each field says what they all hold or that they
 * differ, only the fields touched are changed, lists of words are added to, taken from or replaced,
 * words can be found and replaced in one field, and the whole is saved as one change that is undone
 * in one step. A choice of programmes can edit their episodes instead. Before saving it says how
 * many fields it changes on how many titles, and a click outside does not close it once anything is
 * touched.
 *
 * @param targets - The titles chosen, or nothing while it is closed.
 * @param hasShows - Whether any of them is a programme, so their episodes can be edited instead.
 * @param libraryId - Their library, for suggesting the words in use.
 * @param onClose - Closes it.
 * @param onDone - Told the change made, once saved.
 */
const BulkEditDialog = ({ targets, hasShows, libraryId, onClose, onDone }: BulkEditDialogProps) => {
  const [appliesTo, setAppliesTo] = useState<'titles' | 'episodes'>('titles');
  const [touches, setTouches] = useState<ReadonlyMap<TitleField, BulkTouch>>(new Map());
  const [replace, setReplace] = useState<BulkReplace | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sent, setSent] = useState(0);
  const sample = (targets ?? []).slice(0, BULK_TITLES_AT_ONCE);
  const fields = useQuery({
    queryKey: ['bulk-title-fields', sample, appliesTo],
    queryFn: () => readTitlesTogether({ targets: sample, appliesTo }),
    enabled: sample.length > 0,
  });
  const words = useQueries({
    queries: TITLE_VALUE_FIELDS.map((field) => adminQueries.titleValues(field, libraryId)),
  });
  const region = fields.data?.region ?? 'GB';
  const kind =
    appliesTo === 'episodes'
      ? 'episode'
      : fields.data !== undefined && Object.hasOwn(fields.data.fields, 'networks')
        ? 'show'
        : 'film';
  const count = targets?.length ?? 0;
  const replaceable = REPLACEABLE_FIELDS.filter(
    (field) => fields.data !== undefined && Object.hasOwn(fields.data.fields, field),
  );
  const changing = touches.size + (replace === null || touches.has(replace.field) ? 0 : 1);

  /**
   * Notes what is now to be done to a field, or that it is let alone again.
   *
   * @param field - The field.
   * @param touch - What is to be done, or nothing.
   */
  const touchField = (field: TitleField, touch: BulkTouch | undefined) => {
    const next = new Map(touches);

    if (touch === undefined) {
      next.delete(field);
    } else {
      next.set(field, touch);
    }

    setTouches(next);
  };

  /**
   * Closes it, forgetting what was touched.
   */
  const close = () => {
    setTouches(new Map());
    setReplace(null);
    setAppliesTo('titles');
    onClose();
  };

  /**
   * Saves the change to every title chosen, a part at a time.
   */
  const apply = () => {
    if (targets === null) {
      return;
    }

    setIsSaving(true);
    setSent(0);

    void editTitlesInParts(
      targets,
      { ...changeOfTouches(touches, region), ...(replace === null ? {} : { replace }) },
      appliesTo,
      setSent,
    )
      .then((outcome) => {
        onDone(outcome, appliesTo);
        close();
      })
      .catch((error: Error) => {
        notify.failed(error.message);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <Dialog
      label={sayCount('screens.adminArea.bulkEditDialog.count.editTitles', count)}
      isOpen={targets !== null}
      onClose={close}
      size="stage"
      holdsOutsideClicks={changing > 0}
    >
      <DialogTitle
        size="compact"
        title={sayCount('screens.adminArea.bulkEditDialog.count.editTitles', count)}
        {...(hasShows
          ? {
              below: (
                <SegmentedRow
                  label={say('screens.adminArea.bulkEditDialog.whatToEdit')}
                  size="sm"
                  items={[
                    { id: 'titles', label: say('screens.adminArea.cataloguePanel.titles') },
                    {
                      id: 'episodes',
                      label: say('screens.adminArea.bulkEditDialog.theirEpisodes'),
                    },
                  ]}
                  value={appliesTo}
                  onSelect={(next) => {
                    setAppliesTo(next === 'episodes' ? 'episodes' : 'titles');
                    setTouches(new Map());
                    setReplace(null);
                  }}
                />
              ),
            }
          : {})}
      />

      <DialogContent className="@container">
        {fields.isPending ? (
          <Spinner isCentered size="sm" label={say('common.loading')} />
        ) : fields.isError ? (
          <CouldNotRead
            said={say('client.admin.readTitlesTogether.theTitlesCouldNotBeRead')}
            why={fields.error.message}
            onTryAgain={() => {
              void fields.refetch();
            }}
            isTryingAgain={fields.isFetching}
          />
        ) : (
          <SettingList>
            {SECTIONS.map((section) => {
              const shown = section.fields.filter((field) =>
                Object.hasOwn(fields.data.fields, field),
              );

              return shown.length === 0 ? null : (
                <SettingGroup key={section.title} title={section.title}>
                  <div className="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-4">
                    {shown.map((field) => {
                      const at = TITLE_VALUE_FIELDS.findIndex((one) => one === field);
                      const suggestions = at < 0 ? undefined : words[at]?.data?.values;

                      return (
                        <BulkField
                          key={field}
                          field={field}
                          kind={kind}
                          state={fields.data.fields[field]}
                          touch={touches.get(field)}
                          onTouch={(touch) => {
                            touchField(field, touch);
                          }}
                          region={region}
                          {...(suggestions === undefined ? {} : { suggestions })}
                          className={WIDE.includes(field) ? '@xl:col-span-2' : ''}
                        />
                      );
                    })}
                  </div>
                </SettingGroup>
              );
            })}
            {replaceable.length === 0 ? null : (
              <FindReplace
                key={appliesTo}
                fields={replaceable}
                kind={kind}
                replace={replace}
                onReplace={setReplace}
              />
            )}
          </SettingList>
        )}
      </DialogContent>

      <DialogFooter
        lead={
          <span className="text-sm text-text-muted">
            {isSaving
              ? say('screens.adminArea.bulkEditDialog.changingSentOfCount', {
                  sent: sent.toLocaleString(),
                  count: count.toLocaleString(),
                })
              : changing === 0
                ? say('screens.adminArea.bulkEditDialog.changeAFieldToChangeItOn')
                : say('screens.adminArea.bulkEditDialog.changesFieldsOnTitles', {
                    fields: sayCount('screens.adminArea.bulkEditDialog.count.fields', changing),
                    titles: sayCount('common.count.titles', count),
                  })}
          </span>
        }
        dismiss={{ onChoose: close }}
        confirm={{
          label: say('screens.adminArea.fixMatchDialog.apply'),
          onChoose: apply,
          isDisabled: changing === 0,
          isLoading: isSaving,
        }}
      />
    </Dialog>
  );
};

BulkEditDialog.displayName = 'BulkEditDialog';

export { BulkEditDialog };
