import { Copy as CopyIcon, TriangleAlert as TriangleAlertIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { say } from '@ValenceI18n/say';
import type { SecretShownOnceProps } from './SecretShownOnce.types';

/**
 * A secret the server shows only once, such as a new key or app password, with a warning to copy it
 * now and a way to copy each part of it.
 *
 * @param warning - What to do before it goes.
 * @param details - Each part to show, with what it is where there is more than one.
 * @param copied - Which part was copied last, if any.
 * @param onCopy - Called with a part to copy it.
 */
const SecretShownOnce = ({ warning, details, copied, onCopy }: SecretShownOnceProps) => (
  <div className="flex flex-col gap-2 rounded-lg border border-accent/40 bg-accent/10 p-3">
    <span className="flex items-center gap-2 text-sm font-medium text-text">
      <Icon of={TriangleAlertIcon} size={16} />
      {warning}
    </span>

    {details.map((detail) => (
      <span key={detail.id} className="flex items-center gap-2">
        {detail.name === null ? null : (
          <span className="w-20 shrink-0 text-xs text-text-muted">{detail.name}</span>
        )}

        <code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-surface px-3 py-2 font-mono text-xs text-text">
          {detail.value}
        </code>

        <Button
          size="sm"
          variant="secondary"
          {...(detail.name === null
            ? {}
            : { label: say('screens.appPasswordsPanel.copyName', { name: detail.name }) })}
          onClick={() => {
            onCopy(detail.id, detail.value);
          }}
        >
          <Icon of={CopyIcon} size={15} />
          {copied === detail.id ? say('common.copied') : say('common.copy')}
        </Button>
      </span>
    ))}
  </div>
);

SecretShownOnce.displayName = 'SecretShownOnce';

export { SecretShownOnce };
