import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { announcementQueries } from '@ValenceClient/query/announcementQueries';
import {
  dismissAnnouncement,
  readDismissedAnnouncement,
} from '@ValenceClient/announcements/dismissedAnnouncement';
import type { Announcement } from '@ValenceContracts/schemas/Announcement';

/**
 * The announcement to show over whatever is on screen, and a way to put it away: once put away it
 * stays away on this device, until an administrator posts a different one.
 *
 * @returns The announcement to show, or null, and how to put it away.
 */
const useAnnouncement = (): { announcement: Announcement | null; dismiss: () => void } => {
  const asked = useQuery(announcementQueries.current());
  const [dismissed, setDismissed] = useState(readDismissedAnnouncement);
  const announcement = asked.data ?? null;

  return {
    announcement: announcement === null || announcement.id === dismissed ? null : announcement,
    dismiss: () => {
      if (announcement === null) {
        return;
      }

      dismissAnnouncement(announcement.id);
      setDismissed(announcement.id);
    },
  };
};

export { useAnnouncement };
