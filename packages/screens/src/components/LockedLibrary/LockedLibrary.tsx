import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Lock as LockIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { unlockLibrary } from '@ValenceClient/library/unlockLibrary';
import { PanelCard } from '@ValenceUI/PanelCard';
import type { LockedLibraryProps } from './LockedLibrary.types';
import { say } from '@ValenceI18n/say';

/**
 * A library that is locked, with somewhere to type its password or PIN. Unlocking it shows its
 * titles everywhere on this device until the lock comes back on its own.
 *
 * @param library - The library.
 */
const LockedLibrary = ({ library }: LockedLibraryProps) => {
  const cache = useQueryClient();
  const [secret, setSecret] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  return (
    <PanelCard title={say('screens.lockedLibrary.nameIsLocked', { name: library.name })}>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setIsUnlocking(true);

          void unlockLibrary(library.id, secret).then((opened) => {
            setIsUnlocking(false);

            if (opened.kind === 'unlocked') {
              setSecret('');
              setProblem(null);
              void cache.invalidateQueries({ queryKey: libraryQueries.key });

              return;
            }

            setProblem(
              opened.kind === 'wrong'
                ? say('error.libraryLock.thatIsNotIt')
                : opened.kind === 'tooMany'
                  ? say('error.libraryLock.tooManyTries')
                  : say('screens.lockedLibrary.couldNotUnlock'),
            );
          });
        }}
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-surface-raised text-text-muted">
          <Icon of={LockIcon} size={18} />
        </span>
        <TextField
          label={say('screens.lockedLibrary.passwordOrPin')}
          type="password"
          size="sm"
          value={secret}
          autoComplete="off"
          {...(problem === null ? {} : { error: problem })}
          className="min-w-0 flex-1"
          onValueChange={setSecret}
        />
        <Button type="submit" variant="secondary" size="sm" disabled={secret === '' || isUnlocking}>
          {say('screens.lockedLibrary.unlock')}
        </Button>
      </form>
    </PanelCard>
  );
};

LockedLibrary.displayName = 'LockedLibrary';

export { LockedLibrary };
