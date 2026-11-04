import { useState } from 'react';
import { X as XIcon } from '@keyline-icons/react/fill';
import { FileArrowUp as FileArrowUpIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { FilePicker } from '@ValenceUI/FilePicker';
import { Form } from '@ValenceUI/Form';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import { changeLiveSource } from '@ValenceClient/live/changeLiveSource';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { say } from '@ValenceI18n/say';
import type { StringKey } from '@ValenceI18n/StringKey';
import type { LiveSourceChange, LiveSourceKind } from '@ValenceContracts/schemas/LiveTv';
import type { EditLiveSourceDialogProps } from './EditLiveSourceDialog.types';

const ADDRESS_LABELS = {
  stream: 'screens.adminArea.liveTvPanel.streamAddress',
  playlistUrl: 'screens.adminArea.liveTvPanel.playlistAddress',
  tuner: 'screens.adminArea.liveTvPanel.tunerAddress',
  embed: 'screens.adminArea.liveTvPanel.pageAddress',
} as const satisfies Record<Exclude<LiveSourceKind, 'playlistFile'>, StringKey>;

/**
 * Renames a live TV source and changes where it reads its channels from: the address of its
 * stream, playlist, tuner or page, or a new copy of an uploaded playlist. Reads it again when
 * where it reads from changes.
 *
 * @param source - The source, or nothing while the dialog is lowered.
 * @param onClose - Told to lower it.
 * @param onChanged - Told once the source is changed.
 */
const EditLiveSourceDialog = ({ source, onClose, onChanged }: EditLiveSourceDialogProps) => {
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [playlist, setPlaylist] = useState<{ name: string; text: string } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (source !== null && editing !== source.id) {
    setEditing(source.id);
    setName(source.name);
    setAddress(source.address ?? '');
    setPlaylist(null);
    setProblem(null);
  }

  const save = () => {
    if (source === null) {
      return;
    }

    if (name.trim() === '') {
      setProblem(say('screens.adminArea.editLiveSourceDialog.giveItAName'));

      return;
    }

    if (source.kind !== 'playlistFile' && address.trim() === '') {
      setProblem(say('screens.adminArea.editLiveSourceDialog.giveItAnAddress'));

      return;
    }

    const change: LiveSourceChange = {
      ...(name.trim() === source.name ? {} : { name: name.trim() }),
      ...(source.kind === 'playlistFile' || address.trim() === (source.address ?? '')
        ? {}
        : { address: address.trim() }),
      ...(playlist === null ? {} : { playlist: playlist.text }),
    };

    if (Object.keys(change).length === 0) {
      onClose();

      return;
    }

    const isReading = change.address !== undefined || change.playlist !== undefined;

    setIsSaving(true);
    setProblem(null);

    void changeLiveSource(source.id, change)
      .then((sent) => {
        if (sent.refusal !== null) {
          setProblem(failureOfRefusal(sent.refusal));

          return;
        }

        if (
          tellOutcome(
            isReading
              ? say('screens.adminArea.liveTvPanel.readNameCountChannels', {
                  name: sent.value?.name ?? name.trim(),
                  count: String(sent.value?.channelCount ?? 0),
                })
              : say('common.savedName', { name: sent.value?.name ?? name.trim() }),
            null,
          )
        ) {
          onChanged();
          onClose();
        }
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <Dialog
      label={say('screens.adminArea.editLiveSourceDialog.editSource')}
      isOpen={source !== null}
      onClose={onClose}
    >
      <DialogTitle title={say('screens.adminArea.editLiveSourceDialog.editSource')}>
        <Button isIconOnly variant="ghost" label={say('common.close')} size="sm" onClick={onClose}>
          <Icon of={XIcon} size={16} />
        </Button>
      </DialogTitle>

      <Form
        label={say('screens.adminArea.editLiveSourceDialog.editSource')}
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
        isDialog
      >
        <DialogContent>
          <div className="flex flex-col gap-4">
            <TextField label={say('common.name')} value={name} onValueChange={setName} />

            {source === null ? null : source.kind === 'playlistFile' ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-text">{say('common.playlist')}</span>
                <div className="flex items-center gap-3">
                  <FilePicker
                    label={say('screens.adminArea.editLiveSourceDialog.replaceThePlaylist')}
                    accept=".m3u,.m3u8,audio/x-mpegurl,application/vnd.apple.mpegurl"
                    size="sm"
                    onPick={(file) => {
                      void file.text().then((text) => {
                        setPlaylist({ name: file.name, text });
                      });
                    }}
                  >
                    <Icon of={FileArrowUpIcon} size={15} />
                    {playlist === null
                      ? say('screens.adminArea.editLiveSourceDialog.replaceThePlaylist')
                      : say('common.chooseAnother')}
                  </FilePicker>
                  <span className="truncate text-xs text-text-muted">{playlist?.name ?? ''}</span>
                </div>
                <span className="text-xs text-text-muted">
                  {say(
                    'screens.adminArea.editLiveSourceDialog.itsChannelsAreReadAgainFromTheNewFile',
                  )}
                </span>
              </div>
            ) : (
              <TextField
                label={say(ADDRESS_LABELS[source.kind])}
                value={address}
                onValueChange={setAddress}
                description={say(
                  'screens.adminArea.editLiveSourceDialog.changingItReadsTheChannelsAgain',
                )}
              />
            )}

            {problem === null ? null : (
              <p role="alert" className="text-sm text-danger">
                {problem}
              </p>
            )}
          </div>
        </DialogContent>

        <DialogFooter
          dismiss={{ onChoose: onClose }}
          confirm={{ label: say('common.save'), isSubmit: true, isLoading: isSaving }}
        />
      </Form>
    </Dialog>
  );
};

EditLiveSourceDialog.displayName = 'EditLiveSourceDialog';

export { EditLiveSourceDialog };
