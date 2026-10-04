import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import {
  Crown,
  DoorOpen,
  KeyRound,
  Play,
  UserPlus,
  UserX,
  Users,
} from '@keyline-icons/react-native';
import { ActionRow } from '@ValenceTv/components/ActionRow/ActionRow';
import { QrCode } from '@ValenceTv/components/QrCode/QrCode';
import { TextField } from '@ValenceTv/components/TextField/TextField';
import { SidePanel } from '@ValenceTv/components/SidePanel/SidePanel';
import { tokens } from '@ValenceTv/theme/tokens';
import { describeDrift } from '@ValenceClient/party/describeDrift';
import { invitationTo } from '@ValenceClient/party/invitationTo';
import { listeningInvitationTo } from '@ValenceClient/party/listeningInvitationTo';
import { PARTY_WORDS } from '@ValenceClient/party/PARTY_WORDS';
import { ROLE_NAMES } from '@ValenceClient/party/ROLE_NAMES';
import { whoCanBeAsked } from '@ValenceClient/party/whoCanBeAsked';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import type { PartyPanelProps } from './PartyPanel.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const INVITATION_SIZE = 240;

/**
 * A watch party or a listening party, in a panel down the right, as the web's party panels have
 * them: the way to start one around what is playing; and once there is one, who is in it and
 * whether they are watching or listening and in step, whoever the room is waiting for, the
 * invitation as a code a phone can scan, the household to ask along, and — for whoever runs it — who
 * may do what, who is put out, and its password. Where a party asks this television for its
 * password, that is asked here. A listening party is not offered to somebody already in a watch
 * party, since nobody can be in two at once.
 *
 * @param kind - Which kind of party this is about.
 * @param watchParty - The party this television holds.
 * @param mediaId - What is playing, which a new party gathers around, or nothing yet.
 * @param people - Everybody with an account here, to be asked along.
 * @param onLeave - Told they have left the party, or gone without its password.
 */
const PartyPanel = ({ kind, watchParty, mediaId, people, onLeave }: PartyPanelProps) => {
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [asked, setAsked] = useState<readonly string[]>([]);
  const [passwordsSet, setPasswordsSet] = useState(0);
  const setTheParty = (to: string | null) => {
    watchParty.setPassword(to);
    setNewPassword('');
    setPasswordsSet((was) => was + 1);
  };
  const { meConnectionId, waitingFor, passwordWanted } = watchParty;
  const party = watchParty.party?.kind === kind ? watchParty.party : null;
  const words = PARTY_WORDS[kind];
  const { title } = words;

  if (passwordWanted !== null) {
    const join = () => {
      if (password.length > 0) {
        watchParty.join(passwordWanted.partyId, password);
      }
    };

    return (
      <SidePanel title={title}>
        <Text style={styles.heading}>
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
          onChange={setPassword}
          onSubmit={join}
          isSecret
          hasPreferredFocus
        />
        <ActionRow
          label={say('common.partyPasswordDialog.join')}
          icon={Play}
          isDisabled={password.length === 0}
          onPress={join}
        />
        <ActionRow
          label={say('common.notNow')}
          onPress={() => {
            watchParty.stopAsking();
            onLeave();
          }}
        />
      </SidePanel>
    );
  }

  if (party === null && kind === 'listen' && watchParty.party !== null) {
    return (
      <SidePanel title={title}>
        <Text style={styles.heading}>{say('common.listeningPartyPanel.youAreInAWatchParty')}</Text>
        <Text style={styles.note}>
          {say('common.listeningPartyPanel.leaveItBeforeStartingAParty')}
        </Text>
      </SidePanel>
    );
  }

  if (party === null) {
    return (
      <SidePanel title={title}>
        <Text style={styles.note}>
          {mediaId === null
            ? say('common.listeningPartyPanel.playSomethingThenStartAParty')
            : words.intro}
        </Text>
        <ActionRow
          label={words.start}
          icon={Users}
          hasPreferredFocus
          isDisabled={mediaId === null}
          onPress={() => {
            if (mediaId !== null) {
              watchParty.open(mediaId, kind);
            }
          }}
        />
      </SidePanel>
    );
  }

  const me = party.members.find((member) => member.connectionId === meConnectionId);
  const timekeeper = party.members.find((member) => member.connectionId === party.timekeeperId);
  const watching = party.members.filter((member) => member.isWatching).length;
  const isHost = me?.role === 'host';
  const mayAsk = isHost || me?.role === 'coHost';
  const elsewhere = whoCanBeAsked(party, people);
  const origin = platformInUse().serverAddress() ?? '';
  const invitation =
    kind === 'watch'
      ? invitationTo(party.id, party.mediaId, origin)
      : listeningInvitationTo(party.id, origin);

  return (
    <SidePanel title={title}>
      <Text style={styles.heading}>{sayCount(words.doing, watching)}</Text>

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
        const name = isMe ? say('common.partyPanel.nameYou', { name: member.name }) : member.name;
        const detail = [
          ROLE_NAMES[member.role],
          member.connectionId === party.timekeeperId ? say('common.partyPanel.keepingTime') : null,
          member.isWatching ? words.isDoing : words.notDoing,
          drift,
        ]
          .filter((part) => part !== null)
          .join(' · ');

        return (
          <View key={member.connectionId}>
            <View style={styles.member}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.note}>{detail}</Text>
            </View>

            {!isHost || isMe ? null : (
              <>
                <ActionRow
                  label={
                    member.role === 'coHost'
                      ? say('common.partyPanel.makeAGuest')
                      : say('common.partyPanel.makeACoHost')
                  }
                  icon={Crown}
                  onPress={() => {
                    watchParty.setRole(
                      member.connectionId,
                      member.role === 'coHost' ? 'guest' : 'coHost',
                    );
                  }}
                />
                <ActionRow
                  label={say('common.partyPanel.removeNameFromTheParty', { name: member.name })}
                  icon={UserX}
                  onPress={() => {
                    watchParty.remove(member.connectionId);
                  }}
                />
              </>
            )}
          </View>
        );
      })}

      <Text style={styles.heading}>{say('common.partyPanel.ask')}</Text>
      <Text style={styles.note}>{words.invitation}</Text>
      <View style={styles.code}>
        <QrCode value={invitation} size={INVITATION_SIZE} label={say('common.partyPanel.ask')} />
      </View>

      {!mayAsk || elsewhere.length === 0 ? null : (
        <>
          <Text style={styles.heading}>{say('common.partyPanel.askAlong')}</Text>
          <Text style={styles.note}>{say('common.partyPanel.askSomebodyAlongTheyAreTold')}</Text>

          {elsewhere.map((person) => (
            <ActionRow
              key={person.id}
              label={say('common.partyPanel.askNameAlong', { name: person.name })}
              icon={UserPlus}
              {...(asked.includes(person.id) ? { detail: say('common.partyPanel.asked') } : {})}
              isDisabled={asked.includes(person.id)}
              onPress={() => {
                setAsked((already) => [...already, person.id]);
                watchParty.ask(person.id);
              }}
            />
          ))}
        </>
      )}

      {!isHost ? null : (
        <>
          <Text style={styles.heading}>{say('common.partyPanel.controls')}</Text>
          <ActionRow
            label={say('common.partyPanel.everyoneCanPlayAndPause')}
            detail={party.everyoneMayPlayPause ? say('common.on') : say('common.off')}
            onPress={() => {
              watchParty.loosen({ everyoneMayPlayPause: !party.everyoneMayPlayPause });
            }}
          />
          <ActionRow
            label={say('common.partyPanel.everyoneCanSkipAround')}
            detail={party.everyoneMaySeek ? say('common.on') : say('common.off')}
            onPress={() => {
              watchParty.loosen({ everyoneMaySeek: !party.everyoneMaySeek });
            }}
          />
          <Text style={styles.note}>{say('common.partyPanel.skippingIsTheDisruptiveOneA')}</Text>
          <Text style={styles.note}>
            {party.hasPassword
              ? say('common.partyPanel.thisPartyHasAPasswordAnybody')
              : say('common.partyPanel.aPasswordAsksAnybodyOpeningThe')}
          </Text>
          <TextField
            key={passwordsSet}
            label={say('common.partyPanel.partyPassword')}
            value={newPassword}
            onChange={setNewPassword}
            onSubmit={() => {
              if (newPassword.length > 0) {
                setTheParty(newPassword);
              }
            }}
            isSecret
            placeholder={
              party.hasPassword
                ? say('common.partyPanel.setANewOne')
                : say('common.partyPanel.noPassword')
            }
          />
          <ActionRow
            label={say('common.partyPanel.set')}
            icon={KeyRound}
            isDisabled={newPassword.length === 0}
            onPress={() => {
              setTheParty(newPassword);
            }}
          />
          {party.hasPassword ? (
            <ActionRow
              label={say('common.clear')}
              onPress={() => {
                setTheParty(null);
              }}
            />
          ) : null}
        </>
      )}

      <ActionRow
        label={say('common.partyPanel.leave')}
        icon={DoorOpen}
        hasPreferredFocus
        onPress={() => {
          watchParty.leave();
          onLeave();
        }}
      />
    </SidePanel>
  );
};

PartyPanel.displayName = 'PartyPanel';

const styles = StyleSheet.create({
  heading: {
    color: tokens.colours.text,
    fontSize: tokens.type.body,
    fontWeight: '700',
    marginTop: tokens.space.md,
    paddingHorizontal: tokens.space.md,
  },
  note: {
    color: tokens.colours.muted,
    fontSize: tokens.type.small,
    paddingHorizontal: tokens.space.md,
  },
  warning: {
    color: tokens.colours.accent,
    fontSize: tokens.type.small,
    paddingHorizontal: tokens.space.md,
  },
  member: { gap: 2, paddingVertical: tokens.space.xs },
  name: {
    color: tokens.colours.text,
    fontSize: tokens.type.body,
    fontWeight: '600',
    paddingHorizontal: tokens.space.md,
  },
  code: { alignItems: 'flex-start', paddingHorizontal: tokens.space.md },
});

export { PartyPanel };
