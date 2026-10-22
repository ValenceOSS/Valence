import { describe, expect, it } from 'vitest';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import { chooseDeviceNotices } from '@ValenceClient/notifications/deviceNotices';
import { draftOfProfile } from './draftOfProfile';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';

const PROFILE: ViewerProfile = {
  id: '00000000-0000-4000-8000-000000000002',
  name: 'Marques',
  colour: '#3a8ee8',
  avatar: { kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED },
  askStillWatchingAfter: 4,
  showsWhatIamWatching: true,
  discordPresence: DEFAULT_DISCORD_PRESENCE,
  prefersBestCopy: false,
  isOwner: true,
  hasPin: false,
  mayRequest: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('draftOfProfile', () => {
  it('reads every editable part of a profile, with no photo waiting to be sent', () => {
    expect(draftOfProfile(PROFILE)).toEqual({
      name: 'Marques',
      colour: '#3a8ee8',
      avatar: { kind: 'initial', font: PLUS_JAKARTA_SANS_AS_STORED },
      askStillWatchingAfter: 4,
      showsWhatIamWatching: true,
      discordPresence: DEFAULT_DISCORD_PRESENCE,
      prefersBestCopy: false,
      theme: 'system',
      motion: 'system',
      pluginTheme: null,
      playsInTheBrowser: false,
      connections: 3,
      streamingFormat: 'hls',
      showsDesktopNotices: false,
      deviceWas: {
        theme: 'system',
        motion: 'system',
        pluginTheme: null,
        playsInTheBrowser: false,
        connections: 3,
        streamingFormat: 'hls',
        showsDesktopNotices: false,
      },
      photo: null,
    });
  });

  it('reads whether this computer shows notices from the computer, not the profile', () => {
    chooseDeviceNotices(true);

    expect(draftOfProfile(PROFILE).showsDesktopNotices).toBe(true);
  });
});
