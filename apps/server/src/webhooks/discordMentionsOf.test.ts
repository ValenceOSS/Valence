import { describe, expect, it } from 'vitest';
import { WEBHOOK_PAYLOAD_VERSION } from '@ValenceContracts/schemas/Webhook';
import { discordMentionsOf } from './discordMentionsOf';
import type { WebhookPayload, WebhookRequest } from '@ValenceContracts/schemas/Webhook';

const anEnvelope = {
  version: WEBHOOK_PAYLOAD_VERSION,
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  occurredAt: '2026-10-20T20:00:00.000Z',
} as const;

const aRequest: WebhookRequest = {
  id: 'request-1',
  kind: 'series',
  title: 'A Series',
  artistName: null,
  year: 2026,
  overview: null,
  posterUrl: null,
  requestedBy: 'Sam',
  requestedByAccountId: 'account-1',
  requestedByProfile: null,
  requestedByProfileId: null,
  requestedByDiscordId: '100000000000000001',
  askers: [
    { accountId: 'account-1', profileId: null, discordId: '100000000000000001' },
    { accountId: 'account-1', profileId: 'profile-2', discordId: '100000000000000001' },
    { accountId: 'account-2', profileId: null, discordId: '100000000000000002' },
    { accountId: 'account-3', profileId: null, discordId: null },
  ],
  seasons: [1],
  state: 'available',
};

const available = (request: WebhookRequest | null): WebhookPayload => ({
  ...anEnvelope,
  event: 'requests.available',
  data: {
    title: 'A Series',
    requestedBy: 'Sam',
    mediaId: 'media-1',
    accountId: null,
    profileId: null,
    profileName: null,
    request,
  },
});

describe('discordMentionsOf', () => {
  it('mentions everybody who asked, once each, when it is ready', () => {
    expect(discordMentionsOf(available(aRequest))).toEqual([
      '100000000000000001',
      '100000000000000002',
    ]);
  });

  it('mentions everybody who asked when it is refused', () => {
    expect(
      discordMentionsOf({
        ...anEnvelope,
        event: 'requests.refused',
        data: { title: 'A Series', reason: null, request: aRequest },
      }),
    ).toEqual(['100000000000000001', '100000000000000002']);
  });

  it('mentions nobody when it is asked for, approved, or on its way', () => {
    expect(
      discordMentionsOf({
        ...anEnvelope,
        event: 'requests.made',
        data: {
          title: 'A Series',
          kind: 'series',
          requestedBy: 'Sam',
          accountId: null,
          profileId: null,
          profileName: null,
          request: aRequest,
        },
      }),
    ).toEqual([]);
    expect(
      discordMentionsOf({
        ...anEnvelope,
        event: 'requests.approved',
        data: { title: 'A Series', approvedBy: null, request: aRequest },
      }),
    ).toEqual([]);
    expect(
      discordMentionsOf({
        ...anEnvelope,
        event: 'requests.filed',
        data: { title: 'A Series', folder: '/media/A Series', request: aRequest },
      }),
    ).toEqual([]);
  });

  it('still mentions whoever asked first in a payload from before askers carried theirs', () => {
    expect(
      discordMentionsOf(
        available({ ...aRequest, askers: [{ accountId: 'account-1', profileId: null }] }),
      ),
    ).toEqual(['100000000000000001']);
  });

  it('mentions nobody where there is no request or nobody has a Discord ID', () => {
    expect(discordMentionsOf(available(null))).toEqual([]);
    expect(
      discordMentionsOf(
        available({
          ...aRequest,
          requestedByDiscordId: null,
          askers: [{ accountId: 'account-3', profileId: null, discordId: null }],
        }),
      ),
    ).toEqual([]);
  });
});
