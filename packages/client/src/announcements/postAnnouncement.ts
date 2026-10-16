import type { AnnouncementDraft } from '@ValenceContracts/schemas/Announcement';

/**
 * Puts an announcement up for everybody, in place of any there was, or takes it down where given
 * nothing.
 *
 * @param draft - What it says, how serious it is and when it ends, or null to take it down.
 * @returns Whether the server took it.
 */
const postAnnouncement = async (draft: AnnouncementDraft | null): Promise<boolean> => {
  const response = await fetch('/api/admin/announcement', {
    method: draft === null ? 'DELETE' : 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    ...(draft === null ? {} : { body: JSON.stringify(draft) }),
  }).catch(() => null);

  return response !== null && response.ok;
};

export { postAnnouncement };
