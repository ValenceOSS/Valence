import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { SubtitlesCard } from './SubtitlesCard';
import type { SubtitleSetup } from '@ValenceContracts/schemas/SubtitleFinding';

const fetchSubtitleSetup = vi.hoisted(() => vi.fn());
const saveSubtitleSetup = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/admin/fetchSubtitleSetup', () => ({ fetchSubtitleSetup }));
vi.mock('@ValenceClient/admin/saveSubtitleSetup', () => ({ saveSubtitleSetup }));

const SETUP: SubtitleSetup = {
  hasOpenSubtitlesKey: false,
  openSubtitlesUsername: '',
  hasOpenSubtitlesPassword: false,
  hasSubdlKey: false,
  languages: ['en'],
  isAutomatic: false,
  filmMinimumScore: 60,
  episodeMinimumScore: 50,
  writesSubtitles: false,
  whisperModel: 'base',
  whisperLanguage: null,
  translatesToEnglish: false,
  canWriteSubtitles: true,
};

const draw = () =>
  render(
    <CacheScope>
      <SubtitlesCard />
    </CacheScope>,
  );

beforeEach(() => {
  fetchSubtitleSetup.mockReset().mockResolvedValue(SETUP);
  saveSubtitleSetup
    .mockReset()
    .mockImplementation((change: object) => Promise.resolve({ ...SETUP, ...change }));
});

describe('SubtitlesCard', () => {
  it('says Whisper is not here, and will not turn it on, where the media service has none', async () => {
    fetchSubtitleSetup.mockResolvedValue({ ...SETUP, canWriteSubtitles: false });

    draw();

    expect(await screen.findByText(/Whisper isn’t installed/u)).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Write subtitles with Whisper' })).toBeDisabled();
  });

  it('saves writing with Whisper as it is turned on, and then shows how it listens', async () => {
    draw();

    await userEvent.click(
      await screen.findByRole('switch', { name: 'Write subtitles with Whisper' }),
    );

    expect(screen.getByRole('button', { name: /Language spoken/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();

    await waitFor(() => {
      expect(saveSubtitleSetup).toHaveBeenCalledWith(
        expect.objectContaining({ writesSubtitles: true, whisperModel: 'base' }),
      );
    });
  });
});
