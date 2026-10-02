import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { TextField } from '@ValenceUI/TextField';
import { notify } from '@ValenceUI/notify';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { linkWithInvite } from '@ValenceClient/admin/linkWithInvite';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { say } from '@ValenceI18n/say';

/**
 * Linking with a server whose admin sent this one an invite: the invite pasted in, and what came
 * of using it — waiting for their admin, linked, or why not.
 */
const LinkToServerCard = () => {
  const cache = useQueryClient();
  const [invite, setInvite] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  const link = () => {
    setIsLinking(true);

    void linkWithInvite(invite.trim())
      .then(async (sent) => {
        if (sent.value === null) {
          notify.failed(sent.refusal?.message ?? '');

          return;
        }

        notify.worked(
          sent.value.state === 'linked'
            ? say('screens.adminArea.linkedServersPanel.linkedWithName', { name: sent.value.name })
            : say('screens.adminArea.linkedServersPanel.askedNameToLink', {
                name: sent.value.name,
              }),
        );
        setInvite('');
        await cache.invalidateQueries({ queryKey: adminQueries.linking().queryKey });
      })
      .finally(() => {
        setIsLinking(false);
      });
  };

  return (
    <PanelCard title={say('screens.adminArea.linkedServersPanel.linkToAServer')}>
      <div className="flex flex-col gap-3">
        <p className="text-xs leading-relaxed text-text-muted">
          {say('screens.adminArea.linkedServersPanel.pasteAnInvite')}
        </p>
        <div className="flex items-end gap-2">
          <TextField
            label={say('screens.adminArea.linkedServersPanel.theirInvite')}
            value={invite}
            onValueChange={setInvite}
            size="sm"
            autoComplete="off"
            className="min-w-0 flex-1"
          />
          <Button
            variant="glossy"
            size="sm"
            isLoading={isLinking}
            disabled={invite.trim() === ''}
            onClick={link}
          >
            {say('screens.adminArea.linkedServersPanel.link')}
          </Button>
        </div>
      </div>
    </PanelCard>
  );
};

LinkToServerCard.displayName = 'LinkToServerCard';

export { LinkToServerCard };
