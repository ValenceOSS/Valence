import { HeadphonesIcon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { NothingHere } from '@ValenceUI/NothingHere';
import { useShell } from '@ValenceClient/shell/useShell';
import { PartyPanel } from '@ValenceScreens/components/PartyPanel/PartyPanel';
import { listeningInvitationTo } from '@ValenceScreens/party/listeningInvitationTo';
import { useListeningParty } from '@ValenceScreens/music/listeningParty';
import { theMusicPlayer } from '@ValenceScreens/music/theMusicPlayer';
import { useMusicPlayer } from '@ValenceScreens/music/useMusicPlayer';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import type { ListeningPartyPanelProps } from './ListeningPartyPanel.types';

/**
 * Listening together: starting a party from whatever is playing, and — once in one — who is there,
 * the link that brings somebody else in, and the host's say over who may do what.
 *
 * Starting one needs a song playing, since a party is somebody's music shared rather than an empty
 * room; the host then chooses the songs and where they are, and everybody else keeps their own
 * volume. A window already watching a film with somebody is told so rather than offered a second
 * party it could not be in at the same time.
 *
 * @param player - The player whose song a party would start from, which is the window's own unless
 *   a test says otherwise.
 */
const ListeningPartyPanel = ({ player: given }: ListeningPartyPanelProps) => {
  const { watchParty, household } = useShell();
  const { state } = useMusicPlayer(given ?? theMusicPlayer());
  const listening = useListeningParty();
  const { go } = usePlace();

  if (listening !== null) {
    return (
      <PartyPanel
        party={listening.party}
        meConnectionId={watchParty.meConnectionId}
        people={household}
        invitation={listeningInvitationTo(listening.party.id)}
        onCopyInvitation={async (invitation) => {
          await navigator.clipboard.writeText(invitation);
        }}
        onSetRole={watchParty.setRole}
        onLoosen={watchParty.loosen}
        onRemove={watchParty.remove}
        onSetPassword={watchParty.setPassword}
        onAsk={watchParty.ask}
        onLeave={() => {
          watchParty.leave();
          go({ party: null });
        }}
      />
    );
  }

  if (watchParty.party !== null) {
    return (
      <NothingHere
        of={UserGroupIcon}
        title="You are in a watch party"
        detail="Leave it before starting a party to listen together."
      />
    );
  }

  const song = state.current;

  return (
    <NothingHere
      of={HeadphonesIcon}
      title="Listen together"
      detail={
        song === null
          ? 'Play something, then start a party and send the link to anybody with an account here.'
          : 'Everybody hears what you play, where you are in it. Each of them keeps their own volume.'
      }
      action={
        <Button
          variant="glossy"
          size="sm"
          disabled={song === null}
          onClick={() => {
            if (song !== null) {
              watchParty.open(song.id, 'listen');
            }
          }}
        >
          <Icon of={UserGroupIcon} size={16} />
          Start a listening party
        </Button>
      }
    />
  );
};

ListeningPartyPanel.displayName = 'ListeningPartyPanel';

export { ListeningPartyPanel };
