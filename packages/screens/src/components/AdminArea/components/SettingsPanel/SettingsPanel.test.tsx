import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsPanel } from './SettingsPanel';
import type { AdminOverview } from '@ValenceClient/admin/fetchAdmin';

const saveCatalogueKey = vi.hoisted(() => vi.fn());
const saveHardwareAccel = vi.hoisted(() => vi.fn(() => Promise.resolve(true)));
const savePreviewQuality = vi.hoisted(() =>
  vi.fn<(quality: string) => Promise<boolean>>(() => Promise.resolve(true)),
);
const saveShowsProfilesBeforeSignIn = vi.hoisted(() =>
  vi.fn<(shows: boolean) => Promise<boolean>>(() => Promise.resolve(true)),
);

const saveCertificationRegion = vi.hoisted(() =>
  vi.fn<(region: string) => Promise<boolean>>(() => Promise.resolve(true)),
);

const saveFetchesCatalogueTrailers = vi.hoisted(() =>
  vi.fn<(fetches: boolean) => Promise<boolean>>(() => Promise.resolve(true)),
);

const saveFetchesMusicDetails = vi.hoisted(() =>
  vi.fn<(fetches: boolean) => Promise<boolean>>(() => Promise.resolve(true)),
);

const saveAudioDbKey = vi.hoisted(() =>
  vi.fn<(key: string) => Promise<boolean>>(() => Promise.resolve(true)),
);

const saveSplashscreen = vi.hoisted(() =>
  vi.fn<(file: File) => Promise<{ splashscreen: string } | { problem: string }>>(),
);

const removeSplashscreen = vi.hoisted(() => vi.fn<() => Promise<boolean>>());

vi.mock('@ValenceClient/admin/fetchAdmin', () => ({
  saveCatalogueKey,
  saveHardwareAccel,
  savePreviewQuality,
  saveShowsProfilesBeforeSignIn,
  saveCertificationRegion,
  saveFetchesCatalogueTrailers,
  saveFetchesMusicDetails,
  saveAudioDbKey,
  saveSplashscreen,
  removeSplashscreen,
}));

const overview = (overrides: Partial<AdminOverview['settings']> = {}): AdminOverview => ({
  users: [{ id: 'usr_1', name: 'Dan', email: 'dan@valence.local', role: 'admin', createdAt: '' }],
  settings: {
    hasCatalogueKey: false,
    hasAudioDbKey: false,
    cookieSecure: false,
    trustedOrigins: ['http://localhost:8420'],
    hardwareAccel: '',
    previewQuality: 'high' as const,
    showsProfilesBeforeSignIn: false,
    fetchesCatalogueTrailers: false,
    fetchesMusicDetails: false,
    certificationRegion: 'GB',
    splashscreen: null,
    ...overrides,
  },
  transcoder: {
    isReachable: true,
    address: 'unix:/tmp/valence-transcoder.sock',
    ffmpegVersion: null,
    ffmpegSupported: true,
    hardwareAccels: [],
    concurrentRenders: 0,
    toneMapping: 'unavailable' as const,
    hardwareToneMaps: [],
    chains: [],
  },
  library: { itemCount: 0, libraryCount: 0, bytes: 0 },
  artwork: null,
  bookPages: null,
  jobs: { stalled: [] },
});

describe('SettingsPanel', () => {
  beforeEach(() => {
    saveCatalogueKey.mockReset();
    saveCatalogueKey.mockResolvedValue(true);
  });

  it('says what happens without a key', () => {
    render(
      <SettingsPanel
        overview={overview()}
        onCatalogueKeySaved={vi.fn()}
        onHardwareAccelSaved={vi.fn()}
        onPreviewQualitySaved={vi.fn()}
        onCertificationRegionSaved={vi.fn()}
        onProfileVisibilitySaved={vi.fn()}
        onCatalogueTrailersSaved={vi.fn()}
        onSplashscreenSaved={vi.fn()}
      />,
    );

    expect(screen.getByText(/come from filenames alone/)).toBeInTheDocument();
  });

  it('says a key is set without showing it', () => {
    render(
      <SettingsPanel
        overview={overview({ hasCatalogueKey: true })}
        onCatalogueKeySaved={vi.fn()}
        onHardwareAccelSaved={vi.fn()}
        onPreviewQualitySaved={vi.fn()}
        onCertificationRegionSaved={vi.fn()}
        onProfileVisibilitySaved={vi.fn()}
        onCatalogueTrailersSaved={vi.fn()}
        onSplashscreenSaved={vi.fn()}
      />,
    );

    expect(screen.getByText(/A key is set/)).toBeInTheDocument();
    expect(screen.getByLabelText('Catalogue key')).toHaveValue('');
  });

  it('will not save nothing', () => {
    render(
      <SettingsPanel
        overview={overview()}
        onCatalogueKeySaved={vi.fn()}
        onHardwareAccelSaved={vi.fn()}
        onPreviewQualitySaved={vi.fn()}
        onCertificationRegionSaved={vi.fn()}
        onProfileVisibilitySaved={vi.fn()}
        onCatalogueTrailersSaved={vi.fn()}
        onSplashscreenSaved={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('saves what was typed', async () => {
    const user = userEvent.setup();
    render(
      <SettingsPanel
        overview={overview()}
        onCatalogueKeySaved={vi.fn()}
        onHardwareAccelSaved={vi.fn()}
        onPreviewQualitySaved={vi.fn()}
        onCertificationRegionSaved={vi.fn()}
        onProfileVisibilitySaved={vi.fn()}
        onCatalogueTrailersSaved={vi.fn()}
        onSplashscreenSaved={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('Catalogue key'), 'a-key');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(saveCatalogueKey).toHaveBeenCalledWith('a-key');
  });

  it('empties the field once accepted, since there is nowhere to read one back from', async () => {
    const user = userEvent.setup();
    render(
      <SettingsPanel
        overview={overview()}
        onCatalogueKeySaved={vi.fn()}
        onHardwareAccelSaved={vi.fn()}
        onPreviewQualitySaved={vi.fn()}
        onCertificationRegionSaved={vi.fn()}
        onProfileVisibilitySaved={vi.fn()}
        onCatalogueTrailersSaved={vi.fn()}
        onSplashscreenSaved={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('Catalogue key'), 'a-key');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Catalogue key')).toHaveValue('');
    });
  });

  it('asks for the overview again, having changed something it does not own', async () => {
    const onCatalogueKeySaved = vi.fn();
    const user = userEvent.setup();
    render(
      <SettingsPanel
        overview={overview()}
        onCatalogueKeySaved={onCatalogueKeySaved}
        onHardwareAccelSaved={vi.fn()}
        onPreviewQualitySaved={vi.fn()}
        onCertificationRegionSaved={vi.fn()}
        onProfileVisibilitySaved={vi.fn()}
        onCatalogueTrailersSaved={vi.fn()}
        onSplashscreenSaved={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('Catalogue key'), 'a-key');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onCatalogueKeySaved).toHaveBeenCalled();
    });
  });

  it('keeps what was typed when the server refused it', async () => {
    saveCatalogueKey.mockResolvedValue(false);

    const onCatalogueKeySaved = vi.fn();
    const user = userEvent.setup();
    render(
      <SettingsPanel
        overview={overview()}
        onCatalogueKeySaved={onCatalogueKeySaved}
        onHardwareAccelSaved={vi.fn()}
        onPreviewQualitySaved={vi.fn()}
        onCertificationRegionSaved={vi.fn()}
        onProfileVisibilitySaved={vi.fn()}
        onCatalogueTrailersSaved={vi.fn()}
        onSplashscreenSaved={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('Catalogue key'), 'a-key');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Catalogue key')).toHaveValue('a-key');
    });

    expect(onCatalogueKeySaved).not.toHaveBeenCalled();
  });

  it('says nothing about the server before it has answered', () => {
    render(
      <SettingsPanel
        overview={null}
        onCatalogueKeySaved={vi.fn()}
        onHardwareAccelSaved={vi.fn()}
        onPreviewQualitySaved={vi.fn()}
        onCertificationRegionSaved={vi.fn()}
        onProfileVisibilitySaved={vi.fn()}
        onCatalogueTrailersSaved={vi.fn()}
        onSplashscreenSaved={vi.fn()}
      />,
    );

    expect(screen.queryByText(/Cookies are/)).not.toBeInTheDocument();
  });

  it('reports how sign-in is configured', () => {
    render(
      <SettingsPanel
        overview={overview({ cookieSecure: true })}
        onCatalogueKeySaved={vi.fn()}
        onHardwareAccelSaved={vi.fn()}
        onPreviewQualitySaved={vi.fn()}
        onCertificationRegionSaved={vi.fn()}
        onProfileVisibilitySaved={vi.fn()}
        onCatalogueTrailersSaved={vi.fn()}
        onSplashscreenSaved={vi.fn()}
      />,
    );

    expect(screen.getByText('secure')).toBeInTheDocument();
    expect(screen.getByText(/localhost:8420/)).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SettingsPanel.displayName).toBe('SettingsPanel');
  });

  it('tells whoever owns the overview that the backend changed', async () => {
    const saved = vi.fn();
    const actor = userEvent.setup();

    render(
      <SettingsPanel
        overview={overview()}
        onCatalogueKeySaved={vi.fn()}
        onHardwareAccelSaved={saved}
        onPreviewQualitySaved={vi.fn()}
        onCertificationRegionSaved={vi.fn()}
        onProfileVisibilitySaved={vi.fn()}
        onCatalogueTrailersSaved={vi.fn()}
        onSplashscreenSaved={vi.fn()}
      />,
    );

    await actor.click(screen.getByRole('button', { name: /Hardware acceleration/ }));
    await actor.click(await screen.findByRole('menuitemradio', { name: /Software only/ }));

    await waitFor(() => {
      expect(saved).toHaveBeenCalled();
    });
  });

  it('offers the preview presets as one choice', () => {
    render(
      <SettingsPanel
        overview={overview({ previewQuality: 'standard' })}
        onCatalogueKeySaved={vi.fn()}
        onHardwareAccelSaved={vi.fn()}
        onPreviewQualitySaved={vi.fn()}
        onCertificationRegionSaved={vi.fn()}
        onProfileVisibilitySaved={vi.fn()}
        onCatalogueTrailersSaved={vi.fn()}
        onSplashscreenSaved={vi.fn()}
      />,
    );

    const presets = screen.getByRole('group', { name: 'Preview quality' });

    expect(presets).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Low' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'High' })).toBeInTheDocument();
  });

  it('saves the preview preset chosen and tells whoever owns the overview', async () => {
    const saved = vi.fn();
    const actor = userEvent.setup();

    render(
      <SettingsPanel
        overview={overview()}
        onCatalogueKeySaved={vi.fn()}
        onHardwareAccelSaved={vi.fn()}
        onPreviewQualitySaved={saved}
        onProfileVisibilitySaved={vi.fn()}
        onCatalogueTrailersSaved={vi.fn()}
        onSplashscreenSaved={vi.fn()}
        onCertificationRegionSaved={vi.fn()}
      />,
    );

    await actor.click(screen.getByRole('button', { name: 'Low' }));

    expect(savePreviewQuality).toHaveBeenCalledWith('low');

    await waitFor(() => {
      expect(saved).toHaveBeenCalled();
    });
  });

  it('says nothing changed when the server would not take the preset', async () => {
    savePreviewQuality.mockResolvedValueOnce(false);

    const saved = vi.fn();
    const actor = userEvent.setup();

    render(
      <SettingsPanel
        overview={overview()}
        onCatalogueKeySaved={vi.fn()}
        onHardwareAccelSaved={vi.fn()}
        onPreviewQualitySaved={saved}
        onProfileVisibilitySaved={vi.fn()}
        onCatalogueTrailersSaved={vi.fn()}
        onSplashscreenSaved={vi.fn()}
        onCertificationRegionSaved={vi.fn()}
      />,
    );

    await actor.click(screen.getByRole('button', { name: 'Standard' }));

    await waitFor(() => {
      expect(savePreviewQuality).toHaveBeenCalledWith('standard');
    });

    expect(saved).not.toHaveBeenCalled();
  });
});

describe('whose age certificates to read', () => {
  it('says which country it is reading them in', () => {
    render(
      <SettingsPanel
        overview={overview({ certificationRegion: 'GB' })}
        onCatalogueKeySaved={vi.fn()}
        onHardwareAccelSaved={vi.fn()}
        onPreviewQualitySaved={vi.fn()}
        onCertificationRegionSaved={vi.fn()}
        onProfileVisibilitySaved={vi.fn()}
        onCatalogueTrailersSaved={vi.fn()}
        onSplashscreenSaved={vi.fn()}
      />,
    );

    expect(screen.getByText('United Kingdom')).toBeInTheDocument();
  });

  it('explains that a 15 and an R are not the same thing', () => {
    render(
      <SettingsPanel
        overview={overview()}
        onCatalogueKeySaved={vi.fn()}
        onHardwareAccelSaved={vi.fn()}
        onPreviewQualitySaved={vi.fn()}
        onCertificationRegionSaved={vi.fn()}
        onProfileVisibilitySaved={vi.fn()}
        onCatalogueTrailersSaved={vi.fn()}
        onSplashscreenSaved={vi.fn()}
      />,
    );

    expect(screen.getByText(/A 15 and an R are not the same thing/i)).toBeInTheDocument();
  });

  it('promises it will not rescan, which is the whole reason every country is kept', () => {
    render(
      <SettingsPanel
        overview={overview()}
        onCatalogueKeySaved={vi.fn()}
        onHardwareAccelSaved={vi.fn()}
        onPreviewQualitySaved={vi.fn()}
        onCertificationRegionSaved={vi.fn()}
        onProfileVisibilitySaved={vi.fn()}
        onCatalogueTrailersSaved={vi.fn()}
        onSplashscreenSaved={vi.fn()}
      />,
    );

    expect(screen.getByText(/reads them again rather than rescanning/i)).toBeInTheDocument();
  });

  it('writes the country chosen, and tells whoever is listening', async () => {
    const saved = vi.fn();
    const actor = userEvent.setup();

    render(
      <SettingsPanel
        overview={overview({ certificationRegion: 'GB' })}
        onCatalogueKeySaved={vi.fn()}
        onHardwareAccelSaved={vi.fn()}
        onPreviewQualitySaved={vi.fn()}
        onCertificationRegionSaved={saved}
        onProfileVisibilitySaved={vi.fn()}
        onCatalogueTrailersSaved={vi.fn()}
        onSplashscreenSaved={vi.fn()}
      />,
    );

    await actor.click(screen.getByRole('button', { name: /Age certificates/ }));
    await actor.click(await screen.findByRole('menuitemradio', { name: /Germany/ }));

    await waitFor(() => {
      expect(saveCertificationRegion).toHaveBeenCalledWith('DE');
    });
    await waitFor(() => {
      expect(saved).toHaveBeenCalled();
    });
  });

  it('leaves catalogue trailers off until an administrator turns them on', () => {
    render(
      <SettingsPanel
        overview={overview()}
        onCatalogueKeySaved={vi.fn()}
        onHardwareAccelSaved={vi.fn()}
        onPreviewQualitySaved={vi.fn()}
        onCertificationRegionSaved={vi.fn()}
        onProfileVisibilitySaved={vi.fn()}
        onCatalogueTrailersSaved={vi.fn()}
        onSplashscreenSaved={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('switch', { name: 'Fetch trailers from the catalogue' }),
    ).not.toBeChecked();
  });

  it('turns catalogue trailers on, and says so', async () => {
    const onCatalogueTrailersSaved = vi.fn();

    saveFetchesCatalogueTrailers.mockResolvedValue(true);

    render(
      <SettingsPanel
        overview={overview()}
        onCatalogueKeySaved={vi.fn()}
        onHardwareAccelSaved={vi.fn()}
        onPreviewQualitySaved={vi.fn()}
        onCertificationRegionSaved={vi.fn()}
        onProfileVisibilitySaved={vi.fn()}
        onCatalogueTrailersSaved={onCatalogueTrailersSaved}
        onSplashscreenSaved={vi.fn()}
      />,
    );

    await userEvent.click(
      screen.getByRole('switch', { name: 'Fetch trailers from the catalogue' }),
    );

    expect(saveFetchesCatalogueTrailers).toHaveBeenCalledWith(true);
    expect(onCatalogueTrailersSaved).toHaveBeenCalled();
  });

  it('puts the switch back where a server would not take the change', async () => {
    saveFetchesCatalogueTrailers.mockResolvedValue(false);

    render(
      <SettingsPanel
        overview={overview()}
        onCatalogueKeySaved={vi.fn()}
        onHardwareAccelSaved={vi.fn()}
        onPreviewQualitySaved={vi.fn()}
        onCertificationRegionSaved={vi.fn()}
        onProfileVisibilitySaved={vi.fn()}
        onCatalogueTrailersSaved={vi.fn()}
        onSplashscreenSaved={vi.fn()}
      />,
    );

    const switched = screen.getByRole('switch', { name: 'Fetch trailers from the catalogue' });

    await userEvent.click(switched);

    await waitFor(() => {
      expect(switched).not.toBeChecked();
    });
  });

  describe('the picture behind the way in', () => {
    const renderWith = (splashscreen: string | null, onSplashscreenSaved: () => void = vi.fn()) =>
      render(
        <SettingsPanel
          overview={overview({ splashscreen })}
          onCatalogueKeySaved={vi.fn()}
          onHardwareAccelSaved={vi.fn()}
          onPreviewQualitySaved={vi.fn()}
          onCertificationRegionSaved={vi.fn()}
          onProfileVisibilitySaved={vi.fn()}
          onCatalogueTrailersSaved={vi.fn()}
          onSplashscreenSaved={onSplashscreenSaved}
        />,
      );

    beforeEach(() => {
      saveSplashscreen.mockReset();
      removeSplashscreen.mockReset();
    });

    it('says it only shows where the faces are shown', () => {
      renderWith(null);

      expect(screen.getByText(/shows while Show who lives here is on/)).toBeInTheDocument();
    });

    it('offers nothing to remove before a picture is chosen', () => {
      renderWith(null);

      expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
      expect(screen.queryByAltText('The picture behind the way in')).not.toBeInTheDocument();
    });

    it('shows the picture chosen', () => {
      renderWith('/api/splashscreen?v=a.jpg');

      expect(screen.getByAltText('The picture behind the way in')).toHaveAttribute(
        'src',
        '/api/splashscreen?v=a.jpg',
      );
    });

    it('sends the picture picked, shows it, and tells whoever owns the overview', async () => {
      const onSplashscreenSaved = vi.fn();
      const picture = new File(['picture'], 'hall.jpg', { type: 'image/jpeg' });

      saveSplashscreen.mockResolvedValue({ splashscreen: '/api/splashscreen?v=b.jpg' });

      renderWith(null, onSplashscreenSaved);

      await userEvent.upload(screen.getByLabelText(/Choose a picture/), picture);

      expect(saveSplashscreen).toHaveBeenCalledWith(picture);
      expect(await screen.findByAltText('The picture behind the way in')).toHaveAttribute(
        'src',
        '/api/splashscreen?v=b.jpg',
      );
      expect(onSplashscreenSaved).toHaveBeenCalled();
    });

    it('says why the server would not take a picture', async () => {
      const onSplashscreenSaved = vi.fn();

      saveSplashscreen.mockResolvedValue({ problem: 'A picture has to be 16 MB or smaller.' });

      renderWith(null, onSplashscreenSaved);

      await userEvent.upload(
        screen.getByLabelText(/Choose a picture/),
        new File(['picture'], 'hall.jpg', { type: 'image/jpeg' }),
      );

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'A picture has to be 16 MB or smaller.',
      );
      expect(onSplashscreenSaved).not.toHaveBeenCalled();
    });

    it('goes back to the generated background when the picture is removed', async () => {
      const onSplashscreenSaved = vi.fn();

      removeSplashscreen.mockResolvedValue(true);

      renderWith('/api/splashscreen?v=a.jpg', onSplashscreenSaved);

      await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

      await waitFor(() => {
        expect(screen.queryByAltText('The picture behind the way in')).not.toBeInTheDocument();
      });
      expect(onSplashscreenSaved).toHaveBeenCalled();
    });

    it('keeps the picture and says so where it could not be removed', async () => {
      removeSplashscreen.mockResolvedValue(false);

      renderWith('/api/splashscreen?v=a.jpg');

      await userEvent.click(screen.getByRole('button', { name: 'Remove' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('could not be removed');
      expect(screen.getByAltText('The picture behind the way in')).toBeInTheDocument();
    });
  });

  it('looks for music details on the web only once it is turned on', async () => {
    const onMusicDetailsSaved = vi.fn();

    render(
      <SettingsPanel
        overview={overview()}
        onCatalogueKeySaved={vi.fn()}
        onHardwareAccelSaved={vi.fn()}
        onPreviewQualitySaved={vi.fn()}
        onCertificationRegionSaved={vi.fn()}
        onProfileVisibilitySaved={vi.fn()}
        onCatalogueTrailersSaved={vi.fn()}
        onMusicDetailsSaved={onMusicDetailsSaved}
        onSplashscreenSaved={vi.fn()}
      />,
    );

    const toggle = screen.getByRole('switch', { name: 'Fetch music details from the web' });

    expect(toggle).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(toggle);

    expect(saveFetchesMusicDetails).toHaveBeenCalledWith(true);
    await waitFor(() => {
      expect(onMusicDetailsSaved).toHaveBeenCalled();
    });
  });

  it('saves a TheAudioDB key, and says the free one is used without one', async () => {
    render(
      <SettingsPanel
        overview={overview()}
        onCatalogueKeySaved={vi.fn()}
        onHardwareAccelSaved={vi.fn()}
        onPreviewQualitySaved={vi.fn()}
        onCertificationRegionSaved={vi.fn()}
        onProfileVisibilitySaved={vi.fn()}
        onCatalogueTrailersSaved={vi.fn()}
        onSplashscreenSaved={vi.fn()}
      />,
    );

    expect(screen.getByText(/looked up with the free key/)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('TheAudioDB key'), 'my-key');
    await userEvent.click(screen.getByRole('button', { name: 'Save the TheAudioDB key' }));

    expect(saveAudioDbKey).toHaveBeenCalledWith('my-key');
  });
});
