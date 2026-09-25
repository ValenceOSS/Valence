import { Icon } from '@ValenceUI/Icon';
import { Bin as BinIcon, Key as KeyIcon, PenLine as PenLineIcon } from '@keyline-icons/react';
import { Check as CheckFilledIcon } from '@keyline-icons/react/fill';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { SettingRow } from '@ValenceUI/SettingRow';
import { TextField } from '@ValenceUI/TextField';
import { describePasskeyUnavailability } from '@ValenceScreens/passkeys/isPasskeySupported';
import {
  deletePasskey,
  listPasskeys,
  registerPasskey,
  renamePasskey,
} from '@ValenceClient/session/auth';
import type { Passkey } from '@ValenceContracts/schemas/Passkey';
import type { PasskeySetupProps } from './PasskeySetup.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { StringKey } from '@ValenceI18n/StringKey';

const DEFAULT_NAME: StringKey = 'screens.passkeySetup.defaultName';

/**
 * Lets somebody enrol a passkey on this device and remove ones they no longer have, so they can sign
 * in with a fingerprint or a security key instead of a password. Lists what is already enrolled with
 * when each was last used, since a passkey nobody recognises is one worth removing.
 *
 * @param onChanged - Called after a passkey is added or removed, so the account page can refresh.
 */
const PasskeySetup = ({ onChanged }: PasskeySetupProps) => {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState(() => say(DEFAULT_NAME));
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const unavailable = describePasskeyUnavailability();

  const refresh = useCallback(async () => {
    try {
      setPasskeys(await listPasskeys());
    } catch {
      setMessage(say('screens.passkeySetup.couldNotLoad'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = async () => {
    setMessage(null);
    setIsAdding(true);

    try {
      const outcome = await registerPasskey(name.trim() === '' ? say(DEFAULT_NAME) : name.trim());

      if (outcome.kind === 'failed') {
        setMessage(outcome.reason);

        return;
      }

      if (outcome.kind === 'cancelled') {
        return;
      }

      setName(say(DEFAULT_NAME));
      await refresh();
      onChanged?.();
    } finally {
      setIsAdding(false);
    }
  };

  const rename = async (passkey: Passkey) => {
    setMessage(null);

    const next = renameValue.trim();

    if (next === '') {
      setMessage(say('screens.passkeySetup.giveAName'));

      return;
    }

    if (!(await renamePasskey(passkey.id, next))) {
      setMessage(say('screens.passkeySetup.couldNotRename'));

      return;
    }

    setRenamingId(null);
    await refresh();
    onChanged?.();
  };

  const remove = async (passkey: Passkey) => {
    setMessage(null);

    if (!(await deletePasskey(passkey.id))) {
      setMessage(say('screens.passkeySetup.couldNotRemove'));

      return;
    }

    await refresh();
    onChanged?.();
  };

  return (
    <div className="flex flex-col">
      <SettingRow
        title={say('screens.passkeySetup.title')}
        description={unavailable ?? say('screens.passkeySetup.description')}
      >
        <span className="text-sm text-text-muted">
          {isLoading
            ? say('screens.passkeySetup.reading')
            : passkeys.length === 0
              ? say('screens.passkeySetup.noneYet')
              : sayCount('screens.passkeySetup.onThisAccount', passkeys.length)}
        </span>
      </SettingRow>

      <div className="flex flex-col gap-4 px-5 pb-5">
        {message === null ? null : (
          <p role="alert" className="text-sm text-danger">
            {message}
          </p>
        )}

        {isLoading || passkeys.length === 0 ? null : (
          <ul className="flex flex-col gap-2">
            {passkeys.map((passkey) => (
              <li
                key={passkey.id}
                className="flex items-center justify-between gap-3 rounded-md bg-surface-raised px-3 py-2"
              >
                {renamingId === passkey.id ? (
                  <form
                    noValidate
                    className="flex w-full items-end gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void rename(passkey);
                    }}
                  >
                    <TextField
                      label={say('screens.passkeySetup.nameLabel')}
                      value={renameValue}
                      onValueChange={setRenameValue}
                      className="flex-1"
                    />

                    <Button type="submit" size="sm">
                      <Icon of={CheckFilledIcon} size={16} />
                      {say('common.save')}
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setRenamingId(null);
                      }}
                    >
                      {say('common.cancel')}
                    </Button>
                  </form>
                ) : (
                  <>
                    <span className="flex items-center gap-2 text-sm text-text">
                      <Icon of={KeyIcon} size={16} />
                      {passkey.name ?? say('screens.passkeySetup.unnamed')}
                    </span>

                    <span className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRenamingId(passkey.id);
                          setRenameValue(passkey.name ?? '');
                        }}
                      >
                        <Icon of={PenLineIcon} size={16} />
                        {say('screens.passkeySetup.rename')}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          void remove(passkey);
                        }}
                      >
                        <Icon of={BinIcon} size={16} />
                        {say('screens.passkeySetup.remove')}
                      </Button>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {unavailable === null ? (
          <form
            noValidate
            className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void add();
            }}
          >
            <TextField
              label={say('screens.passkeySetup.nameLabel')}
              value={name}
              onValueChange={setName}
              className="min-w-56 flex-1"
            />

            <Button type="submit" variant="glossy" size="md" isLoading={isAdding}>
              <Icon of={KeyIcon} size={16} />
              {say('screens.passkeySetup.add')}
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
};

PasskeySetup.displayName = 'PasskeySetup';

export { PasskeySetup };
