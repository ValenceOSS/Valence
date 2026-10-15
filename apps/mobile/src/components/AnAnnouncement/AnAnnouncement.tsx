import { TheNotice } from '@ValenceMobile/components/TheNotice/TheNotice';
import { useAnnouncement } from '@ValenceClient/announcements/useAnnouncement';

/**
 * The announcement an administrator has up for everybody, held at the top of whatever the phone is
 * showing until it is put away, the same note the player holds a message from the server in. Once
 * put away it stays away on this phone until a different one is posted.
 */
const AnAnnouncement = () => {
  const { announcement, dismiss } = useAnnouncement();

  return announcement === null ? null : <TheNotice says={announcement.text} onDismiss={dismiss} />;
};

AnAnnouncement.displayName = 'AnAnnouncement';

export { AnAnnouncement };
