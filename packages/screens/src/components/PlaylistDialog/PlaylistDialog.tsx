import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import { createPlaylist, updatePlaylist } from '@ValenceClient/music/fetchPlaylists';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { draftOfSongRules } from '@ValenceClient/smart/draftOfSongRules';
import { songRulesOf } from '@ValenceClient/smart/songRulesOf';
import { SmartRulesEditor } from '@ValenceScreens/components/SmartRulesEditor/SmartRulesEditor';
import type { PlaylistDialogProps } from './PlaylistDialog.types';
import { say } from '@ValenceI18n/say';

/**
 * Makes a playlist, or changes one: its name, what it is for, and whether its order means something.
 *
 * That last one is the difference between a mixtape and an audiobook's chapters. A playlist whose
 * order means something never shuffles and never repeats, whatever the buttons say, so it is asked
 * about here rather than discovered the first time somebody presses shuffle on chapter three. A
 * smart playlist is asked for its rules instead, since they say what is in it and in what order.
 *
 * @param isOpen - Whether it is showing.
 * @param onClose - Closes it.
 * @param playlist - The playlist being changed, or nothing to make a new one.
 * @param onSaved - Called with the playlist once it has been made or changed.
 * @param isSmart - Whether a new one fills itself from rules.
 */
const PlaylistDialog = ({
  isOpen,
  onClose,
  playlist,
  onSaved,
  isSmart: isNewSmart = false,
}: PlaylistDialogProps) => {
  const cache = useQueryClient();
  const [name, setName] = useState(playlist?.name ?? '');
  const [description, setDescription] = useState(playlist?.description ?? '');
  const [isOrdered, setIsOrdered] = useState(playlist?.isOrdered ?? false);
  const [rules, setRules] = useState(() => draftOfSongRules(playlist?.rules ?? null));
  const [isSaving, setIsSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const isNew = playlist === undefined;
  const isSmart = playlist?.isSmart ?? isNewSmart;
  const hasRulesItReads = playlist === undefined || playlist.rules !== null;
  const title = isSmart
    ? isNew
      ? say('common.newSmartPlaylist')
      : say('common.editSmartPlaylist')
    : isNew
      ? say('common.newPlaylist')
      : say('common.editPlaylist');

  const [wasOpen, setWasOpen] = useState(isOpen);

  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);

    if (isOpen) {
      setName(playlist?.name ?? '');
      setDescription(playlist?.description ?? '');
      setIsOrdered(playlist?.isOrdered ?? false);
      setRules(draftOfSongRules(playlist?.rules ?? null));
      setProblem(null);
      setIsChecked(false);
    }
  }

  const save = async () => {
    const trimmed = name.trim();

    if (trimmed === '') {
      setProblem(say('common.aPlaylistNeedsAName'));

      return;
    }

    const smartRules = isSmart && hasRulesItReads ? songRulesOf(rules) : null;

    if (isSmart && hasRulesItReads && smartRules === null) {
      setIsChecked(true);

      return;
    }

    setIsSaving(true);

    const saved = isNew
      ? ((
          await createPlaylist({
            name: trimmed,
            description: description.trim() || null,
            isOrdered,
            ...(smartRules === null ? {} : { rules: smartRules }),
          })
        )?.id ?? null)
      : (await updatePlaylist(playlist.id, {
            name: trimmed,
            description: description.trim() === '' ? null : description.trim(),
            isOrdered,
            ...(smartRules === null ? {} : { rules: smartRules }),
          }))
        ? playlist.id
        : null;

    setIsSaving(false);

    if (saved === null) {
      setProblem(
        isNew ? say('common.thatPlaylistCouldNotBeMade') : say('common.thatCouldNotBeSaved'),
      );

      return;
    }

    void cache.invalidateQueries({ queryKey: musicQueries.playlistsKey });
    onSaved?.(saved);
    onClose();
  };

  return (
    <Dialog label={title} isOpen={isOpen} onClose={onClose}>
      <DialogTitle title={title} />

      <DialogContent className="flex flex-col gap-4">
        <TextField
          label={say('common.name')}
          value={name}
          hasFocusOnMount
          {...(problem === null ? {} : { error: problem })}
          onValueChange={(next) => {
            setName(next);
            setProblem(null);
          }}
        />

        <TextField
          label={say('common.description')}
          value={description}
          placeholder={say('common.description')}
          onValueChange={setDescription}
        />

        {isSmart && !hasRulesItReads ? (
          <p className="text-[0.8125rem] text-text-muted">
            {say('common.theseRulesComeFromANewerValence')}
          </p>
        ) : isSmart ? (
          <SmartRulesEditor of="songs" draft={rules} isChecked={isChecked} onChange={setRules} />
        ) : (
          <>
            <Switch
              label={say('common.theOrderMatters')}
              isOn={isOrdered}
              onToggle={() => {
                setIsOrdered((was) => !was);
              }}
            />

            <p className="-mt-2 text-[0.8125rem] text-text-muted">
              {say('common.forChaptersASeriesInRelease')}
            </p>
          </>
        )}
      </DialogContent>

      <DialogFooter
        dismiss={{ onChoose: onClose }}
        confirm={{
          label: isNew ? say('common.create') : say('common.save'),
          onChoose: () => {
            void save();
          },
          isLoading: isSaving,
        }}
      />
    </Dialog>
  );
};

PlaylistDialog.displayName = 'PlaylistDialog';

export { PlaylistDialog };
