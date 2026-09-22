import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { saveProfile, uploadProfilePhoto } from '@ValenceClient/profiles/fetchProfiles';
import { STILL_WATCHING_CHOICES } from '@ValenceClient/profiles/STILL_WATCHING_CHOICES';
import { AVATAR_STYLES, PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import { STILL_WATCHING_OFF } from '@ValenceContracts/schemas/StillWatching';
import { AFace } from '@ValencePhone/components/AFace/AFace';
import { thePictureFor } from '@ValencePhone/components/AFace/thePictureFor';
import { APicture } from '@ValencePhone/components/APicture/APicture';
import { Button } from '@ValencePhone/components/Button/Button';
import { SegmentedRow } from '@ValencePhone/components/SegmentedRow/SegmentedRow';
import { TextField } from '@ValencePhone/components/TextField/TextField';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { Avatar, ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';

const FACE = 56;

const SWATCH = 36;

const styles = StyleSheet.create({
  centred: { alignItems: 'center' },
  drawn: { borderRadius: 14, height: FACE, overflow: 'hidden', width: FACE },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  section: { gap: 10 },
  sideways: { gap: 10 },
  swatch: { borderRadius: SWATCH / 2, borderWidth: 3, height: SWATCH, width: SWATCH },
});

/**
 * How somebody appears: their name, their picture, the colour behind it, and how often Valence
 * checks they are still watching.
 *
 * Every change is a draft until Save, as on the web, so nobody sharing the server sees half of one.
 * A photograph is chosen from the phone's library through the system's picker, which needs no
 * permission because it only hands back what was chosen, and is sent before the rest is saved.
 */
const TheProfile = () => {
  const cache = useQueryClient();
  const colours = useTheColours();
  const asked = useQuery(profileQueries.watching());
  const profile = asked.data ?? null;
  const [name, setName] = useState<string | null>(null);
  const [colour, setColour] = useState<ProfileColour | null>(null);
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [askAfter, setAskAfter] = useState<number | null>(null);
  const [picked, setPicked] = useState<{ uri: string; type: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);

  if (profile === null) {
    return asked.isPending ? (
      <ActivityIndicator color={colours.textMuted} />
    ) : (
      <Words tone="danger">That profile could not be read.</Words>
    );
  }

  const draft = {
    ...profile,
    name: name ?? profile.name,
    colour: colour ?? profile.colour,
    avatar: avatar ?? profile.avatar,
    askStillWatchingAfter: askAfter ?? profile.askStillWatchingAfter,
  };
  const isChanged =
    picked !== null ||
    draft.name.trim() !== profile.name ||
    draft.colour !== profile.colour ||
    draft.askStillWatchingAfter !== profile.askStillWatchingAfter ||
    JSON.stringify(draft.avatar) !== JSON.stringify(profile.avatar);

  const choosePhoto = async () => {
    const chosen = await launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    const asset = chosen.assets?.[0];

    if (chosen.canceled || asset === undefined) {
      return;
    }

    setPicked({ uri: asset.uri, type: asset.mimeType ?? 'image/jpeg' });
    setAvatar({ kind: 'photo', isVideo: false });
  };

  const save = async () => {
    setIsSaving(true);
    setRefusal(null);

    const sent =
      picked === null ||
      (await uploadProfilePhoto(profile.id, await (await fetch(picked.uri)).blob(), picked.type));
    const saved =
      sent &&
      (await saveProfile(
        profile.id,
        draft.name.trim() === '' ? profile.name : draft.name.trim(),
        draft.colour,
        draft.avatar,
        draft.askStillWatchingAfter,
      ));

    setIsSaving(false);

    if (!saved) {
      setRefusal('Those changes were not saved.');

      return;
    }

    setName(null);
    setColour(null);
    setAvatar(null);
    setAskAfter(null);
    setPicked(null);
    await cache.invalidateQueries({ queryKey: profileQueries.key });
    await cache.invalidateQueries({ queryKey: sessionQueries.key });
  };

  return (
    <>
      <View style={styles.centred}>
        <AFace profile={draft} picked={picked?.uri ?? null} />
      </View>

      <TextField label="Name" value={draft.name} onValueChange={setName} placeholder="Your name" />

      <View style={styles.section}>
        <Words size="heading">Picture</Words>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sideways}
        >
          {AVATAR_STYLES.map((style) => {
            const face: Avatar = { kind: 'drawn', style, seed: profile.id };
            const picture = thePictureFor({ ...profile, avatar: face });

            return (
              <Button
                key={style}
                tone="bare"
                label={`Use the ${style} face`}
                isChosen={draft.avatar.kind === 'drawn' && draft.avatar.style === style}
                onPress={() => {
                  setPicked(null);
                  setAvatar(face);
                }}
              >
                <View style={[styles.drawn, { backgroundColor: draft.colour }]}>
                  {picture === null ? null : (
                    <APicture picture={picture} onMissing={() => undefined} />
                  )}
                </View>
              </Button>
            );
          })}
        </ScrollView>

        <Button
          tone="quiet"
          onPress={() => {
            void choosePhoto();
          }}
        >
          Choose a photo
        </Button>

        <Button
          tone="quiet"
          onPress={() => {
            setPicked(null);
            setAvatar({ kind: 'initial' });
          }}
        >
          Use my initial
        </Button>
      </View>

      <View style={styles.section}>
        <Words size="heading">Colour</Words>

        <View style={styles.row}>
          {PROFILE_COLOURS.map((option) => (
            <Button
              key={option}
              tone="bare"
              label={`Use ${option}`}
              isChosen={option === draft.colour}
              onPress={() => {
                setColour(option);
              }}
            >
              <View
                style={[
                  styles.swatch,
                  {
                    backgroundColor: option,
                    borderColor: option === draft.colour ? colours.text : option,
                  },
                ]}
              />
            </Button>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Words size="heading">Ask if you are still watching</Words>
        <Words size="small" tone="muted">
          After this many episodes play by themselves.
        </Words>

        <SegmentedRow
          label="Ask if you are still watching"
          items={STILL_WATCHING_CHOICES}
          value={
            draft.askStillWatchingAfter === STILL_WATCHING_OFF
              ? 'off'
              : draft.askStillWatchingAfter.toString()
          }
          onSelect={(chosen) => {
            setAskAfter(chosen === 'off' ? STILL_WATCHING_OFF : Number(chosen));
          }}
        />
      </View>

      {refusal === null ? null : <Words tone="danger">{refusal}</Words>}

      <Button
        isBusy={isSaving}
        isDisabled={!isChanged}
        onPress={() => {
          void save();
        }}
      >
        Save
      </Button>
    </>
  );
};

TheProfile.displayName = 'TheProfile';

export { TheProfile };
