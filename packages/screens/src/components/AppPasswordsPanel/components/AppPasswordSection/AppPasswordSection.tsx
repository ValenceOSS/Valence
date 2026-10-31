import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bin as BinIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { Icon } from '@ValenceUI/Icon';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { CopyableAddress } from '@ValenceScreens/components/CopyableAddress/CopyableAddress';
import { SecretShownOnce } from '@ValenceScreens/components/SecretShownOnce/SecretShownOnce';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import { makeAppPassword } from '@ValenceClient/plugins/makeAppPassword';
import { removeAppPassword } from '@ValenceClient/plugins/removeAppPassword';
import { describeKeyLastUsed } from '@ValenceClient/account/describeKeyLastUsed';
import type { AppPassword, MadeAppPassword } from '@ValenceContracts/schemas/Plugin';
import { say } from '@ValenceI18n/say';
import type { AppPasswordSectionProps } from './AppPasswordSection.types';

const MOST_LABEL_CHARACTERS = 60;

/**
 * One plugin's app passwords for this profile: the address an app is given, the password just made
 * shown in full this once, a way to make another, and each one made with when it was last used and
 * a way to remove it once somebody has said so.
 *
 * @param pluginId - The plugin.
 * @param pluginName - Its name, as people know it.
 */
const AppPasswordSection = ({ pluginId, pluginName }: AppPasswordSectionProps) => {
  const queryClient = useQueryClient();
  const read = useQuery(pluginQueries.appPasswords(pluginId));
  const [label, setLabel] = useState('');
  const [isMaking, setIsMaking] = useState(false);
  const [made, setMade] = useState<MadeAppPassword | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [removing, setRemoving] = useState<AppPassword | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const readAgain = () =>
    queryClient.invalidateQueries({ queryKey: pluginQueries.appPasswords(pluginId).queryKey });

  const sayProblem = (error: Error | string) => {
    setProblem(error instanceof Error ? error.message : error);
  };

  if (read.isPending) {
    return (
      <Spinner
        isCentered
        label={say('screens.appPasswordsPanel.readingYourAppPasswords')}
        size="sm"
      />
    );
  }

  if (read.isError) {
    return (
      <CouldNotRead
        said={say('screens.appPasswordsPanel.yourAppPasswordsCouldNotBeRead')}
        onTryAgain={() => {
          void read.refetch();
        }}
      />
    );
  }

  return (
    <section className="flex flex-col gap-4 px-5 py-4">
      <h3 className="text-sm font-medium text-text">{pluginName}</h3>

      <p className="max-w-prose font-body text-[0.8125rem] leading-snug text-text-muted">
        {say('screens.appPasswordsPanel.appsSignInToPluginName', { pluginName })}
      </p>

      <CopyableAddress
        title={say('screens.appPasswordsPanel.address')}
        detail={say('screens.appPasswordsPanel.giveThisAddressToTheApp', {
          routes: read.data.routes.map((route) => route.title).join(', '),
        })}
        address={read.data.address}
      />

      {made === null ? null : (
        <SecretShownOnce
          warning={say('screens.appPasswordsPanel.copyThePasswordNow')}
          details={[
            { id: 'login', name: say('common.username'), value: made.password.login },
            { id: 'secret', name: say('common.password'), value: made.secret },
          ]}
          copied={copied}
          onCopy={(id, value) => {
            void navigator.clipboard.writeText(value).then(() => {
              setCopied(id);
            });
          }}
        />
      )}

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();

          if (label.trim() === '' || isMaking) {
            return;
          }

          setIsMaking(true);
          setProblem(null);
          setCopied(null);

          void makeAppPassword(pluginId, label.trim())
            .then(async (password) => {
              setMade(password);
              setLabel('');
              await readAgain();
            })
            .catch(sayProblem)
            .finally(() => {
              setIsMaking(false);
            });
        }}
      >
        <TextField
          label={say('screens.appPasswordsPanel.whatIsItFor')}
          value={label}
          placeholder={say('screens.appPasswordsPanel.myPhone')}
          onValueChange={(value) => {
            setLabel(value.slice(0, MOST_LABEL_CHARACTERS));
          }}
          className="min-w-56 flex-1"
        />

        <Button type="submit" variant="glossy" size="md" isLoading={isMaking}>
          {say('screens.appPasswordsPanel.makeAppPassword')}
        </Button>
      </form>

      {problem === null ? null : (
        <p role="alert" className="text-sm text-danger">
          {problem}
        </p>
      )}

      {read.data.passwords.length === 0 ? (
        <p className="text-sm text-text-muted">
          {say('screens.appPasswordsPanel.noAppPasswordsYet')}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {read.data.passwords.map((password) => (
            <li
              key={password.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--surface-line)] p-3"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-text">{password.label}</span>

                <span className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  <code className="font-mono">{password.login}</code>
                  <span aria-hidden>·</span>
                  {describeKeyLastUsed(password.lastUsedAt)}
                </span>
              </span>

              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                label={say('screens.appPasswordsPanel.removeLabel', { label: password.label })}
                onClick={() => {
                  setRemoving(password);
                }}
              >
                <Icon of={BinIcon} size={16} />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        title={say('screens.appPasswordsPanel.removeThisAppPassword')}
        detail={
          removing === null
            ? ''
            : say('screens.appPasswordsPanel.labelStopsWorking', {
                label: removing.label,
                pluginName,
              })
        }
        confirmLabel={say('common.removeIt')}
        isDestructive
        isBusy={isRemoving}
        isOpen={removing !== null}
        onClose={() => {
          setRemoving(null);
        }}
        onConfirm={() => {
          if (removing === null) {
            return;
          }

          const removed = removing;

          setIsRemoving(true);

          void removeAppPassword(pluginId, removed.id)
            .then(async () => {
              if (made?.password.id === removed.id) {
                setMade(null);
              }

              await readAgain();
            })
            .catch(sayProblem)
            .finally(() => {
              setIsRemoving(false);
              setRemoving(null);
            });
        }}
      />
    </section>
  );
};

AppPasswordSection.displayName = 'AppPasswordSection';

export { AppPasswordSection };
