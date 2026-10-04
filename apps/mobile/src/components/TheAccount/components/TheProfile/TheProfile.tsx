import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ImagePlus } from '@keyline-icons/react-native';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { saveProfile } from '@ValenceClient/profiles/fetchProfiles';
import { STILL_WATCHING_CHOICES } from '@ValenceClient/profiles/STILL_WATCHING_CHOICES';
import { STILL_WATCHING_OFF } from '@ValenceContracts/schemas/StillWatching';
import { AFace } from '@ValenceMobile/components/AFace/AFace';
import { AFaceEditor } from '@ValenceMobile/components/AFaceEditor/AFaceEditor';
import { AGroup } from '@ValenceMobile/components/AGroup/AGroup';
import { Button } from '@ValenceMobile/components/Button/Button';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import { TextField } from '@ValenceMobile/components/TextField/TextField';
import { Toggle } from '@ValenceMobile/components/Toggle/Toggle';
import { Words } from '@ValenceMobile/components/Words/Words';
import { sendAPhoto } from '@ValenceMobile/platform/sendAPhoto';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { Avatar, ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  asks: { gap: 4 },
  head: { alignItems: 'center', gap: 14 },
  row: { gap: 12, padding: 16 },
});

/**
 * The Edit profile page: the profile's picture, with the editor that changes it, its name, and how
 * playback behaves for it.
 *
 * Every change is a draft until Save, as on the web, so nobody sharing the server sees half of one.
 * A picture chosen in the editor that has a file, a photo or a sketch, is sent before
 * the rest is saved.
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
  const [prefersBest, setPrefersBest] = useState<boolean | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);

  if (profile === null) {
    return asked.isPending ? (
      <ActivityIndicator color={colours.textMuted} />
    ) : (
      <Words tone="danger">{say('phone.theAccount.theProfile.thatProfileCouldNotBeRead')}</Words>
    );
  }

  const draft = {
    ...profile,
    name: name ?? profile.name,
    colour: colour ?? profile.colour,
    avatar: avatar ?? profile.avatar,
    askStillWatchingAfter: askAfter ?? profile.askStillWatchingAfter,
    prefersBestCopy: prefersBest ?? profile.prefersBestCopy,
  };
  const isChanged =
    picked !== null ||
    draft.name.trim() !== profile.name ||
    draft.colour !== profile.colour ||
    draft.askStillWatchingAfter !== profile.askStillWatchingAfter ||
    draft.prefersBestCopy !== profile.prefersBestCopy ||
    JSON.stringify(draft.avatar) !== JSON.stringify(profile.avatar);

  const save = async () => {
    setIsSaving(true);
    setRefusal(null);

    const turnedDown =
      picked === null ? null : await sendAPhoto(`/api/profiles/${profile.id}/photo`, picked);

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
      undefined,
      draft.prefersBestCopy,
    );

    setIsSaving(false);

    if (!saved) {
      setRefusal(say('common.thoseChangesWereNotSaved'));

      return;
    }

    setName(null);
    setColour(null);
    setAvatar(null);
    setAskAfter(null);
    setPrefersBest(null);
    setPicked(null);
    await cache.invalidateQueries({ queryKey: profileQueries.key });
    await cache.invalidateQueries({ queryKey: sessionQueries.key });
  };

  return (
    <>
      <View style={styles.head}>
        <AFace profile={draft} picked={picked} isLarge />

        <Button
          tone="quiet"
          icon={ImagePlus}
          onPress={() => {
            setIsEditing(true);
          }}
        >
          {say('phone.theAccount.theProfile.changePicture')}
        </Button>
      </View>

      <AGroup title={say('common.name')}>
        <View style={styles.row}>
          <TextField
            label={say('common.name')}
            value={draft.name}
            onValueChange={setName}
            placeholder={say('common.yourName')}
            isLabelHidden
          />
        </View>
      </AGroup>

      <AGroup title={say('phone.theAccount.theProfile.whileWatching')}>
        <View style={styles.row}>
          <View style={styles.asks}>
            <Words>{say('common.askIfYouAreStillWatching')}</Words>
            <Words size="small" tone="muted">
              {say('phone.theAccount.theProfile.afterThisManyEpisodesPlayBy')}
            </Words>
          </View>

          <SegmentedRow
            label={say('common.askIfYouAreStillWatching')}
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

        <View style={styles.row}>
          <View style={styles.asks}>
            <Words>{say('screens.accountArea.profileSettings.preferTheBestCopy')}</Words>
            <Words size="small" tone="muted">
              {say('screens.accountArea.profileSettings.whereALinkedServerHasABetter')}
            </Words>
          </View>
          <Toggle
            label={say('screens.accountArea.profileSettings.preferTheBestCopy')}
            isOn={draft.prefersBestCopy}
            onToggle={setPrefersBest}
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
        {say('common.save')}
      </Button>

      <AFaceEditor
        key={isEditing ? 'open' : 'shut'}
        isOpen={isEditing}
        profile={draft}
        onClose={() => {
          setIsEditing(false);
        }}
        onUse={(choice) => {
          setAvatar(choice.avatar);
          setColour(choice.colour);
          setPicked(choice.file);
          setIsEditing(false);
        }}
      />
    </>
  );
};

TheProfile.displayName = 'TheProfile';

export { TheProfile };
