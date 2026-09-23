import { ChevronRight as ChevronRightIcon, Monitor as MonitorIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Icon } from '@ValenceUI/Icon';
import { controlDevice } from '@ValenceClient/video/controlledDevice';
import { sendVideoCommand } from '@ValenceClient/video/videoDevices';
import { useVideoDevices } from '@ValenceClient/video/useVideoDevices';
import type { PlayOnDialogProps } from './PlayOnDialog.types';

/**
 * The televisions a film can be sent to: each of this person's Apple TVs with Valence open, and
 * what it is watching now. Choosing one starts the film there, from where this person had got to,
 * and makes this device its remote.
 *
 * @param media - The film or episode to send, or nothing while the dialog is closed.
 * @param startSeconds - Where in it to start.
 * @param onClose - Told when the dialog should close.
 * @param onSent - Told once the film has been sent, to show the remote.
 */
const PlayOnDialog = ({ media, startSeconds, onClose, onSent }: PlayOnDialogProps) => {
  const televisions = useVideoDevices(media !== null).filter((device) => device.kind === 'tv');

  return (
    <Dialog
      label="Play on"
      isOpen={media !== null}
      onClose={onClose}
      className="sm:w-[min(28rem,92vw)]"
    >
      <DialogTitle title="Play on" detail={media?.title} />

      <DialogContent>
        {televisions.length === 0 ? (
          <p className="font-body text-sm text-text-muted">
            Open Valence on your Apple TV, signed in as you, and it will be here.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {televisions.map((device) => (
              <li key={device.clientId}>
                <Button
                  variant="row"
                  size="none"
                  hasTooltip={false}
                  label={`Play on ${device.label}`}
                  className="flex w-full items-center gap-3 rounded-lg p-3 text-left"
                  onClick={() => {
                    if (media === null) {
                      return;
                    }

                    void sendVideoCommand(device.clientId, {
                      kind: 'play',
                      mediaId: media.id,
                      startSeconds: Math.floor(startSeconds),
                    });
                    controlDevice({ clientId: device.clientId, label: device.label });
                    onSent();
                  }}
                >
                  <Icon of={MonitorIcon} size={22} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-text">{device.label}</span>
                    <span className="truncate text-xs text-text-muted">
                      {device.nowWatching === null
                        ? 'Not playing anything'
                        : `${device.nowWatching.isPlaying ? 'Playing' : 'Paused on'} ${device.nowWatching.title}`}
                    </span>
                  </span>
                  <Icon of={ChevronRightIcon} size={16} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};

PlayOnDialog.displayName = 'PlayOnDialog';

export { PlayOnDialog };
