import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { attachOrphanedEdits } from '@ValenceClient/admin/attachOrphanedEdits';
import { forgetOrphanedEdits } from '@ValenceClient/admin/forgetOrphanedEdits';
import { useSettled } from '@ValenceClient/timing/useSettled';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { notify } from '@ValenceUI/notify';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import type { OrphanedEditsDialogProps } from './OrphanedEditsDialog.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const SEARCH_SETTLES_MS = 250;

/**
 * The edits kept for titles of a library whose files have gone, each with what it was called, how
 * many fields were edited and when, so none is lost without trace: each can be attached to a title
 * still there, found by its name, or thrown away.
 *
 * @param libraryId - The library.
 * @param isOpen - Whether it is open.
 * @param onClose - Closes it.
 */
const OrphanedEditsDialog = ({ libraryId, isOpen, onClose }: OrphanedEditsDialogProps) => {
  const cache = useQueryClient();
  const orphans = useQuery({ ...adminQueries.orphanedEdits(libraryId), enabled: isOpen });
  const [attaching, setAttaching] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [forgetting, setForgetting] = useState<string | null>(null);
  const settled = useSettled(search, SEARCH_SETTLES_MS);
  const found = useQuery({
    ...adminQueries.titleKeys({
      libraryId,
      sort: 'title',
      isDescending: false,
      search: settled,
      show: 'all',
      filters: [],
    }),
    enabled: attaching !== null && settled.trim() !== '',
  });

  /**
   * Reads the list again and everything the edits show in, once some have moved or gone.
   */
  const readAgain = () => {
    void cache.invalidateQueries({ queryKey: adminQueries.key });
  };

  /**
   * Moves one gone title's edits onto a title still there.
   *
   * @param key - The gone title.
   * @param toId - The title still there.
   * @param name - What it is called, to say so.
   */
  const attach = (key: string, toId: string, name: string) => {
    void attachOrphanedEdits({ libraryId, key, toId })
      .then((outcome) => {
        notify.worked(
          sayCount('screens.adminArea.orphanedEditsDialog.count.movedEditsToName', outcome.edits, {
            name,
          }),
        );
        setAttaching(null);
        setSearch('');
        readAgain();
      })
      .catch((error: Error) => {
        notify.failed(error.message);
      });
  };

  /**
   * Throws one gone title's edits away.
   *
   * @param key - The gone title.
   */
  const forget = (key: string) => {
    void forgetOrphanedEdits({ libraryId, key })
      .then((outcome) => {
        notify.worked(
          sayCount('screens.adminArea.orphanedEditsDialog.count.threwAwayEdits', outcome.edits),
        );
        readAgain();
      })
      .catch((error: Error) => {
        notify.failed(error.message);
      });
  };

  return (
    <Dialog
      label={say('screens.adminArea.orphanedEditsDialog.editsWithoutATitle')}
      isOpen={isOpen}
      onClose={onClose}
      size="stage"
    >
      <DialogTitle
        title={say('screens.adminArea.orphanedEditsDialog.editsWithoutATitle')}
        detail={say('screens.adminArea.orphanedEditsDialog.theseTitlesWereEditedButTheirFiles')}
      />

      <DialogContent className="flex flex-col gap-3">
        {orphans.isPending ? (
          <Spinner isCentered size="sm" label={say('common.loading')} />
        ) : (orphans.data?.orphans.length ?? 0) === 0 ? (
          <p className="text-[0.8125rem] text-text-muted">
            {say('screens.adminArea.orphanedEditsDialog.everyEditHasATitle')}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
            {orphans.data?.orphans.map((orphan) => (
              <li key={orphan.key} className="flex flex-col gap-3 py-3">
                <span className="flex flex-wrap items-center gap-3">
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-2 text-sm font-medium text-text">
                      {orphan.name ?? orphan.key}
                      <Badge size="sm">
                        {orphan.kind === 'show' ? say('common.show') : say('common.film')}
                      </Badge>
                    </span>
                    <span className="text-xs text-text-muted">
                      {say('screens.adminArea.orphanedEditsDialog.fieldsEditedWhen', {
                        fields: sayCount(
                          'screens.adminArea.bulkEditDialog.count.fields',
                          orphan.fields,
                        ),
                        when: describeSince(orphan.setAt, Date.now()),
                      })}
                    </span>
                  </span>
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => {
                      setAttaching(attaching === orphan.key ? null : orphan.key);
                      setSearch(orphan.name ?? '');
                    }}
                  >
                    {say('screens.adminArea.orphanedEditsDialog.attachToATitle')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setForgetting(orphan.key);
                    }}
                  >
                    {say('common.delete')}
                  </Button>
                </span>

                {attaching === orphan.key ? (
                  <div className="flex flex-col gap-2 rounded-lg border border-[var(--surface-line)] p-3">
                    <TextField
                      label={say('common.findATitle')}
                      isLabelHidden
                      type="search"
                      size="sm"
                      placeholder={say('common.findATitle')}
                      value={search}
                      onValueChange={setSearch}
                      hasFocusOnMount
                    />
                    <ul className="flex flex-col">
                      {(found.data?.titles ?? []).slice(0, 8).map((title) => (
                        <li key={title.id}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => {
                              attach(orphan.key, title.id, title.name);
                            }}
                          >
                            {title.name}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>

      <DialogFooter dismiss={{ onChoose: onClose, label: say('common.done') }} />

      <ConfirmDialog
        isOpen={forgetting !== null}
        isDestructive
        title={say('screens.adminArea.orphanedEditsDialog.throwTheseEditsAway')}
        detail={say('screens.adminArea.orphanedEditsDialog.theyCannotBeGotBack')}
        confirmLabel={say('common.delete')}
        onClose={() => {
          setForgetting(null);
        }}
        onConfirm={() => {
          if (forgetting !== null) {
            forget(forgetting);
          }

          setForgetting(null);
        }}
      />
    </Dialog>
  );
};

OrphanedEditsDialog.displayName = 'OrphanedEditsDialog';

export { OrphanedEditsDialog };
