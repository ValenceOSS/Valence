import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { FilePicker } from '@ValenceUI/FilePicker';
import { Spinner } from '@ValenceUI/Spinner';
import { notify } from '@ValenceUI/notify';
import { rowsOfCsv } from '@ValenceCore/functions/rowsOfCsv';
import { fetchTitlePage } from '@ValenceClient/admin/fetchTitlePage';
import { editTitleMetadata } from '@ValenceClient/admin/fetchTitleMetadata';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { labelOfField } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/labelOfField';
import { changesOfSheet } from '@ValenceScreens/components/AdminArea/components/MediaPanel/changesOfSheet';
import type { SheetChange } from '@ValenceScreens/components/AdminArea/components/MediaPanel/changesOfSheet';
import type { TitleRow } from '@ValenceContracts/schemas/TitleList';
import type { ImportSheetDialogProps } from './ImportSheetDialog.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const PAGE = 500;

/**
 * Brings back a spreadsheet exported from the media list and edited elsewhere: reads it, finds each
 * row's title, and shows what would change before anything does, then changes each title in turn.
 *
 * @param libraryId - The library, or nothing while it is closed.
 * @param onClose - Closes it.
 */
const ImportSheetDialog = ({ libraryId, onClose }: ImportSheetDialogProps) => {
  const cache = useQueryClient();
  const [read, setRead] = useState<{ changes: SheetChange[]; unfound: number } | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [sent, setSent] = useState<number | null>(null);

  const readSheet = async (file: File) => {
    if (libraryId === null) {
      return;
    }

    setIsReading(true);

    try {
      const titles: TitleRow[] = [];
      let after: string | undefined;

      do {
        const page = await fetchTitlePage(
          { libraryId, sort: 'title', isDescending: false, search: '', show: 'all', filters: [] },
          after,
        );

        titles.push(...page.titles);
        after = page.next ?? undefined;
      } while (after !== undefined && titles.length < PAGE * 100);

      setRead(changesOfSheet(rowsOfCsv(await file.text()), titles));
    } catch (error) {
      notify.failed(error instanceof Error ? error.message : String(error));
    } finally {
      setIsReading(false);
    }
  };

  const close = () => {
    setRead(null);
    setSent(null);
    onClose();
  };

  const apply = async () => {
    const changes = read?.changes ?? [];
    let changed = 0;

    setSent(0);

    for (const [at, change] of changes.entries()) {
      const answer = await editTitleMetadata(change.row.lead.id, 'title', { set: change.set });

      if (answer.kind === 'saved') {
        changed += 1;
      }

      setSent(at + 1);
    }

    await cache.invalidateQueries({ queryKey: adminQueries.key });
    notify.worked(sayCount('screens.adminArea.importSheet.count.changedTitles', changed));
    close();
  };

  const changes = read?.changes ?? [];
  const kindOf = (row: TitleRow) => (row.kind === 'show' ? 'show' : 'film');

  return (
    <Dialog
      label={say('screens.adminArea.importSheet.importASpreadsheet')}
      isOpen={libraryId !== null}
      onClose={close}
      size="stage"
      holdsOutsideClicks={read !== null}
    >
      <DialogTitle size="compact" title={say('screens.adminArea.importSheet.importASpreadsheet')} />
      <DialogContent className="flex flex-col gap-4">
        <p className="font-body text-sm text-text-muted">
          {say('screens.adminArea.importSheet.bringBackAnEditedExport')}
        </p>
        {read === null ? (
          isReading ? (
            <Spinner size="sm" label={say('screens.adminArea.importSheet.readingIt')} />
          ) : (
            <div>
              <FilePicker
                label={say('screens.adminArea.importSheet.chooseTheFile')}
                accept=".csv,text/csv"
                variant="secondary"
                size="sm"
                onPick={(file) => {
                  void readSheet(file);
                }}
              >
                {say('screens.adminArea.importSheet.chooseTheFile')}
              </FilePicker>
            </div>
          )
        ) : (
          <>
            {read.unfound === 0 ? null : (
              <p className="font-body text-sm text-text-muted">
                {sayCount('screens.adminArea.importSheet.count.rowsNotFound', read.unfound)}
              </p>
            )}
            {changes.length === 0 ? (
              <p className="font-body text-sm text-text">
                {say('screens.adminArea.importSheet.nothingToChange')}
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {changes.map((change) => (
                  <li key={change.row.id} className="flex flex-col gap-0.5 py-2">
                    <span className="font-body text-sm font-medium text-text">
                      {change.row.name}
                    </span>
                    {Object.entries(change.set).map(([field, value]) => (
                      <span key={field} className="font-body text-xs text-text-muted">
                        {say('screens.adminArea.titleHistory.fieldChanged', {
                          field: labelOfField(
                            field === 'title'
                              ? 'title'
                              : field === 'sortTitle'
                                ? 'sortTitle'
                                : field === 'releaseDate'
                                  ? 'releaseDate'
                                  : 'genres',
                            kindOf(change.row),
                          ),
                          change:
                            value === null
                              ? say('screens.adminArea.sourcedField.nothing')
                              : Array.isArray(value)
                                ? value.join(', ')
                                : value,
                        })}
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </DialogContent>
      <DialogFooter
        lead={
          sent === null ? null : (
            <span className="text-sm text-text-muted">
              {say('screens.adminArea.importSheet.changedSentOfCount', {
                sent: sent.toLocaleString(),
                count: changes.length.toLocaleString(),
              })}
            </span>
          )
        }
        dismiss={{ onChoose: close }}
        {...(changes.length === 0
          ? {}
          : {
              confirm: {
                label: sayCount(
                  'screens.adminArea.importSheet.count.changesTitles',
                  changes.length,
                ),
                onChoose: () => {
                  void apply();
                },
                isLoading: sent !== null,
              },
            })}
      />
    </Dialog>
  );
};

ImportSheetDialog.displayName = 'ImportSheetDialog';

export { ImportSheetDialog };
