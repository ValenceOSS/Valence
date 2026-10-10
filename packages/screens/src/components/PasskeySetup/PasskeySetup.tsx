import { Icon } from '@ValenceUI/Icon';
import { Bin as BinIcon, Key as KeyIcon, PenLine as PenLineIcon } from '@keyline-icons/react';
import { Check as CheckFilledIcon } from '@keyline-icons/react/fill';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { ScopedField } from '@ValenceUI/ScopedField';
import { SettingRow } from '@ValenceUI/SettingRow';
import { TextField } from '@ValenceUI/TextField';
import { describePasskeyUnavailability } from '@ValenceScreens/passkeys/isPasskeySupported';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import {
  deletePasskey,
  isThisSessionConfirmed,
  listPasskeys,
  registerPasskey,
  renamePasskey,
} from '@ValenceClient/session/auth';
import { ConfirmItIsYou } from '@ValenceScreens/components/PasskeySetup/components/ConfirmItIsYou/ConfirmItIsYou';
import type { Passkey } from '@ValenceContracts/schemas/Passkey';
import type { PasskeySetupProps } from './PasskeySetup.types';
import { say } from '@ValenceI18n/say';

const DEFAULT_NAME = say('common.thisDevice');

/**
 * Lets somebody enrol a passkey on this device and remove ones they no longer have, so they can sign
 * in with a fingerprint or a security key instead of a password. Lists what is already enrolled with
 * when each was last used, since a passkey nobody recognises is one worth removing.
 *
 * A client whose passkeys are added in the browser offers to open Valence there instead. A session
 * signed in too long ago for the server to let it add one asks for the password first.
 *
 * @param onChanged - Called after a passkey is added or removed, so the account page can refresh.
 */
const PasskeySetup = ({ onChanged }: PasskeySetupProps) => {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState(DEFAULT_NAME);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(true);

  const unavailable = describePasskeyUnavailability();
  const whereTheyAreAdded = platformInUse().passkeys();

  const refresh = useCallback(async () => {
    try {
      setPasskeys(await listPasskeys());
    } catch {
      setMessage(say('screens.passkeySetup.couldNotLoadYourPasskeys'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (unavailable !== null) {
      return;
    }

    void isThisSessionConfirmed().then(setIsConfirmed);
  }, [unavailable]);

  const add = async () => {
    setMessage(null);
    setIsAdding(true);

    try {
      const outcome = await registerPasskey(name.trim() === '' ? DEFAULT_NAME : name.trim());

      if (outcome.kind === 'failed') {
        setMessage(outcome.reason);

        return;
      }

      if (outcome.kind === 'cancelled') {
        return;
      }

      if (outcome.kind === 'unconfirmed') {
        setIsConfirmed(false);

        return;
      }

      setName(DEFAULT_NAME);
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
      setMessage(say('screens.passkeySetup.giveThePasskeyAName'));

      return;
    }

    if (!(await renamePasskey(passkey.id, next))) {
      setMessage(say('screens.passkeySetup.thatPasskeyCouldNotBeRenamed'));

      return;
    }

    setRenamingId(null);
    await refresh();
    onChanged?.();
  };

  const remove = async (passkey: Passkey) => {
    setMessage(null);

    if (!(await deletePasskey(passkey.id))) {
      setMessage(say('screens.passkeySetup.thatPasskeyCouldNotBeRemoved'));

      return;
    }

    await refresh();
    onChanged?.();
  };

  return (
    <div className="flex flex-col">
      <SettingRow
        title={say('common.passkeys')}
        description={unavailable ?? say('screens.passkeySetup.signInWithTheFaceFingerprint')}
      >
        <span className="text-sm text-text-muted">
          {isLoading
            ? say('screens.passkeySetup.reading')
            : passkeys.length === 0
              ? say('screens.passkeySetup.noneYet')
              : say('screens.passkeySetup.lengthOnThisAccount', {
                  length: passkeys.length.toString(),
                })}
        </span>
      </SettingRow>

      <div className="flex flex-col gap-4 pb-5">
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
                      label={say('common.passkeyName')}
                      value={renameValue}
                      onValueChange={setRenameValue}
                      className="flex-1"
                    />

                    <Button type="submit">
                      <Icon of={CheckFilledIcon} size={16} />
                      {say('common.save')}
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
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
                      {passkey.name ?? say('screens.passkeySetup.unnamedPasskey')}
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
                        {say('common.rename')}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          void remove(passkey);
                        }}
                      >
                        <Icon of={BinIcon} size={16} />
                        {say('common.forget')}
                      </Button>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {unavailable === null && !isConfirmed ? (
          <ConfirmItIsYou
            onConfirmed={() => {
              setIsConfirmed(true);
            }}
          />
        ) : unavailable === null ? (
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void add();
            }}
          >
            <ScopedField
              label={say('common.passkeyName')}
              type="text"
              value={name}
              onValueChange={setName}
              submit={{ label: say('common.addAPasskey'), icon: KeyIcon, isBusy: isAdding }}
            />
          </form>
        ) : whereTheyAreAdded.kind === 'through-a-sign-in-page' ? (
          <div>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                whereTheyAreAdded.addOne();
              }}
            >
              <Icon of={KeyIcon} size={16} />
              {say('screens.passkeySetup.addInYourBrowser')}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

PasskeySetup.displayName = 'PasskeySetup';

export { PasskeySetup };
