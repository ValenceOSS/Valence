import { Share, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@ValenceMobile/components/Button/Button';
import { APanelButton } from '@ValenceMobile/components/Watching/components/APanelButton/APanelButton';
import { TextField } from '@ValenceMobile/components/TextField/TextField';
import { Toggle } from '@ValenceMobile/components/Toggle/Toggle';
import { SIDE_PANEL } from '@ValenceMobile/components/Watching/SIDE_PANEL';
import { TheSidePanel } from '@ValenceMobile/components/Watching/components/TheSidePanel/TheSidePanel';
import { describeDrift } from '@ValenceClient/party/describeDrift';
import { invitationTo } from '@ValenceClient/party/invitationTo';
import { ROLE_NAMES } from '@ValenceClient/party/ROLE_NAMES';
import { whoCanBeAsked } from '@ValenceClient/party/whoCanBeAsked';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import type { ThePartyProps } from './TheParty.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const styles = StyleSheet.create({
  ...SIDE_PANEL.styles,
  actions: { flexDirection: 'row', gap: 4, paddingHorizontal: 10 },
  textAction: {
    color: SIDE_PANEL.colours.text,
    fontSize: 13,
    paddingHorizontal: 6,
    paddingVertical: 6,
    textDecorationLine: 'underline',
  },
  member: { gap: 2, paddingVertical: 6 },
  section: { gap: 10 },
  setting: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingVertical: 6 },
  warning: { color: '#f5c451', fontSize: 13, paddingBottom: 4 },
});

/**
 * The watch party, from the player's own side panel, as the web's party menu has it: the way to
 * start one around what is playing; and once there is one, who is in it and whether they are
 * watching and in step, whoever the room is waiting for, the invitation to send through the phone's
 * own share sheet, the household to ask along, and — for whoever runs it — who may do what, who is
 * put out, and its password. Where a party asks this phone for its password, that is asked here.
 *
 * @param watchParty - The party this phone holds.
 * @param mediaId - What is playing, which a new party gathers around.
 * @param people - Everybody with an account here, to be asked along.
 * @param onClose - Told they are done with it.
 */
const TheParty = ({ watchParty, mediaId, people, onClose }: ThePartyProps) => {
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [asked, setAsked] = useState<readonly string[]>([]);
  const { meConnectionId, waitingFor, passwordWanted } = watchParty;
  const party = watchParty.party?.kind === 'watch' ? watchParty.party : null;
  const panel = (children: ReactNode) => (
    <TheSidePanel
      title={say('common.partyMenu.watchParty')}
      closeLabel={say('common.partyPanel.closeTheParty')}
      onClose={onClose}
    >
      {children}
    </TheSidePanel>
  );

  if (passwordWanted !== null) {
    return panel(
      <View style={styles.section}>
        <Text style={styles.label}>
          {say('common.partyPasswordDialog.thisWatchPartyHasAPassword')}
        </Text>
        <Text style={styles.note}>
          {passwordWanted.wasWrong
            ? say('common.partyPasswordDialog.thatIsNotThePasswordFor')
            : say('common.partyPasswordDialog.whoeverInvitedYouSetOneAsk')}
        </Text>
        <TextField
          label={say('common.partyPasswordDialog.watchPartyPassword')}
          value={password}
          onValueChange={setPassword}
          isSecret
          isLabelHidden
          onSubmit={() => {
            watchParty.join(passwordWanted.partyId, password);
          }}
        />
        <View style={styles.actions}>
          <APanelButton
            isStrong
            isDisabled={password.length === 0}
            onPress={() => {
              watchParty.join(passwordWanted.partyId, password);
            }}
            says={say('common.partyPasswordDialog.join')}
          />
          <APanelButton
            onPress={() => {
              watchParty.stopAsking();
              onClose();
            }}
            says={say('common.notNow')}
          />
        </View>
      </View>,
    );
  }

  if (party === null) {
    return panel(
      <View style={styles.section}>
        <Text style={styles.note}>{say('common.partyMenu.watchThisWithOtherPeopleHere')}</Text>
        <APanelButton
          isStrong
          onPress={() => {
            watchParty.open(mediaId);
          }}
          says={say('common.partyMenu.startAWatchParty')}
        />
      </View>,
    );
  }

  const me = party.members.find((member) => member.connectionId === meConnectionId);
  const timekeeper = party.members.find((member) => member.connectionId === party.timekeeperId);
  const watching = party.members.filter((member) => member.isWatching).length;
  const isHost = me?.role === 'host';
  const mayAsk = isHost || me?.role === 'coHost';
  const elsewhere = whoCanBeAsked(party, people);
  const invitation = invitationTo(party.id, party.mediaId, platformInUse().serverAddress() ?? '');

  return panel(
    <>
      <View>
        <Text style={styles.heading}>{sayCount('common.partyPanel.countWatching', watching)}</Text>

        {!party.isHeld || waitingFor.length === 0 ? null : (
          <Text style={styles.warning}>
            {waitingFor.length === 1
              ? say('common.partyPanel.waitingForNameToCatchUp', { name: waitingFor[0] ?? '' })
              : sayCount('common.partyPanel.waitingForPeopleToCatchUp', waitingFor.length)}
          </Text>
        )}

        {party.members.map((member) => {
          const drift = timekeeper === undefined ? null : describeDrift(member, timekeeper);
          const isMe = member.connectionId === meConnectionId;

          return (
            <View key={member.connectionId} style={styles.member}>
              <View style={styles.row}>
                <Text style={styles.label} numberOfLines={1}>
                  {isMe ? say('common.partyPanel.nameYou', { name: member.name }) : member.name}
                </Text>
                <Text style={styles.detail}>
                  {[
                    ROLE_NAMES[member.role],
                    member.connectionId === party.timekeeperId
                      ? say('common.partyPanel.keepingTime')
                      : null,
                    member.isWatching
                      ? say('common.watching')
                      : say('common.partyPanel.notWatching'),
                    drift,
                  ]
                    .filter((part) => part !== null)
                    .join(' · ')}
                </Text>
              </View>

              {!isHost || isMe ? null : (
                <View style={styles.actions}>
                  <Button
                    tone="bare"
                    onPress={() => {
                      watchParty.setRole(
                        member.connectionId,
                        member.role === 'coHost' ? 'guest' : 'coHost',
                      );
                    }}
                  >
                    <Text style={styles.textAction}>
                      {member.role === 'coHost'
                        ? say('common.partyPanel.makeAGuest')
                        : say('common.partyPanel.makeACoHost')}
                    </Text>
                  </Button>
                  <Button
                    tone="bare"
                    label={say('common.partyPanel.removeNameFromTheParty', { name: member.name })}
                    onPress={() => {
                      watchParty.remove(member.connectionId);
                    }}
                  >
                    <Text style={styles.textAction}>{say('common.remove')}</Text>
                  </Button>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>{say('common.partyPanel.invite')}</Text>
        <Text style={styles.note}>{say('common.partyPanel.sendThisToWatchAlong')}</Text>
        <APanelButton
          onPress={() => {
            void Share.share({ url: invitation, message: invitation });
          }}
          says={say('common.partyPanel.shareTheInvitation')}
        />
      </View>

      {!mayAsk || elsewhere.length === 0 ? null : (
        <View>
          <Text style={styles.heading}>{say('common.partyPanel.askAlong')}</Text>
          <Text style={styles.note}>{say('common.partyPanel.askSomebodyAlongTheyAreTold')}</Text>

          {elsewhere.map((person) => (
            <Button
              key={person.id}
              tone="bare"
              isDisabled={asked.includes(person.id)}
              label={say('common.partyPanel.askNameAlong', { name: person.name })}
              onPress={() => {
                setAsked((already) => [...already, person.id]);
                watchParty.ask(person.id);
              }}
            >
              <View style={[styles.row, asked.includes(person.id) && styles.disabledRow]}>
                <Text style={styles.label} numberOfLines={1}>
                  {person.name}
                </Text>
                <Text style={styles.detail}>
                  {asked.includes(person.id)
                    ? say('common.partyPanel.asked')
                    : say('common.partyPanel.ask')}
                </Text>
              </View>
            </Button>
          ))}
        </View>
      )}

      {!isHost ? null : (
        <View style={styles.section}>
          <Text style={styles.heading}>{say('common.partyPanel.controls')}</Text>

          <View style={styles.setting}>
            <Text style={styles.label}>{say('common.partyPanel.everyoneCanPlayAndPause')}</Text>
            <Toggle
              label={say('common.partyPanel.everyoneCanPlayAndPause')}
              isOn={party.everyoneMayPlayPause}
              onToggle={(isOn) => {
                watchParty.loosen({ everyoneMayPlayPause: isOn });
              }}
            />
          </View>

          <View style={styles.setting}>
            <Text style={styles.label}>{say('common.partyPanel.everyoneCanSkipAround')}</Text>
            <Toggle
              label={say('common.partyPanel.everyoneCanSkipAround')}
              isOn={party.everyoneMaySeek}
              onToggle={(isOn) => {
                watchParty.loosen({ everyoneMaySeek: isOn });
              }}
            />
          </View>

          <Text style={styles.note}>{say('common.partyPanel.skippingIsTheDisruptiveOneA')}</Text>

          <Text style={styles.note}>
            {party.hasPassword
              ? say('common.partyPanel.thisPartyHasAPasswordAnybody')
              : say('common.partyPanel.aPasswordAsksAnybodyOpeningThe')}
          </Text>

          <Text style={styles.heading}>{say('common.partyPanel.partyPassword')}</Text>

          <TextField
            label={say('common.partyPanel.partyPassword')}
            isLabelHidden
            value={newPassword}
            onValueChange={setNewPassword}
            placeholder={
              party.hasPassword
                ? say('common.partyPanel.setANewOne')
                : say('common.partyPanel.noPassword')
            }
            isSecret
          />

          <View style={styles.actions}>
            <APanelButton
              isStrong
              isDisabled={newPassword.length === 0}
              onPress={() => {
                watchParty.setPassword(newPassword);
                setNewPassword('');
              }}
              says={say('common.partyPanel.set')}
            />

            {party.hasPassword ? (
              <APanelButton
                onPress={() => {
                  watchParty.setPassword(null);
                  setNewPassword('');
                }}
                says={say('common.clear')}
              />
            ) : null}
          </View>
        </View>
      )}

      <APanelButton
        onPress={() => {
          watchParty.leave();
          onClose();
        }}
        says={say('common.partyPanel.leave')}
      />
    </>,
  );
};

TheParty.displayName = 'TheParty';

export { TheParty };
