import type { AdminShare } from '@ValenceContracts/schemas/Share';

/**
 * A shared link for a test: a film handed out by one account, never opened, with no end date or
 * allowance, with anything the test cares about changed.
 *
 * @param overrides - What to change.
 * @returns The link, as the admin list shows it.
 */
const anAdminShare = (overrides: Partial<AdminShare> = {}): AdminShare => ({
  id: 'share-1',
  kind: 'item',
  mediaId: 'media-1',
  seriesId: null,
  bookId: null,
  title: 'The Thing',
  createdAt: '2026-08-10T09:00:00.000Z',
  expiresAt: null,
  viewCap: null,
  views: 0,
  isRevoked: false,
  episode: null,
  isSpent: false,
  createdBy: 'account-1',
  createdByName: 'Ada',
  createdByProfileName: null,
  ...overrides,
});

export { anAdminShare };
