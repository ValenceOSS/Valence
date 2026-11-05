import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@ValenceUI/Badge';
import { Checkbox } from '@ValenceUI/Checkbox';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { SelectField } from '@ValenceUI/SelectField';
import { Spinner } from '@ValenceUI/Spinner';
import { notify } from '@ValenceUI/notify';
import { planPatternRenames } from '@ValenceClient/admin/planPatternRenames';
import { renameToPattern } from '@ValenceClient/admin/renameToPattern';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { differingTailsOf } from '@ValenceScreens/components/AdminArea/components/MediaPanel/differingTailsOf';
import type { PatternRenameState } from '@ValenceContracts/schemas/PatternRename';
import type { RenameToPatternDialogProps } from './RenameToPatternDialog.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const LEFT_NOTES = [
  ['same', 'screens.adminArea.renameToPattern.count.alreadyNamed'],
  ['unmatched', 'screens.adminArea.renameToPattern.count.notMatched'],
  ['parts', 'screens.adminArea.renameToPattern.count.inParts'],
  ['extra', 'screens.adminArea.renameToPattern.count.extras'],
] as const;

/**
 * Renames files to their library's naming pattern: shows each file's name now and the one it would
 * get, lets files be left out, says what to do where a name is taken, and renames the rest.
 *
 * @param mediaIds - The files, or nothing while it is closed.
 * @param onClose - Closes it.
 */
const RenameToPatternDialog = ({ mediaIds, onClose }: RenameToPatternDialogProps) => {
  const cache = useQueryClient();
  const [leftOut, setLeftOut] = useState<ReadonlySet<string>>(new Set());
  const [whenTaken, setWhenTaken] = useState<'skip' | 'number'>('skip');
  const plan = useQuery({
    queryKey: [...adminQueries.key, 'renamePlan', mediaIds?.join(',') ?? ''],
    queryFn: () => planPatternRenames(mediaIds ?? []),
    enabled: mediaIds !== null && mediaIds.length > 0,
    staleTime: 0,
    gcTime: 0,
  });
  const close = () => {
    setLeftOut(new Set());
    setWhenTaken('skip');
    onClose();
  };
  const renaming = useMutation({
    mutationFn: (ids: readonly string[]) => renameToPattern(ids, whenTaken),
    onSuccess: async (result) => {
      await cache.invalidateQueries({ queryKey: adminQueries.key });
      notify.worked(
        sayCount('screens.adminArea.renameToPattern.count.renamedFiles', result.renamed),
      );
      close();
    },
    onError: (error) => {
      notify.failed(error.message);
    },
  });

  const files = plan.data?.files ?? [];
  const movable = files.filter((file) => file.state === 'ready' || file.state === 'taken');
  const chosen = movable.filter(
    (file) => !leftOut.has(file.mediaId) && (file.state === 'ready' || whenTaken === 'number'),
  );
  const isAnyTaken = movable.some((file) => file.state === 'taken');
  const countOf = (state: PatternRenameState) =>
    files.filter((file) => file.state === state).length;
  const tickedCount = movable.filter((file) => !leftOut.has(file.mediaId)).length;

  return (
    <Dialog
      label={say('screens.adminArea.renameToPattern.renameToTheNamingPattern')}
      isOpen={mediaIds !== null}
      onClose={close}
      size="stage"
      holdsOutsideClicks={renaming.isPending}
    >
      <DialogTitle
        size="compact"
        title={say('screens.adminArea.renameToPattern.renameToTheNamingPattern')}
      />
      <DialogContent className="flex flex-col gap-4">
        <p className="font-body text-sm text-text-muted">
          {say('screens.adminArea.renameToPattern.eachFileMovesToTheName')}
        </p>
        {plan.isPending && mediaIds !== null ? (
          <Spinner
            size="sm"
            label={say('screens.adminArea.renameToPattern.workingOutTheNewNames')}
          />
        ) : plan.isError ? (
          <p className="font-body text-sm text-danger">{plan.error.message}</p>
        ) : (
          <>
            {movable.length === 0 ? (
              <p className="font-body text-sm text-text">
                {say('screens.adminArea.renameToPattern.nothingToRename')}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {isAnyTaken ? (
                  <SelectField
                    label={say('screens.adminArea.renameToPattern.whenTheNameIsTaken')}
                    size="sm"
                    value={whenTaken}
                    options={[
                      {
                        id: 'skip',
                        label: say('screens.adminArea.renameToPattern.leaveTheFileAsItIs'),
                      },
                      {
                        id: 'number',
                        label: say('screens.adminArea.renameToPattern.addANumberToTheName'),
                      },
                    ]}
                    onSelect={(id) => {
                      setWhenTaken(id === 'number' ? 'number' : 'skip');
                    }}
                    className="max-w-xs"
                  />
                ) : null}
                <Checkbox
                  label={say('screens.adminArea.renameToPattern.everyFileBelow')}
                  checked={tickedCount === movable.length}
                  isMixed={tickedCount > 0 && tickedCount < movable.length}
                  onCheckedChange={(isTicked) => {
                    setLeftOut(isTicked ? new Set() : new Set(movable.map((file) => file.mediaId)));
                  }}
                />
                <ul className="flex max-h-[50vh] flex-col divide-y divide-line overflow-y-auto">
                  {movable.map((file) => {
                    const tails = differingTailsOf(file.from, file.to);

                    return (
                      <li key={file.mediaId} className="flex items-start gap-3 py-2">
                        <Checkbox
                          label={tails.to}
                          isLabelHidden
                          checked={!leftOut.has(file.mediaId)}
                          onCheckedChange={(isTicked) => {
                            const next = new Set(leftOut);

                            if (isTicked) {
                              next.delete(file.mediaId);
                            } else {
                              next.add(file.mediaId);
                            }

                            setLeftOut(next);
                          }}
                        />
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="break-words font-body text-xs text-text-muted line-through">
                            {tails.from}
                          </span>
                          <span className="break-words font-body text-sm text-text">
                            {tails.to}
                          </span>
                          <span className="flex flex-wrap items-center gap-2">
                            {file.state === 'taken' ? (
                              <Badge size="sm" tone="warning">
                                {say('screens.adminArea.renameToPattern.nameTaken')}
                              </Badge>
                            ) : null}
                            {file.sidecars === 0 ? null : (
                              <span className="font-body text-xs text-text-muted">
                                {sayCount(
                                  'screens.adminArea.renameToPattern.count.filesKeptBesideIt',
                                  file.sidecars,
                                )}
                              </span>
                            )}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {LEFT_NOTES.map(([state, note]) =>
              countOf(state) === 0 ? null : (
                <p key={state} className="font-body text-sm text-text-muted">
                  {sayCount(note, countOf(state))}
                </p>
              ),
            )}
          </>
        )}
      </DialogContent>
      <DialogFooter
        dismiss={{ onChoose: close }}
        {...(chosen.length === 0
          ? {}
          : {
              confirm: {
                label: sayCount(
                  'screens.adminArea.renameToPattern.count.renameFiles',
                  chosen.length,
                ),
                onChoose: () => {
                  renaming.mutate(chosen.map((file) => file.mediaId));
                },
                isLoading: renaming.isPending,
              },
            })}
      />
    </Dialog>
  );
};

RenameToPatternDialog.displayName = 'RenameToPatternDialog';

export { RenameToPatternDialog };
