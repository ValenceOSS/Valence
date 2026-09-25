import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { createPlaylist, updatePlaylist } from '@ValenceClient/music/fetchPlaylists';
import { ASheet } from '@ValenceMobile/components/ASheet/ASheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { TextField } from '@ValenceMobile/components/TextField/TextField';
import { Toggle } from '@ValenceMobile/components/Toggle/Toggle';
import { Words } from '@ValenceMobile/components/Words/Words';
import { say } from '@ValenceI18n/say';
import type { APlaylistDetailsProps } from './APlaylistDetails.types';

const styles = StyleSheet.create({
  ordered: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  orderedWords: { flex: 1, gap: 2 },
});

/**
 * What a playlist is called, what it is for, and whether its order matters, in the phone's own
 * sheet — asked when one is made and changed when it is edited, as the web's playlist dialog asks.
 *
 * @param isOpen - Whether the sheet is up.
 * @param editing - The playlist being changed, or nothing for a new one.
 * @param onClose - Told the sheet was put away without saving.
 * @param onDone - Told which playlist was made or saved.
 */
const APlaylistDetails = ({ isOpen, editing, onClose, onDone }: APlaylistDetailsProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isOrdered, setIsOrdered] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName(editing?.name ?? '');
    setDescription(editing?.description ?? '');
    setIsOrdered(editing?.isOrdered ?? false);
    setProblem(null);
  }, [isOpen, editing]);

  const save = async () => {
    const called = name.trim();

    if (called === '') {
      setProblem(say('phone.aPlaylistDetails.needsAName'));

      return;
    }

    setIsSaving(true);

    const said = description.trim();

    if (editing === null) {
      const made = await createPlaylist({
        name: called,
        ...(said === '' ? {} : { description: said }),
        isOrdered,
      });

      setIsSaving(false);

      if (made === null) {
        setProblem(say('phone.aPlaylistDetails.couldNotMake'));

        return;
      }

      onDone(made.id);

      return;
    }

    const isSaved = await updatePlaylist(editing.id, {
      name: called,
      description: said === '' ? null : said,
      isOrdered,
    });

    setIsSaving(false);

    if (!isSaved) {
      setProblem(say('phone.aPlaylistDetails.couldNotSave'));

      return;
    }

    onDone(editing.id);
  };

  return (
    <ASheet
      isOpen={isOpen}
      title={
        editing === null
          ? say('phone.aPlaylistDetails.newTitle')
          : say('phone.aPlaylistDetails.editTitle')
      }
      closeLabel={say('common.cancel')}
      onClose={onClose}
    >
      <TextField
        label={say('phone.aPlaylistDetails.name')}
        value={name}
        onValueChange={setName}
        placeholder={say('phone.aPlaylistDetails.name')}
      />
      <TextField
        label={say('phone.aPlaylistDetails.description')}
        value={description}
        onValueChange={setDescription}
        placeholder={say('phone.aPlaylistDetails.descriptionPlaceholder')}
      />

      <View style={styles.ordered}>
        <View style={styles.orderedWords}>
          <Words>{say('phone.aPlaylistDetails.ordered')}</Words>
          <Words size="small" tone="muted">
            {say('phone.aPlaylistDetails.orderedDetail')}
          </Words>
        </View>
        <Toggle
          label={say('phone.aPlaylistDetails.ordered')}
          isOn={isOrdered}
          onToggle={setIsOrdered}
        />
      </View>

      {problem === null ? null : <Words tone="danger">{problem}</Words>}

      <Button
        isBusy={isSaving}
        onPress={() => {
          void save();
        }}
      >
        {editing === null ? say('phone.aPlaylistDetails.makeIt') : say('common.save')}
      </Button>
    </ASheet>
  );
};

APlaylistDetails.displayName = 'APlaylistDetails';

export { APlaylistDetails };
