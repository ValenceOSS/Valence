import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import { createPlaylist, updatePlaylist } from '@ValenceClient/music/fetchPlaylists';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import type { PlaylistDialogProps } from './PlaylistDialog.types';

/**
 * Makes a playlist, or changes one: its name, what it is for, and whether its order means something.
 *
 * That last one is the difference between a mixtape and an audiobook's chapters. A playlist whose
 * order means something never shuffles and never repeats, whatever the buttons say, so it is asked
 * about here rather than discovered the first time somebody presses shuffle on chapter three.
 *
 * @param isOpen - Whether it is showing.
 * @param onClose - Closes it.
 * @param playlist - The playlist being changed, or nothing to make a new one.
 * @param onSaved - Called with the playlist once it has been made or changed.
 */
const PlaylistDialog = ({ isOpen, onClose, playlist, onSaved }: PlaylistDialogProps) => {
  const cache = useQueryClient();
  const [name, setName] = useState(playlist?.name ?? '');
  const [description, setDescription] = useState(playlist?.description ?? '');
  const [isOrdered, setIsOrdered] = useState(playlist?.isOrdered ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const isNew = playlist === undefined;

  useEffect(() => {
    if (isOpen) {
      setName(playlist?.name ?? '');
      setDescription(playlist?.description ?? '');
      setIsOrdered(playlist?.isOrdered ?? false);
      setProblem(null);
    }
  }, [isOpen, playlist]);

  const save = async () => {
    const trimmed = name.trim();

    if (trimmed === '') {
      setProblem('A playlist needs a name.');

      return;
    }

    setIsSaving(true);

    const saved = isNew
      ? ((
          await createPlaylist({
            name: trimmed,
            description: description.trim() || null,
            isOrdered,
          })
        )?.id ?? null)
      : (await updatePlaylist(playlist.id, {
            name: trimmed,
            description: description.trim() === '' ? null : description.trim(),
            isOrdered,
          }))
        ? playlist.id
        : null;

    setIsSaving(false);

    if (saved === null) {
      setProblem(isNew ? 'That playlist could not be made.' : 'That could not be saved.');

      return;
    }

    void cache.invalidateQueries({ queryKey: musicQueries.playlistsKey });
    onSaved?.(saved);
    onClose();
  };

  return (
    <Dialog label={isNew ? 'New playlist' : 'Edit playlist'} isOpen={isOpen} onClose={onClose}>
      <DialogTitle title={isNew ? 'New playlist' : 'Edit playlist'} />

      <DialogContent className="flex flex-col gap-4">
        <TextField
          label="Name"
          value={name}
          hasFocusOnMount
          {...(problem === null ? {} : { error: problem })}
          onValueChange={(next) => {
            setName(next);
            setProblem(null);
          }}
        />

        <TextField
          label="Description"
          value={description}
          placeholder="What it is for"
          onValueChange={setDescription}
        />

        <Switch
          label="The order matters"
          isOn={isOrdered}
          onToggle={() => {
            setIsOrdered((was) => !was);
          }}
        />

        <p className="-mt-2 text-[0.8125rem] text-text-muted">
          For chapters, a series in release order, or anything that should never shuffle or repeat.
        </p>
      </DialogContent>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          isLoading={isSaving}
          onClick={() => {
            void save();
          }}
        >
          {isNew ? 'Make it' : 'Save'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

PlaylistDialog.displayName = 'PlaylistDialog';

export { PlaylistDialog };
