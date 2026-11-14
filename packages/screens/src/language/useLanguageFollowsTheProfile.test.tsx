import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LanguagesInUse } from '@ValenceContracts/schemas/SpokenLanguage';
import type { SessionUser } from '@ValenceContracts/schemas/Session';
import { aViewerProfile } from '@ValenceClient/testing/aViewerProfile';
import { LANGUAGES_IN_USE_KEY } from '@ValenceClient/language/LANGUAGES_IN_USE_KEY';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import type * as Auth from '@ValenceClient/session/auth';
import { useLanguageFollowsTheProfile } from './useLanguageFollowsTheProfile';

const asked = vi.hoisted(() => ({
  fetchSession: vi.fn<() => Promise<SessionUser | null>>(),
  fetchProfileList: vi.fn(),
  fetchLanguagesInUse: vi.fn<() => Promise<LanguagesInUse>>(),
}));

vi.mock('@ValenceClient/session/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof Auth>()),
  fetchSession: asked.fetchSession,
}));
vi.mock('@ValenceClient/profiles/fetchProfileList', () => ({
  fetchProfileList: asked.fetchProfileList,
}));
vi.mock('@ValenceClient/language/fetchLanguagesInUse', () => ({
  fetchLanguagesInUse: asked.fetchLanguagesInUse,
}));

const USER: SessionUser = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Ada',
  email: 'ada@valence.local',
  emailVerified: true,
  role: 'admin',
  twoFactorEnabled: false,
};

/**
 * Has the server answer that these languages are chosen, as the real fetch keeps them.
 *
 * @param heard - The languages.
 */
const theServerSays = (heard: LanguagesInUse): void => {
  asked.fetchLanguagesInUse.mockImplementation(() => {
    platformInUse().store.write(LANGUAGES_IN_USE_KEY, JSON.stringify(heard));

    return Promise.resolve(heard);
  });
};

/**
 * Follows the profile with a fresh cache.
 *
 * @returns What it would start the app again with.
 */
const follow = () => {
  const startAgain = vi.fn();
  const answers = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  renderHook(
    () => {
      useLanguageFollowsTheProfile(startAgain);
    },
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={answers}>{children}</QueryClientProvider>
      ),
    },
  );

  return startAgain;
};

beforeEach(() => {
  platformInUse().store.forget(LANGUAGES_IN_USE_KEY);
  vi.stubGlobal('navigator', { languages: ['en-GB'] });
});

afterEach(() => {
  platformInUse().store.forget(LANGUAGES_IN_USE_KEY);
  vi.unstubAllGlobals();
});

describe('useLanguageFollowsTheProfile', () => {
  it('starts the app again where the profile watching speaks another language', async () => {
    const profile = aViewerProfile({ language: 'de' });

    asked.fetchSession.mockResolvedValue(USER);
    asked.fetchProfileList.mockResolvedValue({ profiles: [profile], chosenProfileId: profile.id });
    theServerSays({ server: null, profile: 'de' });

    const startAgain = follow();

    await waitFor(() => {
      expect(startAgain).toHaveBeenCalledOnce();
    });
  });

  it('leaves the app alone where the language it started in is still the one to speak', async () => {
    const profile = aViewerProfile();

    asked.fetchSession.mockResolvedValue(USER);
    asked.fetchProfileList.mockResolvedValue({ profiles: [profile], chosenProfileId: profile.id });
    theServerSays({ server: null, profile: null });

    const startAgain = follow();

    await waitFor(() => {
      expect(asked.fetchLanguagesInUse).toHaveBeenCalled();
    });
    expect(startAgain).not.toHaveBeenCalled();
  });

  it('asks nothing about profiles while nobody is signed in', async () => {
    asked.fetchSession.mockResolvedValue(null);
    asked.fetchProfileList.mockClear();
    theServerSays({ server: null, profile: null });

    follow();

    await waitFor(() => {
      expect(asked.fetchLanguagesInUse).toHaveBeenCalled();
    });
    expect(asked.fetchProfileList).not.toHaveBeenCalled();
  });
});
