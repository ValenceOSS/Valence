import { Icon } from '@ValenceUI/Icon';
import { Bin as BinIcon, MoreHorizontal as MoreHorizontalIcon } from '@keyline-icons/react';
import { Key as KeyIcon } from '@keyline-icons/react/duotone';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { cn } from '@ValenceUI/cn';
import { SecretShownOnce } from '@ValenceScreens/components/SecretShownOnce/SecretShownOnce';
import { Button } from '@ValenceUI/Button';
import { TextField } from '@ValenceUI/TextField';
import { Switch } from '@ValenceUI/Switch';
import { Badge } from '@ValenceUI/Badge';
import { describeKeyLastUsed } from '@ValenceClient/account/describeKeyLastUsed';
import type { ApiKeyListProps } from './ApiKeyList.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const MASK = '••••••';

/**
 * An account's API keys as they are drawn once read: what a key is for, the one just made shown in
 * full once, a form to make another, and each key with its switch and a way to revoke it.
 *
 * @param keys - The account's keys.
 * @param made - The key just made, shown in full this once, if there is one.
 * @param hasCopied - Whether the key just made has been copied.
 * @param name - What the next key is for, as typed so far.
 * @param isMaking - Whether a key is being made.
 * @param onNameChange - Called with what the next key is for as it is typed.
 * @param onCreate - Called to make the next key.
 * @param onCopy - Called to copy the key just made.
 * @param onToggle - Called with a key to turn it on or off.
 * @param onAskRevoke - Called with a key the person wants to revoke, to ask them first.
 */
const ApiKeyList = ({
  keys,
  made,
  hasCopied,
  name,
  isMaking,
  onNameChange,
  onCreate,
  onCopy,
  onToggle,
  onAskRevoke,
}: ApiKeyListProps) => (
  <div className="flex flex-col gap-4 px-5 py-4">
    <p className="max-w-prose font-body text-[0.8125rem] leading-snug text-text-muted">
      {say('screens.apiKeyPanel.aKeyLetsSomethingThatIs')}
    </p>

    {made === null ? null : (
      <SecretShownOnce
        warning={say('screens.apiKeyPanel.copyNameNowItWillNotBeShownAgain', { name: made.name })}
        details={[{ id: 'key', name: null, value: made.key }]}
        copied={hasCopied ? 'key' : null}
        onCopy={onCopy}
      />
    )}

    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onCreate();
      }}
    >
      <TextField
        label={say('screens.apiKeyPanel.whatIsThisKeyFor')}
        value={name}
        placeholder={say('screens.apiKeyPanel.homeAssistant')}
        onValueChange={onNameChange}
        className="min-w-56 flex-1"
      />

      <Button type="submit" variant="glossy" size="md" isLoading={isMaking}>
        {say('screens.apiKeyPanel.createKey')}
      </Button>
    </form>

    {keys.length === 0 ? (
      <p className="text-sm text-text-muted">{say('screens.apiKeyPanel.noKeysYet')}</p>
    ) : (
      <ul className="flex flex-col divide-y divide-[var(--surface-line)] overflow-hidden rounded-xl border border-[var(--surface-line)]">
        {keys.map((key) => (
          <li
            key={key.id}
            className="flex items-center gap-3 px-3.5 py-3 transition-colors duration-150 hover:bg-hover"
          >
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-raised transition-opacity duration-150',
                key.enabled ? 'text-text' : 'text-text-muted opacity-60',
              )}
            >
              <Icon of={KeyIcon} size={18} />
            </span>

            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    'truncate text-sm font-medium',
                    key.enabled ? 'text-text' : 'text-text-muted',
                  )}
                >
                  {key.name}
                </span>

                {key.enabled ? null : (
                  <Badge size="sm" tone="quiet">
                    {say('common.off')}
                  </Badge>
                )}
              </span>

              <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
                <code className="rounded-md bg-surface-raised px-1.5 py-0.5 font-mono text-[0.6875rem] tracking-wide text-text-muted">
                  {key.start ?? ''}
                  {MASK}
                </code>
                <span>{describeKeyLastUsed(key.lastRequestAt)}</span>
                {key.rateLimit === null ? null : (
                  <Badge size="sm" tone="outline">
                    {say('screens.apiKeyPanel.maxPerEverySecondsS', {
                      max: key.rateLimit.max.toString(),
                      everySeconds: key.rateLimit.everySeconds.toString(),
                    })}
                  </Badge>
                )}
                {key.permissions === null ? null : (
                  <Badge size="sm" tone="outline">
                    {key.permissions.length === 0
                      ? say('screens.apiKeyPanel.noPermissions')
                      : sayCount('common.count.permissions', key.permissions.length)}
                  </Badge>
                )}
              </span>
            </span>

            <Switch
              label={
                key.enabled
                  ? say('common.turnNameOff', { name: key.name })
                  : say('common.turnNameOn', { name: key.name })
              }
              isLabelHidden
              isOn={key.enabled}
              onToggle={() => {
                onToggle(key);
              }}
            />

            <ActionMenu
              label={say('common.moreForName', { name: key.name })}
              trigger={<Icon of={MoreHorizontalIcon} size={18} />}
              align="end"
              size="sm"
              groups={[
                {
                  items: [
                    {
                      id: 'revoke',
                      label: say('screens.apiKeyPanel.revokeName', { name: key.name }),
                      icon: <Icon of={BinIcon} size={16} />,
                      isDestructive: true,
                      onChoose: () => {
                        onAskRevoke(key);
                      },
                    },
                  ],
                },
              ]}
            />
          </li>
        ))}
      </ul>
    )}
  </div>
);

ApiKeyList.displayName = 'ApiKeyList';

export { ApiKeyList };
