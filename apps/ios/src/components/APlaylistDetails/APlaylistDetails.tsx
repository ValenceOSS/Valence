import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { createPlaylist, updatePlaylist } from '@ValenceClient/music/fetchPlaylists';
import { ASheet } from '@ValencePhone/components/ASheet/ASheet';
import { Button } from '@ValencePhone/components/Button/Button';
import { TextField } from '@ValencePhone/components/TextField/TextField';
import { Toggle } from '@ValencePhone/components/Toggle/Toggle';
import { Words } from '@ValencePhone/components/Words/Words';
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
      setProblem('A playlist needs a name.');

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
        setProblem('That playlist could not be made.');

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
      setProblem('That could not be saved.');

      return;
    }

    onDone(editing.id);
  };

  return (
    <ASheet
      isOpen={isOpen}
      title={editing === null ? 'New playlist' : 'Edit playlist'}
      closeLabel="Cancel"
      onClose={onClose}
    >
      <TextField label="Name" value={name} onValueChange={setName} placeholder="Name" />
      <TextField
        label="Description"
        value={description}
        onValueChange={setDescription}
        placeholder="What it is for"
      />

      <View style={styles.ordered}>
        <View style={styles.orderedWords}>
          <Words>The order matters</Words>
          <Words size="small" tone="muted">
            For chapters, a series in release order, or anything that should never shuffle or
            repeat.
          </Words>
        </View>
        <Toggle label="The order matters" isOn={isOrdered} onToggle={setIsOrdered} />
      </View>

      {problem === null ? null : <Words tone="danger">{problem}</Words>}

      <Button
        isBusy={isSaving}
        onPress={() => {
          void save();
        }}
      >
        {editing === null ? 'Make it' : 'Save'}
      </Button>
    </ASheet>
  );
};

APlaylistDetails.displayName = 'APlaylistDetails';

export { APlaylistDetails };
