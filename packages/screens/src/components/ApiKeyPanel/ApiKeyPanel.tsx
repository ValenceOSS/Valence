import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { RequestFailed } from '@ValenceClient/query/RequestFailed';
import { Icon } from '@ValenceUI/Icon';
import {
  Bin as BinIcon,
  Copy as CopyIcon,
  TriangleAlert as TriangleAlertIcon,
} from '@keyline-icons/react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { TextField } from '@ValenceUI/TextField';
import { Switch } from '@ValenceUI/Switch';
import { Badge } from '@ValenceUI/Badge';
import { Spinner } from '@ValenceUI/Spinner';
import {
  fetchApiKeys,
  createApiKey,
  setApiKeyEnabled,
  revokeApiKey,
} from '@ValenceClient/account/fetchApiKeys';
import type { ApiKey } from '@ValenceContracts/schemas/ApiKey';
import type { ApiKeyPanelProps } from './ApiKeyPanel.types';

/**
 * Says when a key was last used in words rather than as a timestamp, and says plainly when it never
 * has been — which is the thing worth noticing in a list of keys.
 *
 * @param at - When it was last used, or nothing where it never has been.
 * @returns The phrase to show.
 */
const lastUsed = (at: string | null): string => {
  if (at === null) {
    return say('screens.apiKeyPanel.neverUsed');
  }

  const days = Math.floor((Date.now() - Date.parse(at)) / 86_400_000);

  if (days < 1) {
    return say('screens.apiKeyPanel.usedToday');
  }

  return days === 1
    ? say('screens.apiKeyPanel.usedYesterday')
    : sayCount('screens.apiKeyPanel.usedDaysAgo', days);
};

const NOT_ALLOWED = 403;
/**
 * The API keys on this account: what each may do, when it was last used, and the making of new ones.
 * A new key is shown once and never again, since the server keeps only a hash of it.
 *
 * @param onChanged - Told when a key was made, disabled or removed.
 */
const ApiKeyPanel = ({ showKeyForMilliseconds }: ApiKeyPanelProps) => {
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [isReading, setIsReading] = useState(true);
  const [name, setName] = useState('');
  const [isMaking, setIsMaking] = useState(false);
  const [made, setMade] = useState<{ name: string; key: string } | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [couldNotRead, setCouldNotRead] = useState(false);

  const read = useCallback(async () => {
    setCouldNotRead(false);

    try {
      setKeys(await fetchApiKeys());
    } catch (error) {
      if (error instanceof RequestFailed && error.status === NOT_ALLOWED) {
        setKeys(null);
      } else {
        setCouldNotRead(true);
      }
    }

    setIsReading(false);
  }, []);

  useEffect(() => {
    void read();
  }, [read]);

  useEffect(() => {
    if (made === null || showKeyForMilliseconds === undefined) {
      return;
    }

    const timer = setTimeout(() => {
      setMade(null);
    }, showKeyForMilliseconds);

    return () => {
      clearTimeout(timer);
    };
  }, [made, showKeyForMilliseconds]);

  if (isReading) {
    return <Spinner isCentered label={say('screens.apiKeyPanel.loading')} size="sm" />;
  }

  if (couldNotRead) {
    return (
      <CouldNotRead
        what={say('screens.apiKeyPanel.couldNotRead')}
        onTryAgain={() => {
          setIsReading(true);
          void read();
        }}
      />
    );
  }

  if (keys === null) {
    return <p className="p-4 text-sm text-text-muted">{say('screens.apiKeyPanel.notAllowed')}</p>;
  }

  return (
    <div className="flex flex-col gap-4 px-5 py-4">
      <p className="max-w-prose font-body text-[0.8125rem] leading-snug text-text-muted">
        {say('screens.apiKeyPanel.lede')}
      </p>

      {made === null ? null : (
        <div className="flex flex-col gap-2 rounded-lg border border-accent/40 bg-accent/10 p-3">
          <span className="flex items-center gap-2 text-sm font-medium text-text">
            <Icon of={TriangleAlertIcon} size={16} />
            {say('screens.apiKeyPanel.copyNow', { name: made.name })}
          </span>

          <span className="flex items-center gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-surface px-3 py-2 font-mono text-xs text-text">
              {made.key}
            </code>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                void navigator.clipboard.writeText(made.key).then(() => {
                  setHasCopied(true);
                });
              }}
            >
              <Icon of={CopyIcon} size={15} />
              {hasCopied ? say('screens.apiKeyPanel.copied') : say('screens.apiKeyPanel.copy')}
            </Button>
          </span>
        </div>
      )}

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();

          if (name.trim() === '' || isMaking) {
            return;
          }

          setIsMaking(true);
          setHasCopied(false);

          void createApiKey({
            name: name.trim(),
            expiresInDays: null,
            permissions: null,
            rateLimit: null,
          })
            .then(async (key) => {
              if (key !== null) {
                setMade({ name: key.name, key: key.key });
                setName('');
              }

              await read();
            })
            .finally(() => {
              setIsMaking(false);
            });
        }}
      >
        <TextField
          label={say('screens.apiKeyPanel.nameLabel')}
          value={name}
          placeholder={say('screens.apiKeyPanel.namePlaceholder')}
          onValueChange={setName}
          className="min-w-56 flex-1"
        />

        <Button type="submit" variant="glossy" size="md" isLoading={isMaking}>
          {say('screens.apiKeyPanel.create')}
        </Button>
      </form>

      {keys.length === 0 ? (
        <p className="text-sm text-text-muted">{say('screens.apiKeyPanel.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {keys.map((key) => (
            <li
              key={key.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--surface-line)] p-3"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-text">{key.name}</span>

                <span className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  <code className="font-mono">{key.start ?? '—'}…</code>
                  <span aria-hidden>·</span>
                  {lastUsed(key.lastRequestAt)}
                  {key.rateLimit === null ? null : (
                    <Badge size="sm">
                      {say('screens.apiKeyPanel.rateLimit', {
                        max: key.rateLimit.max.toString(),
                        seconds: key.rateLimit.everySeconds.toString(),
                      })}
                    </Badge>
                  )}
                  {key.permissions === null ? null : (
                    <Badge size="sm">
                      {key.permissions.length === 0
                        ? say('screens.apiKeyPanel.noPermissions')
                        : sayCount('screens.apiKeyPanel.permissions', key.permissions.length)}
                    </Badge>
                  )}
                </span>
              </span>

              <Switch
                label={
                  key.enabled
                    ? say('screens.apiKeyPanel.turnOff', { name: key.name })
                    : say('screens.apiKeyPanel.turnOn', { name: key.name })
                }
                isOn={key.enabled}
                onToggle={() => {
                  void setApiKeyEnabled(key.id, !key.enabled).then(read);
                }}
              />

              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                label={say('screens.apiKeyPanel.revoke', { name: key.name })}
                onClick={() => {
                  void revokeApiKey(key.id).then(read);
                }}
              >
                <Icon of={BinIcon} size={16} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

ApiKeyPanel.displayName = 'ApiKeyPanel';

export { ApiKeyPanel };
