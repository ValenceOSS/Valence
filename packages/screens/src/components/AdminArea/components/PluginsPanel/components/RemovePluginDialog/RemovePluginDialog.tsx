import { useQuery } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Spinner } from '@ValenceUI/Spinner';
import { describeRemoval } from '@ValenceClient/plugins/describeRemoval';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import type { RemovePluginDialogProps } from './RemovePluginDialog.types';

/**
 * Asks before removing a plugin, listing what goes with it — what it kept, the accounts people
 * connected, what it added to roles, webhooks and themes — read from the server as the dialog opens,
 * and offering to turn it off instead, which keeps all of that for later.
 *
 * @param plugin - The plugin to remove, or null while nothing is being removed.
 * @param isBusy - Whether it is being removed or turned off now.
 * @param onClose - Told when it was dismissed without doing anything.
 * @param onTurnOff - Told to turn it off instead, keeping everything.
 * @param onConfirm - Told to remove it.
 */
const RemovePluginDialog = ({
  plugin,
  isBusy,
  onClose,
  onTurnOff,
  onConfirm,
}: RemovePluginDialogProps) => {
  const removal = useQuery({
    ...pluginQueries.removal(plugin?.id ?? ''),
    enabled: plugin !== null,
  });
  const title = `Remove ${plugin?.name ?? 'this plugin'}?`;
  const lines = removal.data === undefined ? [] : describeRemoval(removal.data);

  return (
    <Dialog
      label={title}
      isOpen={plugin !== null}
      onClose={onClose}
      className="sm:w-[min(30rem,92vw)]"
    >
      <DialogTitle title={title} />

      <DialogContent className="flex flex-col gap-3 font-body text-sm text-text-muted">
        <p>It stops at once and cannot be undone.</p>

        {removal.isPending ? (
          <Spinner size="sm" label="Finding what goes with it" />
        ) : removal.isError ? (
          <p>Valence could not say what it kept; whatever it was is deleted with it.</p>
        ) : lines.length === 0 ? (
          <p>It kept nothing, and nobody connected an account to it.</p>
        ) : (
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-text">
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}

        {plugin?.isEnabled === true ? (
          <p>Turning it off instead keeps all of this for when it is turned back on.</p>
        ) : null}
      </DialogContent>

      <DialogFooter dismiss={{ label: 'Cancel', onChoose: onClose, isDisabled: isBusy }}>
        {plugin?.isEnabled === true ? (
          <Button variant="secondary" disabled={isBusy} onClick={onTurnOff}>
            Turn it off
          </Button>
        ) : null}

        <Button variant="danger" isLoading={isBusy} onClick={onConfirm}>
          Remove it
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

RemovePluginDialog.displayName = 'RemovePluginDialog';

export { RemovePluginDialog };
