import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import {
  UIImagePickerPreferredAssetRepresentationMode,
  launchImageLibraryAsync,
} from 'expo-image-picker';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { saveProfile } from '@ValenceClient/profiles/fetchProfiles';
import { STILL_WATCHING_CHOICES } from '@ValenceClient/profiles/STILL_WATCHING_CHOICES';
import { AVATAR_STYLES, PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import { STILL_WATCHING_OFF } from '@ValenceContracts/schemas/StillWatching';
import { CaseSensitive, ImagePlus } from '@keyline-icons/react-native';
import { AFace } from '@ValenceMobile/components/AFace/AFace';
import { thePictureFor } from '@ValenceMobile/components/AFace/thePictureFor';
import { AGroup } from '@ValenceMobile/components/AGroup/AGroup';
import { APicture } from '@ValenceMobile/components/APicture/APicture';
import { Button } from '@ValenceMobile/components/Button/Button';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import { TextField } from '@ValenceMobile/components/TextField/TextField';
import { Words } from '@ValenceMobile/components/Words/Words';
import { sendAPhoto } from '@ValenceMobile/platform/sendAPhoto';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { Avatar, ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';

const FACE = 52;

const SWATCH = 30;

const RING = 2;

const styles = StyleSheet.create({
  asks: { gap: 4 },
  drawn: { borderRadius: 12, height: FACE, overflow: 'hidden', width: FACE },
  head: { alignItems: 'center', gap: 14 },
  picks: { flexDirection: 'row', gap: 10 },
  ring: { borderRadius: 14 + RING, borderWidth: RING, padding: RING },
  row: { gap: 12, padding: 16 },
  sideways: { gap: 10, paddingHorizontal: 16 },
  sidewaysRow: { paddingVertical: 16 },
  swatch: { borderRadius: SWATCH / 2, height: SWATCH, width: SWATCH },
  swatchRing: { borderRadius: SWATCH / 2 + RING * 2, borderWidth: RING, padding: RING },
  swatches: { flexDirection: 'row', justifyContent: 'space-between' },
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
  const [picked, setPicked] = useState<{ uri: string } | null>(null);
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
      preferredAssetRepresentationMode: UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    const asset = chosen.assets?.[0];

    if (chosen.canceled || asset === undefined) {
      return;
    }

    setPicked({ uri: asset.uri });
    setAvatar({ kind: 'photo', isVideo: false });
  };

  const save = async () => {
    setIsSaving(true);
    setRefusal(null);

    const turnedDown =
      picked === null ? null : await sendAPhoto(`/api/profiles/${profile.id}/photo`, picked.uri);

    if (turnedDown !== null) {
      setIsSaving(false);
      setRefusal(turnedDown);

      return;
    }

    const saved = await saveProfile(
      profile.id,
      draft.name.trim() === '' ? profile.name : draft.name.trim(),
      draft.colour,
      draft.avatar,
      draft.askStillWatchingAfter,
    );

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
      <View style={styles.head}>
        <AFace profile={draft} picked={picked?.uri ?? null} isLarge />

        <View style={styles.picks}>
          <Button
            tone="ghost"
            icon={ImagePlus}
            onPress={() => {
              void choosePhoto();
            }}
          >
            Choose a photo
          </Button>

          <Button
            tone="ghost"
            icon={CaseSensitive}
            isChosen={draft.avatar.kind === 'initial'}
            onPress={() => {
              setPicked(null);
              setAvatar({ kind: 'initial' });
            }}
          >
            Use my initial
          </Button>
        </View>
      </View>

      <TextField label="Name" value={draft.name} onValueChange={setName} placeholder="Your name" />

      <AGroup title="Picture">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sidewaysRow}
          contentContainerStyle={styles.sideways}
        >
          {AVATAR_STYLES.map((style) => {
            const face: Avatar = { kind: 'drawn', style, seed: profile.id };
            const picture = thePictureFor({ ...profile, avatar: face });
            const isChosen = draft.avatar.kind === 'drawn' && draft.avatar.style === style;

            return (
              <Button
                key={style}
                tone="bare"
                label={`Use the ${style} face`}
                isChosen={isChosen}
                onPress={() => {
                  setPicked(null);
                  setAvatar(face);
                }}
              >
                <View
                  style={[styles.ring, { borderColor: isChosen ? colours.accent : 'transparent' }]}
                >
                  <View style={[styles.drawn, { backgroundColor: draft.colour }]}>
                    {picture === null ? null : (
                      <APicture picture={picture} onMissing={() => undefined} />
                    )}
                  </View>
                </View>
              </Button>
            );
          })}
        </ScrollView>

        <View style={[styles.row, styles.swatches]}>
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
                  styles.swatchRing,
                  { borderColor: option === draft.colour ? colours.accent : 'transparent' },
                ]}
              >
                <View style={[styles.swatch, { backgroundColor: option }]} />
              </View>
            </Button>
          ))}
        </View>
      </AGroup>

      <AGroup title="Still watching">
        <View style={styles.row}>
          <View style={styles.asks}>
            <Words>Ask if you are still watching</Words>
            <Words size="small" tone="muted">
              After this many episodes play by themselves.
            </Words>
          </View>

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
      </AGroup>

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
