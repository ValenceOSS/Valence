import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { SettingRow } from '@ValenceUI/SettingRow';
import { TextField } from '@ValenceUI/TextField';
import { notify } from '@ValenceUI/notify';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { giveFirstPassword } from '@ValenceClient/setup/giveFirstPassword';
import { MINIMUM_PASSWORD_LENGTH } from '@ValenceContracts/constants/MINIMUM_PASSWORD_LENGTH';
import type { FirstPasswordProps } from './FirstPassword.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Lets an account set up with only a passkey choose its first password, so that somebody whose
 * passkey did not take, or who closed the page before trying again, still has a way in other than
 * the browser they are signed in on. Shows nothing for an account that already has one.
 *
 * @param onChanged - Called once the password is set.
 */
const FirstPassword = ({ onChanged }: FirstPasswordProps) => {
  const cache = useQueryClient();
  const asked = useQuery(sessionQueries.password());
  const [isChoosing, setIsChoosing] = useState(false);
  const [password, setPassword] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  if (asked.data !== false) {
    return null;
  }

  const stop = () => {
    setIsChoosing(false);
    setPassword('');
    setProblem(null);
  };

  const keep = async () => {
    setIsBusy(true);
    setProblem(null);

    const refused = await giveFirstPassword(password);

    setIsBusy(false);

    if (refused !== null) {
      setProblem(refused.message);

      return;
    }

    stop();
    notify.say(say('screens.firstPassword.passwordSet'));
    await cache.invalidateQueries({ queryKey: sessionQueries.password().queryKey });
    onChanged();
  };

  return (
    <div className="flex flex-col">
      <SettingRow
        title={say('common.password')}
        description={say('screens.firstPassword.yourAccountHasNoPasswordYet')}
      >
        {isChoosing ? null : (
          <Button
            variant="glossy"
            size="sm"
            onClick={() => {
              setIsChoosing(true);
            }}
          >
            {say('common.setUp')}
          </Button>
        )}
      </SettingRow>

      {!isChoosing ? null : (
        <form
          noValidate
          className="flex flex-col gap-3 px-5 pb-5"
          onSubmit={(event) => {
            event.preventDefault();
            void keep();
          }}
        >
          <TextField
            label={say('common.password')}
            type="password"
            autoComplete="new-password"
            value={password}
            onValueChange={setPassword}
            description={sayCount('common.atLeastCountCharacters', MINIMUM_PASSWORD_LENGTH)}
            hasFocusOnMount
            {...(problem === null ? {} : { error: problem })}
          />

          <div className="flex gap-2">
            <Button
              type="submit"
              isLoading={isBusy}
              disabled={password.length < MINIMUM_PASSWORD_LENGTH}
            >
              {say('common.save')}
            </Button>
            <Button type="button" variant="ghost" onClick={stop}>
              {say('common.cancel')}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

FirstPassword.displayName = 'FirstPassword';

export { FirstPassword };
