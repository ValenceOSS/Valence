import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { ArrAppDialog } from './ArrAppDialog';
import type { ArrApp } from '@ValenceContracts/schemas/ArrApp';
import type * as Apps from '@ValenceClient/requests/fetchArrApps';

const addArrApp = vi.fn<typeof Apps.addArrApp>();
const changeArrApp = vi.fn<typeof Apps.changeArrApp>();
const tryArrApp = vi.fn<typeof Apps.tryArrApp>();

vi.mock('@ValenceClient/requests/fetchArrApps', () => ({
  addArrApp: (...given: Parameters<typeof Apps.addArrApp>) => addArrApp(...given),
  changeArrApp: (...given: Parameters<typeof Apps.changeArrApp>) => changeArrApp(...given),
  tryArrApp: (...given: Parameters<typeof Apps.tryArrApp>) => tryArrApp(...given),
}));

const KEPT: ArrApp = {
  id: '3f0e8a52-7b1c-4d2e-9f3a-5b6c7d8e9f01',
  name: 'Films',
  kind: 'radarr',
  url: 'http://radarr:7878',
  hasApiKey: true,
  remotePath: '/movies',
  localPath: '/media/Films',
  isEnabled: true,
  isWorking: true,
  version: '5.14',
  lastCheckedAt: null,
  lastProblem: null,
  lastProblemCode: null,
  createdAt: '2026-09-30T00:00:00.000Z',
  updatedAt: '2026-09-30T00:00:00.000Z',
};

beforeEach(() => {
  addArrApp.mockReset().mockResolvedValue({ value: KEPT, refusal: null });
  changeArrApp.mockReset().mockResolvedValue({ value: KEPT, refusal: null });
  tryArrApp.mockReset().mockResolvedValue({
    value: { isWorking: true, problem: null, problemCode: null, version: '5.14' },
    refusal: null,
  });
});

/**
 * Opens the dialog on an app, or on a new one.
 */
const open = (app: ArrApp | null = null) => {
  const handlers = { onClose: vi.fn(), onSaved: vi.fn() };

  renderInAnAddress(<ArrAppDialog isOpen app={app} {...handlers} />);

  return handlers;
};

describe('ArrAppDialog', () => {
  it('connects a Sonarr, named and addressed for what it is, with its key', async () => {
    const user = userEvent.setup();
    const { onSaved, onClose } = open();

    await user.click(screen.getByRole('button', { name: 'Sonarr' }));
    await user.type(screen.getByLabelText(/API key/), 'sonarr-key');
    await user.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith(KEPT);
    });
    expect(addArrApp).toHaveBeenCalledWith({
      kind: 'sonarr',
      name: 'Sonarr',
      url: 'http://sonarr:8989',
      apiKey: 'sonarr-key',
      remotePath: '',
      localPath: '',
      isEnabled: true,
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('asks a Prowlarr nothing of where its library is', async () => {
    const user = userEvent.setup();

    open();

    expect(screen.getByText('Library path')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Prowlarr' }));

    expect(screen.queryByText('Library path')).not.toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Sync its indexers' })).toBeChecked();
  });

  it('says what is missing before connecting', async () => {
    const user = userEvent.setup();

    open();

    await user.click(screen.getByRole('button', { name: 'Connect' }));

    expect(await screen.findByText(/Enter the app’s API key/)).toBeInTheDocument();
    expect(addArrApp).not.toHaveBeenCalled();
  });

  it('changes an app, keeping its key, and tries it with the key it has', async () => {
    const user = userEvent.setup();
    const { onSaved } = open(KEPT);

    await user.click(screen.getByRole('button', { name: /^Test/ }));

    await waitFor(() => {
      expect(tryArrApp).toHaveBeenCalledWith(expect.objectContaining({ apiKey: '' }), KEPT.id);
    });
    expect(await screen.findByText('Connected. The client is running 5.14.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
    });
    expect(changeArrApp).toHaveBeenCalledWith(
      KEPT.id,
      expect.objectContaining({ name: 'Films', remotePath: '/movies', apiKey: '' }),
    );
  });

  it('says nothing of a try still answering once another app is opened', async () => {
    const user = userEvent.setup();
    let answer: (given: Awaited<ReturnType<typeof Apps.tryArrApp>>) => void = () => undefined;

    tryArrApp.mockReturnValue(
      new Promise((answered) => {
        answer = answered;
      }),
    );

    const handlers = { onClose: vi.fn(), onSaved: vi.fn() };
    const { rerender } = renderInAnAddress(<ArrAppDialog isOpen app={KEPT} {...handlers} />);

    await user.click(screen.getByRole('button', { name: /^Test/ }));
    rerender(
      <ArrAppDialog
        isOpen
        app={{ ...KEPT, id: '4a1f9b63-8c2d-4e3f-a04b-6c7d8e9f0a12', name: 'Programmes' }}
        {...handlers}
      />,
    );
    answer({
      value: { isWorking: true, problem: null, problemCode: null, version: '5.14' },
      refusal: null,
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Test/ })).toBeEnabled();
    });
    expect(screen.queryByText('Connected. The client is running 5.14.')).toBeNull();
  });

  it('says why a try or a save did not go through', async () => {
    const user = userEvent.setup();

    tryArrApp.mockResolvedValue({
      value: {
        isWorking: false,
        problem: sayVerbatim('Films rejected its API key'),
        problemCode: 'ArrAppKeyRefused',
        version: null,
      },
      refusal: null,
    });
    changeArrApp.mockResolvedValue({ value: null, refusal: { message: 'Not now.' } });
    open(KEPT);

    await user.click(screen.getByRole('button', { name: /^Test/ }));

    expect(await screen.findByText('Films rejected its API key')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Not now.')).toBeInTheDocument();
  });
});
