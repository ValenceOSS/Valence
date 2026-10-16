import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { TextField } from '@ValenceUI/TextField';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { saveLibraryLock } from '@ValenceClient/admin/saveLibraryLock';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import type { LibraryLockRowProps } from './LibraryLockRow.types';
import { say } from '@ValenceI18n/say';

const RELOCK_MINUTES = { least: 5, most: 1440, usual: 60 } as const;

/**
 * Locks a library behind a password or PIN, saying how long an unlocking lasts, or takes the lock
 * away. Saved on its own rather than with the rest of the library's settings, since a lock is not
 * something to change by accident while renaming it.
 *
 * @param libraryId - The library.
 * @param hasLock - Whether it is locked already.
 */
const LibraryLockRow = ({ libraryId, hasLock }: LibraryLockRowProps) => {
  const cache = useQueryClient();
  const [secret, setSecret] = useState('');
  const [minutes, setMinutes] = useState(RELOCK_MINUTES.usual.toString());
  const relock = Math.round(Number(minutes));
  const isRelockReadable =
    Number.isFinite(relock) && relock >= RELOCK_MINUTES.least && relock <= RELOCK_MINUTES.most;

  const save = (lock: string | null) => {
    void saveLibraryLock(libraryId, {
      secret: lock,
      relockMinutes: isRelockReadable ? relock : RELOCK_MINUTES.usual,
    }).then((saved) => {
      tellOutcome(
        lock === null
          ? say('screens.adminArea.libraryLockRow.unlockedForGood')
          : say('screens.adminArea.libraryLockRow.locked'),
        saved ? null : say('screens.adminArea.libraryLockRow.couldNotSave'),
      );

      if (saved) {
        setSecret('');
        void cache.invalidateQueries({ queryKey: libraryQueries.key });
      }
    });
  };

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-text">
        {say('screens.adminArea.libraryLockRow.lock')}
      </legend>
      <p className="text-xs text-text-muted">
        {say('screens.adminArea.libraryLockRow.lockDetail')}
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <TextField
          label={say('screens.adminArea.libraryLockRow.newSecret')}
          type="password"
          size="sm"
          value={secret}
          autoComplete="new-password"
          className="min-w-0 flex-1"
          onValueChange={setSecret}
        />
        <TextField
          label={say('screens.adminArea.libraryLockRow.locksAgainAfter')}
          type="number"
          min={RELOCK_MINUTES.least}
          max={RELOCK_MINUTES.most}
          size="sm"
          value={minutes}
          className="w-40"
          onValueChange={setMinutes}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={secret.length < 4 || !isRelockReadable}
          onClick={() => {
            save(secret);
          }}
        >
          {say('screens.adminArea.libraryLockRow.lockIt')}
        </Button>
        {hasLock ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              save(null);
            }}
          >
            {say('screens.adminArea.libraryLockRow.takeTheLockAway')}
          </Button>
        ) : null}
      </div>
    </fieldset>
  );
};

LibraryLockRow.displayName = 'LibraryLockRow';

export { LibraryLockRow };
