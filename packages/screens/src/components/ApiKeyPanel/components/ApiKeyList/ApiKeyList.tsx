import { Icon } from '@ValenceUI/Icon';
import {
  Bin as BinIcon,
  Copy as CopyIcon,
  TriangleAlert as TriangleAlertIcon,
} from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { TextField } from '@ValenceUI/TextField';
import { Switch } from '@ValenceUI/Switch';
import { Badge } from '@ValenceUI/Badge';
import { describeKeyLastUsed } from '@ValenceClient/account/describeKeyLastUsed';
import type { ApiKeyListProps } from './ApiKeyList.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

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
 * @param onRevoke - Called with a key to revoke it.
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
  onRevoke,
}: ApiKeyListProps) => (
  <div className="flex flex-col gap-4 px-5 py-4">
    <p className="max-w-prose font-body text-[0.8125rem] leading-snug text-text-muted">
      {say('screens.apiKeyPanel.aKeyLetsSomethingThatIs')}
    </p>

    {made === null ? null : (
      <div className="flex flex-col gap-2 rounded-lg border border-accent/40 bg-accent/10 p-3">
        <span className="flex items-center gap-2 text-sm font-medium text-text">
          <Icon of={TriangleAlertIcon} size={16} />
          {say('screens.apiKeyPanel.copyNameNowItWillNotBeShownAgain', { name: made.name })}
        </span>

        <span className="flex items-center gap-2">
          <code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-surface px-3 py-2 font-mono text-xs text-text">
            {made.key}
          </code>

          <Button size="sm" variant="secondary" onClick={onCopy}>
            <Icon of={CopyIcon} size={15} />
            {hasCopied ? say('common.copied') : say('common.copy')}
          </Button>
        </span>
      </div>
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
                {describeKeyLastUsed(key.lastRequestAt)}
                {key.rateLimit === null ? null : (
                  <Badge size="sm">
                    {say('screens.apiKeyPanel.maxPerEverySecondsS', {
                      max: key.rateLimit.max.toString(),
                      everySeconds: key.rateLimit.everySeconds.toString(),
                    })}
                  </Badge>
                )}
                {key.permissions === null ? null : (
                  <Badge size="sm">
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
              isOn={key.enabled}
              onToggle={() => {
                onToggle(key);
              }}
            />

            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              label={say('screens.apiKeyPanel.revokeName', { name: key.name })}
              onClick={() => {
                onRevoke(key);
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

ApiKeyList.displayName = 'ApiKeyList';

export { ApiKeyList };
