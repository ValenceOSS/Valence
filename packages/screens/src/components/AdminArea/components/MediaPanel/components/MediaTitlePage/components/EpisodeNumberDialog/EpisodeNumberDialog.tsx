import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { TextField } from '@ValenceUI/TextField';
import { notify } from '@ValenceUI/notify';
import { pinEpisode } from '@ValenceClient/admin/pinEpisode';
import type { EpisodePinRequest } from '@ValenceContracts/schemas/EpisodeOrder';
import type { EpisodeNumberDialogProps } from './EpisodeNumberDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Says which episode a file is, whatever its name says: the fix for an episode matched wrong, and
 * the way to mark a file holding several. The file is read again as that episode and stays it
 * through every scan, until the file name is gone by again.
 *
 * @param mediaId - The file.
 * @param season - The season it is now.
 * @param episode - The episode it is now.
 * @param isOpen - Whether it is open.
 * @param onClose - Closes it.
 * @param onChanged - Told the job reading the file again.
 */
const EpisodeNumberDialog = ({
  mediaId,
  season,
  episode,
  isOpen,
  onClose,
  onChanged,
}: EpisodeNumberDialogProps) => {
  const [seasonTyped, setSeasonTyped] = useState(season.toString());
  const [episodeTyped, setEpisodeTyped] = useState(episode.toString());
  const [endTyped, setEndTyped] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const seasonNumber = Number.parseInt(seasonTyped, 10);
  const episodeNumber = Number.parseInt(episodeTyped, 10);
  const end = endTyped.trim() === '' ? null : Number.parseInt(endTyped, 10);
  const isReadable =
    Number.isInteger(seasonNumber) &&
    seasonNumber >= 0 &&
    Number.isInteger(episodeNumber) &&
    episodeNumber >= 1 &&
    (end === null || (Number.isInteger(end) && end > episodeNumber));

  const send = async (pin: EpisodePinRequest['pin']) => {
    setIsBusy(true);

    const answer = await pinEpisode(mediaId, pin);

    setIsBusy(false);

    if (answer.kind === 'refused') {
      notify.failed(answer.reason);

      return;
    }

    notify.worked(say('screens.adminArea.episodeNumberDialog.readingItAgain'));
    onChanged(answer.jobId);
    onClose();
  };

  return (
    <Dialog
      label={say('screens.adminArea.episodeNumberDialog.whichEpisodeIsThisFile')}
      isOpen={isOpen}
      onClose={onClose}
    >
      <DialogTitle
        size="compact"
        title={say('screens.adminArea.episodeNumberDialog.whichEpisodeIsThisFile')}
      />
      <DialogContent className="flex flex-col gap-4">
        <p className="font-body text-sm text-text-muted">
          {say('screens.adminArea.episodeNumberDialog.itsNameSaysOtherwise')}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label={say('common.season')}
            type="number"
            min={0}
            value={seasonTyped}
            onValueChange={setSeasonTyped}
          />
          <TextField
            label={say('common.episode')}
            type="number"
            min={1}
            value={episodeTyped}
            onValueChange={setEpisodeTyped}
          />
        </div>
        <TextField
          label={say('screens.adminArea.episodeNumberDialog.lastEpisode')}
          type="number"
          min={1}
          value={endTyped}
          onValueChange={setEndTyped}
        />
        <div>
          <Button
            variant="ghost"
            size="sm"
            disabled={isBusy}
            onClick={() => {
              void send(null);
            }}
          >
            {say('screens.adminArea.episodeNumberDialog.useTheFileName')}
          </Button>
        </div>
      </DialogContent>
      <DialogFooter
        dismiss={{ onChoose: onClose }}
        confirm={{
          label: say('screens.adminArea.fixMatchDialog.apply'),
          isDisabled: !isReadable,
          isLoading: isBusy,
          onChoose: () => {
            void send({ seasonNumber, episodeNumber, episodeNumberEnd: end });
          },
        }}
      />
    </Dialog>
  );
};

EpisodeNumberDialog.displayName = 'EpisodeNumberDialog';

export { EpisodeNumberDialog };
