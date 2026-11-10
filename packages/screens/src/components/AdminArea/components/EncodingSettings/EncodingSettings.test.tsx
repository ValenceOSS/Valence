import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { anAdminOverview } from '@ValenceScreens/testing/anAdminOverview';
import { renderWithAnswers } from '@ValenceScreens/testing/renderWithAnswers';
import { EncodingSettings } from './EncodingSettings';

const saved = vi.hoisted(() => ({
  saveHardwareAccel: vi.fn(() => Promise.resolve(true)),
  saveUsesShortSegments: vi.fn(() => Promise.resolve(true)),
  savePlaysEpisodesGapless: vi.fn(() => Promise.resolve(true)),
  saveUsesKeyframeThumbnails: vi.fn(() => Promise.resolve(true)),
  savePreviewQuality: vi.fn(() => Promise.resolve(true)),
  saveKeepsDownloadsForDays: vi.fn(() => Promise.resolve(true)),
  saveSpreadAcrossDevices: vi.fn(() => Promise.resolve(true)),
}));
const tested = vi.hoisted(() => ({ testHardware: vi.fn(() => Promise.resolve(null)) }));

vi.mock('@ValenceClient/admin/fetchAdmin', async (original) => ({
  ...(await original<object>()),
  ...saved,
}));
vi.mock('@ValenceClient/admin/testHardware', () => tested);

describe('EncodingSettings', () => {
  it('saves a streaming setting as it is switched', async () => {
    const user = userEvent.setup();

    renderWithAnswers(<EncodingSettings overview={anAdminOverview()} devices={null} />);

    await user.click(screen.getByRole('switch', { name: 'Short segments' }));

    expect(saved.saveUsesShortSegments).toHaveBeenCalledWith(false);
  });

  it('turns fast thumbnails on, which are off until chosen', async () => {
    const user = userEvent.setup();
    const overview = anAdminOverview();

    renderWithAnswers(
      <EncodingSettings
        overview={{
          ...overview,
          transcoder: { ...overview.transcoder, hardwareAccels: ['vaapi'] },
        }}
        devices={null}
      />,
    );

    const fastThumbnails = screen.getByRole('switch', { name: 'Fast thumbnails' });

    expect(fastThumbnails).not.toBeChecked();

    await user.click(fastThumbnails);

    expect(saved.saveUsesKeyframeThumbnails).toHaveBeenCalledWith(true);
  });

  it('offers fast thumbnails only where a GPU would otherwise draw them', () => {
    const overview = anAdminOverview({ hardwareAccel: 'none' });
    const withGraphics = { ...overview.transcoder, hardwareAccels: ['vaapi'] };

    const { unmount } = renderWithAnswers(
      <EncodingSettings overview={anAdminOverview()} devices={null} />,
    );

    expect(screen.queryByRole('switch', { name: 'Fast thumbnails' })).not.toBeInTheDocument();
    unmount();

    renderWithAnswers(
      <EncodingSettings overview={{ ...overview, transcoder: withGraphics }} devices={null} />,
    );

    expect(screen.queryByRole('switch', { name: 'Fast thumbnails' })).not.toBeInTheDocument();
  });

  it('tests the backend chosen, and says so where the test could not run', async () => {
    const user = userEvent.setup();

    renderWithAnswers(
      <EncodingSettings overview={anAdminOverview({ hardwareAccel: 'vaapi' })} devices={null} />,
    );

    await user.click(screen.getByRole('button', { name: 'Test' }));

    expect(tested.testHardware).toHaveBeenCalledWith('vaapi');
    expect(
      await screen.findByText(
        'The test couldn’t be run. Check that the media service is reachable.',
      ),
    ).toBeInTheDocument();
  });
});
